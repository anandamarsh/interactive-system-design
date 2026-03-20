import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { topics, categories } from '../registry/topics'

export default function Sidebar({ isOpen, onClose }) {
  const [expandedCategories, setExpandedCategories] = useState(
    Object.keys(categories)
  )

  const toggleCategory = (cat) => {
    setExpandedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-slate-900 text-white z-50
        transform transition-transform duration-300 ease-in-out
        flex flex-col
${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800">
          <NavLink to="/" onClick={onClose} className="block group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">SD</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">
                  System Design
                </h1>
                <p className="text-xs text-slate-400">Interactive Learning</p>
              </div>
            </div>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {Object.entries(categories).map(([category, { topicIds }]) => (
            <div key={category}>
              <button
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800"
                onClick={() => toggleCategory(category)}
              >
                {category}
                <ChevronIcon expanded={expandedCategories.includes(category)} />
              </button>

              {expandedCategories.includes(category) && (
                <ul className="mt-0.5 ml-2 space-y-0.5">
                  {topicIds.map(topicId => {
                    const topic = topics.find(t => t.id === topicId)
                    if (!topic) return null

                    if (topic.available) {
                      return (
                        <li key={topicId}>
                          <NavLink
                            to={`/topic/${topicId}`}
                            onClick={onClose}
                            className={({ isActive }) => `
                              flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
                              ${isActive
                                ? 'bg-blue-600 text-white font-medium'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }
                            `}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                            <span className="truncate">{topic.shortTitle || topic.title}</span>
                          </NavLink>
                        </li>
                      )
                    }

                    return (
                      <li key={topicId}>
                        <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 flex-shrink-0" />
                          <span className="truncate">{topic.shortTitle || topic.title}</span>
                          <span className="ml-auto text-xs bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Soon
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-1">FAANG System Design Prep</p>
          <a
            href="https://github.com/anandamarsh/interactive-system-design"
            className="text-xs text-slate-400 hover:text-white transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            ★ Star on GitHub
          </a>
        </div>
      </aside>
    </>
  )
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}
