/** Lightweight parsing of a typed command into (pick object, destination) for the Demo planner and for ground-truth
 *  scoring of free-form commands (command.py). The real agents never see this: they get the raw text. */
import type { SuccessPredicate, TaskSpec } from './data'

const WORDS: [string, RegExp][] = [
  ['cube_red', /\bred\b(?:\s+(?:cube|block))?|\bred\s+one\b/],
  ['cube_blue', /\bblue\b(?:\s+(?:cube|block))?|\bblue\s+one\b/],
  ['bottle', /\bbottle\b/],
  ['box', /\b(?:box|tray|bin)\b/],
]
const OUTSIDE = /\b(?:outside(?: of)?|out of|beside|next to|away from|on the table|on the free|free (?:spot|space))\b/

export function parseCommand(text: string, task: TaskSpec): [string, string] | null {
  const present = new Set(task.objects.map((o) => o.name))
  const lower = text.toLowerCase()
  const hits: [number, string][] = []
  for (const [name, pat] of WORDS) {
    if (!present.has(name)) continue
    const m = pat.exec(lower)
    if (m) hits.push([m.index, name])
  }
  const order = hits.sort((a, b) => a[0] - b[0]).map(([, n]) => n)
  if (OUTSIDE.test(lower)) {
    // "put X outside the box", "take X out of the box"...
    const movable = order.filter((n) => n !== 'box')
    return movable.length ? [movable[0]!, 'table'] : null
  }
  if (order.length < 2 || order[0] === 'box') return null
  return [order[0]!, order[1]!]
}

export function predicateFor(pick: string, dest: string): SuccessPredicate {
  if (dest === 'table') return { type: 'outside', object: pick, target: 'box' }
  return { type: dest === 'box' ? 'inside' : 'on_top', object: pick, target: dest }
}

/** Copy of `task` carrying the typed instruction; free-form scenes get a ground-truth predicate if parsable. */
export function taskForCommand(task: TaskSpec, text: string): { task: TaskSpec; pair: [string, string] | null } {
  const pair = parseCommand(text, task)
  const next: TaskSpec = { ...task, instruction: text }
  if (!task.success.length && pair) next.success = [predicateFor(pair[0], pair[1])]
  return { task: next, pair }
}
