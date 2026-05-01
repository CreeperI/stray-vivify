export namespace External {
  /*
   * vsm-objects.json
   *
   * External MODs for vsm editing, loader see renderer/chart/vsm-objects.ts
   * All keys are optional.
   */
  export interface VSM_OBJECTS {
    // easing functions.
    VSM_EASING?: string[]
    /*
     * simple mods only needs its name (the string).
     *
     * mods with extra options would be an Object: {name, proxy}
     * name: literally
     * proxy: 0 - the proxy mustn't be -1
     * proxy: 1 - the proxy must be -1
     *
     * if OVERRIDE is set to false, the objects existing in s-v data will NOT be cleared,
     * and would simply PUSH the external mods provided into the mod-list.
     * In this process stray-vivify DOESN'T check if same-name one exists,
     * so remember to check if the mods external-provided have been included
     * in vsm-objects.ts.
     */
    VSM_MODS?: Record<string, ({ name: string; proxy: 0 | -1 } | string)[]>
    // when loading, whether to clear the existing data stray-vivify has provided.
    // if set to true, program will clear s-v data and only preserve external data
    // default: FALSE
    OVERRIDE?: boolean
  }

  /*
   * startup-tips.json
   * i dont think i need to explain for this
   * default tips are NOT OVERRIDEABLE
   */
  export type StartUpTips = string[]
}
