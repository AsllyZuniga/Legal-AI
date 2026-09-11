import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, List, Brain, CheckCircle, AlertCircle } from 'lucide-react';

export default function FactsTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [facts, setFacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [form, setForm] = useState({ description: '', eventDate: '', factType: 'user_reported', isJuridicallyRelevant: false, verificationStatus: 'unverified' });

  useEffect(() => { loadFacts(); }, [caseId]);

  const loadFacts = async () => {
    try { const res = await caseService.getFacts(caseId); setFacts(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await caseService.updateFact(caseId, editingId, form);
      } else {
        await caseService.addFact(caseId, form);
      }
      setShowForm(false); setEditingId(null);
      setForm({ description: '', eventDate: '', factType: 'user_reported', isJuridicallyRelevant: false, verificationStatus: 'unverified' });
      loadFacts();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este hecho?')) return;
    try { await caseService.deleteFact(caseId, id); loadFacts(); } catch {}
  };

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    setAiAnalysis({
      relevant: facts.filter((f) => f.is_juridically_relevant).length,
      needEvidence: facts.filter((f) => f.verification_status === 'unverified').length,
      favorable: facts.filter((f) => f.metadata?.favorable).length,
      unfavorable: facts.filter((f) => f.metadata?.unfavorable).length,
      contradictions: [],
    });
    setTimeout(() => setAnalyzing(false), 1000);
  };

  const verificationColors: Record<string, string> = {
    verified: 'bg-green-100 text-green-700',
    unverified: 'bg-yellow-100 text-yellow-700',
    contradicted: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hechos del Caso</h2>
        <div className="flex gap-2">
          <button onClick={handleAIAnalysis} disabled={analyzing || facts.length === 0} className="flex items-center gap-1 px-3 py-1.5 border rounded-md text-sm hover:bg-muted disabled:opacity-50">
            <Brain className="h-3.5 w-3.5" /> {analyzing ? 'Analizando...' : 'Analizar con IA'}
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-card rounded-lg border p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Analisis de IA</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-green-50 rounded"><span className="font-medium text-green-700">{aiAnalysis.relevant}</span> hechos relevantes</div>
            <div className="p-2 bg-yellow-50 rounded"><span className="font-medium text-yellow-700">{aiAnalysis.needEvidence}</span> necesitan prueba</div>
            <div className="p-2 bg-blue-50 rounded"><span className="font-medium text-blue-700">{aiAnalysis.favorable}</span> favorables</div>
            <div className="p-2 bg-red-50 rounded"><span className="font-medium text-red-700">{aiAnalysis.unfavorable}</span> desfavorables</div>
          </div>
          <p className="text-xs text-muted-foreground">Nota: Este analisis es orientativo. El abogado debe realizar la valoracion juridica final.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Descripcion del hecho *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha del hecho</label>
              <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de fuente</label>
              <select value={form.factType} onChange={(e) => setForm({ ...form, factType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="user_reported">Reportado por usuario</option>
                <option value="documented">Documentado</option>
                <option value="ai_extracted">Extraido por IA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Estado de verificacion</label>
              <select value={form.verificationStatus} onChange={(e) => setForm({ ...form, verificationStatus: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="unverified">Sin verificar</option>
                <option value="verified">Verificado</option>
                <option value="contradicted">Contradicho</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="relevant" checked={form.isJuridicallyRelevant} onChange={(e) => setForm({ ...form, isJuridicallyRelevant: e.target.checked })} className="rounded" />
              <label htmlFor="relevant" className="text-xs font-medium">Juridicamente relevante</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">{editingId ? 'Actualizar' : 'Agregar'}</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : facts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><List className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay hechos registrados</p></div>
      ) : (
        <div className="space-y-2">
          {facts.map((f, i) => (
            <div key={f.id} className="p-3 bg-card rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">#{i + 1}</span>
                    {f.event_date && <span className="text-xs text-muted-foreground">{new Date(f.event_date).toLocaleDateString('es-CO')}</span>}
                    <span className={`px-1.5 py-0.5 rounded text-xs ${verificationColors[f.verification_status] || verificationColors.unverified}`}>{f.verification_status}</span>
                    {f.is_juridically_relevant && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
                  </div>
                  <p className="text-sm">{f.description}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => { setForm({ description: f.description, eventDate: f.event_date?.substring(0, 10) || '', factType: f.fact_type, isJuridicallyRelevant: f.is_juridically_relevant, verificationStatus: f.verification_status }); setEditingId(f.id); setShowForm(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(f.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
