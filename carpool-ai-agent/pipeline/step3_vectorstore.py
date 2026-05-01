"""
STEP 3: Build FAISS Vector Store
Creates semantic search index from structured diagrams
"""

import json
import os
from typing import List, Dict, Any, Optional
import numpy as np

try:
    import faiss
    from langchain.embeddings import OpenAIEmbeddings
    from langchain.schema import Document
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False
    print("Warning: Install embeddings with: pip install langchain openai faiss-cpu")

class VectorStoreBuilder:
    """Build and manage FAISS vector store"""
    
    def __init__(self, embedding_model: str = "text-embedding-3-small", store_path: str = "vectorstore"):
        self.embedding_model = embedding_model
        self.store_path = store_path
        self.index = None
        self.documents = []
        self.metadata = []
        self.embeddings = None
        
        if HAS_EMBEDDINGS:
            try:
                self.embeddings = OpenAIEmbeddings(model=embedding_model)
                print(f"✓ Initialized embeddings: {embedding_model}")
            except Exception as e:
                print(f"⚠ Could not initialize embeddings: {e}")
                self.embeddings = None
    
    def convert_structured_to_documents(self, structured: Dict[str, Any]) -> List[Document]:
        """Convert structured data to documents for embedding"""
        docs = []
        
        # Add entities
        for entity_name, entity_data in structured.get('entities', {}).items():
            content = f"""Entity: {entity_name}
Fields: {', '.join(f['name'] for f in entity_data.get('fields', []))}
Primary Key: {entity_data.get('primary_key', 'id')}
Relationships: {', '.join(entity_data.get('relationships', []))}"""
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": "entity",
                    "name": entity_name,
                    "source": "database"
                }
            )
            docs.append(doc)
        
        # Add flows
        for flow_name, flow_data in structured.get('flows', {}).items():
            steps = '\n'.join(flow_data.get('steps', []))
            content = f"""Flow: {flow_name}
Steps: {steps}
Actors: {', '.join(flow_data.get('actors', []))}"""
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": "flow",
                    "name": flow_name,
                    "source": "process"
                }
            )
            docs.append(doc)
        
        # Add relationships
        for rel in structured.get('relationships', []):
            doc = Document(
                page_content=rel,
                metadata={
                    "type": "relationship",
                    "source": "database"
                }
            )
            docs.append(doc)
        
        return docs
    
    def build_index(self, documents: List[Document]) -> bool:
        """Build FAISS index from documents"""
        
        if not self.embeddings:
            print("⚠ Embeddings not available, skipping index build")
            # Create mock index for testing
            self._create_mock_index(documents)
            return True
        
        try:
            print(f"Building FAISS index from {len(documents)} documents...")
            
            # Extract texts
            texts = [doc.page_content for doc in documents]
            
            # Generate embeddings
            embeddings_list = []
            for i, text in enumerate(texts):
                try:
                    embedding = self.embeddings.embed_query(text)
                    embeddings_list.append(embedding)
                    if (i + 1) % 10 == 0:
                        print(f"  Embedded {i + 1}/{len(texts)} documents")
                except Exception as e:
                    print(f"  ⚠ Error embedding document {i}: {e}")
                    # Use zero vector as fallback
                    embeddings_list.append([0.0] * 1536)
            
            # Convert to numpy array
            embeddings_array = np.array(embeddings_list).astype('float32')
            
            # Create FAISS index
            dimension = embeddings_array.shape[1]
            self.index = faiss.IndexFlatL2(dimension)
            self.index.add(embeddings_array)
            
            self.documents = documents
            self.metadata = [doc.metadata for doc in documents]
            
            print(f"✓ FAISS index built: {len(documents)} documents")
            return True
            
        except Exception as e:
            print(f"✗ Error building index: {e}")
            return False
    
    def _create_mock_index(self, documents: List[Document]):
        """Create mock index for testing without real embeddings"""
        # For testing, create a simple in-memory index
        self.documents = documents
        self.metadata = [doc.metadata for doc in documents]
        self.index = None  # Mock
        print(f"✓ Mock index created: {len(documents)} documents")
    
    def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        
        if not self.documents:
            return []
        
        # If no real index, do text-based search
        if self.index is None:
            return self._text_search(query, k)
        
        try:
            # Embed query
            query_embedding = self.embeddings.embed_query(query)
            query_array = np.array([query_embedding]).astype('float32')
            
            # Search
            distances, indices = self.index.search(query_array, k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if 0 <= idx < len(self.documents):
                    doc = self.documents[idx]
                    results.append({
                        "content": doc.page_content,
                        "metadata": doc.metadata,
                        "distance": float(distances[0][i])
                    })
            
            return results
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def _text_search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Fallback text-based search"""
        query_lower = query.lower()
        scored = []
        
        for i, doc in enumerate(self.documents):
            content_lower = doc.page_content.lower()
            # Simple scoring: count matching keywords
            score = sum(1 for word in query_lower.split() if word in content_lower)
            if score > 0:
                scored.append((i, score))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for idx, score in scored[:k]:
            doc = self.documents[idx]
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": score
            })
        
        return results
    
    def save_index(self):
        """Save index to disk"""
        if not os.path.exists(self.store_path):
            os.makedirs(self.store_path)
        
        try:
            if self.index:
                faiss.write_index(self.index, os.path.join(self.store_path, "index.faiss"))
            
            # Save metadata and documents
            metadata_file = os.path.join(self.store_path, "metadata.json")
            with open(metadata_file, 'w') as f:
                json.dump({
                    "metadata": self.metadata,
                    "document_count": len(self.documents)
                }, f, indent=2)
            
            print(f"✓ Index saved to {self.store_path}")
        except Exception as e:
            print(f"✗ Error saving index: {e}")
    
    def load_index(self):
        """Load index from disk"""
        try:
            if os.path.exists(os.path.join(self.store_path, "index.faiss")):
                self.index = faiss.read_index(os.path.join(self.store_path, "index.faiss"))
            
            metadata_file = os.path.join(self.store_path, "metadata.json")
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    data = json.load(f)
                    self.metadata = data.get("metadata", [])
            
            print(f"✓ Index loaded from {self.store_path}")
        except Exception as e:
            print(f"⚠ Could not load index: {e}")

class VectorStoreManager:
    """Manage vector store operations"""
    
    def __init__(self, store_path: str = "vectorstore"):
        self.builder = VectorStoreBuilder(store_path=store_path)
    
    def build_from_structured(self, structured: Dict[str, Any]) -> bool:
        """Build vector store from structured data"""
        print("\nConverting structured data to documents...")
        documents = self.builder.convert_structured_to_documents(structured)
        print(f"✓ Created {len(documents)} documents")
        
        print("\nBuilding FAISS index...")
        success = self.builder.build_index(documents)
        
        if success:
            print("\nSaving index...")
            self.builder.save_index()
        
        return success
    
    def search(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """Search for relevant documents"""
        return self.builder.search(query, k=k)

def build_vector_store(structured: Dict[str, Any], store_path: str = "vectorstore") -> VectorStoreManager:
    """Convenience function to build vector store"""
    manager = VectorStoreManager(store_path=store_path)
    manager.build_from_structured(structured)
    return manager

if __name__ == "__main__":
    from step2_structurer import structure_all_diagrams
    from step1_extractor import extract_diagrams
    
    print("\n" + "="*60)
    print("STEP 3: BUILDING FAISS VECTOR STORE")
    print("="*60)
    
    # Extract and structure
    extracted = extract_diagrams()
    structured = structure_all_diagrams(extracted)
    
    # Build vector store
    manager = build_vector_store(structured)
    
    # Test search
    print("\n" + "="*60)
    print("TEST SEARCH")
    print("="*60)
    
    test_queries = [
        "User and ride relationship",
        "Payment processing flow",
        "Database tables"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Query: {query}")
        results = manager.search(query, k=2)
        for i, result in enumerate(results, 1):
            print(f"  {i}. {result['metadata']['type']}: {result['content'][:100]}...")
