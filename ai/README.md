# AI Contract Management Service

A production-ready FastAPI microservice for AI-powered contract drafting and PDF generation, designed for PT Integrasi Logistik Cipta Solusi (ILCS).

## Features

- **AI Contract Drafting**: Generate contract clauses with risk assessment using OpenAI's Structured Outputs
- **PDF Generation**: Convert structured contract data to professionally formatted PDF documents
- **RAG Integration**: Retrieve relevant governance templates (ready for pgvector integration)
- **Risk Assessment**: Automatic risk scoring (0-100) for each contract clause
- **Indonesian Legal Compliance**: Templates and prompts designed for Indonesian legal requirements
- **Production Ready**: Comprehensive error handling, logging, rate limiting, and monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   OpenAI API    │
│   Frontend      │───▶│   Gateway       │───▶│   GPT-4         │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   WeasyPrint    │
                       │   PDF Engine    │
                       └─────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- OpenAI API key
- Docker (optional)

### Local Development

1. **Clone and setup**
   ```bash
   cd ai/
   python -m venv venv
   
   # Windows
   venv\\Scripts\\activate
   
   # Linux/macOS
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Run the service**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
   ```

4. **Test the service**
   ```bash
   curl http://localhost:8081/healthz
   ```

### Docker Deployment

```bash
# Build image
docker build -t ai-contract-service .

# Run container
docker run -d \
  -p 8081:8081 \
  -e OPENAI_API_KEY=your-key-here \
  -e MODEL_NAME=gpt-4-turbo-preview \
  --name ai-contract-service \
  ai-contract-service
```

## API Endpoints

### Health Check
```http
GET /healthz
```

**Response:**
```json
{
  "ok": true
}
```

### Contract Drafting
```http
POST /ai/draft
Content-Type: application/json
```

**Request Body:**
```json
{
  "use_case": "Kontrak kerjasama logistik untuk pengiriman barang dari Jakarta ke Surabaya",
  "parties": ["PT ILCS", "PT Mitra Logistik"],
  "end_date": "2025-12-31",
  "jurisdiction": "ID",
  "language": "id"
}
```

**Response:**
```json
{
  "summary": "Kontrak kerjasama logistik dengan fokus pada pengiriman barang antar kota",
  "clauses": [
    {
      "title": "Definisi dan Interpretasi",
      "category": "General",
      "text": "Dalam kontrak ini: (a) 'Pengiriman' berarti proses transportasi barang...",
      "risk": 15,
      "rationale": "Klausul definisi standar dengan risiko rendah",
      "refs": "ILCS-GOV-2024-v1.2",
      "suggested": false
    }
  ]
}
```

### PDF Generation
```http
POST /ai/pdf
Content-Type: application/json
```

**Request Body:**
```json
{
  "header": {
    "title": "KONTRAK KERJASAMA LOGISTIK",
    "number": "ILCS/001/2025"
  },
  "parties": [
    {
      "role": "PIHAK PERTAMA",
      "name": "PT Integrasi Logistik Cipta Solusi",
      "rep": "John Doe",
      "address": "Jl. Thamrin No. 1, Jakarta Pusat"
    },
    {
      "role": "PIHAK KEDUA", 
      "name": "PT Mitra Logistik",
      "rep": "Jane Smith",
      "address": "Jl. Sudirman No. 2, Jakarta Selatan"
    }
  ],
  "clauses": [
    {
      "no": 1,
      "title": "Ruang Lingkup Kerjasama",
      "text": "Para pihak sepakat untuk melakukan kerjasama dalam bidang logistik..."
    }
  ],
  "footer": {
    "hash": "abc123def456",
    "version": "1.0"
  },
  "watermark": "DRAFT"
}
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="kontrak_KONTRAK_KERJASAMA_LOGISTIK.pdf"`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for GPT-4 access |
| `MODEL_NAME` | No | `gpt-4-turbo-preview` | OpenAI model to use |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS origins |
| `LOG_LEVEL` | No | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Integration with Next.js

Create an API route proxy in your Next.js application:

```typescript
// pages/api/ai/draft.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('http://ai-service:8081/ai/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': req.headers['x-request-id'] || crypto.randomUUID(),
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: {
        type: 'proxy_error',
        message: 'Failed to connect to AI service'
      }
    });
  }
}
```

## cURL Examples

### Test Contract Drafting
```bash
curl -X POST http://localhost:8081/ai/draft \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -d '{
    "use_case": "Kontrak sewa gudang untuk menyimpan barang logistik selama 1 tahun",
    "parties": ["PT ILCS", "PT Gudang Makmur"],
    "end_date": "2025-12-31",
    "jurisdiction": "ID",
    "language": "id"
  }'
```

### Test PDF Generation
```bash
curl -X POST http://localhost:8081/ai/pdf \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -o contract.pdf \
  -d '{
    "header": {
      "title": "KONTRAK SEWA GUDANG",
      "number": "ILCS/SG/001/2025"
    },
    "parties": [
      {
        "role": "PIHAK PERTAMA",
        "name": "PT Integrasi Logistik Cipta Solusi",
        "address": "Jakarta"
      },
      {
        "role": "PIHAK KEDUA",
        "name": "PT Gudang Makmur", 
        "address": "Bekasi"
      }
    ],
    "clauses": [
      {
        "no": 1,
        "title": "Objek Sewa",
        "text": "PIHAK KEDUA menyewakan gudang seluas 1000 m² kepada PIHAK PERTAMA."
      }
    ],
    "footer": {
      "version": "1.0"
    },
    "watermark": "DRAFT"
  }'
```

## Future Enhancements

### pgvector Integration

The RAG service is ready for pgvector integration. To upgrade:

1. **Install pgvector extension:**
   ```sql
   CREATE EXTENSION vector;
   ```

2. **Create clause chunks table:**
   ```sql
   CREATE TABLE clause_chunks (
     id SERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     category TEXT NOT NULL,
     body TEXT NOT NULL,
     gov_version TEXT NOT NULL,
     embedding vector(1536),
     created_at TIMESTAMP DEFAULT NOW()
   );
   
   -- Create IVFFlat index for fast similarity search
   CREATE INDEX clause_chunks_embedding_idx 
   ON clause_chunks 
   USING ivfflat (embedding vector_cosine_ops) 
   WITH (lists = 100);
   ```

3. **Update RAG service:**
   ```python
   # Replace mock implementation in services/rag.py
   async def retrieve_governance_chunks(self, query: str, k: int = 5):
       embedding = await get_embedding(query)
       
       async with get_db_connection() as conn:
           result = await conn.fetch("""
               SELECT title, category, body, gov_version,
                      1 - (embedding <=> $1) AS similarity
               FROM clause_chunks
               ORDER BY embedding <=> $1
               LIMIT $2
           """, embedding, k)
           
           return [GovernanceChunk(**row) for row in result]
   ```

### Advanced PDF Engine

For complex layouts, consider switching to Puppeteer:

```python
# Alternative PDF service implementation
import asyncio
from pyppeteer import launch

async def generate_pdf_with_puppeteer(html_content: str) -> bytes:
    browser = await launch()
    page = await browser.newPage()
    await page.setContent(html_content)
    
    pdf_bytes = await page.pdf({
        'format': 'A4',
        'margin': {'top': '2cm', 'right': '2cm', 'bottom': '3cm', 'left': '2cm'},
        'displayHeaderFooter': True,
        'headerTemplate': '<span style="font-size: 10px;">PT ILCS</span>',
        'footerTemplate': '<span style="font-size: 10px;">Page <span class="pageNumber"></span></span>'
    })
    
    await browser.close()
    return pdf_bytes
```

## Type Checking

Optional: Verify type hints with pyright:

```bash
pip install pyright
pyright --verifytypes app
```

## Monitoring and Observability

The service includes:

- **Structured JSON logging** with correlation IDs
- **Request/response logging** with timing metrics
- **Error tracking** with detailed stack traces
- **Health check endpoint** for load balancer monitoring
- **Rate limiting** with configurable thresholds

## Security Considerations

- OpenAI API key is server-side only, never exposed in logs
- CORS origins are configurable and restricted
- Rate limiting prevents abuse
- All inputs are validated with Pydantic
- Error responses don't leak internal details

## Contributing

1. Follow the existing code structure and patterns
2. Add type hints for all functions
3. Include docstrings for public APIs
4. Update tests when adding new features
5. Keep dependencies minimal and pinned

## License

Internal use only - PT Integrasi Logistik Cipta Solusi (ILCS)