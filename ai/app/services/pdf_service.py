import logging
from io import BytesIO
from datetime import datetime
from typing import Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.models.schemas import PdfBuildRequest

logger = logging.getLogger(__name__)


class PDFService:
    def __init__(self):
        template_dir = Path(__file__).parent.parent / "templates"
        
        if template_dir.exists():
            self.env = Environment(
                loader=FileSystemLoader(template_dir),
                autoescape=True
            )
        else:
            logger.warning(f"Templates directory not found at {template_dir}, PDF generation will use fallback")
            self.env = None
    
    async def generate_contract_pdf(
        self,
        request: PdfBuildRequest,
        correlation_id: Optional[str] = None
    ) -> bytes:
        """
        Generate a contract PDF from the request data.
        
        Args:
            request: PDF build request with contract data
            correlation_id: Request correlation ID for logging
            
        Returns:
            PDF bytes
            
        Raises:
            Exception: If PDF generation fails
        """
        try:
            if self.env is None:
                raise Exception("Templates directory not available, falling back to mock PDF")
            
            try:
                from weasyprint import HTML, CSS
                from weasyprint.text.fonts import FontConfiguration
                font_config = FontConfiguration()
            except (ImportError, OSError) as e:
                raise Exception(f"WeasyPrint not available on this system: {str(e)}. Please install system dependencies.")
            
            logger.info(
                extra={
                    "correlation_id": correlation_id,
                    "clauses_count": len(request.clauses),
                    "parties_count": len(request.parties),
                    "has_watermark": bool(request.watermark)
                }
            )
            
            context = self._prepare_template_context(request)
            html_template = self.env.get_template("contract.html")
            html_content = html_template.render(**context)
            css_path = Path(__file__).parent.parent / "templates" / "styles.css"
            css_content = css_path.read_text(encoding='utf-8')
            html_doc = HTML(string=html_content)
            css_doc = CSS(string=css_content, font_config=font_config)
            
            pdf_bytes = html_doc.write_pdf(
                stylesheets=[css_doc],
                font_config=font_config
            )
            
            logger.info(
                "Contract PDF generated successfully",
                extra={
                    "correlation_id": correlation_id,
                    "pdf_size_bytes": len(pdf_bytes)
                }
            )
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(
                "Failed to generate contract PDF with WeasyPrint",
                extra={"correlation_id": correlation_id, "error": str(e)}
            )
            
            logger.warning(
                "Falling back to mock PDF generation",
                extra={"correlation_id": correlation_id}
            )
            return self._generate_mock_pdf(request, correlation_id)
    
    def _generate_mock_pdf(self, request: PdfBuildRequest, correlation_id: Optional[str] = None) -> bytes:
        logger.info(
            "Generating mock PDF using reportlab",
            extra={"correlation_id": correlation_id}
        )
        
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.lib import colors
        except ImportError:
            logger.warning("Reportlab not available, generating text fallback")
            return self._generate_text_fallback(request)
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=16,
            spaceAfter=20,
            alignment=1 
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=10,
            textColor=colors.black
        )
        
        story.append(Paragraph(request.header.title, title_style))
        story.append(Spacer(1, 20))
        
        if hasattr(request.header, 'number') and request.header.number:
            story.append(Paragraph(f"Nomor: {request.header.number}", styles['Normal']))
            story.append(Spacer(1, 12))
        
        story.append(Paragraph("PARA PIHAK", heading_style))
        
        for party in request.parties:
            party_text = f"<b>{party.role}</b><br/>"
            party_text += f"{party.name}<br/>"
            if party.rep:
                party_text += f"Diwakili: {party.rep}<br/>"
            party_text += f"Alamat: {party.address}"
            
            story.append(Paragraph(party_text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        story.append(Spacer(1, 20))
        story.append(Paragraph("PASAL-PASAL", heading_style))
        
        for clause in request.clauses:
            clause_title = f"Pasal {clause.no}: {clause.title}"
            story.append(Paragraph(clause_title, styles['Heading3']))
            
            story.append(Paragraph(clause.text, styles['Normal']))
            story.append(Spacer(1, 12))
        
        if request.watermark:
            story.append(Spacer(1, 30))
            watermark_style = ParagraphStyle(
                'Watermark',
                parent=styles['Normal'],
                fontSize=24,
                textColor=colors.lightgrey,
                alignment=1
            )
            story.append(Paragraph(f"[{request.watermark}]", watermark_style))
        
        story.append(Spacer(1, 30))
        footer_text = f"Generated on: {datetime.now().strftime('%d %B %Y')}<br/>"
        if request.footer.hash:
            footer_text += f"Document Hash: {request.footer.hash}<br/>"
        footer_text += f"Version: {request.footer.version or '1.0'}<br/>"
        footer_text += "Generated by AI Contract Management Service"
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey
        )
        story.append(Paragraph(footer_text, footer_style))
        
        doc.build(story)
        buffer.seek(0)
        
        logger.info(
            "Mock PDF generated successfully using reportlab",
            extra={
                "correlation_id": correlation_id,
                "pdf_size": len(buffer.getvalue())
            }
        )
        
        return buffer.getvalue()
    
    def _generate_text_fallback(self, request: PdfBuildRequest) -> bytes:
        """Generate a text fallback if no PDF libraries are available."""
        mock_content = f"""% Mock PDF Document (Text Fallback)
% Generated on {datetime.now().isoformat()}

KONTRAK: {request.header.title}
{'='*50}

PARA PIHAK:
"""
        
        for i, party in enumerate(request.parties, 1):
            mock_content += f"{party.role}: {party.name}\n"
            if party.rep:
                mock_content += f"Diwakili: {party.rep}\n"
            mock_content += f"Alamat: {party.address}\n\n"
        
        mock_content += "PASAL-PASAL:\n" + "="*20 + "\n\n"
        
        for clause in request.clauses:
            mock_content += f"Pasal {clause.no}: {clause.title}\n"
            mock_content += f"{clause.text}\n\n"
        
        if request.watermark:
            mock_content += f"\n[{request.watermark}]\n"
        
        mock_content += f"\nDocument Hash: {request.footer.hash or 'N/A'}\n"
        mock_content += f"Version: {request.footer.version or '1.0'}\n"
        mock_content += f"\nGenerated by AI Contract Management Service (Text Fallback)\n"
        
        return mock_content.encode('utf-8')
    
    def _prepare_template_context(self, request: PdfBuildRequest) -> dict:
        """Prepare context data for template rendering."""
        current_date = datetime.now().strftime("%d %B %Y")
        formatted_parties = []
        for i, party in enumerate(request.parties, 1):
            formatted_parties.append({
                "role": party.role,
                "name": party.name,
                "rep": party.rep,
                "address": party.address,
                "number": self._number_to_indonesian(i)
            })
        
        formatted_clauses = []
        for clause in request.clauses:
            formatted_clauses.append({
                "no": clause.no,
                "roman": self._number_to_roman(clause.no),
                "title": clause.title,
                "text": clause.text
            })
        
        return {
            "header": request.header,
            "parties": formatted_parties,
            "clauses": formatted_clauses,
            "footer": request.footer,
            "watermark": request.watermark,
            "current_date": current_date,
            "generation_date": datetime.now().isoformat()
        }
    
    def _number_to_roman(self, num: int) -> str:
        """Convert number to Roman numerals."""
        values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
        symbols = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"]
        
        result = ""
        for i in range(len(values)):
            while num >= values[i]:
                result += symbols[i]
                num -= values[i]
        return result
    
    def _number_to_indonesian(self, num: int) -> str:
        """Convert number to Indonesian written form."""
        numbers = {
            1: "PERTAMA",
            2: "KEDUA", 
            3: "KETIGA",
            4: "KEEMPAT",
            5: "KELIMA",
            6: "KEENAM",
            7: "KETUJUH",
            8: "KEDELAPAN",
            9: "KESEMBILAN",
            10: "KESEPULUH"
        }
        return numbers.get(num, f"KE-{num}")

pdf_service = PDFService()