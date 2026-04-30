"""
Retriever Nodes
Fetches structured data based on intent
"""

import json
import os
from typing import Dict, Any, Optional

class StructuredDataRetriever:
    def __init__(self, data_folder: str = "data/structured"):
        self.data_folder = data_folder
        self._cache = {}
    
    def load_json_file(self, filename: str) -> Dict[str, Any]:
        """Load JSON file from structured folder"""
        if filename in self._cache:
            return self._cache[filename]
        
        file_path = os.path.join(self.data_folder, filename)
        
        if not os.path.exists(file_path):
            print(f"Warning: {filename} not found at {file_path}")
            return {}
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self._cache[filename] = data
                return data
        except json.JSONDecodeError as e:
            print(f"Error parsing {filename}: {e}")
            return {}
        except Exception as e:
            print(f"Error loading {filename}: {e}")
            return {}
    
    def get_database_schema(self) -> Dict[str, Any]:
        """Get database schema and relations"""
        return self.load_json_file("database.json")
    
    def get_flows(self) -> Dict[str, Any]:
        """Get business flows"""
        return self.load_json_file("flows.json")
    
    def get_system_architecture(self) -> Dict[str, Any]:
        """Get system architecture"""
        return self.load_json_file("system.json")
    
    def get_services(self) -> Dict[str, Any]:
        """Get service definitions"""
        return self.load_json_file("services.json")
    
    def get_specific_flow(self, flow_name: str) -> Optional[Dict[str, Any]]:
        """Get specific flow by name"""
        flows = self.get_flows()
        return flows.get(flow_name, None)
    
    def get_specific_service(self, service_name: str) -> Optional[Dict[str, Any]]:
        """Get specific service by name"""
        services = self.get_services()
        service_defs = services.get("service_definitions", {})
        return service_defs.get(service_name, None)
    
    def search_in_database(self, search_term: str) -> Dict[str, Any]:
        """Search for tables or fields matching term"""
        database = self.get_database_schema()
        results = {
            "tables": [t for t in database.get("tables", []) if search_term.lower() in t.lower()],
            "relations": [r for r in database.get("relations", []) if search_term.lower() in r.lower()],
            "fields": {}
        }
        
        for table, fields in database.get("key_fields", {}).items():
            matching_fields = [f for f in fields if search_term.lower() in f.lower()]
            if matching_fields:
                results["fields"][table] = matching_fields
        
        return results
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get detailed info about a specific table"""
        database = self.get_database_schema()
        key_fields = database.get("key_fields", {})
        
        return {
            "name": table_name,
            "fields": key_fields.get(table_name, []),
            "primary_key": database.get("primary_keys", {}).get(table_name, "id")
        }

# Global instance
_retriever = StructuredDataRetriever()

def get_structured_context(intent: str) -> Dict[str, Any]:
    """Get structured context based on intent"""
    intent_to_method = {
        "database": _retriever.get_database_schema,
        "flow": _retriever.get_flows,
        "system": _retriever.get_system_architecture,
        "services": _retriever.get_services,
        "general": _retriever.get_system_architecture
    }
    
    method = intent_to_method.get(intent, _retriever.get_system_architecture)
    return method()

def search_structured_data(query: str) -> Dict[str, Any]:
    """Search structured data"""
    return _retriever.search_in_database(query)

if __name__ == "__main__":
    retriever = StructuredDataRetriever()
    
    # Test retrieval
    print("=== Database Schema ===")
    schema = retriever.get_database_schema()
    print(f"Tables: {schema.get('tables', [])[:3]}...")
    
    print("\n=== Flows ===")
    flows = retriever.get_flows()
    print(f"Available flows: {list(flows.keys())}")
    
    print("\n=== System Architecture ===")
    system = retriever.get_system_architecture()
    print(f"Microservices: {len(system.get('microservices', []))}")
    
    print("\n=== Search Test ===")
    results = retriever.search_in_database("user")
    print(f"Search results for 'user': {results}")
