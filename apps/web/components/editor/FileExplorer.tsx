'use client';

import { useState, useEffect } from 'react';
import { FileCode, Folder, FolderOpen, Plus, Trash2, FileText } from 'lucide-react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

const DEFAULT_FILES: FileNode[] = [
  {
    id: 'root',
    name: 'projeto',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        language: 'markdown',
        content: '# Meu Projeto\n\nProjeto criado com NEXUS IA.',
      },
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'index',
            name: 'index.ts',
            type: 'file',
            language: 'typescript',
            content: `// Bem-vindo ao NEXUS IA Editor\n// Pede à IA para gerar código usando o chat à direita\n\nconsole.log("Olá, Angola! 🇦🇴");`,
          },
          {
            id: 'utils',
            name: 'utils.ts',
            type: 'file',
            language: 'typescript',
            content: `export function saudacao(nome: string): string {\n  return \`Olá, \${nome}!\`;\n}`,
          },
        ],
      },
      {
        id: 'package',
        name: 'package.json',
        type: 'file',
        language: 'json',
        content: `{\n  "name": "meu-projeto",\n  "version": "1.0.0"\n}`,
      },
    ],
  },
];

interface FileExplorerProps {
  onSelectFile: (file: FileNode) => void;
  activeFileId: string | null;
  onFilesChange?: (files: FileNode[]) => void;
}

export default function FileExplorer({ onSelectFile, activeFileId, onFilesChange }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>(DEFAULT_FILES);
  const [newFileName, setNewFileName] = useState('');
  const [creatingIn, setCreatingIn] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('nexus_files');
    if (saved) {
      try {
        setFiles(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('nexus_files', JSON.stringify(files));
    onFilesChange?.(files);
  }, [files]);

  const toggleFolder = (node: FileNode) => {
    if (node.type === 'folder') {
      node.isOpen = !node.isOpen;
      setFiles([...files]);
    }
  };

  const addFile = (parentId: string) => {
    if (!newFileName.trim()) return;
    
    const newFile: FileNode = {
      id: `file_${Date.now()}`,
      name: newFileName,
      type: 'file',
      language: getLanguage(newFileName),
      content: '',
    };

    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
          return { ...node, children: [...(node.children || []), newFile], isOpen: true };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };

    setFiles(updateTree(files));
    setNewFileName('');
    setCreatingIn(null);
  };

  const deleteFile = (fileId: string) => {
    const removeFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(n => n.id !== fileId).map(n => ({
        ...n,
        children: n.children ? removeFromTree(n.children) : undefined,
      }));
    };
    setFiles(removeFromTree(files));
  };

  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm hover:bg-slate-800 transition select-none ${
            node.type === 'file' && activeFileId === node.id ? 'bg-nexus-900/50 text-nexus-400' : 'text-slate-400'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') toggleFolder(node);
            else onSelectFile(node);
          }}
        >
          {node.type === 'folder' ? (
            node.isOpen ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-500" />
          ) : (
            getFileIcon(node.name)
          )}
          <span className="truncate">{node.name}</span>
          {node.type === 'file' && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteFile(node.id); }}
              className="ml-auto opacity-0 group-hover:opacity-100 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {node.type === 'folder' && node.isOpen && node.children && (
          <div>
            {renderTree(node.children, depth + 1)}
            {creatingIn === node.id && (
              <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>
                <FileCode className="w-4 h-4 text-slate-500" />
                <input
                  autoFocus
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addFile(node.id);
                    if (e.key === 'Escape') setCreatingIn(null);
                  }}
                  onBlur={() => newFileName && addFile(node.id)}
                  className="bg-slate-800 text-white text-sm px-2 py-0.5 rounded w-32 outline-none border border-nexus-600"
                  placeholder="nome.ts"
                />
              </div>
            )}
            <button
              onClick={() => setCreatingIn(node.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-300 transition"
              style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
            >
              <Plus className="w-3 h-3" /> Novo ficheiro
            </button>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
        Explorador
        <button onClick={() => setCreatingIn('root')} className="hover:text-white transition">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {renderTree(files)}
    </div>
  );
}

function getFileIcon(name: string) {
  if (name.endsWith('.ts') || name.endsWith('.tsx')) return <FileCode className="w-4 h-4 text-blue-400" />;
  if (name.endsWith('.js') || name.endsWith('.jsx')) return <FileCode className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith('.json')) return <FileCode className="w-4 h-4 text-orange-400" />;
  if (name.endsWith('.md')) return <FileText className="w-4 h-4 text-slate-400" />;
  if (name.endsWith('.css')) return <FileCode className="w-4 h-4 text-cyan-400" />;
  if (name.endsWith('.html')) return <FileCode className="w-4 h-4 text-red-400" />;
  return <FileCode className="w-4 h-4 text-slate-500" />;
}

function getLanguage(filename: string): string {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.py')) return 'python';
  return 'plaintext';
}

export function findFileById(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findFileById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateFileContent(nodes: FileNode[], id: string, content: string): FileNode[] {
  return nodes.map(node => {
    if (node.id === id) return { ...node, content };
    if (node.children) return { ...node, children: updateFileContent(node.children, id, content) };
    return node;
  });
}
