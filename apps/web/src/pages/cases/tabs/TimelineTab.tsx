import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, GitBranch, Calendar } from 'lucide-react';

export default function TimelineTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ description: '', eventDate: '' });

  useEffect(() => { loadEvents(); }, [caseId]);

  const loadEvents = async () => {
    try { const res = await caseService.getTimeline(caseId); setEvents(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await caseService.updateEvent(caseId, editingId, form);
      } else {
        await caseService.addEvent(caseId, form);
      }
      setShowForm(false); setEditingId(null);
      setForm({ description: '', eventDate: '' });
      loadEvents();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este evento?')) return;
    try { await caseService.deleteEvent(caseId, id); loadEvents(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Linea de Tiempo</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ description: '', eventDate: '' }); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="h-3.5 w-3.5" /> Agregar Evento
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Fecha *</label>
              <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Descripcion *</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
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
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><GitBranch className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay eventos en la linea de tiempo</p></div>
      ) : (
        <div className="relative pl-6 space-y-0">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
          {events.map((event, i) => (
            <div key={event.id} className="relative pb-4">
              <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              <div className="bg-card rounded-lg border p-3 ml-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-primary">{event.event_date ? new Date(event.event_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Sin fecha'}</span>
                    </div>
                    <p className="text-sm">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setForm({ description: event.description, eventDate: event.event_date?.substring(0, 10) || '' }); setEditingId(event.id); setShowForm(true); }} className="p-1 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(event.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
