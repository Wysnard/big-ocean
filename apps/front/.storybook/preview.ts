import type { Preview } from '@storybook/react-vite'
import { sb } from 'storybook/test'
import '../src/styles.css'

// Mock auth hooks for all stories that use useAuth
sb.mock(import('../src/hooks/use-auth.ts'))

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
