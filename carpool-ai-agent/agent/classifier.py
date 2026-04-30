"""
Intent Classifier
Routes queries to appropriate data source
"""

from typing import Literal

def classify_query(query: str) -> Literal["database", "flow", "system", "services", "general"]:
    """
    Classify query to determine which structured data to retrieve
    
    Returns:
        - "database": Database schema and structure queries
        - "flow": Business flow and process queries
        - "system": System architecture and services queries
        - "services": API and service endpoints queries
        - "general": General architecture questions
    """
    query_lower = query.lower()
    
    # Database queries
    database_keywords = ["table", "column", "schema", "database", "relation", "entity", "field", "primary key", "foreign key"]
    if any(kw in query_lower for kw in database_keywords):
        return "database"
    
    # Flow queries
    flow_keywords = ["flow", "process", "sequence", "step", "lifecycle", "workflow", "ride booking", "payment process", "backup"]
    if any(kw in query_lower for kw in flow_keywords):
        return "flow"
    
    # System architecture queries
    system_keywords = ["architecture", "microservice", "service", "component", "technology", "tech stack", "infrastructure"]
    if any(kw in query_lower for kw in system_keywords):
        return "system"
    
    # API and services queries
    services_keywords = ["endpoint", "api", "http", "post", "get", "put", "delete", "request", "response", "rate limit"]
    if any(kw in query_lower for kw in services_keywords):
        return "services"
    
    # Default to general
    return "general"

def get_intent_details(intent: str) -> dict:
    """Get details about the classified intent"""
    intent_map = {
        "database": {
            "file": "database.json",
            "description": "Database schema, tables, relations, and fields",
            "keywords": ["tables", "relations", "key_fields", "primary_keys"]
        },
        "flow": {
            "file": "flows.json",
            "description": "Business flows, processes, and workflows",
            "keywords": ["ride_flow", "backup_flow", "payment_flow", "matching_flow"]
        },
        "system": {
            "file": "system.json",
            "description": "System architecture, microservices, and tech stack",
            "keywords": ["microservices", "api_gateway", "frontend", "technologies"]
        },
        "services": {
            "file": "services.json",
            "description": "Service definitions, API endpoints, and integrations",
            "keywords": ["service_definitions", "endpoints", "integration_points"]
        },
        "general": {
            "file": None,
            "description": "General architecture knowledge",
            "keywords": []
        }
    }
    
    return intent_map.get(intent, intent_map["general"])

if __name__ == "__main__":
    # Test classifier
    test_queries = [
        "What are the tables in the database?",
        "Explain the ride booking flow",
        "What microservices do we have?",
        "What are the API endpoints for user service?",
        "Tell me about the system"
    ]
    
    for query in test_queries:
        intent = classify_query(query)
        details = get_intent_details(intent)
        print(f"Query: {query}")
        print(f"  Intent: {intent}")
        print(f"  File: {details['file']}")
        print(f"  Description: {details['description']}\n")
