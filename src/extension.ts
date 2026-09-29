import * as vscode from 'vscode';
import { PreviewPanel } from './previewPanel';

// Some files (e.g. SKILL.md, AGENTS.md) get claimed by other extensions and report
// a non-markdown languageId, even though they are markdown by extension. Accept both.
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mkd', '.mdwn', '.mdown', '.markdown', '.mdx']);

function isMarkdownDoc(doc: vscode.TextDocument): boolean {
  if (doc.languageId === 'markdown') return true;
  const ext = doc.fileName.slice(doc.fileName.lastIndexOf('.')).toLowerCase();
  return MARKDOWN_EXTENSIONS.has(ext);
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownAppealing.openPreview', async (uri?: vscode.Uri) => {
      let doc: vscode.TextDocument | undefined;
      if (uri instanceof vscode.Uri) {
        doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: false });
      } else {
        doc = vscode.window.activeTextEditor?.document;
      }
      if (!doc || !isMarkdownDoc(doc)) {
        vscode.window.showWarningMessage('Open a markdown file first.');
        return;
      }
      PreviewPanel.createOrShow(context, doc);
    }),

    vscode.commands.registerCommand('markdownAppealing.switchTheme', async () => {
      const panel = PreviewPanel.getActive();
      if (!panel) {
        vscode.window.showWarningMessage('Open a preview first.');
        return;
      }
      const themes = ['clean', 'editorial', 'terminal'];
      const picked = await vscode.window.showQuickPick(themes, {
        placeHolder: 'Select a theme',
      });
      if (picked) {
        panel.setTheme(picked);
      }
    }),

    vscode.commands.registerCommand('markdownAppealing.toggleDarkMode', () => {
      const panel = PreviewPanel.getActive();
      if (!panel) {
        vscode.window.showWarningMessage('Open a preview first.');
        return;
      }
      panel.toggleDarkMode();
    }),

    vscode.commands.registerCommand('markdownAppealing.toggleFullscreen', () => {
      const panel = PreviewPanel.getActive();
      if (!panel) {
        vscode.window.showWarningMessage('Open a preview first.');
        return;
      }
      panel.toggleFullscreen();
    })
  );

  // Re-render all open previews when extension font settings change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('markdownAppealing')) {
        PreviewPanel.updateAll();
      }
    })
  );

  // Live update only the preview that shows this document
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (!isMarkdownDoc(e.document)) return;
      const panel = PreviewPanel.getByUri(e.document.uri);
      if (panel) {
        panel.update(e.document);
      }
    })
  );
}

export function deactivate() {}
