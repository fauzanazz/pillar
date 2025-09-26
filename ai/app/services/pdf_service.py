import logging
from io import BytesIO
from datetime import datetime
from typing import Optional, List
from app.models.schemas import PdfBuildRequest

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, PageBreak, 
        Table, TableStyle, KeepTogether, Image, Flowable
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm, mm
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.utils import simpleSplit
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

logger = logging.getLogger(__name__)


class Watermark(Flowable):
    """Watermark flowable for ReportLab"""
    
    def __init__(self, text, width, height):
        Flowable.__init__(self)
        self.text = text
        self.width = width
        self.height = height
    
    def draw(self):
        # Save canvas state
        self.canv.saveState()
        # Set watermark properties
        self.canv.setFont("Helvetica", 60)
        self.canv.setFillColorRGB(0.9, 0.9, 0.9, alpha=0.3)
        # Rotate and draw text
        self.canv.translate(self.width/2, self.height/2)
        self.canv.rotate(45)
        self.canv.drawCentredString(0, 0, self.text)
        # Restore canvas state
        self.canv.restoreState()


class PDFService:
    def __init__(self):
        self.styles = None
        if REPORTLAB_AVAILABLE:
            self._init_styles()
    
    def _init_styles(self):
        """Initialize custom styles for the PDF document"""
        self.styles = getSampleStyleSheet()
        
        # Title style
        self.styles.add(ParagraphStyle(
            name='ContractTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.black,
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Contract number style
        self.styles.add(ParagraphStyle(
            name='ContractNumber',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.black,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica'
        ))
        
        # Section heading style
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.black,
            spaceBefore=20,
            spaceAfter=15,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Clause title style
        self.styles.add(ParagraphStyle(
            name='ClauseTitle',
            parent=self.styles['Heading3'],
            fontSize=12,
            textColor=colors.black,
            spaceBefore=15,
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        # Normal justified text
        self.styles.add(ParagraphStyle(
            name='Justified',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceBefore=6,
            spaceAfter=6,
            leading=14
        ))
        
        # Party info style
        self.styles.add(ParagraphStyle(
            name='PartyInfo',
            parent=self.styles['Normal'],
            fontSize=11,
            leftIndent=20,
            spaceBefore=5,
            spaceAfter=5,
            leading=14
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER,
            spaceBefore=20
        ))
        
        # Signature style
        self.styles.add(ParagraphStyle(
            name='Signature',
            parent=self.styles['Normal'],
            fontSize=11,
            alignment=TA_CENTER,
            spaceBefore=60,
            spaceAfter=5
        ))
    
    async def generate_contract_pdf(
        self,
        request: PdfBuildRequest,
        correlation_id: Optional[str] = None
    ) -> bytes:
        """
        Generate a professional contract PDF from the request data.
        
        Args:
            request: PDF build request with contract data
            correlation_id: Request correlation ID for logging
            
        Returns:
            PDF bytes
            
        Raises:
            Exception: If PDF generation fails
        """
        if not REPORTLAB_AVAILABLE:
            logger.error(
                "ReportLab is not available",
                extra={"correlation_id": correlation_id}
            )
            return self._generate_text_fallback(request)
        
        try:
            logger.info(
                "Starting PDF generation with ReportLab",
                extra={
                    "correlation_id": correlation_id,
                    "clauses_count": len(request.clauses),
                    "parties_count": len(request.parties),
                    "has_watermark": bool(request.watermark)
                }
            )
            
            # Create buffer for PDF
            buffer = BytesIO()
            
            # Create document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=2.5*cm,
                leftMargin=2.5*cm,
                topMargin=2.5*cm,
                bottomMargin=2.5*cm,
                title=request.header.title,
                author="AI Contract Management Service"
            )
            
            # Build story
            story = []
            
            # Add title
            story.append(Paragraph(
                request.header.title.upper(),
                self.styles['ContractTitle']
            ))
            
            # Add contract number if available
            if hasattr(request.header, 'number') and request.header.number:
                story.append(Paragraph(
                    f"Nomor: {request.header.number}",
                    self.styles['ContractNumber']
                ))
            
            story.append(Spacer(1, 0.5*cm))
            
            # Add date and introduction
            current_date = datetime.now().strftime("%d %B %Y")
            intro_text = f"Pada hari ini, {current_date}, telah dibuat dan ditandatangani perjanjian ini oleh dan antara:"
            story.append(Paragraph(intro_text, self.styles['Justified']))
            
            story.append(Spacer(1, 0.3*cm))
            
            # Add parties section
            story.append(Paragraph("PARA PIHAK", self.styles['SectionHeading']))
            
            for i, party in enumerate(request.parties, 1):
                # Party header
                party_header = f"<b>PIHAK {self._number_to_indonesian(i)}:</b>"
                story.append(Paragraph(party_header, self.styles['Normal']))
                
                # Party details
                party_details = []
                party_details.append(f"<b>{party.name}</b>")
                
                if party.rep:
                    party_details.append(f"Dalam hal ini diwakili oleh: {party.rep}")
                
                party_details.append(f"Berkedudukan di: {party.address}")
                party_details.append(f"Selanjutnya disebut sebagai <b>\"{party.role}\"</b>")
                
                for detail in party_details:
                    story.append(Paragraph(detail, self.styles['PartyInfo']))
                
                story.append(Spacer(1, 0.3*cm))
            
            # Add preamble
            story.append(Paragraph(
                "Para Pihak terlebih dahulu menerangkan hal-hal sebagai berikut:",
                self.styles['Justified']
            ))
            story.append(Paragraph(
                "Bahwa Para Pihak sepakat untuk mengadakan perjanjian ini dengan ketentuan dan syarat-syarat sebagai berikut:",
                self.styles['Justified']
            ))
            
            story.append(Spacer(1, 0.5*cm))
            
            # Add clauses section
            story.append(Paragraph("PASAL-PASAL", self.styles['SectionHeading']))
            
            for clause in request.clauses:
                # Keep clause title and content together
                clause_elements = []
                
                # Clause title
                clause_title = f"PASAL {clause.no}<br/>{clause.title.upper()}"
                clause_elements.append(
                    Paragraph(clause_title, self.styles['ClauseTitle'])
                )
                
                # Clause content - handle multi-line text
                if '\n' in clause.text:
                    for paragraph in clause.text.split('\n'):
                        if paragraph.strip():
                            clause_elements.append(
                                Paragraph(paragraph.strip(), self.styles['Justified'])
                            )
                else:
                    clause_elements.append(
                        Paragraph(clause.text, self.styles['Justified'])
                    )
                
                # Keep clause together on same page if possible
                story.append(KeepTogether(clause_elements))
                story.append(Spacer(1, 0.3*cm))
            
            # Add closing statement
            story.append(Spacer(1, 0.5*cm))
            closing = f"Demikian perjanjian ini dibuat dalam {len(request.parties)} ({self._number_to_indonesian_word(len(request.parties))}) rangkap yang masing-masing mempunyai kekuatan hukum yang sama, dan ditandatangani oleh Para Pihak pada hari dan tanggal sebagaimana disebutkan di atas."
            story.append(Paragraph(closing, self.styles['Justified']))
            
            # Add signature section
            story.append(Spacer(1, 1.5*cm))
            
            # Create signature table
            sig_data = []
            sig_row_parties = []
            sig_row_lines = []
            sig_row_names = []
            
            for party in request.parties:
                sig_row_parties.append(Paragraph(party.role.upper(), self.styles['Signature']))
                sig_row_lines.append(Paragraph("_" * 30, self.styles['Signature']))
                sig_row_names.append(Paragraph(f"({party.name})", self.styles['Normal']))
            
            sig_data = [
                sig_row_parties,
                [Spacer(1, 1.5*cm)] * len(request.parties),  # Space for actual signature
                sig_row_lines,
                sig_row_names
            ]
            
            sig_table = Table(sig_data, colWidths=[doc.width/len(request.parties)] * len(request.parties))
            sig_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            
            story.append(sig_table)
            
            # Add footer
            story.append(Spacer(1, 1*cm))
            footer_lines = []
            
            if request.footer.hash:
                footer_lines.append(f"Document Hash: {request.footer.hash}")
            
            if request.footer.version:
                footer_lines.append(f"Version: {request.footer.version}")
            
            footer_lines.append(f"Generated: {datetime.now().isoformat()}")
            footer_lines.append("Generated by AI Contract Management Service")
            
            footer_text = "<br/>".join(footer_lines)
            story.append(Paragraph(footer_text, self.styles['Footer']))
            
            # Build PDF with watermark if needed
            if request.watermark:
                doc.build(
                    story,
                    onFirstPage=lambda c, d: self._add_watermark(c, d, request.watermark),
                    onLaterPages=lambda c, d: self._add_watermark(c, d, request.watermark)
                )
            else:
                doc.build(story)
            
            # Get PDF bytes
            buffer.seek(0)
            pdf_bytes = buffer.getvalue()
            
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
                f"Failed to generate contract PDF: {str(e)}",
                extra={"correlation_id": correlation_id}
            )
            raise
    
    def _add_watermark(self, canvas, doc, watermark_text):
        """Add watermark to PDF pages"""
        canvas.saveState()
        canvas.setFont('Helvetica', 50)
        canvas.setFillGray(0.85, 0.3)
        canvas.translate(A4[0]/2, A4[1]/2)
        canvas.rotate(45)
        canvas.drawCentredString(0, 0, watermark_text.upper())
        canvas.restoreState()
    
    def _number_to_indonesian(self, num: int) -> str:
        """Convert number to Indonesian ordinal"""
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
    
    def _number_to_indonesian_word(self, num: int) -> str:
        """Convert number to Indonesian word"""
        words = {
            1: "satu",
            2: "dua",
            3: "tiga",
            4: "empat",
            5: "lima",
            6: "enam",
            7: "tujuh",
            8: "delapan",
            9: "sembilan",
            10: "sepuluh"
        }
        return words.get(num, str(num))
    
    def _generate_text_fallback(self, request: PdfBuildRequest) -> bytes:
        """Generate a text fallback if ReportLab is not available"""
        content = f"""
CONTRACT DOCUMENT
=================

{request.header.title}
{f'Number: {request.header.number}' if hasattr(request.header, 'number') and request.header.number else ''}

PARTIES:
--------
"""
        for i, party in enumerate(request.parties, 1):
            content += f"\nPARTY {i}: {party.name}\n"
            if party.rep:
                content += f"Represented by: {party.rep}\n"
            content += f"Address: {party.address}\n"
            content += f"Role: {party.role}\n"
        
        content += "\n\nCLAUSES:\n--------\n"
        
        for clause in request.clauses:
            content += f"\nArticle {clause.no}: {clause.title}\n"
            content += f"{clause.text}\n"
        
        if request.watermark:
            content += f"\n[{request.watermark}]\n"
        
        content += f"\nDocument Hash: {request.footer.hash or 'N/A'}\n"
        content += f"Version: {request.footer.version or '1.0'}\n"
        content += f"Generated: {datetime.now().isoformat()}\n"
        
        return content.encode('utf-8')


pdf_service = PDFService()