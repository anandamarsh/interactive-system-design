import { useParams, Link, Navigate } from 'react-router-dom'
import { topics } from '../registry/topics'

export default function TopicPage() {
  const { topicId } = useParams()
  const topic = topics.find(t => t.id === topicId)

  if (!topic || !topic.available) return <Navigate to="/" replace />

  const DemoComponent = topic.component

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-8">
        <Link to="/" className="hover:text-slate-700 transition-colors">Home</Link>
        <ChevronRight />
        <span className="text-slate-400">{topic.category}</span>
        <ChevronRight />
        <span className="text-slate-700 font-medium">{topic.shortTitle || topic.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <DifficultyBadge difficulty={topic.difficulty} />
          <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {topic.category}
          </span>
          {topic.tags.map(tag => (
            <span key={tag} className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 leading-tight">
          {topic.title}
        </h1>

        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-3xl">
          {topic.description}
        </p>
      </div>

      {/* Demo */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
        <DemoComponent />
      </div>

      {/* Key Concepts */}
      {topic.concepts && topic.concepts.length > 0 && (
        <div className="p-6 sm:p-8 bg-slate-900 rounded-2xl text-white">
          <h2 className="text-base font-semibold mb-5 text-slate-100">Key Concepts</h2>
          <ul className="space-y-3">
            {topic.concepts.map((concept, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                <span className="text-blue-400 mt-0.5 flex-shrink-0 font-bold">→</span>
                {concept}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function DifficultyBadge({ difficulty }) {
  const styles = {
    Beginner: 'bg-green-100 text-green-700',
    Intermediate: 'bg-amber-100 text-amber-700',
    Advanced: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-sm font-medium px-3 py-1 rounded-full ${styles[difficulty] ?? 'bg-slate-100 text-slate-600'}`}>
      {difficulty}
    </span>
  )
}
