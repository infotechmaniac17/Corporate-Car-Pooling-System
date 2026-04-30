"""
Vector Store Setup using FAISS
Loads text-based architectural diagrams and creates embeddings
"""

import os
import json
from typing import List, Dict, Any
from pathlib import Path

try:
    from langchain.vectorstores import FAISS
    from langchain.embeddings import OpenAIEmbeddings
    from langchain.schema import Document
except ImportError:
    print("Warning: LangChain not installed. Install with: pip install langchain faiss-cpu openai")

class VectorStoreManager:
    def __init__(self, data_folder: str = "data/raw_svg_text", persist_folder: str = "vectorstore"):
        self.data_folder = data_folder
        self.persist_folder = persist_folder
        self.db = None
        
    def load_documents(self) -> List[Document]:
        """Load all text files from raw_svg_text folder"""
        docs = []
        
        if not os.path.exists(self.data_folder):
            print(f"Warning: {self.data_folder} folder not found")
            return docs
            
        for file in os.listdir(self.data_folder):
            if file.endswith('.txt'):
                file_path = os.path.join(self.data_folder, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        doc = Document(
                            page_content=content,
                            metadata={"source": file, "type": file.split('.')[0]}
                        )
                        docs.append(doc)
                        print(f"✓ Loaded {file}")
                except Exception as e:
                    print(f"✗ Error loading {file}: {e}")
                    
        return docs
    
    def build_vector_store(self, docs: List[Document]):
        """Build FAISS vector store from documents"""
        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            self.db = FAISS.from_documents(docs, embeddings)
            print(f"✓ Vector store created with {len(docs)} documents")
            
            # Persist to disk
            self.db.save_local(self.persist_folder)
            print(f"✓ Vector store saved to {self.persist_folder}")
        except Exception as e:
            print(f"✗ Error building vector store: {e}")
            
    def load_vector_store(self):
        """Load existing vector store from disk"""
        try:
            embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
            self.db = FAISS.load_local(self.persist_folder, embeddings)
            print(f"✓ Vector store loaded from {self.persist_folder}")
        except Exception as e:
            print(f"✗ Error loading vector store: {e}")
            print("Building new vector store...")
            docs = self.load_documents()
            self.build_vector_store(docs)
    
    def search(self, query: str, k: int = 3) -> List[Document]:
        """Search similar documents"""
        if self.db is None:
            self.load_vector_store()
        
        try:
            results = self.db.similarity_search(query, k=k)
            return results
        except Exception as e:
            print(f"✗ Search error: {e}")
            return []

def initialize_vector_store() -> FAISS:
    """Initialize and return vector store"""
    manager = VectorStoreManager()
    manager.load_vector_store()
    return manager.db

def search_documents(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """Convenient function to search documents"""
    manager = VectorStoreManager()
    manager.load_vector_store()
    
    results = manager.search(query, k=k)
    return [
        {
            "content": doc.page_content[:300],  # First 300 chars
            "source": doc.metadata.get("source", "unknown"),
            "type": doc.metadata.get("type", "unknown")
        }
        for doc in results
    ]

if __name__ == "__main__":
    manager = VectorStoreManager()
    docs = manager.load_documents()
    manager.build_vector_store(docs)
