import * as vscode from "vscode";

import { Entry } from "./parser";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

class Spotter {
  readonly deco: vscode.TextEditorDecorationType;
  private applied: boolean;

  constructor(opacity: number) {
    this.deco = vscode.window.createTextEditorDecorationType({
      opacity: `${opacity} !important`,
    });
    this.applied = false;
  }

  private getRanges(editor: vscode.TextEditor): vscode.Range[] {
    const found: vscode.Range[] = [];
    for (let i = 0; i < editor.document.lineCount; i++) {
      const line = editor.document.lineAt(i);
      if (isASCII(line.text.trimStart().charAt(0))) {
        const ent = new Entry(line);
        ent.getNoiseRanges().forEach((n) => found.push(n));
      }
    }
    return found;
  }

  isApplied(): boolean {
    return this.applied;
  }

  reset(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }

  apply(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, this.getRanges(editor));
    this.applied = true;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const SPOTTER = new Spotter(0.4);

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.focus", (editor: vscode.TextEditor) => {
      if (SPOTTER.isApplied()) {
        SPOTTER.reset(editor);
      } else {
        SPOTTER.apply(editor);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.reset", (editor: vscode.TextEditor) => {
      SPOTTER.reset(editor);
    })
  );

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (SPOTTER.isApplied() && editor) {
      SPOTTER.reset(editor);
    }
  });

  // `vscode.window.onDidChangeActiveTextEditor` cannot update decoration on realtime.
  vscode.workspace.onDidChangeTextDocument(() => {
    if (SPOTTER.isApplied()) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        SPOTTER.apply(editor);
      }
    }
  });
}

export function deactivate() {}
