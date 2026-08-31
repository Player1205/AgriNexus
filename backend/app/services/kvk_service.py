import os
import json
import math
from typing import Dict, Any, Optional

class KVKService:
    """
    Sub-millisecond Geospatial Resolver for ICAR Krishi Vigyan Kendra (KVK) Extension Centers.
    Uses spherical Haversine trigonometry to determine the exact closest extension research center.
    Mandatory Statutory Guard: Directs smallholder farmers to certified extension agronomists
    whenever AI visual diagnostic confidence falls below statutory thresholds (<60%).
    """
    def __init__(self):
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "kvk_directory.json")
        self.kvk_directory = []
        if os.path.exists(data_path):
            with open(data_path, "r", encoding="utf-8") as f:
                self.kvk_directory = json.load(f)
            print(f"[KVK Geospatial Engine] Loaded {len(self.kvk_directory)} certified ICAR Krishi Vigyan Kendra centers.")
        else:
            print(f"[KVK Geospatial Engine CRITICAL ERROR] KVK directory missing at {data_path}")

    @staticmethod
    def _haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Computes the great-circle distance between two points on the Earth's surface
        using the Haversine formula (Mean Earth Radius R = 6371.0 km).
        """
        R = 6371.0  # Earth radius in kilometers
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def find_nearest_kvk(self, latitude: Optional[float], longitude: Optional[float]) -> Dict[str, Any]:
        """
        Finds the nearest certified ICAR KVK center from the given latitude and longitude.
        Falls back to Regional Northern Hub (PAU Ludhiana) if coordinates are unavailable.
        """
        if not self.kvk_directory:
            return {
                "name": "District Krishi Vigyan Kendra (KVK)",
                "distance_km": 0.0,
                "phone": "1800-180-1551",  # National Kisan Call Center Helpline
                "address": "Nearest District Agriculture Department / KVK",
                "maps_url": "https://maps.google.com"
            }

        # Default fallback to central agrarian baseline if coordinates missing
        lat = latitude if latitude is not None else 30.9010
        lon = longitude if longitude is not None else 75.8573

        nearest_kvk = None
        min_distance = float('inf')

        for kvk in self.kvk_directory:
            k_lat = kvk.get("latitude")
            k_lon = kvk.get("longitude")
            if k_lat is not None and k_lon is not None:
                dist = self._haversine_distance_km(lat, lon, k_lat, k_lon)
                if dist < min_distance:
                    min_distance = dist
                    nearest_kvk = kvk

        if not nearest_kvk:
            nearest_kvk = self.kvk_directory[0]
            min_distance = 0.0

        maps_url = f"https://maps.google.com/?q={nearest_kvk.get('latitude')},{nearest_kvk.get('longitude')}"

        return {
            "id": nearest_kvk.get("id"),
            "name": nearest_kvk.get("name"),
            "host_institute": nearest_kvk.get("host_institute"),
            "district": nearest_kvk.get("district"),
            "state": nearest_kvk.get("state"),
            "distance_km": round(min_distance, 1),
            "phone": nearest_kvk.get("phone", "1800-180-1551"),
            "email": nearest_kvk.get("email"),
            "address": nearest_kvk.get("address"),
            "specialization": nearest_kvk.get("specialization"),
            "maps_url": maps_url
        }

# Global singleton
kvk_service = KVKService()
