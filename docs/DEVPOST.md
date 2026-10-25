# Partyboard — Devpost submission

## Inspiration

We wanted the feeling of gathering around a party game without needing a console or a controller for every friend. Everyone already has a phone, so we asked: what if that phone could become a motion controller for a shared 3D adventure?

HackPSU's Mystery Stack gave us the challenge: phone motion, friendly rivalry, and group play. We built Partyboard around those three ideas, with a woodland setting and quick games that are easy to explain when you hand someone your phone.

## What it does

Partyboard is a browser-based party game for up to eight players. One screen displays the world, and players join from their phones using a QR code or room code—no app download required.

Shake your phone to roll the die and move along a winding 48-space trail. Pass a market to spend coins on power-ups: move farther with Trail Boots, improve a roll with Lucky Clover, choose a roll with Trail Compass, protect yourself with Leaf Shield, or slow a rival with Frost Charm. The first player to reach the finish wins.

After a full round of turns, everyone competes in a mini-game:

- **Hot Potato:** flick to pass the acorn before it pops.
- **Balance:** tilt to stay on a log longer than your rivals.
- **Fishing:** flick to cast, wait for a bite, and lift to reel.
- **Archery:** tilt to aim and flick to release three arrows.
- **Rhythm:** time wrist flicks to the beat marker.

Animated instructions introduce each game. Motion is the primary control method, with touch alternatives for accessibility and devices without usable sensors. An optional demo mode fills empty seats with bots so one person can demonstrate the multiplayer experience.

## How we built it

We built a TypeScript monorepo with a React frontend, a Three.js world rendered through React Three Fiber and Drei, and a Node.js server connected through Socket.IO. Shared Zod schemas validate messages between the host, phones and server.

The server owns dice results, movement, turn order, purchases, scores and victory. Phones send inputs rather than deciding outcomes. Device motion powers shakes, tilts and wrist gestures; persistent player sessions support reconnecting without creating a new player.

Ryan focused on the shared-screen world, interface and integration. Jack focused on the server, phone controller and motion input. We used coding agents during development, with documented ownership boundaries and a shared protocol to coordinate the work. The game is hosted on Render with a custom domain.

## Challenges we ran into

Phone motion needed more care than a normal button. We had to separate intentional gestures from accidental movement, handle sensor permissions, and prevent one shake from submitting multiple actions.

Real-time state and animation also had to agree: a smooth walk should still arrive at the space the server selected. We worked on reconnection, automatic mini-game transitions, readable phone instructions, shop pacing and coin balance. We also cut features that complicated the experience instead of improving it.

## Accomplishments that we're proud of

We turned ordinary phones into controllers for a shared 3D game, supported eight-player parties, and built five distinct motion-driven mini-games. Characters hold their equipment, the camera follows the trail, and shops and power-ups fit the woodland world.

We're also proud of the less visible work: server-owned rules, validated inputs, duplicate-action protection, reconnect support and automated regression tests.

## What we learned

We learned that a party game succeeds when the next action is obvious. Clear instructions, immediate feedback and forgiving motion controls matter just as much as the visuals.

We also learned to keep multiplayer rules authoritative, define shared contracts early, and treat scope reduction as part of polishing—not as giving up.

## What's next for Partyboard

Next, we want broader physical-device testing, more accessible control options, character customization, additional boards and more mini-games. We also want to keep refining motion calibration and performance so joining and playing feels effortless across more phones.

## Built with

TypeScript, JavaScript, React, Three.js, React Three Fiber, Drei, Node.js, Socket.IO,
Zod, Vite, WebGL, DeviceMotion API, HTML5, CSS3, pnpm, Vitest, ESLint, Prettier,
Git, GitHub, GitHub Actions, Render.

---

Submission note: use the revised sword-fight-free video and current gameplay screenshots.
Future features above are plans, not claims about the submitted build.
