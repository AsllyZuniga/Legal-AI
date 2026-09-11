import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Upload, FileText, Loader2, X, CheckCircle, FolderOpen,
  Download, Search, File, Star, Eye, Copy, Edit3,
  AlertTriangle, Check, Clock, ChevronDown, Filter,
  BookOpen, Scale, Briefcase, Users, Landmark, Shield,
  Gavel, Building2, Leaf, Tractor, Gem, Car, Lightbulb,
  ShoppingBag, Database, FileCheck, Globe, Plane,
} from 'lucide-react';

const LEGAL_AREAS = [
  'Derecho Constitucional', 'Derecho Civil', 'Derecho de Familia',
  'Derecho Laboral y Seguridad Social', 'Derecho Administrativo',
  'Derecho Penal', 'Derecho Comercial', 'Derecho Empresarial',
  'Derecho Tributario', 'Derecho Ambiental', 'Derecho Agrario y Rural',
  'Derecho Minero', 'Derecho de Transito y Transporte',
  'Derecho de Propiedad Intelectual', 'Derecho del Consumidor',
  'Derecho de Proteccion de Datos', 'Contratacion Estatal',
  'Derecho Notarial y Registral', 'Derecho Migratorio', 'Derecho Internacional',
];

const DOCUMENT_TYPES = [
  'Demanda', 'Contestacion de demanda', 'Memorial', 'Minuta', 'Contrato',
  'Poder', 'Derecho de peticion', 'Recurso', 'Solicitud', 'Reclamacion',
  'Querella', 'Denuncia', 'Accion constitucional', 'Accion administrativa',
  'Acta', 'Formulario', 'Declaracion', 'Concepto', 'Alegato', 'Acuerdo',
  'Convenio', 'Otrosi', 'Comunicacion juridica', 'Carta', 'Requerimiento',
  'Respuesta', 'Formulario institucional',
];

const PURPOSES = [
  'Iniciar proceso', 'Responder proceso', 'Presentar recurso',
  'Solicitar informacion', 'Reclamar un derecho', 'Celebrar contrato',
  'Realizar tramite', 'Cumplir requerimiento', 'Defender al cliente',
  'Representar al cliente', 'Conciliar', 'Finalizar proceso',
];

const SOURCES = [
  'Corte Constitucional', 'Corte Suprema de Justicia', 'Consejo de Estado',
  'Rama Judicial', 'Congreso de Colombia', 'DIAN', 'Ministerio del Trabajo',
  'Ministerio de Justicia', 'Ministerio de Transporte', 'Ministerio de Ambiente',
  'ICBF', 'Fiscalia General de la Nacion', 'SIC', 'Colombia Compra Eficiente',
  'Superintendencia de Sociedades', 'Superintendencia de Notariado y Registro',
  'Camara de Comercio', 'ANM', 'ANR', 'Migracion Colombia', 'Cancilleria de Colombia',
  'UART', 'INCODER / ANR',
];

const AREA_ICONS: Record<string, any> = {
  'Derecho Constitucional': Shield, 'Derecho Civil': Scale, 'Derecho de Familia': Users,
  'Derecho Laboral y Seguridad Social': Briefcase, 'Derecho Administrativo': Landmark,
  'Derecho Penal': Gavel, 'Derecho Comercial': Building2, 'Derecho Empresarial': Building2,
  'Derecho Tributario': FileCheck, 'Derecho Ambiental': Leaf,
  'Derecho Agrario y Rural': Tractor, 'Derecho Minero': Gem,
  'Derecho de Transito y Transporte': Car, 'Derecho de Propiedad Intelectual': Lightbulb,
  'Derecho del Consumidor': ShoppingBag, 'Derecho de Proteccion de Datos': Database,
  'Contratacion Estatal': FileCheck, 'Derecho Notarial y Registral': BookOpen,
  'Derecho Migratorio': Plane, 'Derecho Internacional': Globe,
};

const VIGENCY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  vigente: { label: 'Vigente', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: Check },
  revision: { label: 'Revision requerida', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
  obsoleta: { label: 'Obsoleta', color: 'text-red-600 bg-red-50 border-red-200', icon: X },
};

export default function TemplatesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    legalArea: '', subcategory: '', documentType: '', purpose: '',
    vigencyStatus: '', reviewYear: '', officialSource: '', search: '',
    sortBy: '', favoritesOnly: false,
  });

  useEffect(() => {
    const area = searchParams.get('area');
    if (area && area !== filters.legalArea) {
      setFilters((p) => ({ ...p, legalArea: area }));
    }
  }, [searchParams]);

  const [filterOptions, setFilterOptions] = useState<any>({
    legalAreas: [], documentTypes: [], purposes: [], vigencyStatuses: [],
    reviewYears: [], officialSources: [], subcategoriesByArea: {},
  });

  const [areaStats, setAreaStats] = useState<any>({});

  const [uploadForm, setUploadForm] = useState({
    name: '', description: '', legalArea: '', subcategory: '',
    documentType: '', purpose: '', tags: '', officialSource: '',
    relatedNorms: '', vigencyNotes: '',
  });

  const loadTemplates = useCallback(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v && k !== 'favoritesOnly') params.append(k, String(v));
    });
    if (filters.favoritesOnly) params.append('favoritesOnly', 'true');

    api.get(`/templates?${params.toString()}`)
      .then((res) => { setTemplates(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  useEffect(() => {
    api.get('/templates/filters').then((res) => setFilterOptions(res.data || {})).catch(() => {});
    api.get('/templates/area-stats').then((res) => setAreaStats(res.data || {})).catch(() => {});
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadSuccess(false);
      if (!uploadForm.name) setUploadForm((p) => ({ ...p, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name || !uploadForm.legalArea || !uploadForm.documentType) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', uploadForm.name);
      formData.append('legalArea', uploadForm.legalArea);
      formData.append('documentType', uploadForm.documentType);
      if (uploadForm.description) formData.append('description', uploadForm.description);
      if (uploadForm.subcategory) formData.append('subcategory', uploadForm.subcategory);
      if (uploadForm.purpose) formData.append('purpose', uploadForm.purpose);
      if (uploadForm.tags) formData.append('tags', uploadForm.tags);
      if (uploadForm.officialSource) formData.append('officialSource', uploadForm.officialSource);
      if (uploadForm.relatedNorms) formData.append('relatedNorms', uploadForm.relatedNorms);
      if (uploadForm.vigencyNotes) formData.append('vigencyNotes', uploadForm.vigencyNotes);

      await api.post('/templates/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUpload(false);
        setUploadSuccess(false);
        setSelectedFile(null);
        setUploadForm({ name: '', description: '', legalArea: '', subcategory: '', documentType: '', purpose: '', tags: '', officialSource: '', relatedNorms: '', vigencyNotes: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadTemplates();
      }, 1500);
    } catch {
      alert('Error subiendo la plantilla.');
    } finally { setUploading(false); }
  };

  const handleDownload = async (t: any) => {
    try {
      const response = await api.get(`/templates/${t.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t.name}.${t.fileType || 'docx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('No se pudo descargar.'); }
  };

  const handleFavorite = async (id: string) => {
    try {
      const res = await api.post(`/templates/${id}/favorite`);
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, isFavorite: res.data.isFavorite } : t));
    } catch {}
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/templates/${id}/duplicate`);
      loadTemplates();
    } catch { alert('Error duplicando plantilla.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch { alert('Error eliminando.'); }
  };

  const clearFilters = () => {
    setFilters({ legalArea: '', subcategory: '', documentType: '', purpose: '', vigencyStatus: '', reviewYear: '', officialSource: '', search: '', sortBy: '', favoritesOnly: false });
    setSearchParams({});
  };

  const handleAreaClick = (area: string) => {
    setFilters((p) => ({ ...p, legalArea: area }));
    setSearchParams({ area });
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && k !== 'favoritesOnly' && k !== 'sortBy' && k !== 'search').length + (filters.favoritesOnly ? 1 : 0);

  const subcategories = filters.legalArea && filterOptions.subcategoriesByArea?.[filters.legalArea]
    ? filterOptions.subcategoriesByArea[filters.legalArea] : [];

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getVigencyBadge = (status: string, year?: number) => {
    const config = VIGENCY_CONFIG[status] || VIGENCY_CONFIG.vigente;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status === 'vigente' && year ? `${config.label} ${year}` : config.label}
      </span>
    );
  };

  const getAreaIcon = (area: string) => {
    const Icon = AREA_ICONS[area] || FileText;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Plantillas Juridicas</h1>
          <p className="text-sm text-muted-foreground">Documentos, formatos, modelos, minutas, escritos procesales y formularios para abogados en Colombia</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
          <Upload className="h-4 w-4" /> Subir Plantilla
        </button>
      </div>

      <div className="bg-card rounded-lg border p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Buscar por nombre, area, tipo de documento, tramite o palabras clave..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md bg-background"
              />
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2.5 border rounded-md text-sm ${showFilters ? 'border-primary text-primary bg-primary/5' : 'hover:bg-muted'}`}>
            <Filter className="h-4 w-4" /> Filtros {activeFilterCount > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          <div className="flex items-center gap-1 border rounded-md">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`} title="Vista grilla">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" strokeWidth="2"/></svg>
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`} title="Vista lista">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2"/><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2"/><line x1="3" y1="18" x2="21" y2="18" strokeWidth="2"/></svg>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Area juridica</label>
              <select value={filters.legalArea} onChange={(e) => setFilters((p) => ({ ...p, legalArea: e.target.value, subcategory: '' }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Todas</option>
                {LEGAL_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subcategoria</label>
              <select value={filters.subcategory} onChange={(e) => setFilters((p) => ({ ...p, subcategory: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm" disabled={!filters.legalArea}>
                <option value="">Todas</option>
                {subcategories.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tipo de documento</label>
              <select value={filters.documentType} onChange={(e) => setFilters((p) => ({ ...p, documentType: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Todos</option>
                {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Finalidad</label>
              <select value={filters.purpose} onChange={(e) => setFilters((p) => ({ ...p, purpose: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Todas</option>
                {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ano</label>
              <select value={filters.reviewYear} onChange={(e) => setFilters((p) => ({ ...p, reviewYear: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Todos</option>
                {[2026, 2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fuente</label>
              <select value={filters.officialSource} onChange={(e) => setFilters((p) => ({ ...p, officialSource: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Todas</option>
                {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
              <select value={filters.sortBy} onChange={(e) => setFilters((p) => ({ ...p, sortBy: e.target.value }))} className="w-full mt-1 rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="">Relevancia</option>
                <option value="recent">Recientemente actualizadas</option>
                <option value="popular">Mas utilizadas</option>
                <option value="favorites">Mas favoritas</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.favoritesOnly} onChange={(e) => setFilters((p) => ({ ...p, favoritesOnly: e.target.checked }))} className="rounded" />
                <Star className="h-3.5 w-3.5 text-amber-500" /> Solo favoritos
              </label>
            </div>
            <div className="flex items-end">
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground py-1.5">Limpiar filtros</button>
            </div>
          </div>
        )}
      </div>

      {!filters.legalArea && !filters.search && !filters.documentType && !filters.purpose && !filters.vigencyStatus && !filters.favoritesOnly && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {LEGAL_AREAS.map((area) => {
            const stats = areaStats[area];
            const Icon = AREA_ICONS[area] || FileText;
            return (
              <button key={area} onClick={() => handleAreaClick(area)} className="bg-card rounded-lg border p-3 hover:border-primary/50 transition-colors text-left group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20"><Icon className="h-4 w-4" /></div>
                  {stats && <span className="text-xs text-muted-foreground ml-auto">{stats.total} docs</span>}
                </div>
                <h3 className="font-medium text-xs leading-tight">{area}</h3>
                {stats && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {stats.vigente > 0 && <span className="text-[10px] text-emerald-600">{stats.vigente} vig.</span>}
                    {stats.revision > 0 && <span className="text-[10px] text-amber-600">{stats.revision} rev.</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {filters.legalArea && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground">← Volver</button>
            <span className="text-sm text-muted-foreground">{templates.length} plantilla{templates.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay plantillas en esta area</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {templates.map((t) => (
                <div key={t.id} className="bg-card rounded-lg border p-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium leading-tight">{t.name}</span>
                  </div>
                  <button onClick={() => handleDownload(t)} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2">
                    <Download className="h-3 w-3" />
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDetail && <TemplateDetailModal template={showDetail} onClose={() => setShowDetail(null)} onDownload={() => handleDownload(showDetail)} formatDate={formatDate} getVigencyBadge={getVigencyBadge} getAreaIcon={getAreaIcon} />}
      {showEdit && <TemplateEditModal template={showEdit} onClose={() => setShowEdit(null)} onSaved={() => { setShowEdit(null); loadTemplates(); }} />}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Subir Plantilla</h2>
              <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            {uploadSuccess ? (
              <div className="flex flex-col items-center py-8 text-green-600">
                <CheckCircle className="h-12 w-12 mb-2" /><p className="font-medium">Plantilla subida exitosamente</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Archivo</label>
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} accept=".doc,.docx,.pdf,.xlsx,.xls,.odt,.rtf" className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90" />
                  <p className="text-xs text-muted-foreground mt-1">DOC, DOCX, PDF, XLSX, ODT, RTF (editables en Word)</p>
                </div>
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{selectedFile.name}</p></div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input value={uploadForm.name} onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ej: Demanda de Tutela por Derecho a la Salud" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripcion</label>
                  <textarea value={uploadForm.description} onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))} placeholder="Breve descripcion de la plantilla..." rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Area juridica *</label>
                    <select value={uploadForm.legalArea} onChange={(e) => setUploadForm((p) => ({ ...p, legalArea: e.target.value, subcategory: '' }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Seleccionar...</option>
                      {LEGAL_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tipo de documento *</label>
                    <select value={uploadForm.documentType} onChange={(e) => setUploadForm((p) => ({ ...p, documentType: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Seleccionar...</option>
                      {DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Subcategoria</label>
                    <input value={uploadForm.subcategory} onChange={(e) => setUploadForm((p) => ({ ...p, subcategory: e.target.value }))} placeholder="Ej: Demandas, Recursos..." className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Finalidad</label>
                    <select value={uploadForm.purpose} onChange={(e) => setUploadForm((p) => ({ ...p, purpose: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Seleccionar...</option>
                      {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fuente oficial</label>
                    <select value={uploadForm.officialSource} onChange={(e) => setUploadForm((p) => ({ ...p, officialSource: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">Seleccionar...</option>
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Etiquetas</label>
                    <input value={uploadForm.tags} onChange={(e) => setUploadForm((p) => ({ ...p, tags: e.target.value }))} placeholder="tutela, salud, urgente" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                    <p className="text-xs text-muted-foreground mt-0.5">Separadas por coma</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Normas relacionadas</label>
                  <input value={uploadForm.relatedNorms} onChange={(e) => setUploadForm((p) => ({ ...p, relatedNorms: e.target.value }))} placeholder="Ley 1755 de 2015, Art. 23 CP" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                </div>
                <button onClick={handleUpload} disabled={!selectedFile || !uploadForm.name || !uploadForm.legalArea || !uploadForm.documentType || uploading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">
                  {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo...</> : <><Upload className="h-4 w-4" /> Subir Plantilla</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template: t, onView, onDownload, onFavorite, onDuplicate, onDelete, onEdit, formatDate, getVigencyBadge, getAreaIcon }: any) {
  return (
    <div className="bg-card rounded-lg border p-4 hover:border-primary/50 transition-colors flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">{getAreaIcon(t.legalArea)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{t.legalArea}</p>
            <p className="text-xs text-muted-foreground">{t.documentType}</p>
          </div>
        </div>
        <button onClick={onFavorite} className={`p-1 rounded ${t.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}>
          <Star className={`h-4 w-4 ${t.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <h3 className="font-medium text-sm mb-1 cursor-pointer hover:text-primary" onClick={onView}>{t.name}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{t.description || 'Sin descripcion'}</p>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {t.purpose && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">{t.purpose}</span>}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        {t.officialSource && <span className="truncate">{t.officialSource}</span>}
        {t.lastReviewDate && <span>{formatDate(t.lastReviewDate)}</span>}
      </div>
      {t.needsRevision && (
        <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded p-1.5 mb-3">
          <AlertTriangle className="h-3 w-3" /> Esta plantilla requiere revision debido a cambios normativos.
        </div>
      )}
      <div className="flex items-center gap-1 pt-2 border-t">
        <button onClick={onView} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Ver"><Eye className="h-3.5 w-3.5" /></button>
        <button onClick={onDownload} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Descargar (Word)"><Download className="h-3.5 w-3.5" /></button>
        <button onClick={onEdit} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Editar"><Edit3 className="h-3.5 w-3.5" /></button>
        <button onClick={onDuplicate} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Duplicar"><Copy className="h-3.5 w-3.5" /></button>
        <button onClick={onFavorite} className={`p-1.5 rounded ${t.isFavorite ? 'text-amber-500 bg-amber-50' : 'hover:bg-amber-50 text-muted-foreground'}`} title="Favorito"><Star className={`h-3.5 w-3.5 ${t.isFavorite ? 'fill-current' : ''}`} /></button>
        {!t.isDefault && <button onClick={onDelete} className="p-1.5 hover:bg-red-500/10 rounded text-red-500 ml-auto" title="Eliminar"><X className="h-3.5 w-3.5" /></button>}
      </div>
    </div>
  );
}

function TemplateListItem({ template: t, onView, onDownload, onFavorite, onDuplicate, onDelete, formatDate, getVigencyBadge }: any) {
  return (
    <div className="flex items-center justify-between bg-card rounded-lg border p-3 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FileText className="h-5 w-5 text-primary/70 flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate cursor-pointer hover:text-primary" onClick={onView}>{t.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t.legalArea} · {t.documentType}{t.subcategory ? ` · ${t.subcategory}` : ''}
            {t.officialSource ? ` · ${t.officialSource}` : ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={onFavorite} className={`p-1.5 rounded ${t.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}><Star className={`h-4 w-4 ${t.isFavorite ? 'fill-current' : ''}`} /></button>
        <button onClick={onDownload} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Descargar"><Download className="h-4 w-4" /></button>
        <button onClick={onDuplicate} className="p-1.5 hover:bg-primary/10 rounded text-primary" title="Duplicar"><Copy className="h-4 w-4" /></button>
        {!t.isDefault && <button onClick={onDelete} className="p-1.5 hover:bg-red-500/10 rounded text-red-500" title="Eliminar"><X className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}

function TemplateDetailModal({ template: t, onClose, onDownload, formatDate, getVigencyBadge, getAreaIcon }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">{getAreaIcon(t.legalArea)}</div>
              <div>
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <p className="text-sm text-muted-foreground">{t.legalArea} · {t.documentType}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>

          <p className="text-sm">{t.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Informacion General</h3>
              <div className="text-sm space-y-1">
                {t.subcategory && <p><span className="text-muted-foreground">Subcategoria:</span> {t.subcategory}</p>}
                {t.purpose && <p><span className="text-muted-foreground">Finalidad:</span> {t.purpose}</p>}
                <p><span className="text-muted-foreground">Tipo:</span> {t.documentType}</p>
                <p><span className="text-muted-foreground">Formato:</span> {t.fileType?.toUpperCase()} (editable en Word)</p>
                <p><span className="text-muted-foreground">Jurisdiccion:</span> {t.jurisdiction || 'Colombia'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Vigencia Juridica</h3>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">{getVigencyBadge(t.vigencyStatus, t.reviewYear)}</div>
                {t.lastReviewDate && <p><span className="text-muted-foreground">Ultima revision:</span> {formatDate(t.lastReviewDate)}</p>}
                {t.reviewYear && <p><span className="text-muted-foreground">Ano actualizacion:</span> {t.reviewYear}</p>}
              </div>
            </div>
          </div>

          {t.officialSource && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Fuente</h3>
              <div className="text-sm bg-muted rounded-md p-3">
                <p><span className="text-muted-foreground">Fuente normativa:</span> {t.officialSource}</p>
                {t.sourceUrl && <p><span className="text-muted-foreground">URL:</span> <a href={t.sourceUrl} className="text-primary underline" target="_blank">{t.sourceUrl}</a></p>}
              </div>
            </div>
          )}

          {t.relatedNorms && t.relatedNorms.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Normas Relacionadas</h3>
              <div className="flex flex-wrap gap-1">
                {t.relatedNorms.map((n: string, i: number) => <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">{n}</span>)}
              </div>
            </div>
          )}

          {t.relatedJurisprudence && t.relatedJurisprudence.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Jurisprudencia Relacionada</h3>
              <div className="flex flex-wrap gap-1">
                {t.relatedJurisprudence.map((j: string, i: number) => <span key={i} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded">{j}</span>)}
              </div>
            </div>
          )}

          {t.vigencyNotes && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Observaciones de Vigencia</h3>
              <p className="text-sm text-muted-foreground">{t.vigencyNotes}</p>
            </div>
          )}

          {t.needsRevision && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              <AlertTriangle className="h-4 w-4" />
              <span>Esta plantilla requiere revision debido a cambios normativos. {t.revisionReason}</span>
            </div>
          )}

          {t.tags && t.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {t.tags.map((tag: string, i: number) => <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>)}
            </div>
          )}

          <div className="flex items-center gap-2 pt-4 border-t">
            <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
              <Download className="h-4 w-4" /> Descargar (Word)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateEditModal({ template: t, onClose, onSaved }: any) {
  const [form, setForm] = useState({
    name: t.name || '', description: t.description || '', legalArea: t.legalArea || '',
    subcategory: t.subcategory || '', documentType: t.documentType || '', purpose: t.purpose || '',
    officialSource: t.officialSource || '', vigencyStatus: t.vigencyStatus || 'vigente',
    relatedNorms: (t.relatedNorms || []).join(', '), relatedJurisprudence: (t.relatedJurisprudence || []).join(', '),
    vigencyNotes: t.vigencyNotes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/templates/${t.id}`, {
        ...form,
        relatedNorms: form.relatedNorms.split(',').map((s: string) => s.trim()).filter(Boolean),
        relatedJurisprudence: form.relatedJurisprudence.split(',').map((s: string) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch { alert('Error guardando.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editar Plantilla</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div><label className="block text-sm font-medium mb-1">Nombre</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
        <div><label className="block text-sm font-medium mb-1">Descripcion</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Area juridica</label><select value={form.legalArea} onChange={(e) => setForm((p) => ({ ...p, legalArea: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">{LEGAL_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Tipo de documento</label><select value={form.documentType} onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm">{DOCUMENT_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Subcategoria</label><input value={form.subcategory} onChange={(e) => setForm((p) => ({ ...p, subcategory: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Finalidad</label><select value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">Seleccionar...</option>{PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium mb-1">Estado de vigencia</label><select value={form.vigencyStatus} onChange={(e) => setForm((p) => ({ ...p, vigencyStatus: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="vigente">Vigente</option><option value="revision">Revision requerida</option><option value="obsoleta">Obsoleta</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Fuente oficial</label><select value={form.officialSource} onChange={(e) => setForm((p) => ({ ...p, officialSource: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="">Seleccionar...</option>{SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Normas relacionadas</label><input value={form.relatedNorms} onChange={(e) => setForm((p) => ({ ...p, relatedNorms: e.target.value }))} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Separadas por coma" /></div>
        <div><label className="block text-sm font-medium mb-1">Observaciones de vigencia</label><textarea value={form.vigencyNotes} onChange={(e) => setForm((p) => ({ ...p, vigencyNotes: e.target.value }))} rows={2} className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" /></div>
        <div className="flex items-center gap-2 pt-2">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90 disabled:opacity-50">{saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : 'Guardar cambios'}</button>
          <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm hover:bg-muted">Cancelar</button>
        </div>
      </div>
    </div>
  );
}
