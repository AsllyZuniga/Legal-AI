import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documentos</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona los documentos de tus casos</p>
      </div>

      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Selecciona un caso desde "Mis Casos"</p>
        <p className="text-sm mt-1">Los documentos se gestionan dentro de cada caso</p>
      </div>
    </div>
  );
}
