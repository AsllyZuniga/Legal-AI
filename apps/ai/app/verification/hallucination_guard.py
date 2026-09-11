from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class VerificationResult:
    is_valid: bool
    verified_citations: List[Dict]
    unverified_citations: List[Dict]
    warnings: List[str]
    confidence: float

class HallucinationGuard:
    """
    Three-layer protection against legal hallucinations:
    1. System prompt rules
    2. Post-generation citation verification
    3. Confidence scoring
    """
    
    SYSTEM_PROMPT_RULES = """
    REGLAS ABSOLUTAS - NUNCA VIOLAR:
    1. NUNCA inventes sentencias, radicados, fechas o magistrados.
    2. NUNCA inventes artículos de ley o normas.
    3. NUNCA inventes citas jurisprudenciales.
    4. Si no tienes la información, di: "NO EXISTE INFORMACIÓN SUFICIENTE PARA ESTABLECER ESTA CONCLUSIÓN CON SEGURIDAD."
    5. Si hay posiciones contradictorias, muestra AMBAS.
    6. Distingue siempre entre:
       - Hecho informado por el usuario
       - Hecho acreditado documentalmente
       - Inferencia de la IA
       - Información que requiere verificación
    7. Cada conclusión debe citar su fuente específica.
    """
    
    async def verify_response(
        self,
        response: str,
        available_sources: List[Dict],
    ) -> VerificationResult:
        """Verify that all citations in the response exist in available sources."""
        citations = self._extract_citations(response)
        verified = []
        unverified = []
        warnings = []
        
        source_map = {s.get("citation", ""): s for s in available_sources}
        
        for citation in citations:
            if citation in source_map:
                verified.append({"citation": citation, "source": source_map[citation]})
            else:
                unverified.append({"citation": citation})
                warnings.append(f"Cita no verificada: {citation}")
        
        confidence = len(verified) / max(len(citations), 1)
        
        return VerificationResult(
            is_valid=len(unverified) == 0,
            verified_citations=verified,
            unverified_citations=unverified,
            warnings=warnings,
            confidence=confidence,
        )
    
    def _extract_citations(self, text: str) -> List[str]:
        """Extract legal citations from text using regex patterns."""
        import re
        patterns = [
            r"(?:T|SU|A|M|P)-\d{3,4}/\d{2,4}",  # Corte Constitucional
            r"(?:Sentencia|Auto)\s+(?:de\s+)?\d{4}",  # Generic
            r"Art(?:ículo)?\.?\s+\d+(?:\s+del\s+\w+)?",  # Articles
            r"(?:Ley|Decreto|Resolución)\s+\d+\s+de\s+\d{4}",  # Laws
        ]
        
        citations = []
        for pattern in patterns:
            matches = re.findall(pattern, text)
            citations.extend(matches)
        
        return list(set(citations))
    
    def get_system_prompt(self) -> str:
        return self.SYSTEM_PROMPT_RULES