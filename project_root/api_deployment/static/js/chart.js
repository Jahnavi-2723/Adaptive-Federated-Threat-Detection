document.addEventListener("DOMContentLoaded", async () => {
  const accCtx = document.getElementById("accChart");
  const lossCtx = document.getElementById("lossChart");

  const metrics = await fetch("/metrics").then(r => r.json());

  // Accuracy Chart
  new Chart(accCtx, {
    type: 'line',
    data: {
      labels: ["Round 1", "Round 2", "Round 3"],
      datasets: [{
        label: 'Model Accuracy (%)',
        data: [94, 97, 99],
        borderColor: '#4ad9e4',
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: true } }
    }
  });

  // F1/Precision/Recall Chart
  new Chart(lossCtx, {
    type: 'bar',
    data: {
      labels: ['Accuracy', 'Precision', 'Recall', 'F1'],
      datasets: [{
        label: 'Metric Value',
        data: [
          metrics.accuracy * 100,
          metrics.precision * 100,
          metrics.recall * 100,
          metrics.f1 * 100
        ],
        backgroundColor: ['#4ad9e4', '#a2e34b', '#f4b942', '#d94a4a']
      }]
    },
    options: {
      scales: { y: { beginAtZero: true, max: 100 } },
      plugins: { legend: { display: false } }
    }
  });
});
