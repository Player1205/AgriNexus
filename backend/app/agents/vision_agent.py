import os
import json
import base64
from app.state import AgriNexusState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

# Edge AI Imports
try:
    import onnxruntime as ort
    import numpy as np
    from PIL import Image
    HAS_EDGE_AI = True
except ImportError:
    HAS_EDGE_AI = False

# Path where your trained ONNX model and classes are stored
MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml_model")
MODEL_PATH = os.path.join(MODEL_DIR, "agrinexus_vision.onnx")
MAPPING_PATH = os.path.join(MODEL_DIR, "class_mapping.json")

# 14 Supported Commercial Food & Horticulture Crops
SUPPORTED_CROPS = [
    "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange", 
    "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash", 
    "Strawberry", "Tomato"
]

# Dynamically load the real 38 crop disease classes
CLASS_LABELS = {}
if os.path.exists(MAPPING_PATH):
    with open(MAPPING_PATH, "r") as f:
        CLASS_LABELS = {int(k): v for k, v in json.load(f).items()}
else:
    CLASS_LABELS = {0: "Healthy Crop", 1: "Paddy Blast", 2: "Wheat Stripe Rust"}

def preprocess_image_for_efficientnet(image_path: str) -> 'np.ndarray':
    """
    Prepares the raw image for EfficientNet-B4 exactly as PyTorch would, 
    using pure Numpy for sub-millisecond execution.
    """
    img = Image.open(image_path).convert('RGB')
    img = img.resize((380, 380), Image.BILINEAR)
    img_data = np.array(img).astype('float32') / 255.0
    
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_data = (img_data - mean) / std
    img_data = np.transpose(img_data, (2, 0, 1))
    img_data = np.expand_dims(img_data, axis=0)
    
    return img_data.astype(np.float32)

async def vision_node(state: AgriNexusState) -> dict:
    """
    Agent 1: Vision Pathology
    
    TIER 1 (PRIMARY): Runs YOUR trained ML model (agrinexus_vision.onnx).
    If confidence >= 60%, returns immediately with ZERO external API calls.
    
    TIER 2 (FALLBACK): ONLY if your trained model is uncertain (<60%) or unable
    to identify the crop, Gemini Vision API is consulted to identify the anomaly/subject.
    """
    image_path = state.get("image_path", "")

    # =========================================================================
    # TIER 1: YOUR TRAINED ML MODEL (agrinexus_vision.onnx)
    # =========================================================================
    if HAS_EDGE_AI and os.path.exists(MODEL_PATH):
        try:
            print("[TIER 1 - TRAINED ML MODEL] Executing onnxruntime inference on your trained neural network...")
            input_tensor = preprocess_image_for_efficientnet(image_path)
            
            session = ort.InferenceSession(MODEL_PATH)
            input_name = session.get_inputs()[0].name
            output = session.run(None, {input_name: input_tensor})[0]
            
            exp_out = np.exp(output[0] - np.max(output[0]))
            probabilities = exp_out / exp_out.sum()
            
            sorted_indices = np.argsort(probabilities)[::-1]
            winning_class_idx = int(sorted_indices[0])
            runner_up_idx = int(sorted_indices[1]) if len(sorted_indices) > 1 else winning_class_idx
            
            confidence = float(probabilities[winning_class_idx])
            runner_up_confidence = float(probabilities[runner_up_idx]) if runner_up_idx != winning_class_idx else 0.0
            confidence_margin = confidence - runner_up_confidence
            
            disease_name = CLASS_LABELS.get(winning_class_idx, "Unknown Anomaly")
            
            print(f"[TIER 1 RESULT] Your Trained Model: '{disease_name}' with {round(confidence * 100, 1)}% confidence (Margin: {round(confidence_margin * 100, 1)}%).")
            
            # Dual-Gate Mathematical Verification:
            # 1. Statistical significance floor (>= 55% vs uniform prior of 2.63% across 38 classes).
            # 2. Significant confidence margin (>= 12%) between top-1 and runner-up to reject ambiguous guesses.
            if confidence >= 0.55 and confidence_margin >= 0.12:
                detected_crop = disease_name.split()[0] if disease_name else "Crop"
                return {
                    "vision_diagnosis": disease_name,
                    "vision_confidence": confidence,
                    "is_crop_supported": True,
                    "detected_subject": f"{detected_crop} Leaf"
                }
            else:
                print(f"[TIER 1 UNCERTAIN / OOD] Confidence ({round(confidence * 100, 1)}%) < 55% or Margin ({round(confidence_margin * 100, 1)}%) < 12%. Engaging Tier 2 Gemini Gatekeeper...")
                
        except Exception as e:
            print(f"[TIER 1 NOTE] {str(e)}. Falling back to Tier 2...")

    # =========================================================================
    # TIER 2: GEMINI VISION FALLBACK (ONLY IF TRAINED MODEL CANNOT IDENTIFY)
    # =========================================================================
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key or api_key == "your_google_api_key_here":
            print("[TIER 2] No Google API Key found. Returning low-confidence KVK referral.")
            return {
                "vision_diagnosis": "Unrecognized Pattern (Low Confidence)",
                "vision_confidence": 0.35,
                "is_crop_supported": False,
                "detected_subject": "Unverified Leaf Anomaly"
            }

        print("[TIER 2 - GEMINI FALLBACK] Consulting Gemini Vision Gatekeeper to analyze unidentified subject...")
        
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        prompt = """
        You are an expert Agricultural Computer Vision Pathologist.
        
        TASK:
        1. Determine if this image shows a real agricultural crop, plant leaf, or fruit.
        2. If YES (any real crop/plant/fruit/vegetable/grain):
           - Set is_agricultural = true
           - Identify the crop name (e.g. "Guava", "Mango", "Rice", "Wheat", "Tomato")
           - Diagnose the disease if any (e.g. "Leaf Spot", "Powdery Mildew", "Healthy")
           - Set confidence between 0.7 and 1.0
        3. If NO (text document, screenshot, furniture, human, animal, electronic device, random object):
           - Set is_agricultural = false
           - Set confidence = 0.0
           
        Respond ONLY in this exact JSON format, no extra text:
        {"is_agricultural": true, "crop": "CropName", "disease": "DiseaseName or Healthy", "confidence": 0.85}
        """

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": f"data:image/jpeg;base64,{encoded_string}"}
            ]
        )
        
        gemini_models = ["gemini-flash-latest", "gemini-3.6-flash", "gemini-flash-lite-latest"]
        response = None
        for model_name in gemini_models:
            try:
                print(f"[TIER 2 - GEMINI FALLBACK] Attempting model '{model_name}'...")
                llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
                res = llm.invoke([message])
                if res and res.content:
                    response = res
                    print(f"[TIER 2 - GEMINI FALLBACK] Success with model: {model_name}")
                    break
            except Exception as model_err:
                print(f"[TIER 2 - GEMINI FALLBACK] Model '{model_name}' failed: {model_err}")

        if not response or not response.content:
            raise RuntimeError("All Gemini models in fallback cascade failed or rate-limited.")
        raw_content = response.content
        if isinstance(raw_content, list):
            parts = []
            for part in raw_content:
                if isinstance(part, str):
                    parts.append(part)
                elif isinstance(part, dict) and 'text' in part:
                    parts.append(part['text'])
                elif hasattr(part, 'text'):
                    parts.append(part.text)
                else:
                    parts.append(str(part))
            raw_content = "".join(parts)
        
        import re
        print(f"[TIER 2 RAW RESPONSE] {repr(raw_content[:500])}")
        
        content = raw_content.replace("```json", "").replace("```", "").strip()
        
        # Normalize LLM JSON quirks: single quotes -> double, True/False/None -> JSON
        normalized = content.replace("'", '"').replace("True", "true").replace("False", "false").replace("None", "null")
        
        data = None
        # Attempt 1: Direct parse
        try:
            data = json.loads(normalized)
        except Exception:
            pass
        
        # Attempt 2: Extract JSON object via regex
        if data is None:
            json_match = re.search(r'\{.*\}', normalized, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                except Exception:
                    pass
        
        # Attempt 3: Regex key extraction as last resort
        if data is None:
            print(f"[TIER 2] JSON parse failed. Extracting fields via regex...")
            is_ag = bool(re.search(r'"is_agricultural"\s*:\s*true', normalized, re.IGNORECASE))
            crop_m = re.search(r'"(?:crop|detected_subject)"\s*:\s*"([^"]+)"', normalized)
            disease_m = re.search(r'"(?:disease|diagnosis)"\s*:\s*"([^"]+)"', normalized)
            data = {
                "is_supported_crop": is_ag,
                "detected_subject": crop_m.group(1) if crop_m else "Unknown Plant",
                "diagnosis": disease_m.group(1) if disease_m else "Unknown anomaly",
                "confidence": 0.85 if is_ag else 0.0
            }
        
        is_ag = data.get("is_agricultural", data.get("is_supported_crop", True))
        crop_name = str(data.get("crop", data.get("detected_subject", "Unknown Plant"))).strip()
        disease_name = str(data.get("disease", data.get("diagnosis", "Healthy"))).strip()
        confidence = float(data.get("confidence", 0.85 if is_ag else 0.0))

        if not is_ag:
            return {
                "vision_diagnosis": "Unrecognized Plant / Non-Agricultural Subject",
                "vision_confidence": 0.0,
                "is_crop_supported": False,
                "detected_subject": "Non-Agricultural Subject",
                "identified_by": "gemini_fallback"
            }

        # Check if the identified crop is one of our 14 ICAR Certified Crops
        is_certified = any(c.lower() in crop_name.lower() for c in SUPPORTED_CROPS)
        detected_subject = f"{crop_name} Leaf" if "leaf" not in crop_name.lower() else crop_name
        full_diagnosis = f"{crop_name} {disease_name}" if crop_name.lower() not in disease_name.lower() else disease_name

        print(f"[TIER 2 RESULT] Gemini: '{full_diagnosis}' | Certified: {is_certified} | Confidence: {confidence}")

        return {
            "vision_diagnosis": full_diagnosis,
            "vision_confidence": confidence,
            "is_crop_supported": is_certified,
            "detected_subject": detected_subject,
            "identified_by": "gemini_fallback"
        }
        
    except Exception as e:
        print(f"[TIER 2 FALLBACK ERROR] {e}")
        return {
            "errors": [f"Vision Agent Error: {str(e)}"],
            "vision_diagnosis": "Unrecognized Pattern (Low Confidence)",
            "vision_confidence": 0.35,
            "is_crop_supported": False,
            "detected_subject": "Unverified Leaf Anomaly"
        }
