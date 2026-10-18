# 疑难排查
---

## Electron 启动即崩溃，退出码 `-2147483645`

### 症状

`pnpm dev` 的构建阶段全部成功，但走到 `starting electron app...` 之后进程立刻退出，没有任何报错输出：

```text
dev server running for the electron renderer process at:

  ➜  Local:   http://localhost:5173/

starting electron app...
```

加 `--loglevel verbose` 能看到真实退出码：

```text
npm verbose exit -2147483645
npm verbose code -2147483645
```

同一个二进制单独执行也是同样的结果：

```powershell
.\node_modules\electron\dist\electron.exe --version
# 无任何输出，退出码 -2147483645
```

`-2147483645` 是 `0x80000003` 的有符号表示，即 **`STATUS_BREAKPOINT`**。Chromium 在启动早期遇到致命错误时会主动触发断点异常，所以**它不是一个普通的崩溃码**，不会打印堆栈。

### 原因

工作区目录（以及它下面的所有子目录）被加上了 **低完整性强制性标签**（Low Mandatory Level）：

```text
Mandatory Label\Low Mandatory Level:(OI)(CI)(NW)
```

Chromium 沙箱不会从低完整性目录加载自身的可执行镜像，初始化时直接判定失败并触发 `FatalError`，表现为上面的断点异常。

这个标签通常由**沙箱化的开发工具**写入——例如某些智能体 / 容器化开发环境会给它托管的工作区套上 Windows 完整性级别。关键在于：**标签是写在磁盘上的持久属性**，不是会话级的，所以换一个普通终端运行，照样会崩。

容易误判的地方：

- **与 Electron 版本无关**。升到最新版一样崩，降级也一样。
- **与硬件加速、显卡驱动无关**。加 `--disable-gpu`、`--disable-software-rasterizer` 都没有用。
- **只有 `--no-sandbox` 能绕过**，但那样会关掉 Chromium 的多进程沙箱保护，不建议长期使用。

### 诊断

查看工作区根目录的完整性标签：

```powershell
icacls "D:\code\stray-vivify" | Select-String 'Mandatory Label'
```

命中即为复现：

```text
Mandatory Label\Low Mandatory Level:(OI)(CI)(NW)
```

子目录上带 `(I)` 前缀的同类条目表示继承自根目录：

```text
Mandatory Label\Low Mandatory Level:(I)(OI)(CI)(NW)
```

作为对照，去看一个正常的目录——它通常**完全没有** `Mandatory Label` 这一行：

```powershell
icacls "D:\code" | Select-String 'Mandatory Label'
```

### 修复

把根目录的完整性级别改回 `Medium`（Windows 的常规级别）：

```powershell
icacls "D:\code\stray-vivify" /setintegritylevel (OI)(CI)Medium
```

Windows 会自动把新的继承属性传播到已有子目录，**不需要**加 `/T` 递归。随后直接 `pnpm dev` 即可，不需要任何额外启动参数。

验证：

```powershell
icacls "D:\code\stray-vivify" | Select-String 'Mandatory Label'
# Mandatory Label\Medium Mandatory Level:(OI)(CI)(NW)
```

> **为什么不用 `/T`**：`node_modules` 里的文件很多是 pnpm 的硬链接，递归改写会把标签一并带到 pnpm store 里的共享副本，影响其他项目。只改根目录即可达到目的。

### 回滚

```powershell
icacls "D:\code\stray-vivify" /setintegritylevel (OI)(CI)Low
```

### 还会不会复发

如果那个工具在每次新会话时重新给工作区打标签，崩溃会再次出现。届时按上面的「修复」再执行一次即可。想让每次 `pnpm dev` 都自动检查，可以在 `dev` 脚本前串一条自查命令，但不建议把权限修改写进日常脚本。

### 相关：`--no-sandbox` 不是解法

```powershell
pnpm dev -- -- --no-sandbox
```

它确实能让窗口弹出来，但这是把 Chromium 的沙箱整个关掉。只有在确认是本文这类环境问题时，才把它当作临时验证手段——**不要在打包发布时带上它**。

---

## `TypeError: Cannot read properties of undefined (reading 'isPackaged')`

### 症状

`pnpm dev` 到 `starting electron app...` 后抛出：

```text
TypeError: Cannot read properties of undefined (reading 'isPackaged')
    at Object.<anonymous> (node_modules/@electron-toolkit/utils/dist/index.cjs:6:22)
    at Object.<anonymous> (out/main/index.js:4:17)
```

### 原因

当前进程里存在环境变量 `ELECTRON_RUN_AS_NODE=1`。它会让 Electron 二进制退化成**纯 Node.js** 运行，于是 `require('electron')` 返回的不是 Electron API 对象，`electron.app` 就是 `undefined`，`app.requestSingleInstanceLock()` 之前的初始化直接失败。

这类变量通常由智能体 / 沙箱化终端注入，普通终端一般不会有。

### 诊断

```powershell
# PowerShell
$env:ELECTRON_RUN_AS_NODE
```

有非空输出即为命中。

### 修复

清掉这个变量后重新启动：

```powershell
# PowerShell
Remove-Item Env:ELECTRON_RUN_AS_NODE

# cmd
set ELECTRON_RUN_AS_NODE=

# bash / zsh
unset ELECTRON_RUN_AS_NODE
```

然后重新 `pnpm dev`。

---

## Electron 二进制没有下载下来

### 症状

依赖装好了，但 `node_modules/electron/dist/` 不存在，启动时报：

```text
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

### 原因

Electron 的二进制不在 npm 包里，而是由它自己的安装脚本单独下载。这一步可能因为构建脚本被包管理器忽略、或下载中断而没有执行。

### 修复

先确认构建脚本被允许（`pnpm-workspace.yaml` 里的 `allowBuilds` 应当包含 `electron` 和 `esbuild`）：

```yaml
allowBuilds:
  electron: true
  esbuild: true
```

然后直接执行 Electron 官方的安装脚本，这是最可靠的方式：

```powershell
node node_modules/electron/install.js
```

执行完确认二进制已就位：

```powershell
Test-Path node_modules\electron\dist\electron.exe
```

其它可尝试的常规手段：

```powershell
pnpm rebuild electron
```

如果反复下载失败，是网络问题，见[快速开始](get-started.md#2-获取代码与安装依赖)里关于 npmmirror 镜像的说明。
