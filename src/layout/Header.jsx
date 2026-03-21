import { useLocation, Link } from 'react-router-dom'
import { topics } from '../registry/topics'
import { useAppTheme } from '../theme/AppThemeContext'

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const topicId = location.pathname.match(/\/topic\/(.+)/)?.[1]
  const currentTopic = topicId ? topics.find(t => t.id === topicId) : null
  const { themeName, setThemeName } = useAppTheme()

  return (
    <header className={`sticky top-0 z-30 px-4 py-3 flex items-center gap-3 shadow-sm border-b ${themeName === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
      <button
        onClick={onMenuClick}
        className={`p-2 -ml-2 rounded-lg transition-colors flex-shrink-0 ${themeName === 'dark' ? 'hover:bg-slate-900' : 'hover:bg-slate-100'}`}
        aria-label="Open menu"
      >
        <MenuIcon themeName={themeName} />
      </button>

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">SD</span>
          </div>
        </Link>
        {currentTopic ? (
          <>
            <span className={themeName === 'dark' ? 'text-slate-600' : 'text-slate-300'}>/</span>
            <span className={`text-sm font-medium truncate ${themeName === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              {currentTopic.title}
            </span>
          </>
        ) : (
          <span className={`text-sm font-semibold ${themeName === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>System Design</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setThemeName((current) => (current === 'dark' ? 'light' : 'dark'))}
        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors flex-shrink-0"
        style={{ color: themeName === 'dark' ? '#67e8f9' : '#0284c7', backgroundColor: 'transparent' }}
        aria-label={themeName === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {themeName === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>
    </header>
  )
}

function MenuIcon({ themeName }) {
  return (
    <svg className={`w-5 h-5 ${themeName === 'dark' ? 'text-slate-300' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 19V21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21.5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.72 5.28L16.95 7.05" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.05 16.95L5.28 18.72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.72 18.72L16.95 16.95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.05 7.05L5.28 5.28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.5 14.5C18.5 15.1 17.34 15.45 16.1 15.45C12.43 15.45 9.45 12.47 9.45 8.8C9.45 7.56 9.8 6.4 10.4 5.4C6.86 6.09 4.2 9.21 4.2 12.95C4.2 17.2 7.65 20.65 11.9 20.65C15.64 20.65 18.76 17.99 19.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}
