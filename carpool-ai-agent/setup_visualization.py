# -*- coding: utf-8 -*-
"""setup_visualization.py
Setup and run architecture visualization
"""

import subprocess
import sys
import os
import io

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

print(f"📍 Working directory: {os.getcwd()}")

def run_command(cmd, description=""):
    """Run a command and report results"""
    if description:
        print(f"\n📍 {description}")
    
    print(f"   $ {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"   ✅ Success")
            return True
        else:
            print(f"   ❌ Error: {result.stderr}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def check_files():
    """Check if required files exist"""
    print("\n" + "="*60)
    print("CHECKING FILES")
    print("="*60)
    
    files_to_check = [
        ("data/structured/system_memory.json", "System memory"),
        ("visualize_architecture.py", "Visualization script"),
    ]
    
    all_exist = True
    for filepath, description in files_to_check:
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            print(f"✅ {description}: {filepath} ({size} bytes)")
        else:
            print(f"❌ {description}: {filepath} NOT FOUND")
            all_exist = False
    
    return all_exist

def install_dependencies():
    """Install required Python packages"""
    print("\n" + "="*60)
    print("INSTALLING DEPENDENCIES")
    print("="*60)
    
    packages = [
        ("networkx", "NetworkX - Graph library"),
        ("matplotlib", "Matplotlib - Visualization"),
    ]
    
    for package, description in packages:
        print(f"\n📦 {description}")
        run_command(f"pip install {package}", f"Installing {package}...")

def run_visualization():
    """Run the visualization script"""
    print("\n" + "="*60)
    print("RUNNING VISUALIZATION")
    print("="*60)
    
    print("\n📊 Building architecture graph from memory...")
    print("   This will:")
    print("   • Load system memory (system_memory.json)")
    print("   • Build NetworkX graph with services and databases")
    print("   • Create visualization with different node types")
    print("   • Display the graph")
    
    run_command("python visualize_architecture.py", "Executing visualization")

def main():
    """Main setup and execution"""
    
    print("""
    ╔════════════════════════════════════════════════════════════╗
    ║                                                            ║
    ║     🎨 CarpoolHub Architecture Visualization Setup        ║
    ║                                                            ║
    ║     This will build a real graph from system memory       ║
    ║                                                            ║
    ╚════════════════════════════════════════════════════════════╝
    """)
    
    # Check files
    if not check_files():
        print("\n❌ Required files missing. Cannot proceed.")
        sys.exit(1)
    
    # Install dependencies
    response = input("\n❓ Install dependencies? (y/n): ").strip().lower()
    
    if response == 'y':
        install_dependencies()
    
    # Run visualization
    response = input("\n❓ Run visualization now? (y/n): ").strip().lower()
    
    if response == 'y':
        run_visualization()
        
        # Check if image was created
        if os.path.exists("carpool_architecture_graph.png"):
            print("\n✅ Graph image saved: carpool_architecture_graph.png")
        
        print("""
        
        ╔════════════════════════════════════════════════════════════╗
        ║                    ✅ VISUALIZATION COMPLETE               ║
        ║                                                            ║
        ║  What you should see:                                    ║
        ║  • Red squares: Microservices                            ║
        ║  • Teal circles: Database tables                         ║
        ║  • Green diamonds: Process flow steps                    ║
        ║  • Yellow triangles: External services                   ║
        ║                                                            ║
        ║  Edges show relationships and data flow                  ║
        ║                                                            ║
        ║  Next: Review the graph and system_memory.json           ║
        ║                                                            ║
        ╚════════════════════════════════════════════════════════════╝
        """)
    else:
        print("\n👋 Setup complete. Run 'python visualize_architecture.py' when ready.")

if __name__ == "__main__":
    main()
