import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCaseStore } from '../stores/caseStore';
import {
  FolderOpen, Plus, Loader2, Search, Filter, ChevronDown,
  FileText, AlertTriangle, Scale, Users, Clock, MoreHorizontal,
  MessageSquare, Edit2, Eye,
} from 'lucide-react';

const legalAreas = [
  { value: '', label: 'Todas las areas' },
  { value: 'civil', label: 'Civil' },
  { value: 'familia', label: 'Familia' },
  { value: 'laboral', label: 'Laboral' },
  { value: 'penal', label: 'Penal' },
  { value: 'contencioso_administrativo', label: 'Contencioso Administrativo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'constitucional', label: 'Constitucional' },
];

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'archived', label: 'Archivado' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'suspended', label: 'Suspendido' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-700',
  closed: 'bg-slate-100 text-slate-700',
  suspended: 'bg-orange-100 text-orange-700',
};

export default function CasesPage() {
  const navigate = useNavigate();
  const { cases, total, page, loading, filters, setFilters, loadCases } = useCaseStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => { loadCases(1); }, []);

  const filteredCases = cases.filter((c: any) =>
    !searchTerm || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.client?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis Casos</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} casos registrados</p>
        </div>
        <button onClick={() => navigate('/cases/new')} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Nuevo Caso
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md bg-background text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-md text-sm transition-colors ${showFilters ? 'bg-primary/10 border-primary/30 text-foreground' : 'hover:bg-muted'}`}
        >
          <Filter className="h-4 w-4" /> Filtros <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-card rounded-lg border">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
            <select value={filters.status || ''} onChange={(e) => { setFilters({ ...filters, status: e.target.value || undefined }); loadCases(1); }} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Area del derecho</label>
            <select value={filters.legalArea || ''} onChange={(e) => { setFilters({ ...filters, legalArea: e.target.value || undefined }); loadCases(1); }} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
              {legalAreas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo de proceso</label>
            <input type="text" placeholder="Ej: Ordinario" value={filters.processType || ''} onChange={(e) => { setFilters({ ...filters, processType: e.target.value || undefined }); loadCases(1); }} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Abogado responsable</label>
            <input type="text" placeholder="Nombre del abogado" value={filters.responsibleLawyer || ''} onChange={(e) => { setFilters({ ...filters, responsibleLawyer: e.target.value || undefined }); loadCases(1); }} className="w-full px-3 py-2 border rounded-md bg-background text-sm" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay casos creados</p>
          <button onClick={() => navigate('/cases/new')} className="mt-4 text-sm text-primary hover:underline">Crear primer caso</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCases.map((c: any) => (
            <div key={c.id} className="bg-card rounded-lg border hover:border-primary/50 transition-all hover:shadow-md group">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Link to={`/cases/${c.id}`} className="font-medium text-sm line-clamp-1 hover:text-primary flex-1">{c.name}</Link>
                  <div className="relative">
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === c.id ? null : c.id); }} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {openMenu === c.id && (
                      <div className="absolute right-0 top-full mt-1 bg-card border rounded-md shadow-lg z-50 min-w-[160px] py-1">
                        <Link to={`/cases/${c.id}`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"><Eye className="h-3.5 w-3.5" /> Abrir caso</Link>
                        <Link to={`/cases/${c.id}?tab=info`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"><Edit2 className="h-3.5 w-3.5" /> Editar caso</Link>
                        <Link to={`/cases/${c.id}?tab=ai`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"><MessageSquare className="h-3.5 w-3.5" /> Preguntar a IA</Link>
                        <Link to={`/cases/${c.id}?tab=documents`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"><FileText className="h-3.5 w-3.5" /> Ver documentos</Link>
                        <Link to={`/cases/${c.id}?tab=alerts`} onClick={() => setOpenMenu(null)} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"><AlertTriangle className="h-3.5 w-3.5" /> Ver alertas</Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] || statusColors.active}`}>{c.status === 'active' ? 'Activo' : c.status}</span>
                  {c.priority && <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[c.priority] || priorityColors.medium}`}>{c.priority === 'high' ? 'Alta' : c.priority === 'low' ? 'Baja' : 'Media'}</span>}
                  {c.legal_area && <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{c.legal_area}</span>}
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {c.client && <p className="col-span-2 truncate"><span className="font-medium text-foreground">Cliente:</span> {c.client}</p>}
                  {c.process_type && <p className="truncate"><span className="font-medium text-foreground">Tipo:</span> {c.process_type}</p>}
                  {c.file_number && <p className="truncate"><span className="font-medium text-foreground">Radicado:</span> {c.file_number}</p>}
                  {c.court && <p className="truncate"><span className="font-medium text-foreground">Juzgado:</span> {c.court}</p>}
                  {c.responsible_lawyer && <p className="truncate"><span className="font-medium text-foreground">Abogado:</span> {c.responsible_lawyer}</p>}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {c._count?.userDocuments || 0}</span>
                  <span className="flex items-center gap-1"><Scale className="h-3 w-3" /> {c._count?.caseFacts || 0} hechos</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c._count?.caseEvidence || 0} pruebas</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {c._count?.caseAlerts || 0} alertas</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(c.updated_at).toLocaleDateString('es-CO')}</span>
                  <Link to={`/cases/${c.id}`} className="text-primary hover:underline font-medium">Abrir →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
