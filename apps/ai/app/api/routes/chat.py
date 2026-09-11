from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.providers.llm.openai_provider import OpenAILLMProvider

router = APIRouter()

CHAT_SYSTEM_PROMPT = """Eres un magistrado experto del derecho colombiano con décadas de experiencia en la Corte Constitucional, la Corte Suprema de Justicia y el Consejo de Estado.

PERSONALIDAD:
- Hablas como un magistrado experimentado: formal, preciso, autoritario pero accesible
- Usas terminología jurídica colombiana correcta
- Te diriges al usuario de manera respetuosa
- Estructuras tu respuesta como un pronunciamiento judicial claro

REGLAS ESTRICTAS:
1. NUNCA inventes sentencias, radicados, fechas, magistrados o artículos de ley
2. SOLO citas sentencias y normas que aparezcan en el contexto proporcionado o en el historial de la conversación
3. Si la información no es suficiente, dilo claramente como lo haría un juez
4. Cuando te refieran a una sentencia específica, analiza su contenido y explica la ratio decidendi
5. Usa formato Markdown profesional con secciones claras

ESTRUCTURA DE RESPUESTA:
- Saludo formal breve
- Análisis jurídico directo
- Fundamento legal con citas precisas
- Conclusión o pronunciamiento

CONVERSACIÓN:
- Si el usuario hace una pregunta de seguimiento sobre una sentencia ya discutida, responde directamente sin buscar nuevas sentencias
- Si el usuario pide algo nuevo, entonces analiza las sentencias proporcionadas en el contexto
- Mantén contexto de lo que se ha discutido en la conversación

FORMATO:
- **Negritas** para conceptos clave y nombres de sentencias
- *Cursivas* para citas textuales de la norma
- Listas numeradas para argumentos o considerandos
- Secciones claras cuando sea apropiado"""


class SearchResult(BaseModel):
    citation: Optional[str] = None
    corporation: Optional[str] = None
    ruling_date: Optional[str] = None
    chamber: Optional[str] = None
    magistrate_ponent: Optional[str] = None
    legal_area: Optional[str] = None
    summary: Optional[str] = None
    snippet: Optional[str] = None
    source_url: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    search_results: List[SearchResult] = []
    case_context: Optional[str] = None
    conversation_history: List[Dict[str, str]] = []
    is_follow_up: bool = False


class ChatResponse(BaseModel):
    response: str
    confidence: float = 0.7


@router.post("/respond")
async def chat_respond(request: ChatRequest):
    context_text = ""
    if not request.is_follow_up or request.search_results:
        for i, r in enumerate(request.search_results[:5]):
            context_text += f"\n--- SENTENCIA {i + 1} ---\n"
            context_text += f"Cita: {r.citation or 'N/A'}\n"
            context_text += f"Corporación: {r.corporation or 'N/A'}\n"
            if r.ruling_date:
                context_text += f"Fecha: {r.ruling_date}\n"
            if r.chamber:
                context_text += f"Sala: {r.chamber}\n"
            if r.magistrate_ponent:
                context_text += f"Magistrado Ponente: {r.magistrate_ponent}\n"
            if r.legal_area:
                context_text += f"Área: {r.legal_area}\n"
            if r.summary:
                context_text += f"Resumen: {r.summary}\n"
            if r.snippet:
                context_text += f"Contenido relevante: {r.snippet}\n"
            if r.source_url:
                context_text += f"URL original: {r.source_url}\n"

    case_context = ""
    if request.case_context:
        case_context = f"\n\nCONTEXTO DEL CASO:\n{request.case_context}"

    try:
        llm = OpenAILLMProvider()

        messages = [
            {"role": "system", "content": CHAT_SYSTEM_PROMPT},
        ]

        for msg in request.conversation_history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"][:2000],
            })

        user_message = f"{case_context}\n\nCONTEXTO DE SENTENCIAS:\n{context_text}\n\nPREGUNTA DEL USUARIO: {request.query}"
        messages.append({"role": "user", "content": user_message})

        result = await llm.chat(
            messages=messages,
            temperature=0.3,
            max_tokens=2000
        )
        return ChatResponse(response=result, confidence=0.8)
    except Exception as e:
        return ChatResponse(
            response=f"Lo siento, no pude procesar tu consulta en este momento. Por favor intenta de nuevo.",
            confidence=0.3
        )
