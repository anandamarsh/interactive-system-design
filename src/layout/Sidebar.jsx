import { NavLink } from 'react-router-dom'

export default function Sidebar({ isOpen, onClose }) {
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
        <nav className="flex-1 overflow-y-auto p-3">
          <NavLink
            to="/topic/rpc"
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
            RPC
          </NavLink>
        </nav>
      </aside>
    </>
  )
}
