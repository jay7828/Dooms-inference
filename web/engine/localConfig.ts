/** The scene and robot catalogue (kept apart from session.ts so the UI bundle does not pull in the engine). */
import { DEFAULT_ROBOT, EXAMPLES, PROFILES, SCENE_ORDER, TASKS, profileSummary, profileSupports } from './data'
import type { DoomsConfig } from '../types'

export function localConfig(): DoomsConfig {
  return {
    scenes: SCENE_ORDER.map((name) => {
      const t = TASKS[name]!
      return {
        name, instruction: t.instruction, objects: t.objects.map((o) => o.name), examples: EXAMPLES[name] ?? [t.instruction],
        robots: Object.values(PROFILES).filter((p) => profileSupports(p, name)).map((p) => p.id),
      }
    }),
    robots: Object.values(PROFILES).map(profileSummary),
    default_robot: DEFAULT_ROBOT,
    real_robots: ['so101'],
    real_robot: {
      available: false, desktop_url: '',
      reason: 'Real robots need the desktop app: a web page cannot reach the arm or camera plugged into your computer.',
    },
  }
}

