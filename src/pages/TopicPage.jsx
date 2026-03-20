import { useParams, Navigate } from 'react-router-dom'
import { topics } from '../registry/topics'

export default function TopicPage() {
  const { topicId } = useParams()
  const topic = topics.find(t => t.id === topicId)

  if (!topic || !topic.available) return <Navigate to="/" replace />

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
        {topic.title}
      </h1>

    </div>
  )
}
