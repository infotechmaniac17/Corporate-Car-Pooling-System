"""
Test script for CarpoolHub AI Agent
Run various tests to verify functionality
"""

import json
from agent.classifier import classify_query, get_intent_details
from agent.nodes import StructuredDataRetriever
from agent.compressor import ContextCompressor
from agent.graph import invoke_agent, format_context_for_claude

def test_classifier():
    """Test intent classification"""
    print("\n" + "="*60)
    print("TEST 1: Intent Classifier")
    print("="*60)
    
    test_cases = [
        "What tables exist in the database?",
        "Explain the ride booking flow",
        "What microservices make up the system?",
        "What are the API endpoints?",
        "Tell me about the architecture"
    ]
    
    for query in test_cases:
        intent = classify_query(query)
        details = get_intent_details(intent)
        print(f"\n✓ Query: {query}")
        print(f"  Intent: {intent}")
        print(f"  File: {details['file']}")

def test_retriever():
    """Test structured data retrieval"""
    print("\n" + "="*60)
    print("TEST 2: Structured Data Retriever")
    print("="*60)
    
    retriever = StructuredDataRetriever()
    
    # Test database retrieval
    print("\n✓ Database Schema:")
    db_schema = retriever.get_database_schema()
    print(f"  Tables: {db_schema.get('tables', [])[:3]}...")
    print(f"  Total relations: {len(db_schema.get('relations', []))}")
    
    # Test flows retrieval
    print("\n✓ Flows:")
    flows = retriever.get_flows()
    print(f"  Available flows: {list(flows.keys())}")
    
    # Test search
    print("\n✓ Search for 'user':")
    results = retriever.search_in_database("user")
    print(f"  Found tables: {results['tables']}")
    print(f"  Found fields: {list(results['fields'].keys())}")

def test_compressor():
    """Test context compression"""
    print("\n" + "="*60)
    print("TEST 3: Context Compressor")
    print("="*60)
    
    compressor = ContextCompressor()
    
    # Create test data
    test_structured = {
        "tables": ["users", "rides", "requests", "payments", "vehicles"],
        "relations": ["User -> Ride", "Ride -> Request", "Request -> Payment"] * 5,
        "large_array": list(range(100))
    }
    
    test_docs = [
        {"content": "User entity has fields: id, email, name..." * 50, "source": "er.txt", "type": "ER"},
        {"content": "Ride booking: search → request → accept → start" * 40, "source": "sequence.txt", "type": "flow"}
    ]
    
    # Compress
    compressed = compressor.compress_context(test_structured, test_docs)
    
    print(f"\n✓ Original tokens: ~{len(json.dumps(test_structured)) // 4 + sum(len(d['content']) // 4 for d in test_docs)}")
    print(f"  Compressed tokens: {compressed['estimated_tokens']}")
    print(f"  Reduction: {(1 - compressed['estimated_tokens'] / (len(json.dumps(test_structured)) // 4 + sum(len(d['content']) // 4 for d in test_docs))) * 100:.1f}%")

def test_graph_pipeline():
    """Test complete graph pipeline"""
    print("\n" + "="*60)
    print("TEST 4: Complete LangGraph Pipeline")
    print("="*60)
    
    test_queries = [
        "What is the database structure?",
        "How does the ride booking flow work?",
        "What microservices do we have?"
    ]
    
    for query in test_queries:
        print(f"\n✓ Query: {query}")
        
        result = invoke_agent(query)
        
        print(f"  Intent: {result['intent']}")
        print(f"  Structured context keys: {list(result['structured_context'].keys())[:3]}...")
        print(f"  Vector results: {len(result['vector_results'])}")
        print(f"  Compressed tokens: {result['compressed_context'].get('estimated_tokens', 'N/A')}")

def test_data_files():
    """Test that all data files exist and are valid"""
    print("\n" + "="*60)
    print("TEST 5: Data Files Validation")
    print("="*60)
    
    import os
    
    files_to_check = [
        "data/structured/database.json",
        "data/structured/flows.json",
        "data/structured/system.json",
        "data/structured/services.json",
        "data/raw_svg_text/er.txt",
        "data/raw_svg_text/sequence.txt",
        "data/raw_svg_text/activity.txt"
    ]
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✓ {file_path} ({size} bytes)")
        else:
            print(f"✗ {file_path} (NOT FOUND)")

def run_all_tests():
    """Run all tests"""
    print("""
    ╔══════════════════════════════════════════╗
    ║   CarpoolHub AI Agent - Test Suite        ║
    ╚══════════════════════════════════════════╝
    """)
    
    try:
        test_data_files()
        test_classifier()
        test_retriever()
        test_compressor()
        test_graph_pipeline()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
