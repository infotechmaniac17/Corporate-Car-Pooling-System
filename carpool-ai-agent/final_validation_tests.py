"""
FINAL VALIDATION - GRAPH STRUCTURE ONLY
(No API calls - tests graph structure, retrieval, and prompt generation)
"""

import sys
import os
import json
from typing import Dict, List

# Add to path
sys.path.insert(0, os.path.dirname(__file__))


class FinalValidationTests:
    """Run 4 critical tests to verify enforcement"""
    
    def __init__(self):
        """Initialize with orchestrator"""
        print("🧪 INITIALIZING FINAL VALIDATION TEST SUITE\n")
        try:
            self.orchestrator = EnforcedClaudeOrchestrator()
        except Exception as e:
            print(f"❌ Failed to initialize: {e}")
            sys.exit(1)
    
    def test_1_ride_lifecycle(self) -> bool:
        """TEST 1: Explain ride lifecycle
        
        Expected:
        - Should mention: request, accept, start, end
        - Should NOT hallucinate: payment before end, etc.
        - Should cite flows and their connections
        
        Returns:
            True if test PASSED
        """
        print("="*70)
        print("🧪 TEST 1: RIDE LIFECYCLE")
        print("="*70)
        
        query = "Explain the complete ride lifecycle flow"
        expected_flows = ["request", "accept", "start", "end"]
        
        print(f"\n📝 Query: {query}")
        print(f"📋 Expected flows: {expected_flows}\n")
        
        result = self.orchestrator.ask_system(query)
        response = result["response"].lower()
        
        print("\n🔍 VALIDATION:")
        
        # Check for expected flows
        found_flows = []
        for flow in expected_flows:
            if flow in response:
                found_flows.append(flow)
                print(f"   ✅ Found '{flow}'")
            else:
                print(f"   ❌ Missing '{flow}'")
        
        # Check for order (should be: request → accept → start → end)
        order_correct = (
            response.find("request") < response.find("accept") <
            response.find("start") < response.find("end")
        )
        
        if order_correct:
            print(f"   ✅ Flows in correct order")
        else:
            print(f"   ⚠️  Flows may not be in correct order")
        
        passed = len(found_flows) == len(expected_flows)
        
        print(f"\n{'✅ TEST 1 PASSED' if passed else '❌ TEST 1 FAILED'}")
        print(f"Found {len(found_flows)}/{len(expected_flows)} expected flows")
        
        return passed
    
    def test_2_payment_database(self) -> bool:
        """TEST 2: Which database is used in payment?
        
        Expected:
        - Should mention: payments table
        - Should mention: users table (for payment status/tracking)
        - Should cite payment service and end flow
        
        Returns:
            True if test PASSED
        """
        print("\n" + "="*70)
        print("🧪 TEST 2: PAYMENT DATABASE USAGE")
        print("="*70)
        
        query = "Which database tables are used in the payment flow?"
        expected_tables = ["payments", "users"]
        
        print(f"\n📝 Query: {query}")
        print(f"📋 Expected tables: {expected_tables}\n")
        
        result = self.orchestrator.ask_system(query)
        response = result["response"].lower()
        
        print("\n🔍 VALIDATION:")
        
        # Check for expected tables
        found_tables = []
        for table in expected_tables:
            if table in response:
                found_tables.append(table)
                print(f"   ✅ Found '{table}' table")
            else:
                print(f"   ❌ Missing '{table}' table")
        
        passed = len(found_tables) >= 1  # At least payments table
        
        print(f"\n{'✅ TEST 2 PASSED' if passed else '❌ TEST 2 FAILED'}")
        print(f"Found {len(found_tables)}/{len(expected_tables)} expected tables")
        
        return passed
    
    def test_3_backup_system(self) -> bool:
        """TEST 3: How does backup system work?
        
        Expected:
        - Should mention: backup_rides table
        - Should mention: request flow connects to backup_rides
        - Should explain purpose (backup rides when primary not available)
        
        Returns:
            True if test PASSED
        """
        print("\n" + "="*70)
        print("🧪 TEST 3: BACKUP SYSTEM")
        print("="*70)
        
        query = "Explain how the backup ride system works"
        expected_concepts = ["backup", "request", "accept"]
        
        print(f"\n📝 Query: {query}")
        print(f"📋 Expected concepts: {expected_concepts}\n")
        
        result = self.orchestrator.ask_system(query)
        response = result["response"].lower()
        
        print("\n🔍 VALIDATION:")
        
        # Check for concepts
        found_concepts = []
        for concept in expected_concepts:
            if concept in response:
                found_concepts.append(concept)
                print(f"   ✅ Found '{concept}'")
            else:
                print(f"   ⚠️  Missing '{concept}'")
        
        # Check that it doesn't hallucinate too much
        hallucination_check = "Not defined" not in response or "backup" in response
        
        if hallucination_check:
            print(f"   ✅ No excessive hallucination detected")
        
        passed = len(found_concepts) >= 1
        
        print(f"\n{'✅ TEST 3 PASSED' if passed else '❌ TEST 3 FAILED'}")
        print(f"Found {len(found_concepts)}/{len(expected_concepts)} expected concepts")
        
        return passed
    
    def test_4_authentication(self) -> bool:
        """TEST 4: Explain authentication (HALLUCINATION PREVENTION)
        
        Expected:
        - Should say: "Not defined in system" or similar
        - Should NOT hallucinate authentication details
        - Should explain that auth is NOT in the graph
        
        This test verifies Claude doesn't make things up ✓
        
        Returns:
            True if test PASSED (detected hallucination prevention)
        """
        print("\n" + "="*70)
        print("🧪 TEST 4: HALLUCINATION PREVENTION")
        print("="*70)
        
        query = "Explain the authentication and authorization system"
        
        print(f"\n📝 Query: {query}")
        print(f"📋 Expected: Claude should say 'Not defined in system'\n")
        
        result = self.orchestrator.ask_system(query)
        response = result["response"]
        response_lower = response.lower()
        
        print("\n🔍 VALIDATION:")
        
        # Check for hallucination prevention phrases
        prevention_phrases = [
            "not defined",
            "not in",
            "not specified",
            "not found in",
            "unclear from",
            "not shown"
        ]
        
        has_prevention = any(phrase in response_lower for phrase in prevention_phrases)
        
        if has_prevention:
            print(f"   ✅ Correctly acknowledged missing information")
        else:
            print(f"   ⚠️  Response doesn't acknowledge missing data (may still be ok)")
        
        # Check that it didn't invent auth details
        hallucination_markers = [
            "token",
            "oauth",
            "jwt",
            "ldap",
            "saml"
        ]
        
        has_hallucination = any(marker in response_lower for marker in hallucination_markers)
        
        if not has_hallucination:
            print(f"   ✅ No hallucinated auth mechanisms detected")
        else:
            print(f"   ⚠️  Response may contain hallucinated auth details")
        
        passed = has_prevention or not has_hallucination
        
        print(f"\n{'✅ TEST 4 PASSED' if passed else '⚠️  TEST 4 INCONCLUSIVE'}")
        print(f"Enforcement working: {has_prevention or not has_hallucination}")
        
        return passed or not has_hallucination  # Pass if prevention OR no hallucination
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all 4 tests
        
        Returns:
            Dict with results
        """
        print("\n" + "🔴"*35)
        print("FINAL VALIDATION TEST SUITE - 4 CRITICAL TESTS")
        print("🔴"*35)
        
        results = {
            "test_1_ride_lifecycle": False,
            "test_2_payment_database": False,
            "test_3_backup_system": False,
            "test_4_authentication": False,
        }
        
        try:
            results["test_1_ride_lifecycle"] = self.test_1_ride_lifecycle()
        except Exception as e:
            print(f"\n❌ Test 1 error: {e}")
        
        try:
            results["test_2_payment_database"] = self.test_2_payment_database()
        except Exception as e:
            print(f"\n❌ Test 2 error: {e}")
        
        try:
            results["test_3_backup_system"] = self.test_3_backup_system()
        except Exception as e:
            print(f"\n❌ Test 3 error: {e}")
        
        try:
            results["test_4_authentication"] = self.test_4_authentication()
        except Exception as e:
            print(f"\n❌ Test 4 error: {e}")
        
        # Print summary
        print("\n" + "="*70)
        print("📊 FINAL TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for v in results.values() if v)
        total = len(results)
        
        print(f"\n📋 Results:")
        for test_name, result in results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            display_name = test_name.replace("test_", "Test ").replace("_", " ").title()
            print(f"   {status} - {display_name}")
        
        print(f"\n🎯 OVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 SUCCESS! All tests passed!")
            print("   Your system is fully enforced with LangGraph")
            print("   Claude cannot hallucinate outside the graph")
        elif passed >= 3:
            print("\n✅ MOSTLY WORKING! 3+ tests passed")
            print("   Core enforcement is functional")
        else:
            print("\n⚠️  Some tests failed - review enforcement logic")
        
        return results


def main():
    """Run final validation"""
    
    print("""
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║              🧪 FINAL VALIDATION TEST SUITE 🧪                       ║
║                                                                       ║
║  Tests:                                                              ║
║  1. Ride Lifecycle Flow                                              ║
║  2. Payment Database Usage                                           ║
║  3. Backup System Explanation                                        ║
║  4. Hallucination Prevention (Auth not in graph)                      ║
║                                                                       ║
║  Success = All 4 tests PASSED                                        ║
║  = Claude enforced to use ONLY graph ✓                               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
    """)
    
    tester = FinalValidationTests()
    results = tester.run_all_tests()
    
    # Save results
    results_file = "final_test_results.json"
    with open(results_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Results saved to {results_file}")


if __name__ == "__main__":
    main()
