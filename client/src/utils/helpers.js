export const formatDate = (date) => {
  if (!date) return "—";
  try {
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      const localDate = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(localDate);
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  } catch {
    return "—";
  }
};

export const formatCurrency = (amount, currency = "INR") => {
  if (!amount && amount !== 0) return "—";
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
};

export const getInitials = (name = "") =>
  name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export const truncate = (str, n = 60) =>
  str?.length > n ? str.slice(0, n) + "…" : str;

export const classNames = (...classes) => classes.filter(Boolean).join(" ");

export const relativeTime = (date) => {
  if (!date) return "";
  const now = new Date();
  const past = new Date(date);
  const diffInSecs = Math.floor((now - past) / 1000);

  if (diffInSecs < 60) return "just now";
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return formatDate(date);
};

export const formatMessageTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return timeStr;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) return `Yesterday ${timeStr}`;

  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${datePart}, ${timeStr}`;
};
