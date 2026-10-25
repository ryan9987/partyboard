import { useState } from "react"
import { GameTutorial } from "./GameTutorial"
import type { TutorialKind, TutorialMode } from "./gameLessons"
import "../controller/controller.css"

/** Dev-only visual fixture: no room, permissions, sensors or game commands. */
export default function LessonRehearsal() {
  const [kind, setKind] = useState<TutorialKind>("fishing")
  const [mode, setMode] = useState<TutorialMode>("touch")
  return (
    <main className="controller-page lesson-rehearsal">
      <header className="controller-brand">
        <span>Instruction preview</span>
        <small>Simulated · no room</small>
      </header>
      <label>
        Game
        <select
          aria-label="Lesson game"
          value={kind}
          onChange={(e) => setKind(e.target.value as TutorialKind)}
        >
          <option value="fishing">Fishing</option>
          <option value="balance">Balance</option>
          <option value="archery">Archery</option>
          <option value="rhythm">Rhythm</option>
          <option value="potato">Hot Potato</option>
        </select>
      </label>
      <label>
        Control mode
        <select
          aria-label="Lesson control mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as TutorialMode)}
        >
          <option value="touch">Touch</option>
          <option value="motion">Motion</option>
        </select>
      </label>
      <GameTutorial kind={kind} mode={mode} />
    </main>
  )
}
