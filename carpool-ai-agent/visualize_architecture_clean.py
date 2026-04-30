# -*- coding: utf-8 -*-
"""
visualize_architecture_clean.py
Clean layered architecture graph with explicit relationships
"""

import json
import os
import sys
import io
import networkx as nx
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Fix Unicode encoding on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Change to carpool-ai-agent directory if needed
if not os.path.exists("data/structured/system_memory.json"):
    if os.path.exists("carpool-ai-agent"):
        os.chdir("carpool-ai-agent")
    else:
        current = os.path.basename(os.getcwd())
        if current != "carpool-ai-agent":
            for i in range(3):
                if os.path.exists("data/structured/system_memory.json"):
                    break
                os.chdir("..")
                if os.path.exists("carpool-ai-agent"):
                    os.chdir("carpool-ai-agent")
                    break

def load_memory():
    """Load system memory"""
    with open("data/structured/system_memory.json") as f:
        return json.load(f)

def build_layered_graph(memory):
    """Build clean layered architecture graph"""
    
    print("\n" + "="*70)
    print("BUILDING CLEAN LAYERED ARCHITECTURE GRAPH")
    print("="*70)
    
    G = nx.DiGraph()
    
    # ────────────────────────────────────────
    # LAYER 1: SERVICES (Left)
    # ────────────────────────────────────────
    services = memory["system"]["services"]
    print(f"\n📍 LAYER 1: SERVICES ({len(services)} nodes)")
    
    for service in services:
        G.add_node(service, layer="service", x=0)
        print(f"   • {service}")
    
    # ────────────────────────────────────────
    # LAYER 2: FLOWS (Middle)
    # ────────────────────────────────────────
    ride_flow = memory["flows"]["ride_flow"]
    print(f"\n📍 LAYER 2: FLOWS ({len(ride_flow)} nodes)")
    
    for flow_step in ride_flow:
        G.add_node(flow_step, layer="flow", x=2)
        print(f"   • {flow_step}")
    
    # ────────────────────────────────────────
    # LAYER 3: DATABASE (Right)
    # ────────────────────────────────────────
    tables = memory["database"]["tables"]
    print(f"\n📍 LAYER 3: DATABASE ({len(tables)} nodes)")
    
    for table in tables:
        G.add_node(table, layer="database", x=4)
        print(f"   • {table}")
    
    # ────────────────────────────────────────
    # CLEAN RELATIONSHIPS (Explicit Edges)
    # ────────────────────────────────────────
    print(f"\n📍 RELATIONSHIPS (Explicit Edges)")
    
    # ═══ SERVICE → FLOW (Correct Mappings) ═══
    service_flow_edges = [
        ("Ride Service", "request"),
        ("Ride Service", "accept"),
        ("Ride Service", "start"),
        ("Ride Service", "end"),
        ("Matching Engine", "search"),
        ("Payment Service", "end"),
        ("Payment Service", "rate"),
        ("Notification Service", "request"),
        ("Notification Service", "accept"),
        ("Analytics Service", "rate"),
    ]
    
    print(f"\n   Service → Flow ({len(service_flow_edges)} edges):")
    for source, target in service_flow_edges:
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="service_flow")
            print(f"   • {source} → {target}")
    
    # ═══ FLOW → DATABASE (Complete & Verified) ═══
    flow_db_edges = [
        ("search", "users"),
        ("search", "vehicles"),
        ("search", "drivers"),
        ("request", "ride_requests"),
        ("request", "users"),
        ("request", "backup_rides"),
        ("request", "notifications"),
        ("accept", "ride_requests"),
        ("accept", "backup_rides"),
        ("accept", "drivers"),
        ("start", "ride_schedules"),
        ("end", "ride_schedules"),
        ("end", "payments"),
        ("rate", "users"),
    ]
    
    print(f"\n   Flow → Database ({len(flow_db_edges)} edges):")
    for source, target in flow_db_edges:
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="flow_db")
            print(f"   • {source} → {target}")
    
    # ═══ API GATEWAY → SERVICES (Entry Point) ═══
    gateway_edges = [
        ("API Gateway", "User Service"),
        ("API Gateway", "Ride Service"),
        ("API Gateway", "Matching Engine"),
        ("API Gateway", "Payment Service"),
        ("API Gateway", "Notification Service"),
        ("API Gateway", "Analytics Service"),
    ]
    
    print(f"\n   API Gateway → Services ({len(gateway_edges)} edges):")
    for source, target in gateway_edges:
        if source in G.nodes and target in G.nodes:
            G.add_edge(source, target, style="gateway_service")
            print(f"   • {source} → {target}")
    
    # Flow sequence (steps in order)
    print(f"\n   Flow Sequence:")
    for i in range(len(ride_flow) - 1):
        source, target = ride_flow[i], ride_flow[i+1]
        G.add_edge(source, target, style="flow_sequence")
        print(f"   • {source} → {target}")
    
    print(f"\n✓ Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    
    return G

def layout_by_layer(G):
    """Position nodes by layer for clean visualization"""
    
    pos = {}
    layer_nodes = {"service": [], "flow": [], "database": []}
    
    # Group nodes by layer
    for node, attr in G.nodes(data=True):
        layer = attr.get("layer", "service")
        layer_nodes[layer].append(node)
    
    # Position services (left)
    for i, node in enumerate(layer_nodes["service"]):
        pos[node] = (0, -i * 1.5)
    
    # Position flows (middle)
    for i, node in enumerate(layer_nodes["flow"]):
        pos[node] = (2, -i * 1.5)
    
    # Position databases (right)
    for i, node in enumerate(layer_nodes["database"]):
        pos[node] = (4, -i * 1.5)
    
    return pos

def draw_layered_graph(G, pos, memory):
    """Draw the clean layered graph"""
    
    print("\n" + "="*70)
    print("RENDERING GRAPH")
    print("="*70)
    
    fig, ax = plt.subplots(figsize=(16, 12))
    
    # Get nodes by layer for color coding
    service_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "service"]
    flow_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "flow"]
    db_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "database"]
    
    # Draw nodes by layer
    print("  Drawing nodes...")
    
    # Services (red)
    if service_nodes:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=service_nodes,
            node_color="#FF6B6B",
            node_size=3000,
            node_shape="s",
            ax=ax,
            label="Services (Layer 1)"
        )
    
    # Flows (blue)
    if flow_nodes:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=flow_nodes,
            node_color="#4ECDC4",
            node_size=2500,
            node_shape="o",
            ax=ax,
            label="Flows (Layer 2)"
        )
    
    # Databases (green)
    if db_nodes:
        nx.draw_networkx_nodes(
            G, pos,
            nodelist=db_nodes,
            node_color="#95E1D3",
            node_size=2500,
            node_shape="^",
            ax=ax,
            label="Database (Layer 3)"
        )
    
    # Draw edges by type
    print("  Drawing edges...")
    
    # Service → Flow (solid, thick)
    service_flow_edges = [(u, v) for u, v, attr in G.edges(data=True) 
                          if attr.get("style") == "service_flow"]
    if service_flow_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=service_flow_edges,
            edge_color="#FF6B6B",
            width=2.5,
            alpha=0.7,
            arrows=True,
            arrowsize=20,
            ax=ax
        )
    
    # Flow → Database (solid, thick)
    flow_db_edges = [(u, v) for u, v, attr in G.edges(data=True) 
                     if attr.get("style") == "flow_db"]
    if flow_db_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=flow_db_edges,
            edge_color="#4ECDC4",
            width=2.5,
            alpha=0.7,
            arrows=True,
            arrowsize=20,
            ax=ax
        )
    
    # API Gateway → Services (thick purple)
    gateway_edges = [(u, v) for u, v, attr in G.edges(data=True) 
                     if attr.get("style") == "gateway_service"]
    if gateway_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=gateway_edges,
            edge_color="#9B59B6",
            width=3,
            alpha=0.8,
            arrows=True,
            arrowsize=20,
            ax=ax,
            style="solid"
        )
    
    # Flow sequence (dashed, thin)
    flow_seq_edges = [(u, v) for u, v, attr in G.edges(data=True) 
                      if attr.get("style") == "flow_sequence"]
    if flow_seq_edges:
        nx.draw_networkx_edges(
            G, pos,
            edgelist=flow_seq_edges,
            edge_color="#95E1D3",
            width=1.5,
            style="dashed",
            alpha=0.5,
            arrows=True,
            arrowsize=15,
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
    
    # Title and legend
    ax.set_title("CarpoolHub Clean Layered Architecture", 
                 fontsize=16, fontweight="bold", pad=20)
    
    ax.legend(loc="upper left", fontsize=11, scatterpoints=1)
    
    # Add layer labels
    ax.text(-0.3, 1, "LAYER 1\nSERVICES", fontsize=12, fontweight="bold",
            ha="center", transform=ax.transData, 
            bbox=dict(boxstyle="round", facecolor="#FFE5E5", alpha=0.7))
    
    ax.text(2, 1, "LAYER 2\nFLOWS", fontsize=12, fontweight="bold",
            ha="center", transform=ax.transData,
            bbox=dict(boxstyle="round", facecolor="#E5F7F6", alpha=0.7))
    
    ax.text(4.3, 1, "LAYER 3\nDATABASE", fontsize=12, fontweight="bold",
            ha="center", transform=ax.transData,
            bbox=dict(boxstyle="round", facecolor="#E5F9F5", alpha=0.7))
    
    # Add statistics
    stats_text = f"""
Graph Statistics:
• Nodes: {G.number_of_nodes()}
• Edges: {G.number_of_edges()}
• Services: {len(service_nodes)}
• Flows: {len(flow_nodes)}
• Tables: {len(db_nodes)}
    """
    
    ax.text(-0.5, -8, stats_text, fontsize=9, verticalalignment="top",
            bbox=dict(boxstyle="round", facecolor="wheat", alpha=0.8),
            family="monospace")
    
    ax.axis("off")
    plt.tight_layout()
    
    return fig

def print_graph_summary(G, memory):
    """Print graph summary"""
    
    print("\n" + "="*70)
    print("GRAPH SUMMARY")
    print("="*70)
    
    # Nodes by layer
    service_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "service"]
    flow_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "flow"]
    db_nodes = [n for n, attr in G.nodes(data=True) if attr.get("layer") == "database"]
    
    print(f"\n📊 LAYER 1 - SERVICES ({len(service_nodes)}):")
    for node in service_nodes:
        incoming = G.in_degree(node)
        outgoing = G.out_degree(node)
        print(f"   • {node} (in:{incoming}, out:{outgoing})")
    
    print(f"\n📊 LAYER 2 - FLOWS ({len(flow_nodes)}):")
    for node in flow_nodes:
        incoming = G.in_degree(node)
        outgoing = G.out_degree(node)
        print(f"   • {node} (in:{incoming}, out:{outgoing})")
    
    print(f"\n📊 LAYER 3 - DATABASE ({len(db_nodes)}):")
    for node in db_nodes:
        incoming = G.in_degree(node)
        outgoing = G.out_degree(node)
        print(f"   • {node} (in:{incoming}, out:{outgoing})")
    
    # Edge summary
    print(f"\n🔗 EDGES:")
    print(f"   • Service → Flow: {len([e for e in G.edges(data=True) if e[2].get('style') == 'service_flow'])}")
    print(f"   • Flow → Database: {len([e for e in G.edges(data=True) if e[2].get('style') == 'flow_db'])}")
    print(f"   • Flow Sequence: {len([e for e in G.edges(data=True) if e[2].get('style') == 'flow_sequence'])}")
    print(f"   • Total: {G.number_of_edges()}")

def main():
    """Main execution"""
    
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   CLEAN LAYERED ARCHITECTURE VISUALIZATION               ║
    ║        (Step 1 - Fixed Graph Structure)                  ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Load memory
    memory = load_memory()
    
    # Build graph
    G = build_layered_graph(memory)
    
    # Print summary
    print_graph_summary(G, memory)
    
    # Create layout
    pos = layout_by_layer(G)
    
    # Draw graph
    fig = draw_layered_graph(G, pos, memory)
    
    # Save
    output_path = "carpool_architecture_clean.png"
    print(f"\n📁 Saving to: {output_path}")
    plt.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"✓ Saved")
    
    # Show
    print("\n🖼️  Displaying graph...")
    plt.show()
    
    print("""
    ✅ CLEAN LAYERED GRAPH COMPLETE
    
    Structure:
    • LEFT (Red Squares): 7 Services
    • MIDDLE (Teal Circles): 6 Flow Steps
    • RIGHT (Green Triangles): 8 Database Tables
    
    Relationships:
    • Red Arrows: Service activates Flow
    • Teal Arrows: Flow updates Database
    • Dashed Arrows: Flow sequence (order)
    """)

if __name__ == "__main__":
    main()
