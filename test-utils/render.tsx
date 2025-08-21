import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'

const theme = createTheme()

interface AllTheProvidersProps {
  children: React.ReactNode
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }