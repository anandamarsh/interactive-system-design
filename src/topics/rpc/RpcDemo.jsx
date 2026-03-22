import { useEffect, useRef, useState } from 'react'
import rpcText from './rpcText.json'
import { useAppTheme } from '../../theme/AppThemeContext'

const COMMANDS = {
  ls: ['src', 'public', 'package.json', 'README.md', 'vite.config.js'],
  pwd: ['/srv/rpc-demo'],
  whoami: ['rpc-student'],
  date: ['Fri Mar 20 19:07:00 UTC 2026'],
  'uname -a': ['Linux rpc-node-1 6.8.0-demo #1 SMP x86_64 GNU/Linux'],
}

const DEFAULT_ZOOM = 0.86
const MOBILE_BREAKPOINT_PX = 768
const STEP_MS = 1100
const REMOTE_PROC_PAUSE_MS = 2000
const REMOTE_PROC_RECEIVE_BEEP_MS = 220
const BOX_CHROME_ENABLED = 'border-cyan-200/40'
const LAYER_INFO = rpcText.layers
const UI_TEXT = rpcText.ui
const GUIDE_TEXT = rpcText.guide
const DISCUSSION_TEXT = rpcText.discussion
const CODE_TEXT = rpcText.code
const GISCUS_CONFIG = {
  repo: 'anandamarsh/interactive-system-design',
  repoId: 'R_kgDORr4jBA',
  category: 'General',
  categoryId: 'DIC_kwDORr4jBM4C471U',
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'bottom',
  lang: 'en',
}
const BOX_TITLES = {
  client: LAYER_INFO.Client.title,
  clientStub: LAYER_INFO['Client Stub'].title,
  rpcRuntime: LAYER_INFO['RPC Runtime'].title,
  serverStub: LAYER_INFO['Server Stub'].title,
  server: LAYER_INFO.Server.title,
  protoDefinition: LAYER_INFO['Proto Definition'].title,
}
const MOBILE_COMMANDS = ['ls', 'pwd', 'whoami', 'date', 'uname -a']
const THEMES = {
  dark: {
    shellBg: '#0a1320',
    shellBorder: 'rgba(103, 232, 249, 0.1)',
    topBarBg: 'rgba(6, 17, 29, 0.82)',
    topBarBorder: 'rgba(165, 243, 252, 0.14)',
    panelBg: '#040b17',
    panelMutedBg: '#050814',
    panelBorder: 'rgba(207, 250, 254, 0.4)',
    panelMutedBorder: 'rgba(30, 41, 59, 0.9)',
    panelText: '#f8fafc',
    panelMutedText: '#64748b',
    footerBorder: 'rgba(207, 250, 254, 0.4)',
    footerMutedBorder: 'rgba(51, 65, 85, 0.75)',
    accent: '#67e8f9',
    accentStrong: '#22d3ee',
    accentSoftBg: 'rgba(103, 232, 249, 0.1)',
    accentShadow: '0 0 12px rgba(34, 211, 238, 0.8)',
    text: '#e2e8f0',
    textStrong: '#f8fafc',
    textMuted: '#cbd5e1',
    textFaint: '#94a3b8',
    textHighlight: '#4ade80',
    inputBg: 'rgba(0, 0, 0, 0.35)',
    inputBorder: 'rgba(165, 243, 252, 0.35)',
    placeholder: '#64748b',
    popupBg: '#08111f',
    modalBg: '#07111e',
    overlay: 'rgba(2, 6, 23, 0.7)',
    protoBg: '#06101d',
    command: '#e0f2fe',
    output: '#86efac',
    key: '#7dd3fc',
    string: '#fcd34d',
    boolean: '#f0abfc',
    punct: '#94a3b8',
    dim: '#cbd5e1',
    numberEnabled: '#bae6fd',
    numberDisabled: '#334155',
    packetActive: '#d946ef',
    packetIdle: '#67e8f9',
  },
  light: {
    shellBg: '#ffffff',
    shellBorder: 'rgba(37, 99, 235, 0.16)',
    topBarBg: '#ffffff',
    topBarBorder: 'rgba(37, 99, 235, 0.14)',
    panelBg: '#ffffff',
    panelMutedBg: '#edf3f9',
    panelBorder: 'rgba(37, 99, 235, 0.28)',
    panelMutedBorder: 'rgba(148, 163, 184, 0.45)',
    panelText: '#0f172a',
    panelMutedText: '#64748b',
    footerBorder: 'rgba(37, 99, 235, 0.28)',
    footerMutedBorder: 'rgba(148, 163, 184, 0.4)',
    accent: '#0284c7',
    accentStrong: '#0369a1',
    accentSoftBg: 'rgba(2, 132, 199, 0.08)',
    accentShadow: '0 0 10px rgba(2, 132, 199, 0.28)',
    text: '#334155',
    textStrong: '#0f172a',
    textMuted: '#475569',
    textFaint: '#64748b',
    textHighlight: '#16a34a',
    inputBg: 'rgba(248, 250, 252, 0.96)',
    inputBorder: 'rgba(2, 132, 199, 0.3)',
    placeholder: '#94a3b8',
    popupBg: '#ffffff',
    modalBg: '#f8fbff',
    overlay: 'rgba(226, 232, 240, 0.78)',
    protoBg: '#ffffff',
    command: '#075985',
    output: '#15803d',
    key: '#0369a1',
    string: '#b45309',
    boolean: '#a21caf',
    punct: '#64748b',
    dim: '#475569',
    numberEnabled: '#0ea5e9',
    numberDisabled: '#94a3b8',
    packetActive: '#db2777',
    packetIdle: '#0ea5e9',
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
    footerLeft: BOX_TITLES.client,
    status: 'idle',
  },
  2: emptyDualBox(BOX_TITLES.clientStub),
  3: emptyDualBox(BOX_TITLES.rpcRuntime),
  4: emptyDualBox(BOX_TITLES.rpcRuntime),
  5: emptyDualBox(BOX_TITLES.serverStub),
  6: {
    main: [],
    footerLeft: BOX_TITLES.server,
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
        footerLeft: BOX_TITLES.client,
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
        footerLeft: BOX_TITLES.clientStub,
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
        footerLeft: BOX_TITLES.rpcRuntime,
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
        footerLeft: BOX_TITLES.rpcRuntime,
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
        footerLeft: BOX_TITLES.serverStub,
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
        footerLeft: BOX_TITLES.server,
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
        footerLeft: BOX_TITLES.serverStub,
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
        footerLeft: BOX_TITLES.rpcRuntime,
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
        footerLeft: BOX_TITLES.rpcRuntime,
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
        footerLeft: BOX_TITLES.clientStub,
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
        footerLeft: BOX_TITLES.client,
      },
    }),
  },
]

export default function RpcDemo() {
  const [command, setCommand] = useState('')
  const { themeName } = useAppTheme()
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT_PX)
  const [boxes, setBoxes] = useState(INITIAL_BOXES)
  const [minimizedBoxes, setMinimizedBoxes] = useState({})
  const [activeTarget, setActiveTarget] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isRemoteProcessing, setIsRemoteProcessing] = useState(false)
  const [infoLayer, setInfoLayer] = useState(null)
  const [infoAnchor, setInfoAnchor] = useState(null)
  const [expandedLayer, setExpandedLayer] = useState(null)
  const [mobileTerminalSelection, setMobileTerminalSelection] = useState({ sourceId: 1, infoKey: 'Client' })
  const [mobileTerminalTab, setMobileTerminalTab] = useState('messages')
  const [isGuideOpen, setIsGuideOpen] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT_PX)
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(false)
  const [guideWidth, setGuideWidth] = useState(460)
  const [revealedBoxes, setRevealedBoxes] = useState([1])
  const [revealedArrows, setRevealedArrows] = useState([])
  const [isProtoMinimized, setIsProtoMinimized] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const timersRef = useRef([])
  const panRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 })
  const guideResizeRef = useRef(false)
  const beepAudioRef = useRef(null)
  const networkAudioRef = useRef(null)
  const typingAudioRef = useRef(null)

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth)
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isMobile) setIsGuideOpen(false)
  }, [isMobile])

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
        setIsGuideOpen(false)
        setIsDiscussionOpen(false)
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

  useEffect(() => {
    function handlePointerMove(event) {
      if (!guideResizeRef.current) return
      const nextWidth = Math.min(760, Math.max(380, window.innerWidth - event.clientX))
      setGuideWidth(nextWidth)
    }

    function handlePointerUp() {
      guideResizeRef.current = false
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  function handleTypingEnded() {
    setIsRemoteProcessing(false)
  }

  function handleBoxToggle(boxId) {
    setMinimizedBoxes((current) => ({
      ...current,
      [boxId]: !current[boxId],
    }))
  }

  function runCommand(nextCommand) {
    const trimmed = nextCommand.trim()
    if (!COMMANDS[trimmed] || isRunning) return

    setCommand(trimmed)
    clearTimers(timersRef)
    setIsRemoteProcessing(false)
    setBoxes({
      ...INITIAL_BOXES,
      1: {
        main: [{ kind: 'command', value: trimmed }],
        footerLeft: BOX_TITLES.client,
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

  function handleRun(event) {
    event.preventDefault()
    runCommand(command)
  }

  const zoom = isMobile ? Math.min((viewportWidth - 24) / 428, 1) : DEFAULT_ZOOM
  const theme = THEMES[themeName]
  const networkForwardActive = activeTarget === 'network-forward'
  const networkReturnActive = activeTarget === 'network-return'
  const mobileTerminalLayer = mobileTerminalSelection
    ? mobileTerminalSelection.sourceId === 'proto'
      ? buildProtoExpandedLayer()
      : buildExpandedLayer(boxes, mobileTerminalSelection.sourceId, mobileTerminalSelection.infoKey)
    : null
  const stageLayout = isMobile
    ? {
        width: '26.75rem',
        height: '21rem',
        columns: '12rem 2.75rem 10.25rem',
        rows: '1rem auto 2.75rem auto 2.5rem auto 4rem',
        gapX: '0.875rem',
        gapY: '0.2rem',
      }
    : {
        width: '1500px',
        height: '860px',
        columns: '1fr 260px 1fr',
        rows: '1fr 1fr 1fr auto',
        gapX: '2rem',
        gapY: '1.25rem',
      }
  const compactBoxes = isMobile
  const stageSlots = isMobile
    ? {
        labelRow: '1',
        leftTop: '2',
        leftMid: '4',
        leftBottom: '6',
        rightTop: '2',
        rightMid: '4',
        rightBottom: '6',
        leftArrowTop: '3',
        leftArrowBottom: '5',
        rightArrowTop: '3',
        rightArrowBottom: '5',
        protoRow: '7',
        protoCol: '1 / span 3',
        networkRow: '6 / span 2',
        networkCol: '1 / span 3',
      }
    : {
        leftTop: '1',
        leftMid: '2',
        leftBottom: '3',
        rightTop: '1',
        rightMid: '2',
        rightBottom: '3',
        leftArrowTop: '1',
        leftArrowBottom: '2',
        rightArrowTop: '1',
        rightArrowBottom: '2',
        protoRow: '3',
        protoCol: '2',
        networkRow: '3',
        networkCol: '2',
      }

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

  function handleLayerOpen(layer) {
    if (isMobile) {
      setMobileTerminalSelection({ sourceId: layer.sourceId, infoKey: layer.infoKey })
      setMobileTerminalTab('messages')
      return
    }

    setExpandedLayer(layer)
  }

  return (
    <div className="rpc-stage-shell relative flex h-full w-full overflow-hidden border" style={{ backgroundColor: theme.shellBg, borderColor: theme.shellBorder }}>
      {isMobile ? (
        <MobileGuideSheet open={isGuideOpen} theme={theme} onClose={() => setIsGuideOpen(false)} />
      ) : isGuideOpen && (
          <GuidePanel
            theme={theme}
            width={guideWidth}
            onResizeStart={() => {
              guideResizeRef.current = true
            }}
            onClose={() => setIsGuideOpen(false)}
          />
      )}

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {!isGuideOpen && !isMobile && (
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
            style={{ color: theme.accent, backgroundColor: 'transparent' }}
            aria-label={UI_TEXT.openGuide}
          >
            <InfoIcon />
          </button>
        )}
        <div className={`h-full overflow-hidden ${isMobile ? 'flex flex-col' : ''}`} style={{ backgroundColor: theme.shellBg }}>
          {isMobile && (
            <MobileTerminal
              layer={mobileTerminalLayer}
              activeTab={mobileTerminalTab}
              theme={theme}
              onTabChange={setMobileTerminalTab}
              command={command}
              onCommandRun={runCommand}
              isRunning={isRunning}
            />
          )}
          {isMobile && <div className="mx-0 border-b" style={{ borderBottomColor: theme.panelBorder }} />}
          <div
            className={`flex justify-center ${isMobile ? 'shrink-0 items-end pb-16' : 'min-h-full items-center'} ${!isMobile && isPanning ? 'cursor-grabbing' : !isMobile ? 'cursor-grab' : ''}`}
            onPointerDown={isMobile ? undefined : handlePanStart}
            onPointerMove={isMobile ? undefined : handlePanMove}
            onPointerUp={isMobile ? undefined : handlePanEnd}
            onPointerLeave={isMobile ? undefined : handlePanEnd}
          >
            <div
              className="grid origin-center transition-transform duration-300 will-change-transform"
              style={{
                width: stageLayout.width,
                height: stageLayout.height,
                gridTemplateColumns: stageLayout.columns,
                gridTemplateRows: stageLayout.rows,
                columnGap: stageLayout.gapX,
                rowGap: stageLayout.gapY,
                transform: `translate3d(${isMobile ? 0 : Math.round(pan.x)}px, ${isMobile ? 0 : Math.round(pan.y)}px, 0) scale(${zoom})`,
              }}
            >
            <StageBox
              number={1}
              row={stageSlots.leftTop}
              col="1"
              compact={compactBoxes || Boolean(minimizedBoxes[1])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 1}
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
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(1)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 1, 'Client'))}
            />

            <SplitStageBox
              number={2}
              row={stageSlots.leftMid}
              col="1"
              compact={compactBoxes || Boolean(minimizedBoxes[2])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 2}
              active={activeTarget === 2}
              enabled={revealedBoxes.includes(2)}
              leftTokens={boxes[2].left}
              rightTokens={boxes[2].right}
              footerLeft={boxes[2].footerLeft}
              status={boxes[2].status}
              infoKey="Client Stub"
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(2)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 2, 'Client Stub'))}
            />

            <SplitStageBox
              number={3}
              row={stageSlots.leftBottom}
              col="1"
              compact={compactBoxes || Boolean(minimizedBoxes[3])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 3}
              active={activeTarget === 3}
              enabled={revealedBoxes.includes(3)}
              leftTokens={boxes[3].left}
              rightTokens={boxes[3].right}
              footerLeft={boxes[3].footerLeft}
              status={boxes[3].status}
              infoKey="RPC Runtime"
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(3)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 3, 'RPC Runtime'))}
            />

            <StageBox
              number={6}
              row={stageSlots.rightTop}
              col="3"
              compact={compactBoxes || Boolean(minimizedBoxes[6])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 6}
              active={activeTarget === 6}
              enabled={revealedBoxes.includes(6)}
              mainTokens={boxes[6].main}
              footerLeft={boxes[6].footerLeft}
              status={boxes[6].status}
              infoKey="Server"
              showProcessingIndicator={isRemoteProcessing}
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(6)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 6, 'Server'))}
            />

            <SplitStageBox
              number={5}
              row={stageSlots.rightMid}
              col="3"
              compact={compactBoxes || Boolean(minimizedBoxes[5])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 5}
              active={activeTarget === 5}
              enabled={revealedBoxes.includes(5)}
              leftTokens={boxes[5].left}
              rightTokens={boxes[5].right}
              footerLeft={boxes[5].footerLeft}
              status={boxes[5].status}
              infoKey="Server Stub"
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(5)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 5, 'Server Stub'))}
            />

            <SplitStageBox
              number={4}
              row={stageSlots.rightBottom}
              col="3"
              compact={compactBoxes || Boolean(minimizedBoxes[4])}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 4}
              active={activeTarget === 4}
              enabled={revealedBoxes.includes(4)}
              leftTokens={boxes[4].left}
              rightTokens={boxes[4].right}
              footerLeft={boxes[4].footerLeft}
              status={boxes[4].status}
              infoKey="RPC Runtime"
              theme={theme}
              onToggleMinimize={() => handleBoxToggle(4)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildExpandedLayer(boxes, 4, 'RPC Runtime'))}
            />

            <VerticalArrow id="arrow_1" direction="down" row={stageSlots.leftArrowTop} col="1" lane="left" visible={revealedArrows.includes('1-2')} active={activeTarget === 2} start="34%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_2" direction="down" row={stageSlots.leftArrowBottom} col="1" lane="left" visible={revealedArrows.includes('2-3')} active={activeTarget === 3} start="34%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_3" direction="up" row={stageSlots.leftArrowTop} col="1" lane="right" visible={revealedArrows.includes('2-1')} active={activeTarget === 1} start="66%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_4" direction="up" row={stageSlots.rightArrowBottom} col="3" lane="left" visible={revealedArrows.includes('4-5')} active={activeTarget === 5} start="26%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_5" direction="up" row={stageSlots.rightArrowTop} col="3" lane="left" visible={revealedArrows.includes('5-6')} active={activeTarget === 6} start="26%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_6" direction="down" row={stageSlots.rightArrowTop} col="3" lane="right" visible={revealedArrows.includes('6-5')} active={activeTarget === 5} start="64%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_7" direction="down" row={stageSlots.rightArrowBottom} col="3" lane="right" visible={revealedArrows.includes('5-4')} active={activeTarget === 4} start="66%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />
            <VerticalArrow id="arrow_8" direction="up" row={stageSlots.leftArrowBottom} col="1" lane="right" visible={revealedArrows.includes('3-2')} active={activeTarget === 2} start="66%" end="7px" height={isMobile ? '40px' : '58px'} mobileMode={isMobile} theme={theme} />

            <NetworkBridge
              row={stageSlots.networkRow}
              col={stageSlots.networkCol}
              showForward={revealedArrows.includes('3-4')}
              showReturn={revealedArrows.includes('4-3')}
              forwardActive={networkForwardActive}
              returnActive={networkReturnActive}
              mobileMode={isMobile}
              theme={theme}
            />

            {isMobile
              ? <SideLabel row={stageSlots.labelRow} col="1" text={UI_TEXT.local} theme={theme} mobileMode />
              : <SideLabel row="4" col="1" text={UI_TEXT.local} theme={theme} />}
            <ProtoPanel
              row={stageSlots.protoRow}
              col={stageSlots.protoCol}
              visible={revealedArrows.includes('3-4') || revealedArrows.includes('4-3')}
              compact={compactBoxes || isProtoMinimized}
              mobileMode={isMobile}
              selected={mobileTerminalLayer?.sourceId === 'proto'}
              theme={theme}
              onToggleMinimize={() => setIsProtoMinimized((current) => !current)}
              onInfoOpen={(layerKey, anchor) => {
                setInfoLayer(layerKey)
                setInfoAnchor(anchor)
              }}
              onExpandOpen={() => handleLayerOpen(buildProtoExpandedLayer())}
            />
            {isMobile
              ? <SideLabel row={stageSlots.labelRow} col="3" text={UI_TEXT.remote} theme={theme} mobileMode />
              : <SideLabel row="4" col="3" text={UI_TEXT.remote} theme={theme} />}
            </div>
          </div>
        </div>
      </div>

      {infoLayer && infoAnchor && (
        <LayerInfoPopup
          layerKey={infoLayer}
          anchor={infoAnchor}
          theme={theme}
          onClose={() => {
            setInfoLayer(null)
            setInfoAnchor(null)
          }}
        />
      )}
      {expandedLayer && (
        <LayerExpandModal layer={expandedLayer} theme={theme} onClose={() => setExpandedLayer(null)} />
      )}

      {isMobile && !isDiscussionOpen && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-40">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="pointer-events-auto flex h-14 w-14 items-center justify-center transition-transform hover:-translate-y-0.5"
            style={{ color: theme.accent, backgroundColor: 'transparent' }}
            aria-label={UI_TEXT.openGuide}
          >
            <InfoIcon size={28} />
          </button>
        </div>
      )}

      {!isDiscussionOpen && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => setIsDiscussionOpen(true)}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: 'transparent', color: theme.accent }}
            aria-label={DISCUSSION_TEXT.buttonLabel}
          >
            <DiscussionIcon />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-0 right-0 z-30 pl-6 pt-6">
        <DiscussionSheet
          open={isDiscussionOpen}
          mobileMode={isMobile}
          theme={theme}
          themeName={themeName}
          onClose={() => setIsDiscussionOpen(false)}
        />
      </div>
    </div>
  )
}

function StageBox({
  number,
  row,
  col,
  compact = false,
  mobileMode = false,
  selected = false,
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
  theme,
  onToggleMinimize,
  onInfoOpen,
  onExpandOpen,
}) {
  const clientCommand = isInput ? extractClientCommand(mainTokens) : ''
  const clientHasOutput = isInput ? mainTokens?.some((token) => token.kind === 'output') : false
  const clientDisplayTokens = isInput
    ? clientCommand
      ? [
          { kind: 'prompt', value: '$ ' },
          { kind: 'command', value: clientCommand },
          ...(mainTokens?.[0]?.kind === 'command' ? mainTokens.slice(1) : mainTokens),
        ]
      : [{ kind: 'prompt', value: '$ ' }]
    : mainTokens

  return (
    <section
      className={stageClass(enabled, active, compact)}
      style={{
        gridRow: row,
        gridColumn: col,
        alignSelf: compact ? 'end' : 'stretch',
        justifySelf: col === '3' ? 'end' : 'start',
        width: compact ? (mobileMode ? '12rem' : '15rem') : '100%',
        ...panelStyle(theme, enabled, active),
        ...(selected && mobileMode ? selectedCompactStyle(theme) : {}),
      }}
    >
      <span className="absolute -left-7 top-3 text-3xl font-semibold" style={{ color: enabled ? theme.numberEnabled : theme.numberDisabled }}>{number}.</span>
      {showProcessingIndicator && (
        <span className={`pointer-events-none absolute z-10 animate-[spin_1.2s_linear_infinite] ${mobileMode ? 'right-[calc(1rem-8px)] top-[calc(1rem-8px)]' : 'right-4 top-4'}`} style={{ color: theme.accent }}>
          <GearIcon size={mobileMode ? 24 : 40} />
        </span>
      )}
      {!compact && (
      <div className="flex-1 overflow-hidden p-4 pt-12 sm:p-5 sm:pt-12">
        {isInput ? (
          <div className="flex h-full flex-col justify-between">
            <div className="min-h-0 overflow-hidden font-mono text-[clamp(0.95rem,1.18vw,1.08rem)] leading-6">
              <TokenRenderer tokens={clientDisplayTokens} theme={theme} />
              {!clientCommand && !disabled && <PromptCursor theme={theme} />}
              {disabled && clientCommand && !clientHasOutput && (
                <div className="mt-1" style={{ color: theme.dim }}>
                  <AsciiSpinner theme={theme} />
                </div>
              )}
            </div>

            <form onSubmit={onSubmit} className="mt-4">
              <div className="flex items-center gap-3">
                <div className="flex w-full items-center gap-3 px-3 py-2" style={{ border: `1px solid ${theme.inputBorder}`, backgroundColor: theme.inputBg }}>
                <span className="font-mono text-xl" style={{ color: theme.accent }}>$</span>
                <input
                  value={inputValue}
                  onChange={(event) => onInputChange(event.target.value)}
                  disabled={disabled}
                  placeholder={UI_TEXT.placeholder}
                  spellCheck="false"
                  className="w-full bg-transparent font-mono text-[clamp(0.95rem,1.18vw,1.08rem)] outline-none"
                  style={{ color: theme.textStrong, caretColor: theme.accent }}
                />
                <button
                  type="submit"
                  disabled={disabled || !COMMANDS[inputValue.trim()]}
                  className="h-9 w-9 text-lg disabled:opacity-40"
                  style={{ color: theme.textStrong }}
                >
                  ▶
                </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.15vw,1.08rem)] leading-6 transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={mainTokens} theme={theme} />
          </div>
        )}
      </div>
      )}

      <FooterBar compact={compact} mobileMode={mobileMode} selected={selected} enabled={enabled} footerLeft={number === 1 ? BOX_TITLES.client : footerLeft} status={status} infoKey={infoKey} theme={theme} onInfoOpen={onInfoOpen} onExpandOpen={onExpandOpen} onToggleMinimize={onToggleMinimize} />
    </section>
  )
}

function GuidePanel({ theme, width, onResizeStart, onClose }) {
  return (
    <aside
      className="relative h-full shrink-0 border-r"
      style={{ width: `${width}px`, borderRightColor: theme.panelBorder, backgroundColor: theme.modalBg }}
    >
      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault()
          onResizeStart()
        }}
        className="absolute right-0 top-0 z-10 h-full w-4 translate-x-1/2 cursor-col-resize"
        aria-hidden="true"
      >
        <span
          className="absolute left-1/2 top-1/2 h-24 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </button>

      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderBottomColor: theme.panelBorder }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.textStrong }}>{GUIDE_TEXT.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
            style={{ borderColor: theme.panelBorder, color: theme.accent, backgroundColor: 'transparent' }}
            aria-label={UI_TEXT.closeGuide}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="overflow-hidden rounded-[10px] border" style={{ borderColor: theme.panelBorder, backgroundColor: theme.panelBg }}>
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={GUIDE_TEXT.videoEmbedUrl}
                title={GUIDE_TEXT.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="space-y-4 text-[0.95rem] leading-7" style={{ color: theme.text }}>
              {GUIDE_TEXT.paragraphs.map((paragraph, index) => (
                <p key={`guide-paragraph-${index}`}>
                  <MarkdownText text={paragraph} theme={theme} />
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-4 text-right" style={{ borderTopColor: theme.panelBorder }}>
            <span className="text-sm font-semibold" style={{ color: theme.textStrong }}>{GUIDE_TEXT.referenceLabel}: </span>
            <a
              href={GUIDE_TEXT.referenceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
              style={{ color: theme.accentStrong }}
            >
              {GUIDE_TEXT.referenceTitle}
            </a>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MobileGuideSheet({ open, theme, onClose }) {
  return (
    <div
      className={`absolute inset-0 z-50 overflow-hidden transition-all duration-300 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{ backgroundColor: theme.modalBg }}
    >
      <div
        className={`flex h-full flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderBottomColor: theme.panelBorder }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.textStrong }}>{GUIDE_TEXT.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center transition-colors"
            style={{ color: theme.accent, backgroundColor: 'transparent' }}
            aria-label={UI_TEXT.closeGuide}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="overflow-hidden border" style={{ borderColor: theme.panelBorder, backgroundColor: theme.panelBg }}>
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={GUIDE_TEXT.videoEmbedUrl}
                title={GUIDE_TEXT.videoTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          <div className="mt-6">
            <div className="space-y-4 text-[0.95rem] leading-7" style={{ color: theme.text }}>
              {GUIDE_TEXT.paragraphs.map((paragraph, index) => (
                <p key={`mobile-guide-paragraph-${index}`}>
                  <MarkdownText text={paragraph} theme={theme} />
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-4 text-right" style={{ borderTopColor: theme.panelBorder }}>
            <span className="text-sm font-semibold" style={{ color: theme.textStrong }}>{GUIDE_TEXT.referenceLabel}: </span>
            <a
              href={GUIDE_TEXT.referenceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
              style={{ color: theme.accentStrong }}
            >
              {GUIDE_TEXT.referenceTitle}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiscussionSheet({ open, mobileMode = false, theme, themeName, onClose }) {
  return (
    <section
      className={`${mobileMode ? 'w-screen max-w-none' : 'w-[min(44rem,calc(100vw-2rem))]'} overflow-hidden rounded-tl-[6px] border-[1px] border-b-0 border-r-0 transition-all duration-300 ${open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-[110%] opacity-0'}`}
      style={{
        borderColor: theme.panelBorder,
        backgroundColor: theme.modalBg,
        boxShadow: themeName === 'dark'
          ? 'rgba(34, 211, 238, 0.8) 0px 0px 12px'
          : 'rgba(2, 132, 199, 0.28) 0px 0px 10px',
      }}
    >
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderBottomColor: theme.panelBorder }}>
        <h2 className="text-lg font-semibold" style={{ color: theme.textStrong }}>{DISCUSSION_TEXT.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: theme.panelBorder, color: theme.accent, backgroundColor: 'transparent' }}
          aria-label={UI_TEXT.closeGuide}
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 py-5">
        <GiscusThread open={open} themeName={themeName} />
      </div>
    </section>
  )
}

function GiscusThread({ open, themeName }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open || !containerRef.current || containerRef.current.hasChildNodes()) return

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', GISCUS_CONFIG.repo)
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId)
    script.setAttribute('data-category', GISCUS_CONFIG.category)
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId)
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping)
    script.setAttribute('data-strict', GISCUS_CONFIG.strict)
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled)
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata)
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition)
    script.setAttribute('data-theme', themeName === 'dark' ? 'dark' : 'light')
    script.setAttribute('data-lang', GISCUS_CONFIG.lang)
    containerRef.current.appendChild(script)
  }, [open, themeName])

  useEffect(() => {
    if (!open) return
    const iframe = containerRef.current?.querySelector('iframe.giscus-frame')
    if (!iframe?.contentWindow) return

    iframe.contentWindow.postMessage(
      {
        giscus: {
          setConfig: {
            theme: themeName === 'dark' ? 'dark' : 'light',
          },
        },
      },
      'https://giscus.app',
    )
  }, [open, themeName])

  return <div ref={containerRef} className="min-h-[320px]" />
}

function SplitStageBox({
  number,
  row,
  col,
  compact = false,
  mobileMode = false,
  selected = false,
  active,
  enabled,
  leftTokens,
  rightTokens,
  footerLeft,
  status,
  infoKey,
  theme,
  onToggleMinimize,
  onInfoOpen,
  onExpandOpen,
}) {
  return (
    <section
      className={stageClass(enabled, active, compact)}
      style={{
        gridRow: row,
        gridColumn: col,
        alignSelf: compact ? 'end' : 'stretch',
        justifySelf: col === '3' ? 'end' : 'start',
        width: compact ? (mobileMode ? '12rem' : '15rem') : '100%',
        ...panelStyle(theme, enabled, active),
        ...(selected && mobileMode ? selectedCompactStyle(theme) : {}),
      }}
    >
      <span className="absolute -left-7 top-3 text-3xl font-semibold" style={{ color: enabled ? theme.numberEnabled : theme.numberDisabled }}>{number}.</span>
      {!compact && (
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden border-r p-4 pt-12 sm:p-5 sm:pt-12" style={{ borderRightColor: rightTokens?.length ? theme.panelBorder : 'transparent' }}>
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.12vw,1.02rem)] leading-6 transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={leftTokens} theme={theme} />
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-4 pt-12 sm:p-5 sm:pt-12">
          <div className={`h-full overflow-hidden font-mono text-[clamp(0.92rem,1.12vw,1.02rem)] leading-6 transition-opacity duration-500 ${enabled && rightTokens?.length ? 'opacity-100' : 'opacity-0'}`}>
            <TokenRenderer tokens={rightTokens} theme={theme} />
          </div>
        </div>
      </div>
      )}

      <FooterBar compact={compact} mobileMode={mobileMode} selected={selected} enabled={enabled} footerLeft={footerLeft} status={status} infoKey={infoKey} theme={theme} onInfoOpen={onInfoOpen} onExpandOpen={onExpandOpen} onToggleMinimize={onToggleMinimize} />
    </section>
  )
}

function FooterBar({ compact = false, mobileMode = false, selected = false, enabled, footerLeft, status, infoKey, theme, onInfoOpen, onExpandOpen, onToggleMinimize }) {
  const showStatusLed = status === 'waiting'

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 ${compact ? '' : 'border-t'}`}
      style={{ borderTopColor: enabled ? theme.footerBorder : theme.footerMutedBorder, color: enabled ? theme.textStrong : theme.panelMutedText }}
      onClick={compact && enabled ? (mobileMode ? onExpandOpen : onToggleMinimize) : undefined}
    >
      <span className="flex items-center gap-2 text-[clamp(1rem,1.35vw,1.45rem)] font-medium">
        <InfoButton disabled={!enabled} theme={theme} selected={selected} onClick={(anchor) => onInfoOpen?.(infoKey, anchor)} />
        <span>{footerLeft}</span>
      </span>
      <span className="flex h-6 w-6 items-center justify-center">
        {showStatusLed
          ? <StatusLed status={status} />
          : !mobileMode && compact
          ? <ExpandButton disabled={!enabled} theme={theme} onClick={onExpandOpen} />
          : !mobileMode
          ? <ExpandButton disabled={!enabled} theme={theme} onClick={onExpandOpen} />
          : null}
      </span>
    </div>
  )
}

function InfoButton({ disabled, theme, selected = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event.currentTarget.getBoundingClientRect())
      }}
      aria-label={UI_TEXT.openLayerInfo}
      data-layer-info-anchor="true"
      className="flex h-6 w-6 items-center justify-center rounded-full transition-colors disabled:text-slate-500"
      style={{ color: disabled ? undefined : theme.accent, backgroundColor: 'transparent' }}
    >
      <InfoIcon />
    </button>
  )
}

function ExpandButton({ disabled, theme, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
      aria-label={UI_TEXT.expandLayer}
      className="flex h-6 w-6 items-center justify-center rounded-full transition-colors disabled:text-slate-500"
      style={{ color: disabled ? undefined : theme.accent, backgroundColor: 'transparent' }}
    >
      <ExpandIcon />
    </button>
  )
}

function LayerInfoPopup({ layerKey, anchor, theme, onClose }) {
  const info = LAYER_INFO[layerKey]
  if (!info) return null

  const popupWidth = 320
  const left = Math.max(16, anchor.left + anchor.width / 2 - popupWidth / 2)
  const top = Math.max(16, anchor.top - 156)

  return (
    <div
      className="fixed z-50 w-[320px] rounded-[10px] border p-4 shadow-[0_20px_80px_rgba(2,12,27,0.25)]"
      style={{ left: `${left}px`, top: `${top}px`, borderColor: theme.panelBorder, backgroundColor: theme.popupBg, color: theme.textStrong }}
      data-layer-info-popup="true"
    >
      <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r" style={{ borderColor: theme.panelBorder, backgroundColor: theme.popupBg }} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: theme.textStrong }}>{info.title}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: theme.panelBorder, color: theme.accent, backgroundColor: 'transparent' }}
          aria-label={UI_TEXT.closeLayerInfo}
        >
          <CloseIcon />
        </button>
      </div>
      <p className="mt-3 text-sm leading-6" style={{ color: theme.text }}>
        <MarkdownText text={info.body} theme={theme} />
      </p>
    </div>
  )
}

function LayerExpandModal({ layer, theme, onClose }) {
  const info = LAYER_INFO[layer.infoKey]
  if (!info) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" style={{ backgroundColor: theme.overlay }} onClick={onClose}>
      <div
        className="relative grid w-full max-w-7xl grid-cols-[1.2fr_0.8fr] gap-6 rounded-[14px] border p-6 shadow-[0_30px_120px_rgba(2,12,27,0.25)]"
        style={{ borderColor: theme.panelBorder, backgroundColor: theme.modalBg }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-[480px]">
          <LayerPreviewCard layer={layer} theme={theme} />
        </div>
        <div className="pt-8 text-base leading-8" style={{ color: theme.text }}>
          <h3 className="-mt-8 mb-4 text-2xl font-medium" style={{ color: theme.textStrong }}>
            {info.title}
          </h3>
          <p>
            <MarkdownText text={info.body} theme={theme} />
          </p>
          <p className="mt-6">
            <MarkdownText text={info.more} theme={theme} />
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
          style={{ borderColor: theme.panelBorder, color: theme.accent, backgroundColor: 'transparent' }}
          aria-label={UI_TEXT.closeExpandedLayer}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

function LayerPreviewCard({ layer, theme }) {
  return (
    <div className="h-full">
      {layer.type === 'split' ? (
        <div className="flex h-full overflow-hidden rounded-[8px] border" style={{ borderColor: theme.panelBorder }}>
          <div className="flex-1 overflow-auto border-r p-5 font-mono text-[1rem] leading-7" style={{ borderRightColor: theme.panelBorder, color: theme.textStrong }}>
            <div className="-mx-5 mb-4 border-b px-5 pb-3 text-center text-sm font-medium" style={{ color: theme.textStrong, borderBottomColor: theme.panelBorder }}>
              {UI_TEXT.inbound}
            </div>
            <TokenRenderer tokens={layer.leftTokens} theme={theme} />
          </div>
          <div className="flex-1 overflow-auto p-5 font-mono text-[1rem] leading-7" style={{ color: theme.textStrong }}>
            <div className="-mx-5 mb-4 border-b px-5 pb-3 text-center text-sm font-medium" style={{ color: theme.textStrong, borderBottomColor: theme.panelBorder }}>
              {UI_TEXT.outbound}
            </div>
            <TokenRenderer tokens={layer.rightTokens} theme={theme} />
          </div>
        </div>
      ) : layer.type === 'proto' ? (
        <div className="h-full overflow-auto border p-5 font-mono text-[1rem] leading-7" style={{ borderColor: theme.panelBorder, color: theme.textStrong }}>
          <TokenRenderer tokens={layer.mainTokens} theme={theme} />
        </div>
      ) : (
        <div className="h-full overflow-auto border p-5 font-mono text-[1rem] leading-7" style={{ borderColor: theme.panelBorder, color: theme.textStrong }}>
          <TokenRenderer tokens={layer.mainTokens} theme={theme} />
        </div>
      )}
    </div>
  )
}

function StatusLed({ status }) {
  if (status !== 'waiting') {
    return <span className="h-3.5 w-3.5" aria-hidden="true" />
  }

  return <span className="h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.8)] animate-[rpc-led_1.2s_ease-in-out_infinite]" />
}

function VerticalArrow({ id, direction, row, col, lane, visible, active, start, end, height, mobileMode = false, theme }) {
  const isDown = direction === 'down'
  const position = start || (lane === 'left' ? '34%' : '66%')
  const arrowEnd = end || '7px'
  const arrowHeight = mobileMode ? '100%' : (height || '58px')
  const shaftHeight = mobileMode
    ? (isDown ? 'calc(100% - 18px)' : 'calc(100% - 10px)')
    : (isDown ? 'calc(100% - 14px)' : 'calc(100% - 6px)')

  return (
    <div
      id={id}
      className={`pointer-events-none relative overflow-visible transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        gridRow: row,
        gridColumn: col,
        alignSelf: mobileMode ? 'stretch' : 'end',
        justifySelf: 'stretch',
        height: arrowHeight,
        transform: mobileMode ? 'none' : 'translateY(50%)',
        zIndex: 40,
      }}
    >
      <div className="relative h-full w-full overflow-visible">
        <div className="absolute top-1 w-[3px]" style={{ left: position, height: shaftHeight, backgroundColor: active ? theme.accent : theme.accentStrong, boxShadow: active ? theme.accentShadow : 'none' }} />
        <div
          className={`absolute ${isDown ? 'bottom-1' : 'top-1 rotate-180'}`}
          style={{ left: `calc(${position} - ${arrowEnd})` }}
        >
          <ArrowHead active={active} theme={theme} />
        </div>
      </div>
    </div>
  )
}

function NetworkBridge({ row, col, showForward, showReturn, forwardActive, returnActive, mobileMode = false, theme }) {
  if (mobileMode) {
    return (
      <div className="pointer-events-none relative z-20" style={{ gridRow: row, gridColumn: col }}>
        {showForward && (
          <div className="absolute left-[32%] top-[52%] w-[3px]" style={{ height: '34%', backgroundColor: theme.accentStrong, boxShadow: forwardActive ? theme.accentShadow : 'none' }}>
            <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
              <ArrowHead active={forwardActive} theme={theme} />
            </div>
          </div>
        )}
        {showForward && (
          <div className="absolute left-[63%] top-[58%] w-[3px]" style={{ height: '34%', backgroundColor: theme.accentStrong, boxShadow: forwardActive ? theme.accentShadow : 'none' }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-180">
              <ArrowHead active={forwardActive} theme={theme} />
            </div>
          </div>
        )}
        {showReturn && (
          <div className="absolute left-[37%] top-[58%] w-[3px]" style={{ height: '34%', backgroundColor: theme.accentStrong, boxShadow: returnActive ? theme.accentShadow : 'none' }}>
            <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-180">
              <ArrowHead active={returnActive} theme={theme} />
            </div>
          </div>
        )}
        {showReturn && (
          <div className="absolute left-[68%] top-[52%] w-[3px]" style={{ height: '34%', backgroundColor: theme.accentStrong, boxShadow: returnActive ? theme.accentShadow : 'none' }}>
            <div className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2">
              <ArrowHead active={returnActive} theme={theme} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="pointer-events-none relative z-20" style={{ gridRow: row, gridColumn: col }}>
      <div className="absolute left-0 top-[40%] h-[3px] w-full bg-transparent">
        <div className="absolute left-0 top-0 h-full transition-all duration-500" style={{ width: showForward ? '100%' : '0', opacity: showForward ? 1 : 0, backgroundColor: theme.accentStrong }} />
        {showForward && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <ArrowHead horizontal active={forwardActive} theme={theme} />
          </div>
        )}
      </div>

      <div className="absolute left-0 top-[60%] h-[3px] w-full bg-transparent">
        <div className="absolute right-0 top-0 h-full transition-all duration-500" style={{ width: showReturn ? '100%' : '0', opacity: showReturn ? 1 : 0, backgroundColor: theme.accentStrong }} />
        {showReturn && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 rotate-180">
            <ArrowHead horizontal active={returnActive} theme={theme} />
          </div>
        )}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {!mobileMode && (showForward || showReturn) && (
          <span className="text-lg font-semibold uppercase tracking-[0.42em]" style={{ color: forwardActive || returnActive ? theme.textStrong : theme.accent }}>
            {UI_TEXT.network}
          </span>
        )}
      </div>

      {!mobileMode && showForward && (
        <span className={`absolute top-[40%] h-3.5 w-3.5 -translate-y-1/2 rounded-full ${forwardActive ? 'left-[22%] animate-[rpc-ping_1.4s_linear_infinite]' : 'left-[70%]'}`} style={{ backgroundColor: forwardActive ? theme.packetActive : theme.packetIdle, boxShadow: forwardActive ? `0 0 14px ${theme.packetActive}` : 'none' }} />
      )}
      {!mobileMode && showReturn && (
        <span className={`absolute top-[60%] h-3.5 w-3.5 -translate-y-1/2 rounded-full ${returnActive ? 'left-[70%] animate-[rpc-ping_1.4s_linear_infinite]' : 'left-[22%]'}`} style={{ backgroundColor: returnActive ? theme.packetActive : theme.packetIdle, boxShadow: returnActive ? `0 0 14px ${theme.packetActive}` : 'none' }} />
      )}
    </div>
  )
}

function SideLabel({ row, col, text, theme, mobileMode = false }) {
  return (
    <div
      className={mobileMode ? 'flex items-center justify-center text-xs font-medium' : 'flex items-center justify-center text-lg font-semibold uppercase tracking-[0.42em]'}
      style={{ gridRow: row, gridColumn: col, color: theme.accent, textTransform: mobileMode ? 'none' : undefined }}
    >
      {text}
    </div>
  )
}

function ProtoPanel({ row, col, visible, compact = false, mobileMode = false, selected = false, theme, onToggleMinimize, onInfoOpen, onExpandOpen }) {
  return (
    <div
      className={`pointer-events-none relative z-10 flex h-full justify-center px-2 transition-opacity duration-300 ${mobileMode ? 'items-start' : 'items-end'} ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ gridRow: row, gridColumn: col, marginTop: mobileMode ? '4rem' : '-13rem' }}
    >
      <div
        className="pointer-events-auto relative flex w-full flex-col overflow-hidden rounded-[6px] border"
        style={{
          width: compact ? (mobileMode ? '14rem' : '15rem') : '100%',
          borderColor: theme.panelBorder,
          backgroundColor: theme.protoBg,
          ...(selected && mobileMode ? selectedCompactStyle(theme) : {}),
        }}
      >
        {!compact && (
        <div className="px-4 py-3 pt-12 font-mono text-[11px] leading-5" style={{ color: theme.textStrong }}>
          <div style={{ color: theme.accent }}>{CODE_TEXT.serviceCommandService} {'{'}</div>
          <div>  {CODE_TEXT.rpcSignature}</div>
          <div>{'}'}</div>
          <div className="mt-2" style={{ color: theme.accent }}>{CODE_TEXT.messageRunCommandRequest} {'{'}</div>
          <div>  {CODE_TEXT.stringCommand}</div>
          <div>{'}'}</div>
          <div className="mt-2" style={{ color: theme.accent }}>{CODE_TEXT.messageRunCommandResponse} {'{'}</div>
          <div>  {CODE_TEXT.stringStdout}</div>
          <div>{'}'}</div>
        </div>
        )}
        <div
          className={`flex items-center justify-between px-4 py-2 ${compact ? '' : 'border-t'}`}
          style={{ borderTopColor: theme.footerBorder, color: theme.textStrong }}
          onClick={compact && visible ? (mobileMode ? onExpandOpen : onToggleMinimize) : undefined}
        >
          <span className="flex items-center gap-2 text-[clamp(1rem,1.2vw,1.2rem)] font-medium">
            <InfoButton disabled={!visible} theme={theme} selected={selected} onClick={(anchor) => onInfoOpen?.(BOX_TITLES.protoDefinition, anchor)} />
            <span>{BOX_TITLES.protoDefinition}</span>
          </span>
          {!mobileMode && (
          <span className="flex h-6 w-6 items-center justify-center">
            <ExpandButton disabled={!visible} theme={theme} onClick={onExpandOpen} />
          </span>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileTerminal({ layer, activeTab, theme, onTabChange, command, onCommandRun, isRunning }) {
  return (
    <section className="flex min-h-0 flex-[1.35] flex-col px-3 pb-2 pt-4">
      <div className="mb-2 flex" style={{ backgroundColor: theme.panelBg }}>
        <UnderlineTab label="Messages" active={activeTab === 'messages'} theme={theme} onClick={() => onTabChange('messages')} />
        <UnderlineTab label="Explanation" active={activeTab === 'explanation'} theme={theme} onClick={() => onTabChange('explanation')} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden" style={{ backgroundColor: theme.panelBg }}>
        {!layer ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-7" style={{ color: theme.textMuted }}>
            Tap a box below to load its messages and explanation here.
          </div>
        ) : activeTab === 'messages' ? (
          <MobileTerminalMessages
            layer={layer}
            theme={theme}
            command={command}
            onCommandRun={onCommandRun}
            isRunning={isRunning}
          />
        ) : (
          <MobileTerminalExplanation info={LAYER_INFO[layer.infoKey]} theme={theme} />
        )}
      </div>
    </section>
  )
}

function UnderlineTab({ label, active, theme, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex-1 px-3 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: active ? theme.accentStrong : theme.textMuted,
      }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-[10%] right-[10%] h-[3px]"
          style={{ backgroundColor: theme.accentStrong }}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

function TerminalTab({ label, active, theme, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-[4px] px-3 py-2.5 text-sm font-medium transition-colors"
      style={{
        color: active ? theme.accentStrong : theme.textMuted,
        backgroundColor: active ? theme.accentSoftBg : 'transparent',
      }}
    >
      {label}
    </button>
  )
}

function MobileTerminalMessages({ layer, theme, command, onCommandRun, isRunning }) {
  const [activeSplitTab, setActiveSplitTab] = useState('inbound')

  useEffect(() => {
    setActiveSplitTab('inbound')
  }, [layer.sourceId])

  if (layer.sourceId === 1) {
    const activeCommand = extractClientCommand(layer.mainTokens) || command
    const tailTokens = layer.mainTokens?.[0]?.kind === 'command' ? layer.mainTokens.slice(1) : (layer.mainTokens || [])
    const hasOutput = layer.mainTokens?.some((token) => token.kind === 'output')
    const displayTokens = activeCommand
      ? [
          { kind: 'prompt', value: '$ ' },
          { kind: 'command', value: activeCommand },
          ...tailTokens,
        ]
      : [{ kind: 'prompt', value: '$ ' }]

    return (
      <div className="flex h-full flex-col px-2 py-4 font-mono text-sm leading-6" style={{ color: theme.textStrong }}>
        <div className="min-h-0 flex-1 overflow-auto">
          <TokenRenderer tokens={displayTokens} theme={theme} />
          {!activeCommand && !isRunning && <PromptCursor theme={theme} />}
          {isRunning && !hasOutput && (
            <div className="mt-1" style={{ color: theme.dim }}>
              <AsciiSpinner theme={theme} />
            </div>
          )}
        </div>
        <div className="mt-4 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {MOBILE_COMMANDS.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => onCommandRun(cmd)}
                disabled={isRunning}
                className="rounded-[4px] border px-2.5 py-1 font-mono text-sm transition-colors disabled:opacity-40"
                style={{
                  color: activeCommand === cmd ? theme.accentStrong : theme.textMuted,
                  borderColor: activeCommand === cmd ? theme.accentStrong : theme.inputBorder,
                  backgroundColor: activeCommand === cmd ? theme.accentSoftBg : 'transparent',
                }}
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (layer.type === 'split') {
    return (
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm leading-6" style={{ color: theme.textStrong }}>
          <TokenRenderer tokens={activeSplitTab === 'inbound' ? layer.leftTokens : layer.rightTokens} theme={theme} />
        </div>
        <div className="mt-auto flex gap-1 pt-2" style={{ backgroundColor: theme.panelBg }}>
          <TerminalTab label="Inbound" active={activeSplitTab === 'inbound'} theme={theme} onClick={() => setActiveSplitTab('inbound')} />
          <TerminalTab label="Outbound" active={activeSplitTab === 'outbound'} theme={theme} onClick={() => setActiveSplitTab('outbound')} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 font-mono text-sm leading-6" style={{ color: theme.textStrong }}>
      <TokenRenderer tokens={layer.mainTokens} theme={theme} />
    </div>
  )
}

function MobileTerminalExplanation({ info, theme }) {
  if (!info) return null

  return (
    <div className="h-full overflow-auto px-4 py-4 text-sm leading-7" style={{ color: theme.text }}>
      <p><MarkdownText text={info.body} theme={theme} /></p>
      <p className="mt-4"><MarkdownText text={info.more} theme={theme} /></p>
    </div>
  )
}

function AsciiSpinner({ theme }) {
  const frames = ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]']
  const [frameIndex, setFrameIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length)
    }, 140)

    return () => window.clearInterval(timer)
  }, [frames.length])

  return (
    <span style={{ color: theme.dim }}>{frames[frameIndex]}</span>
  )
}

function PromptCursor({ theme }) {
  return <span className="ml-0.5 inline-block h-[1.05em] w-[0.58ch] align-[-0.12em] animate-[rpc-cursor_1s_step-end_infinite]" style={{ backgroundColor: theme.accent }} aria-hidden="true" />
}

function TokenRenderer({ tokens, large = false, theme }) {
  if (!tokens?.length) return <div className="h-full" />

  return (
    <>
      {tokens.map((token, index) => {
        if (token.kind === 'newline') return <br key={`br-${index}`} />
        if (token.kind === 'indent') {
          return <span key={`indent-${index}`} className="inline-block" style={{ marginLeft: `${token.level * 1}rem` }} aria-hidden="true" />
        }
        return (
          <span key={`${token.kind}-${index}`} style={tokenStyle(token.kind, theme)}>
            {token.value}
          </span>
        )
      })}
    </>
  )
}

function MarkdownText({ text, theme }) {
  return parseInlineMarkdown(text).map((segment, index) => {
    if (segment.kind === 'highlight') {
      return (
        <span key={`md-${index}`} style={{ color: theme.textHighlight, fontWeight: 600 }}>
          {segment.value}
        </span>
      )
    }

    if (segment.kind === 'code') {
      return (
        <code
          key={`md-${index}`}
          className="rounded px-1 py-0.5 font-mono text-[0.92em]"
          style={{ color: theme.textStrong, backgroundColor: theme.accentSoftBg }}
        >
          {segment.value}
        </code>
      )
    }

    return <span key={`md-${index}`}>{segment.value}</span>
  })
}

function parseInlineMarkdown(text) {
  if (!text) return []

  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  const parts = text.split(pattern).filter(Boolean)

  return parts.map((part) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return { kind: 'highlight', value: part.slice(2, -2) }
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return { kind: 'code', value: part.slice(1, -1) }
    }

    return { kind: 'text', value: part }
  })
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
    { kind: 'dim', value: CODE_TEXT.requestMessage },
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
    { kind: 'dim', value: CODE_TEXT.decodeProtobufRequest },
    { kind: 'newline' },
    ...formatMessage('RunCommandRequest', [['command', `"${cmd}"`]]),
    { kind: 'newline' },
    { kind: 'dim', value: CODE_TEXT.requestMessageToService },
  ]
}

function buildServerStubResponse(cmd) {
  return [
    { kind: 'dim', value: CODE_TEXT.encodeProtobufResponse },
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
    { kind: 'dim', value: CODE_TEXT.responseMessage },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
    { kind: 'newline' },
    { kind: 'dim', value: CODE_TEXT.stdoutToCaller },
  ]
}

function buildServiceImplementation(cmd) {
  return [
    { kind: 'dim', value: CODE_TEXT.runCommandRequest },
    { kind: 'newline' },
    { kind: 'dim', value: CODE_TEXT.requestCommand },
    { kind: 'punct', value: ' = ' },
    { kind: 'string', value: `"${cmd}"` },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'dim', value: CODE_TEXT.responseMessage },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
  ]
}

function buildHttp2RequestTokens(cmd) {
  return [
    { kind: 'key', value: CODE_TEXT.http2Headers },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: CODE_TEXT.method },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: CODE_TEXT.post },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: CODE_TEXT.path },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: CODE_TEXT.runCommandPath },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: CODE_TEXT.contentType },
    { kind: 'punct', value: ' ' },
    { kind: 'string', value: CODE_TEXT.grpcContentType },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: CODE_TEXT.data },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: CODE_TEXT.requestPayloadHint },
    { kind: 'newline' },
    ...formatMessage('RunCommandRequest', [['command', `"${cmd}"`]]),
  ]
}

function buildHttp2ResponseTokens(cmd) {
  return [
    { kind: 'key', value: CODE_TEXT.data },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: CODE_TEXT.responsePayloadHint },
    { kind: 'newline' },
    ...formatMessage('RunCommandResponse', [['stdout', `"${COMMANDS[cmd][0]}"`]]),
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: CODE_TEXT.trailers },
    { kind: 'punct', value: ':' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'key', value: CODE_TEXT.grpcStatus },
    { kind: 'punct', value: ' ' },
    { kind: 'dim', value: CODE_TEXT.grpcStatusOk },
  ]
}

function buildProtoTokens() {
  return [
    { kind: 'key', value: CODE_TEXT.serviceCommandService },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: CODE_TEXT.rpcSignature },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: CODE_TEXT.messageRunCommandRequest },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: CODE_TEXT.stringCommand },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
    { kind: 'newline' },
    { kind: 'newline' },
    { kind: 'key', value: CODE_TEXT.messageRunCommandResponse },
    { kind: 'punct', value: ' {' },
    { kind: 'newline' },
    { kind: 'indent', level: 1 },
    { kind: 'dim', value: CODE_TEXT.stringStdout },
    { kind: 'newline' },
    { kind: 'punct', value: '}' },
  ]
}

function extractClientCommand(tokens) {
  const commandToken = tokens?.find((token) => token.kind === 'command' && token.value?.trim())
  return commandToken?.value ?? ''
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
      sourceId: boxId,
      type: 'stage',
      infoKey,
      footerLeft: boxes[boxId].footerLeft,
      mainTokens: boxes[boxId].main,
    }
  }

  return {
    sourceId: boxId,
    type: 'split',
    infoKey,
    footerLeft: boxes[boxId].footerLeft,
    leftTokens: boxes[boxId].left,
    rightTokens: boxes[boxId].right,
  }
}

function buildProtoExpandedLayer() {
  return {
    sourceId: 'proto',
    type: 'proto',
    infoKey: BOX_TITLES.protoDefinition,
    footerLeft: BOX_TITLES.protoDefinition,
    mainTokens: buildProtoTokens(),
  }
}

function ArrowHead({ horizontal = false, active = false, theme }) {
  const stroke = active ? theme.accent : theme.accentStrong

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

function InfoIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2.5V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 19V21.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M21.5 12H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M5 12H2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.72 5.28L16.95 7.05" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.05 16.95L5.28 18.72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.72 18.72L16.95 16.95" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.05 7.05L5.28 5.28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.5 14.5C18.5 15.1 17.34 15.45 16.1 15.45C12.43 15.45 9.45 12.47 9.45 8.8C9.45 7.56 9.8 6.4 10.4 5.4C6.86 6.09 4.2 9.21 4.2 12.95C4.2 17.2 7.65 20.65 11.9 20.65C15.64 20.65 18.76 17.99 19.5 14.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
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

function DiscussionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7.5H18" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6 12H14.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M6 16.5H11" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M5 4.8H19C20.1 4.8 21 5.7 21 6.8V17.2C21 18.3 20.1 19.2 19 19.2H10.8L6.2 22V19.2H5C3.9 19.2 3 18.3 3 17.2V6.8C3 5.7 3.9 4.8 5 4.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  )
}

function GearIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function stageClass(enabled, active, minimized = false) {
  return `relative flex min-h-0 flex-col overflow-hidden rounded-[6px] border transition-all duration-500 ${minimized ? 'h-auto min-h-[0]' : ''} ${active ? 'shadow-[0_0_0_2px_rgba(34,211,238,0.16),0_0_28px_rgba(34,211,238,0.14)]' : ''}`
}

function selectedCompactStyle(theme) {
  return {
    borderColor: theme.accentStrong,
    boxShadow: `0 0 14px ${theme.accentSoftBg}, 0 0 24px ${theme.accentSoftBg}`,
  }
}

function panelStyle(theme, enabled, active) {
  return {
    backgroundColor: enabled ? theme.panelBg : theme.panelMutedBg,
    borderColor: enabled ? theme.panelBorder : theme.panelMutedBorder,
    color: enabled ? theme.panelText : theme.panelMutedText,
    opacity: enabled ? 1 : 0.58,
    boxShadow: active ? theme.accentShadow : 'none',
  }
}

function tokenStyle(kind, theme) {
  switch (kind) {
    case 'prompt':
      return { color: theme.accent }
    case 'command':
      return { color: theme.command }
    case 'output':
      return { color: theme.output }
    case 'key':
      return { color: theme.key }
    case 'string':
      return { color: theme.string }
    case 'boolean':
      return { color: theme.boolean }
    case 'punct':
      return { color: theme.punct }
    case 'dim':
      return { color: theme.dim }
    default:
      return { color: theme.textStrong }
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
