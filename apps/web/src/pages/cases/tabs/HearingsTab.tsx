import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, CalendarDays, MapPin } from 'lucide-react';

export default function HearingsTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ hearingType: '', title: '', description: '', scheduledAt: '', location: '', status: 'scheduled', notes: '' });

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getHearings(caseId); setHearings(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) await caseService.updateHearing(caseId, editingId, form);
      else await caseService.addHearing(caseId, form);
      setShowForm(false); setEditingId(null);
      setForm({ hearingType: '', title: '', description: '', scheduledAt: '', location: '', status: 'scheduled', notes: '' });
      load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar audiencia?')) return;
    try { await caseService.deleteHearing(caseId, id); load(); } catch {}
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', postponed: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Audiencias</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de audiencia</label>
              <select value={form.hearingType} onChange={(e) => setForm({ ...form, hearingType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="">Seleccionar</option>
                <option value="inicial">Audiencia Inicial</option>
                <option value="preparatoria">Audiencia Preparatoria</option>
                <option value="juicio">Audiencia de Juicio</option>
                <option value="apelacion">Audiencia de Apelacion</option>
                <option value="conciliacion">Audiencia de Conciliacion</option>
                <option value="otra">Otra</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Estado</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="scheduled">Programada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="postponed">Postergada</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Titulo *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha y hora</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Lugar</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
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
      ) : hearings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay audiencias registradas</p></div>
      ) : (
        <div className="space-y-2">
          {hearings.map((h) => (
            <div key={h.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[h.status] || statusColors.scheduled}`}>{h.status}</span>
                  {h.hearing_type && <span className="text-xs text-muted-foreground">{h.hearing_type}</span>}
                </div>
                <p className="text-sm font-medium">{h.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {h.scheduled_at && <span>{new Date(h.scheduled_at).toLocaleString('es-CO')}</span>}
                  {h.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.location}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setForm({ hearingType: h.hearing_type, title: h.title, description: h.description || '', scheduledAt: h.scheduled_at?.substring(0, 16) || '', location: h.location || '', status: h.status, notes: h.notes || '' }); setEditingId(h.id); setShowForm(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(h.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
