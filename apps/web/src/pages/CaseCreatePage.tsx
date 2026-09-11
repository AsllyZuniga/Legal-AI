import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import { ArrowLeft, Plus, X, Loader2, Save } from 'lucide-react';

const legalAreas = [
  { value: 'civil', label: 'Civil' },
  { value: 'familia', label: 'Familia' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'penal', label: 'Penal' },
  { value: 'contencioso_administrativo', label: 'Contencioso Administrativo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'constitucional', label: 'Constitucional' },
];

const personTypes = [
  { value: 'client', label: 'Cliente' },
  { value: 'plaintiff', label: 'Demandante' },
  { value: 'defendant', label: 'Demandado' },
  { value: 'attorney', label: 'Apoderado' },
  { value: 'witness', label: 'Testigo' },
  { value: 'expert', label: 'Perito' },
  { value: 'judge', label: 'Juez' },
  { value: 'entity', label: 'Entidad' },
  { value: 'other', label: 'Tercero' },
];

export default function CaseCreatePage() {
  const navigate = useNavigate();
  const { createCase } = useCaseStore();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', description: '', legalArea: 'civil', subarea: '', processType: '',
    client: '', court: '', fileNumber: '', city: '', startDate: '',
    responsibleLawyer: '', opposingParty: '', pretensions: '', amount: '',
    priority: 'medium',
  });
  const [persons, setPersons] = useState<any[]>([]);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [personForm, setPersonForm] = useState({ personType: 'client', fullName: '', documentType: '', documentNumber: '', email: '', phone: '', role: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, amount: form.amount ? parseFloat(form.amount) : undefined };
      const result = await createCase(data);
      navigate(`/cases/${result.id}`);
    } catch {
      alert('Error al crear el caso');
    } finally {
      setSaving(false);
    }
  };

  const addPerson = () => {
    if (!personForm.fullName) return;
    setPersons([...persons, { ...personForm }]);
    setPersonForm({ personType: 'client', fullName: '', documentType: '', documentNumber: '', email: '', phone: '', role: '' });
    setShowPersonForm(false);
  };

  const removePerson = (index: number) => {
    setPersons(persons.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/cases" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Nuevo Caso</h1>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {[{ n: 1, label: 'Informacion General' }, { n: 2, label: 'Personas Involucradas' }].map((s) => (
          <button key={s.n} onClick={() => setStep(s.n)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${step === s.n ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="bg-card rounded-lg border p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Nombre del caso *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: Demanda de responsabilidad civil" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripcion</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" placeholder="Breve descripcion del caso" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Area del derecho</label>
                <select value={form.legalArea} onChange={(e) => setForm({ ...form, legalArea: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                  {legalAreas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de proceso</label>
                <input type="text" value={form.processType} onChange={(e) => setForm({ ...form, processType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: Ordinario, Verbal" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <input type="text" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Nombre del cliente" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraparte</label>
                <input type="text" value={form.opposingParty} onChange={(e) => setForm({ ...form, opposingParty: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Nombre de la contraparte" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Juzgado / Entidad</label>
                <input type="text" value={form.court} onChange={(e) => setForm({ ...form, court: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: Juzgado 12 Civil del Circuito" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Numero de radicado</label>
                <input type="text" value={form.fileNumber} onChange={(e) => setForm({ ...form, fileNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: 110013103012202500001" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ciudad</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Ej: Bogota" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de inicio</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Abogado responsable</label>
                <input type="text" value={form.responsibleLawyer} onChange={(e) => setForm({ ...form, responsibleLawyer: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="Nombre del abogado" />
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
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" placeholder="0.00" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Pretensiones</label>
                <textarea value={form.pretensions} onChange={(e) => setForm({ ...form, pretensions: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" placeholder="Pretensiones principales del caso" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setStep(2)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">Siguiente →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Personas Involucradas</h2>
              <button type="button" onClick={() => setShowPersonForm(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-muted">
                <Plus className="h-3.5 w-3.5" /> Agregar
              </button>
            </div>

            {showPersonForm && (
              <div className="p-4 border rounded-md space-y-3 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Tipo</label>
                    <select value={personForm.personType} onChange={(e) => setPersonForm({ ...personForm, personType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                      {personTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Nombre completo *</label>
                    <input type="text" value={personForm.fullName} onChange={(e) => setPersonForm({ ...personForm, fullName: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Tipo documento</label>
                    <select value={personForm.documentType} onChange={(e) => setPersonForm({ ...personForm, documentType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                      <option value="">Seleccionar</option>
                      <option value="cc">Cedula de Ciudadania</option>
                      <option value="nit">NIT</option>
                      <option value="ce">Cedula de Extranjeria</option>
                      <option value="pasaporte">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Numero de documento</label>
                    <input type="text" value={personForm.documentNumber} onChange={(e) => setPersonForm({ ...personForm, documentNumber: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Email</label>
                    <input type="email" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Telefono</label>
                    <input type="text" value={personForm.phone} onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={addPerson} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">Agregar</button>
                  <button type="button" onClick={() => setShowPersonForm(false)} className="px-3 py-1.5 border rounded-md text-sm">Cancelar</button>
                </div>
              </div>
            )}

            {persons.length > 0 && (
              <div className="space-y-2">
                {persons.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">{personTypes.find((t) => t.value === p.personType)?.label}</span>
                      <span className="ml-2 text-sm font-medium">{p.fullName}</span>
                      {p.documentNumber && <span className="ml-2 text-xs text-muted-foreground">{p.documentType}: {p.documentNumber}</span>}
                    </div>
                    <button type="button" onClick={() => removePerson(i)} className="text-muted-foreground hover:text-red-500"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}

            {persons.length === 0 && !showPersonForm && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay personas agregadas. Puedes agregarlas despues desde el detalle del caso.</p>
            )}

            <div className="flex justify-between pt-4 border-t">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 border rounded-md text-sm">← Anterior</button>
              <button type="submit" disabled={saving || !form.name} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Crear Caso
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
