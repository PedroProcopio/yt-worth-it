// Sends ONE real Jev request for a sample video. Usage: TYPESAFE_API_KEY=... node selfcheck.mjs
const apiKey = process.env.TYPESAFE_API_KEY;
if (!apiKey) {
  console.error("Usage: TYPESAFE_API_KEY=<key> node selfcheck.mjs");
  process.exit(1);
}

await import("./jev.js");
const { buildJevRequest, JEV_URL, WORTH_THRESHOLD, CATEGORY_LABELS } = globalThis;

const res = await fetch(JEV_URL, {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify(buildJevRequest({ title: "GPT-5 explained in 10 minutes", channel: "AI Explained", duration: "10:02" }))
});
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, await res.text());
  process.exit(1);
}
const { answers } = await res.json();
const prob = answers?.worth_watching?.noul;
const choice = answers?.category?.choice;
const ok = typeof prob === "number" && prob >= 0 && prob <= 1 && choice in CATEGORY_LABELS;
console.log({ prob, worth: prob >= WORTH_THRESHOLD, choice, label: CATEGORY_LABELS[choice] });
if (!ok) {
  console.error("Self-check FAILED: unexpected answers", JSON.stringify(answers, null, 2));
  process.exit(1);
}
console.log("Self-check OK");
