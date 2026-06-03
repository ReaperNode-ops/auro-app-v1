export function getDailyUsage() {
  const today = new Date().toDateString();

  const stored = JSON.parse(
    localStorage.getItem("auro_usage") || "{}"
  );

  if (stored.date !== today) {
    return 0;
  }

  return stored.count || 0;
}

export function incrementDailyUsage() {
  const today = new Date().toDateString();

  const stored = JSON.parse(
    localStorage.getItem("auro_usage") || "{}"
  );

  const updated = {
    date: today,
    count:
      (stored.date === today
        ? stored.count || 0
        : 0) + 1
  };

  localStorage.setItem(
    "auro_usage",
    JSON.stringify(updated)
  );
}
