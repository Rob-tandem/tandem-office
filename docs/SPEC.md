# Tandem Office: initial spec (v1, audio only)

Status: v1 built 2026-11-06. Owner: Rob. Type: project. Registry row: "Tandem Office (virtual office)".

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
| Entry | Name, pick a colour, a shared office passcode. Remembered on this browser. |
| Map | One floor, 40 x 24 tiles. Zones: Lobby, Desks, two meeting rooms (Castle, Spaceship), Kitchen, Quiet Garden. |
| Movement | Arrow keys or WASD. Walls and furniture block you. Smooth 8 Hz position sync. |
| Presence | Side list of who is online, their status and zone. Avatar = coloured disc with initials and a name label. |
| Audio | Mic on/off button. You hear people within 5 tiles. Full volume at 2 tiles or closer, fading to silent at 5. |
| Rooms | Inside a meeting room you hear only people in that room, at full volume. Nobody outside hears in. |
| Quiet Garden | Everyone in it is muted both ways. Good for heads-down work with "I am here" presence. |
| Speaking | A ring lights up round an avatar while they talk. |
| Status | Available, In a meeting (set when you are in a room), Away (no input for 5 minutes). |
| Text | Chat panel with three audiences: Nearby (whoever can hear you right now), Everyone, and a direct message to one person. History for the last 24 hours loads when you enter. |
| Transcripts | While your mic is on, your browser transcribes what you say (Web Speech API, Chrome and Edge). Each sentence is saved as a "said" line with who could hear it. A red dot on your avatar shows it is on. You can switch it off; the default is on. Not in the Quiet Garden. |
| Vault capture | Every text message and transcript line is stored in Supabase (`office_messages`). A job on Rob's Mac exports each day to `co-owned/office/log/YYYY-MM-DD.md` in the shared TeamOS library, so nothing said in the office is lost. |
| Branding | Tandem logotype, Wallop font, navy, cream and the card colours. No mascot redraw. |

## 4. Not in v1 (on purpose)

Video, screen share, map editor, persistent objects, recording, mobile, calendar
integration, guest links.

## 5. How it works

- **Static web app.** Vite + TypeScript + canvas. No server code of our own.
- **Supabase Realtime** (the existing cockpit project `epdrqklfolvvvusaxfpo`) does three jobs:
  presence (who is online), broadcast (positions, status), and WebRTC signalling.
  One table, `office_messages`, holds text and transcript lines. The channel name is derived from the passcode, so without the passcode
  you cannot find the room. This is a light gate, fine for v1. v2 adds Google sign-in limited to
  playtandem.com.
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
3. Either person in the Quiet Garden: silent.
4. Otherwise: distance in tiles `d`. Volume = 1 if `d <= 2`, 0 if `d >= 5`, linear in between.
5. Mic off = your track is disabled; others see a muted icon on your avatar.

## 6b. Capture rules

- Text messages: always stored, with audience (nearby names, everyone, or one name) and zone.
- Transcripts: stored only while the speaker's mic is on and transcription is on. Browser-side
  speech recognition, so no audio leaves the browser; only text does.
- Export: `scripts/export-office-log.mjs` writes one markdown file per day into the shared
  library. It runs every 30 minutes on Rob's Mac (launchd). It rewrites the day's file, so it is
  safe to run again.
- Team rule to agree: the office is a recorded space by default. Switch transcription off, or go
  to the Quiet Garden, for anything you do not want in the vault.

## 7. Later (v2 and beyond)

- Video tiles when near someone (LiveKit).
- Screen share inside a meeting room.
- Rooms show the next calendar meeting on their door (Outlook via tandem-graph).
- "Knock": ping someone in the Quiet Garden.
- Teams presence sync, so a Teams call shows as "in a meeting".
- A proper tileset and furniture art.
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
