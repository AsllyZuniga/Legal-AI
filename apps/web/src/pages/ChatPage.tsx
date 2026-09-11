import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { Send, Loader2, Plus, MessageSquare, Download, FileText, File, MoreVertical, Trash2 } from 'lucide-react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, conversations, isLoading, loadConversations, createConversation, loadMessages, sendMessage, deleteConversation, currentConversation, setCurrentConversation } = useChatStore();

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && convId !== currentConversation) {
      setCurrentConversation(convId);
      loadMessages(convId);
    }
  }, [searchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleNewChat = async () => {
    const id = await createConversation({});
    setCurrentConversation(id);
    setSearchParams({ conversation: id });
    await loadMessages(id);
  };

  const handleSelectConversation = async (id: string) => {
    setCurrentConversation(id);
    setSearchParams({ conversation: id });
    await loadMessages(id);
  };

  const handleSend = async () => {
    if (!input.trim() || !currentConversation) return;
    const content = input;
    setInput('');
    await sendMessage(currentConversation, content);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConversation(id);
      setOpenMenu(null);
    } catch (error) {
      alert('Error al eliminar la conversación. Intenta de nuevo.');
      console.error('Delete error:', error);
    }
  };

  const handleDownload = async (rulingId: string, citation: string, format: 'pdf' | 'docx') => {
    try {
      const endpoints: Record<string, string> = {
        pdf: `/jurisprudence/${rulingId}/pdf`,
        docx: `/jurisprudence/${rulingId}/docx`,
      };
      const response = await api.get(endpoints[format], { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeCitation = citation.replace(/[^a-zA-Z0-9-_]/g, '_');
      const extensions: Record<string, string> = { pdf: '.pdf', docx: '.docx' };
      link.setAttribute('download', `${safeCitation}${extensions[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      alert(`Error al descargar el ${format}`);
    }
  };

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 bg-card rounded-lg border p-3 flex flex-col">
        <button onClick={handleNewChat} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium mb-3">
          <Plus className="h-4 w-4" /> Nueva Conversación
        </button>
        <div className="flex-1 overflow-auto space-y-1">
          {conversations.map((c) => (
            <div key={c.id} className="relative group">
              <button
                onClick={() => handleSelectConversation(c.id)}
                className={`w-full text-left px-3 py-2 pr-8 rounded-md text-sm truncate ${
                  currentConversation === c.id ? 'bg-muted font-medium' : 'hover:bg-muted/50'
                }`}
              >
                <MessageSquare className="h-3 w-3 inline mr-2" />
                {c.title || 'Nueva conversación'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === c.id ? null : c.id); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {openMenu === c.id && (
                <div className="absolute right-1 top-full mt-1 bg-card border rounded-md shadow-lg z-50 min-w-[120px]">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-card rounded-lg border">
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <ScaleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Asistente Jurídico</p>
                <p className="text-sm">Realiza consultas sobre derecho colombiano</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-full max-w-4xl p-3 rounded-lg ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-sm">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} className="text-primary underline hover:text-primary/80" target="_blank" rel="noopener noreferrer" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-base font-bold mt-3 mb-1" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="text-muted-foreground" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-4 my-1" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal pl-4 my-1" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="my-3 border-border/50" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-primary/20 text-xs opacity-80">
                    <p className="font-medium mb-1">Fuentes:</p>
                    {msg.citations.map((c: any, i: number) => (
                      <span key={i} className="inline-block mr-2">[{i + 1}] {c.text} </span>
                    ))}
                  </div>
                )}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Sentencias disponibles:
                    </p>
                    <div className="space-y-1">
                      {msg.sources.map((source: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-background/50 rounded px-2 py-1">
                          <span className="truncate flex-1">{source.title}</span>
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleDownload(source.id, source.title, 'docx')}
                              className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded text-xs transition-colors"
                              title="Descargar Word"
                            >
                              <File className="h-3 w-3" />
                              Word
                            </button>
                            <button
                              onClick={() => handleDownload(source.id, source.title, 'pdf')}
                              className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded text-xs transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Procesando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe tu consulta jurídica..."
              className="flex-1 px-4 py-2 border rounded-md bg-background text-foreground"
              disabled={!currentConversation}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !currentConversation || isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  );
}
