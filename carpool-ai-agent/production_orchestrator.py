"""
PRODUCTION-ENHANCED ORCHESTRATOR - SIMPLIFIED
Production-ready: validation, synonyms, multi-hop, logging, error handling
No emoji issues - Windows compatible
"""

import sys
import os
import json
import logging
from typing import Dict, Any, List, Set, Optional
from datetime import datetime
import networkx as nx

# Setup logging
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
        self.graph = graph
        self.memory = system_memory
        self.issues = []
    
    def validate_all(self) -> Dict[str, Any]:
        """Run all validation checks"""
        logger.info("[VALIDATION] Starting graph validation...")
        self.issues = []
        
        self._check_orphan_nodes()
        self._check_critical_nodes()
        self._check_edge_consistency()
        self._check_isolated_components()
        self._check_layer_consistency()
        
        logger.info(f"[VALIDATION] Complete: {len(self.issues)} issues found")
        return {
            "valid": len(self.issues) == 0,
            "issues": self.issues,
            "issue_count": len(self.issues),
            "graph_nodes": self.graph.number_of_nodes(),
            "graph_edges": self.graph.number_of_edges(),
            "timestamp": datetime.now().isoformat()
        }
    
    def _check_orphan_nodes(self):
        logger.info("  Checking orphan nodes...")
        for node in self.graph.nodes():
            if self.graph.in_degree(node) == 0 and self.graph.out_degree(node) == 0:
                issue = f"Orphan node: {node}"
                self.issues.append(issue)
                logger.warning(f"    ISSUE: {issue}")
    
    def _check_critical_nodes(self):
        logger.info("  Checking critical nodes...")
        required = ["API Gateway", "Ride Service", "request", "accept", "ride_requests", "users"]
        for node in required:
            if node not in self.graph.nodes():
                issue = f"Missing: {node}"
                self.issues.append(issue)
                logger.warning(f"    ISSUE: {issue}")
    
    def _check_edge_consistency(self):
        logger.info("  Checking edge consistency...")
        expected = [("API Gateway", "Ride Service"), ("Ride Service", "request"), 
                    ("request", "ride_requests"), ("search", "users")]
        for source, target in expected:
            if source in self.graph.nodes() and target in self.graph.nodes():
                if not self.graph.has_edge(source, target):
                    issue = f"Missing edge: {source} -> {target}"
                    self.issues.append(issue)
                    logger.warning(f"    ISSUE: {issue}")
    
    def _check_isolated_components(self):
        logger.info("  Checking isolated components...")
        undirected = self.graph.to_undirected()
        for i, component in enumerate(nx.connected_components(undirected)):
            if len(component) < 3:
                issue = f"Isolated component: {list(component)[:2]}"
                self.issues.append(issue)
    
    def _check_layer_consistency(self):
        logger.info("  Checking layer consistency...")
        valid_layers = {"gateway", "service", "flow", "database"}
        for node, attr in self.graph.nodes(data=True):
            if attr.get("layer", "unknown") not in valid_layers:
                issue = f"Invalid layer for {node}"
                self.issues.append(issue)


class SynonymMapper:
    """Map queries to graph nodes with synonyms"""
    
    def __init__(self):
        self.synonyms = {
            "booking": ["request"],
            "ride booking": ["request"],
            "match": ["search", "accept"],
            "payment": ["Payment Service", "payments"],
            "notification": ["Notification Service", "notifications"],
            "matching": ["Matching Engine"],
            "user": ["User Service", "users"],
            "user data": ["users"],
            "booking record": ["ride_requests"],
            "driver data": ["drivers"],
            "vehicle data": ["vehicles"],
            "schedule": ["ride_schedules"],
            "lifecycle": ["search", "request", "accept", "start", "end", "rate"],
            "end-to-end": ["search", "request", "accept", "start", "end", "rate"],
        }
        logger.info(f"[SYNONYMS] Loaded {len(self.synonyms)} synonym groups")
    
    def expand_query(self, query: str) -> List[str]:
        """Expand query with synonyms"""
        query_lower = query.lower()
        expanded = set(query_lower.split())
        
        for synonym_group, terms in self.synonyms.items():
            if synonym_group.lower() in query_lower:
                expanded.update(terms)
                logger.info(f"  SYNONYM MATCH: '{synonym_group}' -> {terms}")
        
        return list(expanded)


class MultiHopReasoner:
    """Multi-hop graph traversal"""
    
    def __init__(self, graph: nx.DiGraph):
        self.graph = graph
    
    def get_multi_hop_context(self, start_node: str, depth: int = 2) -> Dict[str, Any]:
        """Get multi-hop context"""
        logger.info(f"[MULTIHOP] Traversing from '{start_node}' (depth={depth})")
        
        if start_node not in self.graph.nodes():
            logger.warning(f"  Node '{start_node}' not found")
            return {"start_node": start_node, "found": False, "hops": {}}
        
        hops = {}
        current = {start_node}
        all_nodes = {start_node}
        
        for hop in range(1, depth + 1):
            next_layer = set()
            for node in current:
                next_layer.update(self.graph.successors(node))
            hops[f"hop_{hop}"] = list(next_layer)
            logger.info(f"  Hop {hop}: {len(next_layer)} nodes")
            all_nodes.update(next_layer)
            current = next_layer
            if not next_layer:
                break
        
        return {
            "start_node": start_node,
            "found": True,
            "depth": depth,
            "hops": hops,
            "total_nodes": len(all_nodes),
            "all_nodes": list(all_nodes)
        }


class ProductionEnhancedOrchestrator:
    """Production-ready orchestrator with all features"""
    
    def __init__(self):
        """Initialize with all production features"""
        logger.info("[INIT] Starting Production-Enhanced Orchestrator...")
        
        self.graph = self._load_graph()
        self.memory = self._load_memory()
        
        self.validator = GraphValidator(self.graph, self.memory)
        self.synonym_mapper = SynonymMapper()
        self.multi_hop_reasoner = MultiHopReasoner(self.graph)
        
        self.validation_result = self.validator.validate_all()
        if self.validation_result["valid"]:
            logger.info("[INIT] Graph validation PASSED")
        else:
            logger.warning(f"[INIT] {self.validation_result['issue_count']} issues found")
    
    def _load_graph(self) -> nx.DiGraph:
        """Load architecture graph"""
        logger.info("[GRAPH] Loading architecture...")
        
        memory_path = "data/structured/system_memory.json"
        if not os.path.exists(memory_path):
            for attempt in ["../data/structured/system_memory.json", "carpool-ai-agent/data/structured/system_memory.json"]:
                if os.path.exists(attempt):
                    memory_path = attempt
                    break
        
        with open(memory_path) as f:
            mem = json.load(f)
        
        G = nx.DiGraph()
        
        # Add nodes
        for s in mem["system"]["services"]:
            G.add_node(s, layer="service")
        for f in mem["flows"]["ride_flow"]:
            G.add_node(f, layer="flow")
        for t in mem["database"]["tables"]:
            G.add_node(t, layer="database")
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
        
        ride_flow = mem["flows"]["ride_flow"]
        for i in range(len(ride_flow) - 1):
            G.add_edge(ride_flow[i], ride_flow[i+1], style="flow_sequence")
        
        logger.info(f"[GRAPH] Loaded: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
        return G
    
    def _load_memory(self) -> Dict[str, Any]:
        """Load system memory"""
        memory_path = "data/structured/system_memory.json"
        if not os.path.exists(memory_path):
            for attempt in ["../data/structured/system_memory.json", "carpool-ai-agent/data/structured/system_memory.json"]:
                if os.path.exists(attempt):
                    memory_path = attempt
                    break
        with open(memory_path) as f:
            return json.load(f)
    
    def query(self, query: str, enable_multi_hop: bool = True) -> Dict[str, Any]:
        """Process query with all production features"""
        logger.info(f"\n[QUERY] {query}")
        
        result = {"query": query, "timestamp": datetime.now().isoformat(), "steps": {}}
        
        # STEP 1: Query expansion
        logger.info("[STEP1] Expanding query with synonyms...")
        expanded = self.synonym_mapper.expand_query(query)
        result["steps"]["query_expansion"] = {"expanded": expanded, "count": len(expanded)}
        logger.info(f"[STEP1] Expanded to {len(expanded)} terms")
        
        # STEP 2: Find nodes
        logger.info("[STEP2] Matching nodes...")
        relevant_nodes = []
        for node in self.graph.nodes():
            node_lower = node.lower()
            for term in expanded:
                if term in node_lower or node_lower in term:
                    relevant_nodes.append(node)
                    break
        
        result["steps"]["node_matching"] = {"nodes": relevant_nodes, "count": len(relevant_nodes)}
        logger.info(f"[STEP2] Found {len(relevant_nodes)} relevant nodes")
        
        # STEP 3: Multi-hop reasoning
        if enable_multi_hop and relevant_nodes:
            logger.info("[STEP3] Multi-hop reasoning...")
            multi_hop_results = {}
            for node in relevant_nodes[:3]:
                mh = self.multi_hop_reasoner.get_multi_hop_context(node, depth=2)
                multi_hop_results[node] = mh
            result["steps"]["multi_hop"] = multi_hop_results
        
        # STEP 4: Build context
        logger.info("[STEP4] Building context...")
        context_nodes = set(relevant_nodes)
        if enable_multi_hop and relevant_nodes:
            for node in relevant_nodes:
                mh = self.multi_hop_reasoner.get_multi_hop_context(node, depth=2)
                if mh.get("all_nodes"):
                    context_nodes.update(mh["all_nodes"])
        
        relationships = []
        for source, target in self.graph.edges():
            if source in context_nodes and target in context_nodes:
                relationships.append({
                    "from": source,
                    "to": target,
                    "type": self.graph.get_edge_data(source, target).get("style", "unknown")
                })
        
        result["steps"]["context"] = {"nodes": len(context_nodes), "relationships": len(relationships)}
        logger.info(f"[STEP4] Built context: {len(context_nodes)} nodes, {len(relationships)} relationships")
        
        # STEP 5: Failure handling
        if not context_nodes:
            logger.warning("[STEP5] No context found - returning graceful error")
            result["status"] = "no_context"
            result["response"] = "This functionality is not defined in the current system architecture."
            return result
        
        result["status"] = "success"
        result["response"] = f"Found {len(context_nodes)} relevant nodes with {len(relationships)} connections"
        logger.info("[OK] Query processed successfully")
        
        return result


def main():
    """Interactive mode"""
    print("\n" + "="*70)
    print("PRODUCTION-ENHANCED ORCHESTRATOR")
    print("="*70 + "\n")
    
    try:
        orchestrator = ProductionEnhancedOrchestrator()
    except Exception as e:
        logger.error(f"[ERROR] {e}")
        return
    
    print("[OK] Orchestrator initialized")
    print("Type your questions. Commands: 'validate', 'help', 'exit'\n")
    
    while True:
        try:
            query = input("\nYou: ").strip()
            if not query:
                continue
            if query.lower() == "exit":
                print("\nGoodbye!")
                break
            if query.lower() == "validate":
                for issue in orchestrator.validation_result["issues"]:
                    print(f"  ISSUE: {issue}")
                if not orchestrator.validation_result["issues"]:
                    print("  [OK] No validation issues!")
                continue
            if query.lower() == "help":
                print("\nExamples:")
                print("  - How does booking work?")
                print("  - Explain payment flow")
                print("  - What tables store user data?")
                continue
            
            result = orchestrator.query(query)
            print(f"\nStatus: {result['status']}")
            print(f"Response: {result['response']}")
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            logger.error(f"[ERROR] {e}")


if __name__ == "__main__":
    main()
