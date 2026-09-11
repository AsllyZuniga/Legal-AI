interface RulingData {
  id: string;
  citation: string;
  corporation?: string;
  chamber?: string;
  magistratePonent?: string;
  rulingDate?: Date | string;
  processType?: string;
  legalArea?: string;
  themes?: string[];
  summary?: string;
  resuelve?: string;
  fullText?: string;
  referencedNorms?: string[];
  sourceUrl?: string;
}

interface LawData {
  id: string;
  name: string;
  number?: string;
  year?: number;
  type?: string;
  subtipo?: string;
  sector?: string;
  entidad?: string;
  materia?: string;
  description?: string;
  vigencia?: string;
  sourceUrl?: string;
}

const CORP_NAMES: Record<string, string> = {
  corte_constitucional: 'Corte Constitucional de Colombia',
  corte_suprema: 'Corte Suprema de Justicia',
  consejo_estado: 'Consejo de Estado',
  cndj: 'Comisión Nacional de Disciplina Judicial',
};

const AREA_NAMES: Record<string, string> = {
  constitucional: 'Derecho Constitucional',
  civil: 'Derecho Civil',
  laboral: 'Derecho Laboral',
  familia: 'Derecho de Familia',
  penal: 'Derecho Penal',
  administrativo: 'Derecho Administrativo',
  contencioso_administrativo: 'Contencioso Administrativo',
  disciplinario: 'Derecho Disciplinario',
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return 'No disponible';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.substring(0, max).trim() + '...';
}

export function generateCitationResponse(ruling: RulingData, query: string): string {
  const corp = CORP_NAMES[ruling.corporation || ''] || ruling.corporation || 'N/A';
  const area = ruling.legalArea ? (AREA_NAMES[ruling.legalArea] || ruling.legalArea) : null;
  const themes = Array.isArray(ruling.themes) ? ruling.themes : [];
  const norms = Array.isArray(ruling.referencedNorms) ? ruling.referencedNorms : [];

  let resp = `## Sentencia ${ruling.citation}\n\n`;
  resp += `**Corporación:** ${corp}\n`;
  if (ruling.chamber) resp += `**Sala:** ${ruling.chamber}\n`;
  if (ruling.magistratePonent) resp += `**Magistrado Ponente:** ${ruling.magistratePonent}\n`;
  resp += `**Fecha:** ${formatDate(ruling.rulingDate)}\n`;
  if (ruling.processType) resp += `**Proceso:** ${ruling.processType}\n`;
  if (area) resp += `**Área:** ${area}\n`;

  resp += `\n---\n`;

  if (ruling.summary) {
    resp += `\n### Resumen\n\n${ruling.summary}\n`;
  }

  if (ruling.resuelve) {
    resp += `\n### Decisión\n\n${truncate(ruling.resuelve, 1500)}\n`;
  }

  if (themes.length > 0) {
    resp += `\n### Temas\n\n`;
    resp += themes.map(t => `- ${t}`).join('\n') + '\n';
  }

  if (norms.length > 0) {
    resp += `\n### Normas Citadas\n\n`;
    resp += norms.map(n => `- ${n}`).join('\n') + '\n';
  }

  resp += `\n---\n`;
  if (ruling.sourceUrl) {
    resp += `\n**Fuente:** [Ver sentencia original](${ruling.sourceUrl})\n`;
  }

  return resp;
}

export function generateTopicResponse(rulings: RulingData[], query: string): string {
  const count = rulings.length;
  let resp = `He encontrado **${count} sentencia${count > 1 ? 's' : ''}** relacionada${count > 1 ? 's' : ''} con **"${query}"**.\n\n`;

  const detailedCount = Math.min(count, 5);

  for (let i = 0; i < detailedCount; i++) {
    const r = rulings[i];
    const corp = CORP_NAMES[r.corporation || ''] || r.corporation || '';
    const themes = Array.isArray(r.themes) ? r.themes : [];

    resp += `### ${i + 1}. ${r.citation}\n\n`;
    if (r.magistratePonent || r.rulingDate) {
      resp += `*${r.magistratePonent || ''}${r.rulingDate ? ` — ${formatDate(r.rulingDate)}` : ''}*\n\n`;
    }
    if (corp) resp += `**Corporación:** ${corp}\n`;
    if (r.chamber) resp += `**Sala:** ${r.chamber}\n`;
    if (r.processType) resp += `**Proceso:** ${r.processType}\n`;

    if (r.summary) {
      resp += `\n${truncate(r.summary, 400)}\n`;
    } else if (r.resuelve) {
      resp += `\n${truncate(r.resuelve, 400)}\n`;
    } else if (r.fullText) {
      resp += `\n${truncate(r.fullText, 400)}\n`;
    }

    if (themes.length > 0) {
      resp += `\n**Temas:** ${themes.slice(0, 5).join(', ')}\n`;
    }

    if (r.sourceUrl) {
      resp += `\n[Ver sentencia original](${r.sourceUrl})\n`;
    }

    resp += `\n---\n\n`;
  }

  if (count > detailedCount) {
    resp += `### Otras ${count - detailedCount} sentencias encontradas:\n\n`;
    for (let i = detailedCount; i < count; i++) {
      const r = rulings[i];
      const date = r.rulingDate ? formatDate(r.rulingDate) : '';
      resp += `${i + 1}. **${r.citation}**${date ? ` — ${date}` : ''}\n`;
    }
    resp += `\n`;
  }

  resp += `Puedes pedirme más detalles sobre cualquier sentencia, su decisión, o el fundamento jurídico.\n`;
  return resp;
}

export function generateLawResponse(laws: LawData[], query: string): string {
  const count = laws.length;
  let resp = `He encontrado **${count} norma${count > 1 ? 's' : ''}** relacionada${count > 1 ? 's' : ''} con **"${query}"**.\n\n`;

  const detailedCount = Math.min(count, 5);

  for (let i = 0; i < detailedCount; i++) {
    const l = laws[i];
    resp += `### ${i + 1}. ${l.name}\n\n`;
    if (l.type) resp += `**Tipo:** ${l.type}\n`;
    if (l.year) resp += `**Año:** ${l.year}\n`;
    if (l.entidad) resp += `**Entidad:** ${l.entidad}\n`;
    if (l.materia) resp += `**Materia:** ${l.materia}\n`;
    if (l.vigencia) resp += `**Vigencia:** ${l.vigencia}\n`;
    if (l.description) resp += `\n${truncate(l.description, 400)}\n`;
    resp += `\n---\n\n`;
  }

  if (count > detailedCount) {
    resp += `### Otras ${count - detailedCount} normas encontradas:\n\n`;
    for (let i = detailedCount; i < count; i++) {
      const l = laws[i];
      resp += `${i + 1}. **${l.name}**${l.year ? ` (${l.year})` : ''}\n`;
    }
    resp += `\n`;
  }

  resp += `Puedes pedirme más detalles sobre alguna norma específica.\n`;
  return resp;
}

export function generateFollowUpResponse(
  previousContext: { rulings: RulingData[]; query: string },
  currentQuery: string
): string {
  const rulings = previousContext.rulings;
  if (rulings.length === 0) {
    return generateFallbackResponse(currentQuery);
  }

  const mainRuling = rulings[0];
  const corp = CORP_NAMES[mainRuling.corporation || ''] || mainRuling.corporation || 'N/A';

  let resp = `En relación con la consulta anterior sobre **${mainRuling.citation}**:\n\n`;

  if (currentQuery.match(/decisión|resuelve|fallo/i)) {
    resp += `### Decisión de la Sentencia ${mainRuling.citation}\n\n`;
    if (mainRuling.resuelve) {
      resp += `${mainRuling.resuelve}\n`;
    } else {
      resp += `No se dispone del texto completo del resuelve de esta sentencia.\n`;
    }
  } else if (currentQuery.match(/resumen|síntesis|explica/i)) {
    resp += `### Resumen de la Sentencia ${mainRuling.citation}\n\n`;
    if (mainRuling.summary) {
      resp += `${mainRuling.summary}\n`;
    } else {
      resp += `No se dispone de un resumen para esta sentencia.\n`;
    }
  } else if (currentQuery.match(/norma|ley|artículo|fundamento/i)) {
    const norms = Array.isArray(mainRuling.referencedNorms) ? mainRuling.referencedNorms : [];
    resp += `### Fundamento Normativo de la Sentencia ${mainRuling.citation}\n\n`;
    if (norms.length > 0) {
      resp += `Esta sentencia cita las siguientes normas:\n\n`;
      resp += norms.map(n => `- ${n}`).join('\n') + '\n';
    } else {
      resp += `No se dispone de las normas citadas en esta sentencia.\n`;
    }
  } else if (currentQuery.match(/tema|asunto|materia/i)) {
    const themes = Array.isArray(mainRuling.themes) ? mainRuling.themes : [];
    resp += `### Temas de la Sentencia ${mainRuling.citation}\n\n`;
    if (themes.length > 0) {
      resp += themes.map(t => `- ${t}`).join('\n') + '\n';
    } else {
      resp += `No se disponen de temas clasificados para esta sentencia.\n`;
    }
  } else {
    resp += `### Análisis de la Sentencia ${mainRuling.citation}\n\n`;
    resp += `**Corporación:** ${corp}\n`;
    if (mainRuling.chamber) resp += `**Sala:** ${mainRuling.chamber}\n`;
    if (mainRuling.magistratePonent) resp += `**Magistrado Ponente:** ${mainRuling.magistratePonent}\n`;
    resp += `**Fecha:** ${formatDate(mainRuling.rulingDate)}\n\n`;

    if (mainRuling.summary) {
      resp += `${mainRuling.summary}\n\n`;
    }
    if (mainRuling.resuelve) {
      resp += `**Decisión:** ${truncate(mainRuling.resuelve, 800)}\n`;
    }
  }

  resp += `\n---\n`;
  if (mainRuling.sourceUrl) {
    resp += `\n**Fuente:** [Ver sentencia original](${mainRuling.sourceUrl})\n`;
  }

  return resp;
}

export function generateFallbackResponse(query: string): string {
  let resp = `No he encontrado sentencias específicas para **"${query}"** en la base de datos.\n\n`;
  resp += `Puedo ayudarte con:\n\n`;
  resp += `- Buscar sentencias por **tema** (ej: "divorcio", "tutela", "accesibilidad")\n`;
  resp += `- Buscar una **sentencia específica** por su citación (ej: "T-226/26", "C-001/24")\n`;
  resp += `- Buscar **normas y leyes** (ej: "Código Civil", "Ley 1756")\n`;
  resp += `- Analizar una sentencia que ya hayas encontrado\n\n`;
  resp += `Intenta con términos más específicos o el nombre de una sentencia concreta.\n`;
  return resp;
}

export function extractConversationTitle(query: string): string {
  const citationMatch = query.match(/([TC]-\d+\/\d+|SC-\d+-\d+)/i);
  if (citationMatch) return `Sentencia ${citationMatch[1]}`;

  const cleaned = query.replace(/[¿?¡!.,]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  const topic = words.slice(0, 4).join(' ');

  if (topic.length > 30) return topic.substring(0, 30) + '...';
  return topic || 'Nueva conversación';
}
