# YT Worth It

Chrome extension (Manifest V3, no build step) that badges every YouTube video card with
**WORTH IT** / **SKIP** plus a category chip (AI, Robotics, Hobbies, Other), judged by
Jev via the [TypeSafe](https://typesafe.ai) API.

## Install

1. Open `chrome://extensions`, enable **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Open the extension's **Options** and paste your TypeSafe API key. Save.
4. Browse YouTube (home, subscriptions, search, watch sidebar). Badges appear next to titles.

## How it works

For each video the background worker sends one request to `POST /v1/systemone` with the
video `{title, channel, duration}` as state and two questions:

- `worth_watching` (noul): probability the video matches your interests (AI, robotics,
  tech, music, history/strategy games) and is not addictive competitive gaming content.
- `category` (choice): `ai` | `robotics` | `hobbies` | `other`.

`WORTH IT` is shown when the yes-probability is **>= 0.70** (`WORTH_THRESHOLD` in `jev.js`).
Results are cached per video id in `chrome.storage.local`, so re-renders do not re-bill.
Rate-limit (429) and overload (529) responses are retried with exponential backoff, up to 3 tries.

Edit the questions in `jev.js` to change interests.

## Self-check

```sh
TYPESAFE_API_KEY=... node selfcheck.mjs
```

Sends one real request for a sample video using the same question builder and asserts the
response shape.

## Privacy

Your API key is stored in this browser only and is sent only to `api.typesafe.ai`.
Video titles, channel names and durations are sent to TypeSafe for judgment. Nothing else leaves the browser.
