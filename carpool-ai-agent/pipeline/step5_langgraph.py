"""
STEP 5: Add LangGraph Router
Orchestrates extraction → structuring → retrieval
"""

from typing import Dict, Any, TypedDict, Optional
from dataclasses import dataclass, field
import json

try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False
    print("Warning: LangGraph not installed. Install with: pip install langgraph")

# State definition
class PipelineState(TypedDict):
    """Pipeline state schema"""
    query: str
    extracted_diagrams: Optional[Dict[str, Any]]
    structured_data: Optional[Dict[str, Any]]
    retrieval_result: Optional[Any]
    response: Optional[str]
    error: Optional[str]

class LangGraphPipeline:
    """LangGraph-based pipeline orchestration"""
    
    def __init__(self, vector_manager=None, structured_data=None):
        self.vector_manager = vector_manager
        self.structured_data = structured_data
        self.graph = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph"""
        if not HAS_LANGGRAPH:
            print("Warning: LangGraph not available")
            return
        
        graph = StateGraph(PipelineState)
        
        # Add nodes
        graph.add_node("extract", self._extract_node)
        graph.add_node("structure", self._structure_node)
        graph.add_node("retrieve", self._retrieve_node)
        graph.add_node("format", self._format_node)
        
        # Add edges
        graph.set_entry_point("extract")
        graph.add_edge("extract", "structure")
        graph.add_edge("structure", "retrieve")
        graph.add_edge("retrieve", "format")
        graph.add_edge("format", END)
        
        self.graph = graph.compile()
        print("✓ LangGraph pipeline built")
    
    def _extract_node(self, state: PipelineState) -> Dict[str, Any]:
        """Node 1: Extract diagrams"""
        print("📍 [Node 1] Extracting diagrams...")
        
        try:
            from step1_extractor import extract_diagrams
            extracted = extract_diagrams()
            
            return {
                "extracted_diagrams": extracted,
                "error": None
            }
        except Exception as e:
            print(f"✗ Extraction failed: {e}")
            return {
                "extracted_diagrams": None,
                "error": str(e)
            }
    
    def _structure_node(self, state: PipelineState) -> Dict[str, Any]:
        """Node 2: Structure into JSON"""
        print("📍 [Node 2] Structuring diagrams...")
        
        if state.get("error"):
            return {"structured_data": None}
        
        try:
            from step2_structurer import structure_all_diagrams
            extracted = state.get("extracted_diagrams", {})
            structured = structure_all_diagrams(extracted)
            
            # Store for retriever
            self.structured_data = structured
            
            return {
                "structured_data": structured,
                "error": None
            }
        except Exception as e:
            print(f"✗ Structuring failed: {e}")
            return {
                "structured_data": None,
                "error": str(e)
            }
    
    def _retrieve_node(self, state: PipelineState) -> Dict[str, Any]:
        """Node 3: Retrieve with simple retriever"""
        print(f"📍 [Node 3] Retrieving for query: '{state['query']}'")
        
        if state.get("error"):
            return {"retrieval_result": None}
        
        try:
            if not self.vector_manager or not self.structured_data:
                print("⚠ Vector manager or structured data not available")
                return {"retrieval_result": None}
            
            from step4_retriever import SimpleRetriever
            
            retriever = SimpleRetriever(self.vector_manager, self.structured_data)
            result = retriever.retrieve(state["query"], k=3)
            
            return {
                "retrieval_result": result,
                "error": None
            }
        except Exception as e:
            print(f"✗ Retrieval failed: {e}")
            return {
                "retrieval_result": None,
                "error": str(e)
            }
    
    def _format_node(self, state: PipelineState) -> Dict[str, Any]:
        """Node 4: Format for output"""
        print("📍 [Node 4] Formatting results...")
        
        try:
            from step4_retriever import RetrieverFormatter
            
            result = state.get("retrieval_result")
            
            if result:
                formatted = RetrieverFormatter.format_for_json(result)
            else:
                formatted = {"error": state.get("error", "Unknown error")}
            
            return {
                "response": formatted,
                "error": None
            }
        except Exception as e:
            print(f"✗ Formatting failed: {e}")
            return {
                "response": None,
                "error": str(e)
            }
    
    def invoke(self, query: str) -> Dict[str, Any]:
        """Invoke the pipeline"""
        if not self.graph:
            return {"error": "Graph not initialized"}
        
        initial_state: PipelineState = {
            "query": query,
            "extracted_diagrams": None,
            "structured_data": None,
            "retrieval_result": None,
            "response": None,
            "error": None
        }
        
        result = self.graph.invoke(initial_state)
        return result

class AutomatedPipeline:
    """Fully automated pipeline"""
    
    def __init__(self):
        print("\n" + "="*60)
        print("INITIALIZING AUTOMATED PIPELINE")
        print("="*60)
        
        # Step 1: Extract
        print("\n1️⃣  EXTRACTION...")
        from step1_extractor import extract_diagrams
        self.extracted = extract_diagrams()
        
        # Step 2: Structure
        print("\n2️⃣  STRUCTURING...")
        from step2_structurer import structure_all_diagrams
        self.structured = structure_all_diagrams(self.extracted)
        
        # Step 3: Build vector store
        print("\n3️⃣  BUILDING VECTOR STORE...")
        from step3_vectorstore import build_vector_store
        self.vector_manager = build_vector_store(self.structured)
        
        # Step 4: Create LangGraph pipeline
        print("\n4️⃣  INITIALIZING LANGGRAPH...")
        self.pipeline = LangGraphPipeline(self.vector_manager, self.structured)
        
        print("\n✅ Pipeline ready!\n")
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the pipeline"""
        print(f"\n{'='*60}")
        print(f"QUERY: {question}")
        print(f"{'='*60}\n")
        
        result = self.pipeline.invoke(question)
        
        return result
    
    def display_result(self, result: Dict[str, Any]):
        """Display result nicely"""
        if result.get("error"):
            print(f"❌ Error: {result['error']}")
            return
        
        response = result.get("response", {})
        
        print(f"\n📤 RESPONSE:")
        print(f"  Intent: {response.get('intent', 'N/A')}")
        print(f"  Tokens: {response.get('tokens_estimated', 'N/A')}")
        print(f"\n📊 Structured Context:")
        struct = response.get('structured_context', {})
        print(f"  Type: {struct.get('type', 'N/A')}")
        print(f"  Count: {struct.get('count', 'N/A')}")
        print(f"\n🔍 Vector Results: {len(response.get('vector_results', []))}")
        for i, vec in enumerate(response.get('vector_results', [])[:2], 1):
            print(f"  {i}. {vec['metadata'].get('type', 'unknown')}: {vec['content'][:100]}...")

def run_automated_pipeline():
    """Run the complete automated pipeline"""
    pipeline = AutomatedPipeline()
    
    # Test queries
    test_queries = [
        "What tables exist in the database?",
        "Explain the ride booking flow",
        "How do users and rides connect?"
    ]
    
    for query in test_queries:
        result = pipeline.query(query)
        pipeline.display_result(result)
        print()

if __name__ == "__main__":
    run_automated_pipeline()
