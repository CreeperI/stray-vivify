import { dirname, join } from 'path'
import { app } from 'electron'
import fsp from 'fs/promises'
import path from 'node:path'

function get_base_path(to_be_join: string) {
  if (process.env.NODE_ENV === 'development') {
    return join(__dirname, `../../${to_be_join}`)
  } else if (process.platform === 'darwin') {
    return join(dirname(app.getPath('module')), to_be_join)
  } else {
    return join(dirname(app.getPath('module')), to_be_join)
  }
}

export const file_paths = {
  skin: get_base_path('skin'),
  config: get_base_path('charts/config.json'),
  skin_setting: get_base_path('skin/setting.json'),
  charts: get_base_path('charts')
}

export async function folder_size(folderPath: string): Promise<number> {
  const entries = await fsp.readdir(folderPath, { withFileTypes: true })

  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(folderPath, entry.name)

      // 跳过符号链接
      if (entry.isSymbolicLink()) return 0

      if (entry.isDirectory()) {
        return folder_size(fullPath)
      }

      if (entry.isFile()) {
        const stats = await fsp.stat(fullPath)
        return stats.size
      }

      // 忽略其他类型（如 socket、FIFO 等）
      return 0
    })
  )

  return sizes.reduce((sum, size) => sum + size, 0)
}
