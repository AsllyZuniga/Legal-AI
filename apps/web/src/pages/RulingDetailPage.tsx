import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';

export default function RulingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ruling, setRuling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/jurisprudence/${id}`).then((res) => {
        setRuling(res.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!ruling) return <div className="text-center py-12 text-muted-foreground">Sentencia no encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-2xl font-bold">{ruling.citation}</h1>
        </div>
        <a href={ruling.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
          <Download className="h-4 w-4" /> Descargar
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen</h2>
          <p className="text-sm text-muted-foreground">{ruling.summary || 'No disponible'}</p>

          {ruling.resuelve && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Decisión (Resuelve)</h3>
              <p className="text-sm">{ruling.resuelve}</p>
            </div>
          )}

          {ruling.full_text && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Texto Completo</h3>
              <div className="text-sm max-h-96 overflow-auto bg-muted/30 p-4 rounded-md whitespace-pre-wrap">
                {ruling.full_text}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3">Ficha</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Corporación:</strong> {ruling.corporation}</div>
              <div><strong>Tipo:</strong> {ruling.ruling_type}</div>
              <div><strong>Fecha:</strong> {ruling.ruling_date}</div>
              {ruling.chamber && <div><strong>Sala:</strong> {ruling.chamber}</div>}
              {ruling.magistrate_ponent && <div><strong>Ponente:</strong> {ruling.magistrate_ponent}</div>}
              {ruling.radicado && <div><strong>Radicado:</strong> {ruling.radicado}</div>}
            </div>
          </div>

          {ruling.themes && ruling.themes.length > 0 && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Temas</h3>
              <div className="flex flex-wrap gap-1">
                {ruling.themes.map((t: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-muted text-xs rounded">{t}</span>
                ))}
              </div>
            </div>
          )}

          {ruling.referenced_norms && ruling.referenced_norms.length > 0 && (
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Normas Citadas</h3>
              <ul className="text-sm space-y-1">
                {ruling.referenced_norms.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
