import { useState, useRef, useEffect } from 'react';
import api from '../../../services/api';
import { Send, Loader2, MessageSquare, Brain, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const suggestions = [
  'Analiza este caso completo.',
  'Que jurisprudencia podria utilizar?',
  'Que pruebas me hacen falta?',
  'Resume la posicion de la contraparte.',
  'Encuentra contradicciones entre los documentos.',
  'Explicame este caso como si estuviera preparando una audiencia.',
  'Que argumentos podria utilizar para defender al cliente?',
];

export default function CaseAITab({ caseId, caseData }: { caseId: string; caseData: any; reload: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initConversation();
  }, [caseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initConversation = async () => {
    try {
      const res = await api.post('/chat/conversations', { caseId, title: `IA - ${caseData.name}` });
      setConversationId(res.data.id);
    } catch {}
  };

  const handleSend = async (text?: string) => {
    const content = text || input;
    if (!content.trim() || !conversationId) return;
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content }]);
    setLoading(true);
    try {
      const res = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
      const msg = res.data;
      setMessages((prev) => [...prev, { id: msg.id || Date.now() + 1, role: 'assistant', content: msg.content || msg.response || '', citations: msg.citations || [], sources: msg.sources || [] }]);
    } catch {
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: 'assistant', content: 'Error al procesar la consulta. Intente nuevamente.' }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">IA del Caso</h2>
        <span className="text-xs text-muted-foreground ml-2">Chat exclusivo con contexto de este expediente</span>
      </div>

      <div className="flex-1 overflow-auto bg-card rounded-lg border p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">Asistente IA del Caso</p>
            <p className="text-sm mb-4">Este chat tiene acceso al contexto completo del expediente</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((s) => (
                <button key={s} onClick={() => handleSend(s)} className="px-3 py-1.5 text-xs border rounded-full hover:bg-muted transition-colors">{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`w-full max-w-3xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30 text-xs opacity-80">
                  <p className="font-medium mb-1">Fuentes:</p>
                  {msg.citations.map((c: any, i: number) => (
                    <span key={i} className="inline-block mr-2">[{i + 1}] {c.text || c}</span>
                  ))}
                </div>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-xs font-medium mb-1 flex items-center gap-1"><FileText className="h-3 w-3" /> Documentos relevantes:</p>
                  {msg.sources.map((s: any, i: number) => (
                    <span key={i} className="inline-block text-xs bg-background/50 rounded px-2 py-0.5 mr-1 mb-1">{s.title || s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Analizando contexto del caso...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Pregunta sobre este caso..."
          className="flex-1 px-4 py-2 border rounded-md bg-background text-sm"
          disabled={!conversationId}
        />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
