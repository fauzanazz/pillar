import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

sys.path.append(str(Path(__file__).parent / "app"))

from app.services.risk_identification import risk_identification_service


def load_contract_from_file(contract_path: str) -> Dict[str, Any]:
    with open(contract_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def extract_contract_text_and_metadata(contract_data: Dict[str, Any]) -> tuple[str, Dict[str, Any]]:
    template = contract_data.get("template", {})
    clauses = contract_data.get("clauses", [])
    
    contract_text = f"Title: {template.get('title', 'N/A')}\n\n"
    
    if template.get('description'):
        contract_text += f"Description: {template.get('description')}\n\n"
    
    parties = template.get('parties', [])
    if parties:
        contract_text += "Parties:\n"
        for party in parties:
            contract_text += f"- {party.get('role', 'N/A')}: {party.get('name', 'N/A')}"
            if party.get('rep'):
                contract_text += f" (Rep: {party.get('rep')})"
            if party.get('address'):
                contract_text += f" - Address: {party.get('address')}"
            contract_text += "\n"
        contract_text += "\n"
    
    if clauses:
        contract_text += "Clauses:\n"
        for clause in clauses:
            contract_text += f"{clause.get('no', 'N/A')}. {clause.get('title', 'N/A')}\n"
            contract_text += f"{clause.get('text', 'N/A')}\n\n"
    
    contract_metadata = {
        "contract_id": contract_data.get("id"),
        "title": template.get("title"),
        "description": template.get("description"),
        "end_date": template.get("end_date"),
        "jurisdiction": template.get("jurisdiction"),
        "language": template.get("language"),
        "status": contract_data.get("status"),
        "value": template.get("value"),
        "parties": [{"name": p.get("name"), "role": p.get("role")} for p in parties],
        "clause_count": len(clauses),
        "created_at": contract_data.get("created_at"),
        "updated_at": contract_data.get("updated_at")
    }
    
    return contract_text, contract_metadata


def analyze_contract_risks(contract_path: str) -> Dict[str, Any]:
    """Analyze risks for a single contract."""
    print(f"Analyzing contract: {os.path.basename(contract_path)}")
    
    try:
        contract_data = load_contract_from_file(contract_path)
        contract_text, contract_metadata = extract_contract_text_and_metadata(contract_data)
        
        risks = risk_identification_service.identify_contract_risks(
            contract_text=contract_text,
            contract_metadata=contract_metadata,
            correlation_id=f"batch-analysis-{contract_metadata['contract_id']}"
        )
        
        total_risks = len(risks)
        risk_levels = {"critical": [], "high": [], "medium": [], "low": []}
        
        for risk in risks:
            level = risk["risk_level"]
            if level in risk_levels:
                risk_levels[level].append(risk)
        
        if total_risks > 0:
            total_score = sum(r["risk_score"] for r in risks)
            overall_risk_score = min(100, total_score // total_risks)
            
            critical_count = len(risk_levels['critical'])
            if critical_count > 0:
                overall_risk_score = min(100, overall_risk_score + (critical_count * 10))
        else:
            overall_risk_score = 0
        
        if overall_risk_score >= 80:
            risk_category = "HIGH"
        elif overall_risk_score >= 60:
            risk_category = "MEDIUM"
        elif overall_risk_score >= 30:
            risk_category = "LOW"
        else:
            risk_category = "MINIMAL"
        
        result = {
            "contract_id": contract_metadata["contract_id"],
            "contract_title": contract_metadata["title"],
            "contract_file": os.path.basename(contract_path),
            "analysis_timestamp": datetime.now().isoformat(),
            "risk_summary": {
                "total_risks": total_risks,
                "critical_risks": len(risk_levels['critical']),
                "high_risks": len(risk_levels['high']),
                "medium_risks": len(risk_levels['medium']),
                "low_risks": len(risk_levels['low']),
                "overall_risk_score": overall_risk_score,
                "risk_category": risk_category
            },
            "contract_metadata": contract_metadata,
            "risks": risks
        }
        
        print(f"  -> Found {total_risks} risks (Score: {overall_risk_score}/100, Category: {risk_category})")
        
        return result
        
    except Exception as e:
        print(f"  -> ERROR: {str(e)}")
        return {
            "contract_id": "unknown",
            "contract_title": "ERROR",
            "contract_file": os.path.basename(contract_path),
            "analysis_timestamp": datetime.now().isoformat(),
            "error": str(e),
            "risk_summary": {
                "total_risks": 0,
                "overall_risk_score": 0,
                "risk_category": "ERROR"
            },
            "risks": []
        }


def main():
    print("Contract Risk Analysis Tool")
    print("=" * 50)
    
    contracts_dir = Path("out/contracts")
    risks_dir = Path("out/risks")
    
    if not contracts_dir.exists():
        print(f"ERROR: Contracts directory not found: {contracts_dir}")
        return False
    
    risks_dir.mkdir(exist_ok=True)
    
    # Find all contract JSON files
    contract_files = list(contracts_dir.glob("contract_*.json"))
    
    if not contract_files:
        print(f"No contract files found in {contracts_dir}")
        return False
    
    print(f"Found {len(contract_files)} contracts to analyze")
    print()
    
    # Analyze each contract
    all_results = []
    total_risks_found = 0
    
    for contract_file in contract_files:
        result = analyze_contract_risks(str(contract_file))
        all_results.append(result)
        total_risks_found += result.get("risk_summary", {}).get("total_risks", 0)
    
    print()
    print("Analysis Summary:")
    print("-" * 30)
    
    # Generate summary statistics
    summary = {
        "analysis_timestamp": datetime.now().isoformat(),
        "total_contracts_analyzed": len(contract_files),
        "total_risks_found": total_risks_found,
        "contracts_by_risk_category": {
            "HIGH": 0,
            "MEDIUM": 0,
            "LOW": 0,
            "MINIMAL": 0,
            "ERROR": 0
        },
        "risk_type_summary": {},
        "contracts": all_results
    }
    
    # Count contracts by risk category and collect risk types
    for result in all_results:
        category = result.get("risk_summary", {}).get("risk_category", "ERROR")
        summary["contracts_by_risk_category"][category] += 1
        
        # Count risk types
        for risk in result.get("risks", []):
            risk_type = risk.get("risk_type", "unknown")
            if risk_type not in summary["risk_type_summary"]:
                summary["risk_type_summary"][risk_type] = 0
            summary["risk_type_summary"][risk_type] += 1
    
    # Print summary
    print(f"Contracts analyzed: {summary['total_contracts_analyzed']}")
    print(f"Total risks found: {summary['total_risks_found']}")
    print()
    print("Risk Categories:")
    for category, count in summary["contracts_by_risk_category"].items():
        if count > 0:
            print(f"  {category}: {count} contracts")
    print()
    print("Top Risk Types:")
    sorted_risk_types = sorted(summary["risk_type_summary"].items(), key=lambda x: x[1], reverse=True)
    for risk_type, count in sorted_risk_types[:10]:  # Top 10
        print(f"  {risk_type}: {count} occurrences")
    
    # Save results
    results_file = risks_dir / "contract_risk_analysis.json"
    summary_file = risks_dir / "risk_analysis_summary.json"
    
    print()
    print("Saving results...")
    
    # Save full results
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"Full results saved to: {results_file}")
    
    # Save individual contract risk files
    for result in all_results:
        contract_id = result.get("contract_id", "unknown")
        individual_file = risks_dir / f"risks_{contract_id}.json"
        with open(individual_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"Individual risk files saved to: {risks_dir}")
    
    # Create a simplified summary
    simple_summary = {
        "timestamp": summary["analysis_timestamp"],
        "summary": {
            "contracts_analyzed": summary["total_contracts_analyzed"],
            "total_risks": summary["total_risks_found"],
            "high_risk_contracts": summary["contracts_by_risk_category"]["HIGH"],
            "medium_risk_contracts": summary["contracts_by_risk_category"]["MEDIUM"],
            "low_risk_contracts": summary["contracts_by_risk_category"]["LOW"]
        },
        "top_risk_types": dict(sorted_risk_types[:5])
    }
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(simple_summary, f, indent=2, ensure_ascii=False)
    print(f"Summary saved to: {summary_file}")
    
    print()
    print("=" * 50)
    print("Analysis completed successfully!")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)