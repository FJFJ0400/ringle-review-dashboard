import { formatNumber } from "./utils.js";

let trendChart;
let sentimentChart;

export function renderTrendChart(canvas, labels, values) {
  if (!canvas || typeof Chart === "undefined") return;
  if (trendChart) trendChart.destroy();

  trendChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "언급량",
          data: values,
          borderColor: "#ff7b2f",
          backgroundColor: "rgba(255, 123, 47, 0.2)",
          tension: 0.35,
          fill: true,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${formatNumber(context.parsed.y)}건`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${value}`
          }
        }
      }
    }
  });
}

export function renderSentimentChart(canvas, sentiment) {
  if (!canvas || typeof Chart === "undefined") return;
  if (sentimentChart) sentimentChart.destroy();

  sentimentChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["긍정", "중립", "부정"],
      datasets: [
        {
          data: [sentiment.positive, sentiment.neutral, sentiment.negative],
          backgroundColor: ["#148f5c", "#ff7b2f", "#c2412c"],
          borderWidth: 0
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}
