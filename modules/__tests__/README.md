# BandTwine Test Suite

This directory contains the comprehensive test suite for the Usagi compiler.

## Test Structure

```
modules/
├── __tests__/
│   ├── e2e.test.js              # End-to-end RPK build tests
│   ├── cross-validator.test.js  # Cross-validation tests
│   └── personality.test.js      # Personality test (existing)
├── kdlcomp/__tests__/
│   ├── lexer.test.js            # KDL lexer tests
│   ├── parser.test.js           # KDL parser tests
│   ├── validator.test.js        # KDL validator tests
│   └── encoder.test.js          # BTNC encoder tests
└── tweecomp/__tests__/
    ├── parser.test.js           # Twee parser tests
    ├── encoder.test.js          # BTSC encoder tests
    └── macro-compiler.test.js  # Macro compiler tests (existing)
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test modules/kdlcomp/__tests__/lexer.test.js

# Run tests with coverage (requires additional setup)
node --test --experimental-test-coverage modules/**/__tests__/*.test.js
```

## Test Fixtures

Test fixtures are located in `test-fixtures/`:

- `minimal-story/` - A minimal valid story for E2E testing
- `invalid-kdl-syntax/` - Invalid KDL for error testing
- `invalid-no-config/` - Missing config.kdl for validation testing

## Test Framework

Tests use Node.js built-in `node:test` framework (Node.js 20+):

- No external dependencies required
- Uses `describe()` and `it()` for test organization
- Uses `assert` module for assertions

## Coverage Goals

Target 80%+ coverage for:

- KDL lexer/parser/validator
- BTNC encoder/decoder
- Twee parser
- BTSC encoder

## Writing Tests

Follow BandTwine Constitution:

- GPL-3.0 license for compiler tests
- Tabs for indentation
- Minimal comments (WHY not WHAT)
- Include file header with revision number

Example:

```javascript
/*
	File: kdlcomp/__tests__/example.test.js
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Unit tests for example module.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license.
*/

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { exampleFunction } from '../src/example.js';

describe('Example Module', () => {
	it('should do something', () => {
		const result = exampleFunction('input');
		assert.strictEqual(result, 'expected');
	});
});
```

## Common Test Patterns

### Binary Format Testing

```javascript
const binary = encode(data);
const view = new DataView(binary.buffer);
const magic = binary.toString('ascii', 0, 4);
assert.strictEqual(magic, 'BTNC');
```

### Error Testing

```javascript
assert.throws(() => {
	lexer.tokenize('"unterminated');
}, /Unterminated string/);
```

### CRC32 Validation

```javascript
const headerWithoutCRC = binary.subarray(0, 11);
const body = binary.subarray(15);
const dataForChecksum = Buffer.concat([headerWithoutCRC, body]);
const computedCRC = crc32(dataForChecksum);
```

## CI Integration

Tests run automatically in CI/CD pipeline on:

- Every push to main branch
- Every pull request
- Pre-commit hooks (optional)

## Troubleshooting

### Tests failing with import errors

- Ensure you're using Node.js 20+
- Check that `"type": "module"` is in package.json

### E2E tests timing out

- Increase timeout with `{ timeout: 60000 }`
- Check that usagi.js is executable

### Binary format tests failing

- Verify Big Endian byte order (network order)
- Check buffer offset calculations
- Ensure CRC32 is computed over correct range
