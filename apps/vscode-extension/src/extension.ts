import * as vscode from 'vscode';
import { ChatPanel } from './panels/chatPanel';
import { StatusBarManager } from './statusBar';

let statusBar: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
  // Load config
  const config = vscode.workspace.getConfiguration('nexus');
  const apiKey = config.get<string>('apiKey');
  const apiUrl = config.get<string>('apiUrl') || 'https://api-gateway-production-dccf.up.railway.app/v1';

  statusBar = new StatusBarManager();
  statusBar.show();

  if (!apiKey) {
    vscode.window.showWarningMessage(
      'NEXUS IA: Configura a tua API Key em Settings > Extensions > NEXUS IA',
      'Abrir Settings'
    ).then(selection => {
      if (selection === 'Abrir Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'nexus');
      }
    });
    statusBar.update('NEXUS IA: Sem API Key', '$(warning)');
  } else {
    statusBar.update('NEXUS IA: Pronto', '$(check)');
  }

  // Chat Panel
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.chat', () => {
      if (!apiKey) {
        vscode.window.showErrorMessage('Configura a API Key primeiro');
        return;
      }
      ChatPanel.createOrShow(context.extensionUri, apiKey, apiUrl);
    })
  );

  // Explain code
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.explain', async () => {
      await runNexusAction('Explica este código detalhadamente:\n\n', apiKey, apiUrl);
    })
  );

  // Refactor
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.refactor', async () => {
      const result = await runNexusAction('Refatora este código para ser mais limpo, eficiente e seguro. Retorna APENAS o código refatorado:\n\n', apiKey, apiUrl);
      if (result) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          await editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, result);
          });
        }
      }
    })
  );

  // Generate tests
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.generateTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      
      const text = editor.document.getText();
      const language = editor.document.languageId;
      
      const tests = await runNexusAction(
        `Gera testes unitários completos para este código ${language}:\n\n${text}`,
        apiKey, apiUrl
      );
      
      if (tests) {
        const doc = await vscode.workspace.openTextDocument({
          content: tests,
          language: language === 'typescript' ? 'typescript' : 'javascript'
        });
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
      }
    })
  );

  // Check status
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.status', async () => {
      if (!apiKey) {
        vscode.window.showErrorMessage('API Key não configurada');
        return;
      }
      
      try {
        const response = await fetch(`${apiUrl}/chat/status`, {
          headers: { 'X-API-Key': apiKey }
        });
        const data = await response.json() as any;
        
        const credits = data.user.credits;
        const percent = Math.round((credits.used / credits.total) * 100);
        
        vscode.window.showInformationMessage(
          `NEXUS IA | Plano: ${data.user.plan.toUpperCase()} | Créditos: ${credits.remaining.toLocaleString()} (${percent}% usado)`
        );
        
        statusBar.update(`NEXUS: ${credits.remaining.toLocaleString()} créditos`, '$(check)');
      } catch (err) {
        vscode.window.showErrorMessage(`NEXUS IA Erro: ${(err as any).message}`);
        statusBar.update('NEXUS IA: Erro', '$(error)');
      }
    })
  );

  vscode.commands.executeCommand('setContext', 'nexus:enabled', true);
}

async function runNexusAction(prompt: string, apiKey: string | undefined, apiUrl: string): Promise<string | null> {
  if (!apiKey) {
    vscode.window.showErrorMessage('NEXUS IA: API Key não configurada. Vai a Settings > NEXUS IA');
    return null;
  }

  statusBar.update('NEXUS IA: A processar...', '$(loading~spin)');

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Assistente de código especializado. Responde em Português.' },
          { role: 'user', content: prompt }
        ],
        maxTokens: 4096
      })
    });

    if (!response.ok) {
      const err = await response.json() as any;
      if (err.code === 'INSUFFICIENT_CREDITS') {
        vscode.window.showWarningMessage(`NEXUS IA: Créditos insuficientes. Restantes: ${err.creditsRemaining}`);
      } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
        vscode.window.showWarningMessage('NEXUS IA: Rate limit excedido. Aguarda um momento.');
      } else {
        vscode.window.showErrorMessage(`NEXUS IA: ${err.error}`);
      }
      statusBar.update('NEXUS IA: Erro', '$(error)');
      return null;
    }

    const data = await response.json() as any;
    statusBar.update('NEXUS IA: Pronto', '$(check)');
    
    if (data.credits) {
      statusBar.update(`NEXUS: ${data.credits.remaining.toLocaleString()} créditos`, '$(check)');
    }
    
    return data.content;
  } catch (err) {
    vscode.window.showErrorMessage(`NEXUS IA Erro: ${(err as any).message}`);
    statusBar.update('NEXUS IA: Erro', '$(error)');
    return null;
  }
}

export function deactivate() {
  statusBar.dispose();
}
