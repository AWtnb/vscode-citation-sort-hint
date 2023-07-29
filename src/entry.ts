import * as vscode from "vscode";
import { Token } from "./token";

export class Entry {
  private readonly lineText: string;
  private readonly lineNum: number;
  readonly tokens: Token[];

  constructor(line: vscode.TextLine) {
    this.lineText = line.text;
    this.lineNum = line.lineNumber;
    let offset = 0;
    this.tokens = this.lineText.split(" ").map((elem: string) => {
      const token = new Token(elem, offset);
      offset += elem.length + 1;
      return token;
    });
  }

  private getFocusTargets(): Token[] {
    return this.tokens.filter((token, idx): boolean => {
      if (token.isYear) {
        return true;
      }
      if (token.isAbbreviation || token.isAmpersand || token.startsWithLower) {
        return false;
      }
      const next = this.tokens[idx + 1];
      const last = this.tokens[idx - 1];
      return (next && next.isAbbreviation) || (last && last.isAbbreviation);
    });
  }

  private makeRange(startIdx: number, endIdx: number): vscode.Range {
    const s = new vscode.Position(this.lineNum, startIdx);
    const e = new vscode.Position(this.lineNum, endIdx);
    return new vscode.Range(s, e);
  }

  getInterFocusRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const focus = this.getFocusTargets();
    const head = new Token("", 0);
    focus.unshift(head);
    const tail = new Token("", this.lineText.length);
    focus.push(tail);
    focus.forEach((token, idx) => {
      if (idx < 1) {
        return;
      }
      const prev = focus[idx - 1];
      const start = prev.getEnd();
      const end = token.getOffset();
      if (start < end) {
        ranges.push(this.makeRange(start, end));
      }
    });
    return ranges;
  }
}
