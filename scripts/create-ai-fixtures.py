from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1] / "fixtures" / "ai"
ROOT.mkdir(parents=True, exist_ok=True)

pdf_path = ROOT / "sample.pdf"
pdf = canvas.Canvas(str(pdf_path), pagesize=(595, 842))
pdf.setTitle("A3LAM synthetic extraction fixture")
pdf.drawString(72, 780, "Synthetic PDF extraction fixture")
pdf.drawString(72, 750, "Education")
pdf.drawString(72, 720, "Example University — Bachelor of Testing")
pdf.showPage()
pdf.drawString(72, 780, "Experience")
pdf.drawString(72, 750, "Example Lab — Data Editor")
pdf.save()

empty_pdf_path = ROOT / "empty.pdf"
empty_pdf = canvas.Canvas(str(empty_pdf_path), pagesize=(595, 842))
empty_pdf.showPage()
empty_pdf.save()

docx_path = ROOT / "sample.docx"
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'''
rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
document = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr><w:r><w:t>Synthetic DOCX extraction fixture</w:t></w:r></w:p><w:p><w:r><w:t>Education</w:t></w:r></w:p><w:p><w:r><w:t>Example University — Bachelor of Testing</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Skill</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Testing</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'''
with ZipFile(docx_path, "w", ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("_rels/.rels", rels)
    archive.writestr("word/document.xml", document)

(ROOT / "empty.txt").write_bytes(b"")
(ROOT / "whitespace.txt").write_text(" \n\n\t ", encoding="utf-8")
(ROOT / "malformed.pdf").write_bytes(b"%PDF-1.7\nnot a valid body\n%%EOF")
(ROOT / "malformed.docx").write_bytes(b"PK\x03\x04not-a-docx")
(ROOT / "malformed-encoding.txt").write_bytes(bytes((255, 254, 250, 0)))

suspicious_docx_path = ROOT / "suspicious.docx"
with ZipFile(suspicious_docx_path, "w", ZIP_DEFLATED) as archive:
    archive.writestr("[Content_Types].xml", content_types)
    archive.writestr("word/document.xml", "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body><w:p><w:r><w:t>" + ("x" * 500_000) + "</w:t></w:r></w:p></w:body></w:document>")
