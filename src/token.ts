class TokenChecker {
  private readonly content: string;
  constructor(s: string) {
    this.content = s;
  }
  isYear(): boolean {
    const s = this.content;
    return s.length - s.replace(/\d/g, "").length == 4 && /\d{4}/.test(s);
  }

  startsWithLower(): boolean {
    const s = this.content.charAt(0);
    return s.toLowerCase() == s;
  }

  isAbbreviation(): boolean {
    return /^[A-Z]\.,?$/.test(this.content);
  }

  isAmpersand(): boolean {
    return this.content == "&";
  }

  endsWithPunctuation(): boolean {
    const last = this.content.charAt(this.content.length - 1);
    return [",", ".", ":", ";"].includes(last);
  }
}

export class Token {
  private readonly content: string;
  private readonly offset: number;
  readonly isYear: boolean;
  readonly startsWithLower: boolean;
  readonly isAbbreviation: boolean;
  readonly isAmpersand: boolean;
  readonly endsWithPunctuation: boolean;

  constructor(s: string, offset: number) {
    this.content = s;
    this.offset = offset;
    const checker = new TokenChecker(this.content);
    this.isYear = checker.isYear();
    this.startsWithLower = checker.startsWithLower();
    this.isAbbreviation = checker.isAbbreviation();
    this.isAmpersand = checker.isAmpersand();
    this.endsWithPunctuation = checker.endsWithPunctuation();
  }

  private getFocusLength(): number {
    if (this.isYear) {
      return 4;
    }
    if (this.isAbbreviation || this.isAmpersand) {
      return 0;
    }
    if (this.endsWithPunctuation) {
      return this.content.length - 1;
    }
    return this.content.length;
  }

  private getPrefixLength(): number {
    if (!this.isYear) {
      return 0;
    }
    for (let i = 0; i < this.content.length; i++) {
      const c = this.content.charCodeAt(i);
      if (0x30 <= c && c <= 0x39) {
        return i;
      }
    }
    return 0;
  }

  getOffset(): number {
    return this.offset + this.getPrefixLength();
  }

  getEnd(): number {
    return this.getOffset() + this.getFocusLength();
  }
}
