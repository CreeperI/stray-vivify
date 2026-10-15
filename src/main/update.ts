import { app, BrowserWindow } from 'electron'
import AdmZip from 'adm-zip'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Readable, Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'
import type { CheckUpdateResult, DownloadUpdateResult, UpdateStatusResult } from '../preload/types'

/** 更新源：GitHub Release（electron-builder.yml 里的 publish 也指向同一个仓库） */
const OWNER = 'Ts-Final'
const REPO = 'stray-vivify'
const LATEST_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`
/**
 * 免安装更新包的命名后缀，对应 workflow 里 electron-builder 的 artifactName：
 * stray-vivify-<version>-win-unpacked.zip
 */
const ZIP_SUFFIX = '-win-unpacked.zip'
const USER_AGENT = 'stray-vivify-updater'
const API_TIMEOUT = 15000
/** release notes 最多展示这么多字符 */
const NOTES_LIMIT = 500
/** 更新检查完、弹完提示后给界面留出的时间，然后退出让脚本替换文件 */
const QUIT_DELAY = 1500

/** 更新脚本写在临时目录，状态文件和日志给用户/界面看 */
const SCRIPT_NAME = 'stray-vivify-update.ps1'
const STATUS_NAME = 'stray-vivify-update-status.txt'
const LOG_NAME = 'stray-vivify-update.log'

type GithubRelease = {
  tag_name?: string
  body?: string
  assets?: {
    name?: string
    size?: number
    browser_download_url?: string
  }[]
}

type Pending = {
  version: string
  notes: string
  url: string
  name: string
  size: number
}

/** 上一次 check-update 找到的更新包；download-update 直接用它 */
let pending: Pending | undefined

function numbers_of(v: string): number[] {
  return v
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((x) => Number.parseInt(x, 10) || 0)
}

/** remote 是否比 local 新（只比数字部分，1.9.11 > 1.9.9） */
function is_newer(remote: string, local: string): boolean {
  const a = numbers_of(remote)
  const b = numbers_of(local)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    if (x != y) return x > y
  }
  return false
}

/** 程序所在目录，也就是要覆盖的目录 */
function install_dir(): string {
  return path.dirname(app.getPath('exe'))
}

/** 更新包存到「下载」文件夹，更新失败时也方便手动解压 */
function downloads_dir(): string {
  try {
    const d = app.getPath('downloads')
    if (d && fs.existsSync(d)) return d
  } catch {
    // 某些精简系统读不到下载目录，退回 userData
  }
  return app.getPath('userData')
}

function temp_file(name: string): string {
  return path.join(app.getPath('temp'), name)
}

function notify(mw: BrowserWindow, msg: string, dur = 1500) {
  if (!mw.isDestroyed()) mw.webContents.send('notify-normal', { msg, dur })
}

function notify_error(mw: BrowserWindow, msg: string, dur = 3000) {
  if (!mw.isDestroyed()) mw.webContents.send('notify-error', { msg, dur })
}

async function fetch_latest(): Promise<GithubRelease> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT)
  try {
    const res = await fetch(LATEST_API, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/vnd.github+json' },
      signal: controller.signal
    })
    if (!res.ok) throw new Error(`GitHub API 返回 HTTP ${res.status}`)
    return (await res.json()) as GithubRelease
  } finally {
    clearTimeout(timer)
  }
}

export async function check_update(): Promise<CheckUpdateResult> {
  const current = app.getVersion()
  try {
    const data = await fetch_latest()
    const version = (data.tag_name ?? '').replace(/^v/i, '').trim()
    if (!/^\d+(\.\d+)*$/.test(version))
      throw new Error(`release 的 tag 不是版本号：${data.tag_name}`)

    const assets = data.assets ?? []
    const zip =
      assets.find((a) => (a.name ?? '').endsWith(ZIP_SUFFIX)) ??
      assets.find((a) => (a.name ?? '').endsWith('.zip'))
    if (!zip?.name || !zip.browser_download_url) throw new Error('release 里没有找到 zip 更新包')

    if (!is_newer(version, current)) {
      pending = undefined
      return { state: 'latest', current }
    }

    pending = {
      version,
      notes: (data.body ?? '').trim().slice(0, NOTES_LIMIT),
      url: zip.browser_download_url,
      name: zip.name,
      size: zip.size ?? 0
    }
    return {
      state: 'new',
      current,
      version: pending.version,
      notes: pending.notes,
      size: pending.size,
      asset: pending.name
    }
  } catch (e) {
    pending = undefined
    return { state: 'failed', current, msg: (e as Error)?.message ?? String(e) }
  }
}

/**
 * 上次自动更新的结果：更新脚本替换文件失败时会留下状态文件，
 * 这里读一次（读完就删），让界面能告诉用户"更新没成功"。
 */
export async function read_update_status(): Promise<UpdateStatusResult> {
  const status_path = temp_file(STATUS_NAME)
  try {
    if (!fs.existsSync(status_path)) return { state: 'none' }
    const lines = (await fsp.readFile(status_path, 'utf8'))
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    await fsp.rm(status_path, { force: true })
    if (lines[0] !== 'failed') return { state: 'none' }
    return { state: 'failed', zip: lines[1] ?? '', log: lines[2] ?? '', install: install_dir() }
  } catch {
    return { state: 'none' }
  }
}

export async function download_update(mw: BrowserWindow): Promise<DownloadUpdateResult> {
  const task = pending
  if (!task) return { state: 'failed', msg: '还没有可用的更新信息，请先检查更新。' }

  const target = path.join(downloads_dir(), task.name)
  const part = `${target}.part`
  const staging = temp_file(`stray-vivify-update-${task.version}`)
  try {
    const res = await fetch(task.url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const total = Number(res.headers.get('content-length') ?? 0) || task.size
    let received = 0
    let next_report = 20
    notify(mw, `开始下载 ${task.name}…`, 2000)

    const progress = new Transform({
      transform(chunk: Buffer, _enc, cb) {
        received += chunk.length
        const percent = total > 0 ? Math.floor((received / total) * 100) : 0
        if (percent >= next_report) {
          notify(mw, `正在下载更新包 ${Math.min(percent, 100)}%…`, 1800)
          next_report = percent - (percent % 20) + 20
        }
        cb(null, chunk)
      }
    })

    await pipeline(
      Readable.fromWeb(res.body as unknown as WebReadableStream),
      progress,
      fs.createWriteStream(part)
    )
    // 先下到 .part，下完再改名，避免半截文件被当成完整包
    await fsp.rename(part, target)

    notify(mw, '正在解压更新包…', 3000)
    await fsp.rm(staging, { recursive: true, force: true })
    await fsp.mkdir(staging, { recursive: true })
    await extract_zip(target, staging)
    const source = await normalize_staging(staging, path.basename(app.getPath('exe')))

    const script = await write_update_script({
      src: source,
      dst: install_dir(),
      exe: app.getPath('exe'),
      zip: target,
      log: path.join(downloads_dir(), LOG_NAME),
      status: temp_file(STATUS_NAME),
      pid: process.pid
    })

    // 脚本等主进程退出后再覆盖文件，所以这里先把自己关掉
    spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    }).unref()

    pending = undefined
    notify(mw, '更新包已就绪，程序将自动重启完成更新', 2500)
    setTimeout(() => app.quit(), QUIT_DELAY)
    return { state: 'success', path: target, install: install_dir() }
  } catch (e) {
    await fsp.rm(part, { force: true }).catch(() => {})
    await fsp.rm(staging, { recursive: true, force: true }).catch(() => {})
    const msg = (e as Error)?.message ?? String(e)
    notify_error(mw, `自动更新失败：${msg}`, 4000)
    // zip 留在下载目录，用户可以手动解压覆盖
    const downloaded = fs.existsSync(target)
    return { state: 'failed', msg, path: downloaded ? target : undefined, install: install_dir() }
  }
}

async function extract_zip(zip_path: string, dest: string): Promise<void> {
  const zip = new AdmZip(zip_path)
  await new Promise<void>((resolve, reject) => {
    zip.extractAllToAsync(dest, true, false, (err) => (err ? reject(err) : resolve()))
  })
}

/** zip 里可能多套了一层目录，统一成"直接放着 exe 的那一层" */
async function normalize_staging(staging: string, exe_name: string): Promise<string> {
  if (fs.existsSync(path.join(staging, exe_name))) return staging
  const entries = await fsp.readdir(staging, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory())
  if (entries.length === 1 && dirs.length === 1) {
    const inner = path.join(staging, dirs[0].name)
    if (fs.existsSync(path.join(inner, exe_name))) return inner
  }
  throw new Error(`更新包里没有找到 ${exe_name}`)
}

type ScriptOptions = {
  src: string
  dst: string
  exe: string
  zip: string
  log: string
  status: string
  pid: number
}

/** PowerShell 单引号字符串：内部的 ' 要写成 '' */
function ps_literal(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

/**
 * 生成更新脚本。用 PowerShell 而不是 .cmd：批处理按系统代码页读取，
 * 中文用户名/路径（C:\Users\张三\...）会乱码。
 */
async function write_update_script(o: ScriptOptions): Promise<string> {
  const script_path = temp_file(SCRIPT_NAME)
  const content = `# stray-vivify 自动更新脚本（由程序生成，可删除）
$ErrorActionPreference = 'Continue'
$src = ${ps_literal(o.src)}
$dst = ${ps_literal(o.dst)}
$exe = ${ps_literal(o.exe)}
$zip = ${ps_literal(o.zip)}
$log = ${ps_literal(o.log)}
$status = ${ps_literal(o.status)}
$target = ${o.pid}

function Write-Log([string] $msg) {
  "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] $msg" | Out-File -FilePath $log -Append -Encoding utf8
}

Remove-Item -LiteralPath $status -Force -ErrorAction SilentlyContinue
Write-Log "update to $zip, waiting for pid $target to exit"

# 等主进程退出，最多 60 秒
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
  if (-not (Get-Process -Id $target -ErrorAction SilentlyContinue)) { break }
  Start-Sleep -Milliseconds 500
}
Start-Sleep -Milliseconds 500

# /E 覆盖同名文件，但不会删除用户自己的 charts / skin / external
& robocopy $src $dst /E /R:3 /W:1 /NFL /NDL /NJH /NJS 2>&1 | Out-File -FilePath $log -Append -Encoding utf8
$rc = $LASTEXITCODE
Write-Log "robocopy exit code $rc"
if ($rc -ge 8) {
  [System.IO.File]::WriteAllLines($status, @('failed', $zip, $log))
}

try {
  Start-Process -FilePath $exe -WorkingDirectory $dst
} catch {
  Write-Log "restart failed: $_"
}
Remove-Item -LiteralPath $src -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $PSCommandPath -Force -ErrorAction SilentlyContinue
`
  // PS 5.1 要用带 BOM 的 UTF-8 才能正确读中文路径
  await fsp.writeFile(script_path, '\uFEFF' + content, 'utf8')
  return script_path
}
