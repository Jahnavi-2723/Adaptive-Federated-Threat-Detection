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

async function loadMetrics() {
  try {
    const res = await fetch("/metrics");
    const data = await res.json();

    document.getElementById("m-acc").innerText =
      (data.accuracy * 100).toFixed(2) + "%";

    document.getElementById("m-prec").innerText =
      (data.precision * 100).toFixed(2) + "%";

    document.getElementById("m-rec").innerText =
      (data.recall * 100).toFixed(2) + "%";

    document.getElementById("m-f1").innerText =
      (data.f1 * 100).toFixed(2) + "%";

    document.getElementById("m-roc").innerText =
      (data.roc_auc * 100).toFixed(2) + "%";

  } catch (err) {
    console.error("Metrics load failed:", err);
  }
}

async function loadAnalytics() {
  try {
    const res = await fetch("/analytics");
    const data = await res.json();

    // 📈 Accuracy Chart
    new Chart(document.getElementById("accChart"), {
      type: "line",
      data: {
        labels: data.epochs,
        datasets: [
          { label: "Train Accuracy", data: data.train_acc },
          { label: "Validation Accuracy", data: data.val_acc }
        ]
      }
    });

    // 📉 Loss Chart
    new Chart(document.getElementById("lossChart"), {
      type: "line",
      data: {
        labels: data.epochs,
        datasets: [
          { label: "Train Loss", data: data.train_loss },
          { label: "Validation Loss", data: data.val_loss }
        ]
      }
    });

    // 📊 Confusion Matrix
    new Chart(document.getElementById("cmChart"), {
      type: "bar",
      data: {
        labels: ["TN", "FP", "FN", "TP"],
        datasets: [{
          label: "Confusion Matrix",
          data: [
            data.confusion_matrix.tn,
            data.confusion_matrix.fp,
            data.confusion_matrix.fn,
            data.confusion_matrix.tp
          ]
        }]
      }
    });

    // 📊 Model Comparison
    new Chart(document.getElementById("cmpChart"), {
      type: "bar",
      data: {
        labels: data.comparison.models,
        datasets: [{
          label: "Accuracy (%)",
          data: data.comparison.accuracy
        }]
      }
    });

  } catch (err) {
    console.error("Analytics load failed:", err);
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

document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();
  loadAnalytics();
});