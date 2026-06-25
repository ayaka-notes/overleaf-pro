import { Form, FormTextProps as BS5FormTextProps } from 'react-bootstrap'
import MaterialIcon from '@/shared/components/material-icon'
import classnames from 'classnames'
import { MergeAndOverride } from '../../../../../types/utils'

type TextType = 'default' | 'info' | 'success' | 'warning' | 'error'

export type FormTextProps = MergeAndOverride<
  BS5FormTextProps,
  {
    type?: TextType
    unfilled?: boolean
    marginless?: boolean
  }
>

const typeClassMap: Partial<Record<TextType, string>> = {
  error: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
}

export const getFormTextClass = (type?: TextType) =>
  typeClassMap[type || 'default']

function FormTextIcon({
  type,
  unfilled,
}: Pick<FormTextProps, 'type' | 'unfilled'>) {
  switch (type) {
    case 'info':
      return unfilled ? (
        <MaterialIcon type="info" className="text-info" unfilled />
      ) : (
        <MaterialIcon type="info" className="text-info" />
      )
    case 'success':
      return unfilled ? (
        <MaterialIcon type="check_circle" unfilled />
      ) : (
        <MaterialIcon type="check_circle" />
      )
    case 'warning':
      return unfilled ? (
        <MaterialIcon type="warning" unfilled />
      ) : (
        <MaterialIcon type="warning" />
      )
    case 'error':
      return unfilled ? (
        <MaterialIcon type="error" unfilled />
      ) : (
        <MaterialIcon type="error" />
      )
    default:
      return null
  }
}

function FormText({
  type = 'default',
  marginless,
  children,
  className,
  unfilled,
  ...rest
}: FormTextProps) {
  return (
    <Form.Text
      className={classnames(className, getFormTextClass(type), { marginless })}
      {...rest}
    >
      <span className="form-text-inner">
        <FormTextIcon type={type} unfilled={unfilled} />
        <span>{children}</span>
      </span>
    </Form.Text>
  )
}

export default FormText
