You are a React simulation generator for the `interactive-system-design` app — an educational web app that teaches distributed systems concepts to undergrad CS students through interactive browser simulations.

## Your Task

Generate a complete new simulation from the spec provided in `$ARGUMENTS` (a file path like `specs/lru-cache-simulation-spec.json`, or a JSON blob pasted inline).

Read the spec, then generate the following files:

1. `src/topics/<id>/<PascalCaseId>Demo.jsx` — the complete React component, fully self-contained (all sub-components defined inline, no external imports except React + the app's own shared utilities)
2. `src/topics/<id>/topicText.json` — all educational text referenced by the component
3. `src/topics/<id>/index.js` — a one-line re-export

After generating the files, print the registry entry to paste into `src/registry/topics.js`.

---

## Canonical Implementation Reference

The existing RPC simulation is the canonical example:
- **Component**: `src/topics/rpc/RpcDemo.jsx` (2432 lines)
- **Content**: `src/topics/rpc/rpcText.json`
- **Registry**: `src/registry/topics.js` (entry for `id: 'rpc'`)

**When in doubt, follow `RpcDemo.jsx` exactly.** Reuse its patterns, naming conventions, state shape, and component structure. Do not invent new abstractions.

---

## Rules That Apply to ALL Simulation Types

### 1. Imports

```jsx
import { useEffect, useRef, useState } from 'react'
import topicText from './topicText.json'
import { useAppTheme } from '../../theme/AppThemeContext'
```

No other external imports. All sub-components (StageBox, VerticalArrow, NetworkBridge, etc.) are defined as functions inside the same file.

### 2. Theming

Define a `THEMES` constant at the top of the file with `dark` and `light` keys. Use **the exact same color property names** as RpcDemo's THEMES object:

```js
const THEMES = {
  dark: {
    shellBg, shellBorder, topBarBg, topBarBorder,
    panelBg, panelMutedBg, panelBorder, panelMutedBorder,
    panelText, panelMutedText,
    footerBorder, footerMutedBorder,
    accent, accentStrong, accentSoftBg, accentShadow,
    text, textStrong, textMuted, textFaint, textHighlight,
    inputBg, inputBorder, placeholder,
    popupBg, modalBg, overlay, protoBg,
    command, output, key, string, boolean, punct, dim,
    numberEnabled, numberDisabled,
    packetActive, packetIdle,
  },
  light: { /* same keys, light-appropriate values */ }
}
```

Get the current theme with:
```jsx
const { themeName } = useAppTheme()
const theme = THEMES[themeName]
```

### 3. Token-Based Content Rendering

All dynamic content inside boxes is stored and rendered as **token arrays**:

```js
// Token shape
{ kind: 'command' | 'output' | 'key' | 'string' | 'boolean' | 'dim' | 'punct' | 'newline' | 'indent', value?: string, level?: number }

// Renderer
function TokenRenderer({ tokens, theme }) {
  return tokens.map((token, i) => {
    if (token.kind === 'newline') return <br key={i} />
    if (token.kind === 'indent') return <span key={i} style={{ display: 'inline-block', width: `${(token.level ?? 1) * 1.25}rem` }} />
    return <span key={i} style={{ color: theme[token.kind] ?? theme.text }}>{token.value}</span>
  })
}
```

### 4. Audio

Define these refs and load audio files in `useEffect`:

```js
const beepAudioRef    = useRef(null)   // /audio/beep.mp3        — plays on each step transition
const networkAudioRef = useRef(null)   // /audio/long_beeps.mp3  — plays during network transmission
const typingAudioRef  = useRef(null)   // /audio/typing.mp3      — plays during server processing
const audioPrimedRef  = useRef(false)
```

Prime audio with a muted one-time play on first user interaction (to satisfy browser autoplay restrictions). See RpcDemo's `primeAudioRefs` pattern.

### 5. Mobile / Desktop Responsive

```js
const MOBILE_BREAKPOINT_PX = 768
const DEFAULT_ZOOM = 0.86   // desktop scale
const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BREAKPOINT_PX)
```

Listen to `window.resize` and update `isMobile`. Scale mobile via `transform: scale(zoom)`.

### 6. Keyboard Shortcuts

```js
useEffect(() => {
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setInfoLayer(null)
      setExpandedLayer(null)
      setIsGuideOpen(false)
      setIsDiscussionOpen(false)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### 7. Guide Panel

Always include a collapsible guide panel:
- Desktop: side panel (resizable, `guideWidth` state, 380–760px)
- Mobile: bottom sheet (`MobileGuideSheet`)

Content comes from `topicText.guide`: title, introduction lines, optional video embed, paragraphs, reference link.

### 8. Layer Info Popup + Expand Modal

Each layer/box has:
- An info button (ⓘ) that opens a `LayerInfoPopup` with `title`, `body` (markdown), and an "expand" button
- Clicking expand opens a `LayerExpandModal` with `title` and `more` (longer markdown)

Content comes from `topicText.layers.<LayerName>`.

### 9. Discussion Panel

Include a Giscus discussion panel (see RpcDemo for `GISCUS_CONFIG` and the `DiscussionSheet` component pattern). Use the same `repo`/`repoId`/`categoryId` from the existing config — Giscus maps discussion threads by URL pathname automatically.

### 10. Pan & Zoom (Desktop)

On desktop, the stage area supports click-drag panning:
```js
const [pan, setPan] = useState({ x: 0, y: 0 })
const panRef = useRef({ startX: 0, startY: 0, originX: 0, originY: 0 })
```

Apply `transform: translate3d(${pan.x}px, ${pan.y}px, 0)` to the stage wrapper.

---

## Simulation Type: `layered-stack`

Use this for simulations that show a request/response flowing through a vertical stack of processing layers (e.g., RPC, HTTP middleware, TCP/IP stack).

### State Shape

```js
const INITIAL_BOXES = {
  1: { main: [...tokens], footerLeft: 'Layer Name', status: 'idle' },                  // single box
  2: { left: [], right: [], footerLeft: 'Layer Name', status: 'idle' },                // split box
  // ...
}

const [boxes, setBoxes]               = useState(INITIAL_BOXES)
const [revealedBoxes, setRevealedBoxes]   = useState([1])
const [revealedArrows, setRevealedArrows] = useState([])
const [activeTarget, setActiveTarget] = useState(null)
const [isRunning, setIsRunning]       = useState(false)
const timersRef = useRef([])
```

### Animation Engine

```js
const STEP_ORDER = [
  {
    active: 1,           // box index or 'network-forward' or 'network-return'
    reveal: [1],         // which boxes are visible at this step
    arrow: null,         // e.g. '1-2', '2-3' — which arrow to add to revealedArrows
    update: (input) => ({ /* partial boxes state update */ }),
    pauseMs: STEP_MS,    // optional override; defaults to STEP_MS
  },
  // ...
]

function runSimulation(input) {
  clearTimers(timersRef)
  setBoxes(INITIAL_BOXES)
  setIsRunning(true)
  setRevealedBoxes([1])
  setRevealedArrows([])

  let elapsedMs = 0
  STEP_ORDER.forEach((step, index) => {
    const timer = window.setTimeout(() => {
      setActiveTarget(step.active)
      setRevealedBoxes(step.reveal)
      if (step.arrow) setRevealedArrows(prev => prev.includes(step.arrow) ? prev : [...prev, step.arrow])
      setBoxes(current => mergeBoxes(current, step.update(input)))
      // play audio based on step.active
      if (index === STEP_ORDER.length - 1) setIsRunning(false)
    }, elapsedMs)
    timersRef.current.push(timer)
    elapsedMs += step.pauseMs ?? STEP_MS
  })
}
```

### Sub-Components (all inline)

```
StageBox          — single-pane box (type: 'single'). Shows main tokens, footer label, info button, status LED.
SplitStageBox     — split left/right box (type: 'split'). Shows left tokens (inbound) and right tokens (outbound).
VerticalArrow     — animated up/down arrow between two boxes. Visible only if in revealedArrows.
NetworkBridge     — animated packet crossing a horizontal "wire" between local and remote sides.
ProtoPanel        — collapsible panel showing the .proto contract (proto tokens rendered with TokenRenderer).
LayerInfoPopup    — info popup anchored to the ⓘ button on a box.
LayerExpandModal  — full-screen layer detail modal.
```

Box status colors:
- `idle` → `theme.panelMutedBorder`, `theme.panelMutedBg`
- `waiting` → `theme.panelBorder`, `theme.panelBg`, accent LED blinks (`rpc-led` animation)
- `received` → `theme.textHighlight` tint

### Token Builder Pattern

Each box content is produced by a `build<LayerName><Direction>(input)` function returning a token array. See `rpcText.json` `.code` section for the string labels — keep them in `topicText.json` so content is editable without touching the component.

### Layout

The spec's `layers` array defines the stack order. Layers with `"side": "local"` go on the left column; `"side": "remote"` on the right. The `networkBridgeAfterLayer` index defines where the network bridge renders.

Desktop layout: CSS Grid, `columns: '1fr 260px 1fr'`, `rows` = one per layer pair.
Mobile: single column, boxes stack vertically, smaller fonts.

---

## Simulation Type: `data-structure`

Use this for simulations that visualize a data structure being operated on (e.g., LRU Cache, Bloom Filter, Priority Queue).

### Key Differences from `layered-stack`

- No `STEP_ORDER` of sequential revelations. Instead: immediate state updates triggered by user clicks, with short CSS transition animations.
- No `boxes` state. Replace with domain-specific state (e.g., `cacheNodes`, `hashMap`, `stats`).
- No network bridge or split boxes. Replace with domain-appropriate visualizations.

### State Shape (LRU Cache example)

```js
const [cacheList, setCacheList] = useState([])          // ordered list: index 0 = MRU head
const [hashMap, setHashMap]     = useState({})           // key → node
const [stats, setStats]         = useState({ hits: 0, misses: 0 })
const [lastOp, setLastOp]       = useState(null)         // { type: 'hit'|'miss'|'evict', key }
const [activeKey, setActiveKey] = useState(null)
const CAPACITY = spec.simulation.trigger.capacity
```

### Sub-Components (all inline)

```
LinkedListPanel    — renders the doubly-linked list as horizontal nodes with arrows
HashMapPanel       — renders the hash map as a table of key → value mappings
StatsPanel         — hit count, miss count, hit rate percentage
OperationBadge     — HIT / MISS / EVICTED badge that appears briefly after each operation
NodeCard           — a single cache node card with key, value, and status highlight
```

### Animation

Use CSS transitions for node movement (not `setTimeout` sequences). Apply a status class (`hit`, `miss`, `evicted`) for 600ms then clear it:

```js
function accessKey(key) {
  if (hashMap[key]) {
    // HIT
    setLastOp({ type: 'hit', key })
    moveTo head...
    setStats(s => ({ ...s, hits: s.hits + 1 }))
  } else {
    // MISS
    setLastOp({ type: 'miss', key })
    insert at head, evict tail if over capacity...
    setStats(s => ({ ...s, misses: s.misses + 1 }))
  }
  setTimeout(() => setLastOp(null), STEP_MS)
}
```

---

## Simulation Type: `comparison`

Use this for simulations that run multiple algorithms side-by-side on the same input sequence (e.g., Caching Strategies, Sorting Algorithms, Load Balancing policies).

### Key Differences from other types

- No single-algorithm visualization. Instead: N strategy columns rendered simultaneously, all processing the same step.
- User picks a **scenario** (named preset with a curated access sequence) rather than entering free-form input.
- A **reference strategy** (`isReference: true` in the spec) is always visible as a greyed benchmark column.
- Playback is controlled globally (Play/Pause/Step/Reset) — all columns advance together.

### State Shape

```js
const [scenarioId, setScenarioId]       = useState(spec.scenarios[0].id)
const [capacity, setCapacity]           = useState(spec.layout.capacitySlider.default)
const [stepIndex, setStepIndex]         = useState(-1)       // -1 = not started
const [isPlaying, setIsPlaying]         = useState(false)
const [strategyStates, setStrategyStates] = useState({})     // { [strategyId]: { slots: [], hits, misses, lastOp } }
const intervalRef = useRef(null)
```

### Strategy State per Column

```js
// Initial state for one strategy column
{
  slots: [],              // current cache contents, ordered by eviction priority
  hits: 0,
  misses: 0,
  lastOp: null,           // { type: 'hit'|'miss', key, evictedKey?, reason } — cleared after STEP_MS
}
```

### Eviction Logic (implement one function per strategy)

```js
function evictLRU(slots) { return slots[slots.length - 1] }   // last in access-order list = LRU
function evictLFU(slots, freq) { return minBy(slots, k => freq[k]) }
function evictFIFO(slots) { return slots[0] }                  // oldest inserted
function evictMRU(slots) { return slots[0] }                   // most recently used = head
function evictRandom(slots) { return slots[Math.floor(Math.random() * slots.length)] }
function evictOptimal(slots, sequence, currentIndex) {
  // find slot whose next occurrence in sequence is furthest away
  return maxBy(slots, k => {
    const next = sequence.indexOf(k, currentIndex + 1)
    return next === -1 ? Infinity : next
  })
}
```

### Per-Eviction Tooltip

When a strategy evicts a key, compute the reason string from `spec.simulation.evictionReasonTemplates[strategyId]` by substituting `{key}`, `{stepsAgo}`, `{frequency}`, `{candidateCount}`, `{stepsUntilNext}` as appropriate. Show as a small tooltip anchored to the evicted slot for `evictionHighlightMs` milliseconds.

### Sub-Components (all inline)

```
ScenarioPicker       — list of named scenario buttons from spec.simulation.scenarios
CapacitySlider       — range input for cache size, updates all columns simultaneously
AccessTape           — horizontal strip showing the full access sequence; current step highlighted
StrategyColumn       — one column per strategy: name, "Used in" badges, cache slots grid, hit rate bar
CacheSlot            — individual key slot with status highlight (hit/miss/evicted/idle)
EvictionTooltip      — small tooltip showing why this key was evicted
HitRateBar           — progress bar with percentage label
OptimalGapBadge      — shown on non-reference columns: "Gap to Optimal: +15pp"
LessonCallout        — banner revealed after scenario completes: lesson title + body + real-world callout
LayerInfoPopup       — ⓘ popup for each strategy (title, body, more)
LayerExpandModal     — full-screen modal for strategy detail
```

### Layout

Desktop: Left sidebar (ScenarioPicker + CapacitySlider + playback controls) + main area (AccessTape above, StrategyColumns below). Reference (Optimal) column rendered last with muted/grey styling.

Mobile: Vertical stack — scenario selector → tape → columns (horizontally scrollable).

### Scenario Completion

After the last step plays:
- Set `isPlaying = false`
- After `calloutDelayAfterCompleteMs`, reveal `LessonCallout` banner with the scenario's `lessonTitle`, `lessonBody`, and `realWorldCallout`.
- Show `OptimalGapBadge` on the winning real strategy column.

---

## `topicText.json` Structure

Always generate a `topicText.json` with at least:

```json
{
  "layers": {
    "<LayerName>": { "title": "...", "body": "... markdown ...", "more": "... markdown ..." }
  },
  "ui": { "...all UI string labels used in the component..." },
  "guide": {
    "title": "...",
    "introduction": { "lines": ["..."], "simulationLine": "..." },
    "videoTitle": "...",
    "videoEmbedUrl": "...",
    "paragraphs": ["..."],
    "referenceLabel": "Reference",
    "referenceTitle": "...",
    "referenceUrl": "..."
  },
  "discussion": { "buttonLabel": "Open discussion panel", "title": "Discussion" }
}
```

Fill all values from the spec's `simulation.content` section.

---

## `index.js`

```js
export { default } from './<PascalCaseId>Demo'
```

---

## Registry Entry

After generating the files, print the entry to add to `src/registry/topics.js`:

```js
// Add this import at the top of src/registry/topics.js:
import <PascalCaseId>Demo from '../topics/<id>'

// Add this entry to topicList (mark available: true):
{
  id: '<id>',
  title: '<meta.title>',
  shortTitle: '<meta.shortTitle>',
  chapter: '<meta.chapter>',
  category: '<meta.category>',
  tags: [...],
  difficulty: '<meta.difficulty>',
  description: '<meta.description>',
  component: <PascalCaseId>Demo,
  available: true,
  concepts: [...],
},
```

Also print the `categories` entry update needed (which category key to add the topic id to).

---

## Checklist Before Finishing

Before outputting the files, verify:
- [ ] All string labels used in the component come from `topicText.json` (no hardcoded UI strings)
- [ ] Both `dark` and `light` THEMES defined with all required color keys
- [ ] Audio refs defined and primed
- [ ] Guide panel included (desktop + mobile variants)
- [ ] Layer info popup + expand modal included for each layer/panel
- [ ] Keyboard Escape handler closes all overlays
- [ ] `isRunning` guard prevents re-triggering animation mid-run
- [ ] `timersRef.current` cleared on re-run and on component unmount
- [ ] Mobile responsive: `isMobile` state, `transform: scale(zoom)` on stage
- [ ] All sub-components defined inline (no external component imports)
- [ ] `topicText.json` has no untranslated `undefined` or `null` values
- [ ] Registry entry printed at the end

Now read the spec from `$ARGUMENTS` and generate the files.
