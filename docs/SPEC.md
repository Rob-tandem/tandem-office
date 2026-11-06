# Tandem Office: initial spec (v1, audio only)

Status: v1 built 2026-11-06; Storybook Land map and fun touches added the same day. Owner: Rob. Type: project. Registry row: "Tandem Office (virtual office)".

## 1. What it is

A Gather-style virtual office for the Tandem team. One shared 2D floor. Each person is an avatar.
You walk around with the arrow keys. When you walk near someone, you hear them. When you walk
away, you stop hearing them. Meeting rooms keep conversations private. A quiet zone keeps
people silent while they focus.

The point is presence, not meetings. People can "be at work" together, see who is around,
and walk over to ask a quick question instead of booking a call.

## 2. Who it is for

The Tandem core team, about 6 to 10 people, on desktop browsers (Chrome, Edge, Safari, Firefox).
Mobile is not in v1.

## 3. v1 scope (what is built)

| Area | v1 behaviour |
|---|---|
| Entry | Name, home desk, colour, mood emoji for the day, and the office passcode (one office, one passcode, set in the code; Rob tells the team). Remembered on this browser. An invite link carries the passcode after a `#` (never sent to a server), fills it in and hides the field; the 🔗 Invite button copies that link. Your name shows on the signpost under your home desk. |
| Map | **Storybook Land**, one open-plan floor, 44 x 26 tiles, drawn flat and minimal in the story-card palette (no app illustrations; emoji as props). Eight themed desks in two rows, each a round rug with a desk, chair, monitor and a theme prop: Castle, Spaceship, Dinosaur Valley, Farmyard, Magic Tree, Desert Island, Safari, Big Machines. Three glass meeting rooms: the Rocket (all-hands, night-sky walls), the Treehouse (2 to 4), the Cave (1:1). The Playground (ball pit, slide, swings, sandpit, beanbags), the Picnic (gingham blanket and a table), the Night Sky (silent focus zone with beanbags and a telescope), and Reception (the Tandem wordmark on a sign, two sofas, the bell). |
| Movement | Arrow keys or WASD. Walls and furniture block you. Smooth 8 Hz position sync. |
| Presence | Side list of who is online, their status and zone, and a red "connecting…" or "no audio link" when the peer connection to them is not up. The top bar says who you can hear right now. A dropped Realtime channel rejoins itself within 2 s, and the logic keeps running when the tab is in the background. Avatar = coloured disc with initials and a name label. |
| Audio | Mic on/off button. You hear people within 5 tiles. Full volume at 2 tiles or closer, fading to silent at 5. |
| Rooms | Inside a meeting room you hear only people in that room, at full volume. Nobody outside hears in. |
| Night Sky | Everyone in it is muted both ways. Good for heads-down work with "I am here" presence. |
| Video (option 1) | Camera button, off by default. Your camera goes into the same peer mesh as audio at 320 x 240, 15 fps. A tile strip at the top of the map shows the people who can hear you; each tile fades with distance by the same rule as the volume, and disappears when they are out of earshot. A small self-preview shows while your camera is on. Fine for 3 to 5 people on camera at once; beyond that, move to LiveKit (section 7). |
| Lights | The first person in turns the lights on (toast, click, a line in the log). The last person to press Leave turns them off. While the lights are off the floor is in night mode: a navy wash with warm lamp glows at each desk and the sign. A wall switch by the Night Sky door (step on it) toggles the lights for everyone, and says who did it. |
| Fun touches | Door chime when someone enters. A soft pop when someone walks into earshot. Swings bounce you. Step on the bell on the Front Cover and everyone hears it with a "come to the Rocket" banner. |
| Speaking | A ring lights up round an avatar while they talk. |
| Status | Available, In a meeting (set when you are in a room), Away (no input for 5 minutes). |
| Text | Chat panel with three audiences: Nearby (whoever can hear you right now), Everyone, and a direct message to one person. History for the last 24 hours loads when you enter. |
| Transcripts | While your mic is on, your browser transcribes what you say (Web Speech API, Chrome and Edge). Each sentence is saved as a "said" line with who could hear it. A red dot on your avatar shows it is on. You can switch it off; the default is on. Not in the Night Sky. |
| Vault capture | Every text message and transcript line is stored in Supabase (`office_messages`). A job on Rob's Mac exports each day to `co-owned/office/log/YYYY-MM-DD.md` in the shared TeamOS library, so nothing said in the office is lost. |
| Branding | Tandem logotype, Wallop font, navy, cream and the card colours. No mascot redraw. |

## 4. Not in v1 (on purpose)

Screen share, map editor, persistent objects, recording, mobile, calendar
integration, guest links.

## 5. How it works

- **Static web app.** Vite + TypeScript + canvas. No server code of our own.
- **Supabase Realtime** (the existing cockpit project `epdrqklfolvvvusaxfpo`) does three jobs:
  presence (who is online), broadcast (positions, status), and WebRTC signalling.
  One table, `office_messages`, holds text and transcript lines. There is one office (`office = 'main'`) behind one
  passcode checked in the browser. This is a light gate, fine for v1. v2 adds Google sign-in limited to playtandem.com.
- **WebRTC mesh for audio.** Every person has a direct peer connection to every other person.
  Opus audio, Google STUN only. This is fine for up to about 10 people. Some corporate networks
  block direct connections; the fix is a TURN server (Cloudflare has a free tier) behind a small
  edge function. Not needed for a home-working team in v1.
- **Media layer is swappable.** `src/audio.ts` exposes a small interface. When we want video,
  the plan is to replace the mesh with LiveKit Cloud (an SFU with spatial audio built in) rather
  than push video through a mesh. Nothing else changes.

## 6. Audio rules (the detail that matters)

1. Same meeting room: full volume, regardless of distance.
2. Either person in a meeting room and the other is not in that room: silent.
3. Either person in the Night Sky: silent.
4. Otherwise: distance in tiles `d`. Volume = 1 if `d <= 2`, 0 if `d >= 5`, linear in between.
5. Mic off = your track is disabled; others see a muted icon on your avatar.

## 6b. Capture rules

- Text messages: always stored, with audience (nearby names, everyone, or one name) and zone.
- Transcripts: stored only while the speaker's mic is on and transcription is on. Chrome and Edge
  send the audio to the browser vendor's speech service to make the text, so audio does leave the
  browser while transcription is on. Nothing we run stores audio.
- Export: `scripts/export-office-log.mjs` writes one markdown file per day into the shared
  library. It runs every 30 minutes on Rob's Mac (launchd). It rewrites the day's file, so it is
  safe to run again.
- Team rule to agree: the office is a recorded space by default. Switch transcription off, or go
  to the Night Sky, for anything you do not want in the vault.

## 6b2. What the first team test showed (Rob and Tibor, 6 Nov 12:50 to 13:00)

- Both were in the same office; the "sometimes I see Tibor" problem was presence, not passcodes: a person was sometimes
  judged "first in" while the other was there (fixed: wait for the real presence sync), and Tibor's connection
  dropped and rejoined twice in four seconds (fixed: rejoin watchdog, 15 s heartbeat, logic runs in background tabs).
- They were often more than 5 tiles apart (Reception vs Desks), which is silent by design and read as "audio broken".
  Fixed with the "You can hear: …" / "No one in earshot" line in the top bar.
- Still open: audio between two different home networks has not been proven. STUN only. If it fails on a network,
  the fix is a TURN relay (Cloudflare, free tier, needs Rob's Cloudflare login and a small edge function).

## 6c. Known limits of v1 (reviewed by Codex 2026-11-06)

- The message table is readable and writable with the publishable key, like the other cockpit
  tables. Messages carry an office id derived from the passcode, so one passcode's history does
  not show in another, but anyone with the key and the REST URL can read rows. Fix in v2:
  Google sign-in limited to playtandem.com, and RLS by user.
- Rooms, the Night Sky and direct messages are enforced in each person's browser, not by a
  server. A modified client could hear or read more. Fine for a trusted team of ten; not for guests.
- Names are the identity. Two people with the same name would get each other's direct messages.
- Audio uses STUN only. On a network that blocks direct connections a person stays silent; the
  fix is a TURN server (Cloudflare, free tier) behind a small edge function.

## 7. Later (v2 and beyond)

- Google sign-in (playtandem.com only) and per-user RLS, so the vault is private to the team.
- Video tiles when near someone (LiveKit).
- Screen share inside a meeting room.
- Rooms show the next calendar meeting on their door (Outlook via tandem-graph).
- "Knock": ping someone in the Quiet Garden.
- Teams presence sync, so a Teams call shows as "in a meeting".
- Ambient sound per zone, a shared drawing wall in the Playground, snow in December.
- A map editor, or at least a JSON map file people can edit.

## 8. Success test

The team uses it during core hours for one week, and at least a few "walk over and ask"
conversations replace Teams calls. If nobody opens it on day three, the problem is habit,
not features: fix that before adding video.

## 9. Running it

```
npm install
cp .env.example .env   # fill in the Supabase URL and publishable key
npm run dev
```

Deploy: any static host. v1 is on GitHub Pages from the `main` branch.
