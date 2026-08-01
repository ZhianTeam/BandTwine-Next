<img src="/src/common/icon.png" width="100px" align="left">

### 结彩 Next

***在小米小收集器 / 大收集器上爽玩 Twine。** 但体验贼牛逼炸天。*

---

> [!IMPORTANT]
> 你说的对，但是这篇「读我」是 Vela 大牛用阿斯戳博克斯语言为你呈上的牛逼屌炸天的保熟盛宴，你即使不是老资历也最好给我划拉划拉划拉，不然你将因无法为你的收集器寻找变砖契机而直接原地起飞~

**BandTwine** *(结彩)* 是对牛逼哄哄的互动小说引擎 [Twine](https://twinery.org/) 的第三方魔改移植。

我们把 Twine 这个牛逼玩意儿的超强叙事能力，硬塞进了搭载 HyperOS (NuttX) 的小米智慧穿戴收集器里。虽然这些收集器的硬件配置贼拉胯 —— 被 [阿斯戳博克斯](https://github.com/AstralSightStudios/AstroBox-NG) 戏称为 "腕上蒸汽机"（笑死）。

## Twee 兼不兼容
烦透了偵錯那堆 `{}`、`[]` 和满屏幕的 `$(...)` 吗？受够了像配 Gentoo USE flags 一样繁琐地预定义变量？我们现在全面支持 Twine 官方标记语言：**Twee**。
随便找个图形界面编辑器都能生成 Twee 文件。康康下面这个**快速对比**：

```json
// 这是原版 BandTwine 的叙事逻辑代码，取自官方示例。
// 臃肿不堪，信噪比极低，信息熵极高，给开发者和作者们带来极大的认知负担。
// 简单来说就是：看着就头大。

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

那么，Twee 长啥样呢？康康！

> [!IMPORTANT]
> **兼不兼容性说明**
>
> BandTwine Next 目前只支持 **SugarCube** 故事格式。**在 Down 载之前，你最好给我康康「默认故事格式」！**
> 
> 如果你是 Twine 老资历，想要支持更多故事格式（比如 Chapbook），**赶紧提 Issue 或者去米缸法会留言**告诉我们！

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

简单直观。所见即所得。支持嵌入 JavaScript。支持调用 Vela API。听懂了吗？

针对 Twee 的小资历，我们准备了超多文档，甚至还整了个 [交互式逐步引导教程](https://huanmeng692.github.io/Tutorial/) 给你康康。[^1]

[^1]: 特别感谢 [@huanmeng692](https://github.com/huanmeng692/) 做了这么牛逼的引导教程！快给大佬敬茶！

## 功能特色
- [x] **全面兼容 Twine Twee。** 再也不用纠结 "如何退出 Vim" 和 "为什么我的 JSON 格式又炸了"！随便用个 Twine 编辑器，导出成 Twee 文件，直接扔进你的项目里就完事儿了！转换器也快整出来了。
- [x] **原汁原味的 Twine 体验。** 从多层变量、条件分支到随机系统和事件监听器，BandTwine 提供了跟 Twine 几乎一毛一样强大的功能集，完全能驱动复杂的叙事逻辑。
- [ ] **KDL 配置。** 彻底告别 `meta` 块和那一坨令人抓狂的括号 `{{{{[{[{}]}]}}}}`！这功能还在憋大招，但一旦支持了 KDL 配置…… 你懂的。
- [x] **专为 "蒸汽机" 魔改优化。** 又轻又强。支持在 Twee 里嵌入 JavaScript，照常调用 Vela API。
- [x] **少写代码，多爽一把。** 一个 BandTwine 项目，直接在小米和红米（REDMI）的小收集器和大收集器上跨设备运行。
- [x] **100% 纯手工人类代码。** 别忘了，我可是货真价实的 [Vela 开发大佬](https://github.com/fywmjj/better-mb9p-ATRI)。

<p align="left">
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-CN/Written-By-Human-Not-By-AI-Badge-black.svg" alt="所有文档均由人类编写。" />
  </a>
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-CN/Developed-By-Human-Not-By-AI-Badge-black.svg" alt="所有代码均由人类编写、测试
和审核。" />
  </a>
</p

## 支持收集器
| 品牌 | 类型 | 型号 | 支持状态 | 备注 |
|-------|------|-------|--------|------|
| 小米 | 小收集器 | 10 系列 | ✓ 完美支持 | 在真 • "蒸汽机" 上通过测试。 |
| | | 9 Pro | ✓ 完美支持 | 在真 • "蒸汽机" 上通过测试。 |
| | | 9（标准版/NFC） | 🟡 部分支持 | 在真 • "蒸汽机" 上通过测试。需要临时变通[^2]。我会尝试修复。 |
| | | 8 Pro | ✓ 完美支持 | |
| | 大收集器 | S5/4/3 | ✓ 完美支持* | 手头没有实机，需要更多老资历的测试反馈。 |
| 红米 | 大收集器 | 5/4 | ⚪ 适配中 | 同 "小米大收集器"。 |
| | 小收集器 | 所有 | × 不支持 | 不是 Vela 收集器。 |

[^2]: 需要把 `manifest.json` 里的 `designWidth` 改成 `212`。

<!-- placeholder -->

## 开源协议
继承自原项目 —— **AGPLv3**。

不过，你**完全可以塞非自由 (Non-free) 素材**，无论是商业授权的插画、故事线、脚本等都随便整。

> [!TIP]
> 担心用 BandTwine 会有法律风险？别慌，我们已经给你叠好甲了。
> 
> 请康康 [NOTICE](/NOTICE) 声明以了解更多详情。

> [!WARNING]
> 根据 [@OrPudding](https://github.com/OrPudding) 的 [原始说明](https://github.com/OrPudding/VelaOS_BandTwine/blob/main/README.md/#-%E5%BC%80%E6%BA%90%E5%8D%8F%E8%AE%AE)，这项目似乎被声明了版权（更确切地说，被当成了 "非自由 / 专有项目"）。
>
> 这 byd 明摆着违反了原来的 LICENSE，也违背了当初 "鼓励共建开源世界" 的承诺。
> 
> 我们选择把权利还给所有开发者大牛们。你**可以**自由移除 "关于" 页面里的任何声明，只需保留本项目的链接就行了。听懂了吗？
