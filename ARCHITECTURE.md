# Architecture

The stoplight is a small **state graph**: the colors are nodes, and each edge says "after this
long in that node, move to this one". The behavior lives in data (`stoplight/config.ts`), and
one pure function, `receive`, works out where the machine is when it's told an event happened.

---

## 1. Map of the code

```
src/
  machine/              the state-graph engine
    types.ts            Machine, Edge, ExecutionState, MachineEvent
    timing.ts           receive / initialState
    validate.ts         checks on a machine definition
    clock.ts            Clock interface + realClock, manualClock
    runner.ts           keeps a machine running: state, a tick every 50ms, subscribers
    useMachine.ts       React's view of a runner
  stoplight/
    config.ts           the brief's behavior as data
    types.ts            LampConfig, StoplightConfig
    validateLamps.ts    checks that lamps and litLampsByNode line up
    Stoplight.tsx       draws the lamps it's given
  App.tsx               wires it together
tests/                  mirrors src/; type-checked by tsconfig.test.json
```

Each layer uses only the ones below it:

```
 App.tsx ──────────────► Stoplight.tsx      (picture)
    │
    ▼
 useMachine ──► runner ──► receive          (pure logic)
                   │
                   ▼
                 Clock                       (time, swappable)
```

---

## 2. The data

```ts
interface Edge           { from: string; to: string; afterMs: number }
interface Machine        { initialNode: string; nodes: string[]; edges: Edge[] }
interface ExecutionState { node: string; enteredAt: number }
type    MachineEvent     = { type: "TIME_OBSERVED"; at: number }
```

- **`Machine`** is the fixed definition: the map.
- **`ExecutionState`** is where the machine is right now: which node, and the clock time it
  got there. `enteredAt` is what timed edges are measured from.
- **`MachineEvent`** is something the machine is told about. Every event carries `at`, the time
  it happened, and a `type`. Today there is one type, `TIME_OBSERVED` ("the clock was read"),
  which the runner sends every 50ms. A new kind of event is one more member of the union.

---

## 3. The core: `receive` in `machine/timing.ts`

```ts
receive(machine, state, event) → new state
```

Two steps, for every event:

1. **Catch up:** take every edge that has come due by `event.at`.
2. **Handle:** do whatever this type of event does, at `event.at`. For `TIME_OBSERVED` that's
   nothing more. The `switch (event.type)` in `receive` is where each new type goes, and
   TypeScript flags it until a new type is handled.

Catching up:

```
repeat:
  among edges out of the current node with  event.at - enteredAt >= afterMs,
    pick the one with the smallest afterMs (first listed on a tie)
  none? → stop
  take it: node = edge.to, enteredAt = enteredAt + afterMs
```

| Rule | Why |
|---|---|
| Keeps going until nothing is due | After a long gap (sleeping laptop, background tab), one event replays every missed transition up to the present. A whole day is about 32,000 quick steps. The loop always ends: each step moves `enteredAt` forward, and `validateMachine` requires `afterMs > 0`. |
| Earliest deadline wins | When a late event finds several edges due, the one that would have fired first in real time is taken, so the replayed history matches what would have happened on time. A tie goes to the edge listed first. |
| Enters at the edge's **deadline**, `enteredAt + afterMs` | Events arrive a little after the deadline (the runner ticks every 50ms, and `setTimeout` runs late). Entering at the deadline keeps that lag from adding up each cycle. |
| `>=` | A node covers `[enteredAt, deadline)`, so at exactly 5000ms green is over and the light is yellow. |
| Returns the same object if nothing was due | The runner compares objects to decide whether to tell subscribers, so React redraws only on a real change. |

---

## 4. Validation

`validateMachine` reports duplicate nodes, a missing initial node, edges to or from unknown
nodes, and `afterMs` values that aren't above 0. `validateLamps` reports duplicate lamp ids and
nodes whose `litLampsByNode` entry is missing or names an unknown lamp. `App` runs both once at load
and shows the problems on screen in place of the light.

---

## 5. Time: `machine/clock.ts`

```ts
interface Clock {
  now(): number;
  schedule(callback: () => void, delayMs: number): () => void;  // returns cancel
}
```

| Clock | Use | Notes |
|---|---|---|
| `realClock` | the app | `performance.now()` (counts steadily even if the system clock changes) + `setTimeout` |
| `manualClock()` | tests | time moves only on `advance(ms)`; runs due callbacks **in time order**, stopping at each deadline so `now()` is exact inside them |

---

## 6. Running it: `machine/runner.ts` and `useMachine.ts`

`createRunner(machine, clock)` returns `{ state, start, stop, subscribe }`. Every `TICK_MS`
(50ms) it does:

```ts
state = receive(machine, state, { type: "TIME_OBSERVED", at: clock.now() });
schedule the next tick, TICK_MS from now;
if the state changed, tell subscribers;
```

The runner knows nothing about edges or durations: it tells the machine the time, and the
machine decides. A change shows on screen at most 50ms after its deadline, while
`enteredAt` stays exact. `TICK_MS` should stay well below the shortest edge (1000ms here).

`useMachine(machine, clock)` creates a runner on the first render, subscribes React's
`setState` to it, starts it, and stops it on unmount. It returns the current `ExecutionState`.
The machine and clock are read once; to swap machines, re-mount the component with a new `key`.

---

## 7. The stoplight

`config.ts`:

```ts
machine: {
  initialNode: "green",
  nodes: ["green", "yellow", "red"],
  edges: [
    { from: "green",  to: "yellow", afterMs: 5000 },
    { from: "yellow", to: "red",    afterMs: 1000 },
    { from: "red",    to: "green",  afterMs: 2000 },
  ],
},
litLampsByNode: { green: ["green"], yellow: ["yellow"], red: ["red"] },
```

The graph decides *where we are*; `litLampsByNode` decides *what that looks like*. A node can light
several lamps (`["red", "yellow"]`) or none (`[]`). `Stoplight.tsx` draws the lamps in
`litLampIds`; one CSS rule handles every color through the `--lamp-color` variable.
