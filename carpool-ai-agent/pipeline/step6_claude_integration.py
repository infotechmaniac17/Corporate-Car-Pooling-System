"""
STEP 6: Optimize Tokens & Claude Integration
Complete pipeline with token compression and LLM integration
"""

import json
import os
from typing import Dict, Any, List, Optional

try:
    from anthropic import Anthropic
    HAS_CLAUDE = True
except ImportError:
    HAS_CLAUDE = False
    print("Warning: Anthropic SDK not installed. Install with: pip install anthropic")

class TokenOptimizer:
    """Optimize context for minimal token usage"""
    
    CHARS_PER_TOKEN = 4  # Approximate
    
    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimate token count"""
        return len(text) // TokenOptimizer.CHARS_PER_TOKEN
    
    @staticmethod
    def compress_entities(entities: Dict[str, Any], max_fields: int = 5) -> Dict[str, Any]:
        """Compress entity list"""
        compressed = {}
        
        for name, entity in entities.items():
            fields = entity.get('fields', [])
            
            # Keep only top fields
            if len(fields) > max_fields:
                fields = fields[:max_fields] + [{"name": "...", "type": f"({len(fields) - max_fields} more)"}]
            
            compressed[name] = {
                "primary_key": entity.get('primary_key', 'id'),
                "field_count": len(entity.get('fields', [])),
                "top_fields": fields
            }
        
        return compressed
    
    @staticmethod
    def compress_flows(flows: Dict[str, Any], max_steps: int = 5) -> Dict[str, Any]:
        """Compress flow list"""
        compressed = {}
        
        for name, flow in flows.items():
            steps = flow.get('steps', [])
            
            # Keep only key steps
            if len(steps) > max_steps:
                steps = steps[:max_steps] + [f"... and {len(steps) - max_steps} more steps"]
            
            compressed[name] = {
                "step_count": len(flow.get('steps', [])),
                "key_steps": steps,
                "actors": flow.get('actors', [])[:3]
            }
        
        return compressed
    
    @staticmethod
    def compress_vector_results(results: List[Dict[str, Any]], max_chars: int = 150) -> List[Dict[str, Any]]:
        """Compress vector search results"""
        compressed = []
        
        for result in results:
            content = result.get('content', '')
            if len(content) > max_chars:
                content = content[:max_chars] + "..."
            
            compressed.append({
                "type": result['metadata'].get('type', 'unknown'),
                "content": content,
                "source": result['metadata'].get('source', 'unknown')
            })
        
        return compressed
    
    @staticmethod
    def create_optimized_context(retrieval_result: Dict[str, Any]) -> Dict[str, Any]:
        """Create optimized context"""
        
        structured = retrieval_result.get('structured_context', {})
        vector_results = retrieval_result.get('vector_results', [])
        
        optimized = {
            "intent": retrieval_result.get('intent', 'general'),
            "structured": {
                "type": structured.get('type', 'summary'),
                "entities": TokenOptimizer.compress_entities(
                    structured.get('data', {}) if structured.get('type') == 'entities' else {}
                ),
                "flows": TokenOptimizer.compress_flows(
                    structured.get('data', {}) if structured.get('type') == 'flows' else {}
                )
            },
            "vector": TokenOptimizer.compress_vector_results(vector_results),
            "stats": retrieval_result.get('structured_context', {}).get('stats', {})
        }
        
        return optimized
    
    @staticmethod
    def estimate_context_tokens(optimized: Dict[str, Any]) -> int:
        """Estimate total tokens in optimized context"""
        total = TokenOptimizer.estimate_tokens(json.dumps(optimized))
        return total

class ClaudeIntegration:
    """Integrate with Claude API"""
    
    def __init__(self, api_key: Optional[str] = None):
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not api_key:
            print("⚠ ANTHROPIC_API_KEY not set. Claude integration disabled.")
            self.client = None
        else:
            try:
                self.client = Anthropic(api_key=api_key)
                print("✓ Claude API initialized")
            except Exception as e:
                print(f"⚠ Could not initialize Claude: {e}")
                self.client = None
    
    def create_system_prompt(self) -> str:
        """Create system prompt for Claude"""
        return """You are an expert system architect specialized in carpooling platforms.

Your role is to answer questions about the CarpoolHub system with precision and clarity.

⚠️ STRICT RULES - YOU MUST FOLLOW:
1. Use ONLY the provided system graph context
2. Do NOT assume anything outside the provided graph
3. If information is missing, explicitly say "Not defined in graph"
4. Cite the specific node/edge from the graph when answering
5. Explain the layer (Service/Flow/Database) for each component

SYSTEM ARCHITECTURE LAYERS:
- LAYER 1 (Left): Services (business logic)
- LAYER 2 (Middle): Flows (business processes)  
- LAYER 3 (Right): Database (persistent storage)

RELATIONSHIP TYPES:
- Service → Flow: Service activates a business flow
- Flow → Database: Flow step updates a database table
- Flow → Flow: Flow sequence (one step leads to next)

Guidelines:
- Always cite which node and layer you're discussing
- Provide exact graph connections as evidence
- Explain data flow through the layers
- Be concise but comprehensive

Answer based STRICTLY on the provided architectural context."""
    
    def create_user_prompt(self, query: str, optimized_context: Dict[str, Any], graph_context: str = None) -> str:
        """Create user prompt with context"""
        
        context_str = self._format_context(optimized_context)
        
        # Add graph context if provided
        if graph_context:
            context_str += "\n" + graph_context
        
        prompt = f"""{context_str}

USER QUESTION:
{query}

ANSWER:
- Use ONLY the graph context provided above
- If information missing, say "Not defined in graph"
- Cite specific nodes and their layer
- Explain the data flow through Service → Flow → Database layers"""
        
        return prompt
    
    def _format_context(self, optimized: Dict[str, Any]) -> str:
        """Format optimized context for prompt"""
        
        formatted = "=== SYSTEM ARCHITECTURE CONTEXT ===\n\n"
        
        # Intent
        formatted += f"Context Type: {optimized.get('intent', 'general')}\n\n"
        
        # Structured data
        if optimized.get('structured'):
            structured = optimized['structured']
            
            if structured.get('entities'):
                formatted += "ENTITIES:\n"
                for name, entity in list(structured['entities'].items())[:5]:
                    formatted += f"  • {name} (PK: {entity.get('primary_key', 'id')})\n"
                formatted += "\n"
            
            if structured.get('flows'):
                formatted += "FLOWS:\n"
                for name, flow in list(structured['flows'].items())[:3]:
                    formatted += f"  • {name} ({flow.get('step_count', 0)} steps)\n"
                formatted += "\n"
        
        # Vector results
        if optimized.get('vector'):
            formatted += "RELEVANT DIAGRAMS:\n"
            for vec in optimized['vector'][:3]:
                formatted += f"  • {vec['type']}: {vec['content']}\n"
            formatted += "\n"
        
        formatted += "=== END CONTEXT ===\n\n"
        
        return formatted
    
    def query(self, query: str, optimized_context: Dict[str, Any]) -> str:
        """Query Claude with optimized context"""
        
        if not self.client:
            return "Claude API not available. Please set ANTHROPIC_API_KEY environment variable."
        
        try:
            system_prompt = self.create_system_prompt()
            user_prompt = self.create_user_prompt(query, optimized_context)
            
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            return response.content[0].text
        
        except Exception as e:
            return f"Error querying Claude: {e}"

class EndToEndPipeline:
    """Complete end-to-end pipeline with optimization and Claude"""
    
    def __init__(self):
        print("\n" + "="*70)
        print("🚀 COMPLETE END-TO-END PIPELINE (STEPS 1-6)")
        print("="*70)
        
        # Initialize all components
        print("\n⏳ Initializing...")
        
        from step5_langgraph import AutomatedPipeline
        self.pipeline = AutomatedPipeline()
        
        self.optimizer = TokenOptimizer()
        self.claude = ClaudeIntegration()
        
        print("✅ Ready!\n")
    
    def process_query(self, query: str) -> Dict[str, Any]:
        """Process a query through the entire pipeline"""
        
        print(f"\n{'='*70}")
        print(f"📝 QUERY: {query}")
        print(f"{'='*70}\n")
        
        # Step 5: Run LangGraph pipeline
        print("⏳ Running LangGraph pipeline...")
        retrieval_result = self.pipeline.pipeline.invoke(query)
        
        if retrieval_result.get('error'):
            return {"error": retrieval_result['error']}
        
        response = retrieval_result.get('response', {})
        
        # Extract retrieval info
        retrieval_info = {
            "intent": response.get('intent', 'general'),
            "structured_context": response.get('structured_context', {}),
            "vector_results": response.get('vector_results', []),
            "raw_tokens": response.get('tokens_estimated', 0)
        }
        
        # Step 6a: Optimize tokens
        print("⏳ Optimizing tokens...")
        optimized = self.optimizer.create_optimized_context(retrieval_info)
        optimized_tokens = self.optimizer.estimate_context_tokens(optimized)
        
        # Step 6b: Query Claude
        print("⏳ Querying Claude...")
        claude_response = self.claude.query(query, optimized)
        
        return {
            "query": query,
            "intent": retrieval_info['intent'],
            "retrieval": {
                "raw_tokens": retrieval_info['raw_tokens'],
                "vector_count": len(retrieval_info['vector_results'])
            },
            "optimization": {
                "optimized_tokens": optimized_tokens,
                "reduction_pct": (1 - optimized_tokens / retrieval_info['raw_tokens']) * 100 if retrieval_info['raw_tokens'] > 0 else 0
            },
            "response": claude_response
        }
    
    def display_results(self, result: Dict[str, Any]):
        """Display results beautifully"""
        
        if result.get('error'):
            print(f"❌ ERROR: {result['error']}")
            return
        
        print(f"\n{'='*70}")
        print("📊 RESULTS")
        print(f"{'='*70}\n")
        
        print(f"🎯 Intent: {result.get('intent', 'N/A')}")
        
        retrieval = result.get('retrieval', {})
        print(f"\n📈 Retrieval Stats:")
        print(f"  Raw tokens: {retrieval.get('raw_tokens', 0)}")
        print(f"  Vector results: {retrieval.get('vector_count', 0)}")
        
        optimization = result.get('optimization', {})
        print(f"\n⚡ Token Optimization:")
        print(f"  Optimized tokens: {optimization.get('optimized_tokens', 0)}")
        print(f"  Reduction: {optimization.get('reduction_pct', 0):.1f}%")
        
        print(f"\n🤖 Claude Response:")
        print(f"{'─'*70}")
        print(result.get('response', 'No response'))
        print(f"{'─'*70}\n")

def run_complete_pipeline():
    """Run the complete pipeline"""
    
    pipeline = EndToEndPipeline()
    
    # Test queries
    queries = [
        "What is the database structure?",
        "How does the ride booking work?",
        "What are the system components?"
    ]
    
    for query in queries:
        result = pipeline.process_query(query)
        pipeline.display_results(result)
        print()

if __name__ == "__main__":
    run_complete_pipeline()
