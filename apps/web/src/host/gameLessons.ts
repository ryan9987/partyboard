import type { MinigameKind } from "@party-board/protocol"

export type TutorialKind = MinigameKind | "potato" | "duel"
export type TutorialMode = "motion" | "touch"
type Steps = readonly [string, string, string]
type Lesson = { motion: Steps; touch: Steps; goal: string; touchControls: string }

/** One copy source for host lessons, phone lessons and their in-game help. */
const LESSONS: Record<TutorialKind, Lesson> = {
  balance: {
    motion: ["Watch which way you lean", "Tilt the opposite way", "Return toward the center"],
    touch: ["Watch which way you lean", "Slide the opposite way", "Return toward the center"],
    goal: "Last player on the log wins. At time-up, players still standing share the win.",
    touchControls: "Balance slider",
  },
  fishing: {
    motion: ["Flick forward to cast", "Wait for REEL NOW", "Lift once to reel"],
    touch: ["Tap Cast line", "Wait for REEL NOW", "Tap Reel now!"],
    goal: "Keep the meter in the green. Catch fish for points; highest score wins.",
    touchControls: "Cast line / Reel now! + line tension slider",
  },
  archery: {
    motion: ["Tilt left or right to aim", "Aim at your target's center", "Flick once to release"],
    touch: ["Slide left or right to aim", "Aim at your target's center", "Tap Release arrow"],
    goal: "Three arrows. Highest total score wins.",
    touchControls: "Aim slider + Release arrow",
  },
  rhythm: {
    motion: ["Watch the moving beat marker", "Wait for the center line", "Flick once to strike"],
    touch: ["Watch the moving beat marker", "Wait for the center line", "Tap Strike"],
    goal: "Strike as the marker reaches the center line. Highest score wins.",
    touchControls: "Strike",
  },
  potato: {
    motion: [
      "Watch for the acorn in your hand",
      "Flick once to pass it",
      "If it pops in your hand, you're out",
    ],
    touch: [
      "Watch for the acorn in your hand",
      "Tap Pass acorn",
      "If it pops in your hand, you're out",
    ],
    goal: "The acorn passes clockwise. Last player standing wins.",
    touchControls: "Pass acorn",
  },
  duel: {
    motion: ["Swing gently to attack", "Tilt sideways to guard", "Land two hits to win"],
    touch: ["Tap Swing sword to attack", "Tap Guard to block", "Land two hits to win"],
    goal: "Winner keeps the space. Loser moves back up to three spaces.",
    touchControls: "Swing sword / Guard",
  },
}

export function getGameLesson(kind: TutorialKind, mode: TutorialMode = "motion") {
  const lesson = LESSONS[kind]
  return { steps: lesson[mode], goal: lesson.goal, touchControls: lesson.touchControls }
}
