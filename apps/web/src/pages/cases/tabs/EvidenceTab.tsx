import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, Shield } from 'lucide-react';

const evidenceTypes = [
  { value: 'documental', label: 'Documental' }, { value: 'testimonial', label: 'Testimonial' },
  { value: 'pericial', label: 'Pericial' }, { value: 'photographic', label: 'Fotografica' },
  { value: 'digital', label: 'Digital' }, { value: 'other', label: 'Otra' },
];

export default function EvidenceTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ evidenceType: 'documental', title: '', description: '', status: 'pending', notes: '' });

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getEvidence(caseId); setEvidence(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await caseService.updateEvidence(caseId, editingId, form);
      else await caseService.addEvidence(caseId, form);
      setShowForm(false); setEditingId(null);
      setForm({ evidenceType: 'documental', title: '', description: '', status: 'pending', notes: '' });
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta prueba?')) return;
    try { await caseService.deleteEvidence(caseId, id); load(); } catch {}
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', attached: 'bg-green-100 text-green-700', missing: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Pruebas</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de prueba</label>
              <select value={form.evidenceType} onChange={(e) => setForm({ ...form, evidenceType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                {evidenceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="pending">Pendiente</option>
                <option value="attached">Agregada</option>
                <option value="missing">Faltante</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Titulo *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Descripcion</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Notas</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
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
      ) : evidence.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><Shield className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay pruebas registradas</p></div>
      ) : (
        <div className="space-y-2">
          {evidence.map((ev) => (
            <div key={ev.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">{evidenceTypes.find((t) => t.value === ev.evidence_type)?.label}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[ev.status] || statusColors.pending}`}>{ev.status}</span>
                </div>
                <p className="text-sm font-medium">{ev.title}</p>
                {ev.description && <p className="text-xs text-muted-foreground mt-0.5">{ev.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setForm({ evidenceType: ev.evidence_type, title: ev.title, description: ev.description || '', status: ev.status, notes: ev.notes || '' }); setEditingId(ev.id); setShowForm(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(ev.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
