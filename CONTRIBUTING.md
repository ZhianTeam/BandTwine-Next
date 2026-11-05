## Getting Started
BandTwine is an interactive fiction engine for Xiaomi Vela OS (NuttX RTOS + QuickJS). Our primary constraint is wearable hardware: 128KB-512KB heap RAM, single-threaded execution, and no DOM.

### Prerequisites
- Node.js 20+
- Git with GPG signing configured
- Familiarity with embedded JavaScript (QuickJS ES2020)
- Understanding of resource-constrained environments

## Development Philosophy
### Core Principles
1. **Minimal**: If it can be 50 lines instead of 200, rewrite it
2. **Correct**: One-shot compilation, no "oops" commits
3. **Fast**: Cold boot under 50ms, heap churn measured in bytes
4. **Surgical**: Every changed line must trace directly to the task

### Code Style
#### Indentation
- **Use tabs**, not spaces (tab width = 2)
- Rationale: Vela's official toolchain uses tabs; mixing breaks diffs

```vim
set noexpandtab
set tabstop=2
set shiftwidth=2
```

#### Line Length
- Hard limit: 120 characters
- Soft target: 80 characters for readability

#### Braces
Use K&R style (brace on same line):
```javascript
function foo() {
	if (condition) {
		doThing();
	} else {
		doOther();
	}
}
```

#### Blank Lines
- 1 blank line between functions
- 2 blank lines between major sections
- No blank lines inside short functions (<10 lines)

#### Markdown Formatting
BandTwine uses compact Markdown style without blank lines between headers and content:
```markdown
# Title
Text appears directly under title without blank line.

## Subtitle
Code blocks also appear directly:
```code
No blank line before code block.
```

# Next Section
For paragraphs followed by code blocks:
```code
No blank line between them.
```
```

This style keeps documentation concise and reduces visual clutter.

### Comments
**Write comments for WHY, not WHAT.** If the code is unclear, refactor it first.

#### Forbidden Patterns
```javascript
// WRONG: Redundant
let counter = 0; // Initialize counter to zero
counter++; // Increment counter by one
```

#### Correct Patterns
```javascript
// CORRECT: Explains non-obvious constraints
// Vela file.writeSync is atomic up to 4KB. Larger writes
// need manual chunking to survive watchdog resets.
if (buffer.byteLength > 4096) {
	writeChunked(fd, buffer);
}
```

#### Comment Syntax
1. Multi-line comments: Use `/* */` at top, no leading `*` per line
2. Inline comments: `//` on line ABOVE target, not trailing
3. No `/* */` inside functions unless explaining complex algorithms (10+ lines)

### File Headers
All source files must include a license header:
```javascript
/*
  File: pages/verify/verify.ux
  Revision number: 3
  License: AGPL-3.0
  Copyleft (c) 2025-2026 ZhianTeam. All rights reserved.

  This is BandTwine. A FLOSS interactive fiction engine.
  BandTwine is distributed under AGPL-3.0 license.
  See the GNU Affero General Public License for more details.
*/
```

**Rules:**
- Path: Relative to repo root, exclude `src/` prefix
- Revision number: Start at 1, increment on substantive changes
- License: AGPL-3.0 for runtime (`src/`), GPL-3.0 for compiler (`modules/`)

### Simplicity First
If your implementation exceeds 50 lines (excluding comments), justify why it MUST be that long.

**Red flags:**
- Premature abstraction (creating factories for 2 types)
- Defensive paranoia (checking null in 10 places)
- Feature creep (adding unrequested features)

### Memory Discipline
QuickJS has no JIT and uses mark-and-sweep GC. Follow these rules:
```javascript
// BAD: Creates garbage on every render
function render() {
	return `<text>${this.name}</text>`; // New string allocation
}

// GOOD: Pre-intern templates
const TEMPLATE = '<text>';
const TEMPLATE_END = '</text>';
function render() {
	return TEMPLATE + this.name + TEMPLATE_END;
}

// GOOD: Cleanup in lifecycle
onHide() {
	this.$off('tap', this.handleTap);
	this.handleTap = null; // Manual nulling for GC
}
```

### File I/O
Vela's file API is synchronous. Always check return values and close descriptors:
```javascript
function readStory(path) {
	const file = require('@system.file');
	let fd = -1;
	try {
		fd = file.openSync({ path, flag: 'r' });
		if (fd < 0) {
			console.error('Failed to open', path, 'errno:', fd);
			return null;
		}
		const stat = file.statSync({ path });
		const buffer = file.readArrayBufferSync({ fd, length: stat.size });
		return buffer;
	} finally {
		if (fd >= 0) {
			file.closeSync({ fd });
		}
	}
}
```

## Testing
### Unit Tests
Every parser/validator function needs tests. Use Node.js built-in test framework:
```javascript
const { test } = require('node:test');
const assert = require('node:assert');

test('parses nested nodes', () => {
	const ast = parseKDL('meta { name "Test" }');
	assert.strictEqual(ast.meta.name.value, 'Test');
});
```

### Device Testing
Before release, test on physical devices:
- Band 9 Pro (n67): Round 168px, API level 3
- Band 10 (o67): Capsule 192×490, API level 4
- Watch S4 (o66): Rectangular 456px, API level 3

## Git Workflow
### Commit Messages
Follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `refactor`: Code refactor (no behavior change)
- `test`: Add/update tests
- `docs`: Documentation only
- `chore`: Build scripts, dependencies

**Example:**
```
feat(compiler): add device capability static analysis

Cross-references config.kdl payment type with device capability
matrix at compile-time. Emits error if target device lacks
required APIs.

Closes #42
```

### GPG Signing
All commits must be signed with your GPG key:
```bash
git commit -S -m "feat(payment): add RSA verification"
```

### Branch Strategy
- `master`: Stable releases
- `dev/*`: Feature branches
- `fix/*`: Bug fix branches

### Pull Request Process
1. Create feature branch from `master`
2. Make changes following this guide
3. Run tests: `npm test`
4. Verify tabs: `grep -rn '    ' src/ modules/`
5. Stage changes: `git add <files>`
6. Commit with GPG signature
7. Push and create PR
8. Address review feedback

## Pre-Commit Checklist
Before submitting code:

### Correctness
- [ ] Code compiles without warnings
- [ ] All existing tests pass
- [ ] New tests written for new features
- [ ] Tested on at least 2 devices

### Style
- [ ] Tabs used (no spaces for indentation)
- [ ] No redundant comments
- [ ] No emoji in code or documentation
- [ ] License header present and correct
- [ ] Revision number incremented

### Performance
- [ ] No `JSON.parse` in hot paths
- [ ] File descriptors closed in finally blocks
- [ ] Event listeners cleaned up in lifecycle hooks
- [ ] Heap allocations minimized

### Simplicity
- [ ] Could this be 50% shorter?
- [ ] No abstractions for single-use code
- [ ] No unrequested features
- [ ] Every changed line traceable to task

## Performance Targets
- **Cold boot**: <50ms from launch to first paint
- **Heap usage**: <100KB working set on 256KB devices
- **Battery**: <5% drain per hour of active use
- **File size**: <2MB per `.rpk` package

## Common Pitfalls
1. **Don't use async/await**: QuickJS doesn't support it
2. **Always close file descriptors**: Use try/finally
3. **Don't hardcode screen dimensions**: Detect at runtime
4. **Avoid high-frequency polling**: Use event-driven APIs
5. **Don't call JSON.parse in loops**: Cache parsed results

## Documentation
### README Structure
Each module needs a README.md:
- Purpose (one sentence)
- API documentation
- Usage examples
- Dependencies
- Testing instructions

### Changelog
Update `CHANGELOG.md` on every release following Keep a Changelog format.

## Questions?
- File an issue for bugs or feature requests
- Join discussions for architecture questions
- Check existing issues before creating new ones

## License
By contributing, you agree that your contributions will be licensed under:
- **AGPL-3.0** for runtime code (`src/`)
- **GPL-3.0** for compiler code (`modules/`)

Thank you for contributing to BandTwine!
