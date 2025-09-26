#!/usr/bin/env python3
"""
End-to-end workflow test for Contract Management System.

Tests the complete workflow:
1. Internal creates contract
2. AI generates clauses
3. Legal reviews clauses
4. Legal submits to management
5. Management makes decision
"""

import asyncio
import requests
import json
import time
from datetime import datetime, timedelta
from pathlib import Path


class WorkflowTester:
    """End-to-end workflow tester."""
    
    def __init__(self, base_url: str = "http://localhost:8081"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "WorkflowTester/1.0"
        })
    
    def log(self, message: str, role: str = "SYSTEM"):
        """Log message with timestamp and role."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] [{role}] {message}")
    
    def test_workflow_complete(self):
        """Test complete workflow from creation to approval."""
        self.log("🚀 Starting complete workflow test...")
        
        try:
            # Step 1: Internal creates contract
            contract = self.create_contract_as_internal()
            contract_id = contract["contract"]["id"]
            
            # Step 2: Generate AI clauses
            contract = self.generate_clauses(contract_id)
            
            # Step 3: Legal reviews clauses
            contract = self.review_clauses_as_legal(contract_id)
            
            # Step 4: Legal submits to management
            contract = self.submit_to_management(contract_id)
            
            # Step 5: Management approves
            contract = self.approve_as_management(contract_id)
            
            # Step 6: Export final PDF
            self.export_final_pdf(contract_id)
            
            self.log("🎉 Complete workflow test successful!", "SUCCESS")
            return True
            
        except Exception as e:
            self.log(f"💥 Workflow test failed: {e}", "ERROR")
            return False
    
    def create_contract_as_internal(self):
        """Create contract as Internal role."""
        self.log("Creating contract...", "INTERNAL")
        
        contract_data = {
            "template": {
                "title": "KONTRAK PENGEMBANGAN SISTEM MANAJEMEN INVENTORI",
                "description": "Pengembangan sistem manajemen inventori berbasis web dengan fitur real-time tracking, barcode scanning, integrasi ERP, dan dashboard analytics untuk optimalisasi supply chain management.",
                "parties": [
                    {
                        "role": "PIHAK PERTAMA",
                        "name": "PT Teknologi Digital Nusantara",
                        "rep": "Budi Santoso",
                        "address": "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110"
                    },
                    {
                        "role": "PIHAK KEDUA", 
                        "name": "PT Solusi Bisnis Indonesia",
                        "rep": "Sari Wijaya",
                        "address": "Jl. HR. Rasuna Said No. 456, Jakarta Selatan, DKI Jakarta 12940"
                    }
                ],
                "end_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
                "jurisdiction": "Indonesia",
                "language": "Indonesian",
                "value": 500000000.0,
                "special_requirements": "Sistem harus dapat menangani minimal 10,000 transaksi per hari dan terintegrasi dengan sistem ERP existing (SAP). Deployment menggunakan cloud infrastructure dengan uptime 99.9%."
            }
        }
        
        response = self.session.post(f"{self.base_url}/api/v1/contracts", json=contract_data)
        response.raise_for_status()
        
        contract = response.json()
        self.log(f"✅ Contract created: {contract['contract']['id']}", "INTERNAL")
        self.log(f"Status: {contract['contract']['status']}", "INTERNAL")
        
        return contract
    
    def generate_clauses(self, contract_id: str):
        """Generate AI clauses."""
        self.log("Generating AI clauses...", "INTERNAL")
        
        response = self.session.post(f"{self.base_url}/api/v1/contracts/{contract_id}/clauses/generate")
        response.raise_for_status()
        
        contract = response.json()
        clauses_count = len(contract['contract']['clauses'])
        self.log(f"✅ Generated {clauses_count} clauses", "INTERNAL")
        self.log(f"Status: {contract['contract']['status']}", "INTERNAL")
        
        # Show sample clauses
        for clause in contract['contract']['clauses'][:2]:
            self.log(f"📄 Sample: Pasal {clause['no']}: {clause['title']}", "INTERNAL")
        
        return contract
    
    def review_clauses_as_legal(self, contract_id: str):
        """Review clauses as Legal role."""
        self.log("Reviewing clauses...", "LEGAL")
        
        # Get contract details
        response = self.session.get(f"{self.base_url}/api/v1/contracts/{contract_id}?role=legal")
        response.raise_for_status()
        contract = response.json()
        
        # Review each clause
        for clause in contract['contract']['clauses']:
            # Simulate legal review - accept most, reject some, edit some
            clause_no = clause['no']
            
            if clause_no % 5 == 0:  # Reject every 5th clause
                status = "rejected"
                notes = f"Clause {clause_no} needs revision - too vague"
            elif clause_no % 3 == 0:  # Edit every 3rd clause
                status = "edited"
                notes = f"Clause {clause_no} edited for clarity"
                # Modify text slightly
                edited_text = clause['text'] + " Tambahan: Ketentuan ini berlaku sesuai dengan peraturan yang berlaku."
            else:  # Accept others
                status = "accepted"
                notes = f"Clause {clause_no} approved"
                edited_text = None
            
            # Submit review
            review_data = {
                "contract_id": contract_id,
                "clause_id": clause['id'],
                "status": status,
                "notes": notes
            }
            if edited_text:
                review_data["edited_text"] = edited_text
            
            response = self.session.put(
                f"{self.base_url}/api/v1/contracts/{contract_id}/clauses/{clause['id']}/review",
                json=review_data
            )
            response.raise_for_status()
            
            self.log(f"📝 Clause {clause_no}: {status}", "LEGAL")
        
        # Add one manual clause
        manual_clause_data = {
            "contract_id": contract_id,
            "no": len(contract['contract']['clauses']) + 1,
            "title": "Klausul Kepatuhan Regulasi",
            "text": "Para pihak wajib mematuhi seluruh regulasi yang berlaku termasuk UU Perlindungan Data Pribadi dan ketentuan keamanan siber yang ditetapkan oleh BSSN.",
            "notes": "Manual clause added by legal team"
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/contracts/{contract_id}/clauses",
            json=manual_clause_data
        )
        response.raise_for_status()
        self.log("📝 Added manual compliance clause", "LEGAL")
        
        # Get updated contract
        response = self.session.get(f"{self.base_url}/api/v1/contracts/{contract_id}?role=legal")
        response.raise_for_status()
        contract = response.json()
        
        self.log(f"✅ All clauses reviewed", "LEGAL")
        return contract
    
    def submit_to_management(self, contract_id: str):
        """Submit contract to management."""
        self.log("Submitting to management...", "LEGAL")
        
        submit_data = {
            "contract_id": contract_id,
            "notes": "Contract review completed. All clauses have been reviewed and approved by legal team. Ready for management approval."
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/contracts/{contract_id}/submit",
            json=submit_data
        )
        response.raise_for_status()
        
        contract = response.json()
        self.log(f"✅ Submitted to management", "LEGAL")
        self.log(f"Status: {contract['contract']['status']}", "LEGAL")
        
        return contract
    
    def approve_as_management(self, contract_id: str):
        """Approve contract as Management."""
        self.log("Reviewing for approval...", "MANAGEMENT")
        
        decision_data = {
            "contract_id": contract_id,
            "decision": "approve",
            "notes": "Contract approved. All terms are acceptable and align with company policies. Proceed with execution."
        }
        
        response = self.session.post(
            f"{self.base_url}/api/v1/contracts/{contract_id}/decision",
            json=decision_data
        )
        response.raise_for_status()
        
        contract = response.json()
        self.log(f"✅ Contract APPROVED", "MANAGEMENT")
        self.log(f"Final Status: {contract['contract']['status']}", "MANAGEMENT")
        
        return contract
    
    def test_rejection_workflow(self):
        """Test rejection workflow."""
        self.log("🔄 Testing rejection workflow...", "TEST")
        
        try:
            # Create and process contract up to management
            contract = self.create_contract_as_internal()
            contract_id = contract["contract"]["id"]
            
            contract = self.generate_clauses(contract_id)
            contract = self.review_clauses_as_legal(contract_id)
            contract = self.submit_to_management(contract_id)
            
            # Management rejects back to legal
            self.log("Rejecting back to legal...", "MANAGEMENT")
            
            decision_data = {
                "contract_id": contract_id,
                "decision": "reject_to_legal",
                "notes": "Please revise clause 3 and add more specific penalty terms for late delivery."
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/contracts/{contract_id}/decision",
                json=decision_data
            )
            response.raise_for_status()
            
            contract = response.json()
            self.log(f"✅ Rejected to legal: {contract['contract']['status']}", "MANAGEMENT")
            
            return True
            
        except Exception as e:
            self.log(f"💥 Rejection workflow failed: {e}", "ERROR")
            return False
    
    def export_final_pdf(self, contract_id: str):
        """Export final PDF."""
        self.log("Exporting final PDF...", "SYSTEM")
        
        response = self.session.get(f"{self.base_url}/api/v1/contracts/{contract_id}/pdf")
        response.raise_for_status()
        
        # Save PDF
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"final_contract_{contract_id[:8]}_{timestamp}.pdf"
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        
        self.log(f"✅ PDF exported: {filename}", "SYSTEM")
        return filename
    
    def test_api_endpoints(self):
        """Test basic API endpoints."""
        self.log("🧪 Testing API endpoints...", "TEST")
        
        try:
            # Test health check
            response = self.session.get(f"{self.base_url}/healthz")
            response.raise_for_status()
            self.log("✅ Health check passed", "TEST")
            
            # Test stats endpoint
            response = self.session.get(f"{self.base_url}/api/v1/stats")
            response.raise_for_status()
            stats = response.json()
            self.log(f"✅ Stats: {stats.get('total_contracts', 0)} contracts", "TEST")
            
            # Test contract list
            response = self.session.get(f"{self.base_url}/api/v1/contracts")
            response.raise_for_status()
            contracts = response.json()
            self.log(f"✅ Contract list: {contracts['total']} contracts", "TEST")
            
            return True
            
        except Exception as e:
            self.log(f"💥 API test failed: {e}", "ERROR")
            return False


def main():
    """Run comprehensive workflow tests."""
    print("=" * 80)
    print("CONTRACT MANAGEMENT SYSTEM - WORKFLOW TEST")
    print("=" * 80)
    
    tester = WorkflowTester()
    
    results = []
    
    # Test 1: Basic API endpoints
    results.append(("API Endpoints", tester.test_api_endpoints()))
    
    # Test 2: Complete approval workflow
    results.append(("Complete Approval Workflow", tester.test_workflow_complete()))
    
    # Test 3: Rejection workflow
    results.append(("Rejection Workflow", tester.test_rejection_workflow()))
    
    # Results summary
    print("\n" + "=" * 80)
    print("TEST RESULTS SUMMARY")
    print("=" * 80)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:<30} {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Workflow system is working correctly!")
    else:
        print("⚠️  Some tests failed - Check the logs above for details")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)