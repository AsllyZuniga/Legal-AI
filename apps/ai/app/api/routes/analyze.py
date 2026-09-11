from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
import asyncpg
import time
from app.core.dependencies import get_db

router = APIRouter()

ANALYSIS_SYSTEM_PROMPT = """
Eres un asistente jurídico experto en derecho colombiano. Tu tarea es analizar casos jurídicos de manera exhaustiva y rigurosa.

REGLAS ABSOLUTAS:
1. NUNCA inventes sentencias, radicados, fechas, magistrados o artículos de ley.
2. Si no tienes información suficiente, indícalo explícitamente en la sección correspondiente.
3. Distingue claramente entre hechos informados por el usuario, hechos documentados e inferencias de la IA.
4. Cada conclusión debe estar fundamentada en la información proporcionada.
5. Si hay posiciones contradictorias, presenta ambas.
6. Usa terminología jurídica colombiana precisa.
7. Cita normas y jurisprudencia solo si estás seguro de su existencia.

FORMATO DE RESPUESTA (JSON):
Debes devolver un objeto JSON con las siguientes secciones:
{
  "case_summary": "Resumen ejecutivo del caso en 2-3 párrafos",
  "timeline": [
    {"date": "YYYY-MM-DD o descripción temporal", "description": "Evento", "is_juridically_relevant": true/false, "category": "hecho/procesal/evidencia"}
  ],
  "main_legal_issue": "Problema jurídico principal del caso",
  "secondary_legal_issues": ["Problema secundario 1", "Problema secundario 2"],
  "applicable_framework": [
    {"name": "Nombre de la norma", "article": "Artículo si aplica", "is_vigente": true/false}
  ],
  "relevant_jurisprudence": [
    {"citation": "Cita de la sentencia", "corporation": "Corte/Consejo", "summary": "Resumen del holding", "relevance": 0.0-1.0}
  ],
  "applicability_analysis": "Análisis de cómo las normas y jurisprudencia aplican al caso",
  "arguments_for": [
    {"title": "Título del argumento", "description": "Descripción detallada", "strength": "strong/medium/weak"}
  ],
  "arguments_against": [
    {"title": "Título del argumento", "description": "Descripción detallada", "strength": "strong/medium/weak"}
  ],
  "legal_risks": [
    {"title": "Título del riesgo", "description": "Descripción", "severity": "high/medium/low", "mitigation": "Estrategia de mitigación"}
  ],
  "strengths": ["Fortaleza 1", "Fortaleza 2"],
  "weaknesses": ["Debilidad 1", "Debilidad 2"],
  "alternatives": [
    {"title": "Alternativa", "description": "Descripción", "pros": ["Pro 1"], "cons": ["Con 1"], "viability": 0.0-1.0}
  ],
  "evaluation": "Evaluación general del caso",
  "recommendation": "Recomendación estratégica",
  "confidence_level": 0.0-1.0,
  "information_gaps": ["Información faltante 1", "Información faltante 2"]
}
"""

COMPARE_SYSTEM_PROMPT = """
Eres un asistente jurídico experto en derecho colombiano. Tu tarea es comparar una sentencia de referencia con un caso específico.

REGLAS ABSOLUTAS:
1. NUNCA inventes información sobre la sentencia o el caso.
2. Identifica similitudes y diferencias concretas basadas en los hechos y el derecho aplicable.
3. Evalúa la aplicabilidad de la sentencia al caso.
4. Si la sentencia no es aplicable, indícalo claramente.
5. Considera jurisprudencia posterior que pueda haber modificado el criterio.

FORMATO DE RESPUESTA (JSON):
{
  "ruling_citation": "Cita de la sentencia",
  "ruling_facts": "Hechos clave de la sentencia",
  "ruling_legal_issue": "Problema jurídico de la sentencia",
  "ruling_decision": "Decisión de la sentencia",
  "ruling_legal_basis": "Fundamentos jurídicos",
  "ruling_norms": ["Norma 1", "Norma 2"],
  "similarities": ["Similitud 1", "Similitud 2"],
  "differences": ["Diferencia 1", "Diferencia 2"],
  "applicability": "Análisis de aplicabilidad al caso",
  "relevance_level": 0.0-1.0,
  "subsequent_jurisprudence": [
    {"citation": "Cita posterior", "summary": "Cómo modifica o complementa"}
  ],
  "caveat": "Advertencias o limitaciones"
}
"""

EVOLUTION_SYSTEM_PROMPT = """
Eres un asistente jurídico experto en derecho colombiano. Tu tarea es analizar la evolución jurisprudencial sobre un tema específico.

REGLAS ABSOLUTAS:
1. NUNCA inventes sentencias o cambios jurisprudenciales.
2. Identifica hitos jurisprudenciales concretos con sus citas.
3. Indica si la línea jurisprudencial actual está vigente.
4. Si no hay información suficiente, indícalo explícitamente.

FORMATO DE RESPUESTA (JSON):
{
  "legal_topic": "Tema jurídico",
  "corporation": "Corporación judicial",
  "current_position": "Posición actual de la jurisprudencia",
  "evolution_steps": [
    {"period": "Período o año", "ruling_citation": "Cita de la sentencia", "position": "Posición adoptada", "change_type": "original/reitera/precisa/modifica/supera"}
  ],
  "is_modified": true/false,
  "current_line_is_vigent": true/false
}
"""

class AnalyzeCaseRequest(BaseModel):
    case_id: str
    facts: List[Dict] = []
    events: List[Dict] = []
    pretensions: List[Dict] = []
    defenses: List[Dict] = []
    alerts: List[Dict] = []
    legal_area: Optional[str] = None
    description: Optional[str] = None
    analysis_type: str = "full"

class AnalyzeResponse(BaseModel):
    status: str
    session_id: str
    analysis: Optional[Dict] = None
    message: str

class CompareRequest(BaseModel):
    ruling_id: str
    ruling_citation: Optional[str] = None
    ruling_summary: Optional[str] = None
    ruling_full_text: Optional[str] = None
    case_facts: List[Dict] = []
    case_description: Optional[str] = None
    case_legal_area: Optional[str] = None

class EvolutionRequest(BaseModel):
    legal_topic: str
    corporation: str
    date_from: Optional[str] = None
    date_to: Optional[str] = None

@router.post("/case", response_model=AnalyzeResponse)
async def analyze_case(request: AnalyzeCaseRequest, db: asyncpg.Pool = Depends(get_db)):
    """Full case analysis with structured output."""
    try:
        from app.providers.llm.openai_provider import OpenAILLMProvider
        llm = OpenAILLMProvider()
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")

    facts_text = "\n".join([
        f"- [{f.get('fact_type', 'desconocido')}] {f.get('description', '')} (Fecha: {f.get('event_date', 'N/A')})"
        for f in request.facts
    ]) if request.facts else "No se proporcionaron hechos."

    events_text = "\n".join([
        f"- {e.get('description', '')} (Fecha: {e.get('event_date', 'N/A')})"
        for e in request.events
    ]) if request.events else "No se proporcionaron eventos."

    pretensions_text = "\n".join([
        f"- {p.get('description', '')} (Base legal: {p.get('legal_basis', 'N/A')})"
        for p in request.pretensions
    ]) if request.pretensions else "No se proporcionaron pretensiones."

    defenses_text = "\n".join([
        f"- [{d.get('defense_type', 'defensa')}] {d.get('description', '')}"
        for d in request.defenses
    ]) if request.defenses else "No se proporcionaron defensas."

    user_message = f"""
Analiza el siguiente caso jurídico colombiano:

ÁREA LEGAL: {request.legal_area or 'No especificada'}

DESCRIPCIÓN DEL CASO:
{request.description or 'No proporcionada'}

HECHOS:
{facts_text}

EVENTOS/CRONOLOGÍA:
{events_text}

PRETENSIONES:
{pretensions_text}

DEFENSAS/EXCEPCIONES:
{defenses_text}

Realiza un análisis completo siguiendo el formato JSON especificado.
"""

    try:
        analysis_result = await llm.chat_structured(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=ANALYSIS_SYSTEM_PROMPT,
            temperature=0.2,
        )

        session_id = await db.fetchval(
            """
            INSERT INTO analysis_sessions (id, user_id, case_id, analysis_type, input_data, output_data, confidence_score, llm_model, created_at)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id
            """,
            request.case_id,
            request.case_id,
            request.analysis_type,
            {"facts": request.facts, "events": request.events, "pretensions": request.pretensions},
            analysis_result,
            analysis_result.get("confidence_level", 0.0),
            "gpt-4o",
        )

        return AnalyzeResponse(
            status="completed",
            session_id=str(session_id),
            analysis=analysis_result,
            message="Análisis completado exitosamente.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")

@router.post("/compare")
async def compare_precedents(request: CompareRequest, db: asyncpg.Pool = Depends(get_db)):
    """Compare a precedent with the current case."""
    try:
        from app.providers.llm.openai_provider import OpenAILLMProvider
        llm = OpenAILLMProvider()
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")

    facts_text = "\n".join([
        f"- [{f.get('fact_type', 'desconocido')}] {f.get('description', '')}"
        for f in request.case_facts
    ]) if request.case_facts else "No se proporcionaron hechos del caso."

    user_message = f"""
Compara la siguiente sentencia con el caso presentado:

SENTENCIA DE REFERENCIA:
Cita: {request.ruling_citation or 'N/A'}
Resumen: {request.ruling_summary or 'No proporcionado'}
Texto relevante: {request.ruling_full_text[:2000] if request.ruling_full_text else 'No proporcionado'}

CASO A ANALIZAR:
Área legal: {request.case_legal_area or 'No especificada'}
Descripción: {request.case_description or 'No proporcionada'}
Hechos:
{facts_text}

Realiza la comparación siguiendo el formato JSON especificado.
"""

    try:
        comparison_result = await llm.chat_structured(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=COMPARE_SYSTEM_PROMPT,
            temperature=0.2,
        )
        return comparison_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en comparación: {str(e)}")

@router.post("/evolution")
async def analyze_evolution(request: EvolutionRequest, db: asyncpg.Pool = Depends(get_db)):
    """Analyze jurisprudential evolution on a topic."""
    try:
        from app.providers.llm.openai_provider import OpenAILLMProvider
        llm = OpenAILLMProvider()
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")

    date_range = ""
    if request.date_from or request.date_to:
        date_range = f"\nPeríodo: {request.date_from or 'inicio'} a {request.date_to or 'actual'}"

    user_message = f"""
Analiza la evolución jurisprudencial sobre el siguiente tema:

TEMA: {request.legal_topic}
CORPORACIÓN: {request.corporation}
{date_range}

Identifica los hitos jurisprudenciales más importantes, cómo ha cambiado la posición de la corporación, y cuál es la posición vigente actualmente.

Realiza el análisis siguiendo el formato JSON especificado.
"""

    try:
        evolution_result = await llm.chat_structured(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=EVOLUTION_SYSTEM_PROMPT,
            temperature=0.2,
        )
        return evolution_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis de evolución: {str(e)}")
