import * as vscode from "vscode";

import { Entry } from "./parser";

const isASCII = (s: string): boolean => {
  return Boolean(s.match(/[\x00-\x7f]/));
};

class SortNoise {
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

  resetBlur(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, []);
    this.applied = false;
  }

  blur(editor: vscode.TextEditor) {
    editor.setDecorations(this.deco, this.getRanges(editor));
    this.applied = true;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const sn = new SortNoise(0.4);

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.focus", (editor: vscode.TextEditor) => {
      if (sn.applied) {
        sn.resetBlur(editor);
      } else {
        sn.blur(editor);
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("citation-sort-hint.reset", (editor: vscode.TextEditor) => {
      sn.resetBlur(editor);
    })
  );

  vscode.window.onDidChangeActiveTextEditor(() => {
    if (sn.applied) {
      sn.applied = false;
    }
  });

  vscode.workspace.onDidChangeTextDocument(() => {
    if (sn.applied) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        sn.blur(editor);
      }
    }
  });
}

export function deactivate() {}
