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
    
    # Define edges (sequential flow)
    workflow.set_entry_point("vision")
    workflow.add_edge("vision", "rag")
    workflow.add_edge("rag", "safety")
    workflow.add_edge("safety", "web3")
    workflow.add_edge("web3", "voice")
    workflow.add_edge("voice", END)
    
    return workflow.compile()

agrinexus_app = build_agrinexus_graph()
