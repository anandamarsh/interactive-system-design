import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
      <Link to="/topic/rpc" className="text-blue-600 hover:underline text-lg">
        RPC
      </Link>
    </div>
  )
}
