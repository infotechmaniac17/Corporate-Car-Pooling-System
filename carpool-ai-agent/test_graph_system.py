# -*- coding: utf-8 -*-
"""
test_graph_system.py
Test Suite for Graph-Based Architecture System
"""

import json
import os
import sys
import io

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

class TestGraphSystem:
    """Test suite for clean architecture graph"""
    
    def __init__(self):
        """Initialize test suite"""
        print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║      TEST SUITE: GRAPH-BASED ARCHITECTURE SYSTEM         ║
    ║        (Step 4 - System Validation)                      ║
    ╚═══════════════════════════════════════════════════════════╝
        """)
        
        # Import graph converter
        from graph_to_context import build_graph, GraphContextConverter
        
        self.graph = build_graph()
        
        with open("data/structured/system_memory.json") as f:
            memory = json.load(f)
        
        self.converter = GraphContextConverter(self.graph, memory)
        self.tests_passed = 0
        self.tests_failed = 0
    
    def print_test_header(self, test_num, title):
        """Print test header"""
        print(f"\n{'='*70}")
        print(f"TEST {test_num}: {title}")
        print(f"{'='*70}\n")
    
    def print_result(self, passed, details=""):
        """Print test result"""
        if passed:
            print(f"✅ PASSED")
            self.tests_passed += 1
        else:
            print(f"❌ FAILED")
            if details:
                print(f"   {details}")
            self.tests_failed += 1
    
    def test_1_graph_structure(self):
        """TEST 1: Verify graph structure"""
        
        self.print_test_header(1, "Graph Structure")
        
        # Check nodes
        print(f"📊 Graph has {self.graph.number_of_nodes()} nodes")
        print(f"🔗 Graph has {self.graph.number_of_edges()} edges")
        
        # Check layers
        services = [n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "service"]
        flows = [n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "flow"]
        databases = [n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "database"]
        
        print(f"\n🔴 Services: {len(services)}")
        for s in services[:5]:
            print(f"   • {s}")
        
        print(f"\n🔵 Flows: {len(flows)}")
        for f in flows[:5]:
            print(f"   • {f}")
        
        print(f"\n🟢 Databases: {len(databases)}")
        for d in databases[:5]:
            print(f"   • {d}")
        
        # Validate
        passed = len(services) > 0 and len(flows) > 0 and len(databases) > 0
        self.print_result(passed)
        
        return passed
    
    def test_2_service_context(self):
        """TEST 2: Explain ride service"""
        
        self.print_test_header(2, "Service Context (Ride Service)")
        
        query = "Explain the Ride Service"
        print(f"❓ Query: {query}\n")
        
        context = self.converter.query(query)
        context_str = self.converter.context_to_string(context)
        
        print(context_str)
        
        # Validate
        passed = context.get("type") == "service" and context.get("data")
        
        if passed and context.get("data"):
            data = context["data"]
            print(f"\n✓ Service: {data.get('service')}")
            print(f"✓ Activates: {data.get('activates_flows')}")
            print(f"✓ Updates: {data.get('updates_databases')}")
        
        self.print_result(passed)
        
        return passed
    
    def test_3_flow_context(self):
        """TEST 3: Explain flow steps"""
        
        self.print_test_header(3, "Flow Context (Payment Flow)")
        
        query = "Explain the payment flow"
        print(f"❓ Query: {query}\n")
        
        context = self.converter.query(query)
        context_str = self.converter.context_to_string(context)
        
        print(context_str)
        
        # Validate
        passed = context.get("type") in ["flow", "search"]
        
        if passed and context.get("data"):
            if context.get("type") == "flow":
                data = context["data"]
                print(f"\n✓ Flow Step: {data.get('flow_step')}")
                if data.get('previous_steps'):
                    print(f"✓ Previous: {data.get('previous_steps')}")
                if data.get('next_steps'):
                    print(f"✓ Next: {data.get('next_steps')}")
        
        self.print_result(passed)
        
        return passed
    
    def test_4_database_context(self):
        """TEST 4: Explain database tables"""
        
        self.print_test_header(4, "Database Context (Payments Table)")
        
        query = "Which database tables store payments?"
        print(f"❓ Query: {query}\n")
        
        context = self.converter.query(query)
        context_str = self.converter.context_to_string(context)
        
        print(context_str)
        
        # Validate
        passed = context.get("data") is not None
        
        if passed and context.get("data"):
            data = context["data"]
            if isinstance(data, dict) and data.get("table"):
                print(f"\n✓ Table: {data.get('table')}")
                print(f"✓ Updated by: {data.get('updated_by_flows')}")
                print(f"✓ Triggered by: {data.get('triggered_by_services')}")
        
        self.print_result(passed)
        
        return passed
    
    def test_5_full_graph_context(self):
        """TEST 5: Full graph context"""
        
        self.print_test_header(5, "Full Graph Context")
        
        query = "Show me the complete system architecture"
        print(f"❓ Query: {query}\n")
        
        context = self.converter.query(query)
        context_str = self.converter.context_to_string(context)
        
        print(context_str)
        
        # Validate
        passed = context.get("type") == "full_graph" and context.get("data")
        
        if passed and context.get("data"):
            data = context["data"]
            print(f"\n✓ Services: {len(data.get('services', []))}")
            print(f"✓ Flows: {len(data.get('flows', []))}")
            print(f"✓ Databases: {len(data.get('databases', []))}")
            print(f"✓ Total Nodes: {data.get('total_nodes')}")
            print(f"✓ Total Edges: {data.get('total_edges')}")
        
        self.print_result(passed)
        
        return passed
    
    def test_6_context_tokens(self):
        """TEST 6: Minimal token usage"""
        
        self.print_test_header(6, "Context Token Efficiency")
        
        from graph_to_context import GraphContextConverter
        
        # Test different queries
        queries = [
            "Explain Ride Service",
            "What is the payment flow?",
            "Database tables?",
        ]
        
        token_sizes = []
        
        for query in queries:
            context = self.converter.query(query)
            context_str = self.converter.context_to_string(context)
            tokens = len(context_str) // 4  # Rough estimate
            token_sizes.append(tokens)
            print(f"Query: '{query[:30]}...'")
            print(f"  → Context size: {tokens} tokens (approx)")
        
        avg_tokens = sum(token_sizes) // len(token_sizes)
        print(f"\n📊 Average: {avg_tokens} tokens per query")
        
        # Validate: all should be under 500 tokens
        passed = all(t < 500 for t in token_sizes)
        print(f"✓ All queries fit in token budget" if passed else "❌ Some queries exceed budget")
        
        self.print_result(passed)
        
        return passed
    
    def test_7_layer_validation(self):
        """TEST 7: Layer relationships validation"""
        
        self.print_test_header(7, "Layer Relationships")
        
        # Check that edges follow proper layer flow
        service_nodes = {n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "service"}
        flow_nodes = {n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "flow"}
        db_nodes = {n for n, attr in self.graph.nodes(data=True) if attr.get("layer") == "database"}
        
        service_flow_edges = []
        flow_db_edges = []
        flow_flow_edges = []
        
        for u, v, attr in self.graph.edges(data=True):
            style = attr.get("style", "")
            
            if style == "service_flow":
                service_flow_edges.append((u, v))
            elif style == "flow_db":
                flow_db_edges.append((u, v))
            elif style == "flow_sequence":
                flow_flow_edges.append((u, v))
        
        print(f"🔗 Service → Flow: {len(service_flow_edges)} edges")
        for u, v in service_flow_edges[:5]:
            print(f"   • {u} → {v}")
        
        print(f"\n🔗 Flow → Database: {len(flow_db_edges)} edges")
        for u, v in flow_db_edges[:5]:
            print(f"   • {u} → {v}")
        
        print(f"\n🔗 Flow → Flow: {len(flow_flow_edges)} edges")
        for u, v in flow_flow_edges[:5]:
            print(f"   • {u} → {v}")
        
        # Validate relationships
        passed = (len(service_flow_edges) > 0 and 
                 len(flow_db_edges) > 0 and 
                 len(flow_flow_edges) > 0)
        
        self.print_result(passed)
        
        return passed
    
    def run_all_tests(self):
        """Run all tests"""
        
        print("\n" + "="*70)
        print("RUNNING ALL TESTS")
        print("="*70)
        
        tests = [
            self.test_1_graph_structure,
            self.test_2_service_context,
            self.test_3_flow_context,
            self.test_4_database_context,
            self.test_5_full_graph_context,
            self.test_6_context_tokens,
            self.test_7_layer_validation,
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Exception: {e}")
                self.tests_failed += 1
        
        # Summary
        print(f"\n\n{'='*70}")
        print(f"TEST SUMMARY")
        print(f"{'='*70}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        print(f"📊 Total: {self.tests_passed + self.tests_failed}")
        
        if self.tests_failed == 0:
            print(f"\n🎉 ALL TESTS PASSED!")
        else:
            print(f"\n⚠️  {self.tests_failed} test(s) failed")
        
        print("="*70)

def main():
    """Run test suite"""
    
    tester = TestGraphSystem()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
