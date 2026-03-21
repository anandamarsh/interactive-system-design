import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAppTheme } from '../theme/AppThemeContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { themeName } = useAppTheme()

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${themeName === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
