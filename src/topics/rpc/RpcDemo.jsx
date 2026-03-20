// RPC Demo — placeholder shell
// The full interactive simulation will be built in the next iteration.
// This page shows the concept, pipeline, and sets up the demo area.

export default function RpcDemo() {
  return (
    <div className="p-6 sm:p-10">

      {/* Demo header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-base font-bold">RPC</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">RPC Visualizer</h2>
          <p className="text-sm text-slate-500">Watch a function call travel across a network</p>
        </div>
      </div>

      {/* Pipeline visual */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6 text-center">
          The RPC Pipeline
        </p>

        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap gap-y-4">
          <PipelineStep icon="💻" label="Client" sublabel="calls getUserById(123)" color="blue" />
          <Arrow />
          <PipelineStep icon="📦" label="Marshal" sublabel='{"method":"getUserById","params":[123]}' color="violet" />
          <Arrow />
          <PipelineStep icon="🌐" label="Network" sublabel="bytes over TCP" color="slate" />
          <Arrow />
          <PipelineStep icon="📬" label="Unmarshal" sublabel="reconstruct args" color="violet" />
          <Arrow />
          <PipelineStep icon="🖥️" label="Server" sublabel="execute → return" color="green" />
        </div>

        {/* Coming soon callout */}
        <div className="mt-8 bg-white border border-blue-100 rounded-xl p-4 sm:p-5 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
            <span className="w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" />
            Interactive demo loading
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            You'll be able to type any function call like{' '}
            <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">
              getUserById(123)
            </code>{' '}
            and watch every step animate in real-time — marshalling, transmission, execution, and the response.
          </p>
        </div>
      </div>

      {/* Concept cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ConceptCard
          icon="📦"
          title="Marshalling"
          description="The client serializes the function name and arguments into a portable byte format. JSON, Protocol Buffers, and Thrift are common choices."
        />
        <ConceptCard
          icon="🔧"
          title="Stub / Proxy"
          description="Auto-generated glue code that makes getUserById(123) look like a local call. The stub transparently handles network communication."
        />
        <ConceptCard
          icon="🌐"
          title="Wire Protocol"
          description='The agreed-on byte layout: which bytes mean what. gRPC uses HTTP/2 + Protobuf. REST uses HTTP + JSON. Both are "just" conventions.'
        />
        <ConceptCard
          icon="📬"
          title="Unmarshalling"
          description="The server decodes the bytes, reconstructs the original call, executes it locally, then marshals and sends the response back."
        />
      </div>

    </div>
  )
}

function PipelineStep({ icon, label, sublabel, color }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    violet: 'bg-violet-50 border-violet-200 text-violet-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    slate: 'bg-white border-slate-200 text-slate-700',
  }
  return (
    <div className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl border min-w-[80px] ${colors[color]}`}>
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-xs opacity-60 text-center leading-tight max-w-[100px] hidden sm:block">{sublabel}</span>
    </div>
  )
}

function Arrow() {
  return (
    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

function ConceptCard({ icon, title, description }) {
  return (
    <div className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}
