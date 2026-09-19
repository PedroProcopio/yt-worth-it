const keyInput = document.getElementById("key");
const status = document.getElementById("status");

function say(msg) {
  status.textContent = msg;
  setTimeout(() => (status.textContent = ""), 2000);
}

chrome.storage.local.get("typesafeApiKey", ({ typesafeApiKey }) => {
  if (typesafeApiKey) keyInput.value = typesafeApiKey;
});

document.getElementById("save").onclick = async () => {
  await chrome.storage.local.set({ typesafeApiKey: keyInput.value.trim() });
  say("Saved");
};

document.getElementById("clear").onclick = async () => {
  const all = await chrome.storage.local.get(null);
  await chrome.storage.local.remove(Object.keys(all).filter((k) => k.startsWith("cache:")));
  say("Cache cleared");
};
