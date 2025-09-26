import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class GovernanceChunk:
    title: str
    category: str
    body: str
    gov_version: str


class RAGService:
    def __init__(self):
        # TODO: Replace with actual pgvector implementation
        self._mock_chunks = self._load_mock_governance_chunks()
    
    def retrieve_governance_chunks(
        self,
        query: str,
        k: int = 5,
        category_filter: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> List[GovernanceChunk]:
        """
        Retrieve top-K governance chunks based on query.
        
        Args:
            query: Search query (use case description)
            k: Number of chunks to retrieve
            category_filter: Filter by category (optional)
            correlation_id: Request correlation ID for logging
            
        Returns:
            List of relevant governance chunks
        """
        logger.info(
            "Retrieving governance chunks",
            extra={
                "correlation_id": correlation_id,
                "query_length": len(query),
                "k": k,
                "category_filter": category_filter
            }
        )
        
        # TODO: Implement actual vector similarity search
        # Example pgvector integration:
        # 
        # WITH query_embedding AS (
        #     SELECT embedding FROM get_embedding($1) -- query embedding
        # )
        # SELECT 
        #     title, category, body, gov_version,
        #     1 - (embedding <=> (SELECT embedding FROM query_embedding)) AS similarity
        # FROM clause_chunks 
        # WHERE ($2::text IS NULL OR category = $2)
        # ORDER BY embedding <=> (SELECT embedding FROM query_embedding)
        # LIMIT $3;
        #
        # CREATE INDEX ON clause_chunks USING ivfflat (embedding vector_cosine_ops) 
        # WITH (lists = 100);
        
        chunks = self._mock_chunks.copy()
        
        if category_filter:
            chunks = [c for c in chunks if c.category.lower() == category_filter.lower()]
        
        query_lower = query.lower()
        scored_chunks = []
        
        for chunk in chunks:
            score = 0
            for word in query_lower.split():
                if word in chunk.title.lower():
                    score += 2
                if word in chunk.body.lower():
                    score += 1
            
            if score > 0:
                scored_chunks.append((score, chunk))
        
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        result = [chunk for _, chunk in scored_chunks[:k]]
        
        if not result:
            result = chunks[:k]
        
        logger.info(
            "Retrieved governance chunks",
            extra={
                "correlation_id": correlation_id,
                "chunks_retrieved": len(result)
            }
        )
        
        return result
    
    def _load_mock_governance_chunks(self) -> List[GovernanceChunk]:
        return [
            GovernanceChunk(
                title="Definisi dan Interpretasi",
                category="General",
                body="Dalam Kontrak ini, kecuali konteksnya menentukan lain: (a) 'Hari Kerja' berarti hari Senin sampai dengan Jumat, kecuali hari libur nasional; (b) 'Force Majeure' berarti keadaan kahar yang berada di luar kendali para pihak; (c) rujukan kepada undang-undang termasuk peraturan pelaksanaannya.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Kewajiban Kepatuhan Hukum",
                category="Compliance",
                body="Para Pihak wajib mematuhi seluruh peraturan perundang-undangan yang berlaku di Indonesia, termasuk namun tidak terbatas pada: (a) UU No. 8 Tahun 1999 tentang Perlindungan Konsumen; (b) UU No. 21 Tahun 2008 tentang Perbankan Syariah; (c) peraturan sektor logistik yang ditetapkan oleh Kementerian Perhubungan.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Klausul Penyelesaian Sengketa",
                category="Legal",
                body="Setiap perselisihan yang timbul dari atau berkaitan dengan Kontrak ini akan diselesaikan melalui: (1) Musyawarah mufakat dalam jangka waktu 30 hari; (2) Mediasi melalui lembaga mediasi terakreditasi; (3) Arbitrase BANI sesuai prosedur yang berlaku; (4) Pengadilan Negeri Jakarta Pusat sebagai pilihan terakhir.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Jangka Waktu dan Perpanjangan",
                category="Duration",
                body="Kontrak ini berlaku selama periode yang ditetapkan dan dapat diperpanjang atas kesepakatan tertulis para pihak. Perpanjangan harus diajukan paling lambat 60 hari sebelum berakhirnya masa berlaku kontrak. Jika tidak ada pemberitahuan perpanjangan, kontrak akan berakhir secara otomatis.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Klausul Pembayaran dan Denda",
                category="Financial",
                body="Pembayaran dilakukan dalam mata uang Rupiah melalui transfer bank. Keterlambatan pembayaran dikenakan denda 0,1% per hari dari jumlah yang terhutang. Pihak yang melanggar kewajiban kontraktual dapat dikenakan penalti maksimal 10% dari nilai kontrak, kecuali disepakati lain.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Kerahasiaan dan Perlindungan Data",
                category="Privacy",
                body="Para Pihak wajib menjaga kerahasiaan informasi yang diperoleh selama pelaksanaan kontrak. Setiap pengolahan data pribadi harus mematuhi UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. Pelanggaran kerahasiaan dapat mengakibatkan ganti rugi dan pemutusan kontrak.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Tanggung Jawab dan Asuransi",
                category="Liability",
                body="Setiap pihak bertanggung jawab atas kerugian yang disebabkan oleh kelalaian atau pelanggaran kontrak. Pihak yang berisiko tinggi wajib memiliki asuransi dengan nilai pertanggungan minimal 200% dari nilai kontrak. Tanggung jawab dibatasi sesuai dengan tingkat kesalahan masing-masing pihak.",
                gov_version="ILCS-GOV-2024-v1.2"
            ),
            GovernanceChunk(
                title="Pemutusan Kontrak",
                category="Termination",
                body="Kontrak dapat diputus oleh salah satu pihak dengan alasan: (1) Pelanggaran material yang tidak diperbaiki dalam 30 hari; (2) Pailit atau likuidasi; (3) Force majeure yang berlangsung lebih dari 90 hari. Pemutusan harus diberitahukan secara tertulis dengan periode notice 60 hari.",
                gov_version="ILCS-GOV-2024-v1.2"
            )
        ]


rag_service = RAGService()