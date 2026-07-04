import { ComponentProps } from 'vue-component-type-helpers'
import { Component } from 'vue'
import SettingsModal from '@renderer/components/modals/settings-modal.vue'
import ConfirmModal from '@renderer/components/modals/confirm-modal.vue'
import { closeAllModals, openModal } from '@kolirt/vue-modal'
import VersionsModal from '@renderer/components/modals/versions-modal.vue'
import CreditsModal from '@renderer/components/modals/credits-modal.vue'
import AskIdModal from '@renderer/components/modals/ask-id-modal.vue'
import ShortcutModal from '@renderer/components/modals/shortcut-modal.vue'
import InspectorModal from '@renderer/components/modals/inspector/inspector-modal.vue'
import IexporterModal from '@renderer/components/modals/iexporter-modal.vue'
import MissingSkinModal from '@renderer/components/modals/missing-skin-modal.vue'
import LoadOszModal from '@renderer/components/modals/load-osz-modal.vue'
import ChartPreviewModal from '@renderer/components/modals/chart-preview-modal.vue'
import ExportCustom from '@renderer/components/modals/export-custom/export-custom.vue'
import LoadBackupModal from '@renderer/components/modals/load-backup-modal.vue'
import AntiAddictModal from '@renderer/components/modals/anti-addict-modal.vue'

export class modal<T extends Component> {
  static SettingModal = new modal(SettingsModal)
  static ConfirmModal = new modal(ConfirmModal)
  static ShowInformationModal = new modal(ConfirmModal, false)
  static VersionsModal = new modal(VersionsModal)
  static CreditsModal = new modal(CreditsModal)
  static AskIdModal = new modal(AskIdModal)
  static ShortcutModal = new modal(ShortcutModal)
  static InspectorModal = new modal(InspectorModal)
  static IExporterModal = new modal(IexporterModal)
  static MissingSkinModal = new modal(MissingSkinModal)
  static LoadOszModal = new modal(LoadOszModal)
  static ChartPreviewModal = new modal(ChartPreviewModal)
  static ExportCustomModal = new modal(ExportCustom)
  static LoadBackupModal = new modal(LoadBackupModal)
  static AntiAddictionModal = new modal(AntiAddictModal)

  component: T
  priority: number
  props: ComponentProps<T> | undefined
  should_catch: boolean
  opened: boolean

  constructor(component: T, should_catch = true, priority = 0) {
    this.component = component

    this.props = undefined
    this.priority = priority
    this.should_catch = should_catch
    this.opened = false
  }

  static close_all() {
    closeAllModals(true)
  }

  show(props: ComponentProps<T>) {
    if (this.opened) return Promise.reject('opened')
    this.props = Object.assign({}, props)
    if (!this.props) throw new Error()
    this.opened = true
    if (this.should_catch)
      return openModal(this.component, this.props)
        .catch(() => {})
        .finally(() => {
          this.opened = false
        })
    return openModal(this.component, this.props).finally(() => {
      this.opened = false
    })
  }
}
