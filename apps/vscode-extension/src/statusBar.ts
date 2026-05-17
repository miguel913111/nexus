import * as vscode from 'vscode';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'nexus.status';
  }

  show() {
    this.statusBarItem.show();
  }

  update(text: string, icon?: string) {
    this.statusBarItem.text = icon ? `${icon} ${text}` : text;
    this.statusBarItem.tooltip = 'Clica para ver estado da conta NEXUS IA';
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}
