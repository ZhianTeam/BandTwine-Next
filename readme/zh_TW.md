<img src="/src/assets/icon/icon.png" width="100px" align="left">

### 結彩 Next

***在小米手環 / 手錶上暢玩 Twine。** 但體驗遠超以往。*

---

**BandTwine** *(結彩)* 是對革命性互動式小說引擎 [Twine](https://twinery.org/) 的第三方移植與實作。

我們將 Twine 強大且高度開放的敘事能力，帶到了搭載 HyperOS (NuttX) 的小米智慧穿戴裝置上。儘管這些裝置的資源非常有限 —— 被 [AstroBox](https://github.com/AstralSightStudios/AstroBox-NG) 戲稱為「腕上蒸汽機」（笑）。

## Twee 相容性
煩透了偵錯 `{}`、`[]` 和那一長串 `$(...)` 嗎？厭倦了像設定 Gentoo USE 編譯標記一樣，得繁瑣地預先定義變數？我們現在完整支援 Twine 的官方標記語言：**Twee**。
許多圖形介面編輯器都能生成 Twee 檔案。來看看下面這個**快速比較**：

```json
// 這原是 BandTwine 的敘事邏輯程式碼，取自官方範例。
// 臃腫不堪、訊噪比極低、資訊熵極高，給開發者與作者帶來極大的認知負擔。

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
      "text": "你在一間安靜的房間裡醒來，陽光透過窗簾的縫隙灑在地板上。房間的另一頭，有一扇緊閉的木門。你決定 {0}、{1}，或是 {2}？",
      "links": [
        { "text": "查看窗外", "target": "look_outside" },
        { "text": "檢查床邊的桌子", "target": "check_desk" },
        { "text": "走向那扇門", "target": "locked_door" }
      ]
    },
    "look_outside": {
      "text": "你拉開窗簾，外面是一片寧靜的森林，薄霧瀰漫在樹林間。\n\n{0}",
      "links": [
        { "text": "回到房間中央", "target": "start" }
      ]
    },
    "check_desk": {
      "text": "你走向桌子，上面放著一盞熄滅的油燈和一本合上的舊書。你決定 {0}，或者 {1}。",
      "links": [
        {
          "text": "拿起書本",
          "target": "found_key",
          "actions": [
            { "type": "set", "target": "var.player.hasKey", "value": true }
          ]
        },
        { "text": "先不管它", "target": "start" }
      ]
    },
    "found_key": {
      "text": "你拿起了書，發現書下壓著一枚小小的黃銅鑰匙。你把它放進了口袋。\n\n{0}",
      "links": [
        { "text": "回到房間中央", "target": "start" }
      ]
    },
    "locked_door": {
      "text": "這是一扇厚重的木門，上面有一個老舊的黃銅鎖孔。\n\n{0}\n{1}\n\n鑰匙狀態：{var.player.hasKey}",
      "links": [
        {
          "text": "用鑰匙開門",
          "target": "door_unlocked",
          "condition": "var.player.hasKey"
        },
        { "text": "轉身離開", "target": "start" }
      ]
    },
    "door_unlocked": {
      "text": "你將鑰匙插入鎖孔，輕輕一轉，門開了。門外是通往自由的走廊。你的冒險，才剛剛開始……"
    }
  }
}
```

那麼，Twee 看起來又是如何呢？
> [!IMPORTANT]
> **相容性說明**
>
> BandTwine Next 目前僅支援 **SugarCube** 故事格式。**在匯出之前，請務必檢查「預設故事格式」！**
> 
> 如果你是 Twine 的老玩家，希望支援更多故事格式（例如 Chapbook），**請提交 Issue 或在米壇留言**告訴我們！

```twee
:: 起始
<<tag "start">>
<<set $gotKey to false>>
你在一間安靜的房間裡醒來，陽光透過窗簾的縫隙灑在地板上。房間的另一頭，有一扇緊閉的木門。
你決定[[查看窗外|看看窗外]]、[[檢查床邊的桌子|看看桌子]]還是[[走向那扇門|看看門]]呢？

:: 看看窗外
你拉開窗簾，外面是一片寧靜的森林，薄霧瀰漫在樹林間。
[[回到房間中央|起始]]

:: 看看桌子
<<script 'prompt.showToast({ message: `目前鑰匙狀態：$gotKey`, duration: 1500 })'>>
你走向桌子，上面放著一盞熄滅的油燈和一本合上的舊書。你決定[[拿起書本|拿起書本]][$gotKey to true]還是[[先不管它|起始]]呢？

:: 看看門
<<script 'prompt.showToast({ message: `目前鑰匙狀態：$gotKey`, duration: 1500 })'>>
這是一扇厚重的木門，上面有一個老舊的黃銅鎖孔。

<<if $gotKey === true>>
你想起了剛剛找出的鑰匙，你可以[[用鑰匙開門|打開那扇門]]，也可以[[轉身離開|起始]]繼續探索。
<<else>>
大門是緊閉的。你也沒有東西能打開它，無奈只好[[轉身離開|起始]]。
<</if>>

:: 拿起書本
<<script 'prompt.showToast({ message: `鑰匙找到了！目前鑰匙狀態：$gotKey`, duration: 1500 })'>>
你拿起了書，發現書下壓著一枚小小的黃銅鑰匙。
[[回到房間中央|起始]]

:: 打开那扇门
你將鑰匙插入鎖孔，輕輕一轉，門開了。門外是通往自由的走廊。你的冒險，才剛剛開始……
```

簡單直觀。所見即所得。支援嵌入 JavaScript。支援呼叫 Vela API。

針對 Twee 的初學者，我們準備了豐富的說明文件，甚至還有一個 [互動式逐步引導教學](https://huanmeng692.github.io/Tutorial/) 供您參考。[^1]

[^1]: 特別感謝 [@huanmeng692](https://github.com/huanmeng692/) 製作了如此 amazing 的引導教學！

## 功能特色
- [x] **全面相容 Twine Twee。** 再也不用糾結「如何退出 Vim」或「為什麼我的 JSON 又跳語法錯誤」！隨心所欲使用任何 Twine 編輯器，匯出為 Twee 格式，即可輕鬆整合至你的專案！搭配 [NeG Converter](/conv/QUICKSTART.md) 使用，更能實現從舊版 BandTwine JSON 的無縫遷移。
- [x] **優雅的 KDL 設定。** 徹底告別繁瑣的 `metadata` 屬性區塊與令人頭大的 `{{{{[{[{}]}]}}}}` 巢狀結構！KDL 設定對人類極為友善，不僅支援透過 `/-` 進行節點級註解，還擁有結構化的多參數節點設計，更能直接編譯為二進位 TLV 格式，實現零執行階段開銷。
- [x] **專為「蒸汽機」深度最佳化。** 輕量敏捷，功能強大。支援在 Twee 中直接內嵌 JavaScript，各類 Vela API 依然任你調遣。
- [x] **少寫程式碼，多享樂趣。** 只需一份 BandTwine 專案，即可輕鬆跨裝置執行於小米與 REDMI 的各大手環及手錶裝置。
- [x] **100% 傳統純手工人類編程。** 可別忘了，我本身就是一名 [Vela 開發者](https://github.com/fywmjj/better-mb9p-ATRI)。
<p align="left">
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-TW/Written-By-Human-Not-By-AI-Badge-black.svg" alt="所有說明文件均由人類編寫。" />
  </a>
  <a href="https://notbyai.fyi/" target="_blank">
    <img src="/readme/badge/NotByAI/zh-TW/Developed-By-Human-Not-By-AI-Badge-black.svg" alt="所有程式碼均由人類編寫、測試和審核。" />
  </a>
</p>

## 支援裝置
| 品牌 | 類型 | 型號 | 支援狀態 | 備註 |
|-------|------|-------|--------|------|
| 小米 | 智慧手環 | 10 系列 | ✓ 完美支援 | 在真 •「蒸汽機」上通過測試。 |
| | | 9 Pro | ✓ 完美支援 | 在真 •「蒸汽機」上通過測試。 |
| | | 9 (標準版 / NFC) | 🟡 部分支援 | 在真 •「蒸汽機」上通過測試。需要暫時變通[^2]。我會嘗試修復。 |
| | | 8 Pro | ✓ 完美支援 | |
| | 智慧手錶 | S5/4/3 | ✓ 完美支援* | 手頭沒有實機，需要更多的測試回饋。 |
| 紅米 | 智慧手錶 | 5 / 4 | ⚪ 相容性測試中 | 同「小米智慧手錶」。 |
| | 智慧手環 | 所有 | × 不支援 | 非 Vela 裝置。 |

[^2]: 需要將 `manifest.json` 中的 `designWidth` 修改為 `212`。

<!-- placeholder -->

## 開源授權
繼承自原專案 —— **AGPLv3**。

不過，你**完全可以包含非自由 (Non-free) 資產**，無論是商業授權的插圖、故事線、腳本等均不受限。

> [!TIP]
> 擔心使用 BandTwine 會帶來法律風險？別擔心，我們已經為您考慮到了。
> 
> 請查看 [NOTICE](/NOTICE) 聲明以了解更多詳情。

> [!WARNING]
> 根據 [@OrPudding](https://github.com/OrPudding) 的 [原始說明](https://github.com/OrPudding/VelaOS_BandTwine/blob/main/README.md/#-%E5%BC%80%E6%BA%90%E5%8D%8F%E8%AE%AE)，該專案似乎被宣告了著作權（更確切地說，被視為「非自由 / 專有專案」）。
> 
> 這顯然違反了原有的 LICENSE，也違背了當初「鼓勵共建開源世界」的承諾。
> 
> 我們選擇將權利歸還給所有開發者。你可以自由移除「關於」頁面中的任何宣告，只需保留本專案的連結即可。
