const CARD_SELECTOR = "ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer";
let warnedNoKey = false;

function hashId(s) {
  // ponytail: 32-bit string hash as fallback id when no v= param; collisions are harmless (only affects cache)
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return "t" + (h >>> 0).toString(36);
}

function processCard(card) {
  const titleEl = card.querySelector("#video-title");
  const title = titleEl?.textContent.trim();
  if (!title) return;
  card.dataset.ytWorthIt = "1";

  const href = (titleEl.closest("a") || card.querySelector("a#thumbnail") || card.querySelector("a[href*='v=']"))?.href || "";
  const videoId = new URL(href, location.origin).searchParams.get("v") || hashId(title);
  const channel = card.querySelector("ytd-channel-name, #channel-name")?.textContent.trim().split("\n")[0] || "";
  const duration = card.querySelector("ytd-thumbnail-overlay-time-status-renderer")?.textContent.trim() || "";

  chrome.runtime.sendMessage({ type: "classify", videoId, title, channel, duration }, (res) => {
    if (chrome.runtime.lastError || !res) return;
    if (res.error) {
      if (res.error === "no_key" && !warnedNoKey) {
        warnedNoKey = true;
        console.warn("[YT Worth It] No TypeSafe API key configured. Open the extension options to add one.");
      }
      return;
    }
    if (titleEl.parentElement.querySelector(".ytwi")) return;
    const wrap = document.createElement("span");
    wrap.className = "ytwi";
    wrap.innerHTML =
      `<span class="ytwi-badge ${res.worth ? "ytwi-worth" : "ytwi-skip"}" title="${Math.round(res.prob * 100)}% worth it">${res.worth ? "WORTH IT" : "SKIP"}</span>` +
      `<span class="ytwi-cat">${res.category}</span>`;
    titleEl.insertAdjacentElement("afterend", wrap);
  });
}

function scan() {
  document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    if (!card.dataset.ytWorthIt) processCard(card);
  });
}

let timer;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(scan, 500);
}).observe(document.body, { childList: true, subtree: true });
scan();
