let lastPrediction = null;

// ================= PREDICT =================
async function predict() {
  const domain = document.getElementById("domain").value.trim();
  if (!domain) return alert("Enter domain");

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `<p style="color:#94a3b8;">Analyzing...</p>`;

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ domain })
    });

    const data = await res.json();
    lastPrediction = data;

    const risk = Number(data.risk_score ?? 0);
    const ml = Number(data.ml_score ?? 0);

    resultDiv.innerHTML = `
      <h3>${data.summary}</h3>
      <p>
        <strong>${data.label}</strong> |
        Risk: ${risk.toFixed(2)}% |
        ML: ${ml.toFixed(2)}%
      </p>
    `;

  } catch (e) {
    console.error(e);
    resultDiv.innerHTML = `<p style="color:red;">Error</p>`;
  }
}

// ================= INSPECT =================
function inspectDomain() {
  const data = lastPrediction;
  if (!data) return alert("Scan first");

  document.getElementById("inspectPanel").style.display = "flex";

  const score = Number(data.risk_score ?? 0);

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
  }]);

  document.getElementById("miniBadge").innerText = data.label;
  document.getElementById("miniSummary").innerText = data.summary;
}