/*let lastPrediction = null;

async function predict() {
  const domain = document.getElementById("domain").value;
  if (!domain) return alert("Enter domain");

  const res = await fetch("/predict", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({domain})
  });

  const data = await res.json();
  lastPrediction = data;

  document.getElementById("result").innerHTML =
    `<h3>${data.summary}</h3>
     <p>${data.label} | ${(data.malicious_score*100).toFixed(2)}%</p>`;

  loadHistory();
}

function inspectDomain(){

  const data = window.lastPrediction;
  if(!data){
    alert("⚠️ Please scan a domain first");
    return;
  }

  const panel = document.getElementById("inspectPanel");
  panel.style.display = "flex";

  const score = data.malicious_score * 100;
  const label = data.label;
  const summary = data.summary;

  // 🎯 Gauge
  Plotly.newPlot("miniGauge", [{
    type: "indicator",
    mode: "gauge+number",
    value: score,
    title: { text: "Risk Score" },

    gauge: {
      axis: { range: [0, 100] },

      steps: [
        { range: [0, 40], color: "#16a34a" },
        { range: [40, 70], color: "#f59e0b" },
        { range: [70, 100], color: "#ef4444" }
      ]
    }

  }], {
    paper_bgcolor: "transparent",
    font: { color: "#e2e8f0" }
  });

  // 🎯 Badge Color Logic
  const badge = document.getElementById("miniBadge");
  badge.innerText = label;

  if(label === "SAFE"){
    badge.style.background = "#16a34a";
  }
  else if(label === "SUSPICIOUS"){
    badge.style.background = "#f59e0b";
  }
  else{
    badge.style.background = "#ef4444";
  }

  // 🎯 Summary
  document.getElementById("miniSummary").innerText = summary;
}

function goFullAnalysis(){
  const domain = document.getElementById("domain").value;
  window.location = "/explain?domain=" + domain;
}
  */

let lastPrediction = null;

// ================= PREDICT =================
async function predict() {
  const domainInput = document.getElementById("domain");
  const domain = domainInput ? domainInput.value.trim() : "";

  if (!domain) {
    alert("Enter domain");
    return;
  }

  const resultDiv = document.getElementById("result");

  // 🔄 Loading state
  if (resultDiv) {
    resultDiv.innerHTML = `<p style="color:#94a3b8;">Analyzing...</p>`;
  }

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ domain })
    });

    if (!res.ok) {
      throw new Error("API failed");
    }

    const data = await res.json();
    console.log("API RESPONSE:", data);

    lastPrediction = data;

    // ✅ Safe parsing (NO NaN EVER)
    const riskScore = isNaN(Number(data.risk_score)) ? 0 : Number(data.risk_score);
    const mlScore = isNaN(Number(data.ml_score)) ? 0 : Number(data.ml_score);
    const label = data.label || "UNKNOWN";
    const summary = data.summary || "No insights available";

    // 🎯 UI Update
    if (resultDiv) {
      resultDiv.innerHTML = `
        <h3>${summary}</h3>
        <p>
          <strong>${label}</strong> |
          Risk: ${riskScore.toFixed(2)}% |
          ML: ${mlScore.toFixed(2)}%
        </p>
      `;
    }

    loadHistory();

  } catch (err) {
    console.error("Prediction error:", err);

    if (resultDiv) {
      resultDiv.innerHTML = `<p style="color:red;">Prediction failed</p>`;
    }

    alert("Server error. Try again.");
  }
}

// ================= INSPECT PANEL =================
function inspectDomain() {
  const data = lastPrediction;

  if (!data) {
    alert("⚠️ Please scan a domain first");
    return;
  }

  const panel = document.getElementById("inspectPanel");
  if (panel) panel.style.display = "flex";

  const score = isNaN(Number(data.risk_score)) ? 0 : Number(data.risk_score);
  const label = data.label || "UNKNOWN";
  const summary = data.summary || "No insights available";

  // 🎯 Safe Plotly rendering
  if (typeof Plotly !== "undefined") {
    Plotly.newPlot("miniGauge", [{
      type: "indicator",
      mode: "gauge+number",
      value: score,
      title: { text: "Risk Score" },

      gauge: {
        axis: { range: [0, 100] },
        steps: [
          { range: [0, 40], color: "#16a34a" },
          { range: [40, 70], color: "#f59e0b" },
          { range: [70, 100], color: "#ef4444" }
        ]
      }

    }], {
      paper_bgcolor: "transparent",
      font: { color: "#e2e8f0" }
    });
  }

  // 🎯 Badge
  const badge = document.getElementById("miniBadge");
  if (badge) {
    badge.innerText = label;

    if (label === "SAFE") {
      badge.style.background = "#16a34a";
    } else if (label === "SUSPICIOUS") {
      badge.style.background = "#f59e0b";
    } else {
      badge.style.background = "#ef4444";
    }
  }

  // 🎯 Summary
  const summaryEl = document.getElementById("miniSummary");
  if (summaryEl) {
    summaryEl.innerText = summary;
  }
}

// ================= NAVIGATION =================
function goFullAnalysis() {
  const domainInput = document.getElementById("domain");
  const domain = domainInput ? domainInput.value.trim() : "";

  if (!domain) {
    alert("Enter a domain first");
    return;
  }

  window.location = "/explain?domain=" + encodeURIComponent(domain);
}