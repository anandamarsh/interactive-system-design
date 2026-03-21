import { Link } from 'react-router-dom'
import { useAppTheme } from '../theme/AppThemeContext'
import { chapters, topics } from '../registry/topics'

export default function HomePage() {
  const { themeName } = useAppTheme()

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${themeName === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          Chapters
        </p>
        <h1 className={`mt-3 text-4xl font-semibold tracking-tight ${themeName === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
          Interactive System Design Topics
        </h1>
        <p className={`mt-4 text-base leading-7 ${themeName === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          Learn core distributed systems ideas through simulations that expose protocol flow, runtime behavior, and the design tradeoffs behind them.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {Object.entries(chapters).map(([chapterName, chapter]) => {
          const chapterTopics = chapter.topicIds
            .map((topicId) => topics.find((topic) => topic.id === topicId))
            .filter(Boolean)

          return (
            <section key={chapterName}>
              <div className="flex items-center gap-3">
                <h2 className={`text-2xl font-semibold ${themeName === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  {chapterName}
                </h2>
                <span className={`text-sm ${themeName === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {chapterTopics.length} topic{chapterTopics.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {chapterTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/topic/${topic.id}`}
                    className={`group rounded-2xl border p-6 transition-all ${themeName === 'dark'
                      ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-[0_18px_50px_rgba(37,99,235,0.08)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-xs font-semibold uppercase tracking-[0.22em] ${themeName === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {topic.category}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${themeName === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                        {topic.difficulty}
                      </span>
                    </div>

                    <h3 className={`mt-4 text-xl font-semibold transition-colors ${themeName === 'dark' ? 'text-slate-100 group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-700'}`}>
                      {topic.title}
                    </h3>
                    <p className={`mt-3 text-sm leading-7 ${themeName === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {topic.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {topic.tags?.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${themeName === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-blue-50 text-blue-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
