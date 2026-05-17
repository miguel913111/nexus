import fs from 'fs';
import path from 'path';
import { ChatMessage } from '@nexus-ia/types';

export interface ParsedContext {
  messages: ChatMessage[];
  files: Array<{ path: string; content: string }>;
}

/**
 * Parse user input looking for @file and @codebase mentions
 * @file path/to/file.ts → reads file content
 * @codebase → placeholder for future full project indexing
 * @web url → fetch web content (future)
 */
export function parseContext(
  input: string,
  basePath: string = process.cwd()
): { cleanedInput: string; contextFiles: Array<{ path: string; content: string }> } {
  const contextFiles: Array<{ path: string; content: string }> = [];
  const fileMentions = input.match(/@file\s+([^\s]+)/g) || [];
  
  let cleanedInput = input;

  for (const mention of fileMentions) {
    const filePath = mention.replace('@file', '').trim();
    const fullPath = path.resolve(basePath, filePath);
    
    // Security: only allow reading files within basePath
    if (!fullPath.startsWith(path.resolve(basePath))) {
      cleanedInput = cleanedInput.replace(mention, `[Ficheiro bloqueado: ${filePath}]`);
      continue;
    }

    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        // Limit file size to 50KB
        const truncated = content.length > 50000 ? content.slice(0, 50000) + '\n... (truncado)' : content;
        contextFiles.push({ path: filePath, content: truncated });
        cleanedInput = cleanedInput.replace(mention, `[Ficheiro: ${filePath}]`);
      } else {
        cleanedInput = cleanedInput.replace(mention, `[Ficheiro não encontrado: ${filePath}]`);
      }
    } catch {
      cleanedInput = cleanedInput.replace(mention, `[Erro ao ler: ${filePath}]`);
    }
  }

  // Handle @codebase (placeholder for future vector search)
  if (cleanedInput.includes('@codebase')) {
    cleanedInput = cleanedInput.replace('@codebase', '[Contexto do projeto inteiro - em breve]');
  }

  // Handle @web (placeholder)
  const webMentions = cleanedInput.match(/@web\s+(https?:\/\/[^\s]+)/g) || [];
  for (const mention of webMentions) {
    const url = mention.replace('@web', '').trim();
    cleanedInput = cleanedInput.replace(mention, `[Web: ${url}]`);
  }

  return { cleanedInput, contextFiles };
}

export function buildMessagesWithContext(
  systemPrompt: string,
  cleanedInput: string,
  contextFiles: Array<{ path: string; content: string }>,
  history: ChatMessage[] = []
): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }];

  if (contextFiles.length > 0) {
    const filesContext = contextFiles
      .map(f => `--- ${f.path} ---\n${f.content}`)
      .join('\n\n');
    
    messages.push({
      role: 'system',
      content: `Ficheiros de contexto:\n${filesContext}`
    });
  }

  messages.push(...history);
  messages.push({ role: 'user', content: cleanedInput });

  return messages;
}

/**
 * Detect if input is asking about a specific file without @file
 * e.g. "o que faz o ficheiro server.ts?" → suggests @file
 */
export function suggestFileReferences(input: string, availableFiles: string[]): string[] {
  const suggestions: string[] = [];
  const words = input.toLowerCase().split(/\s+/);
  
  for (const file of availableFiles) {
    const basename = path.basename(file).toLowerCase();
    if (words.some(w => basename.includes(w) || w.includes(basename.replace(/\.\w+$/, '')))) {
      suggestions.push(file);
    }
  }
  
  return suggestions.slice(0, 3);
}
