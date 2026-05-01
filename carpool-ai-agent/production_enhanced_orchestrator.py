"""
PRODUCTION-ENHANCED ORCHESTRATOR
Production-ready features: validation, synonyms, multi-hop, logging, error handling
"""

import sys
import os
import io
import json
import logging
from typing import Dict, Any, List, Set, Optional
from datetime import datetime
import networkx as nx

# Setup logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('orchestrator_production.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class GraphValidator:
    """Validate graph structure for production correctness"""
    
    def __init__(self, graph: nx.DiGraph, system_memory: Dict[str, Any]):
        """Initialize validator
        
        Args:
            graph: NetworkX DiGraph
            system_memory: Architecture memory dict
        """
        self.graph = graph
        self.memory = system_memory
        self.issues = []
        
    def validate_all(self) -> Dict[str, Any]:
        """Run all validation checks
        
        Returns:
            Dict with validation results and issues
        """
        logger.info("[INFO] Starting graph validation...")
        
        self.issues = []
        
        # Check 1: Orphan nodes
        self._check_orphan_nodes()
        
        # Check 2: Missing critical nodes
        self._check_critical_nodes()
        
        # Check 3: Edge consistency
        self._check_edge_consistency()
        
        # Check 4: Isolated components
        self._check_isolated_components()
        
        # Check 5: Node layer consistency
        self._check_layer_consistency()
        
        logger.info(f"[OK] Validation complete: {len(self.issues)} issues found")
        
        return {
            "valid": len(self.issues) == 0,
            "issues": self.issues,
            "issue_count": len(self.issues),
            "graph_nodes": self.graph.number_of_nodes(),
            "graph_edges": self.graph.number_of_edges(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _check_orphan_nodes(self):
        """Check for orphan nodes (0 connections)"""
        logger.info("  Checking for orphan nodes...")
        
        for node in self.graph.nodes():
            in_degree = self.graph.in_degree(node)
            out_degree = self.graph.out_degree(node)
            
            if in_degree == 0 and out_degree == 0:
                issue = f"Orphan node (0 connections): {node}"
                self.issues.append(issue)
                logger.warning(f"    [WARN] {issue}")
    
    def _check_critical_nodes(self):
        """Check for required critical nodes"""
        logger.info("  Checking for critical nodes...")
        
        required_nodes = [
            "API Gateway",
            "Ride Service",
            "request",
            "accept",
            "ride_requests",
            "users"
        ]
        
        for node in required_nodes:
            if node not in self.graph.nodes():
                issue = f"Missing critical node: {node}"
                self.issues.append(issue)
                logger.warning(f"    [WARN] {issue}")
    
    def _check_edge_consistency(self):
        """Check edge consistency"""
        logger.info("  Checking edge consistency...")
        
        expected_edges = [
            ("API Gateway", "Ride Service"),
            ("Ride Service", "request"),
            ("request", "ride_requests"),
            ("search", "users"),
        ]
        
        for source, target in expected_edges:
            if source not in self.graph.nodes() or target not in self.graph.nodes():
                continue
            
            if not self.graph.has_edge(source, target):
                issue = f"Missing expected edge: {source} -> {target}"
                self.issues.append(issue)
                logger.warning(f"    [WARN] {issue}")
    
    def _check_isolated_components(self):
        """Check for isolated graph components"""
        logger.info("  Checking for isolated components...")
        
        # Convert to undirected for component analysis
        undirected = self.graph.to_undirected()
        components = list(nx.connected_components(undirected))
        
        if len(components) > 1:
            for i, component in enumerate(components):
                if len(component) < 3:  # Small isolated component
                    issue = f"Isolated component {i}: {component}"
                    self.issues.append(issue)
                logger.warning(f"    [WARN] {issue}")
        """Check layer attribute consistency"""
        logger.info("  Checking layer consistency...")
        
        valid_layers = {"gateway", "service", "flow", "database"}
        
        for node, attr in self.graph.nodes(data=True):
            layer = attr.get("layer", "unknown")
            if layer not in valid_layers:
                issue = f"Invalid layer for {node}: {layer}"
                self.issues.append(issue)
                logger.warning(f"    [WARN] {issue}")


class SynonymMapper:
    """Map user queries to graph nodes using synonyms"""
    
    def __init__(self):
        """Initialize with synonym mappings"""
        self.synonyms = {
            # Flow-related
            "booking": ["request", "book"],
            "ride booking": ["request"],
            "match": ["search", "accept"],
            "driver search": ["search"],
            "scheduling": ["start", "end"],
            
            # Service-related
            "payment": ["Payment Service", "payments"],
            "notification": ["Notification Service", "notifications"],
            "matching": ["Matching Engine"],
            "ride": ["Ride Service"],
            "user": ["User Service", "users"],
            "analytics": ["Analytics Service"],
            
            # Database-related
            "user data": ["users"],
            "user table": ["users"],
            "booking record": ["ride_requests"],
            "payment record": ["payments"],
            "driver data": ["drivers"],
            "vehicle data": ["vehicles"],
            "backup ride": ["backup_rides"],
            "schedule": ["ride_schedules"],
            
            # Process-related
            "end-to-end": ["full flow", "complete journey"],
            "full flow": ["search", "request", "accept", "start", "end", "rate"],
            "lifecycle": ["search", "request", "accept", "start", "end", "rate"],
        }
        
        logger.info(f"Loaded {len(self.synonyms)} synonym groups")
    
    def expand_query(self, query: str) -> List[str]:
        """Expand query with synonyms
        
        Args:
            query: User query
            
        Returns:
            List of expanded terms
        """
        query_lower = query.lower()
        expanded = set(query_lower.split())
        
        # Check for synonym matches
        for synonym_group, terms in self.synonyms.items():
            if synonym_group.lower() in query_lower:
                expanded.update(terms)
                logger.info(f"  [MATCH] Synonym match: '{synonym_group}' -> {terms}")
        
        return list(expanded)


class MultiHopReasoner:
    """Multi-hop graph traversal for reasoning"""
    
    def __init__(self, graph: nx.DiGraph):
        """Initialize reasoner
        
        Args:
            graph: NetworkX DiGraph
        """
        self.graph = graph
    
    def get_multi_hop_context(self, start_node: str, depth: int = 2) -> Dict[str, Any]:
        """Get multi-hop context with traversal
        
        Args:
            start_node: Starting node
            depth: Traversal depth (default 2 hops)
            
        Returns:
            Dict with nodes found at each hop
        """
        logger.info(f"[TRACE] Multi-hop traversal from '{start_node}' (depth={depth})")
        
        if start_node not in self.graph.nodes():
            logger.warning(f"  [WARN] Start node '{start_node}' not in graph")
            return {
                "start_node": start_node,
                "found": False,
                "hops": {}
            }
        
        hops = {}
        current_layer = {start_node}
        all_nodes = {start_node}
        
        for hop in range(1, depth + 1):
            next_layer = set()
            
            for node in current_layer:
                # Get outgoing neighbors
                outgoing = set(self.graph.successors(node))
                next_layer.update(outgoing)
                all_nodes.update(outgoing)
            
            hops[f"hop_{hop}"] = list(next_layer)
        logger.info(f"  Hop {hop}: {len(next_layer)} nodes")
            
            current_layer = next_layer
            if not next_layer:  # No more neighbors
                break
        
        return {
            "start_node": start_node,
            "found": True,
            "depth": depth,
            "hops": hops,
            "total_nodes": len(all_nodes),
            "all_nodes": list(all_nodes)
        }
    
    def find_path(self, source: str, target: str) -> Optional[List[str]]:
        """Find shortest path between nodes
        
        Args:
            source: Source node
            target: Target node
            
        Returns:
            Shortest path or None if not found
        """
        try:
            path = nx.shortest_path(self.graph, source, target)
            logger.info(f"  📍 Path found: {' → '.join(path)}")
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            logger.warning(f"  [WARN] No path from '{source}' to '{target}'")
            return None


class ProductionEnhancedOrchestrator:
    """Production-ready orchestrator with all features"""
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize with all production features
        
        Args:
            api_key: Anthropic API key
        """
        logger.info("🚀 Initializing Production-Enhanced Orchestrator...")
        
        # Load graph
        self.graph = self._load_graph()
        self.memory = self._load_memory()
        
        # Initialize validators and reasoners
        self.validator = GraphValidator(self.graph, self.memory)
        self.synonym_mapper = SynonymMapper()
        self.multi_hop_reasoner = MultiHopReasoner(self.graph)
        
        # Run initial validation
        validation_result = self.validator.validate_all()
        if validation_result["valid"]:
            logger.info("✅ Graph validation PASSED")
        else:
            logger.warning(f"⚠️  Graph validation found {validation_result['issue_count']} issues")
            for issue in validation_result["issues"]:
                logger.warning(f"    - {issue}")
        
        self.validation_result = validation_result
        
        # Try to import Claude (optional for testing)
        try:
            from anthropic import Anthropic
            self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
            if self.api_key:
                self.client = Anthropic(api_key=self.api_key)
                self.model = "claude-3-5-sonnet-20241022"
                logger.info("[OK] Anthropic client initialized")
            else:
                self.client = None
                logger.warning("[WARN] No ANTHROPIC_API_KEY found")
        except ImportError:
            self.client = None
            logger.warning("[WARN] Anthropic SDK not available")
    
    def _load_graph(self) -> nx.DiGraph:
        """Load architecture graph"""
        logger.info("📊 Loading architecture graph...")
        
        memory_path = "data/structured/system_memory.json"
        if not os.path.exists(memory_path):
            for attempt in [
                "../data/structured/system_memory.json",
                "carpool-ai-agent/data/structured/system_memory.json",
            ]:
                if os.path.exists(attempt):
                    memory_path = attempt
                    break
        
        with open(memory_path) as f:
            memory = json.load(f)
        
        G = nx.DiGraph()
        
        # Add nodes
        for service in memory["system"]["services"]:
            G.add_node(service, layer="service")
        for flow in memory["flows"]["ride_flow"]:
            G.add_node(flow, layer="flow")
        for table in memory["database"]["tables"]:
            G.add_node(table, layer="database")
        G.add_node("API Gateway", layer="gateway")
        
        # Add edges
        service_flow = [
            ("Ride Service", "request"), ("Ride Service", "accept"), ("Ride Service", "start"), ("Ride Service", "end"),
            ("Matching Engine", "search"), ("Payment Service", "end"), ("Payment Service", "rate"),
            ("Notification Service", "request"), ("Notification Service", "accept"), ("Analytics Service", "rate"),
        ]
        for s, t in service_flow:
            G.add_edge(s, t, style="service_flow")
        
        flow_db = [
            ("search", "users"), ("search", "vehicles"), ("search", "drivers"),
            ("request", "ride_requests"), ("request", "users"), ("request", "backup_rides"), ("request", "notifications"),
            ("accept", "ride_requests"), ("accept", "backup_rides"), ("accept", "drivers"),
            ("start", "ride_schedules"), ("end", "ride_schedules"), ("end", "payments"), ("rate", "users"),
        ]
        for s, t in flow_db:
            G.add_edge(s, t, style="flow_db")
        
        gateway = [
            ("API Gateway", "User Service"), ("API Gateway", "Ride Service"), ("API Gateway", "Matching Engine"),
            ("API Gateway", "Payment Service"), ("API Gateway", "Notification Service"), ("API Gateway", "Analytics Service"),
        ]
        for s, t in gateway:
            G.add_edge(s, t, style="gateway_service")
        
        # Flow sequence
        ride_flow = memory["flows"]["ride_flow"]
        for i in range(len(ride_flow) - 1):
            G.add_edge(ride_flow[i], ride_flow[i+1], style="flow_sequence")
        
        logger.info(f"[OK] Graph loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        return G
    
    def _load_memory(self) -> Dict[str, Any]:
        """Load system memory"""
        memory_path = "data/structured/system_memory.json"
        if not os.path.exists(memory_path):
            for attempt in [
                "../data/structured/system_memory.json",
                "carpool-ai-agent/data/structured/system_memory.json",
            ]:
                if os.path.exists(attempt):
                    memory_path = attempt
                    break
        
        with open(memory_path) as f:
            return json.load(f)
    
    def query(self, query: str, enable_multi_hop: bool = True) -> Dict[str, Any]:
        """Process query with all production features
        
        Args:
            query: User query
            enable_multi_hop: Use multi-hop reasoning
            
        Returns:
            Dict with results and reasoning
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"[QUERY] {query}")
        logger.info(f"{'='*70}")
        
        result = {
            "query": query,
            "timestamp": datetime.now().isoformat(),
            "steps": {}
        }
        
        # STEP 1: Query expansion with synonyms
        logger.info("\n[STEP1] Query Expansion (Synonym Mapping)")
        expanded_terms = self.synonym_mapper.expand_query(query)
        result["steps"]["query_expansion"] = {
            "original": query,
            "expanded_terms": expanded_terms,
            "count": len(expanded_terms)
        }
        logger.info(f"[OK] Expanded to {len(expanded_terms)} terms")
        
        # STEP 2: Find relevant nodes
        logger.info("\n[STEP2] Node Matching")
        relevant_nodes = []
        for node in self.graph.nodes():
            node_lower = node.lower()
            for term in expanded_terms:
                if term in node_lower or node_lower in term:
                    relevant_nodes.append(node)
                    break
        
        result["steps"]["node_matching"] = {
            "relevant_nodes": relevant_nodes,
            "count": len(relevant_nodes)
        }
        logger.info(f"[OK] Found {len(relevant_nodes)} relevant nodes")
        
        # STEP 3: Multi-hop reasoning
        if enable_multi_hop and relevant_nodes:
            logger.info("\n[STEP3] Multi-hop Reasoning")
            multi_hop_results = {}
            
            for node in relevant_nodes[:3]:  # Limit to top 3
                mh_result = self.multi_hop_reasoner.get_multi_hop_context(node, depth=2)
                multi_hop_results[node] = mh_result
            
            result["steps"]["multi_hop"] = multi_hop_results
        
        # STEP 4: Build context
        logger.info("\n[STEP4] Context Building")
        context_nodes = set(relevant_nodes)
        
        # Add multi-hop nodes
        if enable_multi_hop and relevant_nodes:
            for node in relevant_nodes:
                mh = self.multi_hop_reasoner.get_multi_hop_context(node, depth=2)
                if mh.get("all_nodes"):
                    context_nodes.update(mh["all_nodes"])
        
        # Build relationships
        relationships = []
        for source, target in self.graph.edges():
            if source in context_nodes and target in context_nodes:
                relationships.append({
                    "from": source,
                    "to": target,
                    "type": self.graph.get_edge_data(source, target).get("style", "unknown")
                })
        
        result["steps"]["context"] = {
            "nodes": list(context_nodes),
            "relationships": relationships,
            "context_size": len(context_nodes)
        }
        logger.info(f"[OK] Built context with {len(context_nodes)} nodes, {len(relationships)} relationships")
        
        # STEP 5: Failure handling
        if not context_nodes:
            logger.warning("[STEP5] Failure Handling - No context found")
            result["status"] = "no_context"
            result["response"] = "⚠️ This functionality is not defined in the current system architecture. Available topics: services (Ride Service, Matching Engine, etc.), flows (search, request, accept, etc.), and database tables."
            return result
        
        result["status"] = "success"
        result["response"] = self._format_response(relevant_nodes, context_nodes, relationships)
        
        logger.info("\n[OK] Query processed successfully")
        
        return result
    
    def _format_response(self, relevant_nodes: List[str], context_nodes: Set[str], relationships: List[Dict]) -> str:
        """Format response from graph data"""
        lines = []
        
        lines.append("📊 SYSTEM ARCHITECTURE CONTEXT:")
        lines.append("=" * 50)
        
        # Group by layer
        by_layer = {}
        for node in context_nodes:
            attr = self.graph.nodes[node]
            layer = attr.get("layer", "unknown")
            if layer not in by_layer:
                by_layer[layer] = []
            by_layer[layer].append(node)
        
        for layer in ["gateway", "service", "flow", "database"]:
            if layer in by_layer:
                layer_name = {
                    "gateway": "API Gateway",
                    "service": "Services",
                    "flow": "Flows",
                    "database": "Database"
                }[layer]
                lines.append(f"\n{layer_name}:")
                for node in by_layer[layer]:
                    lines.append(f"  • {node}")
        
        lines.append("\n🔗 RELATIONSHIPS:")
        for rel in relationships[:10]:  # Limit display
            lines.append(f"  • {rel['from']} → {rel['to']}")
        
        if len(relationships) > 10:
            lines.append(f"  ... and {len(relationships) - 10} more relationships")
        
        return "\n".join(lines)


def main():
    """Interactive mode"""
    print("\n" + "="*70)
    print("PRODUCTION-ENHANCED ORCHESTRATOR")
    print("="*70)
    
    try:
        orchestrator = ProductionEnhancedOrchestrator()
    except Exception as e:
        logger.error(f"Failed to initialize: {e}")
        return
    
    print("\n💡 Type your questions. Commands: 'help', 'validate', 'exit'")
    
    while True:
        try:
            query = input("\n🔍 You: ").strip()
            
            if not query:
                continue
            
            if query.lower() == "exit":
                print("\n👋 Goodbye!")
                break
            
            if query.lower() == "validate":
                print("\n📋 Graph Validation Results:")
                for issue in orchestrator.validation_result["issues"]:
                    print(f"  ⚠️  {issue}")
                if not orchestrator.validation_result["issues"]:
                    print("  ✅ No issues found!")
                continue
            
            if query.lower() == "help":
                print("""
Examples:
  • How does booking work?
  • Explain payment flow
  • What tables store user data?
  • How do services communicate?
                """)
                continue
            
            result = orchestrator.query(query)
            print("\n" + "-"*70)
            print(result["response"])
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            logger.error(f"Error: {e}")


if __name__ == "__main__":
    main()
