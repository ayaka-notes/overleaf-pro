import React from 'react'
import OLFormGroup from '@/shared/components/ol/ol-form-group'
import OLFormLabel from '@/shared/components/ol/ol-form-label'

interface LabeledRowFormGroupProps {
  controlId: string
  label: string
  children: React.ReactNode
}

const LabeledRowFormGroup: React.FC<LabeledRowFormGroupProps> = ({
  controlId,
  label,
  children,
}) => (
  <OLFormGroup controlId={controlId} className="row">
    <div className="col-2">
      <OLFormLabel className="col-form-label col">{label}</OLFormLabel>
    </div>
    <div className="col-10">
      {children}
    </div>
  </OLFormGroup>
)

export default React.memo(LabeledRowFormGroup)
