import { ref } from 'vue'
import { Storage } from '@renderer/core/storage'

export const NoteType = {
  width: ref(1),
  s: ref(false),
  b: ref(false),
  hold: ref(false),
  get res() {
    return Storage.settings.restrict_feature
  },
  set_width(v: number) {
    if (v == 1) this.s.value = false
    if (v == this.w) this.width.value = 0
    else this.width.value = v
    if (this.res) {
      if (v > 1) {
        this.s.value = false
        this.b.value = false
        this.hold.value = false
      }
    }
  },
  set_s(v: boolean) {
    this.s.value = v
    this.b.value = false
    this.hold.value = false
    if (this.res && v) this.width.value = 2
  },
  set_b(v: boolean) {
    this.b.value = v
    this.s.value = false
    this.hold.value = false
  },
  set_hold(v: boolean) {
    this.hold.value = v
    this.b.value = false
    this.s.value = false
    if (this.res && v) this.width.value = 1
  },
  get w() {
    return this.width.value
  },
  get h() {
    return this.hold.value
  },
  get snm() {
    if (this.s.value) return 2
    else if (this.b.value) return 1
    else return 0
  },
  change_b() {
    this.set_b(!this.b.value)
  },
  change_s() {
    this.set_s(!this.s.value)
  },
  change_hold() {
    this.set_hold(!this.hold.value)
  }
}
