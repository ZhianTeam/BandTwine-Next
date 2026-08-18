# Device Tree for Usagi
## 1. Format
```kdl
codename {                              // See `## 2.`
    pretty "Pretty Release Name"        // e.g. "Xiaomi Smart Band 9 Pro"
    type "band"                         // band || watch
    manufacturer {
        brand ""                        // Xiaomi || REDMI
        class ""                        // "Smart Band" || "Smart Band"
    }
    mcu {
        manufacturer "BES"              // "BES" || "Apollo"
        chip "2700"                     // BES 2700
        series "IMP"                    // BES 2700IMP
    }
    screen {
        reported "rect"                 // result `screenShape` of `device.getInfo()`
                                        // rect || circle || pill-shaped (API v3+)
        w 336                           // `screenWidth`
        h 480                           // `screenHeight`
    }
    system {
        developer "Xiaomi"              // USUALLY Immutable
        class "HyperOS"                 // USUALLY Immutable
        version 2.0                     // 1.0 || 2.0 || 3.0
        firmware {
            min 1.0.96                  // minimal RELEASE firmware version (not include beta)
            latest 3.1.175              // latest firmware version (including beta)
        }
        status "active"                 // "active" || "eol" (still selling but seems no firmware update anymore) || "discontinued"
    }
    js {
        engine "qjs"
        ability "protobuf" "compiled"   // Depend on device
        language "generic" "es5" "es6"
    }
    // Available Vela JavaScript APIs definition
    api {
        app {                           // app.* (@system.app)
            getInfo                     // Able to `app.getInfo()`
            loadLibrary                 // Able to `app.loadLibrary()`
            terminate                   // Able to `app.terminate()`
        }
        // ... other APIs
    }
}
```

## 2. Device Codename Cheatsheet
### Xiaomi Smart Band
- `m67`: Xiaomi Smart Band 8 Pro
- `n66`: Xiaomi Smart Band 9
- `n67`: Xiaomi Smart Band 9 Pro
- `n69`: Xiaomi Smart Band 9 Active
- `o66`: Xiaomi Smart Band 10
- `p67`: Xiaomi Smart Band 10 Pro

### Xiaomi Smart Watch
- `k63`: Xiaomi Watch Color 2
- `k62`: Xiaomi Watch S1
- `l61`: Xiaomi Watch S1 Pro
- `k63`: Xiaomi Watch S1 Active
- `m62`: Xiaomi Watch S2
- `n62`: Xiaomi Watch S3
- `o62`: Xiaomi Watch S4
- `n62s`: Xiaomi Watch S4 Sport
- `o63`: Xiaomi Watch S4 41mm
- `n60`: Xiaomi Watch H1
- `n60e`: Xiaomi Watch H1 E
- `p62`: Xiaomi Watch S5

### Redmi/REDMI Watch
- `k65`: Redmi Watch 2
- `k65b`: Redmi Watch 2 Lite
- `m65`: Redmi Watch 3
- `m65a`: Redmi Watch 3 青春版
- `m65a`: Redmi Watch 3 Active
- `n65`: Redmi Watch 4
- `o65`: REDMI Watch 5
- `n65a`: Redmi Watch 5 Active
- `n65b`: Redmi Watch 5 Lite
- `n65c`: Redmi Watch Move
- `p65`: REDMI Watch 6
