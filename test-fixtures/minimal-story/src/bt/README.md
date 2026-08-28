# BandTwine Runtime Decoders

Runtime binary decoders for Vela QuickJS environment.

## Purpose

Load compiled BTNC (config) and BTSC (story) binaries on wearable devices with minimal heap usage and fast cold-boot times.

## Files

- `decoder-config.js` - BTNC config loader (AGPL-3.0)
- `decoder-story.js` - BTSC story loader (AGPL-3.0)
- `example-usage.ux` - Integration example

## API

### decoder-config.js

```javascript
import { loadConfig } from './bt/decoder-config.js';

const config = loadConfig('/data/configs.bin');
// Returns: { meta, env, properties, payment }
```

**Structure:**
- `meta` - Story metadata (name, version, author, license)
- `env` - Initial environment variables
- `properties` - Runtime properties (startNode, theme, etc.)
- `payment` - Payment configuration (optional)

**Errors:**
- Throws if file cannot be opened
- Throws if magic header is not 'BTNC'
- Throws if CRC32 checksum fails

### decoder-story.js

```javascript
import { loadStory } from './bt/decoder-story.js';

const story = loadStory('/data/story.bin');
// Returns: { passages, passageMap, getPassage }
```

**Structure:**
- `passages` - Array of all passages (ordered by ID)
- `passageMap` - Object mapping passage names to passage objects
- `getPassage(name)` - Helper function to retrieve passage by name (returns null if not found)

**Passage format:**
```javascript
{
	id: 0,                          // Sequential ID
	name: 'Start',                  // Unique passage name
	tags: ['intro', 'main'],        // Array of tags (empty if none)
	content: 'Story text...'        // Passage content
}
```

**Errors:**
- Throws if file cannot be opened
- Throws if magic header is not 'BTSC'
- Throws if CRC32 checksum fails

## Usage Example

```javascript
export default {
	data: {
		config: null,
		story: null,
		currentPassage: null
	},

	onInit() {
		// Load binaries
		this.config = loadConfig('/data/configs.bin');
		this.story = loadStory('/data/story.bin');

		// Navigate to start
		const startNode = this.config.properties.startNode;
		this.currentPassage = this.story.getPassage(startNode);
	},

	onDestroy() {
		// Manual cleanup for QuickJS GC
		this.config = null;
		this.story = null;
		this.currentPassage = null;
	}
};
```

## Memory Discipline

QuickJS requires manual memory management:

1. **Always null out references in `onDestroy()`**
   ```javascript
   onDestroy() {
       this.story = null;
       this.config = null;
   }
   ```

2. **Close file descriptors in finally blocks** (already handled by decoders)

3. **Avoid creating temporary strings in loops**
   ```javascript
   // BAD: Creates garbage
   for (let i = 0; i < passages.length; i++) {
       console.log(`Passage ${i}: ${passages[i].name}`);
   }

   // GOOD: Pre-intern strings
   for (let i = 0; i < passages.length; i++) {
       console.log('Passage ' + i + ': ' + passages[i].name);
   }
   ```

## Performance Characteristics

| Operation | Time | Heap |
|-----------|------|------|
| Load config (200 bytes) | ~5ms | ~2KB |
| Load story (50 passages) | ~15ms | ~8KB |
| getPassage() lookup | <1ms | 0 bytes |

Tested on Band 9 Pro (n67) with 256KB heap.

## Binary Format Details

### BTNC (Config)

```
Offset | Size | Field
-------|------|------------------
0      | 4    | Magic ('BTNC')
4      | 2    | Version (BE)
6      | 1    | Section count
7      | 4    | Body length (BE)
11     | 4    | CRC32 (BE)
15     | N    | Sections (TLV)
```

**Section format:**
```
[1B id][4B length][...payload]
```

**Section IDs:**
- 0x01 - Meta
- 0x02 - Env
- 0x03 - Properties
- 0x04 - Payment

### BTSC (Story)

```
Offset | Size | Field
-------|------|------------------
0      | 4    | Magic ('BTSC')
4      | 2    | Version (BE)
6      | 4    | Passage count (BE)
10     | 4    | Body length (BE)
14     | 4    | CRC32 (BE)
18     | N    | Passages
```

**Passage format:**
```
[4B id][4B nameLen][...name][4B tagsLen][...tags][4B contentLen][...content]
```

All strings are UTF-8 encoded.

## CRC32 Verification

Both formats verify data integrity using CRC-32/ISO-HDLC:
- Computed over: header (without CRC field) + body
- Polynomial: 0xEDB88320
- Initial value: 0xFFFFFFFF
- Final XOR: 0xFFFFFFFF

If CRC fails, the file is considered corrupted (likely NAND flash degradation on cheap devices).

## Error Handling

```javascript
try {
	const story = loadStory('/data/story.bin');
} catch (e) {
	if (e.message.includes('CRC mismatch')) {
		// File corrupted, prompt user to reinstall
		showError('Story file corrupted. Please reinstall.');
	} else if (e.message.includes('Failed to open')) {
		// File missing
		showError('Story not found.');
	} else {
		// Unknown error
		showError('Error: ' + e.message);
	}
}
```

## Testing

Run manual test to generate test binaries:

```bash
node src/bt/__tests__/manual-test.js
```

This creates:
- `src/bt/__tests__/fixtures/test-config.bin`
- `src/bt/__tests__/fixtures/test-story.bin`

Test on actual Vela device using AstroBox or aiot-toolkit simulator.

## Dependencies

- `@system.file` - Vela file I/O API (sync only)
- No external libraries

## Constraints

- QuickJS ES2020 (no async/await, no Proxy, no Reflect)
- Big Endian byte order
- Max string length: 65535 bytes
- Max array/object entries: 65535

## License

AGPL-3.0 (runtime code)

See GNU Affero General Public License for details.
