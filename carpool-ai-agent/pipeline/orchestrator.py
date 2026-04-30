"""
COMPLETE PIPELINE ORCHESTRATOR
Automated SVG → JSON → Vector → Retriever → LangGraph → Claude
"""

import sys
import os

# Add pipeline to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'pipeline'))

from step6_claude_integration import EndToEndPipeline

def print_header(title: str):
    """Print formatted header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}\n")

def interactive_mode():
    """Interactive query mode"""
    
    print_header("🚀 CARPOOLHUB AI AGENT - COMPLETE PIPELINE")
    print("Type your questions about the system architecture.")
    print("Type 'exit' to quit, 'help' for options.\n")
    
    pipeline = EndToEndPipeline()
    
    while True:
        try:
            query = input("🔍 You: ").strip()
            
            if not query:
                continue
            
            if query.lower() == "exit":
                print("\n👋 Goodbye!")
                break
            
            if query.lower() == "help":
                print("""
Available commands:
  - Type any question about the CarpoolHub architecture
  - 'exit' or 'quit' - Exit the program
  - 'help' - Show this message

Example questions:
  - What tables are in the database?
  - How does the ride booking flow work?
  - What microservices exist?
  - Explain the backup ride system
                """)
                continue
            
            # Process query
            result = pipeline.process_query(query)
            pipeline.display_results(result)
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def batch_mode(queries: list):
    """Batch processing mode"""
    
    print_header("📊 BATCH PROCESSING MODE")
    
    pipeline = EndToEndPipeline()
    
    results = []
    
    for i, query in enumerate(queries, 1):
        print(f"\n[{i}/{len(queries)}] Processing: {query}")
        print("-" * 70)
        
        result = pipeline.process_query(query)
        results.append(result)
        
        if not result.get('error'):
            print(f"✅ Processed successfully")
        else:
            print(f"❌ Error: {result['error']}")
    
    # Summary
    print_header("📈 BATCH SUMMARY")
    
    successful = len([r for r in results if not r.get('error')])
    failed = len(results) - successful
    
    print(f"Total queries: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    
    # Token savings
    total_raw = sum(r.get('retrieval', {}).get('raw_tokens', 0) for r in results)
    total_optimized = sum(r.get('optimization', {}).get('optimized_tokens', 0) for r in results)
    
    if total_raw > 0:
        reduction = (1 - total_optimized / total_raw) * 100
        print(f"\nToken Optimization:")
        print(f"  Total raw tokens: {total_raw}")
        print(f"  Total optimized tokens: {total_optimized}")
        print(f"  Overall reduction: {reduction:.1f}%")

def demo_mode():
    """Demo with predefined queries"""
    
    print_header("🎬 DEMO MODE")
    
    demo_queries = [
        "What is the database structure for CarpoolHub?",
        "Explain the complete ride booking flow",
        "What are the microservices and their responsibilities?",
        "How does the backup ride system work?"
    ]
    
    print("Running demonstration with predefined queries...\n")
    
    pipeline = EndToEndPipeline()
    
    for i, query in enumerate(demo_queries, 1):
        print(f"\n[Demo {i}/{len(demo_queries)}]")
        result = pipeline.process_query(query)
        pipeline.display_results(result)
        
        if i < len(demo_queries):
            input("Press Enter to continue to next query...")

def main():
    """Main entry point"""
    
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║          CarpoolHub AI Agent - Complete Pipeline             ║
    ║                                                              ║
    ║  SVG → JSON → Vector Store → Retriever → LangGraph → Claude ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "demo":
            demo_mode()
        elif command == "interactive":
            interactive_mode()
        elif command == "batch":
            # Load queries from file or use default
            queries = sys.argv[2:] if len(sys.argv) > 2 else [
                "What is the database structure?",
                "How does ride matching work?"
            ]
            batch_mode(queries)
        elif command == "help":
            print("""
Usage:
  python orchestrator.py              - Interactive mode (default)
  python orchestrator.py interactive  - Interactive mode
  python orchestrator.py demo         - Run demo
  python orchestrator.py batch Q1 Q2  - Batch mode with queries
  python orchestrator.py help         - Show this message

Examples:
  python orchestrator.py
  python orchestrator.py demo
  python orchestrator.py batch "What tables exist?" "Explain flows"
            """)
        else:
            # Treat as a query
            query = " ".join(sys.argv[1:])
            print_header("SINGLE QUERY MODE")
            pipeline = EndToEndPipeline()
            result = pipeline.process_query(query)
            pipeline.display_results(result)
    else:
        # Default to interactive mode
        interactive_mode()

if __name__ == "__main__":
    main()
