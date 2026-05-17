'use client';

import { useState } from 'react';
import { Github, X, FolderTree, FileCode, Loader2 } from 'lucide-react';
import { FileNode } from './FileExplorer';

interface GitHubImportProps {
  onImport: (files: FileNode[]) => void;
}

interface GitHubTreeItem {
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  url?: string;
}

export default function GitHubImport({ onImport }: GitHubImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<GitHubTreeItem[] | null>(null);

  function parseRepoUrl(url: string): { owner: string; repo: string; branch?: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, ''), branch: match[3] || 'main' };
  }

  async function fetchRepoTree() {
    setError('');
    setPreview(null);

    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError('URL inválida. Usa: https://github.com/owner/repo');
      return;
    }

    setLoading(true);
    try {
      const { owner, repo, branch } = parsed;
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
      if (!res.ok) throw new Error('Repositório não encontrado ou privado');
      const data = await res.json();
      if (!data.tree || !Array.isArray(data.tree)) throw new Error('Estrutura inválida');

      // Filter out very large repos
      const items = data.tree.slice(0, 100) as GitHubTreeItem[];
      setPreview(items);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar repositório');
    } finally {
      setLoading(false);
    }
  }

  function buildFileTree(items: GitHubTreeItem[]): FileNode[] {
    const root: FileNode = { id: 'gh-root', name: repoUrl.split('/').pop() || 'repo', type: 'folder', isOpen: true, children: [] };
    const map = new Map<string, FileNode>();
    map.set('', root);

    for (const item of items) {
      if (item.type === 'tree') continue; // skip empty dirs, create on demand
      const parts = item.path.split('/');
      const fileName = parts.pop()!;
      let parent = root;
      let currentPath = '';

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!map.has(currentPath)) {
          const newFolder: FileNode = {
            id: `gh-${currentPath}`,
            name: part,
            type: 'folder',
            isOpen: true,
            children: [],
          };
          map.set(currentPath, newFolder);
          parent.children = parent.children || [];
          parent.children.push(newFolder);
        }
        parent = map.get(currentPath)!;
      }

      const fileNode: FileNode = {
        id: `gh-${item.path}`,
        name: fileName,
        type: 'file',
        language: getLanguage(fileName),
        content: `// Ficheiro importado do GitHub: ${item.path}\n// Carrega o conteúdo real ao fazer fetch do raw`,
      };
      parent.children = parent.children || [];
      parent.children.push(fileNode);
    }

    return [root];
  }

  function handleImport() {
    if (!preview) return;
    const tree = buildFileTree(preview);
    onImport(tree);
    setIsOpen(false);
    setRepoUrl('');
    setPreview(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition"
        title="Importar do GitHub"
      >
        <Github className="w-3.5 h-3.5" />
        Import from GitHub
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold">Importar do GitHub</h2>
              </div>
              <button onClick={() => { setIsOpen(false); setPreview(null); setError(''); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">URL do Repositório</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-nexus-500 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && fetchRepoTree()}
                  />
                  <button
                    onClick={fetchRepoTree}
                    disabled={loading || !repoUrl}
                    className="px-4 py-2 bg-nexus-600 hover:bg-nexus-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Carregar'}
                  </button>
                </div>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              </div>

              {preview && (
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm text-slate-300">
                    <FolderTree className="w-4 h-4 text-nexus-500" />
                    <span>Pré-visualização ({preview.length} ficheiros)</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg p-3 space-y-1">
                    {preview.filter(i => i.type === 'blob').slice(0, 50).map((item) => (
                      <div key={item.path} className="flex items-center gap-2 text-sm text-slate-400">
                        <FileCode className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">{item.path}</span>
                      </div>
                    ))}
                    {preview.filter(i => i.type === 'blob').length > 50 && (
                      <p className="text-xs text-slate-500">... e mais {preview.filter(i => i.type === 'blob').length - 50} ficheiros</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => { setIsOpen(false); setPreview(null); setError(''); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={!preview}
                className="px-4 py-2 bg-nexus-600 hover:bg-nexus-700 disabled:opacity-50 rounded-lg text-sm font-medium transition"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getLanguage(filename: string): string {
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.go')) return 'go';
  if (filename.endsWith('.rs')) return 'rust';
  if (filename.endsWith('.java')) return 'java';
  return 'plaintext';
}
