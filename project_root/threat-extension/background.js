const API_URL = "https://your-render-url.onrender.com/predict";

// Trigger on navigation
chrome.webNavigation.onCommitted.addListener(async (details) => {

  // Only main page (ignore iframe)
  if (details.frameId !== 0) return;

  const url = new URL(details.url);
  const domain = url.hostname;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ domain })
    });

    const data = await res.json();
    console.log("SCAN:", domain, data);

    // ================= ACTION LOGIC =================

    if (data.label === "MALICIOUS") {

      // 🚫 BLOCK + REDIRECT
      chrome.tabs.update(details.tabId, {
        url: `chrome-extension://${chrome.runtime.id}/blocked.html?domain=${domain}`
      });

    }

    else if (data.label === "SUSPICIOUS") {

      // ⚠️ Show alert via content script
      chrome.tabs.sendMessage(details.tabId, {
        action: "SHOW_WARNING",
        domain: domain,
        score: data.risk_score
      });

    }

    // SAFE → do nothing

  } catch (err) {
    console.error("Scan failed:", err);
  }

});