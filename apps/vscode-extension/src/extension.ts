import * as vscode from 'vscode';
import { ChatPanel } from './panels/chatPanel';
import { StatusBarManager } from './statusBar';

let statusBar: StatusBarManager;
let inlineProvider: vscode.Disposable | undefined;

const API_URL_DEFAULT = 'https://api-gateway-production-dccf.up.railway.app/v1';
const DASHBOARD_URL = 'https://web-production-6ef15.up.railway.app/dashboard';

function getConfig() {
  const config = vscode.workspace.getConfiguration('nexus');
  return {
    apiKey: config.get<string>('apiKey') || '',
    apiUrl: config.get<string>('apiUrl') || API_URL_DEFAULT,
    inlineEnabled: config.get<boolean>('inlineCompletion.enabled') ?? true,
    inlineDebounce: config.get<number>('inlineCompletion.debounce') ?? 400,
    inlineMaxLineLength: config.get<number>('inlineCompletion.maxLineLength') ?? 100,
  };
}

async function updateApiKey(apiKey: string) {
  const config = vscode.workspace.getConfiguration('nexus');
  await config.update('apiKey', apiKey, true);
}

export function activate(context: vscode.ExtensionContext) {
  const cfg = getConfig();

  statusBar = new StatusBarManager();
  statusBar.show();

  // ─── URI Handler (vscode://nexus-ia/auth?api_key=xxx) ───
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        if (uri.path === '/auth') {
          const params = new URLSearchParams(uri.query);
          const apiKey = params.get('api_key');
          if (apiKey) {
            updateApiKey(apiKey).then(() => {
              vscode.window.showInformationMessage(`NEXUS IA: Login efetuado com sucesso!`);
              statusBar.update('NEXUS IA: Pronto', '$(check)');
            });
          }
        }
      },
    })
  );

  // ─── Check API Key on startup ───
  if (!cfg.apiKey) {
    statusBar.update('NEXUS IA: Clica para fazer login', '$(account)');
  } else {
    statusBar.update('NEXUS IA: Pronto', '$(check)');
  }

  // ─── Login ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.login', async () => {
      const dashboardWithRedirect = `${DASHBOARD_URL}?vscode=true`;
      const choice = await vscode.window.showInformationMessage(
        'Faz login no browser (GitHub, Google ou Email). A API Key será enviada automaticamente para o VS Code.',
        'Abrir Browser',
        'Inserir API Key Manualmente'
      );

      if (choice === 'Abrir Browser') {
        vscode.env.openExternal(vscode.Uri.parse(dashboardWithRedirect));
      } else if (choice === 'Inserir API Key Manualmente') {
        const key = await vscode.window.showInputBox({
          prompt: 'Cole a tua API Key',
          password: true,
          ignoreFocusOut: true,
        });
        if (key) {
          await updateApiKey(key);
          vscode.window.showInformationMessage('NEXUS IA: API Key guardada!');
          statusBar.update('NEXUS IA: Pronto', '$(check)');
        }
      }
    })
  );

  // ─── Logout ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.logout', async () => {
      await updateApiKey('');
      vscode.window.showInformationMessage('NEXUS IA: Logout efetuado.');
      statusBar.update('NEXUS IA: Clica para fazer login', '$(account)');
      if (inlineProvider) {
        inlineProvider.dispose();
        inlineProvider = undefined;
      }
    })
  );

  // ─── Chat Panel ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.chat', () => {
      const c = getConfig();
      if (!c.apiKey) {
        vscode.window.showErrorMessage('Configura a API Key primeiro (NEXUS: Login)');
        return;
      }
      ChatPanel.createOrShow(context.extensionUri, c.apiKey, c.apiUrl);
    })
  );

  // ─── Explain code ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.explain', async () => {
      await runNexusAction('Explica este código detalhadamente:\n\n');
    })
  );

  // ─── Refactor ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.refactor', async () => {
      const result = await runNexusAction('Refatora este código para ser mais limpo, eficiente e seguro. Retorna APENAS o código refatorado:\n\n');
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

  // ─── Generate tests ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.generateTests', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const text = editor.document.getText();
      const language = editor.document.languageId;

      const tests = await runNexusAction(
        `Gera testes unitários completos para este código ${language}:\n\n${text}`
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

  // ─── Check status ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.status', async () => {
      const c = getConfig();
      if (!c.apiKey) {
        vscode.window.showErrorMessage('API Key não configurada');
        return;
      }

      try {
        const response = await fetch(`${c.apiUrl}/chat/status`, {
          headers: { 'X-API-Key': c.apiKey }
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

  // ─── Toggle Inline Completion ───
  context.subscriptions.push(
    vscode.commands.registerCommand('nexus.toggleInline', async () => {
      const config = vscode.workspace.getConfiguration('nexus');
      const current = config.get<boolean>('inlineCompletion.enabled') ?? true;
      await config.update('inlineCompletion.enabled', !current, true);
      vscode.window.showInformationMessage(`NEXUS IA: Autocompletar inline ${!current ? 'ativado' : 'desativado'}`);
      refreshInlineProvider();
    })
  );

  // ─── Inline Completion Provider ───
  function refreshInlineProvider() {
    if (inlineProvider) {
      inlineProvider.dispose();
      inlineProvider = undefined;
    }

    const c = getConfig();
    if (!c.inlineEnabled || !c.apiKey) return;

    let timeout: NodeJS.Timeout | undefined;

    inlineProvider = vscode.languages.registerInlineCompletionItemProvider(
      [{ pattern: '**' }],
      {
        async provideInlineCompletionItems(document, position, context, token) {
          if (timeout) clearTimeout(timeout);

          const lineText = document.lineAt(position).text;
          const prefix = lineText.slice(0, position.character);

          // Skip if line too long or only whitespace
          if (lineText.length > c.inlineMaxLineLength) return;
          if (!prefix.trim() && context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) return;

          return new Promise<vscode.InlineCompletionList | undefined>((resolve) => {
            timeout = setTimeout(async () => {
              if (token.isCancellationRequested) {
                resolve(undefined);
                return;
              }

              try {
                // Get surrounding context (previous 20 lines)
                const startLine = Math.max(0, position.line - 20);
                const contextLines = [];
                for (let i = startLine; i <= position.line; i++) {
                  contextLines.push(document.lineAt(i).text);
                }
                const fullContext = contextLines.join('\n');

                const response = await fetch(`${c.apiUrl}/chat/completions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': c.apiKey
                  },
                  body: JSON.stringify({
                    messages: [
                      { role: 'system', content: 'Assistente de código. Completa o código de forma concisa. Retorna APENAS o código a completar, sem explicações, sem markdown, sem comentários sobre o que fazes.' },
                      { role: 'user', content: `Completa o seguinte código:\n\n\`\`\`\n${fullContext}\n\`\`\`\n\nContinua a partir daqui (apenas o código):` }
                    ],
                    maxTokens: 256
                  }),
                  signal: token as any // VS Code cancellation token compatible with fetch
                });

                if (!response.ok) {
                  resolve(undefined);
                  return;
                }

                const data = await response.json() as any;
                let completion = data.content || '';

                // Clean up completion
                completion = completion.replace(/^```[\w]*\n?/m, '').replace(/\n?```$/m, '').trim();
                if (!completion) {
                  resolve(undefined);
                  return;
                }

                // Only suggest if it logically continues from prefix
                if (completion.toLowerCase().startsWith(prefix.toLowerCase().trim())) {
                  completion = completion.slice(prefix.trim().length).trimStart();
                }

                const item = new vscode.InlineCompletionItem(completion);
                item.range = new vscode.Range(position, position);
                resolve(new vscode.InlineCompletionList([item]));
              } catch {
                resolve(undefined);
              }
            }, c.inlineDebounce);
          });
        }
      }
    );
  }

  refreshInlineProvider();

  // Refresh provider when config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('nexus.inlineCompletion') || e.affectsConfiguration('nexus.apiKey')) {
        refreshInlineProvider();
      }
    })
  );

  vscode.commands.executeCommand('setContext', 'nexus:enabled', true);
}

async function runNexusAction(prompt: string): Promise<string | null> {
  const c = getConfig();
  if (!c.apiKey) {
    vscode.window.showErrorMessage('NEXUS IA: API Key não configurada. Usa "NEXUS: Login"');
    return null;
  }

  statusBar.update('NEXUS IA: A processar...', '$(loading~spin)');

  try {
    const response = await fetch(`${c.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': c.apiKey
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
  if (inlineProvider) inlineProvider.dispose();
}
