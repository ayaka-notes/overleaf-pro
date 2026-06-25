import { Decorator } from '@storybook/react-webpack5'

export const IdeRedesign: Decorator = Story => (
  <div className="ide-redesign-main">
    <Story />
  </div>
)
