"""
LangGraph Flow
Main agent orchestration using LangGraph
"""

from typing import Dict, Any, TypedDict
import json

try:
    from langgraph.graph import StateGraph, END
except ImportError:
    print("Warning: LangGraph not installed. Install with: pip install langgraph")

from agent.classifier import classify_query, get_intent_details
from agent.nodes import get_structured_context, search_structured_data
from agent.compressor import compress_agent_context
from agent.retriever import search_documents

class AgentState(TypedDict):
    """State schema for the agent"""
    query: str
    intent: str
    structured_context: Dict[str, Any]
    vector_results: list
    compressed_context: Dict[str, Any]
    response: str

def router_node(state: AgentState) -> Dict[str, Any]:
    """Step 1: Classify user intent"""
    query = state["query"]
    intent = classify_query(query)
    
    print(f"\n📍 Router: Classified intent as '{intent}'")
    print(f"   Query: {query[:100]}...")
    
    return {
        "intent": intent,
        "query": query
    }

def retriever_node(state: AgentState) -> Dict[str, Any]:
    """Step 2: Retrieve structured context and vector results"""
    intent = state["intent"]
    query = state["query"]
    
    # Get structured data
    structured = get_structured_context(intent)
    print(f"✓ Retrieved structured context ({intent})")
    
    # Get vector search results
    try:
        vector_results = search_documents(query, k=2)
        print(f"✓ Retrieved {len(vector_results)} vector results")
    except Exception as e:
        print(f"⚠ Vector search failed: {e}")
        vector_results = []
    
    return {
        "structured_context": structured,
        "vector_results": vector_results
    }

def compressor_node(state: AgentState) -> Dict[str, Any]:
    """Step 3: Compress context to minimize tokens"""
    structured = state["structured_context"]
    vector_results = state["vector_results"]
    
    compressed = compress_agent_context(structured, vector_results)
    
    print(f"✓ Context compressed")
    print(f"  Estimated tokens: {compressed['estimated_tokens']}")
    
    return {
        "compressed_context": compressed
    }

def build_graph():
    """Build the LangGraph agent"""
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("router", router_node)
    graph.add_node("retriever", retriever_node)
    graph.add_node("compressor", compressor_node)
    
    # Add edges
    graph.set_entry_point("router")
    graph.add_edge("router", "retriever")
    graph.add_edge("retriever", "compressor")
    graph.add_edge("compressor", END)
    
    return graph.compile()

def invoke_agent(query: str) -> Dict[str, Any]:
    """Invoke the agent with a query"""
    graph = build_graph()
    
    initial_state: AgentState = {
        "query": query,
        "intent": "",
        "structured_context": {},
        "vector_results": [],
        "compressed_context": {},
        "response": ""
    }
    
    result = graph.invoke(initial_state)
    return result

def format_context_for_claude(compressed_context: Dict[str, Any]) -> str:
    """Format compressed context for Claude prompt"""
    
    context_str = "=== CONTEXT ===\n\n"
    
    if compressed_context.get("summary"):
        context_str += "SUMMARY:\n"
        for key, value in compressed_context["summary"].items():
            context_str += f"  • {key}: {value}\n"
        context_str += "\n"
    
    if compressed_context.get("structured"):
        context_str += "STRUCTURED DATA:\n"
        context_str += json.dumps(compressed_context["structured"], indent=2)[:500]
        context_str += "\n\n"
    
    if compressed_context.get("vector_results"):
        context_str += "RELEVANT DOCUMENTS:\n"
        for doc in compressed_context["vector_results"][:2]:
            context_str += f"  • {doc['source']} ({doc['type']}):\n"
            context_str += f"    {doc['content']}\n\n"
    
    return context_str

if __name__ == "__main__":
    # Test the graph
    test_queries = [
        "What tables exist in the database?",
        "Explain the ride booking flow",
        "What microservices do we have?"
    ]
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print(f"{'='*60}")
        
        result = invoke_agent(query)
        
        print(f"\n📊 Result:")
        print(f"  Intent: {result['intent']}")
        print(f"  Compressed tokens: {result['compressed_context'].get('estimated_tokens', 'N/A')}")
