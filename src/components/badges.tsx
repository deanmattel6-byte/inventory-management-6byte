import type { StockStatus, Urgency } from "@/lib/inventory";

const statusConfig: Record<StockStatus, { label: string; dot: string; cls: string }> = {
  out: { label: "Out", dot: "bg-rose", cls: "badge-critical" },
  low: { label: "Low", dot: "bg-amber", cls: "badge-warning" },
  ok: { label: "In Stock", dot: "bg-teal", cls: "badge-optimal" },
};

export function StatusBadge({ status }: { status: StockStatus }) {
  const c = statusConfig[status];
  return (
    <span className={c.cls}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

const urgencyConfig: Record<Urgency, { dot: string; cls: string }> = {
  CRITICAL: { dot: "bg-rose", cls: "badge-critical" },
  WARNING: { dot: "bg-amber", cls: "badge-warning" },
  OPTIMAL: { dot: "bg-teal", cls: "badge-optimal" },
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const c = urgencyConfig[urgency];
  return (
    <span className={c.cls}>
      <span className={`size-1.5 rounded-full ${c.dot}`} />
      {urgency}
    </span>
  );
}
