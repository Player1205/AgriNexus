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
    image_path = state.get("image_path")
    
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
            
            winning_class_idx = int(np.argmax(probabilities))
            confidence = float(probabilities[winning_class_idx])
            disease_name = CLASS_LABELS.get(winning_class_idx, "Unknown Anomaly")
            
            print(f"[TIER 1 RESULT] Your Trained Model: '{disease_name}' with {round(confidence * 100, 1)}% confidence.")
            
            # If your trained model is confident (>= 60%), return IMMEDIATELY! Zero Gemini calls.
            if confidence >= 0.60:
                detected_crop = disease_name.split()[0] if disease_name else "Crop"
                return {
                    "vision_diagnosis": disease_name,
                    "vision_confidence": confidence,
                    "is_crop_supported": True,
                    "detected_subject": f"{detected_crop} Leaf"
                }
            else:
                print(f"[TIER 1 LOW CONFIDENCE] Confidence ({round(confidence * 100, 1)}%) < 60%. Engaging Tier 2 Fallback...")
                
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
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        
        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        prompt = """
        You are an expert ICAR Agricultural Domain Gatekeeper and Computer Vision Pathologist acting as a SECONDARY FALLBACK.
        
        Supported 14 commercial food crops:
        [Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato]
        
        TASK:
        1. Identify what the image actually depicts (e.g. 'Areca Palm Houseplant', 'Living Room / Furniture', 'Tomato Leaf', 'Weed', etc.).
        2. STRICT DOMAIN CHECK:
           - Is this a recognized leaf of one of the 14 supported agricultural food crops?
           - If it is an indoor houseplant, palm, ornamental flower, weed, human, furniture, or non-agricultural plant, set is_supported_crop = false.
        3. If is_supported_crop is true:
           - Diagnose the specific disease (e.g. 'Tomato Late blight', 'Corn Common rust', 'Apple Scab', etc.).
        4. If is_supported_crop is false:
           - Set diagnosis = 'Unrecognized Plant / Non-Agricultural Subject'.
           - Set confidence = 0.0.
           
        Respond STRICTLY in JSON format:
        {
            "is_supported_crop": true or false,
            "detected_subject": "Name of what is in the photo (e.g. Areca Palm, Tomato Leaf)",
            "diagnosis": "Disease name or 'Unrecognized Plant / Non-Agricultural Subject'",
            "confidence": 0.0 to 1.0 float,
            "explanation": "Short reason"
        }
        """

        message = HumanMessage(
            content=[
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": f"data:image/jpeg;base64,{encoded_string}"}
            ]
        )
        
        response = llm.invoke([message])
        content = response.content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        
        is_supported = data.get("is_supported_crop", True)
        detected_subject = data.get("detected_subject", "Unknown Plant")
        diagnosis = data.get("diagnosis", "Unknown anomaly")
        confidence = float(data.get("confidence", 0.0))
        
        if not is_supported:
            diagnosis = "Unrecognized Plant / Non-Agricultural Subject"
            confidence = 0.0
            
        return {
            "vision_diagnosis": diagnosis,
            "vision_confidence": confidence,
            "is_crop_supported": is_supported,
            "detected_subject": detected_subject
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
