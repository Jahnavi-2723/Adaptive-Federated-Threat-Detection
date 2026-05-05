chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "SHOW_WARNING") {

    const banner = document.createElement("div");
    banner.className = "threat-banner suspicious";

    banner.innerHTML = `
      ⚠️ Suspicious site detected: ${msg.domain}
      <br>Risk Score: ${msg.score.toFixed(2)}%
    `;

    document.body.prepend(banner);
  }
});