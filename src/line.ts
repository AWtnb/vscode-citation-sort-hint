import * as vscode from "vscode";
import { RangeFinder } from "./rangeFinder";

const orderRanges = (ranges: vscode.Range[]): vscode.Range[] => {
  return ranges.sort((a, b) => {
    if (a.start < b.start) return -1;
    if (b.start < a.start) return 1;
    return 0;
  });
};

export class Line {
  private readonly _text: string;
  private readonly _lineIdx: number;
  private readonly _focusRanges: vscode.Range[];
  constructor(line: vscode.TextLine) {
    this._text = line.text;
    this._lineIdx = line.lineNumber;
    const found: vscode.Range[] = [];
    const rf = new RangeFinder(this._text, this._lineIdx);
    rf.getReversedSurname().forEach((r) => {
      found.push(r);
    });
    rf.getSurname().forEach((r) => {
      found.push(r);
    });
    rf.getYear().forEach((r) => {
      found.push(r);
    });
    this._focusRanges = orderRanges(found);
  }

  private getUnoverlappingRanges(): vscode.Range[] {
    const found: vscode.Range[] = [];
    const rs = this._focusRanges;
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (i === 0) {
        found.push(r);
        continue;
      }
      const last = found.slice(-1)[0];
      if (last && last.intersection(r)) {
        const u = last.union(r);
        found.pop();
        found.push(u);
        continue;
      }
      found.push(r);
    }
    return found;
  }

  private rangeBy(startIdx: number, endIdx: number): vscode.Range {
    const r = new vscode.Range(this._lineIdx, startIdx, this._lineIdx, endIdx);
    return r;
  }

  getRangesToBlur(): vscode.Range[] {
    const found: vscode.Range[] = [];
    if (this._focusRanges.length < 1) {
      return [this.rangeBy(0, this._text.length)];
    }
    const focusRanges = this.getUnoverlappingRanges();
    for (let i = 0; i < focusRanges.length; i++) {
      const focus = focusRanges[i];
      if (i === 0) {
        if (0 < focus.start.character) {
          const r = this.rangeBy(0, focus.start.character);
          found.push(r);
        }
        continue;
      }
      const last = focusRanges[i - 1];
      if (!last) {
        continue;
      }
      const r = this.rangeBy(last.end.character, focus.start.character);
      found.push(r);
    }
    const final = focusRanges.slice(-1)[0];
    if (final.end.character < this._text.length) {
      const r = this.rangeBy(final.end.character, this._text.length);
      found.push(r);
    }
    return found;
  }
}
