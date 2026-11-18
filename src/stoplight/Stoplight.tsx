import type { CSSProperties } from "react";
import type { LampConfig } from "./types";
import "./Stoplight.css";

interface StoplightProps {
  /** Lamps in top-to-bottom order. */
  lamps: LampConfig[];
  /** Ids of the lamps that are lit right now. */
  litLampIds: string[];
}

/** Draws a housing with the given lamps, lighting the ones in `litLampIds`. */
export function Stoplight({ lamps, litLampIds }: StoplightProps) {
  return (
    <div className="stoplight" role="group" aria-label="Stoplight">
      {lamps.map((lamp) => (
        <Lamp key={lamp.id} lamp={lamp} isLit={litLampIds.includes(lamp.id)} />
      ))}
    </div>
  );
}

function Lamp({ lamp, isLit }: { lamp: LampConfig; isLit: boolean }) {
  return (
    <div
      className={isLit ? "lamp lamp--lit" : "lamp"}
      // A CSS custom property lets one stylesheet rule handle every lamp color.
      style={{ "--lamp-color": lamp.color } as CSSProperties}
      aria-label={`${lamp.label} lamp, ${isLit ? "lit" : "off"}`}
      data-lit={isLit}
    >
      {lamp.label}
    </div>
  );
}
