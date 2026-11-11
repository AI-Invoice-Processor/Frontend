export const cn = (...classes: Array<string | false | undefined>) =>
  classes.filter(Boolean).join(" ");
export const formatCop = (value?: string) =>
  value == null
    ? "No disponible"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(Number(value));
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
