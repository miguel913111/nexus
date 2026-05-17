import * as vscode from 'vscode';
import * as path from 'path';

export class ChatPanel {
  public static currentPanel: ChatPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _apiKey: string;
  private _apiUrl: string;
  private _messages: Array<{role: string, content: string}> = [];

  public static createOrShow(extensionUri: vscode.Uri, apiKey: string, apiUrl: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ChatPanel.currentPanel) {
      ChatPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'nexusChat',
      'NEXUS IA Chat',
      column || vscode.ViewColumn.One,
      { 
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri]
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, apiKey, apiUrl);
  }

  private constructor(panel: vscode.WebviewPanel, apiKey: string, apiUrl: string) {
    this._panel = panel;
    this._apiKey = apiKey;
    this._apiUrl = apiUrl;
    this._panel.webview.html = this._getHtml();

    this._panel.onDidDispose(() => {
      ChatPanel.currentPanel = undefined;
    });

    this._panel.webview.onDidReceiveMessage(async message => {
      switch (message.type) {
        case 'sendMessage':
          await this._sendToApi(message.text);
          break;
        case 'getStatus':
          await this._getStatus();
          break;
        case 'insertFile':
          await this._insertFilePath();
          break;
      }
    });
  }

  private async _insertFilePath() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const relativePath = vscode.workspace.asRelativePath(editor.document.uri);
      this._panel.webview.postMessage({
        type: 'insertText',
        text: `@file ${relativePath} `
      });
    }
  }

  private async _sendToApi(text: string) {
    // Parse @file mentions
    const fileMentions = text.match(/@file\s+([^\s]+)/g) || [];
    let contextFiles: Array<{path: string, content: string}> = [];
    let cleanedText = text;

    for (const mention of fileMentions) {
      const filePath = mention.replace('@file', '').trim();
      try {
        const doc = await vscode.workspace.openTextDocument(
          path.join(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', filePath)
        );
        const content = doc.getText();
        contextFiles.push({ path: filePath, content });
        cleanedText = cleanedText.replace(mention, `[Ficheiro: ${filePath}]`);
      } catch {
        cleanedText = cleanedText.replace(mention, `[Ficheiro não encontrado: ${filePath}]`);
      }
    }

    // Build messages
    const messages: any[] = [
      { role: 'system', content: 'Assistente de código especializado. Responde em Português.' }
    ];

    if (contextFiles.length > 0) {
      const filesContext = contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
      messages.push({ role: 'system', content: `Ficheiros de contexto:\n${filesContext}` });
    }

    messages.push(...this._messages);
    messages.push({ role: 'user', content: cleanedText });

    try {
      const response = await fetch(`${this._apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this._apiKey
        },
        body: JSON.stringify({ messages, maxTokens: 4096 })
      });

      if (!response.ok) {
        const err = await response.json() as any;
        this._panel.webview.postMessage({
          type: 'error',
          text: err.error || 'Erro desconhecido',
          code: err.code
        });
        return;
      }

      const data = await response.json() as any;
      this._messages.push({ role: 'user', content: cleanedText });
      this._messages.push({ role: 'assistant', content: data.content });

      // Trim history
      if (this._messages.length > 40) {
        this._messages.splice(0, 2);
      }

      this._panel.webview.postMessage({
        type: 'response',
        text: data.content,
        credits: data.credits,
        model: data.model,
        alert: data.alerts?.lowCredits ? 'Créditos baixos! Renova em nexus-ia.ao' : null
      });
    } catch (err) {
      this._panel.webview.postMessage({
        type: 'error',
        text: (err as any).message
      });
    }
  }

  private async _getStatus() {
    try {
      const response = await fetch(`${this._apiUrl}/chat/status`, {
        headers: { 'X-API-Key': this._apiKey }
      });
      const data = await response.json() as any;
      
      this._panel.webview.postMessage({
        type: 'status',
        plan: data.user.plan,
        credits: data.user.credits.remaining,
        total: data.user.credits.total,
        percentage: data.alerts?.creditsPercentage || 100,
        alert: data.alerts?.lowCredits
      });
    } catch {
      // Ignore
    }
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          padding: 0; 
          margin: 0;
          background: var(--vscode-editor-background); 
          color: var(--vscode-editor-foreground);
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        #header { 
          padding: 12px 16px; 
          border-bottom: 1px solid var(--vscode-panel-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        #header h2 { margin: 0; font-size: 14px; }
        #credits { font-size: 11px; }
        #credits.alert { color: #f44336; font-weight: bold; }
        #chat { 
          flex: 1; 
          overflow-y: auto; 
          padding: 16px; 
        }
        .message { 
          margin: 8px 0; 
          padding: 10px 14px; 
          border-radius: 8px; 
          font-size: 13px;
          line-height: 1.5;
          max-width: 90%;
          word-wrap: break-word;
        }
        .user { 
          background: var(--vscode-button-background); 
          color: var(--vscode-button-foreground);
          margin-left: auto; 
        }
        .assistant { 
          background: var(--vscode-editor-inactiveSelectionBackground); 
          margin-right: auto;
        }
        .error {
          background: var(--vscode-inputValidationErrorBackground);
          color: var(--vscode-inputValidationErrorForeground);
          margin-right: auto;
        }
        .alert-banner {
          background: #f44336;
          color: white;
          padding: 8px 16px;
          font-size: 12px;
          text-align: center;
          display: none;
        }
        .alert-banner.show { display: block; }
        .message pre {
          background: var(--vscode-textCodeBlock-background);
          padding: 8px;
          border-radius: 4px;
          overflow-x: auto;
          margin: 8px 0;
        }
        .message code {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
        }
        .message p { margin: 0 0 8px 0; }
        .message p:last-child { margin-bottom: 0; }
        #input-area {
          padding: 12px 16px;
          border-top: 1px solid var(--vscode-panel-border);
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }
        #input { 
          flex: 1;
          padding: 8px 12px; 
          background: var(--vscode-input-background); 
          color: var(--vscode-input-foreground); 
          border: 1px solid var(--vscode-input-border);
          border-radius: 4px;
          font-size: 13px;
          resize: none;
          min-height: 36px;
          max-height: 120px;
          font-family: inherit;
        }
        #input:focus { outline: none; border-color: var(--vscode-focusBorder); }
        .btn-icon {
          padding: 8px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
        }
        .btn-icon:hover { background: var(--vscode-button-hoverBackground); }
        button { 
          padding: 8px 16px; 
          background: var(--vscode-button-background); 
          color: var(--vscode-button-foreground); 
          border: none; 
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
        .typing { color: var(--vscode-descriptionForeground); font-style: italic; }
        .file-tag {
          background: var(--vscode-badge-background);
          color: var(--vscode-badge-foreground);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          margin-right: 4px;
        }
        .model-badge {
          font-size: 10px;
          color: var(--vscode-descriptionForeground);
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="alert-banner" id="alert-banner">
        ⚠️ Créditos baixos! <a href="https://nexus-ia.ao/planos" style="color: white; text-decoration: underline;">Renova agora</a>
      </div>
      <div id="header">
        <h2>🤖 NEXUS IA</h2>
        <span id="credits">A carregar...</span>
      </div>
      <div id="chat"></div>
      <div id="input-area">
        <button class="btn-icon" onclick="insertFile()" title="Inserir ficheiro atual">📄</button>
        <textarea id="input" rows="1" placeholder="Pergunta algo... Usa @file para contexto"></textarea>
        <button onclick="send()">Enviar</button>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        const chat = document.getElementById('chat');
        const input = document.getElementById('input');
        const creditsEl = document.getElementById('credits');
        const alertBanner = document.getElementById('alert-banner');
        
        // Request status on load
        vscode.postMessage({ type: 'getStatus' });
        
        function escapeHtml(text) {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML;
        }
        
        function formatMessage(text) {
          // Simple markdown
          let html = escapeHtml(text);
          html = html.replace(/\n/g, '<br>');
          
          // Code blocks
          html = html.replace(/\`\`\`(\w+)?\n([\s\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>');
          html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
          
          // Bold
          html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
          
          return html;
        }
        
        function addMessage(text, type, extra = {}) {
          const div = document.createElement('div');
          div.className = 'message ' + type;
          
          if (type === 'assistant') {
            div.innerHTML = formatMessage(text);
            if (extra.model) {
              const badge = document.createElement('div');
              badge.className = 'model-badge';
              badge.textContent = 'via ' + extra.model;
              div.appendChild(badge);
            }
          } else if (type === 'error') {
            div.textContent = text;
          } else {
            div.textContent = text;
          }
          
          chat.appendChild(div);
          chat.scrollTop = chat.scrollHeight;
        }
        
        function setTyping(typing) {
          let el = document.getElementById('typing-indicator');
          if (typing) {
            if (!el) {
              el = document.createElement('div');
              el.id = 'typing-indicator';
              el.className = 'message assistant typing';
              el.textContent = 'NEXUS IA está a pensar...';
              chat.appendChild(el);
              chat.scrollTop = chat.scrollHeight;
            }
          } else if (el) {
            el.remove();
          }
        }
        
        function send() {
          const text = input.value.trim();
          if (!text) return;
          addMessage(text, 'user');
          setTyping(true);
          vscode.postMessage({ type: 'sendMessage', text });
          input.value = '';
          input.style.height = 'auto';
        }
        
        function insertFile() {
          vscode.postMessage({ type: 'insertFile' });
        }
        
        // Auto-resize textarea
        input.addEventListener('input', function() {
          this.style.height = 'auto';
          this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
        
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        });
        
        window.addEventListener('message', event => {
          const msg = event.data;
          
          if (msg.type === 'response') {
            setTyping(false);
            addMessage(msg.text, 'assistant', { model: msg.model });
            if (msg.credits) {
              creditsEl.textContent = msg.credits.remaining.toLocaleString() + ' créditos';
            }
            if (msg.alert) {
              alertBanner.querySelector('a').textContent = msg.alert;
              alertBanner.classList.add('show');
            }
          }
          
          if (msg.type === 'error') {
            setTyping(false);
            addMessage(msg.text + (msg.code ? ' [' + msg.code + ']' : ''), 'error');
          }
          
          if (msg.type === 'status') {
            const pct = msg.percentage;
            creditsEl.textContent = msg.credits.toLocaleString() + ' / ' + msg.total.toLocaleString() + ' (' + pct + '%)';
            if (pct < 10) {
              creditsEl.classList.add('alert');
              alertBanner.classList.add('show');
            }
          }
          
          if (msg.type === 'insertText') {
            input.value += msg.text;
            input.focus();
          }
        });
      </script>
    </body>
    </html>`;
  }
}
