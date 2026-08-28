<!--
	File: TESTING.md
	Revision number: 1
	License: GPL-3.0
	Copyleft (c) 2025-2026 ZhianTeam. All rights may not reserved.

	Testing documentation for BandTwine Next.
	BandTwine is a FLOSS Software distributed under GPL-3.0 license.
-->

# Testing Guide

## Running Tests

### All Tests

```bash
npm test
```

This runs all test suites using Node.js built-in test runner:
- Unit tests in `modules/**/__tests__/*.test.js`
- Integration tests in `modules/**/test/*.test.js`
- Runtime decoder tests in `src/**/__tests__/*.test.js`

### Specific Test Files

```bash
node --test modules/kdlcomp/__tests__/lexer.test.js
node --test modules/tweecomp/__tests__/parser.test.js
```

### Watch Mode

```bash
node --test --watch modules/**/__tests__/*.test.js
```

## Test Structure

### Unit Tests
Located in `__tests__` directories alongside the code they test.

**Example**: `modules/kdlcomp/__tests__/lexer.test.js` tests `modules/kdlcomp/src/lexer.js`

### Integration Tests
Test complete workflows like E2E builds, cross-validation.

**Location**: `modules/__tests__/`

### Test Fixtures
Sample projects for E2E testing.

**Location**: `test-fixtures/`
- `minimal-story/` - Basic story with 3 passages
- `invalid-kdl-syntax/` - Invalid KDL for error testing
- `invalid-no-config/` - Missing config.kdl for error testing

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

GitHub Actions workflow: `.github/workflows/test.yml`

Tests run on multiple Node.js versions:
- Node.js 20.x (minimum supported)
- Node.js 22.x (latest LTS)

## Writing Tests

Use Node.js built-in test API (NOT Jest):

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('MyModule', () => {
	it('should do something', () => {
		const result = myFunction();
		assert.strictEqual(result, expected);
	});
});
```

### Assertion Methods

- `assert.strictEqual(actual, expected)` - Strict equality (===)
- `assert.deepStrictEqual(actual, expected)` - Deep object comparison
- `assert.ok(value)` - Truthy check
- `assert.throws(() => { ... })` - Exception testing

### Async Tests

```javascript
it('should handle async operations', async () => {
	const result = await asyncFunction();
	assert.strictEqual(result, expected);
});
```

## Test Coverage

Currently no coverage tooling configured. Tests focus on:
- KDL lexer/parser correctness
- Twee parser correctness
- Binary encoder output validation
- Cross-reference validation
- Device capability checks

## Debugging Tests

Add `console.log()` or use Node.js debugger:

```bash
node --inspect-brk --test modules/kdlcomp/__tests__/lexer.test.js
```

Then open `chrome://inspect` in Chrome.

## Known Issues

- E2E tests require aiot-toolkit and full app structure
- Some tests may fail if test fixtures are incomplete
- Tests use absolute paths derived from `import.meta.url` for portability
