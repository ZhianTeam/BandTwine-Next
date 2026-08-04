<img src="/readme/icon/usagi.png" width="100px" align="left">

### Usagi

A FOSS Compiler that actually does things (compilation) for BandTwine. 

---

**Usagi** is a Node.js-based Compiler for BandTwine, really compiles, from text to binary, boosting performance and squashing size. 

## Structure
Usagi is **not monolithic**. It can be breakdown to the following things:
1. `usagi.js` (wrapper)
2. `kdl` → binary compiler 
3. `.twee`/`.twee.txt` compiler
4. Assets compressor
5. Built-in linter & validator
6. Some post-transaction hooks (calling `aiot-toolkit`)

## How It Got Its Name?
It all started with [a tiny typo](https://github.com/ZhianTeam/BandTwine-Next/commit/38840d1e345fa436d57f15608debb2edc76c0d05.diff) in a submodule's README (~~Usage~~ → *Usagi*). Then a sudden spark of inspiration hit - why not just name the compiler **Usagi** (bunny / 兔兔 / うさぎ)? What a stroke of genius~

## Difference from Original Compiler
You called that "compiler"? LOL, you'd better to call it as "**formatter**"! 

The original compiler by [@OrPudding](https://github.com/OrPudding) is just a formatter, formatting user's `story.json` to a `story.*compiled*.json` like *Prettier* does. With 100% vibe-coded JavaScript, a lot of console Emojis (✨🚀🎉), and a sticky RegEx to match `$(...)`. The artifact is even not a minified version!

No binary is actually generated inside the *compiled* file. All texts are human-readable Unicodes.

Usagi really compiles. It compile config file and user stories to blob files customized binary format (`BTNB` & `BTNC`), boosting performance (vs. `JSON.parse`) and saving spaces. 

## Usage
~~Not "Usagi" anymore! (LMAO)~~

It's already be configured inside the `package.json`. So, just run:
```bash
# In your project root folder (debug)
$ npm run build
# Or Release-ready one
$ #npm run release
```
Or click "Compile" or "Release" on AIoT IDE's toolbar.

Usagi automatically runs, and generates fully-optmized `.rpk` installation package inside `dist/`.

## Commandlines
> [!TIP]
> You can also check them inside your terminal by run `node run usagi` without any args.

```bash
Usagi - Compiler actually does things for BandTwine

Usage:
  usagi --path <path|.> <build>|<release> [args] [flags]

Arguments:
 -i         --interactive      Compile with an embedded TUI
 -q               --quiet      Remove most of console messages
 -v             --verbose      Output with more details
               --c-locale      Force GNU POSIX C.UTF-8 locale for Output
 -s              --strict      Treat all warnings as errors and stop compilation immediately
 -S          --skip-check      Skip all checks and validations and post compilation immediately
 -N                --nerd      Force use Nerd Icons and Symbols
               --no-color      Disable ANSI Coloring (automatically for pipe/redirection)
 -V             --version      Show version of Usagi

Flags:
 -o       --output=<path>      Custom output artifact location (default: ./dist/)
      --device=<codename>      Specify target devices (default: all), split by comma (,)
           --jsc=<on|off>      Enable JavaScript Compilation (default varied by device)
           --pbf=<on|off>      Enable protobuf embedding (default varied by device)
 -C          --cwd=<path>      Custom temporary building directory
 -c  --custom-aiot=<path>      Custom `aiot-toolkit` path for Usagi
 -d          --no-cleanup      Do not cleanup the temporary directory for debugging propose
```

## Future...
- Nerd Font icon? (Although I know most of developers' terminal are not Nerd one, fallbacks ready)
- How about becoming the world's first compiler with feelings? The kind that pouts playfully at you whenever you trigger a warning (,,>ヮ<,,)

## License
[GPLv3](/modules/LICENSE). Different from project's AGPLv3.
