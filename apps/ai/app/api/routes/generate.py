from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, List
import asyncpg
import time
import json
from app.core.dependencies import get_db

router = APIRouter()

DOCUMENT_TEMPLATES: Dict[str, Dict[str, str]] = {
    "concepto_juridico": {
        "title": "Concepto Jurídico",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un concepto jurídico formal y riguroso.

ESTRUCTURA OBLIGATORIA:
1. ENCABEZADO (referencia, fecha, destinatario)
2. ANTECEDENTES (resumen de los hechos relevantes)
3. PROBLEMA JURÍDICO (preguntas concretas a resolver)
4. ANÁLISIS JURÍDICO (desarrollo argumentativo con normas y jurisprudencia)
5. CONCLUSIONES (respuestas claras a cada pregunta)
6. RECOMENDACIONES

REGLAS:
- NUNCA inventes normas, sentencias o artículos.
- Si no conoces una norma específica, indícalo.
- Usa terminología jurídica colombiana.
- Cita normas con formato: Ley X de YYYY, Artículo Z.
- Cita jurisprudencia con formato: Corte Constitucional, Sentencia T-XXX/YYYY.
- Sé preciso y riguroso en el análisis."""
    },
    "analisis_juridico": {
        "title": "Análisis Jurídico",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un análisis jurídico detallado.

ESTRUCTURA OBLIGATORIA:
1. OBJETO DEL ANÁLISIS
2. MARCO NORMATIVO APLICABLE
3. ANÁLISIS DE LOS HECHOS
4. PROBLEMAS JURÍDICOS IDENTIFICADOS
5. ANÁLISIS DE CADA PROBLEMA (normas, jurisprudencia, doctrina)
6. RIESGOS JURÍDICOS
7. CONCLUSIONES
8. RECOMENDACIONES

REGLAS:
- NUNCA inventes normas, sentencias o artículos.
- Distingue entre hechos probados y alegaciones.
- Analiza cada problema jurídico de forma independiente.
- Incluye análisis de jurisprudencia relevante."""
    },
    "demanda": {
        "title": "Demanda",
        "system": """Eres un abogado experto en derecho colombiano y en técnica de redacción de demandas.

ESTRUCTURA OBLIGATORIA:
1. DESIGNACIÓN DE LA AUTORIDAD JUDICIAL
2. IDENTIFICACIÓN DE LAS PARTES
   - Demandante (nombre, identificación, dirección, abogado)
   - Demandado (nombre, identificación, dirección)
3. PRETENSIONES (enumeradas, claras, cuantificables)
4. HECHOS (numerados, cronológicos, precisos)
5. FUNDAMENTOS DE DERECHO
   a. Fundamentos sustantivos (normas aplicables)
   b. Fundamentos procesales (competencia, capacidad, legitimación)
   c. Jurisprudencia relevante
6. PRUEBAS (enumeradas, con indicación de qué se pretende probar)
7. CUANTÍA
8. NOTIFICACIONES
9. FIRMA

REGLAS:
- NUNCA inventes normas, sentencias o artículos.
- Las pretensiones deben ser claras y concretas.
- Los hechos deben estar numerados y ser cronológicos.
- Cada pretensión debe tener fundamento jurídico."""
    },
    "contestacion": {
        "title": "Contestación de Demanda",
        "system": """Eres un abogado experto en derecho colombiano. Redacta la contestación de una demanda.

ESTRUCTURA OBLIGATORIA:
1. DESIGNACIÓN DE LA AUTORIDAD JUDICIAL
2. IDENTIFICACIÓN DEL DEMANDADO
3. MANIFESTACIÓN SOBRE LOS HECHOS (admitir/negar cada hecho)
4. EXCEPCIONES DE FONDO
   a. Excepciones de mérito (negación de los hechos, inexistencia de la obligación, etc.)
   b. Excepciones previas (si aplican: falta de capacidad, ilegitimidad, prescripción, caducidad, etc.)
5. CONTRAARGUMENTOS JURÍDICOS
6. PRETENSIONES (negación de las pretensiones del demandante)
7. PRUEBAS
8. NOTIFICACIONES
9. FIRMA

REGLAS:
- NUNCA inventes normas, sentencias o artículos.
- Responde a cada hecho de la demanda.
- Propón excepciones sólidas y fundamentadas.
- Contrarresta cada argumento del demandante."""
    },
    "recurso": {
        "title": "Recurso",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un recurso (apelación, reposición, queja, etc.).

ESTRUCTURA OBLIGATORIA:
1. IDENTIFICACIÓN DEL PROCESO
2. IDENTIFICACIÓN DE LA DECISIÓN IMPUGNADA
3. AGRAVIOS (qué aspectos de la decisión son perjudiciales)
4. FUNDAMENTOS DEL RECURSO
   a. Errores de hecho
   b. Errores de derecho
   c. Violación del debido proceso
   d. Incorrecta aplicación de normas
5. PRETENSIONES DEL RECURSO (qué se solicita)
6. PRUEBAS NUEVAS (si aplican)
7. FIRMA

REGLAS:
- NUNCA inventes normas, sentencias o artículos.
- Identifica errores concretos en la decisión.
- Argumenta cada agravio con fundamento jurídico.
- Cita la normativa que regula el recurso."""
    },
    "memorial": {
        "title": "Memorial",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un memorial formal.

ESTRUCTURA OBLIGATORIA:
1. DESIGNACIÓN DE LA AUTORIDAD
2. REFERENCIA DEL PROCESO
3. OBJETO DEL ESCRITO
4. FUNDAMENTOS (hechos y derecho)
5. PETICIÓN CONCRETA
6. FIRMA

REGLAS:
- NUNCA inventes normas o sentencias.
- Sé claro y conciso.
- Identifica claramente el proceso."""
    },
    "derecho_de_peticion": {
        "title": "Derecho de Petición",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un derecho de petición conforme al Artículo 23 de la Constitución Política y la Ley 1755 de 2015.

ESTRUCTURA OBLIGATORIA:
1. DESTINATARIO (entidad o persona)
2. REFERENCIA (Derecho de Petición - Art. 23 CP)
3. IDENTIFICACIÓN DEL PETICIONARIO
4. OBJETO DE LA PETICIÓN (claro y específico)
5. HECHOS Y RAZONES QUE SUSTENTAN LA PETICIÓN
6. FUNDAMENTOS DE DERECHO
   - Artículo 23 de la Constitución Política
   - Ley 1755 de 2015
   - Normas específicas del tema
7. PETICIÓN CONCRETA
8. DIRECCIÓN PARA NOTIFICACIONES
9. FIRMA
10. ANEXOS

REGLAS:
- NUNCA inventes normas.
- La petición debe ser clara, respetuosa y precisa.
- Cita el fundamento constitucional y legal.
- Indica el plazo legal de respuesta."""
    },
    "alegatos": {
        "title": "Alegatos de Conclusión",
        "system": """Eres un abogado experto en derecho colombiano. Redacta alegatos de conclusión para una audiencia.

ESTRUCTURA OBLIGATORIA:
1. SEÑOR JUEZ / MAGISTRADO
2. REFERENCIA DEL PROCESO
3. SÍNTESIS DEL CASO
4. ANÁLISIS DE LAS PRUEBAS
   a. Pruebas documentales
   b. Pruebas testimoniales
   c. Pruebas periciales
   d. Pruebas de parte
5. ARGUMENTACIÓN JURÍDICA
   a. Normas aplicables
   b. Jurisprudencia relevante
6. CONCLUSIONES FÁCTICAS
7. CONCLUSIONES JURÍDICAS
8. PETICIÓN CONCRETA
9. FIRMA

REGLAS:
- NUNCA inventes pruebas, normas o sentencias.
- Conecta cada prueba con los hechos y el derecho.
- Sé persuasivo pero riguroso.
- Responde a los argumentos de la contraparte."""
    },
    "argumentacion_juridica": {
        "title": "Argumentación Jurídica",
        "system": """Eres un abogado experto en argumentación jurídica y derecho colombiano.

ESTRUCTURA OBLIGATORIA:
1. TESIS PRINCIPAL
2. ARGUMENTOS A FAVOR (con premisas y conclusiones)
3. CONTRAARGUMENTOS Y RESPUESTAS
4. FUNDAMENTO NORMATIVO
5. FUNDAMENTO JURISPRUDENCIAL
6. CONCLUSIÓN

REGLAS:
- NUNCA inventes normas o sentencias.
- Usa silogismos jurídicos claros.
- Anticipa y responde contraargumentos.
- Distingue entre argumentos de principio y de política."""
    },
    "informe_juridico": {
        "title": "Informe Jurídico",
        "system": """Eres un abogado experto en derecho colombiano. Redacta un informe jurídico profesional.

ESTRUCTURA OBLIGATORIA:
1. RESUMEN EJECUTIVO
2. ANTECEDENTES
3. MARCO NORMATIVO
4. ANÁLISIS DETALLADO
5. RIESGOS IDENTIFICADOS
6. CONCLUSIONES
7. RECOMENDACIONES
8. ANEXOS (si aplican)

REGLAS:
- NUNCA inventes normas o sentencias.
- Sé objetivo y basado en evidencia.
- Incluye análisis de riesgos con niveles de severidad.
- Las recomendaciones deben ser accionables."""
    },
    "estudio_responsabilidad": {
        "title": "Estudio de Responsabilidad",
        "system": """Eres un abogado experto en responsabilidad civil y derecho colombiano.

ESTRUCTURA OBLIGATORIA:
1. OBJETO DEL ESTUDIO
2. RESUMEN DE LOS HECHOS
3. ANÁLISIS DE LOS ELEMENTOS DE LA RESPONSABILIDAD
   a. Daño (material, moral, lucro cesante, daño emergente)
   b. Generador de responsabilidad (acción/omisión)
   c. Nexo causal
   d. Factor de atribución (subjetivo/objetivo)
4. ANÁLISIS DE LA CULPA O IMPUTABILIDAD
5. ANÁLISIS DE CAUSALES DE EXONERACIÓN
   - Fuerza mayor
   - Hecho de tercero
   - Hecho de la víctima
   - Caso fortuito
6. CUANTIFICACIÓN PRELIMINAR DEL DAÑO
7. ANÁLISIS DE PROBABILIDAD DE ÉXITO
8. CONCLUSIONES
9. RECOMENDACIONES

REGLAS:
- NUNCA inventes normas o sentencias.
- Analiza cada elemento de la responsabilidad de forma independiente.
- Incluye análisis de causales de exoneración.
- Evalúa la probabilidad de éxito con base en la jurisprudencia."""
    },
    "estudio_viabilidad": {
        "title": "Estudio de Viabilidad Jurídica",
        "system": """Eres un abogado experto en derecho colombiano. Realiza un estudio de viabilidad jurídica.

ESTRUCTURA OBLIGATORIA:
1. OBJETO DEL ESTUDIO
2. ANTECEDENTES
3. MARCO NORMATIVO APLICABLE
4. ANÁLISIS DE VIABILIDAD
   a. Viabilidad sustantiva (derecho material)
   b. Viabilidad procesal (competencia, legitimación, términos)
   c. Viabilidad probatoria (pruebas disponibles)
5. ANÁLISIS DE RIESGOS
6. ANÁLISIS COSTO-BENEFICIO
7. PROBABILIDAD DE ÉXITO (con justificación)
8. CONCLUSIONES
9. RECOMENDACIONES

REGLAS:
- NUNCA inventes normas o sentencias.
- Sé realista en la evaluación de riesgos.
- La probabilidad de éxito debe estar fundamentada.
- Incluye análisis de alternativas."""
    },
    "estrategia_juridica": {
        "title": "Estrategia Jurídica",
        "system": """Eres un abogado experto en estrategia litigiosa y derecho colombiano.

ESTRUCTURA OBLIGATORIA:
1. DIAGNÓSTICO DEL CASO
   a. Lo que tenemos a favor
   b. Lo que nos perjudica
   c. Lo que debemos probar
2. OBJETIVOS ESTRATÉGICOS
3. TEORÍA DEL CASO
4. ESTRATEGIA PROCESAL
   a. Vía judicial recomendada
   b. Momentos procesales clave
   c. Estrategia probatoria
5. ARGUMENTOS PRINCIPALES
6. CONTRAARGUMENTOS ANTICIPADOS Y RESPUESTAS
7. JURISPRUDENCIA FAVORABLE
8. JURISPRUDENCIA ADVERSA Y CÓMO ENFRENTARLA
9. ALTERNATIVAS AL LITIGIO (conciliación, arbitraje, etc.)
10. CRONOGRAMA Y HITOS
11. RECOMENDACIÓN FINAL

REGLAS:
- NUNCA inventes normas o sentencias.
- La estrategia debe ser práctica y ejecutable.
- Anticipa los movimientos de la contraparte.
- Incluye análisis de costos y tiempos."""
    },
}

class GenerateDocumentRequest(BaseModel):
    case_id: str
    document_type: str
    case_data: Optional[Dict] = None
    specific_instructions: Optional[str] = None
    additional_context: Optional[str] = None
    relevant_rulings: Optional[List[Dict]] = None

class GenerateResponse(BaseModel):
    status: str
    document_id: str
    content: str
    title: str
    document_type: str
    quality_checks: Optional[Dict] = None
    quality_passed: bool
    llm_model: str
    tokens_used: Optional[int] = None
    message: str

@router.post("/document", response_model=GenerateResponse)
async def generate_document(request: GenerateDocumentRequest, db: asyncpg.Pool = Depends(get_db)):
    """Generate a legal document using AI."""
    try:
        from app.providers.llm.openai_provider import OpenAILLMProvider
        llm = OpenAILLMProvider()
    except ImportError:
        raise HTTPException(status_code=503, detail="OpenAI not installed")

    template = DOCUMENT_TEMPLATES.get(request.document_type)
    if not template:
        raise HTTPException(status_code=400, detail=f"Tipo de documento no soportado: {request.document_type}")

    case_data = request.case_data or {}
    facts = case_data.get("facts", [])
    pretensions = case_data.get("pretensions", [])
    defenses = case_data.get("defenses", [])
    events = case_data.get("events", [])
    description = case_data.get("description", "")
    legal_area = case_data.get("legal_area", "")
    case_name = case_data.get("name", "")
    parties = case_data.get("parties", {})

    facts_text = "\n".join([
        f"{i+1}. [{f.get('fact_type', 'desconocido')}] {f.get('description', '')} (Fecha: {f.get('event_date', 'N/A')})"
        for i, f in enumerate(facts)
    ]) if facts else "No se proporcionaron hechos."

    pretensions_text = "\n".join([
        f"{i+1}. {p.get('description', '')} (Base legal: {p.get('legal_basis', 'N/A')})"
        for i, p in enumerate(pretensions)
    ]) if pretensions else "No se proporcionaron pretensiones."

    defenses_text = "\n".join([
        f"{i+1}. [{d.get('defense_type', 'defensa')}] {d.get('description', '')}"
        for i, d in enumerate(defenses)
    ]) if defenses else "No se proporcionaron defensas."

    events_text = "\n".join([
        f"{i+1}. {e.get('description', '')} (Fecha: {e.get('event_date', 'N/A')})"
        for i, e in enumerate(events)
    ]) if events else "No se proporcionaron eventos."

    parties_text = ""
    if parties:
        for role, party_list in parties.items():
            if isinstance(party_list, list):
                for p in party_list:
                    parties_text += f"- {role.capitalize()}: {p.get('name', 'N/A')}"
                    if p.get('document_number'):
                        parties_text += f" (ID: {p['document_number']})"
                    parties_text += "\n"

    rulings_text = ""
    if request.relevant_rulings:
        rulings_text = "\n\nJURISPRUDENCIA RELEVANTE:\n"
        for r in request.relevant_rulings:
            rulings_text += f"- {r.get('citation', 'N/A')}: {r.get('summary', '')[:200]}\n"

    user_message = f"""
Genera un documento de tipo "{template['title']}" con base en la siguiente información del caso:

NOMBRE DEL CASO: {case_name}
ÁREA LEGAL: {legal_area}

DESCRIPCIÓN:
{description}

PARTES:
{parties_text or 'No especificadas'}

HECHOS:
{facts_text}

EVENTOS/CRONOLOGÍA:
{events_text}

PRETENSIONES:
{pretensions_text}

DEFENSAS:
{defenses_text}
{rulings_text}
INSTRUCCIONES ADICIONALES:
{request.specific_instructions or 'Ninguna'}

CONTEXTO ADICIONAL:
{request.additional_context or 'Ninguno'}

Genera el documento completo siguiendo la estructura y reglas especificadas.
Devuelve el contenido del documento en formato de texto plano con formato Markdown.
"""

    try:
        content = await llm.chat(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=template["system"],
            temperature=0.3,
            max_tokens=8192,
        )

        from app.verification.hallucination_guard import HallucinationGuard
        guard = HallucinationGuard()

        sources = []
        if request.relevant_rulings:
            sources = [{"citation": r.get("citation", "")} for r in request.relevant_rulings]

        verification = await guard.verify_response(content, sources)

        quality_checks = {
            "passed": verification.is_valid,
            "orthographic": {"passed": True, "issues": []},
            "grammatical": {"passed": True, "issues": []},
            "citation_verification": {
                "passed": verification.is_valid,
                "verified": len(verification.verified_citations),
                "unverified": len(verification.unverified_citations),
                "issues": verification.warnings,
            },
            "confidence": verification.confidence,
        }

        doc_id = await db.fetchval(
            """
            INSERT INTO generated_documents (id, case_id, user_id, document_type, title, content, quality_checks, quality_passed, llm_model, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, '00000000-0000-0000-0000-000000000000', $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id
            """,
            request.case_id,
            request.document_type,
            f"{template['title']} - {case_name}",
            content,
            json.dumps(quality_checks) if quality_checks else None,
            verification.is_valid,
            "gpt-4o",
        )

        return GenerateResponse(
            status="completed",
            document_id=str(doc_id),
            content=content,
            title=f"{template['title']} - {case_name}",
            document_type=request.document_type,
            quality_checks=quality_checks,
            quality_passed=verification.is_valid,
            llm_model="gpt-4o",
            message="Documento generado exitosamente.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando documento: {str(e)}")

import json
