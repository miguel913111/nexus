'use client';

import { useCallback } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
  filename: string;
}

export default function CodeEditor({ content, language, onChange, filename }: CodeEditorProps) {
  const handleChange = useCallback((value: string | undefined) => {
    onChange(value || '');
  }, [onChange]);

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          readOnly: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16 },
        }}
        loading={
          <div className="flex items-center justify-center h-full text-slate-500">
            A carregar editor...
          </div>
        }
      />
    </div>
  );
}
