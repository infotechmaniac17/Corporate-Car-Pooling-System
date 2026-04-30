"""
STEP 2: Clean & Structure into JSON (CRITICAL)
Converts extracted diagrams into normalized JSON structures
Removes duplicates, validates, and indexes for efficient retrieval
"""

import json
import re
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

@dataclass
class Entity:
    """Entity data class"""
    name: str
    fields: List[Dict[str, str]]
    primary_key: str
    relationships: List[str] = None
    
    def __post_init__(self):
        if self.relationships is None:
            self.relationships = []

@dataclass
class Service:
    """Service data class"""
    name: str
    endpoints: List[Dict[str, Any]]
    port: int
    auth_required: bool = True
    rate_limit: str = "1000 req/min"

@dataclass
class Flow:
    """Flow data class"""
    name: str
    steps: List[str]
    description: str = ""
    actors: List[str] = None
    
    def __post_init__(self):
        if self.actors is None:
            self.actors = []

class DiagramStructurer:
    """Structure extracted diagrams into normalized JSON"""
    
    def __init__(self):
        self.entities = {}
        self.relationships = []
        self.services = {}
        self.flows = {}
        self.metadata = {
            "version": "1.0",
            "created_at": datetime.now().isoformat(),
            "extracted_from": "SVG diagrams"
        }
    
    def structure_er_diagram(self, parsed_er: Dict[str, Any]) -> Dict[str, Any]:
        """Structure Entity Relationship diagram"""
        
        entities_dict = parsed_er.get('entities', {})
        relationships = parsed_er.get('relationships', [])
        
        # Clean and normalize entities
        for entity_name, entity_data in entities_dict.items():
            self.entities[entity_name] = Entity(
                name=entity_name,
                fields=entity_data.get('fields', []),
                primary_key=entity_data.get('primary_key', 'id'),
                relationships=self._extract_relationships(entity_name, relationships)
            )
        
        return {
            "type": "ER",
            "entities": {name: asdict(entity) for name, entity in self.entities.items()},
            "relationships": relationships,
            "stats": {
                "entity_count": len(self.entities),
                "relationship_count": len(relationships),
                "total_fields": sum(len(e.fields) for e in self.entities.values())
            }
        }
    
    def structure_sequence_diagram(self, parsed_seq: Dict[str, Any]) -> Dict[str, Any]:
        """Structure Sequence diagram"""
        
        actors = parsed_seq.get('actors', [])
        interactions = parsed_seq.get('interactions', [])
        
        # Group interactions by flow
        flow_dict = self._group_interactions(interactions)
        
        # Create Flow objects
        for flow_name, steps in flow_dict.items():
            self.flows[flow_name] = Flow(
                name=flow_name,
                steps=steps,
                description=f"Sequence flow: {flow_name}",
                actors=actors
            )
        
        return {
            "type": "SEQUENCE",
            "actors": actors,
            "interactions": interactions,
            "flows": {name: asdict(flow) for name, flow in self.flows.items()},
            "stats": {
                "actor_count": len(actors),
                "interaction_count": len(interactions),
                "flow_count": len(self.flows)
            }
        }
    
    def structure_activity_diagram(self, parsed_act: Dict[str, Any]) -> Dict[str, Any]:
        """Structure Activity diagram"""
        
        activities = parsed_act.get('activities', [])
        decisions = parsed_act.get('decisions', [])
        paths = parsed_act.get('paths', [])
        
        # Create activity flow
        flow_steps = self._build_activity_flow(activities, decisions, paths)
        
        return {
            "type": "ACTIVITY",
            "activities": activities,
            "decisions": decisions,
            "paths": paths,
            "flow": flow_steps,
            "stats": {
                "activity_count": len(activities),
                "decision_count": len(decisions),
                "path_count": len(paths)
            }
        }
    
    def _extract_relationships(self, entity: str, relationships: List[str]) -> List[str]:
        """Extract relationships for a specific entity"""
        rels = []
        for rel in relationships:
            if entity in rel:
                rels.append(rel)
        return rels
    
    def _group_interactions(self, interactions: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Group interactions by flow"""
        flows = {}
        current_flow = "main"
        
        for interaction in interactions:
            action = interaction.get('action', '')
            
            # Detect flow changes
            if 'FLOW:' in action or 'flow:' in action.lower():
                current_flow = action.lower().replace('flow:', '').strip()
                flows[current_flow] = []
            else:
                if current_flow not in flows:
                    flows[current_flow] = []
                flows[current_flow].append(action)
        
        return flows
    
    def _build_activity_flow(self, activities: List[str], decisions: List[str], paths: List[str]) -> List[Dict[str, Any]]:
        """Build structured activity flow"""
        flow = []
        
        for i, activity in enumerate(activities):
            flow.append({
                "step": i + 1,
                "type": "activity",
                "content": activity
            })
            
            # Add associated decision if exists
            if i < len(decisions):
                flow.append({
                    "step": i + 1.5,
                    "type": "decision",
                    "content": decisions[i]
                })
        
        return flow
    
    def normalize_structure(self) -> Dict[str, Any]:
        """Return normalized structure"""
        return {
            "metadata": self.metadata,
            "entities": {name: asdict(e) for name, e in self.entities.items()},
            "flows": {name: asdict(f) for name, f in self.flows.items()},
            "relationships": self.relationships,
            "summary": {
                "total_entities": len(self.entities),
                "total_flows": len(self.flows),
                "total_relationships": len(self.relationships)
            }
        }

class DiagramCleaner:
    """Clean extracted data"""
    
    @staticmethod
    def remove_duplicates(items: List[str]) -> List[str]:
        """Remove duplicate items while preserving order"""
        seen = set()
        result = []
        for item in items:
            if item not in seen:
                seen.add(item)
                result.append(item)
        return result
    
    @staticmethod
    def validate_structure(data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate structure completeness"""
        required_keys = ["metadata", "entities", "flows"]
        
        for key in required_keys:
            if key not in data:
                return False, f"Missing required key: {key}"
        
        if not isinstance(data.get("entities"), dict):
            return False, "Entities should be a dictionary"
        
        if not isinstance(data.get("flows"), dict):
            return False, "Flows should be a dictionary"
        
        return True, "Valid structure"
    
    @staticmethod
    def merge_structures(*structures: Dict[str, Any]) -> Dict[str, Any]:
        """Merge multiple normalized structures"""
        merged = {
            "metadata": structures[0].get("metadata", {}),
            "entities": {},
            "flows": {},
            "relationships": []
        }
        
        for struct in structures:
            merged["entities"].update(struct.get("entities", {}))
            merged["flows"].update(struct.get("flows", {}))
            merged["relationships"].extend(struct.get("relationships", []))
        
        merged["relationships"] = DiagramCleaner.remove_duplicates(merged["relationships"])
        
        return merged

def structure_all_diagrams(extracted: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Structure all extracted diagrams"""
    structurer = DiagramStructurer()
    structures = []
    
    # Structure ER diagram
    if 'er' in extracted:
        er_struct = structurer.structure_er_diagram(extracted['er']['parsed'])
        structures.append(er_struct)
        print("✓ Structured ER diagram")
    
    # Structure Sequence diagram
    if 'sequence' in extracted:
        seq_struct = structurer.structure_sequence_diagram(extracted['sequence']['parsed'])
        structures.append(seq_struct)
        print("✓ Structured Sequence diagram")
    
    # Structure Activity diagram
    if 'activity' in extracted:
        act_struct = structurer.structure_activity_diagram(extracted['activity']['parsed'])
        structures.append(act_struct)
        print("✓ Structured Activity diagram")
    
    # Merge all structures
    merged = DiagramCleaner.merge_structures(*structures)
    
    # Validate
    is_valid, msg = DiagramCleaner.validate_structure(merged)
    if is_valid:
        print(f"✓ Validation: {msg}")
    else:
        print(f"✗ Validation: {msg}")
    
    return merged

if __name__ == "__main__":
    from step1_extractor import extract_diagrams
    
    print("\n" + "="*60)
    print("STEP 2: STRUCTURING & CLEANING")
    print("="*60)
    
    # Extract
    extracted = extract_diagrams()
    
    # Structure
    print("\nStructuring diagrams...")
    structured = structure_all_diagrams(extracted)
    
    # Output sample
    print("\n" + "="*60)
    print("STRUCTURED OUTPUT (sample)")
    print("="*60)
    print(json.dumps(structured, indent=2)[:1000] + "...\n")
