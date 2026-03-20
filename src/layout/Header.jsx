import { useLocation, Link } from 'react-router-dom'
import { topics } from '../registry/topics'

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const topicId = location.pathname.match(/\/topic\/(.+)/)?.[1]
  const currentTopic = topicId ? topics.find(t => t.id === topicId) : null

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        aria-label="Open menu"
      >
        <MenuIcon />
      </button>

      <div className="flex items-center gap-2 min-w-0">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">SD</span>
          </div>
        </Link>
        {currentTopic ? (
          <>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-700 truncate">
              {currentTopic.shortTitle || currentTopic.title}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-slate-800">System Design</span>
        )}
      </div>
    </header>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
