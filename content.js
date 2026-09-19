// Two YouTube DOMs coexist (2026): legacy Polymer renderers (#video-title) and
// the newer yt-lockup-view-model (h3 > a). Handle both.
const CARD_SELECTOR =
  "yt-lockup-view-model, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer";
let warnedNoKey = false;

function hashId(s) {
  // ponytail: 32-bit string hash as fallback id when no v= param; collisions are harmless (only affects cache)
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return "t" + (h >>> 0).toString(36);
}

function extract(card) {
  const legacy = card.querySelector("#video-title");
  if (legacy) {
    return {
      titleEl: legacy,
      title: legacy.textContent.trim(),
      href: (legacy.closest("a") || card.querySelector("a#thumbnail") || card.querySelector("a[href*='v=']"))?.href || "",
      channel: card.querySelector("ytd-channel-name, #channel-name")?.textContent.trim().split("\n")[0] || "",
      duration: card.querySelector("ytd-thumbnail-overlay-time-status-renderer")?.textContent.trim() || ""
    };
  }
  const h3 = card.querySelector("h3");
  const link = h3?.querySelector("a[href*='watch?v=']");
  if (!h3 || !link) return null;
  return {
    titleEl: h3,
    title: (h3.getAttribute("title") || link.textContent).trim(),
    href: link.href,
    channel: card.querySelector(".ytContentMetadataViewModelMetadataText")?.firstChild?.textContent.trim() || "",
    duration: card.querySelector(".ytBadgeShapeText")?.textContent.trim() || ""
  };
}

function processCard(card) {
  // A rich-item wrapper that contains a lockup is handled by the lockup itself.
  if (card.tagName !== "YT-LOCKUP-VIEW-MODEL" && card.querySelector("yt-lockup-view-model")) {
    card.dataset.ytWorthIt = "1";
    return;
  }
  const v = extract(card);
  if (!v || !v.title) return;
  card.dataset.ytWorthIt = "1";
  const videoId = new URL(v.href, location.origin).searchParams.get("v") || hashId(v.title);

  chrome.runtime.sendMessage(
    { type: "classify", videoId, title: v.title, channel: v.channel, duration: v.duration },
    (res) => {
      if (chrome.runtime.lastError || !res) return;
      if (res.error) {
        if (res.error === "no_key" && !warnedNoKey) {
          warnedNoKey = true;
          console.warn("[YT Worth It] No TypeSafe API key configured. Open the extension options to add one.");
        } else if (res.error !== "no_key") {
          console.warn("[YT Worth It] classify failed:", res.error, v.title);
        }
        return;
      }
      if (v.titleEl.parentElement.querySelector(".ytwi")) return;
      const wrap = document.createElement("span");
      wrap.className = "ytwi";
      wrap.innerHTML =
        `<span class="ytwi-badge ${res.worth ? "ytwi-worth" : "ytwi-skip"}" title="${Math.round(res.prob * 100)}% worth it">${res.worth ? "WORTH IT" : "SKIP"}</span>` +
        `<span class="ytwi-cat">${res.category}</span>`;
      v.titleEl.insertAdjacentElement("afterend", wrap);
    }
  );
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
console.info("[YT Worth It] content script loaded");
scan();
