export function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

export function formatPercent(value) {
  if (typeof value === "string") return value;
  return `${value}%`;
}

export function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
