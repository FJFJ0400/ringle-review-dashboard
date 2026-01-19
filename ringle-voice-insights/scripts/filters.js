import { normalizeText } from "./utils.js";

export function applyFilters(reviews, filters) {
  return reviews.filter((review) => {
    const matchesChannel = filters.channel ? review.channel === filters.channel : true;
    const matchesSentiment = filters.sentiment ? review.sentiment === filters.sentiment : true;
    const matchesQuery = filters.query
      ? normalizeText(review.text).includes(normalizeText(filters.query))
      : true;
    return matchesChannel && matchesSentiment && matchesQuery;
  });
}
