# -*- coding: utf-8 -*-
"""
langgraph_context_retrieval.py
LangGraph-based architecture graph context retrieval for Claude
"""

import json
import os
import sys
import io
from typing import Dict, List, Any

# Fix Unicode encoding on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Change to carpool-ai-agent directory if needed
if not os.path.exists("data/structured/system_memory.json"):
    if os.path.exists("carpool-ai-agent"):
        os.chdir("carpool-ai-agent")
    else:
        current = os.path.basename(os.getcwd())
        if current != "carpool-ai-agent":
            for i in range(3):
                if os.path.exists("data/structured/system_memory.json"):
                    break
                os.chdir("..")
                if os.path.exists("carpool-ai-agent"):
                    os.chdir("carpool-ai-agent")
                    break

try:
    import networkx as nx
    from graph_to_context import build_graph, GraphContextConverter
except ImportError:
    print("Error: Missing dependencies. Install with: pip install networkx")

class LangGraphContextRetrieval:
    """LangGraph-based context retrieval from architecture graph"""
    
    def __init__(self):
        """Initialize graph and converter"""
        print("\n" + "="*70)
        print("INITIALIZING LANGGRAPH CONTEXT RETRIEVAL")
        print("="*70)
        
        # Load graph
        self.graph = build_graph()
        
        # Load memory
        with open("data/structured/system_memory.json") as f:
            self.memory = json.load(f)
        
        # Create converter
        self.converter = GraphContextConverter(self.graph, self.memory)
        
        print(f"\n✓ Graph loaded: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")
        print("✓ Ready for context retrieval")
    
    def get_graph_context(self, query: str) -> Dict[str, Any]:
        """Get relevant graph context for query
        
        Args:
            query: User question
        
        Returns:
            {
                "query": original query,
                "relevant_nodes": [...],
                "context": formatted string for Claude,
                "found": bool
            }
        """
        
        # Get relevant nodes using graph-aware matching
        relevant_nodes = self.converter.get_relevant_graph_context(query)
        
        if not relevant_nodes:
            return {
                "query": query,
                "relevant_nodes": [],
                "context": f"❌ No nodes found matching '{query}'",
                "found": False
            }
        
        # Format context for Claude
        context_lines = [f"ARCHITECTURE GRAPH CONTEXT FOR: {query}\n"]
        context_lines.append(f"Found {len(relevant_nodes)} relevant node(s):\n")
        
        for node_data in relevant_nodes:
            node = node_data["node"]
            layer = node_data["layer"]
            incoming = node_data["connected_from"]
            outgoing = node_data["connected_to"]
            
            context_lines.append(f"\n📍 {node} (Layer: {layer})")
            
            if incoming:
                context_lines.append(f"   ← Connected from: {', '.join(incoming)}")
            
            if outgoing:
                context_lines.append(f"   → Connected to: {', '.join(outgoing)}")
        
        context_str = "\n".join(context_lines)
        
        return {
            "query": query,
            "relevant_nodes": relevant_nodes,
            "context": context_str,
            "found": True
        }
    
    def create_claude_prompt(self, query: str, graph_context: Dict[str, Any]) -> str:
        """Create prompt for Claude with graph enforcement
        
        Args:
            query: User question
            graph_context: Result from get_graph_context()
        
        Returns:
            Formatted prompt for Claude
        """
        
        if not graph_context["found"]:
            return f"""You are a system architect.

The user asked: "{query}"

However, this query does not match any nodes in the architecture graph.

Please respond with:
"❌ Not defined in architecture graph: {query}"

Do NOT make assumptions or hallucinate."""
        
        prompt = f"""You are an expert system architect for CarpoolHub.

STRICT RULES - YOU MUST FOLLOW:
1. Use ONLY the provided graph context below
2. Do NOT assume anything outside the graph
3. If information is not in the graph, say "Not defined in graph"
4. Cite specific nodes and their connections
5. Explain the data flow through layers (Service→Flow→Database)

{graph_context['context']}

USER QUESTION:
{query}

ANSWER USING ONLY THE GRAPH CONTEXT ABOVE:
"""
        
        return prompt
    
    def query_system(self, question: str) -> Dict[str, Any]:
        """Query the system with graph enforcement
        
        Args:
            question: User question
        
        Returns:
            {
                "question": original,
                "graph_context": context data,
                "claude_prompt": prompt to send,
                "ready_for_claude": bool
            }
        """
        
        print(f"\n{'='*70}")
        print(f"QUERY: {question}")
        print(f"{'='*70}")
        
        # Get graph context
        graph_ctx = self.get_graph_context(question)
        
        print(f"\nGraph Search Results:")
        print(graph_ctx["context"])
        
        # Create Claude prompt
        claude_prompt = self.create_claude_prompt(question, graph_ctx)
        
        result = {
            "question": question,
            "graph_context": graph_ctx,
            "claude_prompt": claude_prompt,
            "ready_for_claude": graph_ctx["found"]
        }
        
        print(f"\n✓ Graph context extracted, ready for Claude")
        
        return result

def test_queries():
    """Test with 3 verification queries"""
    
    retrieval = LangGraphContextRetrieval()
    
    # Test queries
    test_cases = [
        {
            "query": "Explain ride service",
            "expected": ["request", "accept", "start", "end"],
            "description": "SERVICE → FLOW mapping"
        },
        {
            "query": "Which tables are used in request?",
            "expected": ["ride_requests", "backup_rides", "notifications"],
            "description": "FLOW → DATABASE mapping"
        },
        {
            "query": "Explain payment flow",
            "expected": ["end", "payments"],
            "description": "FLOW → DATABASE for payments"
        },
    ]
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║     TESTING LANGGRAPH CONTEXT RETRIEVAL (3 Tests)        ║
    ║                                                            ║
    ║  These queries should ONLY find graph data               ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    for i, test in enumerate(test_cases, 1):
        query = test["query"]
        expected = test["expected"]
        description = test["description"]
        
        print(f"\n{'─'*70}")
        print(f"TEST {i}: {description}")
        print(f"{'─'*70}")
        print(f"❓ Query: {query}\n")
        
        # Run query
        result = retrieval.query_system(query)
        
        # Check results
        found_nodes = [n["node"] for n in result["graph_context"]["relevant_nodes"]]
        
        # Get all connections from found nodes
        all_connected = set()
        for node_data in result["graph_context"]["relevant_nodes"]:
            all_connected.add(node_data["node"])
            all_connected.update(node_data["connected_to"])
        
        # Check if expected items found
        matches = [e for e in expected if e in all_connected]
        
        print(f"\n📊 Results:")
        print(f"   Found nodes: {found_nodes}")
        print(f"   Connected nodes: {all_connected}")
        print(f"   Expected: {expected}")
        print(f"   Matched: {matches}/{len(expected)}")
        
        if matches:
            print(f"\n✅ TEST {i} PASSED - Found {len(matches)}/{len(expected)} expected")
        else:
            print(f"\n⚠️ TEST {i} - No matches found")
        
        # Show Claude prompt
        print(f"\nClaude Prompt:")
        print("-" * 70)
        print(result["claude_prompt"][:200] + "...")
        print("-" * 70)

def main():
    """Main execution"""
    
    # Run tests
    test_queries()
    
    print("""
    
    ╔═══════════════════════════════════════════════════════════╗
    ║                  TESTING COMPLETE                         ║
    ║                                                            ║
    ║  Graph context is now:                                   ║
    ║  • Extracted from architecture                           ║
    ║  • Formatted for Claude                                  ║
    ║  • Ready for strict enforcement                          ║
    ║                                                            ║
    ║  Next: Pass claude_prompt to Claude API                  ║
    ╚═══════════════════════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    main()
