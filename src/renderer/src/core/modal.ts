import { ComponentProps } from 'vue-component-type-helpers'
import { Component } from 'vue'
import SettingsModal from '@renderer/components/modals/settings-modal.vue'
import ConfirmModal from '@renderer/components/modals/confirm-modal.vue'
import { openModal } from '@kolirt/vue-modal'
import VersionsModal from '@renderer/components/modals/versions-modal.vue'

export class modal<T extends Component> {
  static SettingModal = new modal(SettingsModal)
  static ConfirmModal = new modal(ConfirmModal)
  static ShowInformationModal = new modal(ConfirmModal)
  static VersionsModal = new modal(VersionsModal)

  component: T
  priority: number
  props: ComponentProps<T> | undefined

  constructor(component: T, priority = 0) {
    this.component = component
    this.props = undefined
    this.priority = priority
  }

  show(props: ComponentProps<T>) {
    this.props = Object.assign({}, props)
    if (!this.props) throw new Error()
    return openModal(this.component, this.props).catch(() => {})
  }
}

declare global {
  interface Window {
    modal: typeof modal
  }
}
window.modal = modal
