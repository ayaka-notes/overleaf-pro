import { Meta, StoryObj } from '@storybook/react-webpack5'
import { UnsavedDocsLockedAlert } from '@/features/ide-react/components/unsaved-docs/unsaved-docs-locked-alert'
import { ScopeDecorator } from '../decorators/scope'

export default {
  title: 'Editor / Modals / Unsaved Docs Locked',
  component: UnsavedDocsLockedAlert,
  decorators: [Story => ScopeDecorator(Story)],
} satisfies Meta

type Story = StoryObj<typeof UnsavedDocsLockedAlert>

export const Locked: Story = {}
