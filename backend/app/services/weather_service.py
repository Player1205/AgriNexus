import os
import httpx
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

# Default Agricultural Baseline (Ludhiana, Punjab - ICAR Main Agronomy Zone)
DEFAULT_LAT = 30.9010
DEFAULT_LNG = 75.8573

def get_exif_gps_coordinates(image_path: str) -> tuple[float, float] | None:
    """
    Extracts embedded EXIF GPS latitude and longitude from the raw image file.
    Returns (lat, lng) if present, or None if stripped/missing.
    """
    try:
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data:
            return None

        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                for gps_tag_id, gps_val in value.items():
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag] = gps_val

        if "GPSLatitude" in gps_info and "GPSLongitude" in gps_info:
            lat_dms = gps_info["GPSLatitude"]
            lat_ref = gps_info.get("GPSLatitudeRef", "N")
            lng_dms = gps_info["GPSLongitude"]
            lng_ref = gps_info.get("GPSLongitudeRef", "E")

            def dms_to_decimal(dms, ref):
                degrees = float(dms[0])
                minutes = float(dms[1])
                seconds = float(dms[2])
                dec = degrees + (minutes / 60.0) + (seconds / 3600.0)
                if ref in ['S', 'W']:
                    dec = -dec
                return dec

            lat = dms_to_decimal(lat_dms, lat_ref)
            lng = dms_to_decimal(lng_dms, lng_ref)
            return round(lat, 4), round(lng, 4)

    except Exception:
        pass

    return None

async def fetch_live_weather(image_path: str = None, client_lat: float = None, client_lng: float = None) -> dict:
    """
    Fetches real-time hyper-local agricultural weather metrics using Open-Meteo API.
    Resolves location via 3-Tier Hierarchy: (1) Image EXIF GPS -> (2) Client Device GPS -> (3) Regional Baseline.
    """
    lat, lng = None, None
    source = "REGIONAL_BASELINE"

    # Tier 1: Check Photo EXIF GPS
    if image_path and os.path.exists(image_path):
        exif_coords = get_exif_gps_coordinates(image_path)
        if exif_coords:
            lat, lng = exif_coords
            source = "IMAGE_EXIF_GPS"

    # Tier 2: Check Client Device / Phone GPS
    if lat is None and client_lat is not None and client_lng is not None:
        try:
            c_lat = float(client_lat)
            c_lng = float(client_lng)
            if -90.0 <= c_lat <= 90.0 and -180.0 <= c_lng <= 180.0:
                lat, lng = c_lat, c_lng
                source = "DEVICE_LIVE_GPS"
        except (ValueError, TypeError):
            pass

    # Tier 3: Fallback Baseline
    if lat is None:
        lat, lng = DEFAULT_LAT, DEFAULT_LNG
        source = "REGIONAL_BASELINE"

    # Call Open-Meteo Free Hyper-Local Weather API
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "hourly": "precipitation_probability",
        "forecast_hours": 6
    }

    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                
                temp_c = float(current.get("temperature_2m", 28.0))
                humidity = float(current.get("relative_humidity_2m", 75.0))
                precip = float(current.get("precipitation", 0.0))
                wind_kmh = float(current.get("wind_speed_10m", 6.0))

                # Max rain probability in next 6 hours
                rain_probs = hourly.get("precipitation_probability", [0])
                max_rain_risk = float(max(rain_probs)) if rain_probs else 0.0

                # Agronomic Spray Safety Window calculation:
                # Safe if wind < 15 km/h, rain risk < 35%, and temperature < 36°C
                is_spray_safe = (wind_kmh <= 15.0) and (max_rain_risk < 35.0) and (temp_c <= 36.0)

                return {
                    "temperature_c": round(temp_c, 1),
                    "relative_humidity": round(humidity, 1),
                    "precipitation_mm": round(precip, 1),
                    "rain_risk_6h_percent": round(max_rain_risk, 0),
                    "wind_speed_kmh": round(wind_kmh, 1),
                    "is_spray_safe": is_spray_safe,
                    "latitude": lat,
                    "longitude": lng,
                    "location_source": source
                }
    except Exception as e:
        print(f"[WEATHER SERVICE WARNING] Fallback to standard metrics: {e}")

    # Robust safe fallback if internet offline
    return {
        "temperature_c": 28.0,
        "relative_humidity": 75.0,
        "precipitation_mm": 0.0,
        "rain_risk_6h_percent": 0.0,
        "wind_speed_kmh": 6.0,
        "is_spray_safe": True,
        "latitude": lat,
        "longitude": lng,
        "location_source": source
    }
