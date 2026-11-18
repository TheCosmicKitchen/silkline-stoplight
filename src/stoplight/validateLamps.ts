import type { StoplightConfig } from "./types";

/**
 * Returns a list of lamp problems: duplicate lamp ids, and nodes whose `litLampsByNode` entry
 * is missing or names a lamp that doesn't exist. An empty list means the lamps are valid.
 */
export function validateLamps(config: StoplightConfig): string[] {
  const problems: string[] = [];

  const knownLampIds = new Set<string>();
  for (const lamp of config.lamps) {
    if (knownLampIds.has(lamp.id)) problems.push(`Duplicate lamp id "${lamp.id}"`);
    knownLampIds.add(lamp.id);
  }

  for (const node of config.machine.nodes) {
    const litLampIds = config.litLampsByNode[node];
    if (litLampIds === undefined) {
      problems.push(`Node "${node}" has no entry in litLampsByNode`);
      continue;
    }
    for (const id of litLampIds) {
      if (!knownLampIds.has(id)) problems.push(`Node "${node}" lights unknown lamp "${id}"`);
    }
  }

  return problems;
}
