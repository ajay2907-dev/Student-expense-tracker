import io
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_csv_report(df: pd.DataFrame) -> bytes:
    if df.empty:
        return b""
    return df.to_csv(index=False).encode('utf-8')

def generate_pdf_report(student_name: str, email: str, period_str: str, budget: float, total_spent: float, df: pd.DataFrame) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    story = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#6d3bd7'), spaceAfter=12)
    meta_style = ParagraphStyle('DocMeta', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#494454'), spaceAfter=6)
    h2_style = ParagraphStyle('DocH2', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#0b1326'), spaceBefore=12, spaceAfter=8)
    
    story.append(Paragraph("🎓 Student Expense Report Statement", title_style))
    story.append(Paragraph(f"<b>Student Name:</b> {student_name} ({email})", meta_style))
    story.append(Paragraph(f"<b>Reporting Period:</b> {period_str}", meta_style))
    story.append(Spacer(1, 10))
    
    # Financial Summary Table
    rem = budget - total_spent
    summary_data = [
        ["Monthly Budget", "Total Spent", "Remaining Balance", "Total Transactions"],
        [f"₹{budget:,.2f}", f"₹{total_spent:,.2f}", f"₹{rem:,.2f}", str(len(df))]
    ]
    summary_table = Table(summary_data, colWidths=[130, 130, 130, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e9ddff')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#23005c')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#cbc3d7'))
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    story.append(Paragraph("Transaction History Breakdown", h2_style))
    
    # Expense Items
    if not df.empty:
        table_data = [["Date", "Description", "Category", "Payment", "Amount"]]
        for _, row in df.head(30).iterrows():
            d_str = str(row['date'])[:10]
            desc = str(row['description'])[:20]
            cat = str(row['category'])
            pay = str(row['payment_method'])
            amt = f"₹{float(row['amount']):,.2f}"
            table_data.append([d_str, desc, cat, pay, amt])
            
        exp_table = Table(table_data, colWidths=[80, 150, 110, 90, 90])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#2d3449')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
            ('ALIGN', (-1,1), (-1,-1), 'RIGHT'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(exp_table)
    else:
        story.append(Paragraph("No expense records found for this period.", meta_style))
        
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
