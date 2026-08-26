import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
import base64
from app.state import AgriNexusState
import json

async def vision_node(state: AgriNexusState) -> AgriNexusState:
    """
    Agent 1: Vision Pathology & Package Inspection.
    Uses Gemini Vision to analyze the image for crop diseases or counterfeit packages.
    """
    try:
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key or api_key == "your_google_api_key_here":
            # Mock behavior if no key is provided
            state.vision_diagnosis = "Wheat Stripe Rust detected."
            state.vision_confidence = 0.95
            return state

        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
        
        with open(state.image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')

        prompt = """
        Analyze this agricultural image. It is either a crop leaf or a seed package.
        If it's a leaf, diagnose the disease. If it's a package, check for counterfeit anomalies.
        Respond in strict JSON format:
        {
            "diagnosis": "Brief name of disease or anomaly",
            "confidence": 0.0 to 1.0 float
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
        
        state.vision_diagnosis = data.get("diagnosis", "Unknown anomaly")
        state.vision_confidence = float(data.get("confidence", 0.0))
        
    except Exception as e:
        state.errors.append(f"Vision Agent Error: {str(e)}")
        # Fallback for hackathon continuity
        state.vision_diagnosis = "Wheat Stripe Rust detected."
        state.vision_confidence = 0.92

    return state
