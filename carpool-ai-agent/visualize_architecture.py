# -*- coding: utf-8 -*-
"""visualize_architecture.py
Builds and visualizes the CarpoolHub architecture graph from memory
"""

import json
import os
import sys
import io
import networkx as nx
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import warnings
warnings.filterwarnings('ignore')

# Fix Unicode encoding on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Change to carpool-ai-agent directory if needed
if not os.path.exists("data/structured/system_memory.json"):
    # Try to find carpool-ai-agent directory
    if os.path.exists("carpool-ai-agent"):
        os.chdir("carpool-ai-agent")
    else:
        # Check if we're already in carpool-ai-agent
        current = os.path.basename(os.getcwd())
        if current != "carpool-ai-agent":
            print("⚠️  Attempting to locate carpool-ai-agent...")
            # Search up the directory tree
            for i in range(3):
                if os.path.exists("data/structured/system_memory.json"):
                    break
                os.chdir("..")
                if os.path.exists("carpool-ai-agent"):
                    os.chdir("carpool-ai-agent")
                    break

def load_memory():
    """Load system memory"""
    memory_path = "data/structured/system_memory.json"
    
    if not os.path.exists(memory_path):
        print(f"Error: {memory_path} not found")
        return None
    
    try:
        with open(memory_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading memory: {e}")
        return None

def build_graph(memory):
    """Build NetworkX graph from memory"""
    
    G = nx.DiGraph()
    
    print("\n" + "="*60)
    print("BUILDING GRAPH FROM MEMORY")
    print("="*60)
    
    # ────────────────────────────────────────
    # ADD SERVICES (Microservices)
    # ────────────────────────────────────────
    services = memory.get("system", {}).get("services", [])
    print(f"\n✓ Adding {len(services)} microservices...")
    
    for service in services:
        G.add_node(service, type="service", size=3000, color="#FF6B6B")
    
    # ────────────────────────────────────────
    # ADD DATABASE TABLES
    # ────────────────────────────────────────
    tables = memory.get("database", {}).get("tables", [])
    print(f"✓ Adding {len(tables)} database tables...")
    
    for table in tables:
        G.add_node(table, type="database", size=2500, color="#4ECDC4")
    
    # ────────────────────────────────────────
    # ADD FLOWS (Process flows)
    # ────────────────────────────────────────
    flows = memory.get("flows", {})
    print(f"✓ Adding {len(flows)} process flows...")
    
    for flow_name, flow_steps in flows.items():
        # Add nodes for flow steps
        for step in flow_steps:
            if step not in G.nodes:
                G.add_node(step, type="flow", size=2000, color="#95E1D3")
        
        # Add edges between consecutive steps
        for i in range(len(flow_steps) - 1):
            G.add_edge(
                flow_steps[i],
                flow_steps[i+1],
                weight=2,
                style="dashed",
                label=flow_name
            )
        
        print(f"  - {flow_name}: {' → '.join(flow_steps)}")
    
    # ────────────────────────────────────────
    # ADD RELATIONSHIPS (Service <-> Database)
    # ────────────────────────────────────────
    relationships = memory.get("relationships", [])
    print(f"\n✓ Adding {len(relationships)} relationships...")
    
    for rel in relationships:
        source = rel.get("source")
        target = rel.get("target")
        rel_type = rel.get("type", "connects")
        
        # Only add if both nodes exist
        if source in G.nodes and target in G.nodes:
            G.add_edge(
                source,
                target,
                weight=1.5,
                rel_type=rel_type
            )
    
    # ────────────────────────────────────────
    # ADD EXTERNAL SERVICES
    # ────────────────────────────────────────
    external = memory.get("system", {}).get("external_services", [])
    print(f"✓ Adding {len(external)} external services...")
    
    for ext_service in external:
        G.add_node(ext_service, type="external", size=2000, color="#FFE66D")
    
    print(f"\n✓ Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    return G

def draw_graph(G, memory):
    """Draw the graph with proper layout and styling"""
    
    print("\n" + "="*60)
    print("DRAWING GRAPH")
    print("="*60)
    
    # Create figure with larger size for better visibility
    fig, ax = plt.subplots(figsize=(18, 12))
    
    # Use spring layout for better positioning
    print("  Computing layout...")
    pos = nx.spring_layout(G, k=2, iterations=50, seed=42)
    
    # Separate nodes by type for different styling
    services = [node for node, attr in G.nodes(data=True) if attr.get("type") == "service"]
    databases = [node for node, attr in G.nodes(data=True) if attr.get("type") == "database"]
    flows = [node for node, attr in G.nodes(data=True) if attr.get("type") == "flow"]
    external = [node for node, attr in G.nodes(data=True) if attr.get("type") == "external"]
    
    # Draw services (red)
    if services:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=services,
            node_color="#FF6B6B",
            node_size=3000,
            node_shape="s",
            label="Microservices",
            ax=ax
        )
    
    # Draw databases (teal)
    if databases:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=databases,
            node_color="#4ECDC4",
            node_size=2500,
            node_shape="o",
            label="Database Tables",
            ax=ax
        )
    
    # Draw flows (green)
    if flows:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=flows,
            node_color="#95E1D3",
            node_size=2000,
            node_shape="D",
            label="Process Flows",
            ax=ax
        )
    
    # Draw external services (yellow)
    if external:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=external,
            node_color="#FFE66D",
            node_size=2000,
            node_shape="^",
            label="External Services",
            ax=ax
        )
    
    # Draw edges with different styles
    print("  Drawing edges...")
    
    # Service to database edges (solid)
    service_db_edges = [(u, v) for u, v in G.edges() 
                        if G.nodes[u].get("type") == "service" 
                        and G.nodes[v].get("type") == "database"]
    
    if service_db_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=service_db_edges,
            edge_color="#666666",
            width=2,
            alpha=0.6,
            arrows=True,
            arrowsize=20,
            arrowstyle="->",
            ax=ax
        )
    
    # Flow edges (dashed)
    flow_edges = [(u, v) for u, v in G.edges() 
                  if G.nodes[u].get("type") == "flow" 
                  and G.nodes[v].get("type") == "flow"]
    
    if flow_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=flow_edges,
            edge_color="#95E1D3",
            width=2,
            alpha=0.8,
            style="dashed",
            arrows=True,
            arrowsize=15,
            arrowstyle="->",
            ax=ax
        )
    
    # Other edges
    other_edges = [e for e in G.edges() if e not in service_db_edges and e not in flow_edges]
    
    if other_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=other_edges,
            edge_color="#CCCCCC",
            width=1.5,
            alpha=0.4,
            arrows=True,
            arrowsize=15,
            arrowstyle="->",
            ax=ax
        )
    
    # Draw labels
    print("  Adding labels...")
    nx.draw_networkx_labels(
        G, pos,
        font_size=8,
        font_weight="bold",
        font_family="monospace",
        ax=ax
    )
    
    # Add title and legend
    ax.set_title("CarpoolHub Architecture Graph", fontsize=18, fontweight="bold", pad=20)
    ax.legend(scatterpoints=1, loc="upper left", fontsize=10)
    
    ax.axis("off")
    
    # Add statistics box
    stats_text = f"""
    Graph Statistics:
    • Nodes: {G.number_of_nodes()}
    • Edges: {G.number_of_edges()}
    • Services: {len(services)}
    • DB Tables: {len(databases)}
    • Flows: {len(flows)}
    • External: {len(external)}
    """
    
    ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
            fontsize=9, verticalalignment="top",
            bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.8),
            family="monospace")
    
    plt.tight_layout()
    
    return fig

def print_graph_info(G, memory):
    """Print detailed graph information"""
    
    print("\n" + "="*60)
    print("GRAPH INFORMATION")
    print("="*60)
    
    # Node statistics
    print(f"\n📊 Nodes: {G.number_of_nodes()}")
    print(f"📊 Edges: {G.number_of_edges()}")
    
    # Services
    services = [node for node, attr in G.nodes(data=True) if attr.get("type") == "service"]
    print(f"\n🔴 Microservices ({len(services)}):")
    for s in services:
        print(f"   • {s}")
    
    # Database tables
    tables = [node for node, attr in G.nodes(data=True) if attr.get("type") == "database"]
    print(f"\n🟢 Database Tables ({len(tables)}):")
    for t in tables:
        print(f"   • {t}")
    
    # Flows
    flows = [node for node, attr in G.nodes(data=True) if attr.get("type") == "flow"]
    print(f"\n🔵 Flow Steps ({len(flows)}):")
    for f in flows:
        print(f"   • {f}")
    
    # Relationships
    print(f"\n🔗 Key Relationships:")
    relationships = memory.get("relationships", [])
    for rel in relationships[:10]:
        print(f"   • {rel['source']} → {rel['target']} ({rel['type']})")
    
    if len(relationships) > 10:
        print(f"   ... and {len(relationships) - 10} more")
    
    # Network metrics
    print(f"\n📈 Network Metrics:")
    print(f"   • Density: {nx.density(G):.3f}")
    
    try:
        # Find most connected nodes
        in_degree = dict(G.in_degree())
        out_degree = dict(G.out_degree())
        
        most_in = max(in_degree, key=in_degree.get)
        most_out = max(out_degree, key=out_degree.get)
        
        print(f"   • Most connected (incoming): {most_in} ({in_degree[most_in]} connections)")
        print(f"   • Most connected (outgoing): {most_out} ({out_degree[most_out]} connections)")
    except:
        pass

def main():
    """Main execution"""
    
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     CarpoolHub Architecture Visualization               ║
    ║          (Real Graph from System Memory)                ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Load memory
    memory = load_memory()
    if not memory:
        print("Failed to load memory. Exiting.")
        sys.exit(1)
    
    # Build graph
    G = build_graph(memory)
    
    # Print information
    print_graph_info(G, memory)
    
    # Draw graph
    print("\n" + "="*60)
    print("RENDERING VISUALIZATION")
    print("="*60 + "\n")
    
    fig = draw_graph(G, memory)
    
    # Save and show
    output_path = "carpool_architecture_graph.png"
    print(f"Saving graph to: {output_path}")
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    
    print("✓ Graph saved successfully")
    print("\nShowing visualization...")
    plt.show()
    
    print("\n✅ Visualization complete!")

if __name__ == "__main__":
    main()
