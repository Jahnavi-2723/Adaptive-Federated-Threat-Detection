let lastPrediction = null;

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