/*
 * File: src/lexer.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { LexerError } from './errors.js';

const TOKEN_TYPES = {
  IDENTIFIER: 'IDENTIFIER',
  STRING: 'STRING',
  RAW_STRING: 'RAW_STRING',
  NUMBER: 'NUMBER',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  EQUALS: 'EQUALS',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  SEMICOLON: 'SEMICOLON',
  SLASHDASH: 'SLASHDASH',
  NEWLINE: 'NEWLINE',
  EOF: 'EOF'
};

class Lexer {
  constructor(source, filename = 'input.kdl') {
    this.source = source;
    this.filename = filename;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  current() {
    return this.source[this.pos];
  }

  peek(offset = 1) {
    return this.source[this.pos + offset];
  }

  advance() {
    const char = this.current();
    this.pos++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  error(message) {
    throw new LexerError(message, this.line, this.column, this.filename);
  }

  skipWhitespace() {
    while (this.pos < this.source.length) {
      const char = this.current();
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
      } else if (char === '\\' && this.peek() === '\n') {
        // Line continuation
        this.advance(); // \
        this.advance(); // \n
      } else {
        break;
      }
    }
  }

  skipLineComment() {
    // Skip //
    this.advance();
    this.advance();
    
    while (this.pos < this.source.length && this.current() !== '\n') {
      this.advance();
    }
  }

  skipBlockComment() {
    // Skip /*
    this.advance();
    this.advance();
    
    while (this.pos < this.source.length) {
      if (this.current() === '*' && this.peek() === '/') {
        this.advance(); // *
        this.advance(); // /
        break;
      }
      this.advance();
    }
  }

  readString() {
    const startLine = this.line;
    const startColumn = this.column;
    this.advance(); // Skip opening "
    
    let value = '';
    while (this.pos < this.source.length && this.current() !== '"') {
      if (this.current() === '\\') {
        this.advance();
        const escapeChar = this.current();
        switch (escapeChar) {
          case 'n': value += '\n'; break;
          case 'r': value += '\r'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case 'b': value += '\b'; break;
          case 'f': value += '\f'; break;
          case 'u': {
            this.advance(); // u
            if (this.current() !== '{') {
              this.error('Expected { after \\u');
            }
            this.advance(); // {
            let hex = '';
            while (this.current() !== '}') {
              hex += this.current();
              this.advance();
            }
            const codePoint = parseInt(hex, 16);
            if (isNaN(codePoint) || codePoint > 0x10FFFF) {
              this.error(`Invalid unicode escape \\u{${hex}}`);
            }
            value += String.fromCodePoint(codePoint);
            break;
          }
          default:
            this.error(`Invalid escape sequence \\${escapeChar}`);
        }
        this.advance();
      } else if (this.current() === '\n') {
        this.error('Unterminated string (newline in string)');
      } else {
        value += this.current();
        this.advance();
      }
    }
    
    if (this.current() !== '"') {
      this.error('Unterminated string');
    }
    this.advance(); // Skip closing "
    
    return {
      type: TOKEN_TYPES.STRING,
      value,
      line: startLine,
      column: startColumn
    };
  }

  readRawString() {
    const startLine = this.line;
    const startColumn = this.column;
    
    this.advance(); // r
    
    // Count opening #
    let hashCount = 0;
    while (this.current() === '#') {
      hashCount++;
      this.advance();
    }
    
    if (this.current() !== '"') {
      this.error('Expected " after r or r#');
    }
    this.advance(); // "
    
    let value = '';
    while (this.pos < this.source.length) {
      if (this.current() === '"') {
        // Check if we have the right number of # after "
        let foundHashes = 0;
        let tempPos = this.pos + 1;
        while (tempPos < this.source.length && this.source[tempPos] === '#') {
          foundHashes++;
          tempPos++;
        }
        
        if (foundHashes === hashCount) {
          this.advance(); // "
          for (let i = 0; i < hashCount; i++) {
            this.advance(); // #
          }
          break;
        }
      }
      value += this.current();
      this.advance();
    }
    
    return {
      type: TOKEN_TYPES.RAW_STRING,
      value,
      hashCount,
      line: startLine,
      column: startColumn
    };
  }

  readNumber() {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    let isFloat = false;
    
    // Optional sign
    if (this.current() === '+' || this.current() === '-') {
      value += this.current();
      this.advance();
    }
    
    // Hex, octal, binary
    if (this.current() === '0' && this.pos + 1 < this.source.length) {
      const next = this.peek();
      if (next === 'x' || next === 'X') {
        value += this.current();
        this.advance();
        value += this.current();
        this.advance();
        while (/[0-9a-fA-F_]/.test(this.current())) {
          if (this.current() !== '_') {
            value += this.current();
          }
          this.advance();
        }
        return {
          type: TOKEN_TYPES.NUMBER,
          value: parseInt(value.replace(/_/g, ''), 16),
          raw: value,
          line: startLine,
          column: startColumn
        };
      } else if (next === 'o' || next === 'O') {
        value += this.current();
        this.advance();
        value += this.current();
        this.advance();
        while (/[0-7_]/.test(this.current())) {
          if (this.current() !== '_') {
            value += this.current();
          }
          this.advance();
        }
        return {
          type: TOKEN_TYPES.NUMBER,
          value: parseInt(value.replace(/_/g, ''), 8),
          raw: value,
          line: startLine,
          column: startColumn
        };
      } else if (next === 'b' || next === 'B') {
        value += this.current();
        this.advance();
        value += this.current();
        this.advance();
        while (/[01_]/.test(this.current())) {
          if (this.current() !== '_') {
            value += this.current();
          }
          this.advance();
        }
        return {
          type: TOKEN_TYPES.NUMBER,
          value: parseInt(value.replace(/_/g, ''), 2),
          raw: value,
          line: startLine,
          column: startColumn
        };
      }
    }
    
    // Decimal or float
    while (/[\d_]/.test(this.current())) {
      if (this.current() !== '_') {
        value += this.current();
      }
      this.advance();
    }
    
    // Decimal point
    if (this.current() === '.' && /\d/.test(this.peek())) {
      isFloat = true;
      value += this.current();
      this.advance();
      while (/[\d_]/.test(this.current())) {
        if (this.current() !== '_') {
          value += this.current();
        }
        this.advance();
      }
    }
    
    // Exponent
    if (this.current() === 'e' || this.current() === 'E') {
      isFloat = true;
      value += this.current();
      this.advance();
      if (this.current() === '+' || this.current() === '-') {
        value += this.current();
        this.advance();
      }
      while (/[\d_]/.test(this.current())) {
        if (this.current() !== '_') {
          value += this.current();
        }
        this.advance();
      }
    }
    
    const numValue = isFloat ? parseFloat(value) : parseInt(value, 10);
    if (isNaN(numValue)) {
      this.error(`Invalid number: ${value}`);
    }
    
    return {
      type: TOKEN_TYPES.NUMBER,
      value: numValue,
      raw: value,
      line: startLine,
      column: startColumn
    };
  }

  readIdentifier() {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    
    while (this.pos < this.source.length && /[a-zA-Z0-9_\-]/.test(this.current())) {
      value += this.current();
      this.advance();
    }
    
    // Check for keywords
    if (value === 'true' || value === 'false') {
      return {
        type: TOKEN_TYPES.BOOLEAN,
        value: value === 'true',
        line: startLine,
        column: startColumn
      };
    }
    
    if (value === 'null') {
      return {
        type: TOKEN_TYPES.NULL,
        value: null,
        line: startLine,
        column: startColumn
      };
    }
    
    return {
      type: TOKEN_TYPES.IDENTIFIER,
      value,
      line: startLine,
      column: startColumn
    };
  }

  tokenize() {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      
      if (this.pos >= this.source.length) break;
      
      const char = this.current();
      
      // Comments
      if (char === '/' && this.peek() === '/') {
        this.skipLineComment();
        continue;
      }
      
      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }
      
      // Slashdash
      if (char === '/' && this.peek() === '-') {
        const line = this.line;
        const column = this.column;
        this.advance();
        this.advance();
        this.tokens.push({
          type: TOKEN_TYPES.SLASHDASH,
          line,
          column
        });
        continue;
      }
      
      // Newline (significant in KDL)
      if (char === '\n') {
        const line = this.line;
        const column = this.column;
        this.advance();
        this.tokens.push({
          type: TOKEN_TYPES.NEWLINE,
          line,
          column
        });
        continue;
      }
      
      // String
      if (char === '"') {
        this.tokens.push(this.readString());
        continue;
      }
      
      // Raw string
      if (char === 'r' && (this.peek() === '"' || this.peek() === '#')) {
        this.tokens.push(this.readRawString());
        continue;
      }
      
      // Number
      if (/[\d+\-]/.test(char)) {
        const next = this.peek();
        if (char === '+' || char === '-') {
          if (/\d/.test(next)) {
            this.tokens.push(this.readNumber());
            continue;
          }
        } else {
          this.tokens.push(this.readNumber());
          continue;
        }
      }
      
      // Single char tokens
      switch (char) {
        case '=': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.EQUALS, line, column });
          continue;
        }
        case '(': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.LPAREN, line, column });
          continue;
        }
        case ')': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.RPAREN, line, column });
          continue;
        }
        case '{': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.LBRACE, line, column });
          continue;
        }
        case '}': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.RBRACE, line, column });
          continue;
        }
        case ';': {
          const line = this.line;
          const column = this.column;
          this.advance();
          this.tokens.push({ type: TOKEN_TYPES.SEMICOLON, line, column });
          continue;
        }
      }
      
      // Identifier
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifier());
        continue;
      }
      
      this.error(`Unexpected character: '${char}'`);
    }
    
    this.tokens.push({
      type: TOKEN_TYPES.EOF,
      line: this.line,
      column: this.column
    });
    
    return this.tokens;
  }
}

export function tokenize(source, filename) {
  const lexer = new Lexer(source, filename);
  return lexer.tokenize();
}

export { TOKEN_TYPES };
