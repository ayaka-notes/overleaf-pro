import React from 'react'
import OLFormControl from '@/shared/components/ol/ol-form-control'

interface FormFieldInputProps extends React.ComponentProps<typeof OLFormControl> {
  value: string
  placeholder?: string
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
}

const FormFieldInput: React.FC<FormFieldInputProps> = ({
  type = 'text',
  ...props
}) => (
  <OLFormControl type={type} {...props} />
)

export default FormFieldInput
