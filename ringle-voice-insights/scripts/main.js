import { CONFIG } from "./config.js";
import { fetchVoiceData } from "./data.js";
import { renderTrendChart, renderSentimentChart } from "./charts.js";
import { applyFilters } from "./filters.js";
import { formatNumber, formatPercent, debounce } from "./utils.js";

const state = {
  data: null,
  filters: {
    year: "2025",
    channel: "",
    sentiment: "",
    query: ""
  }
};

const elements = {
  app: document.querySelector(".app"),
  loading: document.querySelector("[data-loading]"),
  metrics: document.querySelectorAll("[data-metric]"),
  keywordList: document.querySelector("[data-section=\"keywords\"]"),
  reviewList: document.querySelector("[data-section=\"reviews\"]"),
  exploreList: document.querySelector("[data-section=\"explore\"]"),
  filterCount: document.querySelector("[data-filter=\"count\"]"),
  trendChart: document.querySelector("#trendChart"),
  sentimentChart: document.querySelector("#sentimentChart")
};

const filterInputs = {
  year: document.querySelector("[data-filter=\"year\"]"),
  channel: document.querySelector("[data-filter=\"channel\"]"),
  sentiment: document.querySelector("[data-filter=\"sentiment\"]"),
  query: document.querySelector("[data-filter=\"query\"]")
};

const themeButtons = document.querySelectorAll("[data-action=\"toggle-theme\"]");
const refreshButtons = document.querySelectorAll("[data-action=\"refresh\"]");
const resetButtons = document.querySelectorAll("[data-action=\"reset-filters\"]");

function setTheme(theme) {
  if (!elements.app) return;
  elements.app.dataset.theme = theme;
  localStorage.setItem(CONFIG.themeStorageKey, theme);
}

function initTheme() {
  const savedTheme = localStorage.getItem(CONFIG.themeStorageKey) || "light";
  setTheme(savedTheme);
}

function showLoading(show) {
  if (!elements.loading) return;
  elements.loading.classList.toggle("active", show);
}

function updateMetrics(metrics) {
  elements.metrics.forEach((node) => {
    const key = node.dataset.metric;
    if (!metrics[key]) return;
    if (key.includes("Rate")) {
      node.textContent = formatPercent(metrics[key]);
      return;
    }
    node.textContent = key.includes("Delta") ? metrics[key] : formatNumber(metrics[key]);
  });
}

function renderKeywords(keywords) {
  if (!elements.keywordList) return;
  elements.keywordList.innerHTML = "";
  keywords.forEach((keyword) => {
    const row = document.createElement("div");
    row.className = "keyword-item";
    row.innerHTML = `<span>${keyword.term}</span><strong>${formatNumber(keyword.count)}건</strong>`;
    elements.keywordList.appendChild(row);
  });
}

function renderReviews(target, reviews, limit = null) {
  if (!target) return;
  target.innerHTML = "";
  const items = limit ? reviews.slice(0, limit) : reviews;
  items.forEach((review) => {
    const card = document.createElement("div");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-meta">
        <span>${review.channel}</span>
        <span>${review.date}</span>
      </div>
      <strong>${review.title}</strong>
      <p>${review.text}</p>
      <span class="status ${review.sentiment}">${review.sentimentLabel}</span>
    `;
    target.appendChild(card);
  });
}

function updateExploreView() {
  if (!state.data) return;
  const filtered = applyFilters(state.data.reviews, state.filters);
  renderReviews(elements.exploreList, filtered);
  if (elements.filterCount) {
    elements.filterCount.textContent = formatNumber(filtered.length);
  }
}

function bindFilters() {
  Object.entries(filterInputs).forEach(([key, input]) => {
    if (!input) return;
    const handler = (event) => {
      state.filters[key] = event.target.value;
      updateExploreView();
    };
    const callback = key === "query" ? debounce(handler, 200) : handler;
    input.addEventListener("input", callback);
    input.addEventListener("change", callback);
  });

  resetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.filters = { year: "2025", channel: "", sentiment: "", query: "" };
      Object.values(filterInputs).forEach((input) => {
        if (input) input.value = "";
      });
      if (filterInputs.year) filterInputs.year.value = "2025";
      updateExploreView();
    });
  });
}

function bindThemeToggle() {
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const current = elements.app?.dataset.theme || "light";
      setTheme(current === "light" ? "dark" : "light");
    });
  });
}

async function loadDashboard() {
  showLoading(true);
  state.data = await fetchVoiceData();
  showLoading(false);

  updateMetrics(state.data.metrics);
  renderKeywords(state.data.keywords);
  renderReviews(elements.reviewList, state.data.reviews, 4);
  renderTrendChart(elements.trendChart, state.data.trends.map((item) => item.date), state.data.trends.map((item) => item.count));
  renderSentimentChart(elements.sentimentChart, state.data.sentiment);
  updateExploreView();
}

function bindRefresh() {
  refreshButtons.forEach((button) => {
    button.addEventListener("click", loadDashboard);
  });
}

initTheme();
bindThemeToggle();
bindFilters();
bindRefresh();
loadDashboard();
