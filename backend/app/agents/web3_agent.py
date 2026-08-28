from app.state import AgriNexusState
from app.services.web3_client import web3_client
import hashlib

async def web3_node(state: AgriNexusState) -> dict:
    """
    Agent 4: Web3 Crop Passport.
    Signs a gasless transaction to the Base Sepolia network.
    """
    is_safe = state.get("is_safe", False)
    if not is_safe:
        return {"errors": ["Web3 Tx blocked: Treatment is unsafe or unverified."]}

    image_path = state.get("image_path", "unknown")
    proposed_chemical = state.get("proposed_chemical", "Unknown")
    dosage = state.get("safe_dosage_ml_per_acre", 0.0)
    diagnosis = state.get("vision_diagnosis", "Unknown")

    try:
        # Generate pseudo-hashes for the image and treatment
        image_hash = "ipfs://QmMockImageHash" + image_path[-10:]
        treatment_text = f"{proposed_chemical} @ {dosage}ml/acre"
        treatment_hash = "0x" + hashlib.sha256(treatment_text.encode()).hexdigest()
        
        tx_hash = web3_client.sign_gasless_transaction(
            image_hash=image_hash,
            diagnosis=diagnosis,
            treatment_hash=treatment_hash,
            is_safe=is_safe
        )
        
        return {
            "tx_hash": tx_hash,
            "passport_id": 101
        }

    except Exception as e:
        return {
            "errors": [f"Web3 Tx Error: {str(e)}"],
            "tx_hash": "0xMockHashFallback",
            "passport_id": 101
        }
