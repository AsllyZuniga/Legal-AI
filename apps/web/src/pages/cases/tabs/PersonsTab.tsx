import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Edit2, Loader2, Users } from 'lucide-react';

const personTypes = [
  { value: 'client', label: 'Cliente' }, { value: 'plaintiff', label: 'Demandante' },
  { value: 'defendant', label: 'Demandado' }, { value: 'attorney', label: 'Apoderado' },
  { value: 'witness', label: 'Testigo' }, { value: 'expert', label: 'Perito' },
  { value: 'judge', label: 'Juez' }, { value: 'entity', label: 'Entidad' },
  { value: 'other', label: 'Tercero' },
];

export default function PersonsTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ personType: 'client', fullName: '', documentType: '', documentNumber: '', email: '', phone: '', address: '', role: '', notes: '' });

  useEffect(() => { loadPersons(); }, [caseId]);

  const loadPersons = async () => {
    try { const res = await caseService.getPersons(caseId); setPersons(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await caseService.updatePerson(caseId, editingId, form);
      } else {
        await caseService.addPerson(caseId, form);
      }
      setShowForm(false); setEditingId(null);
      setForm({ personType: 'client', fullName: '', documentType: '', documentNumber: '', email: '', phone: '', address: '', role: '', notes: '' });
      loadPersons();
    } catch {}
  };

  const handleEdit = (p: any) => {
    setForm({ personType: p.person_type, fullName: p.full_name, documentType: p.document_type || '', documentNumber: p.document_number || '', email: p.email || '', phone: p.phone || '', address: p.address || '', role: p.role || '', notes: p.notes || '' });
    setEditingId(p.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta persona?')) return;
    try { await caseService.deletePerson(caseId, id); loadPersons(); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Personas Involucradas</h2>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ personType: 'client', fullName: '', documentType: '', documentNumber: '', email: '', phone: '', address: '', role: '', notes: '' }); }} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo *</label>
              <select value={form.personType} onChange={(e) => setForm({ ...form, personType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                {personTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nombre completo *</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo documento</label>
              <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="">Seleccionar</option>
                <option value="cc">Cedula de Ciudadania</option>
                <option value="nit">NIT</option>
                <option value="ce">Cedula de Extranjeria</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Numero de documento</label>
              <input type="text" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Telefono</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Direccion</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Rol</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
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
      ) : persons.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><Users className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay personas registradas</p></div>
      ) : (
        <div className="space-y-2">
          {persons.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{personTypes.find((t) => t.value === p.person_type)?.label}</span>
                <div>
                  <p className="text-sm font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">{[p.document_type && `${p.document_type}: ${p.document_number}`, p.email, p.phone].filter(Boolean).join(' | ') || 'Sin datos de contacto'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(p)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
