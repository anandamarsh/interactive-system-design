import { useParams, Link, Navigate } from 'react-router-dom'
import { topics } from '../registry/topics'

export default function TopicPage() {
  const { topicId } = useParams()
  const topic = topics.find(t => t.id === topicId)

  if (!topic || !topic.available) return <Navigate to="/" replace />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-8">
        <Link to="/" className="hover:text-slate-700 transition-colors">Home</Link>
        <ChevronRight />
        <span className="text-slate-700 font-medium">{topic.title}</span>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
        {topic.title}
      </h1>

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
