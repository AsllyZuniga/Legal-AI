import fitz  # PyMuPDF
import pdfplumber
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class ParsedDocument:
    text: str
    metadata: dict
    pages: list
    method: str
    confidence: float

class PDFParser:
    """Parse PDFs using PyMuPDF (native) or pdfplumber (fallback)."""
    
    def parse(self, file_path: str) -> ParsedDocument:
        try:
            return self._parse_pymupdf(file_path)
        except Exception:
            return self._parse_pdfplumber(file_path)
    
    def _parse_pymupdf(self, file_path: str) -> ParsedDocument:
        doc = fitz.open(file_path)
        pages = []
        full_text = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append({"page": page_num + 1, "text": text})
            full_text.append(text)
        
        doc.close()
        
        return ParsedDocument(
            text="\n\n".join(full_text),
            metadata={"pages": len(pages)},
            pages=pages,
            method="pymupdf",
            confidence=0.95,
        )
    
    def _parse_pdfplumber(self, file_path: str) -> ParsedDocument:
        pages = []
        full_text = []
        
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                pages.append({"page": page_num + 1, "text": text})
                full_text.append(text)
        
        return ParsedDocument(
            text="\n\n".join(full_text),
            metadata={"pages": len(pages)},
            pages=pages,
            method="pdfplumber",
            confidence=0.85,
        )