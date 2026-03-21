import RpcDemo from '../topics/rpc'

// ─── Topic Registry ───────────────────────────────────────────────────────────
// To add a new topic:
//   1. Create src/topics/<id>/index.js  (export default = your demo component)
//   2. Add an entry here in `topicList`
//   3. Add its id to the right category in `categories`
//   Done. It appears in the sidebar + homepage automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const topicList = [
  {
    id: 'rpc',
    title: 'RPC (Remote Procedure Call)',
    shortTitle: 'RPC (Remote Procedure Call)',
    chapter: 'Core Concepts',
    category: 'Networking',
    tags: ['RPC', 'Marshalling', 'Serialization'],
    difficulty: 'Beginner',
    description:
      'See exactly how a function call travels across a network — marshalled into bytes, transmitted over the wire, unmarshalled on the server, executed, and returned as a response. All in your browser, no server needed.',
    component: RpcDemo,
    available: true,
    concepts: [
      'Marshalling converts function name + arguments into a transmittable byte format (JSON, Protobuf, Thrift)',
      'A stub/proxy makes a remote call look identical to a local function call from the caller\'s perspective',
      'The wire protocol defines the byte layout — gRPC uses HTTP/2 + Protobuf; REST uses HTTP + JSON',
      'Unmarshalling reconstructs the original call on the server, executes it, and marshals the response back',
      'Real RPC frameworks (gRPC, Thrift, Cap\'n Proto) auto-generate stub code from an interface definition',
    ],
  },

  // ── Coming Soon ──────────────────────────────────────────────────────────────
  {
    id: 'consistent-hashing',
    title: 'Consistent Hashing',
    shortTitle: 'Consistent Hashing',
    category: 'Distributed Systems',
    tags: ['Hashing', 'Partitioning', 'Rebalancing'],
    difficulty: 'Intermediate',
    description:
      'Add and remove nodes from a distributed system without reshuffling all keys. Watch the hash ring update in real-time and see exactly which keys move.',
    component: null,
    available: false,
  },
  {
    id: 'load-balancing',
    title: 'Load Balancing',
    shortTitle: 'Load Balancing',
    category: 'Networking',
    tags: ['Round Robin', 'Least Connections', 'Weighted'],
    difficulty: 'Beginner',
    description:
      'Fire requests and watch round-robin, least-connections, and weighted strategies distribute load across servers. See queue depths and latencies shift in real-time.',
    component: null,
    available: false,
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    shortTitle: 'LRU Cache',
    category: 'Caching',
    tags: ['Cache', 'Eviction', 'Hit Rate'],
    difficulty: 'Beginner',
    description:
      'Interact with a live LRU cache — watch evictions happen as the cache fills, and see hit rates improve as access patterns warm up.',
    component: null,
    available: false,
  },
  {
    id: 'leader-election',
    title: 'Leader Election (Raft)',
    shortTitle: 'Leader Election',
    category: 'Distributed Systems',
    tags: ['Raft', 'Consensus', 'Fault Tolerance'],
    difficulty: 'Advanced',
    description:
      'Kill nodes and watch Raft-style leader election happen live. See split-brain scenarios, quorum decisions, and how the cluster recovers.',
    component: null,
    available: false,
  },
  {
    id: 'bloom-filter',
    title: 'Bloom Filter',
    shortTitle: 'Bloom Filter',
    category: 'Data Structures',
    tags: ['Probabilistic', 'False Positives', 'Space Efficient'],
    difficulty: 'Intermediate',
    description:
      'Insert elements and query membership. See exactly when false positives occur and tune the false positive rate by adjusting filter size and hash count.',
    component: null,
    available: false,
  },
  {
    id: 'cdn',
    title: 'Content Delivery Network',
    shortTitle: 'CDN',
    category: 'Networking',
    tags: ['CDN', 'Edge Cache', 'Latency'],
    difficulty: 'Intermediate',
    description:
      'Simulate requests from different regions and watch CDN edge nodes cache and serve content, reducing latency for users around the world.',
    component: null,
    available: false,
  },
]

// Lookup map for O(1) access
export const topics = topicList

export const chapters = {
  'Core Concepts': {
    topicIds: ['rpc'],
  },
}

// Sidebar category structure
export const categories = {
  Networking: {
    topicIds: ['rpc', 'load-balancing', 'cdn'],
  },
  'Distributed Systems': {
    topicIds: ['consistent-hashing', 'leader-election'],
  },
  Caching: {
    topicIds: ['lru-cache'],
  },
  'Data Structures': {
    topicIds: ['bloom-filter'],
  },
}
