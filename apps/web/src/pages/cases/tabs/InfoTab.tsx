import { useState } from 'react';
import { caseService } from '../../../services/caseService';
import { Save, Loader2 } from 'lucide-react';

const legalAreas = [
  { value: 'civil', label: 'Civil' }, { value: 'familia', label: 'Familia' },
  { value: 'laboral', label: 'Laboral' }, { value: 'penal', label: 'Penal' },
  { value: 'contencioso_administrativo', label: 'Contencioso Administrativo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'comercial', label: 'Comercial' }, { value: 'constitucional', label: 'Constitucional' },
];

export default function InfoTab({ caseId, caseData, reload }: { caseId: string; caseData: any; reload: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: caseData.name || '', description: caseData.description || '',
    legalArea: caseData.legal_area || 'civil', processType: caseData.process_type || '',
    client: caseData.client || '', court: caseData.court || '',
    fileNumber: caseData.file_number || '', city: caseData.city || '',
    startDate: caseData.start_date ? caseData.start_date.substring(0, 10) : '',
    responsibleLawyer: caseData.responsible_lawyer || '',
    opposingParty: caseData.opposing_party || '',
    pretensions: caseData.pretensions || '',
    amount: caseData.amount || '',
    priority: caseData.priority || 'medium',
    status: caseData.status || 'active',
    legalProblemDescription: caseData.legal_problem_description || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await caseService.update(caseId, { ...form, amount: form.amount ? parseFloat(form.amount) : undefined });
      reload();
    } catch {}
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Informacion del Caso</h2>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Nombre del caso</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Descripcion</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Area del derecho</label>
          <select value={form.legalArea} onChange={(e) => setForm({ ...form, legalArea: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            {legalAreas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipo de proceso</label>
          <input type="text" value={form.processType} onChange={(e) => setForm({ ...form, processType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cliente</label>
          <input type="text" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contraparte</label>
          <input type="text" value={form.opposingParty} onChange={(e) => setForm({ ...form, opposingParty: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Juzgado / Entidad</label>
          <input type="text" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Radicado</label>
          <input type="text" value={form.fileNumber} onChange={(e) => setForm({ ...form, fileNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ciudad</label>
          <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Abogado responsable</label>
          <input type="text" value={form.responsibleLawyer} onChange={(e) => setForm({ ...form, responsibleLawyer: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            <option value="active">Activo</option>
            <option value="archived">Archivado</option>
            <option value="closed">Cerrado</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prioridad</label>
          <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cuantia</label>
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Pretensiones</label>
          <textarea value={form.pretensions} onChange={(e) => setForm({ ...form, pretensions: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Problema Juridico</label>
          <textarea value={form.legalProblemDescription} onChange={(e) => setForm({ ...form, legalProblemDescription: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" />
        </div>
      </div>
    </div>
  );
}
