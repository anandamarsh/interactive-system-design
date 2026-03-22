import { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { topics } from '../registry/topics'
import { useAppTheme } from '../theme/AppThemeContext'

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const topicId = location.pathname.match(/\/topic\/(.+)/)?.[1]
  const currentTopic = topicId ? topics.find(t => t.id === topicId) : null
  const { themeName, setThemeName } = useAppTheme()
  const shareUrl = useMemo(() => (typeof window === 'undefined' ? location.pathname : `${window.location.origin}${location.pathname}`), [location.pathname])
  const shareTitle = currentTopic ? currentTopic.title : 'System Design'

  async function handleShareClick() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl })
        return
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {}
  }

  return (
    <header className={`sticky top-0 z-30 flex items-center gap-2 border-b px-4 py-3 shadow-sm ${themeName === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
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

      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => setThemeName((current) => (current === 'dark' ? 'light' : 'dark'))}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{ color: themeName === 'dark' ? '#67e8f9' : '#0284c7', backgroundColor: 'transparent' }}
          aria-label={themeName === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {themeName === 'dark' ? <MoonIcon /> : <SunIcon />}
        </button>

        <a
          href="https://github.com/anandamarsh/interactive-system-design"
          target="_blank"
          rel="noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{ color: themeName === 'dark' ? '#67e8f9' : '#0284c7', backgroundColor: 'transparent' }}
          aria-label="Open GitHub repository"
        >
          <GitHubIcon />
        </a>

        <button
          type="button"
          onClick={handleShareClick}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{ color: themeName === 'dark' ? '#67e8f9' : '#0284c7', backgroundColor: 'transparent' }}
          aria-label="Share this page"
        >
          <ShareIcon />
        </button>
      </div>
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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.6 2 12.26C2 16.79 4.87 20.63 8.84 21.98C9.34 22.07 9.52 21.76 9.52 21.5C9.52 21.26 9.51 20.45 9.5 19.58C6.73 20.2 6.14 18.37 6.14 18.37C5.68 17.16 5.03 16.84 5.03 16.84C4.12 16.2 5.1 16.21 5.1 16.21C6.1 16.29 6.63 17.27 6.63 17.27C7.52 18.84 8.97 18.39 9.54 18.12C9.63 17.46 9.89 17.01 10.18 16.75C7.97 16.49 5.64 15.61 5.64 11.7C5.64 10.59 6.03 9.68 6.67 8.98C6.56 8.72 6.22 7.66 6.77 6.22C6.77 6.22 7.61 5.94 9.5 7.26C10.3 7.03 11.15 6.92 12 6.92C12.85 6.92 13.7 7.03 14.5 7.26C16.39 5.94 17.23 6.22 17.23 6.22C17.78 7.66 17.44 8.72 17.33 8.98C17.97 9.68 18.36 10.59 18.36 11.7C18.36 15.62 16.02 16.49 13.8 16.75C14.17 17.08 14.5 17.71 14.5 18.68C14.5 20.08 14.49 21.21 14.49 21.5C14.49 21.76 14.67 22.08 15.18 21.98C19.14 20.63 22 16.79 22 12.26C22 6.6 17.52 2 12 2Z" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 8L8 12L15 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
