export namespace External {
  // vsm-objects.json
  export interface VSM_OBJECTS {
    VSM_OBJECTS?: string[]
    VSM_EASING?: string[]
    VSM_MODS?: Record<string, ({ name: string; proxy: 0 | -1 } | string)[]>
  }
  // startup-tips.json
  export type StartUpTips = string[]
}
