import { useState, useEffect } from 'react';
import { caseService } from '../../../services/caseService';
import api from '../../../services/api';
import { Search, Loader2, FileSearch, Plus, ExternalLink } from 'lucide-react';

export default function JurisprudenceTab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [saved, setSaved] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [caseId]);
  const load = async () => {
    try { const res = await caseService.getJurisprudence(caseId); setSaved(res.data); } catch {}
    setLoading(false);
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await api.get('/jurisprudence/search', { params: { q: searchQuery || caseData.name, limit: 10 } });
      setSearchResults(res.data.data || res.data || []);
    } catch {}
    setSearching(false);
  };

  const handleSave = async (ruling: any) => {
    try {
      await caseService.saveJurisprudence(caseId, { rulingId: ruling.id, similarityScore: ruling.similarity_score, relevanceNote: '' });
      load();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Jurisprudencia</h2>
        <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Search className="h-3.5 w-3.5" /> Buscar Jurisprudencia
        </button>
      </div>

      {showSearch && (
        <div className="bg-card rounded-lg border p-4 space-y-3">
          <div className="flex gap-2">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por tema, norma, problema juridico..." className="flex-1 px-3 py-2 border rounded-md bg-background text-sm" />
            <button onClick={handleSearch} disabled={searching} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm disabled:opacity-50">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {searchResults.map((r: any) => (
                <div key={r.id} className="p-3 border rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{r.citation}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">{r.corporation}</span>
                        {r.chamber && <span className="text-xs text-muted-foreground">| {r.chamber}</span>}
                        {r.ruling_date && <span className="text-xs text-muted-foreground">| {new Date(r.ruling_date).toLocaleDateString('es-CO')}</span>}
                      </div>
                      {r.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>}
                      {r.similarity_score && <p className="text-xs text-primary mt-1">Similitud: {r.similarity_score}%</p>}
                    </div>
                    <button onClick={() => handleSave(r)} className="flex items-center gap-1 px-2 py-1 text-xs border rounded hover:bg-muted ml-2">
                      <Plus className="h-3 w-3" /> Guardar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">Nota: La aplicabilidad de cada sentencia debe ser valorada por el abogado. La IA no determina automaticamente la aplicabilidad.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : saved.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground"><FileSearch className="h-10 w-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No hay jurisprudencia guardada para este caso</p></div>
      ) : (
        <div className="space-y-2">
          {saved.map((s: any) => (
            <div key={s.id} className="p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ruling {s.ruling_id?.substring(0, 8)}...</p>
                  {s.similarity_score && <p className="text-xs text-primary">Similitud: {s.similarity_score}%</p>}
                  {s.relevance_note && <p className="text-xs text-muted-foreground">{s.relevance_note}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
