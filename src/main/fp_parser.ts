import { dirname, join } from 'path'
import { app } from 'electron'

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
  charts: get_base_path('charts'),
}
