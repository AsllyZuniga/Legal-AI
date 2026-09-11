import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { caseService } from '../services/caseService';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DocumentsTab from './cases/tabs/DocumentsTab';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadCase();
  }, [id]);

  const loadCase = async () => {
    try {
      const res = await caseService.get(id!);
      setCaseData(res.data);
    } catch {}
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!caseData) return <div className="text-center py-12 text-muted-foreground">Caso no encontrado</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{caseData.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {caseData.legal_area && <span>{caseData.legal_area}</span>}
            {caseData.file_number && <span>• Rad. {caseData.file_number}</span>}
            {caseData.status && <span className={`px-1.5 py-0.5 rounded text-xs ${caseData.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{caseData.status}</span>}
          </div>
        </div>
      </div>

      <DocumentsTab caseId={id!} caseData={caseData} reload={loadCase} />
    </div>
  );
}
