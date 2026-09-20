import sys

def patch_file():
    with open('backend/app/services/auth_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_save = '\"treatment\": scan_data.get(\"disease_treatment\"),'
    new_save = '\"treatment\": scan_data.get(\"disease_treatment\") or scan_data.get(\"rag_treatment_plan\"),'
    if old_save in content:
        content = content.replace(old_save, new_save)
        
    old_obj = '''        scan_obj = {
            "id": str(scan.get("_id")),
            "created_at": scan.get("timestamp"),
            "vision_diagnosis": scan.get("diagnosis"),
            "is_spray_safe": scan.get("is_safe"),
            "safety_warning": scan.get("safety_warning"),
            "tx_hash": scan.get("tx_hash"),
            "filename": scan.get("filename"),
            "image_url": scan.get("image_url"),
            "location": {
                "latitude": loc.get("latitude") if loc else None,
                "longitude": loc.get("longitude") if loc else None,
            }
        }'''
    
    new_obj = '''        scan_obj = {
            "id": str(scan.get("_id")),
            "created_at": scan.get("timestamp"),
            "vision_diagnosis": scan.get("diagnosis"),
            "is_spray_safe": scan.get("is_safe"),
            "safety_warning": scan.get("safety_warning"),
            "treatment": scan.get("treatment"),
            "weather_data": scan.get("weather"),
            "tx_hash": scan.get("tx_hash"),
            "filename": scan.get("filename"),
            "image_url": scan.get("image_url"),
            "location": {
                "latitude": loc.get("latitude") if loc else None,
                "longitude": loc.get("longitude") if loc else None,
            }
        }'''
        
    if old_obj in content:
        content = content.replace(old_obj, new_obj)
        print('SUCCESS')
        
    with open('backend/app/services/auth_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
        
patch_file()
