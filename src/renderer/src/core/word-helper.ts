import { ref } from 'vue'

export namespace WordHelper {
  export const position = ref([0, 0])
  export const word = ref('')
  export const shown = ref(false)

  export function call_helper(pos: [number, number], w: string) {
    position.value = pos
    word.value = w
    shown.value = true
  }

  export function hide_helper() {
    shown.value = false
    word.value = ''
  }
}
