<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { EditorTools } from '@renderer/core/chart/tools'

const selectedNID = GlobalStat.NoteClipboard.selected

</script>

<template>
    <div class="edit-frame" v-if="selectedNID.length > 0">
        <p style="text-align: center;">想做些什么呢？</p>
        <div class="edit-button-frame">
            <div class="edit-button" @click="EditorTools.test(selectedNID)">Time Randomize</div>
            <div class="edit-button" @click="EditorTools.mirror(selectedNID)">Mirror</div>
        </div>
    </div>

</template>

<style lang="css" scoped>
.edit-frame {
    padding-top: 0px
}

.edit-button-frame {
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.edit-button {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.edit-button:hover {
    transition: background-color 0.2s;
    background-color: rgba(200, 200, 200, 0.2);
}
</style>