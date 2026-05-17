'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Code2, Layout, PanelLeftClose, PanelLeftOpen, Save, Play } from 'lucide-react';
import GitHubImport from '@/components/editor/GitHubImport';
import FileExplorer, { FileNode, findFileById, updateFileContent } from '@/components/editor/FileExplorer';
import ChatPanel from '@/components/editor/ChatPanel';

// Dynamic import to avoid SSR issues with Monaco
const CodeEditor = dynamic(() => import('@/components/editor/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500">
      A carregar editor...
    </div>
  ),
});

export default function EditorPage() {
  const [activeFileId, setActiveFileId] = useState<string>('index');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [output, setOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState(false);

  const activeFile = findFileById(files, activeFileId) || {
    id: 'index',
    name: 'index.ts',
    type: 'file',
    language: 'typescript',
    content: '// Seleciona um ficheiro para começar',
  };

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === 'file') {
      setActiveFileId(file.id);
    }
  }, []);

  const handleContentChange = useCallback((value: string) => {
    setFiles(prev => updateFileContent(prev, activeFileId, value));
  }, [activeFileId]);

  const handleInsertCode = useCallback((code: string) => {
    setFiles(prev => updateFileContent(prev, activeFileId, 
      (findFileById(prev, activeFileId)?.content || '') + '\n\n' + code
    ));
  }, [activeFileId]);

  const runCode = () => {
    if (!activeFile.content) return;
    
    if (activeFile.name.endsWith('.js') || activeFile.name.endsWith('.ts')) {
      try {
        // Simple console capture for JS
        const logs: string[] = [];
        const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
          error: (...args: any[]) => logs.push('[ERRO] ' + args.map(a => String(a)).join(' ')),
        };
        
        // Very basic eval (not safe for production!)
        const func = new Function('console', activeFile.content);
        func(mockConsole);
        
        setOutput(logs.join('\n') || '(sem output)');
        setShowOutput(true);
      } catch (err: any) {
        setOutput(`Erro: ${err.message}`);
        setShowOutput(true);
      }
    } else {
      setOutput('Só é possível executar ficheiros JavaScript/TypeScript.');
      setShowOutput(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <Code2 className="w-5 h-5 text-nexus-500" />
            <span className="font-semibold text-sm">NEXUS IDE</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded transition"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <GitHubImport onImport={(importedFiles) => {
            setFiles(importedFiles);
            const firstFile = importedFiles[0]?.children?.find((c: any) => c.type === 'file');
            if (firstFile) setActiveFileId(firstFile.id);
          }} />
          <span className="text-xs text-slate-500 px-3 py-1 bg-slate-800 rounded">
            {activeFile.name}
          </span>
          <button
            onClick={runCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded text-sm transition"
          >
            <Play className="w-3.5 h-3.5" />
            Executar
          </button>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition ${
              chatOpen ? 'bg-nexus-700 text-white' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            Chat
          </button>
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition">
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-56 bg-slate-900 border-r border-slate-700 flex-shrink-0">
            <FileExplorer
              onSelectFile={handleFileSelect}
              activeFileId={activeFileId}
              onFilesChange={setFiles}
            />
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="h-9 bg-slate-900 border-b border-slate-700 flex items-center">
            <div className="px-3 py-1.5 bg-slate-800 border-t-2 border-nexus-500 text-sm flex items-center gap-2">
              <span className="truncate">{activeFile.name}</span>
              <span className="text-slate-500 text-xs">●</span>
            </div>
          </div>

          {/* Editor + Output */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className={`flex-1 min-h-0 ${showOutput ? 'h-2/3' : ''}`}>
              <CodeEditor
                content={activeFile.content || ''}
                language={activeFile.language || 'typescript'}
                onChange={handleContentChange}
                filename={activeFile.name}
              />
            </div>
            
            {showOutput && (
              <div className="h-1/3 border-t border-slate-700 bg-slate-900 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Terminal</span>
                  <button onClick={() => setShowOutput(false)} className="text-xs text-slate-500 hover:text-white">✕</button>
                </div>
                <pre className="flex-1 p-4 text-sm font-mono text-slate-300 overflow-auto">
                  {output}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {chatOpen && (
          <div className="w-96 flex-shrink-0">
            <ChatPanel
              selectedFile={activeFile.type === 'file' ? { name: activeFile.name, content: activeFile.content || '' } : null}
              onInsertCode={handleInsertCode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
