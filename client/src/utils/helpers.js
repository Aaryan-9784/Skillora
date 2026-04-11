export const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
};

export const formatCurrency = (amount, currency = "USD") => {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
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
