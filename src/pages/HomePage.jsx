import { Link } from 'react-router-dom'
import { useAppTheme } from '../theme/AppThemeContext'
import { topics } from '../registry/topics'

export default function HomePage() {
  const { themeName } = useAppTheme()
  const rpcTopic = topics.find((topic) => topic.id === 'rpc')

  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <Link to="/topic/rpc" className={`hover:underline text-lg ${themeName === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
        {rpcTopic?.title}
      </Link>
    </div>
  )
}
