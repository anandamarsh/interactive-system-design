import { useParams, Navigate } from 'react-router-dom'
import { topics } from '../registry/topics'

export default function TopicPage() {
  const { topicId } = useParams()
  const topic = topics.find(t => t.id === topicId)

  if (!topic || !topic.available) return <Navigate to="/" replace />

  const TopicComponent = topic.component

  return (
    <div className="h-full">
      <TopicComponent />
    </div>
  )
}
