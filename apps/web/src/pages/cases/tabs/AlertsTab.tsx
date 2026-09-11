import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import { Loader2, AlertTriangle, Check, Bell } from 'lucide-react';

export default function AlertsTab({ caseId }: { caseId: string; caseData: any; reload: () => void }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getAlerts(caseId); setAlerts(res.data); } catch {}
    setLoading(false);
  };

  const acknowledge = async (alert: any) => {
    try { await caseService.updateAlert(caseId, alert.id, { isAcknowledged: true }); load(); } catch {}
  };

  const priorityConfig: Record<string, { border: string; bg: string; icon: string; label: string }> = {
    high: { border: 'border-red-500', bg: 'bg-red-50', icon: 'text-red-500', label: 'Alta' },
    medium: { border: 'border-yellow-500', bg: 'bg-yellow-50', icon: 'text-yellow-500', label: 'Media' },
    low: { border: 'border-blue-500', bg: 'bg-blue-50', icon: 'text-blue-500', label: 'Baja' },
  };

  const typeLabels: Record<string, string> = {
    deadline: 'Vencimiento de termino', missing_document: 'Documento faltante', missing_evidence: 'Prueba faltante',
    contradiction: 'Contradiccion', missing_info: 'Informacion faltante', date_inconsistency: 'Inconsistencia en fechas',
    outdated: 'Documento desactualizado', new_version: 'Nueva version disponible', general: 'General',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Alertas Inteligentes</h2>
        <span className="text-sm text-muted-foreground">{alerts.filter((a) => !a.is_acknowledged).length} alertas activas</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><Bell className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay alertas para este caso</p></div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const config = priorityConfig[alert.priority] || priorityConfig.medium;
            return (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${config.border} ${alert.is_acknowledged ? 'opacity-60' : ''} bg-card`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`h-4 w-4 ${config.icon}`} />
                      <span className="text-sm font-semibold">{alert.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.icon}`}>{config.label}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{typeLabels[alert.alert_type] || alert.alert_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    {alert.recommendation && <p className="text-xs text-primary mt-1"><strong>Recomendacion:</strong> {alert.recommendation}</p>}
                  </div>
                  {!alert.is_acknowledged && (
                    <button onClick={() => acknowledge(alert)} className="flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-muted ml-2">
                      <Check className="h-3 w-3" /> Marcar leida
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
