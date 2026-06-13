<script lang="ts" setup>
import SimpleModal from '@renderer/components/modals/simple-modal.vue'
import { utils } from '@renderer/core/utils'
import AButton2 from '@renderer/components/a-elements/a-button2.vue'
import { Invoke } from '@renderer/core/ipc'
import { closeModal } from '@kolirt/vue-modal'
import { Skin } from '@renderer/core/misc/skin'

const status = Skin.status
function open_folder() {
  Invoke('open-skin-folder')
}
const missings = utils.keyof(status).filter((x) => status[x] == null)
const no1 = missings.includes('1.png')
if (no1) {
  // onUnmounted(() => {
  //   GlobalStat.close_app()
  // })
}
</script>

<template>
  <SimpleModal size="1" title="where R U?">
    <div class="wrapper">
      <div>下列skin贴图未能加载，请检查skin中是否有这个贴图。</div>
      <p></p>
      <div class="skin-names">
        <div v-for="sk in missings">{{ sk }}</div>
      </div>
    </div>
    <template #footer>
      <a-button2 msg="打开skin文件夹" @click="open_folder" />
      <a-button2 msg="好的" @click="closeModal()" />
    </template>
  </SimpleModal>
</template>

<style scoped>
.wrapper {
  width: 90%;
  text-align: center;
}
.skin-names {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  justify-content: center;
}
</style>
