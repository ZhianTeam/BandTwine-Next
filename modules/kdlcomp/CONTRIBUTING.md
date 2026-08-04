## File Tree
```bash
./
  index.js         - Main export
  src/
    lexer.js       - Tokenizer
    parser.js      - Parser  
    validator.js   - Semantic validation
    encoder.js     - Binary encoder
    errors.js      - Error types
    crc32.js       - CRC32 for checksum
```

## STDOUT Formats
Use Arch `makepkg` style like this:
```bash
:: Marker..
==> Step...
  --> Sub-step...
  --> Sub-step...
  --> Sub-step...
:: warning: configs.kdl:78: ...
  --> Sub-step...
==> Step...
  --> Sub-step...
:: Marker...
```

## Styles
- ANSI color by default for compatibility
- `en_US.UTF-8` By default
