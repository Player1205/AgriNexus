from app.state import AgriNexusState
from app.services.web3_client import web3_client
import hashlib

async def web3_node(state: AgriNexusState) -> AgriNexusState:
    """
    Agent 4: Web3 Crop Passport.
    Signs a gasless transaction to the Base Sepolia network.
    """
    if not state.is_safe:
        state.errors.append("Web3 Tx blocked: Treatment is unsafe.")
        return state

    try:
        # Generate pseudo-hashes for the image and treatment
        image_hash = "ipfs://QmMockImageHash" + state.image_path[-10:]
        treatment_text = f"{state.proposed_chemical} @ {state.safe_dosage_ml_per_acre}ml/acre"
        treatment_hash = "0x" + hashlib.sha256(treatment_text.encode()).hexdigest()
        
        tx_hash = web3_client.sign_gasless_transaction(
            image_hash=image_hash,
            diagnosis=state.vision_diagnosis or "Unknown",
            treatment_hash=treatment_hash,
            is_safe=state.is_safe
        )
        
        state.tx_hash = tx_hash
        # In a real app we'd wait for receipt to get the passport ID. Mocking here.
        state.passport_id = 101

    except Exception as e:
        state.errors.append(f"Web3 Tx Error: {str(e)}")
        state.tx_hash = "0xMockHashFallback"
        
    return state
