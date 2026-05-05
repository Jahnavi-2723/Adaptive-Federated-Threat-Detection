const API = "https://threat-detection-api-ir2t.onrender.com/predict";

async function getDomain() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new URL(tab.url).hostname;
}

async function scan() {

  const domain = await getDomain();
  document.getElementById("domain").innerText = domain;

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ domain })
    });

    const data = await res.json();

    const label = data.label;
    const risk = Number(data.risk_score || 0);
    const insight = data.llm_explanation || data.summary;

    // Badge
    const badge = document.getElementById("badge");
    badge.innerText = label;

    badge.className = "badge " +
      (label === "SAFE" ? "safe" :
       label === "SUSPICIOUS" ? "suspicious" : "malicious");

    // Score
    document.getElementById("score").innerHTML =
      `Risk Score: <b>${risk.toFixed(2)}%</b>`;

    // Insight
    document.getElementById("insight").innerText = insight;

  } catch (err) {
    document.getElementById("insight").innerText = "Error connecting to API";
  }
}

scan();