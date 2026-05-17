# ASL Hand Coach

A browser-based web app that teaches beginners the American Sign Language (ASL)
fingerspelling alphabet using your webcam. It tracks your hand in real time,
recognizes the letter you're signing, and gives instant visual feedback — no
installs, no sign-up, and nothing leaves your machine.

> **Status:** Early-stage personal project. Core hand-tracking and recognition
> pipeline is working; lesson/quiz/free modes and the default sign templates are
> actively being refined.

---

## What it does

ASL Hand Coach turns a laptop webcam into an interactive fingerspelling tutor.
It is built around three learning modes that all share the same live camera
workspace:

| Mode | Purpose |
|------|---------|
| **Guided coaching** (`teach`) | Walks you through letters one at a time. Shows a reference overlay of the target sign so you can copy it, and confirms when you've held the correct shape. |
| **Quiz challenge** (`quiz`) | Prompts you with random letters and checks your recall with instant pass/fail feedback. |
| **Free signing** (`free`) | An open practice space — spell whatever you like at your own pace and watch the live prediction, useful for full words and repeated letters. |

The long-term goal stated in the original concept is a three-part curriculum:
a teacher that introduces letters, a quiz that tests them, and a sentence-builder
that lets you combine what you've learned.

---

## How it works

The recognition pipeline runs **entirely in the browser**. There is no backend
and no server-side inference — your camera feed never leaves the page.

```
Webcam frame
   │
   ▼
MediaPipe HandLandmarker  ──►  21 hand landmarks (x, y, z) per detected hand
   │                            (pretrained ML model, runs via WebAssembly)
   ▼
Feature extraction         ──►  63-number normalized feature vector
   │                            (wrist-centered, palm-scaled, left-hand mirrored)
   ▼
Nearest-neighbor classifier ──► best-matching letter by L2 distance + threshold
   │
   ▼
Stability filter           ──►  debounced, flicker-free "stable" prediction
   │
   ▼
Mode UI (teach / quiz / free) + on-screen reference overlay
```

### 1. Hand tracking (the ML part)

The app loads Google's pretrained **[MediaPipe Hand Landmarker]** model
(`@mediapipe/tasks-vision`, model file in `public/models/hand_landmarker.task`)
and runs inference in-browser via WebAssembly, preferring the **GPU delegate**
with automatic CPU fallback. For each video frame it produces 21 hand keypoints
in 3D. This is the only machine-learning component, and it is consumed as a
third-party model — the app does not train its own network.

See `src/hooks/useHandTracking.ts`.

### 2. Feature extraction

Raw landmarks are converted into a pose-invariant 63-element feature vector
(21 landmarks × x/y/z) so the same letter looks similar regardless of where the
hand is or which hand is used:

- **Translate** so the wrist (landmark 0) is the origin.
- **Scale** by palm size (wrist → middle-finger knuckle distance).
- **Mirror** the X axis for left hands so one template works for both hands.

See `src/recognition/features.ts`.

### 3. Classification

Recognition is **deliberately not a learned model** — it's classical template
matching. Each known letter has a stored 63-number template, and an incoming
vector is classified by finding the nearest template by Euclidean (L2) distance.
If the closest match is farther than a configurable threshold, the result is
treated as "unknown."

- Default templates ship in `src/data/defaultTemplates.json`.
- Users (or a developer) can record their own templates, which are saved to
  `localStorage` and override the defaults.

See `src/recognition/classify.ts` and `src/recognition/templates.ts`.

### 4. Stability filtering

Raw per-frame predictions flicker as the hand moves. A `StabilityFilter`
promotes a prediction to "stable" only after it has been held continuously for
~450 ms, and clears it after the hand has been absent/unknown for ~200 ms. This
gives the calm, intentional feedback the learning modes rely on.

See `src/recognition/stability.ts`.

### Pipeline orchestration

`HandPipelineProvider` (a React context) wires all of the above together: it
runs the tracking hook, extracts features, classifies, applies the stability
filter, exposes a throttled debug HUD, and lets the camera overlay register a
per-frame draw callback. The provider wraps only the `/app` route, so the
landing page stays lightweight.

See `src/pipeline/HandPipelineProvider.tsx`.

---

## Tech stack

- **React 19** + **TypeScript**, bundled with **Vite 7**
- **React Router 7** — `/` landing page, `/app` coaching workspace
- **`@mediapipe/tasks-vision`** — hand landmark detection (WASM + GPU)
- **ESLint** (typescript-eslint, React Hooks plugin) for linting
- No backend, database, or external API calls at runtime

---

## Project structure

```
ASL-Hand-Coach/
└── asl-hand-coach/                 # the app (Vite project root)
    ├── public/
    │   ├── models/
    │   │   └── hand_landmarker.task # pretrained MediaPipe model
    │   └── overlays/                # A–Z / 0–9 reference sign images
    └── src/
        ├── App.tsx                  # routes
        ├── pages/
        │   ├── LandingPage.tsx
        │   └── CoachApp.tsx         # mode switcher + workspace shell
        ├── pipeline/
        │   └── HandPipelineProvider.tsx  # ties the whole pipeline together
        ├── hooks/
        │   └── useHandTracking.ts   # camera + MediaPipe lifecycle
        ├── recognition/
        │   ├── features.ts          # landmarks → 63-d feature vector
        │   ├── classify.ts          # nearest-neighbor matching
        │   ├── templates.ts         # default + user template storage
        │   ├── stability.ts         # prediction debouncing
        │   ├── labels.ts
        │   └── types.ts
        ├── modes/
        │   ├── TechingMode.tsx      # guided coaching
        │   ├── QuizMode.tsx
        │   └── FreeMode.tsx
        ├── components/
        │   ├── ModeTabs.tsx
        │   ├── NavBar.tsx
        │   └── DevTemplateTools.tsx # dev-only template capture
        ├── CameraOverlay.tsx        # webcam + landmark/overlay drawing
        └── data/
            └── defaultTemplates.json
```

---

## Getting started

**Prerequisites:** Node.js (18+ recommended) and a webcam. Use a Chromium-based
browser for best WebGL/GPU support.

```bash
cd asl-hand-coach
npm install
npm run dev
```

Open the printed local URL, go to the app, and **grant camera permission** when
prompted. Camera access requires a secure context — `localhost` works for local
development; a deployed build must be served over **HTTPS**.

### Available scripts

Run these from the `asl-hand-coach/` directory:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Privacy

All processing is local. Webcam frames are analyzed in your browser by the
WebAssembly model and discarded; nothing is uploaded or stored remotely. The
only persisted data is any custom sign templates you record, which stay in your
browser's `localStorage`.

---

## Roadmap / known limitations

- Recognition currently uses a single exemplar per letter. Moving to multiple
  samples per letter (or a small trained classifier such as k-NN / MLP) would
  improve accuracy and robustness.
- Default templates and per-mode UX are still being tuned (the distance
  threshold is intentionally loose for now).
- Motion-based letters (e.g. **J** and **Z**) are hard to capture with static
  pose templates and need a sequence-aware approach.
- A sentence/word-building mode is planned but not yet implemented.

[MediaPipe Hand Landmarker]: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
