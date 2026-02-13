import type { Preview, Renderer } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import { sb } from 'storybook/test'
import '../src/styles.css'

// Mock auth hooks for all stories that use useAuth
sb.mock(import('../src/hooks/use-auth.ts'))

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    withThemeByClassName<Renderer>({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'dark',
    }),
  ],
}

export default preview
