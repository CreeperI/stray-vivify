# 快速开始

本文说明如何在本地把 stray/vivify 跑起来、做开发调试，以及打一个可分发的安装包。
---

## 1. 环境要求

| 项目     | 要求                    | 说明                                                                                                        |
| -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| 操作系统 | Windows / macOS / Linux | 主要开发与发布目标是 Windows，CI 见 [`.github/workflows/build-win.yml`](../.github/workflows/build-win.yml) |
| Node.js  | **22 或更高**           | CI 固定使用 Node 22；`package.json` 未声明 `engines`                                                        |
| pnpm     | **12.x**                | 仓库使用 `pnpm-lock.yaml` + `pnpm-workspace.yaml`，请用 pnpm，不要用 npm / yarn 安装依赖                    |
| Git      | 任意近期版本            |                                                                                                             |

---

## 2. 获取代码与安装依赖

```powershell
git clone https://github.com/Ts-Final/stray-vivify.git
cd stray-vivify
pnpm install
```

`pnpm install` 会依次完成：

1. 按 `pnpm-lock.yaml` 还原依赖目录树；
2. 运行 Electron 的安装脚本，把对应版本的 Electron 二进制下载到 `node_modules/electron/dist/`；
3. 执行项目自身的 `postinstall`（`electron-builder install-app-deps`），准备原生依赖。

Electron 二进制默认从 GitHub 下载。

---

## 3. 启动开发环境

```powershell
pnpm dev
```

看到下面的输出就说明起来了：

```text
✓ 36 modules transformed.
electron main process built successfully

✓ 1 modules transformed.
electron preload scripts built successfully

dev server running for the electron renderer process at:

  ➜  Local:   http://localhost:5173/

starting electron app...
```

随后会弹出应用窗口。开发模式下：

- **渲染进程**由 Vite 提供 HMR，改 `.vue` / `.ts` 会即时热更新；
- **主进程 / preload** 由 `electron-vite` 监听，改动后自动重新构建并重启 Electron；
- 页面里可直接开 DevTools（`Ctrl+Shift+I`）。

### 带 Vue DevTools 启动

```powershell
pnpm dev:dt
```

这个命令额外传入了 `--dt` 参数，`electron.vite.config.ts` 会据此在渲染进程启用 `vite-plugin-vue-devtools`。日常开发不需要它，排查组件状态时再用。

---

> 普遍问题：electron uninstall

需要手动运行以下命令：
```powershell
node .\node_modules\electron\install.js
```

## 4. 常用脚本

全部来自 `package.json`：

| 命令                                  | 作用                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                            | 启动开发环境（`electron-vite dev -w`）                 |
| `pnpm dev:dt`                         | 同上，并启用 Vue DevTools                              |
| `pnpm start`                          | 预览已构建的产物（`electron-vite preview`）            |
| `pnpm build`                          | 类型检查 + 构建（`typecheck` + `electron-vite build`） |
| `pnpm build:unpack`                   | 构建并输出免安装目录（`electron-builder --dir`）       |
| `pnpm build:win`                      | 构建 Windows 产物                                      |
| `pnpm build:mac` / `pnpm build:linux` | 构建对应平台产物                                       |
| `pnpm force-build:win`                | 跳过类型检查，直接构建 Windows 产物                    |
| `pnpm typecheck`                      | 同时检查主进程与渲染进程类型                           |
| `pnpm typecheck:node`                 | 只检查主进程 / preload                                 |
| `pnpm typecheck:web`                  | 只检查渲染进程                                         |
| `pnpm lint`                           | ESLint，带 `--fix`                                     |
| `pnpm format`                         | Prettier 格式化全仓库                                  |

> `pnpm build` 会先跑 `typecheck`，类型不过就不会出包。改完代码准备发布前，先确认这一条能过。

---

## 5. 目录结构

```text
src/
├── main/        Electron 主进程：窗口、IPC、谱面文件读写、自动更新
├── preload/     通过 contextBridge 暴露给渲染进程的 API 与类型声明
└── renderer/    Vue 3 渲染进程
    ├── index.html
    └── src/
        ├── components/   Vue 组件
        ├── core/         业务核心（chart、misc、storage、ipc 封装等）
        ├── App.vue
        └── main.ts
```

---

## 6. 打包

### Windows

```powershell
pnpm build:win
```

按 `electron-builder.yml` 的 `win.target: zip`，产物是 `dist/stray-vivify-<version>-win-unpacked.zip`——一个免安装包。**这个命名是被程序内自动更新依赖的**：`src/main/update.ts` 会在 Release 里找 `-win-unpacked.zip` 后缀的文件，改名会导致更新失效。

想恢复 NSIS 安装包，把 `win.target` 改成 `target: [zip, nsis]` 即可。

### 免安装目录（不含压缩）

```powershell
pnpm build:unpack
```

输出 `dist/win-unpacked/`，适合本机快速验证打包结果是否正常。

### 版本号与发布

CI 的 `Build Windows Release` 工作流支持两种触发方式：

- **手动触发**（Actions → Run workflow）：`version` 留空则只构建并上传 artifact；填 `x.y.z` 则同时创建该 tag 的 Release。
- **推送 tag**：推一个形如 `1.0.0` 的 tag（不带前导 `v`）即可自动构建并发布。
