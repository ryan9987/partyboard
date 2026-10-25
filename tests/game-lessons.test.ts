import { expect, it } from "vitest"
import {
  getGameLesson,
  type TutorialKind,
  type TutorialMode,
} from "../apps/web/src/host/gameLessons"

const kinds: TutorialKind[] = ["balance", "fishing", "archery", "rhythm", "potato"]
it.each(kinds)("%s has short, complete lessons for both control modes", (kind) => {
  for (const mode of ["touch", "motion"] as TutorialMode[]) {
    const lesson = getGameLesson(kind, mode)
    expect(lesson.steps).toHaveLength(3)
    lesson.steps.forEach((step) => {
      expect(step.trim().length).toBeGreaterThan(5)
      expect(step.length).toBeLessThanOrEqual(65)
      expect(step).not.toMatch(/reticle|counter-tilt/i)
    })
    expect(lesson.goal).toMatch(/win/i)
    expect(lesson.goal.length).toBeLessThanOrEqual(110)
    expect(lesson.touchControls.length).toBeGreaterThan(3)
  }
})
it.each(kinds)("%s touch instructions never require a motion gesture", (kind) => {
  const lesson = getGameLesson(kind, "touch")
  expect(lesson.steps.join(" ")).not.toMatch(/flick|tilt|shake|lift|swing gently/i)
  expect(lesson.goal).toBe(getGameLesson(kind, "motion").goal)
  expect(lesson.steps).not.toEqual(getGameLesson(kind, "motion").steps)
})
it("explains Archery's three-arrow total and Rhythm's timing target", () => {
  expect(getGameLesson("archery").goal).toMatch(/Three arrows\. Highest total score wins/)
  expect(getGameLesson("rhythm", "touch").steps).toContain("Tap Strike")
  expect(getGameLesson("rhythm").goal).toContain("marker reaches the center line")
})
it("uses the real action button labels and explains elimination", () => {
  expect(getGameLesson("potato", "touch").steps).toContain("Tap Pass acorn")
  expect(getGameLesson("potato").steps.join(" ")).toContain("you're out")
  expect(getGameLesson("fishing", "touch").steps).toEqual([
    "Tap Cast line",
    "Wait for REEL NOW",
    "Tap Reel now!",
  ])
})
