import process from 'node:process'
import { createWheelStep } from '../src/core/wheel-step'

type Wheel = [time: number, delta: number]

/** A trackpad swipe: ramp up, peak, then a decaying inertia tail. `humps` keeps the finger busy. */
function swipe(start: number, direction: 1 | -1, tail = 900, humps = false): Wheel[] {
  const events: Wheel[] = []
  let time = start
  const head = humps
    ? [3, 12, 40, 90, 140, 150, 120, 100, 110, 130, 115, 95]
    : [3, 12, 40, 90, 120, 100]
  for (const delta of head) {
    events.push([time, direction * delta])
    time += 16
  }
  let delta = 80
  while (time < start + tail) {
    events.push([time, direction * Math.max(1, Math.round(delta))])
    delta *= 0.95
    time += 16
  }
  return events
}

/**
 * Run a stream against a list of `count` items and return where it lands. A change takes
 * `pendingMs` to apply, as a route change does, and steps pushed meanwhile are refused.
 */
function land(count: number, events: Wheel[], pendingMs = 0): number {
  const gesture = createWheelStep()
  let index = 0
  let pendingUntil = 0
  for (const [time, delta] of events) {
    const direction = gesture.push(delta, time)
    if (!direction) continue
    const next = index + direction
    if (time < pendingUntil || next < 0 || next >= count) continue
    index = next
    pendingUntil = time + pendingMs
  }
  return index
}

const problems: string[] = []
function landsOn(name: string, actual: number, expected: number): void {
  if (actual !== expected) problems.push(`${name}: landed on ${actual}, expected ${expected}`)
}

landsOn('one swipe with a long inertia tail moves one item', land(3, swipe(0, 1)), 1)
landsOn('a hard swipe still moves one item', land(3, swipe(0, 1, 400)), 1)
landsOn('two swipes after a pause move two items', land(3, [...swipe(0, 1), ...swipe(1500, 1)]), 2)
landsOn(
  'a swipe that starts inside the previous tail still counts',
  land(3, [...swipe(0, 1, 500), ...swipe(560, 1)]),
  2,
)
landsOn('a reversal moves back at once', land(3, [...swipe(0, 1, 400), ...swipe(420, -1)]), 0)
landsOn(
  'mouse notches a pause apart move one item each',
  land(3, [
    [0, 100],
    [250, 100],
  ]),
  2,
)
landsOn('one long gesture is one step however long it lasts', land(8, swipe(0, 1, 2500)), 1)
landsOn(
  'a long swipe with humps while the finger moves is one step',
  land(8, swipe(0, 1, 2500, true)),
  1,
)
landsOn(
  'a long swipe is still one step while each change takes 600 ms to apply',
  land(8, swipe(0, 1, 2500), 600),
  1,
)
landsOn(
  'steady equal deltas are one gesture, not a step per pause-free second',
  land(
    8,
    Array.from({ length: 140 }, (_, index): Wheel => [index * 16, 20]),
  ),
  1,
)
landsOn(
  'steady scrolling at 100 ms intervals is one gesture',
  land(
    3,
    Array.from({ length: 20 }, (_, index): Wheel => [index * 100, 20]),
  ),
  1,
)
landsOn(
  'scrolling past the last item stays on it',
  land(3, [...swipe(0, 1), ...swipe(1500, 1), ...swipe(3000, 1)]),
  2,
)
landsOn('scrolling up at the first item stays on it', land(3, swipe(0, -1, 300)), 0)

{
  const gesture = createWheelStep()
  if (gesture.push(0, 0) !== 0) problems.push('a zero delta must not step')
}

if (problems.length) {
  process.stderr.write(`${problems.join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('wheel step: one item per gesture, however long it lasts\n')
}
