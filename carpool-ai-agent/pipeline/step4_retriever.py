"""
STEP 4: Build Simple Retriever (No LangGraph yet)
Direct retrieval from vector store with structured data
"""

import json
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass

@dataclass
class RetrievalResult:
    """Result from retrieval"""
    query: str
    vector_results: List[Dict[str, Any]]
    structured_results: Dict[str, Any]
    intent_classified: str
    total_tokens: int

class SimpleRetriever:
    """Simple retriever without LangGraph"""
    
    def __init__(self, vector_store_manager, structured_data: Dict[str, Any]):
        self.vector_store = vector_store_manager
        self.structured = structured_data
        self.intent_keywords = {
            "entity": ["entity", "table", "database", "field", "record", "schema"],
            "flow": ["flow", "process", "step", "sequence", "lifecycle", "workflow"],
            "relationship": ["relation", "foreign key", "connect", "link", "associate"],
            "summary": ["what", "how", "explain", "describe", "overview"]
        }
    
    def classify_intent(self, query: str) -> str:
        """Simple intent classification"""
        query_lower = query.lower()
        
        for intent, keywords in self.intent_keywords.items():
            if any(kw in query_lower for kw in keywords):
                return intent
        
        return "summary"
    
    def get_structured_context(self, intent: str) -> Dict[str, Any]:
        """Get relevant structured context"""
        
        if intent == "entity":
            # Return entity information
            return {
                "type": "entities",
                "data": self.structured.get("entities", {}),
                "count": len(self.structured.get("entities", {}))
            }
        
        elif intent == "flow":
            # Return flow information
            return {
                "type": "flows",
                "data": self.structured.get("flows", {}),
                "count": len(self.structured.get("flows", {}))
            }
        
        elif intent == "relationship":
            # Return relationships
            return {
                "type": "relationships",
                "data": self.structured.get("relationships", []),
                "count": len(self.structured.get("relationships", []))
            }
        
        else:
            # Summary - return overview
            return {
                "type": "summary",
                "metadata": self.structured.get("metadata", {}),
                "stats": {
                    "entities": len(self.structured.get("entities", {})),
                    "flows": len(self.structured.get("flows", {})),
                    "relationships": len(self.structured.get("relationships", []))
                }
            }
    
    def retrieve(self, query: str, k: int = 3) -> RetrievalResult:
        """Retrieve results for a query"""
        
        # Step 1: Classify intent
        intent = self.classify_intent(query)
        
        # Step 2: Vector search
        vector_results = self.vector_store.search(query, k=k)
        
        # Step 3: Get structured context
        structured_results = self.get_structured_context(intent)
        
        # Step 4: Estimate tokens
        total_tokens = self._estimate_tokens(vector_results, structured_results)
        
        return RetrievalResult(
            query=query,
            vector_results=vector_results,
            structured_results=structured_results,
            intent_classified=intent,
            total_tokens=total_tokens
        )
    
    def _estimate_tokens(self, vector_results: List[Dict], structured: Dict[str, Any]) -> int:
        """Rough token estimation"""
        # 1 token ≈ 4 characters
        
        vector_tokens = sum(len(r.get("content", "")) // 4 for r in vector_results)
        structured_tokens = len(json.dumps(structured)) // 4
        
        return vector_tokens + structured_tokens

class RetrieverFormatter:
    """Format retrieval results for consumption"""
    
    @staticmethod
    def format_for_llm(result: RetrievalResult) -> str:
        """Format retrieval result for LLM prompt"""
        
        formatted = f"""=== RETRIEVAL CONTEXT ===

Query: {result.query}
Intent: {result.intent_classified}
Estimated Tokens: {result.total_tokens}

--- STRUCTURED CONTEXT ---
{json.dumps(result.structured_results, indent=2)[:500]}

--- VECTOR SEARCH RESULTS ---
"""
        
        for i, vec_result in enumerate(result.vector_results, 1):
            formatted += f"""
Result {i}:
- Type: {vec_result['metadata'].get('type', 'unknown')}
- Content: {vec_result['content'][:200]}
- Source: {vec_result['metadata'].get('source', 'unknown')}
"""
        
        formatted += "\n=== END CONTEXT ===\n"
        return formatted
    
    @staticmethod
    def format_for_json(result: RetrievalResult) -> Dict[str, Any]:
        """Format retrieval result as JSON"""
        return {
            "query": result.query,
            "intent": result.intent_classified,
            "tokens_estimated": result.total_tokens,
            "structured_context": result.structured_results,
            "vector_results": result.vector_results,
            "timestamp": __import__("datetime").datetime.now().isoformat()
        }
    
    @staticmethod
    def format_for_display(result: RetrievalResult) -> str:
        """Format for human-readable display"""
        
        display = f"""
╔══════════════════════════════════════╗
║          RETRIEVAL RESULTS           ║
╚══════════════════════════════════════╝

Query: {result.query}
Intent: {result.intent_classified}
Tokens Used: {result.total_tokens}

📊 STRUCTURED RESULTS:
  Type: {result.structured_results.get('type', 'N/A')}
  Count: {result.structured_results.get('count', 'N/A')}

🔍 VECTOR SEARCH RESULTS:
"""
        
        for i, vec_result in enumerate(result.vector_results, 1):
            display += f"\n  {i}. {vec_result['metadata'].get('type', 'unknown').upper()}\n"
            display += f"     {vec_result['content'][:150]}...\n"
        
        display += "\n"
        return display

def test_retriever():
    """Test simple retriever"""
    from step3_vectorstore import build_vector_store
    from step2_structurer import structure_all_diagrams
    from step1_extractor import extract_diagrams
    
    print("\n" + "="*60)
    print("STEP 4: SIMPLE RETRIEVER TEST")
    print("="*60)
    
    # Build pipeline
    print("\n1. Extracting diagrams...")
    extracted = extract_diagrams()
    
    print("2. Structuring data...")
    structured = structure_all_diagrams(extracted)
    
    print("3. Building vector store...")
    vector_manager = build_vector_store(structured)
    
    # Create retriever
    print("4. Creating retriever...")
    retriever = SimpleRetriever(vector_manager, structured)
    
    # Test queries
    test_queries = [
        "What tables are in the database?",
        "Explain the ride booking flow",
        "How are users and rides related?",
        "Tell me about the system"
    ]
    
    print("\n" + "="*60)
    print("TEST QUERIES")
    print("="*60)
    
    for query in test_queries:
        result = retriever.retrieve(query)
        print(RetrieverFormatter.format_for_display(result))

if __name__ == "__main__":
    test_retriever()
