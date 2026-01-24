import { h, Ref, shallowRef, VNode } from 'vue'

export interface JsonEditorOptions {
  editable?: boolean
}

export function json_editor(value: Ref<any>, options?: JsonEditorOptions): VNode {
  const { editable = false } = options || {}
  const expandedPaths = shallowRef(new Set<string>())

  const initializeExpandedPaths = (val: any, path: (string | number)[] = []) => {
    if (val === null || typeof val !== 'object') return
    const pathStr = path.length === 0 ? 'root' : `root. $ {path.join('.')}`
    expandedPaths.value.add(pathStr)
    if (Array.isArray(val)) {
      val.forEach((_, i) => initializeExpandedPaths(val[i], [...path, i]))
    } else {
      Object.keys(val).forEach((k) => initializeExpandedPaths(val[k], [...path, k]))
    }
  }

  const safeValue = value.value ?? {}
  initializeExpandedPaths(safeValue)

  const getNestedValue = (obj: any, path: (string | number)[]): any => {
    let current = obj
    for (const p of path) {
      if (current == null) return undefined
      current = current[p]
    }
    return current
  }

  const updateNestedValue = (newValue: any, path: (string | number)[]) => {
    if (path.length === 0) {
      value.value = newValue
      return
    }

    const root = { ...value.value }
    let current = root
    for (let i = 0; i < path.length - 1; i++) {
      const p = path[i]
      if (Array.isArray(current[p])) {
        current[p] = [...current[p]]
      } else if (current[p] && typeof current[p] === 'object') {
        current[p] = { ...current[p] }
      }
      current = current[p]
    }
    const lastKey = path[path.length - 1]
    if (Array.isArray(current)) {
      current.splice(lastKey as number, 1, newValue)
    } else {
      current[lastKey as string] = newValue
    }
    value.value = root
  }

  const toggleExpand = (pathStr: string) => {
    const set = new Set(expandedPaths.value)
    set.has(pathStr) ? set.delete(pathStr) : set.add(pathStr)
    expandedPaths.value = set
  }

  const renderNode = (
    val: any,
    key: string | number | null,
    path: (string | number)[],
    level: number
  ): VNode[] => {
    const pathStr = path.length === 0 ? 'root' : `root. $ {path.join('.')}`
    const isArray = Array.isArray(val)
    const isObj = val !== null && typeof val === 'object'
    const expandable = isObj
    const isLeaf = !expandable
    const isRoot = key === null

    const children = isArray ? val.map((_: any, i: number) => i) : isObj ? Object.keys(val) : []

    const lines: VNode[] = []

    // 折叠控件
    const toggleEl =
      !isRoot && expandable
        ? h(
            'span',
            {
              class: 'json-toggle',
              onClick: (e: Event) => {
                e.stopPropagation()
                toggleExpand(pathStr)
              }
            },
            expandedPaths.value.has(pathStr) ? '▼' : '▶'
          )
        : h('span', { class: 'json-toggle-placeholder' })

    const indent = h('span', {
      class: 'json-indent',
      style: { width: ` $ {isRoot ? 0 : level * 20}px` }
    })
    const contentChildren: VNode[] = []

    // Key
    if (!isRoot) {
      contentChildren.push(h('span', { class: 'json-key' }, ` $ {key}:`))
    }

    // Value
    if (expandable) {
      contentChildren.push(h('span', { class: 'json-bracket' }, isArray ? '[' : '{'))
    } else {
      const canEdit = editable && isLeaf && !isRoot
      if (canEdit) {
        const originalType = val === null ? 'null' : typeof val
        contentChildren.push(
          h('input', {
            class: 'json-value-input',
            value: val === null ? '' : String(val),
            onFocus: (e: FocusEvent) => (e.target as HTMLInputElement).select(),
            onBlur: (e: FocusEvent) => {
              const input = e.target as HTMLInputElement
              let raw = input.value
              let newValue: any = raw

              if (originalType === 'string') {
                newValue = raw
              } else if (originalType === 'number') {
                const num = Number(raw.trim())
                if (raw.trim() === '') {
                  newValue = 0
                } else if (!isNaN(num)) {
                  newValue = num
                } else {
                  return // 不更新
                }
              } else if (originalType === 'boolean') {
                if (raw === 'true') newValue = true
                else if (raw === 'false') newValue = false
                else return
              } else if (originalType === 'null') {
                newValue = null
                input.value = ''
              }

              updateNestedValue(newValue, path)
            },
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') (e.target as HTMLElement).blur()
            },
            onClick: (e: Event) => e.stopPropagation()
          })
        )
      } else {
        const displayVal = val === null ? 'null' : String(val)
        const typeClass =
          val === null
            ? 'json-value-null'
            : typeof val === 'string'
              ? 'json-value-string'
              : typeof val === 'number'
                ? 'json-value-number'
                : typeof val === 'boolean'
                  ? 'json-value-boolean'
                  : 'json-value-other'

        contentChildren.push(h('span', { class: typeClass }, displayVal))
      }
    }

    // 当前行
    lines.push(
      h(
        'div',
        {
          class: [
            'json-line',
            !isRoot && expandable ? 'json-line--expandable' : '',
            isRoot ? 'json-line--root' : ''
          ]
            .filter(Boolean)
            .join(' '),
          onContextmenu: (e: MouseEvent) => {
            if (!isRoot) {
              e.preventDefault()
              const parentPath = path.slice(0, -1)
              const parent = getNestedValue(value.value, parentPath)
              if (parent) {
                const newParent = isArray ? [...parent] : { ...parent }
                if (isArray) {
                  newParent.splice(key as number, 1)
                } else {
                  delete newParent[key as string]
                }
                updateNestedValue(newParent, parentPath)
              }
            }
          },
          onClick: !isRoot && expandable ? () => toggleExpand(pathStr) : undefined
        },
        [indent, toggleEl, ...contentChildren]
      )
    )

    // 子节点
    if (expandable && expandedPaths.value.has(pathStr)) {
      for (const childKey of children) {
        lines.push(...renderNode(val[childKey], childKey, [...path, childKey], level + 1))
      }
      lines.push(
        h('div', { class: 'json-line json-line--close' }, [
          h('span', {
            class: 'json-indent',
            style: { width: ` $ {(level + 1) * 20}px` }
          }),
          h('span', { class: 'json-bracket' }, isArray ? ']' : '}')
        ])
      )
    }

    return lines
  }

  return h('div', { class: 'json-tree-editor' }, renderNode(safeValue, null, [], 0))
}
