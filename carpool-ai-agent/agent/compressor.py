"""
Context Compressor
Reduces token usage by minimizing context sent to Claude
"""

import json
from typing import Dict, Any, List

class ContextCompressor:
    def __init__(self, max_summary_tokens: int = 1000, max_details_tokens: int = 500):
        self.max_summary_tokens = max_summary_tokens
        self.max_details_tokens = max_details_tokens
    
    def estimate_tokens(self, text: str) -> int:
        """Rough estimation: 1 token ≈ 4 characters"""
        return len(text) // 4
    
    def truncate_to_tokens(self, text: str, max_tokens: int) -> str:
        """Truncate text to approximate token limit"""
        max_chars = max_tokens * 4
        if len(text) <= max_chars:
            return text
        return text[:max_chars] + "..."
    
    def compress_json(self, data: Dict[str, Any], depth: int = 1) -> Dict[str, Any]:
        """Compress JSON data by removing deep nesting"""
        if depth > 2:
            return {}
        
        compressed = {}
        for key, value in data.items():
            if isinstance(value, dict):
                compressed[key] = self.compress_json(value, depth + 1)
            elif isinstance(value, list):
                if len(value) > 5:
                    compressed[key] = value[:5] + [f"... and {len(value) - 5} more items"]
                else:
                    compressed[key] = value
            else:
                compressed[key] = value
        
        return compressed
    
    def summarize_structured(self, structured: Dict[str, Any]) -> Dict[str, Any]:
        """Create a summary of structured data"""
        summary = {}
        
        for key, value in structured.items():
            if isinstance(value, list):
                summary[key] = f"[{len(value)} items] {', '.join(map(str, value[:3]))}"
            elif isinstance(value, dict):
                summary[key] = f"[Keys: {', '.join(list(value.keys())[:5])}]"
            else:
                summary[key] = str(value)[:100]
        
        return summary
    
    def compress_vector_results(self, docs: List[Dict[str, Any]], max_per_doc: int = 200) -> List[Dict[str, Any]]:
        """Compress vector search results"""
        compressed = []
        
        for doc in docs:
            content = doc.get("content", "")
            compressed_content = self.truncate_to_tokens(content, max_per_doc)
            
            compressed.append({
                "content": compressed_content,
                "source": doc.get("source", "unknown"),
                "type": doc.get("type", "unknown"),
                "relevance": doc.get("relevance", "high")
            })
        
        return compressed
    
    def compress_context(
        self,
        structured: Dict[str, Any],
        vector_docs: List[Dict[str, Any]],
        include_summary: bool = True
    ) -> Dict[str, Any]:
        """Compress both structured and vector contexts"""
        
        compressed_structured = self.compress_json(structured)
        if include_summary:
            summary = self.summarize_structured(compressed_structured)
        else:
            summary = None
        
        compressed_docs = self.compress_vector_results(vector_docs, max_per_doc=200)
        
        # Estimate total tokens
        total_tokens = (
            self.estimate_tokens(json.dumps(compressed_structured)) +
            sum(self.estimate_tokens(doc.get("content", "")) for doc in compressed_docs)
        )
        
        return {
            "summary": summary,
            "structured": compressed_structured,
            "vector_results": compressed_docs,
            "estimated_tokens": total_tokens,
            "token_efficiency": {
                "compressed": total_tokens,
                "max_allowed": self.max_summary_tokens + self.max_details_tokens
            }
        }

def compress_agent_context(
    structured: Dict[str, Any],
    vector_docs: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Convenient function to compress context"""
    compressor = ContextCompressor()
    return compressor.compress_context(structured, vector_docs)

if __name__ == "__main__":
    compressor = ContextCompressor()
    
    # Test compression
    test_structured = {
        "tables": ["users", "rides", "requests", "payments"],
        "relations": [
            "User -> Ride",
            "Ride -> Request",
            "Request -> Payment"
        ],
        "large_list": list(range(100))
    }
    
    test_docs = [
        {"content": "User entity has fields: id, email, name, phone..." * 50, "source": "er.txt", "type": "ER"},
        {"content": "Ride booking flow: search -> request -> accept -> start -> end" * 30, "source": "sequence.txt", "type": "flow"}
    ]
    
    print("=== Original Size ===")
    print(f"Structured tokens: {compressor.estimate_tokens(json.dumps(test_structured))}")
    print(f"Docs tokens: {sum(compressor.estimate_tokens(d['content']) for d in test_docs)}")
    
    print("\n=== Compressed ===")
    compressed = compressor.compress_context(test_structured, test_docs)
    print(f"Compressed tokens: {compressed['estimated_tokens']}")
    print(f"Efficiency: {compressed['estimated_tokens']}/{compressed['token_efficiency']['max_allowed']}")
