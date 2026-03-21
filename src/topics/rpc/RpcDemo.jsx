import { useEffect, useRef, useState } from 'react'

const COMMANDS = {
  ls: ['src', 'public', 'package.json', 'README.md', 'vite.config.js'],
  pwd: ['/srv/rpc-demo'],
  whoami: ['rpc-student'],
  date: ['Fri Mar 20 19:07:00 UTC 2026'],
  'uname -a': ['Linux rpc-node-1 6.8.0-demo #1 SMP x86_64 GNU/Linux'],
}

const DEFAULT_ZOOM = 0.86
const STEP_MS = 1100
const REMOTE_PROC_PAUSE_MS = 2000
const REMOTE_PROC_RECEIVE_BEEP_MS = 220
const BOX_CHROME_ENABLED = 'border-cyan-200/40'
const LAYER_INFO = {
  Client: {
    title: 'Client',
    body: 'The client code calls a generated gRPC method as if it were local. It sends a RunCommandRequest and eventually receives a RunCommandResponse.',
    more: 'In gRPC, the client usually works with a generated strongly typed API rather than manually building HTTP requests. For a unary call like this one, the client prepares a single protobuf request, hands it to the client stub, and then waits for one protobuf response. Deadlines, metadata, retries, and authentication concerns are typically attached at this layer or just below it, even though the calling code still looks like a normal method invocation.',
  },
  'Client Stub': {
    title: 'Client Stub',
    body: 'The generated client stub turns the method call into protobuf request and response messages. It hides serialization details from the caller.',
    more: 'This layer is where the method signature from the .proto file becomes usable application code. The stub knows the fully qualified RPC path, the request and response protobuf types, and how to marshal and unmarshal them. In many gRPC implementations this is also where interceptors hook in for logging, tracing, auth, or retries before the call reaches the transport runtime.',
  },
  'RPC Runtime': {
    title: 'RPC Runtime',
    body: 'The gRPC runtime maps protobuf messages onto HTTP/2. It sends HEADERS, DATA, and TRAILERS and reconstructs them on the receiving side.',
    more: 'This is the transport machinery that makes gRPC distinct from a generic RPC sketch. A unary request is carried as HTTP/2 headers plus a length-prefixed protobuf message in the DATA frame, and the response comes back with its own DATA plus TRAILERS such as grpc-status. Flow control, stream management, metadata propagation, compression flags, and status handling all live conceptually in this layer.',
  },
  'Server Stub': {
    title: 'Server Stub',
    body: 'The generated server handler decodes the incoming protobuf request, invokes the service method, and encodes the protobuf response.',
    more: 'On the server side, generated glue code bridges transport and business logic. It accepts the decoded request message from the runtime, maps it to the right RPC handler, and then takes the service result and serializes it back into the expected protobuf response type. Validation, interceptors, auth checks, and request context propagation often pass through here before the actual service implementation runs.',
  },
  Server: {
    title: 'Server',
    body: 'This is the real server-side implementation of the gRPC service. Business logic runs here and produces the response message.',
    more: 'This layer owns the actual application behavior. By the time execution reaches here, transport details such as HTTP/2 framing and protobuf decoding have already been handled, so the service can focus on using request fields and returning a typed response. In a real system, this is where domain logic, database access, downstream service calls, and error mapping to gRPC status codes would typically happen.',
  },
  'Proto Definition': {
    title: 'Proto Definition',
    body: 'This is the .proto contract. It defines the gRPC service method and the protobuf request and response message shapes shared by client and server.',
    more: 'The .proto file is the shared source of truth for both sides of a gRPC system. From this contract, tooling generates stubs, handlers, and message classes in different languages, which is why client and server can agree on method names, field numbers, and serialization formats. Field numbering matters for wire compatibility, and this contract is what lets teams evolve APIs safely while preserving backward compatibility.',
  },
}

function emptyDualBox(label) {
  return {
    left: [],
    right: [],
    footerLeft: label,
    status: 'idle',
  }
}

const INITIAL_BOXES = {
  1: {
    main: [{ kind: 'command', value: '' }],
    footerLeft: 'Client',
    status: 'idle',
  },
  2: emptyDualBox('Client Stub'),
  3: emptyDualBox('RPC Runtime'),
  4: emptyDualBox('RPC Runtime'),
  5: emptyDualBox('Server Stub'),
  6: {
    main: [],
    footerLeft: 'Server',
    status: 'idle',
  },
}

const STEP_ORDER = [
  {
    active: 1,
    reveal: [1],
    update: (cmd) => ({
      ...boxStatusUpdates([1], 'waiting'),
      1: {
        main: [{ kind: 'command', value: cmd }],
        footerLeft: 'Client',
      },
    }),
  },
  {
    active: 2,
    reveal: [1, 2],
    arrow: '1-2',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2], 'waiting'),
      2: {
        left: buildClientStubRequest(cmd),
        right: [],
        footerLeft: 'Client Stub',
      },
    }),
  },
  {
    active: 3,
    reveal: [1, 2, 3],
    arrow: '2-3',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3], 'waiting'),
      3: {
        left: buildRuntimeRequest(cmd),
        right: [],
        footerLeft: 'RPC Runtime',
      },
    }),
  },
  {
    active: 'network-forward',
    reveal: [1, 2, 3, 4],
    arrow: '3-4',
    update: () => ({
      ...boxStatusUpdates([1, 2, 3], 'waiting'),
    }),
  },
  {
    active: 4,
    reveal: [1, 2, 3, 4],
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3, 4], 'waiting'),
      4: {
        left: buildRuntimeIngress(cmd),
        right: [],
        footerLeft: 'RPC Runtime',
      },
    }),
  },
  {
    active: 5,
    reveal: [1, 2, 3, 4, 5],
    arrow: '4-5',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3, 4, 5], 'waiting'),
      5: {
        left: buildServerStubRequest(cmd),
        right: [],
        footerLeft: 'Server Stub',
      },
    }),
  },
  {
    active: 6,
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '5-6',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3, 4, 5, 6], 'waiting'),
      6: {
        main: buildServiceImplementation(cmd),
        footerLeft: 'Server',
      },
    }),
    pauseMs: REMOTE_PROC_PAUSE_MS,
  },
  {
    active: 5,
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '6-5',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3, 4], 'waiting'),
      ...boxStatusUpdates([5, 6], 'received'),
      5: {
        left: buildServerStubRequest(cmd),
        right: buildServerStubResponse(cmd),
        footerLeft: 'Server Stub',
      },
    }),
  },
  {
    active: 4,
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '5-4',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3], 'waiting'),
      ...boxStatusUpdates([4, 5, 6], 'received'),
      4: {
        left: buildRuntimeIngress(cmd),
        right: buildRuntimeResponse(cmd),
        footerLeft: 'RPC Runtime',
      },
    }),
  },
  {
    active: 'network-return',
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '4-3',
    update: () => ({
      ...boxStatusUpdates([1, 2, 3], 'waiting'),
      ...boxStatusUpdates([4, 5, 6], 'received'),
    }),
  },
  {
    active: 3,
    reveal: [1, 2, 3, 4, 5, 6],
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2], 'waiting'),
      ...boxStatusUpdates([3, 4, 5, 6], 'received'),
      3: {
        left: buildRuntimeRequest(cmd),
        right: buildRuntimeEgress(cmd),
        footerLeft: 'RPC Runtime',
      },
    }),
  },
  {
    active: 2,
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '3-2',
    update: (cmd) => ({
      ...boxStatusUpdates([1], 'received'),
      ...boxStatusUpdates([2, 3, 4, 5, 6], 'received'),
      2: {
        left: buildClientStubRequest(cmd),
        right: buildClientStubResponse(cmd),
        footerLeft: 'Client Stub',
      },
    }),
  },
  {
    active: 1,
    reveal: [1, 2, 3, 4, 5, 6],
    arrow: '2-1',
    update: (cmd) => ({
      ...boxStatusUpdates([1, 2, 3, 4, 5, 6], 'received'),
      1: {
        main: [
          { kind: 'command', value: cmd },
          { kind: 'newline' },
          ...COMMANDS[cmd].flatMap((line, index) => [
            { kind: 'output', value: line },
            ...(index === COMMANDS[cmd].length - 1 ? [] : [{ kind: 'newline' }]),
          ]),
        ],
        footerLeft: 'Local Machine',
      },
    }),
  },
]

export default function RpcDemo() {
  const [command, setCommand] = useState('pwd')
  const [boxes, setBoxes] = useState(INITIAL_BOXES)
  const [activeTarget, setActiveTarget] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isRemoteProcessing, setIsRemoteProcessing] = useState(false)
  const [infoLayer, setInfoLayer] = useState(null)
  const [infoAnchor, setInfoAnchor] = useState(null)
  const [expandedLayer, setExpandedLayer] = useState(null)
  const [revealedBoxes, setRevealedBoxes] = useState([1])
  const [revealedArrows, setRevealedArrows] = useState([])
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const timersRef = useRef([])
  const panRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 })
  const beepAudioRef = useRef(null)
  const networkAudioRef = useRef(null)
  const typingAudioRef = useRef(null)

  useEffect(() => {
    const beepAudio = new Audio('/audio/beep.mp3')
    const networkAudio = new Audio('/audio/long_beeps.mp3')
    const typingAudio = new Audio('/audio/typing.mp3')
    beepAudio.preload = 'auto'
    networkAudio.preload = 'auto'
    typingAudio.preload = 'auto'
    beepAudioRef.current = beepAudio
    networkAudioRef.current = networkAudio
    typingAudioRef.current = typingAudio
    typingAudio.addEventListener('ended', handleTypingEnded)

    return () => {
      clearTimers(timersRef)
      typingAudio.removeEventListener('ended', handleTypingEnded)
      stopAudio(beepAudio)
      stopAudio(networkAudio)
      stopAudio(typingAudio)
      beepAudioRef.current = null
      networkAudioRef.current = null
      typingAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setInfoLayer(null)
        setInfoAnchor(null)
        setExpandedLayer(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handlePointerDown(event) {
      if (!event.target.closest('[data-layer-info-anchor]') && !event.target.closest('[data-layer-info-popup]')) {
        setInfoLayer(null)
        setInfoAnchor(null)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  function handleTypingEnded() {
    setIsRemoteProcessing(false)
  }

  function handleRun(event) {
    event.preventDefault()
    const trimmed = command.trim()
    if (!COMMANDS[trimmed] || isRunning) return

    clearTimers(timersRef)
    setIsRemoteProcessing(false)
    setBoxes({
      ...INITIAL_BOXES,
      1: {
        main: [{ kind: 'command', value: trimmed }],
        footerLeft: 'Client',
        status: 'waiting',
      },
    })
    setActiveTarget(1)
    setIsRunning(true)
    setRevealedBoxes([1])
    setRevealedArrows([])

    let elapsedMs = 0

    STEP_ORDER.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        setActiveTarget(step.active)
        setRevealedBoxes(step.reveal)
        if (step.arrow) {
          setRevealedArrows((current) => (current.includes(step.arrow) ? current : [...current, step.arrow]))
        }
        setBoxes((current) => mergeBoxes(current, step.update(trimmed)))
        setIsRemoteProcessing(false)
        stopAudio(beepAudioRef.current)
        stopAudio(networkAudioRef.current)
        stopAudio(typingAudioRef.current)

        if (index === 0 && step.active === 1) {
          return
        }

        if (step.active === 'network-forward' || step.active === 'network-return') {
          playReceiveBeep(networkAudioRef)
        } else if (step.active === 6) {
          playReceiveBeep(beepAudioRef)
          const processingTimer = window.setTimeout(() => {
            setIsRemoteProcessing(true)
            stopAudio(typingAudioRef.current)
            playReceiveBeep(typingAudioRef)
          }, REMOTE_PROC_RECEIVE_BEEP_MS)
          timersRef.current.push(processingTimer)
        } else {
          playReceiveBeep(beepAudioRef)
        }
        if (index === STEP_ORDER.length - 1) setIsRunning(false)
      }, elapsedMs)

      timersRef.current.push(timer)
      elapsedMs += step.pauseMs ?? STEP_MS
    })
  }

  const zoom = DEFAULT_ZOOM
  const networkForwardActive = activeTarget === 'network-forward'
  const networkReturnActive = activeTarget === 'network-return'

  function handlePanStart(event) {
    if (event.target.closest('input, button')) return
    setIsPanning(true)
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    }
  }

  function handlePanMove(event) {
    if (!isPanning) return
    setPan({
      x: panRef.current.originX + (event.clientX - panRef.current.startX),
      y: panRef.current.originY + (event.clientY - panRef.current.startY),
    })
  }

  function handlePanEnd() {
    setIsPanning(false)
  }

  return (
    <div className="rpc-stage-shell h-full w-full overflow-hidden border border-cyan-400/10">
      <div className="h-full overflow-hidden">
        <div
          className={`flex min-h-full items-center justify-center ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handlePanStart}
          onPointerMove={handlePanMove}
          onPointerUp={handlePanEnd}
          onPointerLeave={handlePanEnd}
        >
          <div
            className="grid h-[860px] w-[1500px] origin-center grid-cols-[1fr_260px_1fr] grid-rows-[1fr_1fr_1fr_auto] gap-x-8 gap-y-5 transition-transform duration-300 will-change-transform"
            style={{ transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${zoom})` }}
          >
            <StageBox
              number={1}
              row="1"
              col="1"
              active={activeTarget === 1}
              enabled
              mainTokens={boxes[1].main}
              footerLeft={boxes[1].footerLeft}
              status={boxes[1].status}
              infoKey="Client"
              isInput
              inputValue={command}
              onInputChange={setCommand}
              onSubmit={handleRun}
              disabled={isRunning}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 1, 'Client'))}
            />

            <SplitStageBox
              number={2}
              row="2"
              col="1"
              active={activeTarget === 2}
              enabled={revealedBoxes.includes(2)}
              leftTokens={boxes[2].left}
              rightTokens={boxes[2].right}
              footerLeft={boxes[2].footerLeft}
              status={boxes[2].status}
              infoKey="Client Stub"
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 2, 'Client Stub'))}
            />

            <SplitStageBox
              number={3}
              row="3"
              col="1"
              active={activeTarget === 3}
              enabled={revealedBoxes.includes(3)}
              leftTokens={boxes[3].left}
              rightTokens={boxes[3].right}
              footerLeft={boxes[3].footerLeft}
              status={boxes[3].status}
              infoKey="RPC Runtime"
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 3, 'RPC Runtime'))}
            />

            <StageBox
              number={6}
              row="1"
              col="3"
              active={activeTarget === 6}
              enabled={revealedBoxes.includes(6)}
              mainTokens={boxes[6].main}
              footerLeft={boxes[6].footerLeft}
              status={boxes[6].status}
              infoKey="Server"
              showProcessingIndicator={isRemoteProcessing}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 6, 'Server'))}
            />

            <SplitStageBox
              number={5}
              row="2"
              col="3"
              active={activeTarget === 5}
              enabled={revealedBoxes.includes(5)}
              leftTokens={boxes[5].left}
              rightTokens={boxes[5].right}
              footerLeft={boxes[5].footerLeft}
              status={boxes[5].status}
              infoKey="Server Stub"
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 5, 'Server Stub'))}
            />

            <SplitStageBox
              number={4}
              row="3"
              col="3"
              active={activeTarget === 4}
              enabled={revealedBoxes.includes(4)}
              leftTokens={boxes[4].left}
              rightTokens={boxes[4].right}
              footerLeft={boxes[4].footerLeft}
              status={boxes[4].status}
              infoKey="RPC Runtime"
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildExpandedLayer(boxes, 4, 'RPC Runtime'))}
            />

            <VerticalArrow id="arrow_1" direction="down" row="1" col="1" lane="left" visible={revealedArrows.includes('1-2')} active={activeTarget === 2} start="34%" end="7px" height="58px" />
            <VerticalArrow id="arrow_2" direction="down" row="2" col="1" lane="left" visible={revealedArrows.includes('2-3')} active={activeTarget === 3} start="34%" end="7px" height="58px" />
            <VerticalArrow id="arrow_3" direction="up" row="1" col="1" lane="right" visible={revealedArrows.includes('2-1')} active={activeTarget === 1} start="66%" end="7px" height="58px" />
            <VerticalArrow id="arrow_4" direction="up" row="2" col="3" lane="left" visible={revealedArrows.includes('4-5')} active={activeTarget === 5} start="34%" end="7px" height="58px" />
            <VerticalArrow id="arrow_5" direction="up" row="1" col="3" lane="left" visible={revealedArrows.includes('5-6')} active={activeTarget === 6} start="34%" end="7px" height="58px" />
            <VerticalArrow id="arrow_6" direction="down" row="1" col="3" lane="right" visible={revealedArrows.includes('6-5')} active={activeTarget === 5} start="66%" end="7px" height="58px" />
            <VerticalArrow id="arrow_7" direction="down" row="2" col="3" lane="right" visible={revealedArrows.includes('5-4')} active={activeTarget === 4} start="66%" end="7px" height="58px" />
            <VerticalArrow id="arrow_8" direction="up" row="2" col="1" lane="right" visible={revealedArrows.includes('3-2')} active={activeTarget === 2} start="66%" end="7px" height="58px" />

            <NetworkBridge
              row="3"
              col="2"
              showForward={revealedArrows.includes('3-4')}
              showReturn={revealedArrows.includes('4-3')}
              forwardActive={networkForwardActive}
              returnActive={networkReturnActive}
            />

            <SideLabel row="4" col="1" text="Local" />
            <ProtoPanel
              row="3"
              col="2"
              visible={revealedArrows.includes('3-4') || revealedArrows.includes('4-3')}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => setExpandedLayer(buildProtoExpandedLayer())}
            />
            <SideLabel row="4" col="3" text="Remote" />
          </div>
        </div>
      </div>

      {infoLayer && infoAnchor && (
        <LayerInfoPopup
          layerKey={infoLayer}
          anchor={infoAnchor}
          onClose={() => {
            setInfoLayer(null)
            setInfoAnchor(null)
          }}
        />
      )}
      {expandedLayer && (
        <LayerExpandModal layer={expandedLayer} onClose={() => setExpandedLayer(null)} />
      )}
    </div>
  )
}

function StageBox({
  number,
  row,
  col,
  active,
  enabled,
  mainTokens,
  footerLeft,
  status,
  isInput = false,
  inputValue = '',
  onInputChange,
  onSubmit,
  disabled,
  showProcessingIndicator = false,
  infoKey,
  onInfoOpen,
  onExpandOpen,
}) {
  return (
    <section
      className={stageClass(enabled, active)}
      style={{ gridRow: row, gridColumn: col }}
    >
      <span className={`absolute -left-7 top-3 text-3xl font-semibold ${enabled ? 'text-cyan-200' : 'text-slate-700'}`}>{number}.</span>
      {showProcessingIndicator && (
        <span className="pointer-events-none absolute right-4 top-4 z-10 text-cyan-300 animate-[spin_1.2s_linear_infinite]">
          <GearIcon />
        </span>
      )}
      <div className="flex-1 overflow-hidden p-4 sm:p-5">
        {isInput ? (
          <div className="flex h-full flex-col justify-between">
            <div className="min-h-0 overflow-hidden font-mono text-[clamp(0.95rem,1.18vw,1.08rem)] leading-6">
              <TokenRenderer tokens={mainTokens} />
            </div>

            <form onSubmit={onSubmit} className="mt-4">
              <div className="flex items-center gap-3 border border-cyan-300/35 bg-black/35 px-3 py-2">
                <span className="font-mono text-xl text-cyan-300">&gt;</span>
                <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  disabled={disabled}
                  placeholder="ls | pwd | whoami | date | uname -a"
                  spellCheck="false"
                  className="w-full bg-transparent font-mono text-[clamp(0.95rem,1.18vw,1.08rem)] text-cyan-50 outline-none placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={disabled || !COMMANDS[inputValue.trim()]}
                  className="h-9 w-9 border border-cyan-300/60 text-lg text-cyan-100 disabled:opacity-40"
                >
                  ▶
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.15vw,1.08rem)] leading-6 transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={mainTokens} />
          </div>
        )}
      </div>

      <FooterBar enabled={enabled} footerLeft={number === 1 ? 'Client' : footerLeft} status={status} infoKey={infoKey} onInfoOpen={onInfoOpen} onExpandOpen={onExpandOpen} />
    </section>
  )
}

function SplitStageBox({
  number,
  row,
  col,
  active,
  enabled,
  leftTokens,
  rightTokens,
  footerLeft,
  status,
  infoKey,
  onInfoOpen,
  onExpandOpen,
}) {
  return (
    <section
      className={stageClass(enabled, active)}
      style={{ gridRow: row, gridColumn: col }}
    >
      <span className={`absolute -left-7 top-3 text-3xl font-semibold ${enabled ? 'text-cyan-200' : 'text-slate-700'}`}>{number}.</span>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 overflow-hidden border-r p-4 sm:p-5 ${rightTokens?.length ? BOX_CHROME_ENABLED : 'border-transparent'}`}>
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.12vw,1.02rem)] leading-6 transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={leftTokens} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4 sm:p-5">
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.12vw,1.02rem)] leading-6 transition-opacity duration-500 ${enabled && rightTokens?.length ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={rightTokens} />
          </div>
        </div>
      </div>

      <FooterBar enabled={enabled} footerLeft={footerLeft} status={status} infoKey={infoKey} onInfoOpen={onInfoOpen} onExpandOpen={onExpandOpen} />
    </section>
  )
}

function FooterBar({ enabled, footerLeft, status, infoKey, onInfoOpen, onExpandOpen }) {
  return (
    <div className={`flex items-center justify-between border-t px-4 py-2 ${enabled ? `${BOX_CHROME_ENABLED} text-slate-100` : 'border-slate-700/70 text-slate-500'}`}>
      <span className="flex items-center gap-2 text-[clamp(1rem,1.35vw,1.45rem)] font-medium">
        <InfoButton disabled={!enabled} onClick={(anchor) => onInfoOpen?.(infoKey, anchor)} />
        <span>{footerLeft}</span>
      </span>
      <span className="flex h-6 w-6 items-center justify-center">
        {status === 'waiting'
          ? <StatusLed status={status} />
          : <ExpandButton disabled={!enabled} onClick={onExpandOpen} />}
      </span>
    </div>
  )
}

function InfoButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => onClick?.(event.currentTarget.getBoundingClientRect())}
      aria-label="Open layer info"
      data-layer-info-anchor="true"
      className="flex h-6 w-6 items-center justify-center rounded-full text-cyan-300 transition-colors hover:bg-cyan-300/10 disabled:text-slate-500"
    >
      <InfoIcon />
    </button>
  )
}

function ExpandButton({ disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Expand layer"
      className="flex h-6 w-6 items-center justify-center rounded-full text-cyan-300 transition-colors hover:bg-cyan-300/10 disabled:text-slate-500"
    >
      <ExpandIcon />
    </button>
  )
}

function LayerInfoPopup({ layerKey, anchor, onClose }) {
  const info = LAYER_INFO[layerKey]
  if (!info) return null

  const popupWidth = 320
  const left = Math.max(16, anchor.left + anchor.width / 2 - popupWidth / 2)
  const top = Math.max(16, anchor.top - 156)

  return (
    <div
      className="fixed z-50 w-[320px] rounded-[10px] border border-cyan-200/40 bg-[#08111f] p-4 text-slate-100 shadow-[0_20px_80px_rgba(2,12,27,0.55)]"
      style={{ left: `${left}px`, top: `${top}px` }}
      data-layer-info-popup="true"
    >
      <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-cyan-200/40 bg-[#08111f]" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-cyan-50">{info.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/40 text-cyan-100 transition-colors hover:bg-cyan-200/10"
          aria-label="Close layer info"
        >
          ×
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-200/90">{info.body}</p>
    </div>
  )
}

function LayerExpandModal({ layer, onClose }) {
  const info = LAYER_INFO[layer.infoKey]
  if (!info) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-6" onClick={onClose}>
      <div
        className="relative grid w-full max-w-7xl grid-cols-[1.2fr_0.8fr] gap-6 rounded-[14px] border border-cyan-200/30 bg-[#07111e] p-6 shadow-[0_30px_120px_rgba(2,12,27,0.65)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-[480px]">
          <LayerPreviewCard layer={layer} />
        </div>
        <div className="pt-8 text-base leading-8 text-slate-200/92">
          <p>{info.body}</p>
          <p className="mt-6">{info.more}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-cyan-200/40 text-cyan-100 transition-colors hover:bg-cyan-200/10"
          aria-label="Close expanded layer"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function LayerPreviewCard({ layer }) {
  return (
    <div className="h-full rounded-[10px] border border-cyan-200/30 bg-[#040b17] p-5">
      <div className="h-full">
        {layer.type === 'split' ? (
          <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-cyan-200/35">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto border-r border-cyan-200/35 p-5 font-mono text-[1rem] leading-7 text-slate-100">
                <TokenRenderer tokens={layer.leftTokens} />
              </div>
              <div className="flex-1 overflow-auto p-5 font-mono text-[1rem] leading-7 text-slate-100">
                <TokenRenderer tokens={layer.rightTokens} />
              </div>
            </div>
            <div className="border-t border-cyan-200/35 px-5 py-3 text-xl font-medium text-slate-100">{layer.footerLeft}</div>
          </div>
        ) : layer.type === 'proto' ? (
          <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-cyan-200/35">
            <div className="flex-1 overflow-auto p-5 font-mono text-[1rem] leading-7 text-slate-100">
              <TokenRenderer tokens={layer.mainTokens} />
            </div>
            <div className="border-t border-cyan-200/35 px-5 py-3 text-xl font-medium text-slate-100">{layer.footerLeft}</div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-cyan-200/35">
            <div className="flex-1 overflow-auto p-5 font-mono text-[1rem] leading-7 text-slate-100">
              <TokenRenderer tokens={layer.mainTokens} />
            </div>
            <div className="border-t border-cyan-200/35 px-5 py-3 text-xl font-medium text-slate-100">{layer.footerLeft}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusLed({ status }) {
  if (status !== 'waiting') {
    return <span className="h-3.5 w-3.5" aria-hidden="true" />
  }

  return <span className="h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.8)] animate-[rpc-led_1.2s_ease-in-out_infinite]" />
}

function VerticalArrow({ id, direction, row, col, lane, visible, active, start, end, height }) {
  const isDown = direction === 'down'
  const position = start || (lane === 'left' ? '34%' : '66%')
  const arrowEnd = end || '7px'
  const arrowHeight = height || '58px'
  const shaftHeight = isDown ? 'calc(100% - 14px)' : 'calc(100% - 6px)'

  return (
    <div
      id={id}
      className={`pointer-events-none relative overflow-visible transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        gridRow: row,
        gridColumn: col,
        alignSelf: 'end',
        justifySelf: 'stretch',
        height: arrowHeight,
        transform: 'translateY(50%)',
        zIndex: 40,
      }}
    >
      <div className="relative h-full w-full overflow-visible">
        <div className={`absolute top-1 w-[3px] ${active ? 'bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.8)]' : 'bg-cyan-400'}`} style={{ left: position, height: shaftHeight }} />
        <div
          className={`absolute ${isDown ? 'bottom-1' : 'top-1 rotate-180'}`}
          style={{ left: `calc(${position} - ${arrowEnd})` }}
        >
          <ArrowHead active={active} />
        </div>
      </div>
    </div>
  )
}

function NetworkBridge({ row, col, showForward, showReturn, forwardActive, returnActive }) {
  return (
    <div className="pointer-events-none relative z-20" style={{ gridRow: row, gridColumn: col }}>
      <div className="absolute left-0 top-[40%] h-[3px] w-full bg-transparent">
        <div className={`absolute left-0 top-0 h-full transition-all duration-500 ${showForward ? 'w-full bg-cyan-400 opacity-100' : 'w-0 opacity-0'}`} />
        {showForward && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ArrowHead horizontal active={forwardActive} />
          </div>
        )}
      </div>

      <div className="absolute left-0 top-[60%] h-[3px] w-full bg-transparent">
        <div className={`absolute right-0 top-0 h-full transition-all duration-500 ${showReturn ? 'w-full bg-cyan-400 opacity-100' : 'w-0 opacity-0'}`} />
        {showReturn && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rotate-180">
            <ArrowHead horizontal active={returnActive} />
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {(showForward || showReturn) && (
          <span className={`text-lg font-semibold uppercase tracking-[0.42em] ${forwardActive || returnActive ? 'text-cyan-100' : 'text-cyan-200/85'}`}>
            Network
          </span>
        )}
      </div>

      {showForward && (
        <span className={`absolute top-[40%] h-3.5 w-3.5 -translate-y-1/2 rounded-full ${forwardActive ? 'left-[22%] bg-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.9)] animate-[rpc-ping_1.4s_linear_infinite]' : 'left-[70%] bg-cyan-300'}`} />
      )}
      {showReturn && (
        <span className={`absolute top-[60%] h-3.5 w-3.5 -translate-y-1/2 rounded-full ${returnActive ? 'left-[70%] bg-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.9)] animate-[rpc-ping_1.4s_linear_infinite]' : 'left-[22%] bg-cyan-300'}`} />
      )}
    </div>
  )
}

function SideLabel({ row, col, text }) {
  return (
    <div
      className="flex items-center justify-center text-lg font-semibold uppercase tracking-[0.42em] text-cyan-100/85"
      style={{ gridRow: row, gridColumn: col }}
    >
      {text}
    </div>
  )
}

function ProtoPanel({ row, col, visible, onInfoOpen, onExpandOpen }) {
  return (
    <div
      className={`pointer-events-none relative z-10 flex h-full items-end justify-center px-2 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ gridRow: row, gridColumn: col, marginTop: '-13rem' }}
    >
      <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-[6px] border border-cyan-200/30 bg-[#06101d]">
        <div className="px-4 py-3 font-mono text-[11px] leading-5 text-cyan-50/90">
          <div className="text-cyan-200/75">service CommandService {'{'}</div>
          <div>  rpc RunCommand(RunCommandRequest) returns (RunCommandResponse);</div>
          <div>{'}'}</div>
          <div className="mt-2 text-cyan-200/75">message RunCommandRequest {'{'}</div>
          <div>  string command = 1;</div>
          <div>{'}'}</div>
          <div className="mt-2 text-cyan-200/75">message RunCommandResponse {'{'}</div>
          <div>  string stdout = 1;</div>
          <div>{'}'}</div>
        </div>
        <div className={`flex items-center justify-between border-t px-4 py-2 ${BOX_CHROME_ENABLED} text-slate-100`}>
          <span className="flex items-center gap-2 text-[clamp(1rem,1.2vw,1.2rem)] font-medium">
            <InfoButton disabled={!visible} onClick={(anchor) => onInfoOpen?.('Proto Definition', anchor)} />
            <span>Proto Definition</span>
          </span>
          <span className="flex h-6 w-6 items-center justify-center">
            <ExpandButton disabled={!visible} onClick={onExpandOpen} />
          </span>
        </div>
      </div>
    </div>
  )
}

function TokenRenderer({ tokens, large = false }) {
  if (!tokens?.length) return <div className="h-full" />

  return (
    <>
      {tokens.map((token, index) => {
        if (token.kind === 'newline') return <br key={`br-${index}`} />
        if (token.kind === 'indent') {
          return <span key={`indent-${index}`} className="inline-block" style={{ marginLeft: `${token.level * 1}rem` }} aria-hidden="true" />
        }
        return (
          <span key={`${token.kind}-${index}`} className={tokenClass(token.kind)}>
            {token.value}
          </span>
        )
      })}
    </>
  )
}

function buildClientStubRequest(cmd) {
  return [
    { kind: 'dim', value: 'client.runCommand(' },
    { kind: 'punct', value: '{ ' },
    { kind: 'key', value: 'command' },
    { kind: 'punct', value: ': ' },
    { kind: 'string', value: `"${cmd}"` },
    { kind: 'punct', value: ' }' },
    { kind: 'dim', value: ')' },
    { kind: 'newline' },
    { kind: 'dim', value: 'Request Message' },
    { kind: 'newline' },
    ...formatMessage('RunCommandRequest', [['command', `"${cmd}"`]]),
  ]
}

function buildRuntimeRequest(cmd) {
  return buildHttp2RequestTokens(cmd)
}

function buildRuntimeIngress(cmd) {
  return buildHttp2RequestTokens(cmd)
}

function buildServerStubRequest(cmd) {
  return [
    { kind: 'dim', value: 'Decode protobuf request' },
    { kind: 'newline' },
    ...formatMessage('RunCommandRequest', [['command', `"${cmd}"`]]),
    { kind: 'newline' },
    { kind: 'dim', value: 'Request Message -> service' },
  ]
}

function buildServerStubResponse(cmd) {
  return [
    { kind: 'dim', value: 'Encode protobuf response' },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
  ]
}

function buildRuntimeResponse(cmd) {
  return buildHttp2ResponseTokens(cmd)
}

function buildRuntimeEgress(cmd) {
  return buildHttp2ResponseTokens(cmd)
}

function buildClientStubResponse(cmd) {
  return [
    { kind: 'dim', value: 'Response Message' },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
    { kind: 'newline' },
    { kind: 'dim', value: 'stdout -> caller' },
  ]
}

function buildServiceImplementation(cmd) {
  return [
    { kind: 'dim', value: 'RunCommand(request)' },
    { kind: 'newline' },
    { kind: 'dim', value: 'request.command' },
    { kind: 'punct', value: ' = ' },
    { kind: 'string', value: `"${cmd}"` },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'dim', value: 'Response Message' },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
  ]
}

function buildHttp2RequestTokens(cmd) {
  return [
    { kind: 'key', value: 'HTTP/2 HEADERS' },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: ':method' },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: 'POST' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: ':path' },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: '"/CommandService/RunCommand"' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: 'content-type' },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: '"application/grpc"' },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: 'DATA' },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: '[length-prefixed protobuf RunCommandRequest]' },
    { kind: 'newline' },
    ...formatMessage('RunCommandRequest', [['command', `"${cmd}"`]]),
  ]
}

function buildHttp2ResponseTokens(cmd) {
  return [
    { kind: 'key', value: 'DATA' },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: '[length-prefixed protobuf RunCommandResponse]' },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: 'TRAILERS' },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: 'grpc-status' },
    { kind: 'punct', value: ' ' },
    { kind: 'dim', value: '0' },
  ]
}

function buildProtoTokens() {
  return [
    { kind: 'key', value: 'service CommandService' },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: 'rpc RunCommand(RunCommandRequest) returns (RunCommandResponse);' },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: 'message RunCommandRequest' },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: 'string command = 1;' },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: 'message RunCommandResponse' },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: 'string stdout = 1;' },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
  ]
}

function formatMessage(name, fields) {
  const tokens = [
    { kind: 'key', value: name },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
  ]

  fields.forEach(([field, value], index) => {
    tokens.push({ kind: 'indent', level: 1 })
    tokens.push({ kind: 'key', value: field })
    tokens.push({ kind: 'punct', value: ': ' })
    tokens.push({ kind: 'string', value })
    if (index < fields.length - 1) tokens.push({ kind: 'punct', value: ',' })
    tokens.push({ kind: 'newline' })
  })

  tokens.push({ kind: 'punct', value: '}' })
  return tokens
}

function buildExpandedLayer(boxes, boxId, infoKey) {
  if (boxId === 1 || boxId === 6) {
    return {
      type: 'stage',
      infoKey,
      footerLeft: boxes[boxId].footerLeft,
      mainTokens: boxes[boxId].main,
    }
  }

  return {
    type: 'split',
    infoKey,
    footerLeft: boxes[boxId].footerLeft,
    leftTokens: boxes[boxId].left,
    rightTokens: boxes[boxId].right,
  }
}

function buildProtoExpandedLayer() {
  return {
    type: 'proto',
    infoKey: 'Proto Definition',
    footerLeft: 'Proto Definition',
    mainTokens: buildProtoTokens(),
  }
}

function ArrowHead({ horizontal = false, active = false }) {
  const stroke = active ? '#67E8F9' : '#22D3EE'

  if (horizontal) {
    return (
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
        <path d="M1 7H15" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M10.5 1.5L16 7L10.5 12.5" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
      <path d="M8 12.5V1.5" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M2 6.5L8 12.5L14 6.5" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7" r="1.2" fill="currentColor" />
    </svg>
  )
}

function ExpandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 4H4V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4H20V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16V20H8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16V20H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7L17 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 7L7 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.14 12.94C19.18 12.64 19.2 12.32 19.2 12C19.2 11.68 19.18 11.36 19.12 11.06L21.04 9.56C21.22 9.42 21.26 9.16 21.14 8.96L19.32 5.8C19.2 5.58 18.94 5.5 18.72 5.58L16.46 6.5C15.98 6.14 15.46 5.84 14.88 5.62L14.54 3.22C14.5 2.98 14.3 2.8 14.04 2.8H10.4C10.14 2.8 9.94 2.98 9.9 3.22L9.56 5.62C8.98 5.84 8.46 6.16 7.98 6.5L5.72 5.58C5.48 5.48 5.22 5.58 5.12 5.8L3.3 8.96C3.18 9.18 3.22 9.42 3.4 9.56L5.32 11.06C5.28 11.36 5.24 11.68 5.24 12C5.24 12.32 5.26 12.64 5.32 12.94L3.4 14.44C3.22 14.58 3.18 14.84 3.3 15.04L5.12 18.2C5.24 18.42 5.5 18.5 5.72 18.42L7.98 17.5C8.46 17.86 8.98 18.16 9.56 18.38L9.9 20.78C9.94 21.02 10.14 21.2 10.4 21.2H14.04C14.3 21.2 14.5 21.02 14.54 20.78L14.88 18.38C15.46 18.16 15.98 17.84 16.46 17.5L18.72 18.42C18.96 18.52 19.22 18.42 19.32 18.2L21.14 15.04C21.26 14.82 21.22 14.58 21.04 14.44L19.14 12.94Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12.22" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function stageClass(enabled, active) {
  return `relative flex min-h-0 flex-col overflow-hidden rounded-[6px] border transition-all duration-500 ${
    enabled
      ? `${BOX_CHROME_ENABLED} bg-[#040b17] text-slate-100 opacity-100`
      : 'border-slate-800 bg-[#050814] text-slate-600 opacity-0.58'
  } ${
    active
      ? 'shadow-[0_0_0_2px_rgba(34,211,238,0.16),0_0_28px_rgba(34,211,238,0.14)]'
      : ''
  }`
}

function tokenClass(kind) {
  switch (kind) {
    case 'command':
      return 'text-cyan-100'
    case 'output':
      return 'text-emerald-300'
    case 'key':
      return 'text-sky-300'
    case 'string':
      return 'text-amber-300'
    case 'boolean':
      return 'text-fuchsia-300'
    case 'punct':
      return 'text-slate-400'
    case 'icon':
      return 'text-cyan-300'
    case 'dim':
      return 'text-slate-300'
    default:
      return 'text-slate-100'
  }
}

function formatJson(entries) {
  const tokens = [{ kind: 'punct', value: '{' }, { kind: 'newline' }]

  entries.forEach(([key, rawValue], index) => {
    tokens.push({ kind: 'dim', value: '\t' })
    tokens.push({ kind: 'key', value: `"${key}"` })
    tokens.push({ kind: 'punct', value: ': ' })
    tokens.push(classifyJsonValue(rawValue))
    if (index < entries.length - 1) tokens.push({ kind: 'punct', value: ',' })
    tokens.push({ kind: 'newline' })
  })

  tokens.push({ kind: 'punct', value: '}' })
  return tokens
}

function boxStatusUpdates(ids, status) {
  return Object.fromEntries(ids.map((id) => [id, { status }]))
}

function playReceiveBeep(beepAudioRef) {
  const audio = beepAudioRef.current
  if (!audio) return

  stopAudio(audio)
  audio.play().catch(() => {})
}

function stopAudio(audio) {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

function classifyJsonValue(value) {
  if (value === 'true' || value === 'false') return { kind: 'boolean', value }
  if (value.startsWith('"')) return { kind: 'string', value }
  return { kind: 'dim', value }
}

function mergeBoxes(current, updates) {
  const next = { ...current }
  Object.entries(updates).forEach(([key, value]) => {
    next[key] = typeof value === 'object' && value !== null ? { ...current[key], ...value } : value
  })
  return next
}

function clearTimers(timersRef) {
  timersRef.current.forEach((timer) => window.clearTimeout(timer))
  timersRef.current = []
}
