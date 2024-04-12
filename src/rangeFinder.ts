import * as vscode from "vscode";

export class RangeFinder {
  private readonly _lineIdx: number;
  private readonly _text: string;
  constructor(text: string, lineIdx: number) {
    this._lineIdx = lineIdx;
    this._text = text;
  }

  private rangeBy(startIdx: number, endIdx: number): vscode.Range {
    const r = new vscode.Range(this._lineIdx, startIdx, this._lineIdx, endIdx);
    return r;
  }

  private find(reg: RegExp): vscode.Range[] {
    const found: vscode.Range[] = [];
    let match;
    while ((match = reg.exec(this._text))) {
      const r = this.rangeBy(match.index, match.index + match[0].length);
      found.push(r);
    }
    return found;
  }

  getYear(): vscode.Range[] {
    const reg: RegExp = new RegExp("(?<!\\d)\\d{4}(?!\\d)", "g");
    return this.find(reg);
  }

  /**
   * Get word after abbreviation such as
   * `Shakespeare` in `W. Shakespeare`
   */
  getSurname(): vscode.Range[] {
    const reg: RegExp = new RegExp("(?<=[A-Z]\\. +)[A-Z][a-z]+", "g");
    return this.find(reg);
  }

  /**
   * Get comma-ending word followed by abbreviation such as
   * `Shakespeare` in `Shakespeare, W.`
   */
  getReversedSurname(): vscode.Range[] {
    const reg: RegExp = new RegExp("[A-Z][a-z]+(?=, +[A-Z]\\.)", "g");
    return this.find(reg);
  }
}
