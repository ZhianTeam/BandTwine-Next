<img src="/src/common/icon.png" width="100px" align="left">

### BandTwine Next

***Play Twine on your Mi Band.** But much better.*

---

**BandTwine** is a 3party implementation/port of [Twine](https://twinery.org/), which is a groundbreaking interactive fiction engine. 

We’ve brought its powerful, open-ended storytelling capabilities to resource-constrained Xiaomi wearables running HyperOS (NuttX) - affectionately dubbed the "Wrist Steam Engine" by [AstroBox](https://github.com/AstralSightStudios/AstroBox-NG) (lol).

## Core: Twee Compatibility
Tired at checking out `{}`, `[]` and a lot of `$(...)`? Angry at pre-defining variables like setting up USE flags? We fully support Twine's official markup language: **Twee**.
Many GUIs can create Twees. Check this **quick comparison**:

```json
// This is original BandTwine storytelling logic.

{
  "start_node": {
    "title": "宁静的早晨",
    "text": "你从睡梦中醒来，阳光透过窗帘洒在你的脸上。这是一个新的开始。\n\n你决定 {0} 还是 {1}？",
    "links": [
      { "text": "起床", "target": "wake_up_scene" },
      { "text": "再睡一会儿", "target": "sleep_more_scene" }
    ],
    "actions": [
      { "type": "set", "target": "var.player.energy", "value": 100 },
      { "type": "toast", "message": "新的一天开始了！" }
    ]
  }
}
```

What about Twee?
```twee
:: 宁静的早晨
<<set $player.energy = 100>>
<<run Vela.toast("新的一天开始了！")>>
你从睡梦中醒来，阳光透过窗帘洒在你的脸上。这是一个新的开始。

你决定 [[起床->wake_up_scene]] 还是 [[再睡一会儿->sleep_more_scene]]？
```

## Features
- [x] **Full Compatibility of Twine Twee.** No "how to exit Vim" and "why my JSON malformed" anymore! Use any Twine editor, export as Twee, then integrate it to your project! Converter will be developed *soon*.
- [x] **Twine flavoured.** From multi-layered variables and conditional branching to randomized systems and event listeners, BandTwine offers a feature set nearly as robust as Twine itself, fully capable of driving complex narrative logic.
- [x] **Optimized for Steam Engine.** Lightweight and Powerful. Supports embedded JavaScript inside Twee, call Vela APIs as usual.
- [x] **Code less, more Fun.** One BandTwine project, run across Xiaomi & REDMI's bands and watches.
- [x] **100% Traditional Human Coding.** Don't forget that I'm a [Vela developer](https://github.com/fywmjj/better-mb9p-ATRI).
<p align="left">
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="https://raw.githubusercontent.com/GaoyiPlayOS/gaoyi-setup-wizard/main/assets/badges/svg/Written-By-a-Human-Not-By-AI-Badge-black.svg" alt="All documents are written by a human." />
  </a>
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="https://raw.githubusercontent.com/GaoyiPlayOS/gaoyi-setup-wizard/main/assets/badges/svg/Developed-By-a-Human-Not-By-AI-Badge-black.svg" alt="All codes are written, tested and reviewed by a human." />
  </a>
</p>

## Supported Devices
| Brand | Type | Model | Status | Note |
|-------|------|-------|--------|------|
| Xiaomi | Smart Band | 10 Series | ✓ Full Support | Tested on real Steam Engine. |
| | | 9 Pro | ✓ Full Support | Tested on real Steam Engine. |
| | | 9 (Standard/NFC) | 🟡 Partial Support | Tested on real Steam Engine. Needs a workaround [^1]. I'll try to fix it. |
| | | 8 Pro | ✓ Full Support | |
| | Smart Watch | S5/4/3 | ✓ Full Support* | I don't have a real one. More reports needed. |
| REDMI | Smart Watch | 5/4 | ⚪ In Progress | Same as *Xiaomi Smart Watch*. |
| | Smart Band | *any* | × Unsupported | **Non-Vela** devices. |

[^1]: Needs to change `designWidth` in `manifest.json` to `212`.

<!-- placeholder -->

## License
Inherited from original project - **AGPLv3**.
However, you **can include non-free assets**, whether they're commercial licensed artworks, storylines, scripts, etc. 

> [!WARNING]
> Based on [original description](https://github.com/OrPudding/VelaOS_BandTwine/blob/main/README.md/#-%E5%BC%80%E6%BA%90%E5%8D%8F%E8%AE%AE) of [@OrPudding](https://github.com/OrPudding), this project seems to be **copyrighted** (or more precisely, **"non-free/proprietary project"**).
>
> This already violates the LICENSE and broke the promise of "鼓励共建开源世界" (Fostering a collaborative open-source world).
> 
> We give privileges to all developers. You **can** remove ANY notice in *"About"* page, just keep the project's link. 
