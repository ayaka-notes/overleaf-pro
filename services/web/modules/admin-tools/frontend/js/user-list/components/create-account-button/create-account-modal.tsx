import ModalContentNewUserForm from './modal-content-new-user-form'
import { OLModal } from '@/shared/components/ol/ol-modal'

type CreateAccountModalProps = {
  onHide: () => void
}

function CreateAccountModal({ onHide }: CreateAccountModalProps) {
  return (
    <OLModal
      show
      animation
      onHide={onHide}
      id="blank-user-modal"
      backdrop="static"
    >
      <ModalContentNewUserForm handleCloseModal={onHide} />
    </OLModal>
  )
}

export default CreateAccountModal
