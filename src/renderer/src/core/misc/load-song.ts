import { ref } from 'vue'

const status = ref({
  open_song: false,
  fetch_blob: false,
  audio_length: false,
  blob_path: false,
  set_data: false
})
export const LoadSong = {
  get status() {
    return status.value
  },
  init() {
    status.value = {
      open_song: false,
      fetch_blob: false,
      audio_length: false,
      blob_path: false,
      set_data: false
    }
  },
  ref: status
}
