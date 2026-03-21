import { NavLink } from 'react-router-dom'
import { useAppTheme } from '../theme/AppThemeContext'

export default function Sidebar({ isOpen, onClose }) {
  const { themeName } = useAppTheme()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-40 ${themeName === 'dark' ? 'bg-black/50' : 'bg-slate-900/20'}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-50
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${themeName === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 border-r border-slate-200'}
${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className={`p-5 border-b ${themeName === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
          <NavLink to="/" onClick={onClose} className="block group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">SD</span>
              </div>
              <div>
                <h1 className={`text-base font-bold leading-tight transition-colors group-hover:text-blue-400 ${themeName === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  System Design
                </h1>
                <p className={`text-xs ${themeName === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Interactive Learning</p>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <NavLink
            to="/topic/rpc"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
              ${isActive
                ? themeName === 'dark'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-blue-50 text-blue-700 font-medium border border-blue-100'
                : themeName === 'dark'
                  ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }
            `}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            RPC (Remote Procedure Call)
          </NavLink>
        </nav>
      </aside>
    </>
  )
}
