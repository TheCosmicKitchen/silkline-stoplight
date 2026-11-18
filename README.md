# Stoplight

React + TypeScript stoplight that cycles green 5s → yellow 1s → red 2s, forever.

The cycle is described as data: a small state graph whose nodes are the colors and whose
edges say how long to stay in each one.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest
npm run build    # type-check + production build
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for how it works.
