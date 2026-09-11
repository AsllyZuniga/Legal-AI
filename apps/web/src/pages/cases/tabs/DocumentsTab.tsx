import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import {
  FileText, Loader2, Upload, X, Search,
  Eye, Brain, SpellCheck, Download, RefreshCw,
  ExternalLink, Cloud, CloudOff,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function DocumentsTab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<string>('');
  const [reviewResult, setReviewResult] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [openingGoogle, setOpeningGoogle] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
    checkGoogleConnection();
  }, [caseId]);

  const checkGoogleConnection = async () => {
    try {
      const res = await api.get('/integrations/google');
      setGoogleConnected(res.data?.isActive === true);
    } catch {
      setGoogleConnected(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const res = await api.get('/integrations/google/auth-url');
      window.open(res.data.url, '_blank', 'width=500,height=600');
      setGoogleLoading(true);
      const interval = setInterval(async () => {
        try {
          const connRes = await api.get('/integrations/google');
          if (connRes.data?.isActive) {
            setGoogleConnected(true);
            setGoogleLoading(false);
            clearInterval(interval);
          }
        } catch {}
      }, 2000);
      setTimeout(() => { clearInterval(interval); setGoogleLoading(false); }, 60000);
    } catch {
      alert('Error obteniendo URL de autenticacion');
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setSelectedDoc(null);
    setAiResult('');
    setReviewResult('');
    try {
      const res = await api.get(`/cases/${caseId}/documents`);
      setDocuments(res.data || []);
    } catch {}
    setLoading(false);
  };

  const handleDocSelect = (doc: any) => {
    setSelectedDoc(doc);
    setAiResult('');
    setReviewResult('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caseId', caseId);
      const res = await api.post('/documents/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploadedDoc = res.data;
      setSelectedFile(null);
      setShowUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDocuments();

      const isDocx = selectedFile.name.endsWith('.docx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      if (isDocx && googleConnected) {
        try {
          const googleRes = await api.post(`/documents/${uploadedDoc.id}/open-in-google-docs`);
          if (googleRes.data.editUrl) {
            window.open(googleRes.data.editUrl, '_blank');
          }
        } catch {}
      }
    } catch {
      alert('Error subiendo el documento');
    }
    setUploading(false);
  };

  const handleOpenInGoogleDocs = async () => {
    if (!selectedDoc) return;
    if (!googleConnected) {
      connectGoogle();
      return;
    }
    setOpeningGoogle(true);
    try {
      const res = await api.post(`/documents/${selectedDoc.id}/open-in-google-docs`);
      if (res.data.editUrl) {
        window.open(res.data.editUrl, '_blank');
      }
      await loadDocuments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error abriendo en Google Docs');
    }
    setOpeningGoogle(false);
  };

  const handleSyncFromGoogle = async () => {
    if (!selectedDoc) return;
    setSyncing(true);
    try {
      await api.post(`/documents/${selectedDoc.id}/sync-from-google`);
      await loadDocuments();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error sincronizando desde Google Drive');
    }
    setSyncing(false);
  };

  const handleAIAnalysis = async () => {
    if (!selectedDoc) return;
    setAiAnalyzing(true);
    setAiResult('');
    try {
      const res = await api.post('/analysis/analyze', {
        caseId,
        documentId: selectedDoc.id,
        analysisType: 'document_analysis',
        question: `Analiza el documento "${selectedDoc.fileName}" en el contexto del caso. Identifica puntos clave, posibles problemas, y relevancia juridica.`,
      });
      setAiResult(res.data.result || res.data.output || 'Analisis completado.');
    } catch {
      setAiResult('Error al analizar el documento.');
    }
    setAiAnalyzing(false);
  };

  const handleSpellCheck = async () => {
    if (!selectedDoc) return;
    setAiAnalyzing(true);
    setReviewResult('');
    try {
      const res = await api.post('/analysis/analyze', {
        caseId,
        documentId: selectedDoc.id,
        analysisType: 'spell_check',
        question: `Revisa la redaccion, ortografia y puntuacion del documento "${selectedDoc.fileName}". Senala errores y sugerencias de mejora.`,
      });
      setReviewResult(res.data.result || res.data.output || 'Revision completada.');
    } catch {
      setReviewResult('Error al revisar el documento.');
    }
    setAiAnalyzing(false);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('docx')) return '📝';
    if (mimeType?.includes('image')) return '🖼️';
    return '📎';
  };

  const isDocx = (doc: any) => {
    return doc.fileName?.endsWith('.docx') ||
      doc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  };

  const filteredDocs = documents.filter((d) =>
    !searchTerm || d.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos del Caso</h2>
        <div className="flex items-center gap-2">
          {googleConnected ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium">
              <Cloud className="h-3.5 w-3.5" /> Google Drive conectado
            </span>
          ) : (
            <button
              onClick={connectGoogle}
              disabled={googleLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs hover:bg-background disabled:opacity-50"
            >
              {googleLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudOff className="h-3.5 w-3.5" />}
              Conectar Google Drive
            </button>
          )}
          <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
            <Upload className="h-4 w-4" /> Subir Archivo
          </button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-280px)]">
        <div className="flex-1 flex flex-col bg-card rounded-lg border overflow-hidden">
          <div className="p-3 border-b flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar archivos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border rounded-md bg-background text-sm"
              />
            </div>
            <span className="text-xs text-muted-foreground">{filteredDocs.length} archivos</span>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto p-3">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay documentos en este caso</p>
                  <p className="text-xs mt-1">Sube archivos para comenzar</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleDocSelect(doc)}
                      className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center gap-3 ${
                        selectedDoc?.id === doc.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted border border-transparent'
                      }`}
                    >
                      <span className="text-lg">{getFileIcon(doc.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{new Date(doc.createdAt).toLocaleDateString('es-CO')}</span>
                          {doc.version && doc.version > 1 && <span>• v{doc.version}</span>}
                          {doc.syncStatus === 'google_drive' && (
                            <span className="flex items-center gap-0.5 text-blue-600">
                              <Cloud className="h-3 w-3" />
                              Google
                            </span>
                          )}
                          {doc.syncStatus === 'synced' && (
                            <span className="flex items-center gap-0.5 text-green-600">
                              <RefreshCw className="h-3 w-3" />
                              Sincronizado
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDoc && (
              <div className="w-96 border-l overflow-auto bg-muted/20">
                <div className="p-4 border-b sticky top-0 bg-muted/20 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold truncate">{selectedDoc.fileName}</h3>
                    <button onClick={() => setSelectedDoc(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {isDocx(selectedDoc) && (
                      <button
                        onClick={handleOpenInGoogleDocs}
                        disabled={openingGoogle}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        {openingGoogle ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                        {selectedDoc.syncStatus === 'google_drive' ? 'Abrir en Google Docs' : 'Editar en Google Docs'}
                      </button>
                    )}
                    {selectedDoc.syncStatus === 'google_drive' && (
                      <button
                        onClick={handleSyncFromGoogle}
                        disabled={syncing}
                        className="flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-xs hover:bg-background disabled:opacity-50"
                      >
                        {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Sincronizar
                      </button>
                    )}
                    <button
                      onClick={handleAIAnalysis}
                      disabled={aiAnalyzing}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-md text-xs disabled:opacity-50"
                    >
                      <Brain className="h-3 w-3" /> {aiAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                    </button>
                    <button
                      onClick={handleSpellCheck}
                      disabled={aiAnalyzing}
                      className="flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-xs hover:bg-background disabled:opacity-50"
                    >
                      <SpellCheck className="h-3 w-3" /> Revision
                    </button>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 border rounded-md text-xs hover:bg-background"
                    >
                      <Eye className="h-3 w-3" /> Vista previa
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{selectedDoc.mimeType || 'Desconocido'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamano:</span>
                      <span>{formatSize(selectedDoc.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>v{selectedDoc.version || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subido:</span>
                      <span>{new Date(selectedDoc.createdAt).toLocaleDateString('es-CO')}</span>
                    </div>
                    {selectedDoc.syncStatus && selectedDoc.syncStatus !== 'local' && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <span className="flex items-center gap-1">
                          <Cloud className="h-3 w-3 text-blue-500" />
                          {selectedDoc.syncStatus === 'google_drive' ? 'En Google Drive' : 'Sincronizado'}
                        </span>
                      </div>
                    )}
                  </div>

                  {aiResult && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <Brain className="h-3 w-3 text-primary" /> Analisis IA
                      </h4>
                      <div className="prose prose-xs max-w-none text-xs">
                        <ReactMarkdown>{aiResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {reviewResult && (
                    <div className="mt-4 p-3 bg-background rounded-md border">
                      <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                        <SpellCheck className="h-3 w-3 text-primary" /> Revision
                      </h4>
                      <div className="prose prose-xs max-w-none text-xs">
                        <ReactMarkdown>{reviewResult}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Subir Archivo</h2>
              <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              El archivo se vinculara al caso: <strong>{caseData.name}</strong>
            </p>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90"
              />
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT, imagenes y otros formatos</p>
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Subir
              </button>
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded-md text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPreview && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-card rounded-lg w-full max-w-4xl h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold truncate">{selectedDoc.fileName}</h2>
              <button onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {selectedDoc.mimeType?.includes('image') ? (
                <img src={selectedDoc.fileUrl} alt={selectedDoc.fileName} className="max-w-full h-auto mx-auto" />
              ) : selectedDoc.mimeType?.includes('pdf') ? (
                <iframe src={selectedDoc.fileUrl} className="w-full h-full border-0" title={selectedDoc.fileName} />
              ) : selectedDoc.extractedText ? (
                <pre className="whitespace-pre-wrap text-sm font-mono">{selectedDoc.extractedText}</pre>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>Vista previa no disponible para este formato</p>
                  <a href={selectedDoc.fileUrl} download className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
                    <Download className="h-4 w-4" /> Descargar
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
