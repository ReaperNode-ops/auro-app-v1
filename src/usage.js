export function getDailyUsage() {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem("auro_usage") || "{}");

  if (data.date !== today) {
    return 0;
  }

  return data.count || 0;
}

export function incrementDailyUsage() {
  const today = new Date().toDateString();
  const data = JSON.parse(localStorage.getItem("auro_usage") || "{}");

  const updated = {
    date: today,
    count: (data.date === today ? data.count : 0) + 1
  };

  localStorage.setItem("auro_usage", JSON.stringify(updated));
}
