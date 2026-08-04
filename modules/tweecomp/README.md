<img src="/src/assets/icon/icon.png" width="100px" align="left">

### Twee Compiler for BandTwine Next

*SugarCube v2 (Twee 3) Format Support*

---

## Supported Format
- **Twee 3 Specification**: SugarCube v2 compatible
- **Macros**: `<<if>>`, `<<set>>`, `<<link>>`, `<<script>>`, etc.
- **Tags**: `<<tag "name">>` for passage marking
- **Variables**: `$variable` syntax

## Usage
By default it will be called by a wrapper. Also you can manually run it by executing:
```bash
node $PWD/index.js <input-dir> <out.bin>
```

## Binary Structure
```
┌─────────────────────────────────────────────────────────┐
│ Magic         4B  Actually ASCII "BT  S  C"             │
│ Format Ver    2B  uint16 BE                             │
│ Passage Count 4B  uint32 BE                             │
│ Body Length   4B  uint32 BE Length of all passages      │
│ CRC-32        4B  for [Magic..Body]                     │
│─────────────────────────────────────────────────────────│
│ Passages      …[id(4) + len(4) + name + tags + text]    │
└─────────────────────────────────────────────────────────┘
```

## Output
Compiles to `story.bin` in BTNC-compatible binary format.
