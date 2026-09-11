import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FolderOpen, MessageSquare, FileText, Scale, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ cases: 0, documents: 0, conversations: 0 });
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const casesRes = await api.get('/cases?limit=5');
        setRecentCases(casesRes.data.data || []);
        setStats({ cases: casesRes.data.total || 0, documents: 0, conversations: 0 });
      } catch {}
    };
    load();
  }, []);

  const quickActions = [
    { to: '/chat', icon: MessageSquare, label: 'Chat Jurídico', description: 'Consulta al asistente IA' },
    { to: '/cases', icon: FolderOpen, label: 'Nuevo Caso', description: 'Crear expediente' },
    { to: '/search', icon: Scale, label: 'Investigar', description: 'Buscar jurisprudencia' },
    { to: '/documents', icon: FileText, label: 'Documentos', description: 'Subir documentos' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Casos Activos', value: stats.cases, icon: FolderOpen, color: 'text-blue-600' },
          { label: 'Documentos', value: stats.documents, icon: FileText, color: 'text-green-600' },
          { label: 'Conversaciones', value: stats.conversations, icon: MessageSquare, color: 'text-purple-600' },
          { label: 'Análisis', value: 0, icon: TrendingUp, color: 'text-orange-600' },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-card rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="p-4 bg-card rounded-lg border hover:border-primary/50 transition-colors"
          >
            <action.icon className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">{action.label}</h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Casos Recientes</h2>
        {recentCases.length === 0 ? (
          <p className="text-muted-foreground">No hay casos creados aún.</p>
        ) : (
          <div className="space-y-3">
            {recentCases.map((c: any) => (
              <Link
                key={c.id}
                to={`/cases/${c.id}`}
                className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.legal_area}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.updated_at).toLocaleDateString('es-CO')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
