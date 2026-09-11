import { useState } from 'react';
import api from '../../../services/api';
import { Brain, Loader2, Send, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const quickQuestions = [
  'Cual es el problema juridico principal?',
  'Cuales son las fortalezas del caso?',
  'Cuales son las debilidades?',
  'Que hechos necesitan mayor soporte probatorio?',
  'Que argumentos podria utilizar la contraparte?',
  'Que riesgos juridicos existen?',
  'Que normas son relevantes?',
  'Que jurisprudencia puede servir?',
  'Que deberia probar primero?',
];

export default function AnalysisTab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleAnalyze = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/analysis/analyze', { caseId, question: query, analysisType: 'case_analysis' });
      setResult(res.data.result || res.data.output || JSON.stringify(res.data));
    } catch {
      setResult('Error al realizar el analisis. Intente nuevamente.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Analisis Juridico</h2>
      </div>

      <div className="bg-card rounded-lg border p-4 space-y-3">
        <p className="text-sm text-muted-foreground">La IA analizara el contexto completo del caso (hechos, documentos, pruebas, normativa, jurisprudencia) para responder tus preguntas.</p>
        <div className="flex gap-2">
          <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()} placeholder="Escribe tu pregunta juridica..." className="flex-1 px-3 py-2 border rounded-md bg-background text-sm" />
          <button onClick={() => handleAnalyze()} disabled={loading || !question.trim()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q) => (
            <button key={q} onClick={() => { setQuestion(q); handleAnalyze(q); }} className="px-2 py-1 text-xs border rounded-md hover:bg-muted transition-colors">{q}</button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-card rounded-lg border p-6 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Analizando el caso...</span>
        </div>
      )}

      {result && !loading && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">Este analisis es generado por IA como apoyo al analisis profesional. El abogado debe realizar la valoracion juridica final y verificar las fuentes citadas.</p>
          </div>
        </div>
      )}
    </div>
  );
}
