import { useState } from 'react';
import api from '../../../services/api';
import { Target, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const strategyOptions = [
  { id: 'full', label: 'Analisis FODA completo', description: 'Fortalezas, Oportunidades, Debilidades, Riesgos' },
  { id: 'arguments', label: 'Lineas de argumentacion', description: 'Posibles argumentos propios y de la contraparte' },
  { id: 'evidence', label: 'Necesidades probatorias', description: 'Puntos que necesitan pruebas' },
  { id: 'alternatives', label: 'Alternativas juridicas', description: 'Caminos legales disponibles' },
  { id: 'procedural_risks', label: 'Riesgos procesales', description: 'Riesgos en el tramite del proceso' },
];

export default function StrategyTab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleAnalyze = async (optionId: string) => {
    setSelectedOption(optionId);
    setLoading(true);
    setResult('');
    try {
      const res = await api.post('/analysis/analyze', { caseId, analysisType: 'strategy', strategyOption: optionId });
      setResult(res.data.result || res.data.output || JSON.stringify(res.data));
    } catch {
      setResult('Error al generar la estrategia. Intente nuevamente.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Estrategia Juridica</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {strategyOptions.map((opt) => (
          <button key={opt.id} onClick={() => handleAnalyze(opt.id)} disabled={loading} className="p-4 bg-card rounded-lg border text-left hover:border-primary/50 transition-colors disabled:opacity-50">
            <h3 className="text-sm font-medium">{opt.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-card rounded-lg border p-6 flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Generando estrategia...</span>
        </div>
      )}

      {result && !loading && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">La IA funciona como asistente y apoyo al analisis profesional. No sustituye el criterio del abogado.</p>
          </div>
        </div>
      )}
    </div>
  );
}
