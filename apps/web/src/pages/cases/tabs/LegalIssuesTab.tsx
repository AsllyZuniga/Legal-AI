import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, Scale, Star } from 'lucide-react';

export default function LegalIssuesTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', issueType: 'secondary', legalQuestion: '', description: '', partyPosition: '', opposingPosition: '', isPrimary: false });

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getLegalIssues(caseId); setIssues(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await caseService.updateLegalIssue(caseId, editingId, form);
      else await caseService.addLegalIssue(caseId, form);
      setShowForm(false); setEditingId(null);
      setForm({ title: '', issueType: 'secondary', legalQuestion: '', description: '', partyPosition: '', opposingPosition: '', isPrimary: false });
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar?')) return;
    try { await caseService.deleteLegalIssue(caseId, id); load(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Problemas Juridicos</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Titulo *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo</label>
              <select value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="primary">Principal</option>
                <option value="secondary">Secundario</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="primary" checked={form.isPrimary} onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} className="rounded" />
              <label htmlFor="primary" className="text-xs font-medium">Es problema principal</label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Pregunta juridica</label>
              <textarea value={form.legalQuestion} onChange={(e) => setForm({ ...form, legalQuestion: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Descripcion</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Posicion de nuestra parte</label>
              <textarea value={form.partyPosition} onChange={(e) => setForm({ ...form, partyPosition: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Posicion de la contraparte</label>
              <textarea value={form.opposingPosition} onChange={(e) => setForm({ ...form, opposingPosition: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-16 resize-none" />
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
      ) : issues.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><Scale className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay problemas juridicos registrados</p></div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="p-4 bg-card rounded-lg border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {issue.is_primary && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    <h3 className="text-sm font-semibold">{issue.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted">{issue.issue_type}</span>
                  </div>
                  {issue.legal_question && <p className="text-xs text-muted-foreground mb-1"><strong>Pregunta:</strong> {issue.legal_question}</p>}
                  {issue.description && <p className="text-xs text-muted-foreground mb-1">{issue.description}</p>}
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    {issue.party_position && <div className="p-2 bg-green-50 rounded"><strong className="text-green-700">Nuestra parte:</strong> {issue.party_position}</div>}
                    {issue.opposing_position && <div className="p-2 bg-red-50 rounded"><strong className="text-red-700">Contraparte:</strong> {issue.opposing_position}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => { setForm({ title: issue.title, issueType: issue.issue_type, legalQuestion: issue.legal_question || '', description: issue.description || '', partyPosition: issue.party_position || '', opposingPosition: issue.opposing_position || '', isPrimary: issue.is_primary }); setEditingId(issue.id); setShowForm(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(issue.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
