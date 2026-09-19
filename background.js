importScripts("jev.js");

const MAX_INFLIGHT = 4;
let inflight = 0;
const queue = []; // ponytail: FIFO array queue, fine for a handful of cards per page

async function callJev(apiKey, video) {
  const body = JSON.stringify(buildJevRequest(video));
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(JEV_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body
    });
    if (res.status === 429 || res.status === 529) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`http_${res.status}`);
    const { answers } = await res.json();
    const prob = answers.worth_watching.noul;
    return { worth: prob >= WORTH_THRESHOLD, prob, category: CATEGORY_LABELS[answers.category.choice] || "Other" };
  }
  throw new Error("rate_limited");
}

async function classify(msg) {
  const cacheKey = `cache:${msg.videoId}`;
  const stored = await chrome.storage.local.get(["typesafeApiKey", cacheKey]);
  if (stored[cacheKey]) return stored[cacheKey];
  if (!stored.typesafeApiKey) return { error: "no_key" };
  try {
    const result = await callJev(stored.typesafeApiKey, msg);
    await chrome.storage.local.set({ [cacheKey]: result });
    return result;
  } catch (e) {
    return { error: e.message };
  }
}

function pump() {
  while (inflight < MAX_INFLIGHT && queue.length) {
    const { msg, respond } = queue.shift();
    inflight++;
    classify(msg).then(respond).finally(() => { inflight--; pump(); });
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "classify") return;
  queue.push({ msg, respond: sendResponse });
  pump();
  return true; // keep channel open for async response
});
