"""
Main Agent Entry Point
Complete AI agent implementation with Claude integration
"""

from typing import Optional
import os
import json

try:
    from anthropic import Anthropic
except ImportError:
    print("Warning: Anthropic SDK not installed. Install with: pip install anthropic")

from agent.graph import invoke_agent, format_context_for_claude
from agent.classifier import classify_query

class CarpoolHubAgent:
    def __init__(self, api_key: Optional[str] = None):
        """Initialize the CarpoolHub AI Agent"""
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found. Set it as environment variable or pass it directly.")
        
        try:
            self.client = Anthropic(api_key=api_key)
            self.model = "claude-3-5-sonnet-20241022"
        except Exception as e:
            print(f"Warning: Could not initialize Anthropic client: {e}")
            self.client = None
        
        self.conversation_history = []
    
    def ask(self, query: str) -> str:
        """
        Ask the agent a question about the CarpoolHub architecture
        
        Args:
            query: The user's question
            
        Returns:
            Claude's response with architecture insights
        """
        print(f"\n🚀 Processing query: {query}")
        print(f"{'='*60}")
        
        # Step 1: Invoke the agent pipeline
        result = invoke_agent(query)
        
        # Step 2: Format context for Claude
        context = format_context_for_claude(result["compressed_context"])
        
        # Step 3: Create prompt for Claude
        system_prompt = """You are an expert system architect specializing in corporate carpooling platforms. 
You have deep knowledge of the CarpoolHub system architecture, database design, business flows, and microservices.

Your role is to:
1. Answer questions about system architecture clearly and accurately
2. Provide examples from the actual implementation
3. Explain trade-offs and design decisions
4. Suggest improvements when relevant
5. Be concise but thorough

Always cite which part of the system you're referencing (e.g., database, flow, service, etc.)."""
        
        user_message = f"""{context}

USER QUESTION:
{query}

Please provide a clear, detailed answer based on the provided context."""
        
        # Step 4: Call Claude
        if self.client is None:
            print("⚠️  Anthropic client not initialized. Returning structured data instead.")
            return json.dumps(result["compressed_context"], indent=2)
        
        try:
            print(f"\n📞 Calling Claude {self.model}...")
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            
            assistant_response = response.content[0].text
            
            # Store in conversation history
            self.conversation_history.append({
                "user": query,
                "assistant": assistant_response,
                "intent": result["intent"],
                "tokens_used": result["compressed_context"].get("estimated_tokens", 0)
            })
            
            return assistant_response
            
        except Exception as e:
            error_msg = f"Error calling Claude: {e}"
            print(f"❌ {error_msg}")
            return error_msg
    
    def ask_followup(self, followup: str) -> str:
        """Ask a follow-up question using conversation history"""
        if not self.conversation_history:
            return self.ask(followup)
        
        print(f"\n🔄 Processing follow-up: {followup}")
        print(f"{'='*60}")
        
        # Get last response context
        last_result = invoke_agent(followup)
        context = format_context_for_claude(last_result["compressed_context"])
        
        # Build multi-turn message
        messages = []
        
        # Add last exchange if exists
        if self.conversation_history:
            last = self.conversation_history[-1]
            messages.append({"role": "user", "content": last["user"]})
            messages.append({"role": "assistant", "content": last["assistant"]})
        
        # Add new question
        messages.append({
            "role": "user",
            "content": f"{context}\n\nFOLLOW-UP QUESTION:\n{followup}"
        })
        
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=messages
            )
            
            assistant_response = response.content[0].text
            
            self.conversation_history.append({
                "user": followup,
                "assistant": assistant_response,
                "intent": last_result["intent"],
                "tokens_used": last_result["compressed_context"].get("estimated_tokens", 0)
            })
            
            return assistant_response
            
        except Exception as e:
            return f"Error: {e}"
    
    def get_statistics(self) -> dict:
        """Get conversation statistics"""
        total_queries = len(self.conversation_history)
        total_tokens = sum(h.get("tokens_used", 0) for h in self.conversation_history)
        
        intent_counts = {}
        for h in self.conversation_history:
            intent = h.get("intent", "unknown")
            intent_counts[intent] = intent_counts.get(intent, 0) + 1
        
        return {
            "total_queries": total_queries,
            "estimated_total_tokens": total_tokens,
            "intent_distribution": intent_counts,
            "average_tokens_per_query": total_tokens // total_queries if total_queries > 0 else 0
        }

def main():
    """Main interactive loop"""
    print("""
    ╔══════════════════════════════════════════╗
    ║   CarpoolHub AI Agent - Architecture     ║
    ║         Query System                      ║
    ╚══════════════════════════════════════════╝
    """)
    
    try:
        agent = CarpoolHubAgent()
        print("✓ Agent initialized successfully\n")
    except ValueError as e:
        print(f"❌ {e}")
        print("\nTo use Claude responses, set ANTHROPIC_API_KEY environment variable.")
        print("Without it, the agent will still process queries and return structured data.\n")
        agent = CarpoolHubAgent(api_key="placeholder")
    
    print("Type your questions about CarpoolHub architecture.")
    print("Type 'quit' to exit, 'stats' for statistics.\n")
    
    while True:
        try:
            query = input("\n🔍 You: ").strip()
            
            if not query:
                continue
            
            if query.lower() == "quit":
                print("\n👋 Goodbye!")
                break
            
            if query.lower() == "stats":
                stats = agent.get_statistics()
                print("\n📊 Conversation Statistics:")
                print(f"  Total queries: {stats['total_queries']}")
                print(f"  Total tokens used: {stats['estimated_total_tokens']}")
                print(f"  Average tokens/query: {stats['average_tokens_per_query']}")
                print(f"  Intent distribution: {stats['intent_distribution']}")
                continue
            
            response = agent.ask(query)
            print(f"\n🤖 Agent: {response}")
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
