# Contract Management Workflow System

A comprehensive contract management system with role-based workflow, AI clause generation, and PDF export capabilities.

## System Overview

### Workflow Stages

1. **INTERNAL** creates contract template with basic details
2. **AI** generates clauses based on template and governance rules  
3. **LEGAL** reviews, edits, and approves/rejects clauses
4. **LEGAL** submits completed contract to management
5. **MANAGEMENT** approves or rejects with feedback
6. **PDF/JSON** files are saved at each stage for audit trail

### User Roles

- **INTERNAL**: Create contracts, handle rejections from management
- **LEGAL**: Review AI clauses, add manual clauses, submit to management
- **MANAGEMENT**: Final approval or rejection with feedback

## Getting Started

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8081 --reload
```

### 3. Use CLI Interface

```bash
python cli.py select-role
python cli.py dashboard
python cli.py create-contract
```

### 4. Or Use Web API

Visit http://localhost:8081/docs for interactive API documentation.

## CLI Usage

### Select Your Role
```bash
python cli.py select-role
```

### View Dashboard
```bash
python cli.py dashboard
```

### Create Contract (Internal only)
```bash
python cli.py create-contract
```

### Work on Specific Contract
```bash
python cli.py work-on <contract-id>
```

### View All Contracts
```bash
python cli.py list-all
```

### System Statistics
```bash
python cli.py stats
```

## API Endpoints

### Contract Management
- `POST /api/v1/contracts` - Create new contract
- `GET /api/v1/contracts` - List contracts (filterable by role/status)
- `GET /api/v1/contracts/{id}` - Get contract details
- `POST /api/v1/contracts/{id}/clauses/generate` - Generate AI clauses
- `GET /api/v1/contracts/{id}/pdf` - Export to PDF

### Legal Review
- `PUT /api/v1/contracts/{id}/clauses/{clause_id}/review` - Review clause
- `POST /api/v1/contracts/{id}/clauses` - Add manual clause
- `POST /api/v1/contracts/{id}/submit` - Submit to management

### Management Decision
- `POST /api/v1/contracts/{id}/decision` - Approve/reject contract

### System
- `GET /api/v1/stats` - System statistics
- `GET /healthz` - Health check

## File Storage

All contracts and PDFs are stored in the `out/` directory:

```
out/
├── contracts/           # Contract JSON files
│   ├── contract_abc123.json
│   └── contract_def456.json
└── internal/           # PDF files organized by contract
    ├── contract_abc123/
    │   ├── contract_abc123_draft_internal_20250926_140530.pdf
    │   └── contract_abc123_approved_20250926_150630.pdf
    └── contract_def456/
        └── contract_def456_draft_management_20250926_160730.pdf
```

## Testing

### Run Complete Workflow Test
```bash
python test_workflow.py
```

This tests:
1. Contract creation by Internal
2. AI clause generation  
3. Legal review process
4. Management approval
5. PDF export
6. Rejection workflows

### Run Original PDF Test
```bash
python test_e2e.py
```

## Contract Workflow States

| State | Description | Next Actions |
|-------|-------------|-------------|
| `draft_internal` | Created by internal, needs clauses | Generate clauses |
| `draft_legal_review` | Legal reviewing clauses | Review/edit clauses, submit to management |
| `draft_management` | Awaiting management decision | Approve/reject |
| `approved` | Final approval | Export final documents |
| `rejected_to_legal` | Management rejected to legal | Fix issues, resubmit |
| `rejected_to_internal` | Management rejected to internal | Revise template |
| `rejected_to_both` | Management rejected to both | Coordinate fixes |

## Example API Usage

### 1. Create Contract (Internal)
```python
import requests

data = {
    "template": {
        "title": "SOFTWARE DEVELOPMENT CONTRACT",
        "description": "Development of inventory management system",
        "parties": [
            {
                "role": "PIHAK PERTAMA",
                "name": "PT Tech Indonesia", 
                "address": "Jakarta"
            },
            {
                "role": "PIHAK KEDUA",
                "name": "PT Solutions Inc",
                "address": "Surabaya"
            }
        ],
        "end_date": "2025-12-31",
        "value": 100000000
    }
}

response = requests.post("http://localhost:8081/api/v1/contracts", json=data)
contract = response.json()
contract_id = contract["contract"]["id"]
```

### 2. Generate Clauses
```python
response = requests.post(f"http://localhost:8081/api/v1/contracts/{contract_id}/clauses/generate")
contract = response.json()
print(f"Generated {len(contract['contract']['clauses'])} clauses")
```

### 3. Review Clause (Legal)
```python
clause_id = contract["contract"]["clauses"][0]["id"]

review_data = {
    "contract_id": contract_id,
    "clause_id": clause_id, 
    "status": "accepted",
    "notes": "Clause approved by legal team"
}

response = requests.put(
    f"http://localhost:8081/api/v1/contracts/{contract_id}/clauses/{clause_id}/review",
    json=review_data
)
```

### 4. Submit to Management
```python
submit_data = {
    "contract_id": contract_id,
    "notes": "All clauses reviewed and approved"
}

response = requests.post(
    f"http://localhost:8081/api/v1/contracts/{contract_id}/submit",
    json=submit_data
)
```

### 5. Management Decision
```python
decision_data = {
    "contract_id": contract_id,
    "decision": "approve",  # or "reject_to_legal", "reject_to_internal", "reject_to_both"
    "notes": "Contract approved for execution"
}

response = requests.post(
    f"http://localhost:8081/api/v1/contracts/{contract_id}/decision", 
    json=decision_data
)
```

### 6. Export PDF
```python
response = requests.get(f"http://localhost:8081/api/v1/contracts/{contract_id}/pdf")

with open(f"contract_{contract_id}.pdf", "wb") as f:
    f.write(response.content)
```

## Best Practices

1. **Always check contract status** before performing actions
2. **Review all clauses** before submitting to management  
3. **Provide clear notes** when rejecting or approving
4. **Export PDFs regularly** for audit trail
5. **Use correlation IDs** for request tracing in logs

## Error Handling

The system provides detailed error messages:
- `404` - Contract or clause not found
- `400` - Invalid workflow state or data
- `422` - Validation errors
- `500` - Internal server errors

All errors include correlation IDs for tracking.

## Production Considerations

1. **Database**: Replace file storage with PostgreSQL + pgvector
2. **Authentication**: Add JWT-based auth with role permissions
3. **File Storage**: Use S3 or similar for PDF/JSON files  
4. **Notifications**: Add email/Slack notifications for workflow events
5. **Audit Log**: Enhanced logging with detailed audit trails
6. **Rate Limiting**: Implement proper rate limiting for API endpoints