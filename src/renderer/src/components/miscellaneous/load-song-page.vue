<script lang="ts" setup>
import './loading.css'
import { LoadSong } from '@renderer/core/misc/load-song'
import WinFunc from '@renderer/components/miscellaneous/win-func.vue'

const status = LoadSong.ref
</script>

<template>
  <div class="preinit-wrapper">
    <div class="preinit">
      <div class="preinit-title">
        <div>loading...</div>
      </div>
      <div class="load-stages">
        <div class="load-header">Load Progress</div>
        <div>Invoke</div>
        <div>{{ status.open_song }}</div>
        <div>Fetch Blob</div>
        <div>{{ status.fetch_blob }}</div>
        <div>Length</div>
        <div>{{ status.audio_length }}</div>
        <div>Blob Path</div>
        <div>{{ status.blob_path }}</div>
        <div>Load Data</div>
        <div>{{ status.set_data }}</div>
      </div>
      <win-func />
      <div>如果在某个阶段一直卡住说明大概率是出bug了。请检查控制台。</div>
      <div>如果全都是true但是你卡了，那真没救了。</div>
    </div>
  </div>
</template>
