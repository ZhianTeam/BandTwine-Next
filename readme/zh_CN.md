<img src="/src/common/icon.png" width="100px" align="left">

### 结彩 Next

***在小米手环 / 手表上畅玩 Twine。** 但体验远超以往。*

---

**BandTwine** *(结彩)* 是对革命性互动式小说引擎 [Twine](https://twinery.org/) 的第三方移植与实现。

我们将 Twine 强大且高度开放的叙事能力，带到了搭载 HyperOS (NuttX) 的小米智能穿戴设备上。尽管这些设备的资源非常有限 —— 被 [AstroBox](https://github.com/AstralSightStudios/AstroBox-NG) 戏称为 “腕上蒸汽机”（笑）。

## Twee 兼容
厌倦了排查 `{}`、`[]` 和那一长串 `$(...)` 吗？烦透了像配置 Gentoo USE flags 一样去繁琐地预定义变量？我们现在完整支持 Twine 的官方标记语言：**Twee**。
许多图形界面编辑器都能生成 Twee 文件。来看看下面这个**快速对比**：

```json
// 这是原版 BandTwine 的叙事逻辑代码，取自官方示例。
// 臃肿不堪，信噪比极低，信息熵极高，给开发者和作者们带来极大的认知负担。

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

那么，Twee 又是怎样的呢？
> [!IMPORTANT]
> **兼容性说明**
>
> BandTwine Next 目前仅支持 **SugarCube** 故事格式。**在导出之前，请务必检查“默认故事格式”！**
> 
> 如果你是 Twine 老玩家，希望支持更多故事格式（例如 Chapbook），**请提交 Issue 或在米坛留言**告诉我们！

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

简单直观。所见即所得。支持嵌入 JavaScript。支持调用 Vela API。

对于 Twee 的初学者，我们准备了丰富的文档，甚至还有一个 [交互式逐步引导教程](https://huanmeng692.github.io/Tutorial/) 供您参考。[^1]

[^1]: 特别感谢 [@huanmeng692](https://github.com/huanmeng692/) 制作了如此 amazing 的引导教程！

## 功能特性
- [x] **全面兼容 Twine Twee。** 再也不用纠结 “如何退出 Vim” 和 “为什么我的 JSON 格式又报错了”！随意使用任何 Twine 编辑器，导出为 Twee 文件，即可直接集成到你的项目中！转换器也将在 *近期* 推出。
- [x] **原汁原味的 Twine 体验。** 从多层变量、条件分支到随机系统和事件监听器，BandTwine 提供了几乎与 Twine 一样强大的功能集，完全有能力驱动复杂的叙事逻辑。
- [ ] **KDL 配置。** 彻底告别 `meta` 块和那一堆令人抓狂的括号 `{{{{[{[{}]}]}}}}`！此功能仍在开发中，但一旦支持了 KDL 配置…… 你懂的。
- [x] **专为 “蒸汽机” 优化。** 轻量且强大。支持在 Twee 中嵌入 JavaScript，并能照常调用 Vela API。
- [x] **少写代码，多享乐趣。** 一个 BandTwine 项目，即可在小米及红米（REDMI）手环和手表上跨设备运行。
- [x] **100% 纯手工人类代码。** 别忘了，我可是一位货真价实的 [Vela 开发者](https://github.com/fywmjj/better-mb9p-ATRI)。
<p align="left">
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-CN/Written-By-Human-Not-By-AI-Badge-black.svg" alt="所有文档均由人类编写。" />
  </a>
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-CN/Developed-By-Human-Not-By-AI-Badge-black.svg" alt="所有代码均由人类编写、测试和审核。" />
  </a>
</p>

## 支持设备
| 品牌 | 类型 | 型号 | 支持状态 | 备注 |
|-------|------|-------|--------|------|
| 小米 | 智能手环 | 10 系列 | ✓ 完美支持 | 在真 • “蒸汽机” 上通过测试。 |
| | | 9 Pro | ✓ 完美支持 | 在真 • “蒸汽机” 上通过测试。 |
| | | 9（标准版/NFC） | 🟡 部分支持 | 在真 • “蒸汽机” 上通过测试。需要临时变通[^2]。我会尝试修复。 |
| | | 8 Pro | ✓ 完美支持 | |
| | 智能手表 | S5/4/3 | ✓ 完美支持* | 手头没有实机，需要更多的测试反馈。 |
| 红米 | 智能手表 | 5/4 | ⚪ 适配中 | 同 “小米智能手表”。 |
| | 智能手环 | 所有 | × 不支持 | 非 Vela 设备。 |

[^2]: 需要将 `manifest.json` 中的 `designWidth` 修改为 `212`。

<!-- placeholder -->

## 开源协议
继承自原项目 —— **AGPLv3**。

不过，你**完全可以包含非自由 (Non-free) 资产**，无论是商业授权的插画、故事线、脚本等均不受限。

> [!TIP]
> 担心使用 BandTwine 会带来法律风险？别担心，我们已经为您考虑到了。
> 
> 请查看 [NOTICE](/NOTICE) 声明以了解更多详情。

> [!WARNING]
> 根据 [@OrPudding](https://github.com/OrPudding) 的 [原始说明](https://github.com/OrPudding/VelaOS_BandTwine/blob/main/README.md/#-%E5%BC%80%E6%BA%90%E5%8D%8F%E8%AE%AE)，该项目似乎被声明了版权（更确切地说，被视为了 “非自由 / 专有项目”）。
>
> 这显然违反了原有的 LICENSE，也违背了当初 “鼓励共建开源世界” 的承诺。
> 
> 我们选择将权利归还给所有开发者。你 **可以** 自由移除 “关于” 页面中的任何声明，只需保留本项目的链接即可。
