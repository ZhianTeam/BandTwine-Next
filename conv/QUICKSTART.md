# BandTwine Next 快速开始指南
***用 NeG 5 分钟上手 BandTwine Next 迁移***

> [!TIP]
> 专门为中国宝宝们写的简体中文版。不再为手动迁移侦错而烦恼～

### 准备旧版文件
将你的旧版 BandTwine 项目文件拷贝过来放入 `bandtwine_src/` 目录。

如果你在旧版 BandTwine 程式基座上进行创作过，那么这个文件夹理应是存在的。
```bash
project-root/
└── bandtwine_src/
    ├── game-data.json  # 或者 metadata.json + 其他节点文件
    └── ...
```
NeG 迁移器支持混合式 (元信息和节点全在一个文件里) 和拆分式 (元信息单独在 `metadata.json`，节点在其它文件里) 全自动迁移。

### 运行迁移
> [!TIP]
> 下面的 `node conv/neg.js` 可换成 `npm run neg` 或者直接执行 `./conv/neg.js` (Linux 或者 macOS)。

```bash
# 基础迁移（会删除原文件）
node conv/neg.js -o

# 保留原文件
node conv/neg.js -o -p

# 查看详细过程
node conv/neg.js -v -o
```

### 检验产出物
迁移完成后，确保检验产出的文件：
```bash
src/bt/
├── config.kdl   # BandTwine Next 配置档
└── story.twee   # Twee 3 故事文件
```

### 手动调整
这是一个可选步骤，只当 NeG 无法自动迁移某些内容时才这样做。

NeG 会自动转换大部分内容，但某些高级功能可能需要手动调整：

1. **复杂表达式**: 检验 `<<set>>` 宏中的 JavaScript 表达式
2. **图片路径**: 验证动态图片路径是否正确
3. **监听器**: 旧版的 `addListener` 动作需要手动实现
4. **自定义宏**: 添加任何需要的 SugarCube 自定义宏

### 常见问题
**Q: 迁移后如何编译？**
A: 没有 `scripts/compile.js` 了哦～使用 BandTwine Next 全新的 **Usagi (兔兔)** 编译器：
```bash
node modules/usagi.js --path . build
```

**Q: 输出文件已存在怎么办？**
```bash
# 用 -o (--overwrite) 参数覆盖
node conv/neg.js -o
```

**Q: 想保留旧文件怎么办？**
```bash
# 用 -p (--preserve) 参数
# 只供留档使用。一般建议不带这个 arg 直接删掉
node conv/neg.js -o -p
```

**Q: 多个 JSON 文件如何处理？**  
NeG 会自动合并所有 `bandtwine_src/*.json` 文件。如果有冲突，用 `-f` (--force) 参数。

### 我想看看 NeG 是怎么运作的
```bash
# 下载官方示例
curl -sL https://github.com/OrPudding/Velaos_BandTwine/archive/refs/heads/main.tar.gz \
  | tar -xz --strip-components=1 "VelaOS_BandTwine-main/bandtwine_src"

# 运行迁移
node conv/neg.js -v -o
```

### 完整参数列表
```
-q  --quiet       静默模式
-v  --verbose     详细输出
-s  --strict      严格模式（警告→错误）
-c  --comment     支持 JSONC
-f  --force       强制解决冲突
-o  --overwrite   覆盖已存在文件
-p  --preserve    保留原始文件
-V  --version     显示版本
    --c-locale    英文输出
```

---

就这么简单！**欢迎来到 BandTwine Next Generation!** ✧*｡٩(ˊᗜˋ*)و✧*
