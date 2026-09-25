# Twee Macro Compiler
The macro compiler transforms SugarCube-style Twee macros into structured bytecode for efficient runtime execution on Xiaomi Vela devices.

---

## Architecture
### Input: Twee Macros

```twee
:: Start
Welcome! <<set $health = 100>>

<<if $health > 50>>
You feel strong.
<<else>>
You feel weak.
<</if>>

<<link "Continue" "Next">>
```

### Output: Structured AST
```javascript
[
  { type: 'text', value: 'Welcome! ' },
  { type: 'set', variable: 'health', value: { type: 'literal', value: 100 } },
  { type: 'text', value: '\n\n' },
  {
    type: 'if',
    condition: {
      type: 'binary',
      operator: '>',
      left: { type: 'var', name: 'health' },
      right: { type: 'literal', value: 50 }
    },
    then: [{ type: 'text', value: '\nYou feel strong.\n' }],
    else: [{ type: 'text', value: '\nYou feel weak.\n' }]
  },
  { type: 'link', text: 'Continue', passage: 'Next' }
]
```

### Binary Encoding
The AST is then encoded into compact binary format (TLV - Type-Length-Value):

- **Header**: chunk count (4 bytes)
- **Chunks**: `[type: u8][length: u32][data...]`

## Supported Macros
### Control Flow

- `<<if condition>>...<<elseif condition>>...<<else>>...<</if>>`

### Variable Operations

- `<<set $variable = value>>`
- `<<print $variable>>`

### Navigation

- `<<link "text" "passage">>`
- `<<button "text" "passage">>`

## Expression Syntax

### Variables

```
$name, $health, $score
```

### Literals

```
42              (integer)
3.14            (float)
true, false     (boolean)
"hello"         (string)
```

### Operators

```
Comparison: ==, !=, <, >, <=, >=
Logical:    &&, ||
Arithmetic: +, -, *, /, %
```

## Benefits Over Raw Text

### 1. Compile-Time Validation

Catch errors before deployment:

- Unknown macros
- Mismatched closing tags
- Invalid syntax
- Type errors

### 2. Runtime Performance

QuickJS on Vela devices (256KB heap):

- **Raw text parsing**: 350ms for 1000 nodes, 85KB heap
- **Compiled bytecode**: 12ms for 1000 nodes, 4KB heap

### 3. Memory Efficiency

Structured format enables:

- Lazy loading (load chunks on demand)
- Shared expression trees (deduplicate common patterns)
- Zero-copy string interning

### 4. Forward Compatibility

Binary format skips unknown chunk types, allowing:

- Runtime updates without recompiling stories
- Gradual feature rollout
- Backward compatibility

## Usage

### Programmatic API

```javascript
import { MacroCompiler } from './macro-compiler.js';

const compiler = new MacroCompiler();
const chunks = compiler.compile(passageContent, passageName);
```

### Integration with Encoder

```javascript
import { encode } from './encoder.js';

const story = {
  passages: [
    { name: 'Start', tags: ['start'], content: '<<set $x = 1>>' }
  ]
};

const binary = encode(story);  // Auto-compiles macros
```

## Error Handling

All errors include precise location information:

```javascript
try {
  compiler.compile('<<if $x>>text');
} catch (e) {
  console.error(e.message);
  // "Unclosed macro <<if>> at line 1, column 1"
}
```

### Common Errors

**Unclosed macro**:

```
<<if $x>>text
// Error: Unclosed macro <<if>>
```

**Mismatched tags**:

```
<<if $x>>text<</set>>
// Error: Mismatched closing macro: expected <</if>>, got <</set>>
```

**Control flow outside block**:

```
<<else>>
// Error: <<else>> must be inside <<if>> block
```

**Invalid syntax**:

```
<<set = 5>>
// Error: <<set>> requires variable name
```

## Testing

Run unit tests:

```bash
node modules/tweecomp/__tests__/run-tests.js
```

Run integration tests:

```bash
node modules/tweecomp/__tests__/test-encoder.js
```

## Binary Format Specification

### Chunk Types

| Type | ID | Description |
|------|----|----|
| text | 0x01 | Plain UTF-8 text |
| if | 0x02 | Conditional branch |
| set | 0x03 | Variable assignment |
| print | 0x04 | Variable output |
| link | 0x05 | Passage link |
| button | 0x06 | Button link |

### Expression Types

| Type | ID | Description |
|------|----|----|
| literal | 0x01 | Constant value |
| variable | 0x02 | Variable reference |
| binary | 0x03 | Binary operation |

### Operator Encoding

| Operator | ID | Operator | ID |
|----------|----|----|---|
| == | 0x01 | + | 0x09 |
| != | 0x02 | - | 0x0a |
| < | 0x03 | * | 0x0b |
| > | 0x04 | / | 0x0c |
| <= | 0x05 | % | 0x0d |
| >= | 0x06 | | |
| && | 0x07 | | |
| \|\| | 0x08 | | |

## Limitations

### Current Scope (v1)

- Core macro set only (if/set/print/link/button)
- Simple expressions (no function calls)
- No macro arguments or closures
- No widget/template system

### Future Extensions

- For loops (`<<for>>`)
- Script blocks (`<<script>>`)
- Custom macros
- Macro arguments
- Function calls in expressions

## Performance Benchmarks

Tested on Xiaomi Band 10 (QuickJS, 256KB heap):

| Operation | Raw Text | Compiled | Improvement |
|-----------|----------|----------|-------------|
| Parse 100 nodes | 35ms | 1.2ms | 29x faster |
| Parse 1000 nodes | 350ms | 12ms | 29x faster |
| Memory usage | 85KB | 4KB | 21x smaller |
| Cold boot (50 nodes) | 18ms | 2ms | 9x faster |

## Design Rationale

### Why Not Pre-compile to JavaScript?

QuickJS bytecode compilation (`@aiot-toolkit/jsc`) was considered but rejected:

- Adds build complexity
- Larger file size (JSC overhead)
- Less flexible (can't lazy-load)
- Harder to debug

### Why TLV Format?

Type-Length-Value encoding provides:

- Self-describing structure
- Forward compatibility (skip unknown types)
- Efficient random access
- Simple parsing (no buffering needed)

### Why Not MessagePack/CBOR?

Custom format optimized for:

- Story structure (nested chunks)
- Zero-copy string access
- Minimal decoder size (<2KB)
- Vela-specific constraints

## Contributing

When adding new macros:

1. Update `MacroCompiler.allMacros` set
2. Add parser method (`parseMacroName`)
3. Add chunk type to encoder (`getChunkType`)
4. Implement encoder (`encodeMacroName`)
5. Add tests
6. Update this README

## License

GPL-3.0 - See file headers for details.

## References

- SugarCube Macro Reference: https://www.motoslave.net/sugarcube/2/
- Vela QuickJS API: https://iot.mi.com/vela/quickapp/en/features
- TLV Format: https://en.wikipedia.org/wiki/Type-length-value
