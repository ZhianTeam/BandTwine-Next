<img src="/src/common/icon.png" width="100px" align="left">

### BandTwine Next

***Play Twine on your Mi Band / Watch.** But much better.*

---

<div align="center">
    <h3>We Can Speak Your Language</h3>
    <b>Select Your IME: </b><a href="/readme/zh_CN.md"><kbd>拼</kbd></a> • <a href="/readme/zh_TW.md"><kbd>注</kbd></a> • <a href="/readme/zh_Meme.md"><kbd>梗</kbd></a>  • <a href="/readme/ja_JP.md"><kbd>あ</kbd></a>
</div>

---

**BandTwine** is a 3party implementation/port of [Twine](https://twinery.org/), which is a groundbreaking interactive fiction engine. 

We’ve brought its powerful, open-ended storytelling capabilities to resource-constrained Xiaomi wearables running HyperOS (NuttX) - affectionately dubbed the "Wrist Steam Engine" by [AstroBox](https://github.com/AstralSightStudios/AstroBox-NG) (lol).

## Core: Twee Compatibility
Tired at checking out `{}`, `[]` and a lot of `$(...)`? Angry at pre-defining variables like setting up USE flags? We fully support Twine's official markup language: **Twee**.
Many GUIs can create Twees. Check this **quick comparison**:

```json
// This is original BandTwine storytelling logic. Code from official's example.
// It's completely bloat. With very low SNR, excessive entropy and an overwhelming cognitive load.

{
  "metadata": {
    "indexNode": "start"
  },
  "variables": {
    "player": {
      "hasKey": false
    }
  },
  "nodes": {
    "start": {
      "text": "你在一间安静的房间里醒来，阳光透过窗帘的缝隙洒在地板上。房间的另一头，有一扇紧闭的木门。你决定 {0}、{1}，或是 {2}？",
      "links": [
        { "text": "查看窗外", "target": "look_outside" },
        { "text": "检查床边的桌子", "target": "check_desk" },
        { "text": "走向那扇门", "target": "locked_door" }
      ]
    },
    "look_outside": {
      "text": "你拉开窗帘，外面是一片宁静的森林，薄雾弥漫在树林间。\n\n{0}",
      "links": [
        { "text": "回到房间中央", "target": "start" }
      ]
    },
    "check_desk": {
      "text": "你走向桌子，上面放着一盏熄灭的油灯和一本合上的旧书。你决定 {0}，或者 {1}。",
      "links": [
        {
          "text": "拿起书本",
          "target": "found_key",
          "actions": [
            { "type": "set", "target": "var.player.hasKey", "value": true }
          ]
        },
        { "text": "先不管它", "target": "start" }
      ]
    },
    "found_key": {
      "text": "你拿起了书，发现书下压着一枚小小的黄铜钥匙。你把它放进了口袋。\n\n{0}",
      "links": [
        { "text": "回到房间中央", "target": "start" }
      ]
    },
    "locked_door": {
      "text": "这是一扇厚重的木门，上面有一个老旧的黄铜锁孔。\n\n{0}\n{1}\n\n钥匙状态：{var.player.hasKey}",
      "links": [
        {
          "text": "用钥匙开门",
          "target": "door_unlocked",
          "condition": "var.player.hasKey"
        },
        { "text": "转身离开", "target": "start" }
      ]
    },
    "door_unlocked": {
      "text": "你将钥匙插入锁孔，轻轻一转，门开了。门外是通往自由的走廊。你的冒险，才刚刚开始……"
    }
  }
}
```

What about Twee?
> [!IMPORTANT]
> **Compatibility Note**
>
> BandTwine Next currently support **SugarCube** story format only. **Check the "Default Story Format" before you export**!
> 
> If you're a Twine OG and wants more story formats support (e.g. Chapbook), **submit an issue OR leave a comment in BandBBS** to let us know!

```twee
:: 起始
<<tag "start">>
<<set $gotKey to false>>
你在一间安静的房间里醒来，阳光透过窗帘的缝隙洒在地板上。房间的另一头，有一扇紧闭的木门。
你决定[[查看窗外|看看窗外]]、[[检查床边的桌子|看看桌子]]还是[[走向那扇门|看看门]]呢？

:: 看看窗外
你拉开窗帘，外面是一片宁静的森林，薄雾弥漫在树林间。
[[回到房间中央|起始]]

:: 看看桌子
<<script 'prompt.showToast({ message: `当前钥匙状态：$gotKey`, duration: 1500 })'>>
你走向桌子，上面放着一盏熄灭的油灯和一本合上的旧书。你决定[[拿起书本|拿起书本]][$gotKey to true]还是[[先不管它|起始]]呢？

:: 看看门
<<script 'prompt.showToast({ message: `当前钥匙状态：$gotKey`, duration: 1500 })'>>
这是一扇厚重的木门，上面有一个老旧的黄铜锁孔。

<<if $gotKey === true>>
你想起了刚刚找出的钥匙，你可以[[用钥匙开门|打开那扇门]]，也可以[[转身离开|起始]]继续探索。
<<else>>
大门是紧闭的。你也没有东西能打开它，无奈只好[[转身离开|起始]]。
<</if>>

:: 拿起书本
<<script 'prompt.showToast({ message: `钥匙找到了！当前钥匙状态：$gotKey`, duration: 1500 })'>>
你拿起了书，发现书下压着一枚小小的黄铜钥匙。
[[回到房间中央|起始]]

:: 打开那扇门
你将钥匙插入锁孔，轻轻一转，门开了。门外是通往自由的走廊。你的冒险，才刚刚开始……
```

Simple. WYSIWYG. Embedded JavaScript. Vela API.

For beginners of Twee there were many docs and even an [interactive step-by-step guide](https://huanmeng692.github.io/Tutorial/) for you.[^1]

[^1]: Best thanks to [@huanmeng692](https://github.com/huanmeng692/) for creating that amazing guide!

## Features
- [x] **Full Compatibility of Twine Twee.** No "how to exit Vim" and "why my JSON malformed" anymore! Use any Twine editor, export as Twee, then integrate it to your project! Converter will be developed *soon*.
- [x] **Twine flavoured.** From multi-layered variables and conditional branching to randomized systems and event listeners, BandTwine offers a feature set nearly as robust as Twine itself, fully capable of driving complex narrative logic.
- [ ] **KDL Config.** Say goodbye to the `meta` block and `{{{{[{[{}]}]}}}}`! This is still in Progress, but with KDL config... You will know that.
- [x] **Optimized for Steam Engine.** Lightweight and Powerful. Supports embedded JavaScript inside Twee, call Vela APIs as usual.
- [x] **Code less, more Fun.** One BandTwine project, run across Xiaomi & REDMI's bands and watches.
- [x] **100% Traditional Human Coding.** Don't forget that I'm a [Vela developer](https://github.com/fywmjj/better-mb9p-ATRI).
<p align="left">
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/en-US/Written-By-Humans-Not-By-AI-Badge-black.svg" alt="All documents are written by a human." />
  </a>
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/en-US/Developed-By-Humans-Not-By-AI-Badge-black.svg" alt="All codes are written, tested and reviewed by a human." />
  </a>
</p>

## Supported Devices
| Brand | Type | Model | Status | Note |
|-------|------|-------|--------|------|
| Xiaomi | Smart Band | 10 Series | ✓ Full Support | Tested on real Steam Engine. |
| | | 9 Pro | ✓ Full Support | Tested on real Steam Engine. |
| | | 9 (Standard/NFC) | 🟡 Partial Support | Tested on real Steam Engine. Needs a workaround [^2]. I'll try to fix it. |
| | | 8 Pro | ✓ Full Support | |
| | Smart Watch | S5/4/3 | ✓ Full Support* | I don't have a real one. More reports needed. |
| REDMI | Smart Watch | 5/4 | ⚪ In Progress | Same as *Xiaomi Smart Watch*. |
| | Smart Band | *any* | × Unsupported | **Non-Vela** devices. |

[^2]: Needs to change `designWidth` in `manifest.json` to `212`.

<!-- placeholder -->

## License
Inherited from original project - **AGPLv3**.
However, you **can include non-free assets**, whether they're commercial licensed artworks, storylines, scripts, etc. 

> [!TIP]
> Worried about the legal risks of using BandTwine? We've got you covered.
> 
> Check out the [NOTICE](/NOTICE) document to learn more.

> [!WARNING]
> Based on [original description](https://github.com/OrPudding/VelaOS_BandTwine/blob/main/README.md/#-%E5%BC%80%E6%BA%90%E5%8D%8F%E8%AE%AE) of [@OrPudding](https://github.com/OrPudding), this project seems to be **copyrighted** (or more precisely, **"non-free/proprietary project"**).
>
> This already violates the LICENSE and broke the promise of "鼓励共建开源世界" (Fostering a collaborative open-source world).
> 
> We give privileges to all developers. You **can** remove ANY notice in *"About"* page, just keep the project's link. 
