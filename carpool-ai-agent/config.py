"""
Configuration file for CarpoolHub AI Agent
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"

# Vector Store Configuration
VECTOR_STORE_PATH = "vectorstore"
DATA_FOLDER = "data/raw_svg_text"
STRUCTURED_DATA_FOLDER = "data/structured"

# Context Compression Configuration
MAX_SUMMARY_TOKENS = 1000
MAX_DETAILS_TOKENS = 500

# Vector Search Configuration
VECTOR_SEARCH_K = 2
MAX_CHARS_PER_DOC = 200

# Token Estimation Configuration
CHARS_PER_TOKEN = 4  # Rough estimate: 1 token ≈ 4 characters

# Intent Classification Configuration
INTENT_THRESHOLDS = {
    "database": ["table", "column", "schema", "database", "relation", "entity", "field", "primary key", "foreign key"],
    "flow": ["flow", "process", "sequence", "step", "lifecycle", "workflow", "ride booking", "payment process", "backup"],
    "system": ["architecture", "microservice", "service", "component", "technology", "tech stack", "infrastructure"],
    "services": ["endpoint", "api", "http", "post", "get", "put", "delete", "request", "response", "rate limit"]
}

# Structured Data Files Mapping
STRUCTURED_DATA_FILES = {
    "database": "database.json",
    "flow": "flows.json",
    "system": "system.json",
    "services": "services.json"
}

# Agent Configuration
AGENT_CONFIG = {
    "max_tokens": 1024,
    "temperature": 0.7,
    "top_p": 0.9
}

# Logging Configuration
LOG_LEVEL = "INFO"
LOG_FILE = "agent.log"

# Feature Flags
ENABLE_VECTOR_SEARCH = True
ENABLE_CONTEXT_COMPRESSION = True
ENABLE_CONVERSATION_HISTORY = True
ENABLE_STATISTICS = True

def get_config():
    """Get configuration dictionary"""
    return {
        "api_key": ANTHROPIC_API_KEY,
        "model": ANTHROPIC_MODEL,
        "vector_store_path": VECTOR_STORE_PATH,
        "data_folder": DATA_FOLDER,
        "structured_data_folder": STRUCTURED_DATA_FOLDER,
        "compression": {
            "max_summary_tokens": MAX_SUMMARY_TOKENS,
            "max_details_tokens": MAX_DETAILS_TOKENS
        },
        "features": {
            "vector_search": ENABLE_VECTOR_SEARCH,
            "compression": ENABLE_CONTEXT_COMPRESSION,
            "conversation_history": ENABLE_CONVERSATION_HISTORY,
            "statistics": ENABLE_STATISTICS
        }
    }

if __name__ == "__main__":
    config = get_config()
    import json
    print(json.dumps(config, indent=2))
