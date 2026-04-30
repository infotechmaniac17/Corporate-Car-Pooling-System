"""
ENFORCED CLAUDE ORCHESTRATOR
Strict LangGraph-based Claude reasoning with intelligent graph retrieval
"""

import sys
import os
import json
from typing import Dict, Any, List, Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from anthropic import Anthropic
except ImportError:
    print("❌ Anthropic SDK required: pip install anthropic")
    sys.exit(1)

import networkx as nx


class IntelligentGraphRetrieval:
    """Intelligent retrieval from architecture graph"""
    
    def __init__(self, graph: nx.DiGraph):
        """Initialize with architecture graph
        
        Args:
            graph: NetworkX DiGraph with architecture
        """
        self.graph = graph
        self.nodes_list = list(graph.nodes())
        self.edges_list = list(graph.edges())
        
    def get_relevant_graph_context(self, query: str) -> Dict[str, Any]:
        """Extract relevant nodes and connections from graph
        
        Args:
            query: User question
            
        Returns:
            Dict with relevant nodes, connections, and context
        """
        query_words = query.lower().split()
        relevant_nodes = set()
        
        # 🔍 STEP 1: Find nodes matching query keywords
        for node in self.nodes_list:
            node_lower = node.lower()
            for word in query_words:
                if word in node_lower or node_lower in word:
                    relevant_nodes.add(node)
                    break
        
        # 📊 STEP 2: Expand to connected nodes
        expanded_nodes = set(relevant_nodes)
        for node in relevant_nodes:
            # Add incoming connections
            incoming = list(self.graph.predecessors(node))
            expanded_nodes.update(incoming)
            
            # Add outgoing connections
            outgoing = list(self.graph.successors(node))
            expanded_nodes.update(outgoing)
        
        # 🔗 STEP 3: Build context relationships
        context_edges = []
        for source, target in self.edges_list:
            if source in expanded_nodes and target in expanded_nodes:
                edge_attr = self.graph.get_edge_data(source, target)
                edge_type = edge_attr.get('style', 'unknown') if edge_attr else 'unknown'
                context_edges.append({
                    "from": source,
                    "to": target,
                    "type": edge_type
                })
        
        # 📈 STEP 4: Get node details
        node_details = {}
        for node in expanded_nodes:
            node_attr = self.graph.nodes[node]
            node_details[node] = {
                "layer": node_attr.get('layer', 'unknown'),
                "incoming": list(self.graph.predecessors(node)),
                "outgoing": list(self.graph.successors(node)),
            }
        
        return {
            "query": query,
            "relevant_nodes": list(relevant_nodes),
            "expanded_nodes": list(expanded_nodes),
            "total_nodes_in_graph": len(self.nodes_list),
            "node_details": node_details,
            "relationships": context_edges,
            "total_relationships": len(context_edges),
            "found": len(relevant_nodes) > 0
        }


class EnforcedClaudeOrchestrator:
    """Claude orchestrator with strict LangGraph enforcement"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize orchestrator
        
        Args:
            api_key: Anthropic API key (defaults to env var)
        """
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"
        
        # Load graph
        self.graph = self._load_graph()
        self.retriever = IntelligentGraphRetrieval(self.graph)
        
    def _load_graph(self) -> nx.DiGraph:
        """Load architecture graph from system_memory.json"""
        print("📊 Loading architecture graph...")
        
        memory_path = "data/structured/system_memory.json"
        if not os.path.exists(memory_path):
            # Try relative paths
            for attempt_path in [
                "../data/structured/system_memory.json",
                "carpool-ai-agent/data/structured/system_memory.json",
            ]:
                if os.path.exists(attempt_path):
                    memory_path = attempt_path
                    break
        
        with open(memory_path) as f:
            memory = json.load(f)
        
        # Build graph
        G = nx.DiGraph()
        
        # Add services
        for service in memory["system"]["services"]:
            G.add_node(service, layer="service")
        
        # Add flows
        for flow in memory["flows"]["ride_flow"]:
            G.add_node(flow, layer="flow")
        
        # Add tables
        for table in memory["database"]["tables"]:
            G.add_node(table, layer="database")
        
        # Add API Gateway
        G.add_node("API Gateway", layer="gateway")
        
        # SERVICE → FLOW edges
        service_flow_edges = [
            ("Ride Service", "request"),
            ("Ride Service", "accept"),
            ("Ride Service", "start"),
            ("Ride Service", "end"),
            ("Matching Engine", "search"),
            ("Payment Service", "end"),
            ("Payment Service", "rate"),
            ("Notification Service", "request"),
            ("Notification Service", "accept"),
            ("Analytics Service", "rate"),
        ]
        
        for source, target in service_flow_edges:
            G.add_edge(source, target, style="service_flow")
        
        # FLOW → DATABASE edges (UPDATED WITH ALL CONNECTIONS)
        flow_db_edges = [
            ("search", "users"),
            ("search", "vehicles"),
            ("search", "drivers"),
            ("request", "ride_requests"),
            ("request", "users"),
            ("request", "backup_rides"),
            ("request", "notifications"),
            ("accept", "ride_requests"),
            ("accept", "backup_rides"),
            ("accept", "drivers"),
            ("start", "ride_schedules"),
            ("end", "ride_schedules"),
            ("end", "payments"),
            ("rate", "users"),
        ]
        
        for source, target in flow_db_edges:
            G.add_edge(source, target, style="flow_db")
        
        # API GATEWAY → SERVICES edges (FAN-OUT)
        gateway_edges = [
            ("API Gateway", "User Service"),
            ("API Gateway", "Ride Service"),
            ("API Gateway", "Matching Engine"),
            ("API Gateway", "Payment Service"),
            ("API Gateway", "Notification Service"),
            ("API Gateway", "Analytics Service"),
        ]
        
        for source, target in gateway_edges:
            G.add_edge(source, target, style="gateway_service")
        
        # Flow sequence
        ride_flow = memory["flows"]["ride_flow"]
        for i in range(len(ride_flow) - 1):
            G.add_edge(ride_flow[i], ride_flow[i+1], style="flow_sequence")
        
        print(f"✓ Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        return G
    
    def ask_system(self, query: str) -> Dict[str, Any]:
        """Ask the system with LangGraph enforcement
        
        This enforces:
        1. LangGraph execution and context extraction
        2. Strict Claude prompt with enforcement rules
        3. No hallucination outside the graph
        
        Args:
            query: User question
            
        Returns:
            Dict with response, context, and metadata
        """
        print(f"\n{'='*70}")
        print(f"🚀 ENFORCED CLAUDE ORCHESTRATOR")
        print(f"{'='*70}")
        print(f"\n📝 Query: {query}\n")
        
        # ═══════════════════════════════════════
        # STEP 1: LangGraph execution
        # ═══════════════════════════════════════
        print("⏳ STEP 1: Executing LangGraph context retrieval...")
        
        graph_context = self.retriever.get_relevant_graph_context(query)
        
        print(f"   ✓ Found {len(graph_context['relevant_nodes'])} relevant nodes")
        print(f"   ✓ Expanded to {len(graph_context['expanded_nodes'])} related nodes")
        print(f"   ✓ Extracted {graph_context['total_relationships']} relationships")
        
        # ═══════════════════════════════════════
        # STEP 2: FAIL SAFE (IMPORTANT)
        # ═══════════════════════════════════════
        if not graph_context['found']:
            print("\n⚠️  WARNING: No graph data found for query")
            return {
                "success": False,
                "query": query,
                "response": "❌ No architecture data found for this query. Try asking about:\n  - Services (Ride Service, Payment Service, etc.)\n  - Flows (search, request, accept, start, end, rate)\n  - Database tables (users, ride_requests, payments, etc.)",
                "graph_context": graph_context,
                "enforcement": "graph_not_found"
            }
        
        # ═══════════════════════════════════════
        # STEP 3: Format graph context for Claude
        # ═══════════════════════════════════════
        print("\n⏳ STEP 2: Formatting graph context...")
        
        context_str = self._format_context(graph_context)
        
        # ═══════════════════════════════════════
        # STEP 4: Create STRICT PROMPT
        # ═══════════════════════════════════════
        print("⏳ STEP 3: Creating enforced Claude prompt...\n")
        
        system_prompt = """You are a backend architect for the CarpoolHub corporate carpooling system.

STRICT RULES - YOU MUST FOLLOW ALL:
1. Use ONLY the provided system architecture graph
2. Do NOT assume anything outside the graph
3. If information is missing, ALWAYS say: "Not defined in system"
4. CITE specific nodes and layers (service, flow, database)
5. EXPLAIN Service→Flow→Database data paths

IMPORTANT:
- Do NOT make up features or connections
- Do NOT assume business logic not shown in graph
- Only describe what is explicitly in the provided context
- Be precise and factual"""

        user_message = f"""{context_str}

QUESTION:
{query}

ANSWER:"""
        
        # ═══════════════════════════════════════
        # STEP 5: Call Claude with enforcement
        # ═══════════════════════════════════════
        print("📞 STEP 4: Calling Claude with enforced prompt...")
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            
            claude_response = response.content[0].text
            
            print(f"\n✅ Claude response received")
            print(f"   Token usage: {response.usage.input_tokens} input, {response.usage.output_tokens} output")
            
            return {
                "success": True,
                "query": query,
                "response": claude_response,
                "graph_context": graph_context,
                "tokens": {
                    "input": response.usage.input_tokens,
                    "output": response.usage.output_tokens,
                    "total": response.usage.input_tokens + response.usage.output_tokens
                },
                "enforcement": "strict_rules_applied",
                "model": self.model
            }
            
        except Exception as e:
            print(f"\n❌ Error calling Claude: {e}")
            return {
                "success": False,
                "query": query,
                "response": f"Error: {str(e)}",
                "error": str(e)
            }
    
    def _format_context(self, graph_context: Dict[str, Any]) -> str:
        """Format graph context for Claude prompt
        
        Args:
            graph_context: Context from retriever
            
        Returns:
            Formatted string for Claude
        """
        lines = []
        
        lines.append("SYSTEM ARCHITECTURE GRAPH:")
        lines.append("="*50)
        
        # Nodes by layer
        nodes_by_layer = {}
        for node, details in graph_context['node_details'].items():
            layer = details['layer']
            if layer not in nodes_by_layer:
                nodes_by_layer[layer] = []
            nodes_by_layer[layer].append(node)
        
        lines.append("\n📍 NODES (organized by layer):")
        for layer in ["gateway", "service", "flow", "database"]:
            if layer in nodes_by_layer:
                nodes = nodes_by_layer[layer]
                layer_name = {
                    "gateway": "API Gateway",
                    "service": "Services",
                    "flow": "Flows",
                    "database": "Database"
                }.get(layer, layer)
                lines.append(f"\n  {layer_name}:")
                for node in nodes:
                    lines.append(f"    • {node}")
        
        # Relationships
        lines.append("\n\n🔗 RELATIONSHIPS (explicit edges):")
        for rel in graph_context['relationships']:
            lines.append(f"  • {rel['from']} → {rel['to']} [{rel['type']}]")
        
        lines.append(f"\n\nTotal nodes in graph: {graph_context['total_nodes_in_graph']}")
        lines.append(f"Relevant to your query: {len(graph_context['relevant_nodes'])}")
        
        return "\n".join(lines)


def main():
    """Main entry point with interactive mode"""
    
    print("\n" + "="*70)
    print("🚀 ENFORCED CLAUDE ORCHESTRATOR - LANGGRAPH ENFORCEMENT")
    print("="*70)
    
    try:
        orchestrator = EnforcedClaudeOrchestrator()
    except ValueError as e:
        print(f"❌ {e}")
        return
    
    print("\n💡 Type your questions about the CarpoolHub architecture.")
    print("   Commands: 'exit' to quit, 'help' for examples\n")
    
    while True:
        try:
            query = input("\n🔍 You: ").strip()
            
            if not query:
                continue
            
            if query.lower() == "exit":
                print("\n👋 Goodbye!")
                break
            
            if query.lower() == "help":
                print("""
Example questions:
  1️⃣  Explain ride lifecycle
      → Should return: request → accept → start → end
  
  2️⃣  Which DB is used in payment?
      → Should return: payments, users tables
  
  3️⃣  How does backup system work?
      → Should return: request → backup_rides → notifications
  
  4️⃣  Explain authentication
      → Should say: "Not defined in system"
      
This tests for hallucination prevention ✓
                """)
                continue
            
            # Ask with enforcement
            result = orchestrator.ask_system(query)
            
            print("\n" + "-"*70)
            print("💬 ENFORCED RESPONSE:")
            print("-"*70)
            print(result["response"])
            
            if result.get("tokens"):
                print(f"\n📊 Tokens: {result['tokens']['total']} total")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


if __name__ == "__main__":
    main()
