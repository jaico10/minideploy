import io
import xml.sax.saxutils as saxutils
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def escape_xml(text):
    if not text:
        return ""
    return saxutils.escape(text).replace('\n', '<br/>')

def generate_pdf_report(scan) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.black,
        backColor=colors.whitesmoke,
        borderPadding=5,
    )

    story = []
    
    story.append(Paragraph("Code Sentinel - SAST Security Report", title_style))
    story.append(Spacer(1, 12))
    
    data = [
        ["Task ID", str(scan.task_id)],
        ["Status", str(scan.status)],
        ["Generated At", str(scan.created_at)],
        ["Total Files Scanned", str(scan.total_files or 0)],
        ["Vulnerabilities Found", str(scan.issues_count or 0)],
        ["Risk Score", f"{scan.risk_score or 0}/10"],
        ["Severity", str(scan.severity or 'N/A')]
    ]
    t = Table(data, colWidths=[150, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('GRID', (0, 0), (-1, -1), 1, colors.silver),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 24))
    
    story.append(Paragraph("Detailed Findings", heading_style))
    story.append(Spacer(1, 12))
    
    vulnerable_results = [r for r in scan.scan_results if getattr(r, 'vulnerable', False)]
    if not vulnerable_results:
        story.append(Paragraph("No vulnerabilities found! Great job.", normal_style))
    else:
        for res in vulnerable_results:
            file_path = getattr(res, 'file_path', 'unknown')
            story.append(Paragraph(f"File: <b>{saxutils.escape(str(file_path))}</b>", styles['Heading3']))
            story.append(Spacer(1, 6))
            
            story.append(Paragraph("Vulnerable Code Segment:", normal_style))
            vuln_code = (getattr(res, 'scanned_code', None) or "")[:2000] # Truncate long files
            story.append(Paragraph(escape_xml(vuln_code), code_style))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("AI Fixed Code Segment:", normal_style))
            fixed_code = (getattr(res, 'fixed_code', None) or "")[:2000]
            story.append(Paragraph(escape_xml(fixed_code), code_style))
            story.append(Spacer(1, 20))
            
    doc.build(story)
    buffer.seek(0)
    return buffer
