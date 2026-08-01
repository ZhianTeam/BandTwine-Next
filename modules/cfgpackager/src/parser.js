/*
 * File: src/parser.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

import { TOKEN_TYPES } from './lexer.js';
import { ParserError } from './errors.js';

class Parser {
  constructor(tokens, source, filename) {
    this.tokens = tokens;
    this.source = source;
    this.filename = filename;
    this.pos = 0;
  }

  current() {
    return this.tokens[this.pos];
  }

  peek(offset = 1) {
    return this.tokens[this.pos + offset];
  }

  advance() {
    return this.tokens[this.pos++];
  }

  error(message, token = this.current()) {
    throw new ParserError(message, token.line, token.column, this.filename);
  }

  expect(type) {
    const token = this.current();
    if (token.type !== type) {
      this.error(`Expected ${type}, got ${token.type}`);
    }
    return this.advance();
  }

  skipNewlines() {
    while (this.current().type === TOKEN_TYPES.NEWLINE) {
      this.advance();
    }
  }

  parseTypeAnnotation() {
    const startToken = this.current();
    this.expect(TOKEN_TYPES.LPAREN);
    
    let type = '';
    let depth = 1;
    
    while (depth > 0 && this.current().type !== TOKEN_TYPES.EOF) {
      const token = this.current();
      if (token.type === TOKEN_TYPES.LPAREN) {
        depth++;
        type += '(';
      } else if (token.type === TOKEN_TYPES.RPAREN) {
        depth--;
        if (depth > 0) {
          type += ')';
        }
      } else if (token.type === TOKEN_TYPES.IDENTIFIER) {
        type += token.value;
      } else {
        this.error('Invalid type annotation');
      }
      this.advance();
    }
    
    return {
      type: 'TypeAnnotation',
      value: type.trim(),
      line: startToken.line,
      column: startToken.column
    };
  }

  parseValue() {
    const token = this.current();
    
    // Type annotation
    if (token.type === TOKEN_TYPES.LPAREN) {
      return this.parseTypeAnnotation();
    }
    
    // String
    if (token.type === TOKEN_TYPES.STRING || token.type === TOKEN_TYPES.RAW_STRING) {
      this.advance();
      return {
        type: 'String',
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    // Number
    if (token.type === TOKEN_TYPES.NUMBER) {
      this.advance();
      return {
        type: 'Number',
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    // Boolean
    if (token.type === TOKEN_TYPES.BOOLEAN) {
      this.advance();
      return {
        type: 'Boolean',
        value: token.value,
        line: token.line,
        column: token.column
      };
    }
    
    // Null
    if (token.type === TOKEN_TYPES.NULL) {
      this.advance();
      return {
        type: 'Null',
        value: null,
        line: token.line,
        column: token.column
      };
    }
    
    this.error(`Expected value, got ${token.type}`);
  }

  parseProperty() {
    const nameToken = this.expect(TOKEN_TYPES.IDENTIFIER);
    this.expect(TOKEN_TYPES.EQUALS);
    const value = this.parseValue();
    
    return {
      type: 'Property',
      name: nameToken.value,
      value,
      line: nameToken.line,
      column: nameToken.column
    };
  }

  parseNode() {
    const startToken = this.current();
    let disabled = false;
    
    // Check for slashdash
    if (startToken.type === TOKEN_TYPES.SLASHDASH) {
      disabled = true;
      this.advance();
      this.skipNewlines();
    }
    
    // Node name (identifier or string)
    let name;
    if (this.current().type === TOKEN_TYPES.IDENTIFIER) {
      name = this.advance().value;
    } else if (this.current().type === TOKEN_TYPES.STRING) {
      name = this.advance().value;
    } else {
      this.error('Expected node name');
    }
    
    const node = {
      type: 'Node',
      name,
      properties: [],
      arguments: [],
      children: [],
      disabled,
      line: startToken.line,
      column: startToken.column
    };
    
    // Parse properties, arguments, and type annotations
    while (this.current().type !== TOKEN_TYPES.NEWLINE &&
           this.current().type !== TOKEN_TYPES.SEMICOLON &&
           this.current().type !== TOKEN_TYPES.LBRACE &&
           this.current().type !== TOKEN_TYPES.EOF) {
      
      // Property (key=value)
      if (this.current().type === TOKEN_TYPES.IDENTIFIER && 
          this.peek() && this.peek().type === TOKEN_TYPES.EQUALS) {
        node.properties.push(this.parseProperty());
      }
      // Argument (value)
      else {
        node.arguments.push(this.parseValue());
      }
    }
    
    // Children block
    if (this.current().type === TOKEN_TYPES.LBRACE) {
      this.advance();
      this.skipNewlines();
      
      while (this.current().type !== TOKEN_TYPES.RBRACE && 
             this.current().type !== TOKEN_TYPES.EOF) {
        node.children.push(this.parseNode());
        this.skipNewlines();
      }
      
      this.expect(TOKEN_TYPES.RBRACE);
    }
    
    // Skip optional semicolon or newline
    if (this.current().type === TOKEN_TYPES.SEMICOLON) {
      this.advance();
    }
    if (this.current().type === TOKEN_TYPES.NEWLINE) {
      this.advance();
    }
    
    return node;
  }

  parse() {
    const document = {
      type: 'Document',
      children: []
    };
    
    this.skipNewlines();
    
        while (this.current().type !== TOKEN_TYPES.EOF) {
      // Handle slashdash at document level (disables next node)
      if (this.current().type === TOKEN_TYPES.SLASHDASH) {
        const node = this.parseNode();
        // Disabled nodes are parsed but not added to the document tree
        if (!node.disabled) {
          document.children.push(node);
        }
      } else {
        document.children.push(this.parseNode());
      }
      this.skipNewlines();
    }
    return document;
  }
}

export function parse(tokens, source, filename) {
  const parser = new Parser(tokens, source, filename);
  return parser.parse();
}
