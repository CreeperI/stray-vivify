export namespace utils {
  /** return whether a value is between the given states */
  export function between(val: number, vs: [number, number]): boolean {
    let [v1, v2] = vs
    if (v1 > v2) [v1, v2] = [v2, v1] // Ensure v1 < v2
    return val >= v1 && val <= v2
  }

  export function round(val: number, digit = 0) {
    return Math.round(val * 10 ** digit) / 10 ** digit
  }

  export function deepCopy<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      const copy: any[] = []
      for (let i = 0; i < obj.length; i++) {
        copy[i] = deepCopy(obj[i])
      }
      return copy as T
    }

    const copy: { [key: string]: any } = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = deepCopy(obj[key])
      }
    }
    return copy as T
  }

  // 同意领吗写的，不管了
  export function assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    const to = Object(target)

    for (const source of sources) {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key]
            const targetValue = to[key]

            if (
              typeof sourceValue === 'object' &&
              sourceValue !== null &&
              !Array.isArray(sourceValue)
            ) {
              if (
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)
              ) {
                to[key] = assign(
                  {} as Record<Extract<keyof T, string>, unknown>,
                  targetValue,
                  sourceValue
                )
              } else {
                to[key] = assign({} as Record<Extract<keyof T, string>, unknown>, sourceValue)
              }
            } else {
              to[key] = sourceValue
            }
          }
        }
      }
    }

    return to
  }
}
