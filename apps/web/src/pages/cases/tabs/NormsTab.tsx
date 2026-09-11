import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, Loader2, BookOpen } from 'lucide-react';

export default function NormsTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [norms, setNorms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reference: '', normType: '', description: '', relevance: '' });

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getNorms(caseId); setNorms(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await caseService.addNorm(caseId, form); setShowForm(false); setForm({ reference: '', normType: '', description: '', relevance: '' }); load(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Normativa</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Referencia *</label>
              <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: Ley 1564 de 2012, Art. 1" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de norma</label>
              <select value={form.normType} onChange={(e) => setForm({ ...form, normType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="">Seleccionar</option>
                <option value="ley">Ley</option>
                <option value="decreto">Decreto</option>
                <option value="resolucion">Resolucion</option>
                <option value="codigo">Codigo</option>
                <option value="constitucion">Constitucion</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Descripcion</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Relevancia para el caso</label>
              <textarea value={form.relevance} onChange={(e) => setForm({ ...form, relevance: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Agregar</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : norms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay normas registradas</p></div>
      ) : (
        <div className="space-y-2">
          {norms.map((n) => (
            <div key={n.id} className="p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-2 mb-1">
                {n.norm_type && <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{n.norm_type}</span>}
                <span className="text-sm font-medium">{n.reference}</span>
              </div>
              {n.description && <p className="text-xs text-muted-foreground">{n.description}</p>}
              {n.relevance && <p className="text-xs text-primary mt-1"><strong>Relevancia:</strong> {n.relevance}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
