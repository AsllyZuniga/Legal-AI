from typing import List, Dict
from dataclasses import dataclass

@dataclass
class Chunk:
    content: str
    section_type: str
    section_title: str
    hierarchy_path: str
    page_numbers: str
    chunk_level: int
    metadata: dict

class LegalChunker:
    """Chunking strategy for legal documents respecting structure."""
    
    def __init__(self, chunk_size: int = 800, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
    
    def chunk_text(self, text: str, metadata: dict = None) -> List[Chunk]:
        """Split text into legal-aware chunks."""
        chunks = []
        paragraphs = text.split("\n\n")
        
        current_chunk = ""
        chunk_index = 0
        
        for para in paragraphs:
            if len(current_chunk) + len(para) > self.chunk_size and current_chunk:
                chunks.append(Chunk(
                    content=current_chunk.strip(),
                    section_type=metadata.get("section_type", "general") if metadata else "general",
                    section_title=metadata.get("section_title", "") if metadata else "",
                    hierarchy_path=metadata.get("hierarchy_path", f"chunk_{chunk_index}") if metadata else f"chunk_{chunk_index}",
                    page_numbers=str(metadata.get("page", "")) if metadata else "",
                    chunk_level=2,
                    metadata=metadata or {},
                ))
                # Keep overlap
                words = current_chunk.split()
                overlap_words = words[-self.overlap // 5:] if len(words) > self.overlap // 5 else []
                current_chunk = " ".join(overlap_words) + "\n\n" + para
                chunk_index += 1
            else:
                current_chunk += "\n\n" + para if current_chunk else para
        
        if current_chunk.strip():
            chunks.append(Chunk(
                content=current_chunk.strip(),
                section_type=metadata.get("section_type", "general") if metadata else "general",
                section_title=metadata.get("section_title", "") if metadata else "",
                hierarchy_path=metadata.get("hierarchy_path", f"chunk_{chunk_index}") if metadata else f"chunk_{chunk_index}",
                page_numbers=str(metadata.get("page", "")) if metadata else "",
                chunk_level=2,
                metadata=metadata or {},
            ))
        
        return chunks
    
    def chunk_ruling(self, ruling_text: str, ruling_id: str) -> List[Chunk]:
        """Chunk a judicial ruling respecting its structure."""
        sections = self._detect_sections(ruling_text)
        all_chunks = []
        
        for section in sections:
            section_chunks = self.chunk_text(
                section["content"],
                metadata={
                    "section_type": section["type"],
                    "section_title": section["title"],
                    "hierarchy_path": f"Ruling > {section['title']}",
                    "ruling_id": ruling_id,
                }
            )
            all_chunks.extend(section_chunks)
        
        return all_chunks
    
    def _detect_sections(self, text: str) -> List[Dict]:
        """Detect legal document sections."""
        import re
        section_patterns = [
            (r"(?i)(CONSIDERANDO|CONSIDERACIONES?)[\s:]*", "considerandos"),
            (r"(?i)(RESUELVE|RESOLUCI[OÓ]N)[\s:]*", "resuelve"),
            (r"(?i)(FALLO|DECISI[OÓ]N)[\s:]*", "fallo"),
            (r"(?i)(FUNDAMENTOS?\s+(JUR[ÍI]DICOS?|DE\s+DERECHO))[\s:]*", "fundamentos"),
            (r"(?i)(PROBLEMA\s+JUR[ÍI]DICO)[\s:]*", "problema_juridico"),
            (r"(?i)(HECHOS?)[\s:]*", "hechos"),
        ]
        
        sections = []
        remaining_text = text
        
        for pattern, section_type in section_patterns:
            match = re.search(pattern, remaining_text)
            if match:
                title = match.group(0).strip()
                content_start = match.end()
                next_section = len(remaining_text)
                
                for other_pattern, _ in section_patterns:
                    other_match = re.search(other_pattern, remaining_text[content_start:])
                    if other_match and other_match.start() + content_start < next_section:
                        next_section = other_match.start() + content_start
                
                content = remaining_text[content_start:next_section].strip()
                if content:
                    sections.append({
                        "type": section_type,
                        "title": title,
                        "content": content,
                    })
        
        if not sections:
            sections.append({
                "type": "full_text",
                "title": "Texto completo",
                "content": text,
            })
        
        return sections