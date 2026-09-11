import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, Users, Clock, CheckSquare, CalendarDays, Shield } from 'lucide-react';

export default function SummaryTab({ caseData }: { caseId: string; caseData: any }) {
  const stats = [
    { label: 'Hechos', value: caseData._count?.caseFacts || 0, icon: Scale, color: 'text-blue-600' },
    { label: 'Documentos', value: caseData._count?.userDocuments || 0, icon: FileText, color: 'text-green-600' },
    { label: 'Pruebas', value: caseData._count?.caseEvidence || 0, icon: Shield, color: 'text-purple-600' },
    { label: 'Personas', value: caseData._count?.casePersons || 0, icon: Users, color: 'text-orange-600' },
    { label: 'Alertas', value: caseData._count?.caseAlerts || 0, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Tareas', value: caseData._count?.caseTasks || 0, icon: CheckSquare, color: 'text-yellow-600' },
    { label: 'Audiencias', value: caseData._count?.caseHearings || 0, icon: CalendarDays, color: 'text-indigo-600' },
    { label: 'Problemas Juridicos', value: caseData._count?.caseLegalIssues || 0, icon: Scale, color: 'text-teal-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Informacion del Caso</h3>
          <div className="space-y-2 text-sm">
            {caseData.client && <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span>{caseData.client}</span></div>}
            {caseData.court && <div className="flex justify-between"><span className="text-muted-foreground">Juzgado:</span><span>{caseData.court}</span></div>}
            {caseData.file_number && <div className="flex justify-between"><span className="text-muted-foreground">Radicado:</span><span>{caseData.file_number}</span></div>}
            {caseData.responsible_lawyer && <div className="flex justify-between"><span className="text-muted-foreground">Abogado:</span><span>{caseData.responsible_lawyer}</span></div>}
            {caseData.opposing_party && <div className="flex justify-between"><span className="text-muted-foreground">Contraparte:</span><span>{caseData.opposing_party}</span></div>}
            {caseData.start_date && <div className="flex justify-between"><span className="text-muted-foreground">Inicio:</span><span>{new Date(caseData.start_date).toLocaleDateString('es-CO')}</span></div>}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Actividad Reciente</h3>
          {caseData.case_alerts?.filter((a: any) => !a.is_acknowledged).slice(0, 3).length > 0 ? (
            <div className="space-y-2">
              {caseData.case_alerts?.filter((a: any) => !a.is_acknowledged).slice(0, 3).map((alert: any) => (
                <div key={alert.id} className={`p-2 rounded-md text-xs border-l-3 ${alert.priority === 'high' ? 'border-red-500 bg-red-50' : alert.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-muted-foreground mt-0.5">{alert.description?.substring(0, 80)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin alertas activas</p>
          )}
        </div>
      </div>

      {caseData.case_tasks?.filter((t: any) => !t.is_completed).length > 0 && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-3">Proximas Tareas</h3>
          <div className="space-y-2">
            {caseData.case_tasks?.filter((t: any) => !t.is_completed).slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                <span>{task.description}</span>
                {task.due_date && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(task.due_date).toLocaleDateString('es-CO')}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {caseData.legal_problem_description && (
        <div className="bg-card rounded-lg border p-4">
          <h3 className="font-semibold text-sm mb-2">Problema Juridico</h3>
          <p className="text-sm text-muted-foreground">{caseData.legal_problem_description}</p>
        </div>
      )}
    </div>
  );
}
