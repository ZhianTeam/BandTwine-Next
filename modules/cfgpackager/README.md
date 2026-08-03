<img src="/src/assets/icon/icon.png" width="100px" align="left">

### `4B 44 4C 20 50 61 72 73 65 72 20 26 20 45 6E 63 6F 64 65 72 20 66 6F 72 20 42 54 20 4E 65 78 74`

*KDL Util for BandTwine Next*

---

## Usage
By default it will be called by a wrapper. Also you can manually run it by executing:
```bash
node $PWD/index.js <in.kdl> <out.bin>
```

## How Can BandTwine Next Read it?
By `file.readArrayBuffer` (Vela).

## Binary Structure
See below:
```
┌─────────────────────────────────────────────────────────┐
│ Magic         4B  Actually ASCII "BT  N  C"             │
│ Format Ver    2B  uint16 BE                             │
│ Section Count 1B  Sections                              │
│ Body Length   4B  uint32 BE Length pf all sections      │
│ CRC-32        4B  for [Magic..Body]                     │
│─────────────────────────────────────────────────────────│
│ Sections      …[id(1) + len(4) + payload(len)] × N      │
└─────────────────────────────────────────────────────────┘
```
