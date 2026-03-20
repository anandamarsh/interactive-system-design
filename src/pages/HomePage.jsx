import { Link } from 'react-router-dom'
import { topics, categories } from '../registry/topics'

export default function HomePage() {
  const available = topics.filter(t => t.available)
  const comingSoon = topics.filter(t => !t.available)

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">

      {/* Hero */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          {available.length} simulation{available.length !== 1 ? 's' : ''} live now
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-5 leading-tight">
          Learn system design<br />
          <span className="text-blue-600">by doing, not reading</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-500 max-w-2xl leading-relaxed">
          Interactive simulations for FAANG interview prep. Type real inputs,
          watch how distributed systems respond — marshalling, hashing, caching,
          consensus — everything runs live in your browser.
        </p>
      </div>

      {/* Available now */}
      {available.length > 0 && (
        <section className="mb-12">
          <SectionLabel>Available now</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>
      )}

      {/* Coming soon */}
      <section>
        <SectionLabel>Coming soon</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comingSoon.map(topic => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </section>

    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
      {children}
    </h2>
  )
}

function TopicCard({ topic }) {
  const content = (
    <div className={`
      rounded-2xl border p-5 h-full flex flex-col transition-all duration-200
      ${topic.available
        ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
        : 'bg-slate-50 border-slate-200 opacity-60'
      }
    `}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {topic.category}
        </span>
        {topic.available
          ? <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Live
            </span>
          : <span className="text-xs text-slate-400">Soon</span>
        }
      </div>

      {/* Content */}
      <h3 className="font-semibold text-slate-900 mb-2 leading-snug">{topic.title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed flex-1 line-clamp-3">{topic.description}</p>

      {/* Footer */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-slate-100">
        <DifficultyBadge difficulty={topic.difficulty} />
        {topic.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )

  if (topic.available) {
    return (
      <Link to={`/topic/${topic.id}`} className="block h-full">
        {content}
      </Link>
    )
  }
  return <div className="h-full">{content}</div>
}

function DifficultyBadge({ difficulty }) {
  const styles = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[difficulty] ?? 'bg-slate-100 text-slate-600'}`}>
      {difficulty}
    </span>
  )
}
