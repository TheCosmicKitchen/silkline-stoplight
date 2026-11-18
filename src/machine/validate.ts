// Checks on a machine definition, made by reading its nodes and edges.

import type { Machine } from "./types";

/** Returns a list of problems; an empty list means the machine is valid. */
export function validateMachine(machine: Machine): string[] {
  const problems: string[] = [];

  const knownNodes = new Set<string>();
  for (const node of machine.nodes) {
    if (knownNodes.has(node)) problems.push(`Duplicate node "${node}"`);
    knownNodes.add(node);
  }
  if (!knownNodes.has(machine.initialNode)) problems.push(`Initial node "${machine.initialNode}" does not exist`);

  for (const edge of machine.edges) {
    const edgeLabel = `Edge ${edge.from} → ${edge.to}`;
    if (!knownNodes.has(edge.from)) problems.push(`${edgeLabel}: unknown "from" node`);
    if (!knownNodes.has(edge.to)) problems.push(`${edgeLabel}: unknown "to" node`);
    if (!(Number.isFinite(edge.afterMs) && edge.afterMs > 0)) {
      problems.push(`${edgeLabel}: afterMs must be a number above 0, got ${edge.afterMs}`);
    }
  }

  return problems;
}
