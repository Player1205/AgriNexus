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

    # Tier 3: Fallback if NO location found
    if lat is None:
        return {
            "temperature_c": 25.0,
            "relative_humidity": 50.0,
            "precipitation_mm": 0.0,
            "rain_risk_6h_percent": 0.0,
            "wind_speed_kmh": 5.0,
            "aqi": 2,
            "aqi_label": "Fair",
            "is_spray_safe": False,  # Block spray when location is unknown
            "is_live_weather": False,
            "location_source": "UNKNOWN_LOCATION_RESTRICTED",
            "latitude": None,
            "longitude": None,
            "warnings": ["GPS location blocked or unavailable. Weather metrics defaulted to static safety limits."]
        }

    # Primary: OpenWeatherMap Weather and Air Pollution APIs (if configured)
    owm_key = os.environ.get("OPENWEATHER_API_KEY", "").strip()
    if owm_key:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lng}&appid={owm_key}&units=metric"
        aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lng}&appid={owm_key}"

        import asyncio

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp, aqi_resp = await asyncio.gather(
                    client.get(url),
                    client.get(aqi_url),
                    return_exceptions=True
                )

                aqi_val = 2
                aqi_label = "Fair"
                pm2_5_val = 25.0

                if not isinstance(aqi_resp, Exception) and aqi_resp.status_code == 200:
                    aqi_data = aqi_resp.json()
                    aqi_list = aqi_data.get("list", [{}])
                    if aqi_list:
                        aqi_val = int(aqi_list[0].get("main", {}).get("aqi", 2))
                        pm2_5_val = float(aqi_list[0].get("components", {}).get("pm2_5", 25.0))
                        label_map = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Severe"}
                        aqi_label = label_map.get(aqi_val, "Fair")

                if not isinstance(resp, Exception) and resp.status_code == 200:
                    data = resp.json()
                    main_data = data.get("main", {})
                    wind_data = data.get("wind", {})
                    weather_arr = data.get("weather", [{}])
                    
                    temp_c = float(main_data.get("temp", 28.0))
                    humidity = float(main_data.get("humidity", 75.0))
                    
                    # OWM gives wind in m/s, convert to km/h
                    wind_ms = float(wind_data.get("speed", 1.67))
                    wind_kmh = wind_ms * 3.6

                    # Estimate rain risk based on current weather condition
                    condition = weather_arr[0].get("main", "").lower()
                    max_rain_risk = 0.0
                    if condition in ["rain", "drizzle", "thunderstorm"]:
                        max_rain_risk = 90.0
                    elif condition == "clouds":
                        max_rain_risk = 20.0

                    # Agronomic Spray Safety Window calculation:
                    # Safe if wind < 15 km/h, rain risk < 35%, temperature < 36°C, and AQI < 5 (not Hazardous)
                    is_spray_safe = (wind_kmh <= 15.0) and (max_rain_risk < 35.0) and (temp_c <= 36.0) and (aqi_val < 5)

                    return {
                        "temperature_c": round(temp_c, 1),
                        "relative_humidity": round(humidity, 1),
                        "precipitation_mm": 0.0,
                        "rain_risk_6h_percent": round(max_rain_risk, 0),
                        "wind_speed_kmh": round(wind_kmh, 1),
                        "aqi": aqi_val,
                        "aqi_label": aqi_label,
                        "pm2_5": round(pm2_5_val, 1),
                        "is_spray_safe": is_spray_safe,
                        "latitude": lat,
                        "longitude": lng,
                        "location_source": source,
                        "is_live_weather": True
                    }
        except Exception as e:
            print(f"[WEATHER SERVICE WARNING] OpenWeatherMap failed: {e}")
    else:
        print("[WEATHER NOTE] OPENWEATHER_API_KEY not configured. Engaging keyless meteorological cascade (Open-Meteo / Met.no)...")

    # Fallback Cascade 1: Open-Meteo (Zero-key, ultra-reliable in CI and production)
    open_meteo_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&hourly=precipitation_probability&forecast_hours=6"
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(open_meteo_url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                hourly = data.get("hourly", {})
                temp_c = float(current.get("temperature_2m", 28.0))
                humidity = float(current.get("relative_humidity_2m", 75.0))
                wind_kmh = float(current.get("wind_speed_10m", 6.0))
                rain_probs = hourly.get("precipitation_probability", [0.0])
                rain_risk = float(max(rain_probs)) if rain_probs else 0.0
                is_spray_safe = (wind_kmh <= 15.0) and (rain_risk < 35.0) and (temp_c <= 36.0)
                return {
                    "temperature_c": round(temp_c, 1),
                    "relative_humidity": round(humidity, 1),
                    "precipitation_mm": 0.0,
                    "rain_risk_6h_percent": round(rain_risk, 0),
                    "wind_speed_kmh": round(wind_kmh, 1),
                    "aqi": 2,
                    "aqi_label": "Fair",
                    "pm2_5": 25.0,
                    "is_spray_safe": is_spray_safe,
                    "latitude": lat,
                    "longitude": lng,
                    "location_source": source,
                    "is_live_weather": True
                }
    except Exception as e:
        print(f"[WEATHER SERVICE WARNING] Open-Meteo failed: {e}")

    # Fallback Cascade 2: Met.no (Norwegian Meteorological Institute)
    metno_url = "https://api.met.no/weatherapi/locationforecast/2.0/compact"
    metno_params = {"lat": lat, "lon": lng}
    headers = {"User-Agent": "AgriNexus-App/1.0 (Contact: admin@agrinexus.local)"}
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(metno_url, params=metno_params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                timeseries = data.get("properties", {}).get("timeseries", [])
                if timeseries:
                    current = timeseries[0].get("data", {}).get("instant", {}).get("details", {})
                    next_6h = timeseries[0].get("data", {}).get("next_1_hours", {}).get("details", {})
                    # using next_1_hours probability for immediate rain risk if 6 hours is not easily iterable
                    
                    temp_c = float(current.get("air_temperature", 28.0))
                    humidity = float(current.get("relative_humidity", 75.0))
                    precip = float(next_6h.get("precipitation_amount", 0.0))
                    wind_ms = float(current.get("wind_speed", 1.67)) # m/s to km/h
                    wind_kmh = wind_ms * 3.6
                    
                    rain_risk = float(next_6h.get("probability_of_precipitation", 0.0))

                    is_spray_safe = (wind_kmh <= 15.0) and (rain_risk < 35.0) and (temp_c <= 36.0)

                    return {
                        "temperature_c": round(temp_c, 1),
                        "relative_humidity": round(humidity, 1),
                        "precipitation_mm": round(precip, 1),
                        "rain_risk_6h_percent": round(rain_risk, 0),
                        "wind_speed_kmh": round(wind_kmh, 1),
                        "aqi": 2,
                        "aqi_label": "Fair",
                        "is_spray_safe": is_spray_safe,
                        "latitude": lat,
                        "longitude": lng,
                        "location_source": source,
                        "is_live_weather": True
                    }
    except Exception as e:
        print(f"[WEATHER SERVICE WARNING] Met.no failed: {e}")

    # Fallback Cascade 3: WTTR.in
    wttr_url = f"https://wttr.in/{lat},{lng}?format=j1"
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(wttr_url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current_condition", [{}])[0]
                weather_arr = data.get("weather", [{}])[0]
                
                temp_c = float(current.get("temp_C", 28.0))
                humidity = float(current.get("humidity", 75.0))
                wind_kmh = float(current.get("windspeedKmph", 6.0))
                precip = float(current.get("precipMM", 0.0))
                
                hourly = weather_arr.get("hourly", [{}])
                rain_probs = [float(h.get("chanceofrain", 0.0)) for h in hourly[:2]]
                max_rain_risk = float(max(rain_probs)) if rain_probs else 0.0
                
                is_spray_safe = (wind_kmh <= 15.0) and (max_rain_risk < 35.0) and (temp_c <= 36.0)

                return {
                    "temperature_c": round(temp_c, 1),
                    "relative_humidity": round(humidity, 1),
                    "precipitation_mm": round(precip, 1),
                    "rain_risk_6h_percent": round(max_rain_risk, 0),
                    "wind_speed_kmh": round(wind_kmh, 1),
                    "aqi": 2,
                    "aqi_label": "Fair",
                    "is_spray_safe": is_spray_safe,
                    "latitude": lat,
                    "longitude": lng,
                    "location_source": source,
                    "is_live_weather": True
                }
    except Exception as e:
        print(f"[WEATHER SERVICE WARNING] Wttr.in failed: {e}")

    # Safe Offline Fallback if all 3 APIs fail
    return {
        "temperature_c": 28.0,
        "relative_humidity": 75.0,
        "precipitation_mm": 0.0,
        "rain_risk_6h_percent": 15.0,
        "wind_speed_kmh": 5.0,
        "aqi": 2,
        "aqi_label": "Fair",
        "is_spray_safe": True,
        "latitude": lat,
        "longitude": lng,
        "location_source": source,
        "is_live_weather": False
    }
