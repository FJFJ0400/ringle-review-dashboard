export async function loadMockData() {
  const response = await fetch("../data/mock-data.json").catch(() => null);
  if (!response || !response.ok) {
    return null;
  }
  return response.json();
}

export async function fetchVoiceData() {
  const mockData = await loadMockData();
  if (mockData) {
    return mockData;
  }

  return {
    metrics: {
      total: 0,
      totalDelta: "0%",
      positiveRate: "0%",
      positiveDelta: "0%",
      negativeCount: 0,
      negativeDelta: "0%",
      topKeyword: "-",
      keywordDelta: "0%"
    },
    trends: [],
    sentiment: {
      positive: 0,
      neutral: 0,
      negative: 0
    },
    keywords: [],
    reviews: []
  };
}
