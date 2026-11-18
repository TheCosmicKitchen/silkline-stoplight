import { realClock, type Clock } from "./machine/clock";
import { useMachine } from "./machine/useMachine";
import { validateMachine } from "./machine/validate";
import { standardStoplight } from "./stoplight/config";
import { Stoplight } from "./stoplight/Stoplight";
import { validateLamps } from "./stoplight/validateLamps";

// Checked once, when the app loads.
const problems = [...validateMachine(standardStoplight.machine), ...validateLamps(standardStoplight)];

interface AppProps {
  /** Real time by default; tests pass a manual clock. */
  clock?: Clock;
}

export default function App({ clock = realClock }: AppProps) {
  if (problems.length > 0) return <pre className="error">{problems.join("\n")}</pre>;
  return <RunningStoplight clock={clock} />;
}

// Split from App because hooks can't come after App's early return.
function RunningStoplight({ clock }: { clock: Clock }) {
  const state = useMachine(standardStoplight.machine, clock);
  const litLampIds = standardStoplight.litLampsByNode[state.node] ?? [];
  return <Stoplight lamps={standardStoplight.lamps} litLampIds={litLampIds} />;
}
