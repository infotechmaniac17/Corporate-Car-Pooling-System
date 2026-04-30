# -*- coding: utf-8 -*-
"""
graph_to_context.py
Convert graph to minimal context for Claude queries
"""

import json
import os
import sys
import io
import networkx as nx

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

def build_graph():
    """Build the clean layered architecture graph"""
    
    with open("data/structured/system_memory.json") as f:
        memory = json.load(f)
    
    G = nx.DiGraph()
    
    # Layer 1: Services
    services = memory["system"]["services"]
    for s in services:
        G.add_node(s, layer="service")
    
    # Layer 2: Flows
    ride_flow = memory["flows"]["ride_flow"]
    for f in ride_flow:
        G.add_node(f, layer="flow")
    
    # Layer 3: Database
    tables = memory["database"]["tables"]
    for t in tables:
        G.add_node(t, layer="database")
    
    # Service → Flow edges
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
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="service_flow")
    
    # Flow → Database edges
    flow_db_edges = [
        ("search", "users"),
        ("search", "vehicles"),
        ("request", "ride_requests"),
        ("accept", "ride_requests"),
        ("start", "ride_schedules"),
        ("end", "ride_schedules"),
        ("rate", "users"),
        ("end", "payments"),
        ("request", "backup_rides"),
        ("accept", "backup_rides"),
        ("request", "notifications"),
    ]
    
    for source, target in flow_db_edges:
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="flow_db")
    
    # API Gateway → Services edges
    gateway_edges = [
        ("API Gateway", "User Service"),
        ("API Gateway", "Ride Service"),
        ("API Gateway", "Matching Engine"),
        ("API Gateway", "Payment Service"),
        ("API Gateway", "Notification Service"),
        ("API Gateway", "Analytics Service"),
    ]
    
    for source, target in gateway_edges:
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="gateway_service")
    
    for i in range(len(ride_flow) - 1):
        G.add_edge(ride_flow[i], ride_flow[i+1], style="flow_sequence")
    
    return G

class GraphContextConverter:
    """Convert graph queries to minimal context for Claude"""
    
    def __init__(self, graph, memory):
        """Initialize converter
        
        Args:
            graph: NetworkX DiGraph
            memory: System memory dict
        """
        self.graph = graph
        self.memory = memory
    
    def get_node_info(self, node):
        """Get information about a specific node"""
        
        if node not in self.graph.nodes:
            return None
        
        node_attr = self.graph.nodes[node]
        layer = node_attr.get("layer", "unknown")
        
        # Get connections
        incoming = list(self.graph.predecessors(node))
        outgoing = list(self.graph.successors(node))
        
        return {
            "node": node,
            "layer": layer,
            "incoming": incoming,
            "outgoing": outgoing,
            "in_degree": self.graph.in_degree(node),
            "out_degree": self.graph.out_degree(node),
        }
    
    def find_relevant_nodes(self, intent, limit=10):
        """Find nodes matching intent
        
        Args:
            intent: Query intent (e.g., "ride service", "payment flow")
            limit: Max nodes to return
        
        Returns:
            List of relevant nodes with context
        """
        
        intent_lower = intent.lower()
        relevant = []
        
        # Exact match first
        for node in self.graph.nodes:
            if intent_lower in node.lower():
                info = self.get_node_info(node)
                relevant.append(info)
        
        # Limit results
        return relevant[:limit]
    
    def get_service_context(self, service_name):
        """Get context for a service
        
        Args:
            service_name: Name of service
        
        Returns:
            Dict with service and connected flows/databases
        """
        
        node_info = self.get_node_info(service_name)
        
        if not node_info or node_info["layer"] != "service":
            return None
        
        # Get flows this service activates
        connected_flows = node_info["outgoing"]
        
        # Get databases from flows
        connected_dbs = []
        for flow in connected_flows:
            db_connections = self.graph.successors(flow)
            connected_dbs.extend(db_connections)
        
        return {
            "service": service_name,
            "activates_flows": connected_flows,
            "updates_databases": list(set(connected_dbs)),
        }
    
    def get_flow_context(self, flow_name):
        """Get context for a flow
        
        Args:
            flow_name: Name of flow step
        
        Returns:
            Dict with flow sequence and database impact
        """
        
        node_info = self.get_node_info(flow_name)
        
        if not node_info or node_info["layer"] != "flow":
            return None
        
        # Get flow sequence (predecessors and successors)
        previous_steps = node_info["incoming"]
        next_steps = node_info["outgoing"]
        
        # Filter to only flow steps (not services)
        previous_steps = [s for s in previous_steps 
                         if self.graph.nodes[s].get("layer") == "flow"]
        next_steps = [s for s in next_steps 
                     if self.graph.nodes[s].get("layer") == "flow"]
        
        # Get database impact
        databases_updated = [s for s in node_info["outgoing"]
                           if self.graph.nodes[s].get("layer") == "database"]
        
        return {
            "flow_step": flow_name,
            "previous_steps": previous_steps,
            "next_steps": next_steps,
            "updates_databases": databases_updated,
        }
    
    def get_database_context(self, table_name):
        """Get context for a database table
        
        Args:
            table_name: Name of database table
        
        Returns:
            Dict with table and connected flows/services
        """
        
        node_info = self.get_node_info(table_name)
        
        if not node_info or node_info["layer"] != "database":
            return None
        
        # Get flows that update this table
        connected_flows = node_info["incoming"]
        
        # Get services that trigger those flows
        connected_services = []
        for flow in connected_flows:
            if self.graph.nodes[flow].get("layer") == "flow":
                service_connections = self.graph.predecessors(flow)
                connected_services.extend(service_connections)
        
        return {
            "table": table_name,
            "updated_by_flows": connected_flows,
            "triggered_by_services": list(set(connected_services)),
        }
    
    def get_relevant_graph_context(self, query_str):
        """Extract relevant graph context for LangGraph queries
        
        Returns nodes and connections matching the query.
        
        Args:
            query_str: User query
        
        Returns:
            List of {node, layer, incoming, outgoing}
        """
        
        query_lower = query_str.lower()
        result = []
        visited = set()
        
        # Find all matching nodes
        for node in self.graph.nodes:
            node_lower = node.lower()
            
            # Keyword matching
            if (query_lower in node_lower or 
                node_lower in query_lower or
                any(word in query_lower for word in node_lower.split())):
                
                if node not in visited:
                    visited.add(node)
                    
                    # Get connections
                    incoming = list(self.graph.predecessors(node))
                    outgoing = list(self.graph.successors(node))
                    node_layer = self.graph.nodes[node].get("layer", "unknown")
                    
                    result.append({
                        "node": node,
                        "layer": node_layer,
                        "connected_from": incoming,
                        "connected_to": outgoing,
                    })
        
        return result
    
    def query(self, question):
        """Convert question to graph context
        
        Args:
            question: User question
        
        Returns:
            Dict with relevant context for Claude
        """
        
        question_lower = question.lower()
        context = {}
        
        # Detect intent
        if "service" in question_lower:
            # Find service
            for node in self.graph.nodes:
                if self.graph.nodes[node].get("layer") == "service":
                    if node.lower() in question_lower or question_lower in node.lower():
                        context["type"] = "service"
                        context["data"] = self.get_service_context(node)
                        break
        
        elif "flow" in question_lower or "step" in question_lower:
            # Find flow
            for node in self.graph.nodes:
                if self.graph.nodes[node].get("layer") == "flow":
                    if node.lower() in question_lower or question_lower in node.lower():
                        context["type"] = "flow"
                        context["data"] = self.get_flow_context(node)
                        break
        
        elif "database" in question_lower or "table" in question_lower:
            # Find database table
            for node in self.graph.nodes:
                if self.graph.nodes[node].get("layer") == "database":
                    if node.lower() in question_lower or question_lower in node.lower():
                        context["type"] = "database"
                        context["data"] = self.get_database_context(node)
                        break
        
        elif "diagram" in question_lower or "graph" in question_lower or "all" in question_lower:
            # Return full graph structure
            context["type"] = "full_graph"
            context["data"] = {
                "services": [n for n in self.graph.nodes if self.graph.nodes[n].get("layer") == "service"],
                "flows": [n for n in self.graph.nodes if self.graph.nodes[n].get("layer") == "flow"],
                "databases": [n for n in self.graph.nodes if self.graph.nodes[n].get("layer") == "database"],
                "total_nodes": self.graph.number_of_nodes(),
                "total_edges": self.graph.number_of_edges(),
            }
        
        else:
            # Generic search
            context["type"] = "search"
            context["data"] = self.find_relevant_nodes(question)
        
        # Add query metadata
        context["query"] = question
        context["timestamp"] = __import__('datetime').datetime.now().isoformat()
        
        return context
    
    def context_to_string(self, context):
        """Convert context dict to formatted string for Claude
        
        Args:
            context: Context dict from query()
        
        Returns:
            Formatted string for Claude prompt
        """
        
        lines = []
        lines.append(f"GRAPH CONTEXT (Type: {context['type']})")
        lines.append(f"Query: {context['query']}")
        lines.append("")
        
        data = context.get("data", {})
        
        if context["type"] == "service":
            if data:
                lines.append(f"SERVICE: {data['service']}")
                lines.append(f"Activates Flows: {', '.join(data['activates_flows'])}")
                lines.append(f"Updates Databases: {', '.join(data['updates_databases'])}")
        
        elif context["type"] == "flow":
            if data:
                lines.append(f"FLOW STEP: {data['flow_step']}")
                if data['previous_steps']:
                    lines.append(f"Previous Steps: {', '.join(data['previous_steps'])}")
                if data['next_steps']:
                    lines.append(f"Next Steps: {', '.join(data['next_steps'])}")
                lines.append(f"Updates Databases: {', '.join(data['updates_databases'])}")
        
        elif context["type"] == "database":
            if data:
                lines.append(f"DATABASE TABLE: {data['table']}")
                lines.append(f"Updated By Flows: {', '.join(data['updated_by_flows'])}")
                lines.append(f"Triggered By Services: {', '.join(data['triggered_by_services'])}")
        
        elif context["type"] == "full_graph":
            if data:
                lines.append(f"FULL GRAPH STRUCTURE")
                lines.append(f"Services: {len(data['services'])} - {', '.join(data['services'][:3])}...")
                lines.append(f"Flows: {len(data['flows'])} - {', '.join(data['flows'][:3])}...")
                lines.append(f"Databases: {len(data['databases'])} - {', '.join(data['databases'][:3])}...")
                lines.append(f"Total: {data['total_nodes']} nodes, {data['total_edges']} edges")
        
        elif context["type"] == "search":
            if data:
                lines.append(f"SEARCH RESULTS ({len(data)} nodes found)")
                for node_data in data[:5]:
                    lines.append(f"• {node_data['node']} ({node_data['layer']})")
        
        return "\n".join(lines)

def main():
    """Test the converter"""
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║      GRAPH-TO-CONTEXT CONVERTER                          ║
    ║         (Step 3 - Claude Context Preparation)            ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Build graph
    print("\n📍 Building graph...")
    G = build_graph()
    print(f"✓ Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    # Load memory
    with open("data/structured/system_memory.json") as f:
        memory = json.load(f)
    
    # Create converter
    converter = GraphContextConverter(G, memory)
    
    # Test queries
    test_queries = [
        "Explain the Ride Service",
        "What is the payment flow?",
        "Which database stores payments?",
        "Show me the full diagram",
        "How does search work?",
    ]
    
    print("\n" + "="*70)
    print("TEST QUERIES")
    print("="*70)
    
    for query in test_queries:
        print(f"\n❓ Query: {query}")
        context = converter.query(query)
        context_str = converter.context_to_string(context)
        print(f"\n{context_str}")
        print(f"{'─'*70}")

if __name__ == "__main__":
    main()
