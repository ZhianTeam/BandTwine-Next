/*
 * File: src/error.js
 * Revision number: 1
 * License: GPL-3.0
 * Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.
 *
 * This is the converter for BandTwine Next to squash original KDL configuration file to a minimized binary format.
 * BandTwine is a FLOSS Software distributed under AGPL-3.0 license. This software comes with ABSOLUTELY NO WARRANTY.
 * You are welcome to redistribute it under certain conditions. See the GNU Affero General Public License for more details.
 */

export class KDLError extends Error {
  constructor(message, line, column, filename) {
    super(message);
    this.name = 'KDLError';
    this.line = line;
    this.column = column;
    this.filename = filename;
  }
}

export class LexerError extends KDLError {
  constructor(message, line, column, filename) {
    super(message, line, column, filename);
    this.name = 'LexerError';
  }
}

export class ParserError extends KDLError {
  constructor(message, line, column, filename) {
    super(message, line, column, filename);
    this.name = 'ParserError';
  }
}

export class ValidationError extends KDLError {
  constructor(message, line, column, filename) {
    super(message, line, column, filename);
    this.name = 'ValidationError';
  }
}

export class ValidationWarning extends KDLError {
  constructor(message, line, column, filename) {
    super(message, line, column, filename);
    this.name = 'ValidationWarning';
  }
}
