# 🎨 CarpoolHub Architecture Visualization

## Overview

Build and visualize your **complete system architecture as a real graph** from memory.

```
System Memory → NetworkX Graph → Beautiful Visualization
```

## What You Now Have

### 1. **system_memory.json** - Consolidated Architecture Memory
```json
{
  "system": {
    "services": [7 microservices],
    "external_services": [4 external APIs]
  },
  "database": {
    "tables": [8 database tables]
  },
  "flows": {
    "ride_flow": [...],
    "backup_flow": [...],
    "payment_flow": [...]
  },
  "relationships": [14 service-database relationships]
}
```

### 2. **visualize_architecture.py** - Graph Visualization
- Builds NetworkX directed graph from memory
- Creates semantic visualization with node types
- Draws relationships and data flows
- Exports as high-quality PNG

### 3. **setup_visualization.py** - Automated Setup
- Installs dependencies (NetworkX, Matplotlib)
- Validates files
- Runs visualization with one command

## 🚀 Quick Start

### Option 1: Automated Setup (Easiest)

```bash
python setup_visualization.py
```

Then:
1. Type `y` when asked to install dependencies
2. Type `y` when asked to run visualization
3. Wait for graph to display

### Option 2: Manual Setup

```bash
# 1. Install dependencies
pip install networkx matplotlib

# 2. Run visualization
python visualize_architecture.py
```

## 📊 What You'll See

A beautiful graph visualization with:

### Node Types (Color-coded)
- 🔴 **Red Squares** - Microservices (API Gateway, Ride Service, etc.)
- 🟢 **Teal Circles** - Database Tables (users, rides, payments, etc.)
- 🔵 **Green Diamonds** - Process Flow Steps (search, request, accept, etc.)
- 🟡 **Yellow Triangles** - External Services (Google Maps, Stripe, etc.)

### Edge Types (Different Styles)
- **Solid Lines** - Service to Database connections
- **Dashed Lines** - Process flow sequences
- **Thin Lines** - Other relationships

### Example Graph Output
```
                    [API Gateway]
                    /    |    \    \
                   /     |     \    \
         [User Service] [Ride Service] [Matching Engine] [Payment Service]
              |              |              |                  |
              ▼              ▼              ▼                  ▼
          [users]    [ride_schedules]  [users]           [payments]
          [drivers]  [ride_requests]   [routes]


Process Flow Example:
[search] ──→ [request] ──→ [accept] ──→ [start] ──→ [end] ──→ [rate]
```

## 📈 Graph Statistics

After running, you'll see:

```
Graph Statistics:
• Nodes: 35+
• Edges: 50+
• Services: 7
• DB Tables: 8
• Flows: 15
• External: 4

Network Metrics:
• Density: 0.041
• Most connected (incoming): API Gateway
• Most connected (outgoing): User Service
```

## 🔍 Memory Structure Breakdown

### system_memory.json Contains:

#### System Definition
```json
"system": {
  "name": "CarpoolHub",
  "services": [
    "User Service",
    "Ride Service",
    "Matching Engine",
    "Payment Service",
    "Notification Service",
    "Analytics Service",
    "API Gateway"
  ]
}
```

#### Database Schema
```json
"database": {
  "tables": [
    "users",
    "vehicles",
    "ride_schedules",
    "ride_requests",
    "payments",
    "drivers",
    "notifications",
    "backup_rides"
  ]
}
```

#### Business Flows
```json
"flows": {
  "ride_flow": ["search", "request", "accept", "start", "end", "rate"],
  "backup_flow": ["cancel", "trigger_backup", "notify_next", "confirm", "restart"],
  "payment_flow": ["calculate_cost", "process_payment", "send_receipt", "reconcile"]
}
```

#### Relationships
```json
"relationships": [
  {
    "source": "User Service",
    "target": "users",
    "type": "manages"
  },
  {
    "source": "Ride Service",
    "target": "ride_schedules",
    "type": "manages"
  },
  ...
]
```

## 🧠 How It Works

### Step 1: Load Memory
```python
with open("data/structured/system_memory.json") as f:
    memory = json.load(f)
```

### Step 2: Build Graph
```python
G = nx.DiGraph()

# Add nodes by type
for service in memory["system"]["services"]:
    G.add_node(service, type="service")

for table in memory["database"]["tables"]:
    G.add_node(table, type="database")

# Add edges from relationships
for rel in memory["relationships"]:
    G.add_edge(rel["source"], rel["target"])
```

### Step 3: Visualize
```python
nx.draw(G, pos, with_labels=True, node_color=colors, ...)
plt.show()
```

## ✨ Key Features

✅ **Real Graph Structure** - Actual data relationships  
✅ **Type-Based Coloring** - Easily identify components  
✅ **Multiple Flow Support** - Shows ride, backup, payment flows  
✅ **Service-Database Mapping** - Clear data ownership  
✅ **External Integration** - Shows third-party services  
✅ **Network Metrics** - Density, connectivity analysis  
✅ **High-Quality Output** - PNG export at 150 DPI  

## 🔧 Customization

### Add More Services

Edit `data/structured/system_memory.json`:

```json
"system": {
  "services": [
    "User Service",
    "Ride Service",
    "My New Service"  // Add here
  ]
}
```

### Add More Database Tables

```json
"database": {
  "tables": [
    "users",
    "my_new_table"  // Add here
  ]
}
```

### Add Relationships

```json
"relationships": [
  {
    "source": "My New Service",
    "target": "my_new_table",
    "type": "manages"
  }
]
```

Then re-run:
```bash
python visualize_architecture.py
```

## 📝 Common Tasks

### View Graph Statistics
```bash
python visualize_architecture.py
# Shows node count, edge count, metrics
```

### Export High-Quality Image
```python
# Automatic - saves as carpool_architecture_graph.png
# Modify in visualize_architecture.py:
plt.savefig("output.png", dpi=300, bbox_inches="tight")
```

### Analyze Node Importance
```python
# Most connected nodes
in_degree = dict(G.in_degree())
most_important = max(in_degree, key=in_degree.get)
```

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'networkx'"
```bash
pip install networkx matplotlib
```

### "FileNotFoundError: data/structured/system_memory.json"
Ensure you're in the carpool-ai-agent directory:
```bash
cd "d:\Coorporate car pooling system\carpool-ai-agent"
python visualize_architecture.py
```

### Graph Looks Cluttered
The spring layout algorithm sometimes needs adjustment. Edit `visualize_architecture.py`:
```python
# Increase k for more spread
pos = nx.spring_layout(G, k=3, iterations=100)  # Increase k
```

### Empty Graph
Check that system_memory.json has valid data:
```bash
python -c "import json; print(json.load(open('data/structured/system_memory.json')))"
```

## 📚 Next Steps

1. ✅ Run visualization with `python visualize_architecture.py`
2. ✅ Review graph and verify it makes sense
3. ✅ Check system_memory.json for accuracy
4. ✅ Add more services/tables if needed
5. ✅ Use graph for documentation and analysis

## 📊 Integration with Pipeline

This visualization integrates with your 6-step pipeline:

```
Pipeline Output → system_memory.json → Visualization
    ↓                     ↓                  ↓
Structured JSON    Consolidated Memory   Real Graph
```

## 📖 Reference

### NetworkX Documentation
- [NetworkX Docs](https://networkx.org/)
- [Graph Layouts](https://networkx.org/documentation/stable/reference/drawing.html)

### Matplotlib Documentation
- [Matplotlib Docs](https://matplotlib.org/)
- [Graph Visualization](https://matplotlib.org/stable/gallery/index.html)

---

**Status:** ✅ Ready to Use  
**Version:** 1.0  
**Last Updated:** May 1, 2026
