import * as vscode from "vscode";

const newRange = (line: number, startIdx: number, endIdx: number): vscode.Range => {
  const start = new vscode.Position(line, startIdx);
  const end = new vscode.Position(line, endIdx);
  return new vscode.Range(start, end);
};

const hasSingleYearDigits = (s: string): boolean => {
  return s.length - s.replace(/\d/g, "").length == 4;
};

const isInitial = (s: string): boolean => {
  if (s.endsWith(".") || s.endsWith(".,")) {
    if (s.charAt(0).match(/[A-Z]/)) {
      return true;
    }
  }
  return false;
};

class Token {
  readonly isAbbreviation: boolean;
  readonly isYear: boolean;
  readonly isNormal: boolean;
  readonly content: string;
  readonly length: number;
  readonly lineNum: number;
  readonly offset: number;

  constructor(s: string, lineNum: number, offset: number) {
    this.content = s;
    this.isYear = hasSingleYearDigits(this.content);
    this.isAbbreviation = !this.isYear && isInitial(this.content);
    this.isNormal = !this.isAbbreviation && !this.isYear;
    this.length = this.content.length;
    this.lineNum = lineNum;
    this.offset = offset;
  }

  getPrefix(): vscode.Range | null {
    if (!this.isYear) {
      return null;
    }
    if (this.content.charAt(0).match(/\d/)) {
      return null;
    }
    let prefixLen = 0;
    for (let i = 0; i < this.content.length; i++) {
      if (this.content.charAt(i).match(/\d/)) {
        break;
      }
      prefixLen += 1;
    }
    return newRange(this.lineNum, this.offset, this.offset + prefixLen);
  }

  getSuffix(): vscode.Range | null {
    if (!this.isYear) {
      return null;
    }
    if (this.content.charAt(this.content.length - 1).match(/\d/)) {
      return null;
    }
    let suffixLen = 0;
    for (let i = 1; i <= this.content.length; i++) {
      if (this.content.charAt(this.content.length - i).match(/\d/)) {
        break;
      }
      suffixLen += 1;
    }
    return newRange(this.lineNum, this.offset + this.length - suffixLen, this.offset + this.length);
  }

  getRange(): vscode.Range {
    return newRange(this.lineNum, this.offset, this.offset + this.length);
  }
}

export class Entry {
  readonly lineText: string;
  readonly tokens: Token[];

  constructor(line: vscode.TextLine) {
    this.lineText = line.text;
    let offset = 0;
    this.tokens = this.lineText.split(" ").map((elem: string) => {
      const token = new Token(elem, line.lineNumber, offset);
      offset += elem.length + 1;
      return token;
    });
  }

  private getAbbreviationRanges(): vscode.Range[] {
    return this.tokens
      .filter((token) => token.isAbbreviation)
      .map((abr) => {
        return abr.getRange();
      });
  }

  private getNormalRanges(): vscode.Range[] {
    return this.tokens
      .filter((token, idx) => {
        if (token.isNormal) {
          if (token.content == "&") {
            return true;
          }
          if (0 < idx && idx < this.tokens.length - 1) {
            return !this.tokens[idx - 1].isAbbreviation && !this.tokens[idx + 1].isAbbreviation;
          }
          if (idx == this.tokens.length - 1) {
            return !this.tokens[idx - 1].isAbbreviation;
          }
          return false;
        }
        return false;
      })
      .map((nrm) => {
        return nrm.getRange();
      });
  }

  private getYearPrefixRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    this.tokens
      .filter((token) => token.isYear)
      .forEach((yr) => {
        const pre = yr.getPrefix();
        if (pre) {
          ranges.push(pre);
        }
      });
    return ranges;
  }

  private getYearSuffixfixRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    this.tokens
      .filter((token) => token.isYear)
      .forEach((yr) => {
        const suf = yr.getSuffix();
        if (suf) {
          ranges.push(suf);
        }
      });
    return ranges;
  }

  getNoiseRanges(): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    this.getAbbreviationRanges().forEach((abr) => ranges.push(abr));
    this.getNormalRanges().forEach((nrm) => ranges.push(nrm));
    this.getYearPrefixRanges().forEach((yp) => ranges.push(yp));
    this.getYearSuffixfixRanges().forEach((ys) => ranges.push(ys));
    return ranges;
  }
}
