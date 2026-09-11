import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Plus, X, Loader2, CheckSquare, Check, Clock, AlertCircle } from 'lucide-react';

export default function TasksTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', taskType: 'action', priority: 'medium', dueDate: '' });

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getTasks(caseId); setTasks(res.data); } catch {}
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await caseService.addTask(caseId, form); setShowForm(false); setForm({ description: '', taskType: 'action', priority: 'medium', dueDate: '' }); load(); } catch {}
  };

  const toggleComplete = async (task: any) => {
    try { await caseService.updateTask(caseId, task.id, { isCompleted: !task.is_completed }); load(); } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar tarea?')) return;
    try { await caseService.deleteTask(caseId, id); load(); } catch {}
  };

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (diff < 0) return { text: `Vencido (${Math.abs(diff)}d)`, color: 'text-red-600 bg-red-50' };
    if (diff === 0) return { text: 'Hoy', color: 'text-red-600 bg-red-50' };
    if (diff <= 3) return { text: `${diff}d restantes`, color: 'text-orange-600 bg-orange-50' };
    if (diff <= 7) return { text: `${diff}d restantes`, color: 'text-yellow-600 bg-yellow-50' };
    return { text: `${diff}d restantes`, color: 'text-green-600 bg-green-50' };
  };

  const priorityColors: Record<string, string> = { high: 'border-red-300', medium: 'border-yellow-300', low: 'border-green-300' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tareas, Terminos y Pendientes</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Agregar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium mb-1">Descripcion *</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo</label>
              <select value={form.taskType} onChange={(e) => setForm({ ...form, taskType: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="action">Accion</option>
                <option value="deadline">Termino</option>
                <option value="hearing">Audiencia</option>
                <option value="notification">Notificacion</option>
                <option value="filing">Presentacion</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Prioridad</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Fecha limite</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
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
      ) : tasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay tareas registradas</p></div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const days = task.due_date ? getDaysUntil(task.due_date) : null;
            return (
              <div key={task.id} className={`flex items-center justify-between p-3 bg-card rounded-lg border-l-3 ${priorityColors[task.priority] || ''}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(task)} className={`w-5 h-5 rounded border-2 flex items-center justify-center ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-primary'}`}>
                    {task.is_completed && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <div>
                    <p className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>{task.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{task.task_type}</span>
                      {days && <span className={`text-xs px-1.5 py-0.5 rounded ${days.color}`}>{days.text}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(task.id)} className="p-1 rounded hover:bg-red-50"><X className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
