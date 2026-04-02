<script lang="ts" setup>
import { GlobalStat } from '@renderer/core/globalStat'
import { EditorTools } from '@renderer/core/chart/tools'
import { ref } from 'vue'
import ANumberInput from '@renderer/components/a-elements/a-number-input.vue'
import ACheckbox from '@renderer/components/a-elements/a-checkbox.vue'
const selectedNID = GlobalStat.NoteClipboard.selected
const toolMultiArgs = ref({
    multiVal: 1,
    baseZero: false
})
console.log(toolMultiArgs.value)
</script>

<template>
    <div v-if="selectedNID.length > 0" class="edit-frame">
        <p style="text-align: center">想做些什么呢？</p>
        <div class="edit-button-frame">
            <div class="edit-button ln1" @click="EditorTools.test(selectedNID)">Time Randomize</div>
            <div class="edit-button ln1" @click="EditorTools.mirror(selectedNID)">Mirror</div>
            <div class="edit-button ln2"
                @click="EditorTools.mutiplier(selectedNID, toolMultiArgs.multiVal, toolMultiArgs.baseZero)">TimeMultiply
            </div>
            <a-number-input class="ln2" v-model="toolMultiArgs.multiVal" :min="0.1" :step="0.1" />
            <label class="ln2" style="grid-column: span 1">0ms base</label>
            <a-checkbox v-model="toolMultiArgs.baseZero" class="ln2" style="grid-column: span 1" />
        </div>
    </div>
</template>

<style lang="css" scoped>
.edit-frame {
    padding-top: 0px;
}

.ln1 {
    grid-column: span 3;
}

.ln2 {
    grid-column: span 2;
}

.edit-button-frame {
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: repeat(6, 1fr);
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
