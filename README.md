# Interactive System Design

> Learn system design concepts by **doing**, not just reading.
> Live browser simulations — no server, no install, just open and play.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue?style=for-the-badge)](https://interactive-system-design.vercel.app)
[![License](https://img.shields.io/badge/License-Apache%202.0-green?style=for-the-badge)](LICENSE)

---

## What is this?

A growing collection of interactive simulations for every major system design concept you'll encounter in FAANG interviews. Each topic is a standalone page — type real inputs, watch the system respond in real-time, understand *why* it works the way it does.

Every simulation runs 100% in your browser. No backend. No sign-up. Just open the URL and start learning.

---

## Topics

| Topic | Category | Difficulty | Status |
|-------|----------|------------|--------|
| [Remote Procedure Calls (RPC)](src/topics/rpc/) | Networking | Beginner | ✅ Live |
| Load Balancing | Networking | Beginner | 🔜 Soon |
| CDN | Networking | Intermediate | 🔜 Soon |
| Consistent Hashing | Distributed Systems | Intermediate | 🔜 Soon |
| Leader Election (Raft) | Distributed Systems | Advanced | 🔜 Soon |
| LRU Cache | Caching | Beginner | 🔜 Soon |
| Bloom Filter | Data Structures | Intermediate | 🔜 Soon |

New topics are added whenever a new system design problem gets solved. Follow along.

---

## Running Locally

```bash
git clone https://github.com/anandamarsh/interactive-system-design.git
cd interactive-system-design
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). That's it.

---

## Adding a New Topic

Each topic is **completely independent** — its own folder, its own React component, zero cross-topic imports.

**4 steps to add a topic:**

**1. Create the folder and files**
```bash
mkdir src/topics/my-topic
touch src/topics/my-topic/index.js
touch src/topics/my-topic/MyTopicDemo.jsx
```

**2. Build your demo in `MyTopicDemo.jsx`**
```jsx
export default function MyTopicDemo() {
  return (
    <div className="p-8">
      {/* Your interactive simulation here */}
      {/* Plain React — no imports from other topics */}
    </div>
  )
}
```

**3. Export from `index.js`**
```js
export { default } from './MyTopicDemo'
```

**4. Register in `src/registry/topics.js`**
```js
import MyTopicDemo from '../topics/my-topic'

// Add to topicList array:
{
  id: 'my-topic',
  title: 'My Topic',
  shortTitle: 'My Topic',
  category: 'Networking',          // existing or new category
  tags: ['Tag1', 'Tag2'],
  difficulty: 'Beginner',          // Beginner | Intermediate | Advanced
  description: 'One sentence about what the user will learn.',
  component: MyTopicDemo,
  available: true,
  concepts: [
    'Key concept 1',
    'Key concept 2',
  ],
},

// Add its id to the right category in `categories`:
Networking: {
  topicIds: ['rpc', 'load-balancing', 'cdn', 'my-topic'],
},
```

Done. It shows up in the sidebar and homepage automatically.

---

## Tech Stack

| Tool | Role |
|------|------|
| [Vite](https://vitejs.dev) | Build tool & dev server |
| [React 18](https://react.dev) | UI framework |
| [React Router v6](https://reactrouter.com) | Client-side routing |
| [TailwindCSS](https://tailwindcss.com) | Utility-first styling |
| [Vercel](https://vercel.com) | Hosting (static, zero-config) |

---

## License

[Apache 2.0](LICENSE) — free to use, modify, and share.
