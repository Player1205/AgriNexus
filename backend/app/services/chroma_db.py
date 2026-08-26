import chromadb
from chromadb.config import Settings
import os

class ChromaDBService:
    def __init__(self):
        # We use persistent embedded ChromaDB inside the backend dir
        db_path = os.path.join(os.path.dirname(__file__), "..", "..", "chroma_data")
        os.makedirs(db_path, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=db_path)
        
        # In a real scenario, this collection would be heavily pre-loaded with ICAR PDFs.
        # We initialize it with some dummy data for demonstration.
        self.collection = self.client.get_or_create_collection(name="icar_guidelines")
        
        # Seed dummy data if empty
        if self.collection.count() == 0:
            self.collection.add(
                documents=[
                    "Wheat Stripe Rust is a fungal disease. Recommended treatment involves applying Mancozeb or Propiconazole.",
                    "Counterfeit seed packets often feature blurry micro-printing on the bottom right corner.",
                    "Paddy Blast can be treated with Azoxystrobin, avoiding application during high winds."
                ],
                metadatas=[{"source": "ICAR_Wheat_2024"}, {"source": "Gov_Seed_Act"}, {"source": "ICAR_Paddy_2023"}],
                ids=["doc1", "doc2", "doc3"]
            )

    def search_guidelines(self, query: str, n_results: int = 1) -> list[str]:
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results["documents"][0] if results["documents"] else []

chroma_service = ChromaDBService()
