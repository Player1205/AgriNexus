from langgraph.graph import StateGraph, END
from app.state import AgriNexusState
from app.agents.vision_agent import vision_node
from app.agents.rag_agent import rag_node
from app.agents.safety_agent import safety_node
from app.agents.web3_agent import web3_node
from app.agents.voice_agent import voice_node

def build_agrinexus_graph():
    """
    Constructs the LangGraph state machine.
    """
    workflow = StateGraph(AgriNexusState)
    
    # Add nodes
    workflow.add_node("vision", vision_node)
    workflow.add_node("rag", rag_node)
    workflow.add_node("safety", safety_node)
    workflow.add_node("web3", web3_node)
    workflow.add_node("voice", voice_node)
    
    def route_after_vision(state: AgriNexusState):
        """
        Early Exit / Statutory Gate:
        If the crop is not one of our 14 ICAR-certified crops or is non-agricultural,
        bypass chemical RAG (Agent 2), Safety Engine (Agent 3), and Web3 Passport (Agent 4)
        and jump DIRECTLY to Voice Agent (Agent 5) for safe advisory and KVK referral.
        """
        if not state.get("is_crop_supported", True):
            return "voice"
        return "rag"

    # Define edges (conditional bypass for uncertified crops)
    workflow.set_entry_point("vision")
    workflow.add_conditional_edges("vision", route_after_vision, {"rag": "rag", "voice": "voice"})
    workflow.add_edge("rag", "safety")
    workflow.add_edge("safety", "web3")
    workflow.add_edge("web3", "voice")
    workflow.add_edge("voice", END)
    
    return workflow.compile()

agrinexus_app = build_agrinexus_graph()
