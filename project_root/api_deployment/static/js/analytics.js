// ================= SCAN =================
async function predict() {
  const domain = document.getElementById('domain').value.trim();
  if (!domain) return alert("Enter a domain name!");

  document.getElementById('result').innerHTML = `
    <div style="text-align:center; padding:20px;">
      <div class="spinner-border text-info" style="width:3rem;height:3rem;"></div>
      <p style="margin-top:10px;color:#aaa;">Analyzing domain risk...</p>
    </div>
  `;

  const res = await fetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain })
  });

  const data = await res.json();
  window.lastPrediction = data;

  //const score = (data.malicious_score * 100).toFixed(2);
  const score = Number(data.risk_score ?? 0);

  document.getElementById('result').innerHTML = `
    <div class="result-card">

      <h4>${data.summary}</h4>

      <p class="fw-bold">${data.label}</p>

      <p>Score: ${score}%</p>

      <!-- LLM NOTE -->
      <div class="llm-note">
        <strong>Insight:</strong><br>
        ${data.llm_explanation
          ? data.llm_explanation.split('.').slice(0,2).join('.') + '.'
          : "No insights available"}
      </div>

      <!-- PROGRESS BAR -->
      <div style="margin-top:12px;">
        <div style="height:8px;background:#1f2937;border-radius:10px;">
          <div style="
            width:${score}%;
            height:100%;
            border-radius:10px;
            background:${score > 70 ? '#ef4444' : score > 40 ? '#f59e0b' : '#16a34a'};
          "></div>
        </div>
        <small style="color:#aaa;">Confidence Level</small>
      </div>

    </div>
  `;

  addHistory(domain, data.label, score);
}

// ================= INSPECT =================
async function inspectDomain() {
  let data = window.lastPrediction;
  const domain = document.getElementById("domain").value.trim();

  if (!data && domain) {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });
    data = await res.json();
  }

  if (!data) return alert("Scan a domain first");

  document.getElementById("inspectPanel").style.display = "block";

  // 🔥 IMPROVED GAUGE
  Plotly.newPlot("miniGauge", [{
    type: "indicator",
    mode: "gauge+number",
    value: Number(data.risk_score ?? 0),

    number: {
      font: { size: 32 }   // bigger number
    },

    title: {
      text: "Risk Score",
      font: { size: 18 }
    },

    gauge: {
      axis: {
        range: [0, 100],
        tickcolor: "#ccc"
      },

      bar: {
        color: "#4ad9e4",   // glowing needle
        thickness: 0.25
      },

      steps: [
        { range: [0, 40], color: "#16a34a" },
        { range: [40, 70], color: "#f59e0b" },
        { range: [70, 100], color: "#ef4444" }
      ],

      threshold: {
        line: { color: "#ffffff", width: 4 },
        thickness: 0.75,
        value: Number(data.risk_score ?? 0)
      }
    }
  }], {
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e2e8f0" },

    height: 260,   // ✅ PERFECT SIZE (between medium & large)
    margin: { t: 40, b: 20 }
  });

  // Badge
  const badge = document.getElementById("miniBadge");
  badge.innerText = data.label;

  if (data.label === "SAFE") badge.style.background = "#16a34a";
  else if (data.label === "SUSPICIOUS") badge.style.background = "#f59e0b";
  else badge.style.background = "#ef4444";

  document.getElementById("miniSummary").innerText = data.summary;

  document.getElementById("inspectPanel").scrollIntoView({ behavior: "smooth" });
}

// ================= HISTORY =================
function addHistory(domain, label, score) {
  let history = JSON.parse(localStorage.getItem("scanHistory") || "[]");

  history.unshift({
    domain,
    label,
    score,
    time: new Date().toLocaleString()
  });

  history = history.slice(0, 10);
  localStorage.setItem("scanHistory", JSON.stringify(history));

  renderHistory();
}

function renderHistory() {
  let history = JSON.parse(localStorage.getItem("scanHistory") || "[]");

  const tbody = document.getElementById("historyBody");
  if (!tbody) return;

  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No history</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  history.forEach(h => {
    tbody.innerHTML += `
      <tr>
        <td>${h.time}</td>
        <td>${h.domain}</td>
        <td>${h.score}%</td>
        <td><span class="badge">${h.label}</span></td>
        <td>
          <button class="btn btn-sm btn-info"
            onclick="window.location='/explain?domain=${h.domain}'">
            Inspect
          </button>
        </td>
      </tr>
    `;
  });
}

// ================= DASHBOARD =================
async function loadAnalytics() {
  try {
    const res = await fetch("/analytics");
    const a = await res.json();

    // Accuracy
    new Chart(document.getElementById("accChart"), {
      type: "line",
      data: {
        labels: a.epochs,
        datasets: [
          {
            label: "Train Acc",
            data: a.train_acc.map(x => x * 100),
            borderColor: "#fbbf24"
          },
          {
            label: "Val Acc",
            data: a.val_acc.map(x => x * 100),
            borderColor: "#38bdf8"
          }
        ]
      }
    });

    // Loss
    new Chart(document.getElementById("lossChart"), {
      type: "line",
      data: {
        labels: a.epochs,
        datasets: [
          {
            label: "Train Loss",
            data: a.train_loss,
            borderColor: "#f97316"
          },
          {
            label: "Val Loss",
            data: a.val_loss,
            borderColor: "#facc15"
          }
        ]
      }
    });

    // Confusion Matrix
    new Chart(document.getElementById("cmChart"), {
      type: "bar",
      data: {
        labels: ["TN", "FP", "FN", "TP"],
        datasets: [{
          data: [
            a.confusion_matrix.tn,
            a.confusion_matrix.fp,
            a.confusion_matrix.fn,
            a.confusion_matrix.tp
          ],
          backgroundColor: ["#38bdf8", "#f97316", "#f97316", "#22c55e"]
        }]
      }
    });

    // Model Comparison
    new Chart(document.getElementById("cmpChart"), {
      type: "bar",
      data: {
        labels: a.comparison.models,
        datasets: [{
          data: a.comparison.accuracy,
          backgroundColor: ["#9ca3af", "#38bdf8", "#0ea5e9", "#15803d"]
        }]
      }
    });

  } catch (e) {
    console.error("Analytics error:", e);
  }
}

async function loadMetrics() {
  try {
    const res = await fetch("/metrics");
    const m = await res.json();

    const format = (v) =>
      (typeof v === "number" && isFinite(v))
        ? (v * 100).toFixed(2) + "%"
        : "--";

    document.getElementById("m-acc").innerText = format(m.accuracy);
    document.getElementById("m-prec").innerText = format(m.precision);
    document.getElementById("m-rec").innerText = format(m.recall);
    document.getElementById("m-f1").innerText = format(m.f1);
    document.getElementById("m-roc").innerText = format(m.roc_auc);

  } catch (e) {
    console.error("Metrics error:", e);
  }
}

// ================= INIT =================
window.onload = () => {
  renderHistory();
  loadAnalytics();
  loadMetrics();
};