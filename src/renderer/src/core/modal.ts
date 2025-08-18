import { ComponentProps } from 'vue-component-type-helpers'
import { Component } from 'vue'
import SettingsModal from '@renderer/components/modals/settings-modal.vue'
import ConfirmModal from '@renderer/components/modals/confirm-modal.vue'
import { openModal, closeAllModals } from '@kolirt/vue-modal'
import VersionsModal from '@renderer/components/modals/versions-modal.vue'
import CreditsModal from '@renderer/components/modals/credits-modal.vue'
import AskIdModal from '@renderer/components/modals/ask-id-modal.vue'
import ShortcutModal from '@renderer/components/modals/shortcut-modal.vue'
import LogModal from '@renderer/components/modals/log-modal.vue'

export class modal<T extends Component> {
  static SettingModal = new modal(SettingsModal)
  static ConfirmModal = new modal(ConfirmModal)
  static ShowInformationModal = new modal(ConfirmModal)
  static VersionsModal = new modal(VersionsModal)
  static CreditsModal = new modal(CreditsModal)
  static AskIdModal = new modal(AskIdModal)
  static ShortcutModal = new modal(ShortcutModal)
  static LogModal = new modal(LogModal)

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

  close_all() {
    closeAllModals(true)
  }
}

declare global {
  interface Window {
    modal: typeof modal
  }
}
window.modal = modal
