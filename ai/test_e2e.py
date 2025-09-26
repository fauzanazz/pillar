#!/usr/bin/env python3
"""
End-to-end test script for AI Contract Management Service.

Tests the complete flow:
1. Health check
2. Generate contract draft
3. Transform draft to PDF format
4. Generate PDF and save to file

Usage: python test_e2e.py
"""

import json
import requests
import time
from datetime import datetime, timedelta
from pathlib import Path


class ContractServiceTester:
    """End-to-end tester for the AI Contract Management Service."""
    
    def __init__(self, base_url: str = "http://localhost:8081"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "ContractServiceTester/1.0"
        })
    
    def log(self, message: str):
        """Log message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
    
    def test_health_check(self) -> bool:
        """Test the health check endpoint."""
        self.log("🔍 Testing health check...")
        try:
            response = self.session.get(f"{self.base_url}/healthz", timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get("ok") is True:
                self.log("✅ Health check passed")
                return True
            else:
                self.log("❌ Health check failed: Service not healthy")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Health check failed: {e}")
            return False
    
    def test_draft_generation(self) -> dict:
        """Test contract draft generation."""
        self.log("🤖 Testing contract draft generation...")
        
        # Calculate end date (6 months from now)
        end_date = (datetime.now() + timedelta(days=180)).strftime("%Y-%m-%d")
        
        draft_request = {
            "use_case": "Kontrak pengembangan aplikasi mobile untuk sistem manajemen inventori dengan fitur barcode scanning, real-time tracking, dan integrasi dengan sistem ERP existing. Aplikasi harus support Android dan iOS dengan kemampuan offline sync.",
            "parties": [
                "PT Teknologi Digital Indonesia",
                "PT Solusi Bisnis Nusantara"
            ],
            "end_date": end_date,
            "jurisdiction": "Indonesia",
            "language": "Indonesian"
        }
        
        try:
            self.log(f"📤 Sending draft request to {self.base_url}/ai/draft")
            response = self.session.post(
                f"{self.base_url}/ai/draft",
                json=draft_request,
                timeout=60  # AI generation can take time
            )
            response.raise_for_status()
            
            draft_data = response.json()
            
            if "clauses" in draft_data and len(draft_data["clauses"]) > 0:
                clauses_count = len(draft_data["clauses"])
                self.log(f"✅ Draft generated successfully with {clauses_count} clauses")
                
                # Print sample clause
                first_clause = draft_data["clauses"][0]
                self.log(f"📄 Sample clause: {first_clause.get('title', 'No title')}")
                
                return draft_data
            else:
                self.log("❌ Draft generation failed: No clauses generated")
                return None
                
        except requests.exceptions.RequestException as e:
            self.log(f"❌ Draft generation failed: {e}")
            return None
        except json.JSONDecodeError as e:
            self.log(f"❌ Draft generation failed: Invalid JSON response - {e}")
            return None
    
    def transform_draft_to_pdf_request(self, draft_data: dict) -> dict:
        """Transform draft response to PDF request format."""
        self.log("🔄 Transforming draft to PDF request format...")
        
        try:
            # Extract clauses and convert format
            pdf_clauses = []
            for i, clause in enumerate(draft_data["clauses"], 1):
                pdf_clauses.append({
                    "no": i,
                    "title": clause["title"],
                    "text": clause["text"]
                })
            
            # Create PDF request
            pdf_request = {
                "header": {
                    "title": "KONTRAK PENGEMBANGAN APLIKASI MOBILE",
                    "number": f"KTPK/{datetime.now().strftime('%Y/%m')}/001"
                },
                "parties": [
                    {
                        "role": "PIHAK PERTAMA",
                        "name": "PT Teknologi Digital Indonesia",
                        "rep": "John Doe",
                        "address": "Jl. Sudirman No. 123, Jakarta Pusat, DKI Jakarta 10110"
                    },
                    {
                        "role": "PIHAK KEDUA", 
                        "name": "PT Solusi Bisnis Nusantara",
                        "rep": "Jane Smith",
                        "address": "Jl. HR. Rasuna Said No. 456, Jakarta Selatan, DKI Jakarta 12940"
                    }
                ],
                "clauses": pdf_clauses,
                "footer": {
                    "hash": "SHA256:abc123def456789",
                    "version": "1.0"
                },
                "watermark": "DRAFT"
            }
            
            self.log(f"✅ Transformed {len(pdf_clauses)} clauses for PDF generation")
            return pdf_request
            
        except KeyError as e:
            self.log(f"❌ Transform failed: Missing key {e}")
            return None
        except Exception as e:
            self.log(f"❌ Transform failed: {e}")
            return None
    
    def test_pdf_generation(self, pdf_request: dict) -> bytes:
        """Test PDF generation and return PDF bytes."""
        self.log("📄 Testing PDF generation...")
        
        try:
            self.log(f"📤 Sending PDF request to {self.base_url}/ai/pdf")
            response = self.session.post(
                f"{self.base_url}/ai/pdf",
                json=pdf_request,
                timeout=60
            )
            response.raise_for_status()
            
            # Check if response is PDF
            content_type = response.headers.get("Content-Type", "")
            if "application/pdf" not in content_type:
                self.log(f"❌ PDF generation failed: Wrong content type {content_type}")
                return None
            
            pdf_size = len(response.content)
            self.log(f"✅ PDF generated successfully ({pdf_size:,} bytes)")
            
            return response.content
            
        except requests.exceptions.RequestException as e:
            self.log(f"❌ PDF generation failed: {e}")
            return None
    
    def save_pdf(self, pdf_bytes: bytes, filename: str = None) -> str:
        """Save PDF bytes to file."""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"contract_test_{timestamp}.pdf"
        
        try:
            output_path = Path(filename)
            output_path.write_bytes(pdf_bytes)
            
            file_size = output_path.stat().st_size
            self.log(f"💾 PDF saved to {output_path.absolute()} ({file_size:,} bytes)")
            
            return str(output_path.absolute())
            
        except Exception as e:
            self.log(f"❌ Failed to save PDF: {e}")
            return None
    
    def run_full_test(self):
        """Run the complete end-to-end test flow."""
        self.log("🚀 Starting end-to-end test flow...")
        start_time = time.time()
        
        try:
            # Step 1: Health check
            if not self.test_health_check():
                return False
            
            # Step 2: Generate draft
            draft_data = self.test_draft_generation()
            if not draft_data:
                return False
            
            # Step 3: Transform to PDF format
            pdf_request = self.transform_draft_to_pdf_request(draft_data)
            if not pdf_request:
                return False
            
            # Step 4: Generate PDF
            pdf_bytes = self.test_pdf_generation(pdf_request)
            if not pdf_bytes:
                return False
            
            # Step 5: Save PDF
            pdf_path = self.save_pdf(pdf_bytes)
            if not pdf_path:
                return False
            
            # Success summary
            total_time = time.time() - start_time
            self.log(f"🎉 End-to-end test completed successfully in {total_time:.1f}s")
            self.log(f"📁 Output PDF: {pdf_path}")
            
            return True
            
        except Exception as e:
            self.log(f"💥 Unexpected error during testing: {e}")
            return False


def main():
    """Main test function."""
    print("=" * 60)
    print("AI Contract Management Service - End-to-End Test")
    print("=" * 60)
    
    tester = ContractServiceTester()
    
    success = tester.run_full_test()
    
    print("=" * 60)
    if success:
        print("✅ ALL TESTS PASSED")
        print("The complete flow from draft generation to PDF download works correctly!")
    else:
        print("❌ TESTS FAILED")
        print("Check the logs above for error details.")
    print("=" * 60)
    
    return 0 if success else 1


if __name__ == "__main__":
    exit(main())