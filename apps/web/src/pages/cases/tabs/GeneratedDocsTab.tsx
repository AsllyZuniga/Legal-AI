import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import api from '../../../services/api';
import { FileOutput, Loader2, Plus, Download, FileText } from 'lucide-react';

const docTypes = [
  { value: 'demanda', label: 'Demanda' }, { value: 'contestacion', label: 'Contestacion' },
  { value: 'recurso', label: 'Recurso' }, { value: 'tutela', label: 'Tutela' },
  { value: 'memorial', label: 'Memorial' }, { value: 'alegatos', label: 'Alegatos' },
  { value: 'derecho_peticion', label: 'Derecho de Peticion' }, { value: 'concepto', label: 'Concepto Juridico' },
  { value: 'informe', label: 'Informe' }, { value: 'resumen', label: 'Resumen Ejecutivo' },
];

export default function GeneratedDocsTab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState('demanda');
  const [instructions, setInstructions] = useState('');

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getGeneratedDocuments(caseId); setDocs(res.data); } catch {}
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/generation/generate', { caseId, documentType: docType, instructions });
      load(); setShowForm(false); setInstructions('');
    } catch {}
    setGenerating(false);
  };

  const handleDownload = async (doc: any, format: string) => {
    try {
      const res = await api.get(`/generation/${doc.id}/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.title || doc.document_type}.${format}`;
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos Generados por IA</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm"><Plus className="h-3.5 w-3.5" /> Generar</button>
      </div>

      {showForm && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de documento</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm">
                {docTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Instrucciones adicionales</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full px-3 py-2 border rounded-md bg-background text-sm h-20 resize-none" placeholder="Instrucciones especificas para la generacion..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
              {generating ? 'Generando...' : 'Generar Documento'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><FileOutput className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay documentos generados</p></div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{doc.title || docTypes.find((t) => t.value === doc.document_type)?.label}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>v{doc.format_version}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleDownload(doc, 'docx')} className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted"><Download className="h-3 w-3" /> DOCX</button>
                <button onClick={() => handleDownload(doc, 'pdf')} className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted"><Download className="h-3 w-3" /> PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
