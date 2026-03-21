import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AppThemeContext = createContext(null)

export function AppThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return window.localStorage.getItem('app-theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = themeName
    window.localStorage.setItem('app-theme', themeName)
  }, [themeName])

  const value = useMemo(() => ({ themeName, setThemeName }), [themeName])

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
}

export function useAppTheme() {
  const context = useContext(AppThemeContext)
  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider')
  }
  return context
}
