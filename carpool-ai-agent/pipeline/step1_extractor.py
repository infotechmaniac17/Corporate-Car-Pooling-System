"""
STEP 1: SVG/Text Extractor
Extracts text content from SVG files or text-based diagrams
Handles both actual SVGs and text representations
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Any, Optional

class DiagramExtractor:
    """Extract structured content from SVG/text diagrams"""
    
    def __init__(self, diagram_folder: str = "data/raw_svg_text"):
        self.diagram_folder = diagram_folder
        self.diagrams = {}
    
    def extract_from_text_file(self, filepath: str) -> Dict[str, Any]:
        """Extract structured content from text-based diagram"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = os.path.basename(filepath)
            diagram_type = filename.split('.')[0]
            
            return {
                "filename": filename,
                "type": diagram_type,
                "raw_content": content,
                "lines": content.split('\n'),
                "parsed": self._parse_diagram_type(diagram_type, content)
            }
        except Exception as e:
            print(f"Error extracting {filepath}: {e}")
            return {}
    
    def _parse_diagram_type(self, diagram_type: str, content: str) -> Dict[str, Any]:
        """Parse diagram based on type"""
        if diagram_type == "er":
            return self._parse_er_diagram(content)
        elif diagram_type == "sequence":
            return self._parse_sequence_diagram(content)
        elif diagram_type == "activity":
            return self._parse_activity_diagram(content)
        else:
            return {"raw": content}
    
    def _parse_er_diagram(self, content: str) -> Dict[str, Any]:
        """Parse Entity Relationship diagram"""
        entities = {}
        relationships = []
        
        lines = content.split('\n')
        current_entity = None
        
        for line in lines:
            line = line.strip()
            
            # Detect entity
            if re.match(r'^[A-Z]\w+$', line) and not line.startswith('├') and not line.startswith('└'):
                current_entity = line
                entities[current_entity] = {"fields": [], "primary_key": None}
            
            # Detect fields
            elif current_entity and (line.startswith('├') or line.startswith('└')):
                field_line = line.lstrip('├└─ ')
                
                # Extract field name and type
                if '(' in field_line:
                    field_name = field_line.split('(')[0].strip()
                    field_type = field_line.split('(')[1].rstrip(')')
                    
                    if 'PK' in field_type:
                        entities[current_entity]['primary_key'] = field_name
                    
                    entities[current_entity]['fields'].append({
                        "name": field_name,
                        "type": field_type
                    })
            
            # Detect relationships
            elif '->' in line and current_entity:
                relationships.append(line)
        
        return {
            "entities": entities,
            "relationships": relationships,
            "entity_count": len(entities),
            "relationship_count": len(relationships)
        }
    
    def _parse_sequence_diagram(self, content: str) -> Dict[str, Any]:
        """Parse Sequence diagram"""
        actors = []
        interactions = []
        flows = []
        
        lines = content.split('\n')
        current_flow = None
        
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            
            # Detect actors
            if line_stripped.startswith('- ') and i < 10:
                actor = line_stripped.lstrip('- ')
                actors.append(actor)
            
            # Detect numbered steps
            elif re.match(r'^\d+\.\s', line_stripped):
                step_num = re.match(r'^(\d+)\.\s', line_stripped).group(1)
                step_content = re.sub(r'^\d+\.\s+', '', line_stripped)
                interactions.append({
                    "step": int(step_num),
                    "action": step_content
                })
            
            # Detect flows
            elif line_stripped.endswith(':'):
                current_flow = line_stripped.rstrip(':')
                flows.append({"name": current_flow, "steps": []})
        
        return {
            "actors": actors,
            "interactions": interactions,
            "flows": flows,
            "actor_count": len(actors),
            "step_count": len(interactions)
        }
    
    def _parse_activity_diagram(self, content: str) -> Dict[str, Any]:
        """Parse Activity diagram"""
        activities = []
        decisions = []
        paths = []
        
        lines = content.split('\n')
        
        for line in lines:
            line_stripped = line.strip()
            
            # Detect activities [...]
            if line_stripped.startswith('[') and line_stripped.endswith(']'):
                activity = line_stripped.strip('[]')
                activities.append(activity)
            
            # Detect decisions {...}
            elif line_stripped.startswith('{') and line_stripped.endswith('}'):
                decision = line_stripped.strip('{}')
                decisions.append(decision)
            
            # Detect paths
            elif '→' in line_stripped or '->' in line_stripped:
                paths.append(line_stripped)
        
        return {
            "activities": activities,
            "decisions": decisions,
            "paths": paths,
            "activity_count": len(activities),
            "decision_count": len(decisions)
        }
    
    def extract_all_diagrams(self) -> Dict[str, Dict[str, Any]]:
        """Extract all diagrams from folder"""
        if not os.path.exists(self.diagram_folder):
            print(f"Folder {self.diagram_folder} not found")
            return {}
        
        for filename in os.listdir(self.diagram_folder):
            if filename.endswith('.txt'):
                filepath = os.path.join(self.diagram_folder, filename)
                diagram_data = self.extract_from_text_file(filepath)
                if diagram_data:
                    diagram_type = diagram_data['type']
                    self.diagrams[diagram_type] = diagram_data
                    print(f"✓ Extracted {diagram_type}: {diagram_data['parsed']}")
        
        return self.diagrams
    
    def get_raw_content(self, diagram_type: str) -> str:
        """Get raw content of a diagram"""
        if diagram_type in self.diagrams:
            return self.diagrams[diagram_type]['raw_content']
        return ""
    
    def get_parsed_content(self, diagram_type: str) -> Dict[str, Any]:
        """Get parsed content of a diagram"""
        if diagram_type in self.diagrams:
            return self.diagrams[diagram_type]['parsed']
        return {}

def extract_diagrams() -> Dict[str, Dict[str, Any]]:
    """Convenience function to extract all diagrams"""
    extractor = DiagramExtractor()
    return extractor.extract_all_diagrams()

if __name__ == "__main__":
    extractor = DiagramExtractor()
    diagrams = extractor.extract_all_diagrams()
    
    print("\n" + "="*60)
    print("EXTRACTION RESULTS")
    print("="*60)
    
    for dtype, data in diagrams.items():
        print(f"\n{dtype.upper()}:")
        print(f"  Parsed: {data['parsed']}")
