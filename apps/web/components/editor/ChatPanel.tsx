'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertTriangle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  model?: string;
}

interface ChatPanelProps {
  selectedFile?: { name: string; content: string } | null;
  onInsertCode?: (code: string) => void;
}

export default function ChatPanel({ selectedFile, onInsertCode }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o NEXUS IA. Podes usar @file para incluir ficheiros no contexto. Como posso ajudar?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [lowCredits, setLowCredits] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadStatus = async () => {
    try {
      const data = await apiFetch('/chat/status');
      setCredits(data.user.credits.remaining);
      setLowCredits(data.alerts?.lowCredits || false);
    } catch { /* ignore */ }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userContent = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userContent }]);
    setLoading(true);

    try {
      // Build messages with file context if selected
      const apiMessages: any[] = [
        { role: 'system', content: 'Assistente de código especializado. Responde em Português (Angola).' },
      ];

      // Include selected file if exists
      if (selectedFile) {
        apiMessages.push({
          role: 'system',
          content: `Ficheiro atual (\`${selectedFile.name}\`):\n\`\`\`\n${selectedFile.content.slice(0, 15000)}\n\`\`\``,
        });
      }

      // Include @file mentions from input
      const fileMentions = userContent.match(/@file\s+([^\s]+)/g);
      if (fileMentions) {
        // In real app, would read files from IndexedDB/file system
        apiMessages.push({
          role: 'system',
          content: `O utilizador referenciou ficheiros: ${fileMentions.join(', ')}`,
        });
      }

      // Add chat history (last 10 messages)
      const history = messages.slice(-10).map(m => ({
        role: m.role === 'error' ? 'assistant' : m.role,
        content: m.content,
      }));
      apiMessages.push(...history);
      apiMessages.push({ role: 'user', content: userContent });

      const data = await apiFetch('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({ messages: apiMessages, maxTokens: 4096 }),
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        model: data.model,
      }]);

      if (data.credits) {
        setCredits(data.credits.remaining);
        if (data.alerts?.lowCredits) setLowCredits(true);
      }
    } catch (err: any) {
      const msg = err.message || 'Erro de comunicação';
      setMessages(prev => [...prev, { role: 'error', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractCodeBlocks = (content: string): string[] => {
    const matches = content.match(/```[\w]*\n([\s\S]*?)```/g);
    return matches?.map(m => m.replace(/```[\w]*\n/, '').replace(/```$/, '')) || [];
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-nexus-500" />
          <span className="font-semibold text-sm">NEXUS IA</span>
        </div>
        <div className="flex items-center gap-2">
          {lowCredits && <span title="Créditos baixos"><AlertTriangle className="w-4 h-4 text-red-400" /></span>}
          {credits !== null && (
            <span className={`text-xs font-mono ${lowCredits ? 'text-red-400' : 'text-slate-500'}`}>
              {credits.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-nexus-600' : msg.role === 'error' ? 'bg-red-600' : 'bg-purple-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user' ? 'bg-nexus-700 text-white' : 
              msg.role === 'error' ? 'bg-red-950 text-red-300 border border-red-800' : 
              'bg-slate-800 text-slate-200'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {msg.role === 'assistant' && extractCodeBlocks(msg.content).length > 0 && (
                <div className="mt-2 flex gap-2">
                  {extractCodeBlocks(msg.content).map((code, idx) => (
                    <button
                      key={idx}
                      onClick={() => onInsertCode?.(code)}
                      className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-nexus-400 transition"
                    >
                      Inserir código {idx + 1}
                    </button>
                  ))}
                </div>
              )}
              
              {msg.model && (
                <div className="mt-1 text-[10px] text-slate-500">via {msg.model}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400">
              A pensar...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-700">
        {selectedFile && (
          <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
            <span className="text-nexus-400">📄</span> Contexto: {selectedFile.name}
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunta algo... Usa @file para contexto"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none outline-none focus:border-nexus-500 transition"
            rows={1}
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-nexus-600 hover:bg-nexus-700 disabled:opacity-50 rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
