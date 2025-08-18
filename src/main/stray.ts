import fs from 'fs'
import { join } from 'path'
import path, { basename, extname } from 'node:path'
import { file_paths } from './fp_parser'

function convertPath(originalPath: string) {
  const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/)
  if (match) {
    // fuck for windows
    return `${match[1]}:/${match[2]}`
  } else {
    return originalPath
  }
}
/**
 * @param p base path of the dir
 * @param name img name
 * @returns string the basename "xx.png" of the file, remember to join the P
 */
export function find_png(p: string, name: string) {
  return fs.readdirSync(p).find((f) => {
    return basename(f).includes(name) && ['.jpg', '.png', '.gif', '.webp'].includes(extname(f))
  })
}
function response_img(folder: string, spr: string) {
  return new Response(fs.readFileSync(path.join(folder, spr)), {
    headers: {
      'Content-Type': 'image/' + extname(spr).replace('.', ''),
      'Content-Disposition': 'inline'
    }
  })
}
export function stray_handler() {
  return function (request: GlobalRequest) {
    const decodedUrl = decodeURIComponent(request.url.replace(new RegExp(`^stray:/`, 'i'), ''))
    console.log(decodedUrl)
    const fullPath = process.platform === 'win32' ? convertPath(decodedUrl) : decodedUrl
    if (!fullPath.includes('__')) {
      const data = fs.readFileSync(fullPath)
      return new Response(data)
    }
    if (decodedUrl.includes('__skin__')) {
      return new Response(fs.readFileSync(join(file_paths.skin, basename(fullPath))))
    } else if (decodedUrl.includes('__song__')) {
      const song_path = decodedUrl.replace('/__song__/', '')
      return new Response(fs.readFileSync(song_path), {
        headers: {
          'Content-Type': 'audio/' + extname(song_path).replace('.', ''),
          'Content-Disposition': 'inline'
        }
      })
    } else if (decodedUrl.includes('__sprite__')) {
      const id = decodedUrl.replace('/__sprite__/', '')
      const folder = path.join(file_paths.charts, id)
      const spr = find_png(folder, 'song')
      console.log(spr)
      if (spr) return response_img(folder, spr)
    } else if (decodedUrl.includes('__bg__')) {
      const id = decodedUrl.replace('/__bg__/', '')
      const folder = path.join(file_paths.charts, id)
      const spr = find_png(folder, 'bg')
      console.log(spr)
      if (spr) return response_img(folder, spr)
    }
    return new Response(null, { status: 404 })
  }
}
