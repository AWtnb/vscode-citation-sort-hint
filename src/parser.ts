import * as vscode from "vscode";

const rangeOnEditor = (line: number, startIdx: number, endIdx: number): vscode.Range => {
  const start = new vscode.Position(line, startIdx);
  const end = new vscode.Position(line, endIdx);
  return new vscode.Range(start, end);
};

const hasSingleYearDigits = (s: string): boolean => {
  return s.length - s.replace(/\d/g, "").length == 4;
};

const isInitial = (s: string): boolean => {
  const reg = new RegExp("^[A-Z].,?$");
  return reg.test(s);
};

const isDigit = (s: string): boolean => {
  const reg = new RegExp("\\d");
  return reg.test(s);
};

const isLower = (s: string): boolean => {
  return s.toLowerCase() == s;
};

class Token {
  readonly isAbbreviation: boolean;
  readonly isYear: boolean;
  readonly isNormal: boolean;
  readonly punctuations: string[];
  readonly isPunctuation: boolean;
  readonly content: string;
  private readonly len: number;
  private readonly offset: number;

  constructor(s: string, lineNum: number, offset: number) {
    this.content = s;
    this.isYear = hasSingleYearDigits(this.content);
    this.isAbbreviation = !this.isYear && isInitial(this.content);
    this.isNormal = !this.isAbbreviation && !this.isYear;
    this.punctuations = [",", ".", "&", ":", ";"];
    this.isPunctuation = this.punctuations.includes(this.content);
    this.len = this.content.length;
    this.offset = offset;
  }

  private getPrefixLen(): number {
    if (!this.isYear) {
      return 0;
    }
    for (let i = 0; i < this.len; i++) {
      if (isDigit(this.content.charAt(i))) {
        return i;
      }
    }
    return 0;
  }

  private getFocusLength(): number {
    if (this.isYear) {
      return 4;
    }
    if (this.isNormal && this.punctuations.includes(this.content.charAt(this.len - 1))) {
      return this.len - 1;
    }
    return this.len;
  }

  getOffset(): number {
    if (this.isYear) {
      return this.offset + this.getPrefixLen();
    }
    return this.offset;
  }

  getEnd(): number {
    return this.offset + this.getPrefixLen() + this.getFocusLength();
  }
}

export class Entry {
  readonly lineText: string;
  readonly lineNum: number;
  readonly tokens: Token[];

  constructor(line: vscode.TextLine) {
    this.lineText = line.text;
    this.lineNum = line.lineNumber;
    let offset = 0;
    this.tokens = this.lineText.split(" ").map((elem: string) => {
      const token = new Token(elem, line.lineNumber, offset);
      offset += elem.length + 1;
      return token;
    });
  }

  private getFocusTargets(): Token[] {
    return this.tokens.filter((token, idx) => {
      if (token.isYear) {
        return true;
      }
      if (token.isAbbreviation || token.isPunctuation || token.content.endsWith(".") || isLower(token.content.charAt(0))) {
        return false;
      }
      if (idx == 0) {
        return this.tokens[idx + 1].isAbbreviation;
      }
      if (idx == this.tokens.length - 1) {
        return this.tokens[idx - 1].isAbbreviation;
      }
      return this.tokens[idx - 1].isAbbreviation || this.tokens[idx + 1].isAbbreviation;
    });
  }

  getNoiseRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const focus = this.getFocusTargets();
    const head = new Token("", this.lineNum, 0);
    focus.unshift(head);
    const tail = new Token("", this.lineNum, this.lineText.length);
    focus.push(tail);
    focus.forEach((token, idx) => {
      if (idx < 1) {
        return;
      }
      const prev = focus[idx - 1];
      const start = prev.getEnd();
      const end = token.getOffset();
      if (start < end) {
        const rangeToDim = rangeOnEditor(this.lineNum, start, end);
        ranges.push(rangeToDim);
      }
    });
    return ranges;
  }
}
