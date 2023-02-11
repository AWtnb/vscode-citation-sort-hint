import * as vscode from "vscode";

import { Entry } from "./parser";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

class Noise {
  readonly deco: vscode.TextEditorDecorationType;
  applied: boolean;

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

  clearDeco(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }

  blur(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, this.getRanges(editor));
    this.applied = true;
  }
}

const SortNoise = new Noise(0.4);

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.focus", (editor: vscode.TextEditor) => {
      SortNoise.blur(editor);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.clear", (editor: vscode.TextEditor) => {
      SortNoise.clearDeco(editor);
    })
  );
}

vscode.workspace.onDidChangeTextDocument(() => {
  if (SortNoise.applied) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      SortNoise.blur(editor);
    }
  }
});

export function deactivate() {}
