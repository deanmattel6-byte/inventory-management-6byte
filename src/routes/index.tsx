import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  categories,
  categoryById,
  computeRecommendation,
  formatMoney,
  REF_NOW,
  salesLast30Days,
  stockStatus,
  useInventory,
} from "@/lib/inventory";
import { StatusBadge, UrgencyBadge } from "@/components/badges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Dashboard — Foundry OS" },
      {
        name: "description",
        content:
          "Real-time stock intelligence: inventory value, SKU counts, low-stock alerts, turnover, category mix and AI reorder queue.",
      },
      { property: "og:title", content: "Operations Dashboard — Foundry OS" },
      {
        property: "og:description",
        content:
          "Real-time stock intelligence: inventory value, SKU counts, low-stock alerts, turnover, category mix and AI reorder queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const categoryColor: Record<string, string> = {
  teal: "#2dd4bf",
  cyan: "#38bdf8",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

function DashboardPage() {
  const { products, movements, supplierList, recordMovement } = useInventory();

  const stats = useMemo(() => {
    const totalValue = products.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
    const retailValue = products.reduce((s, p) => s + p.sellingPrice * p.currentStock, 0);
    const lowCount = products.filter((p) => stockStatus(p) !== "ok").length;
    const sales30 = movements
      .filter((m) => m.type === "SALE")
      .reduce((s, m) => s + Math.abs(m.quantityChange), 0);
    const turnover = totalValue > 0 ? (sales30 * 12) / Math.max(1, products.length) : 0;
    return { totalValue, retailValue, lowCount, sales30, turnover };
  }, [products, movements]);

  const categoryValues = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      map.set(p.categoryId, (map.get(p.categoryId) ?? 0) + p.costPrice * p.currentStock);
    }
    return categories
      .map((c) => ({ category: c, value: map.get(c.id) ?? 0 }))
      .filter((x) => x.value > 0);
  }, [products]);

  const donutGradient = useMemo(() => {
    const total = categoryValues.reduce((s, x) => s + x.value, 0);
    let acc = 0;
    const stops: string[] = [];
    for (const { category, value } of categoryValues) {
      const start = (acc / total) * 100;
      acc += value;
      const end = (acc / total) * 100;
      stops.push(`${categoryColor[category.color]} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
    }
    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryValues]);

  const weekly = useMemo(() => {
    const weeks: { sales: number; restocks: number }[] = Array.from({ length: 8 }, () => ({
      sales: 0,
      restocks: 0,
    }));
    const now = REF_NOW;
    for (const m of movements) {
      const ageDays = (now - new Date(m.createdAt).getTime()) / 86400000;
      if (ageDays > 56) continue;
      const w = Math.min(7, 7 - Math.floor(ageDays / 7));
      const bucket = weeks[w]!;
      if (m.type === "SALE") bucket.sales += Math.abs(m.quantityChange);
      if (m.type === "RESTOCK") bucket.restocks += m.quantityChange;
    }
    const max = Math.max(1, ...weeks.flatMap((w) => [w.sales, w.restocks]));
    return weeks.map((w) => ({
      sales: (w.sales / max) * 100,
      restocks: (w.restocks / max) * 100,
    }));
  }, [movements]);

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => stockStatus(p) !== "ok")
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, 6),
    [products],
  );

  const recommendations = useMemo(
    () =>
      products
        .map((p) => computeRecommendation(p, movements))
        .filter((r) => r.urgency !== "OPTIMAL")
        .sort((a, b) => (a.urgency === "CRITICAL" ? -1 : 1) - (b.urgency === "CRITICAL" ? -1 : 1))
        .slice(0, 5),
    [products, movements],
  );

  const poTotal = recommendations.reduce((s, r) => s + r.estimatedCost, 0);
  const poSuppliers = new Set(recommendations.map((r) => r.supplier.id)).size;

  const velocity = useMemo(() => {
    return products
      .map((p) => ({ p, sold: salesLast30Days(p.id, movements) }))
      .sort((a, b) => b.sold - a.sold);
  }, [products, movements]);
  const topMovers = velocity.slice(0, 5);
  const deadStock = velocity.filter((v) => v.sold <= 2).slice(0, 5);

  return (
    <main className="px-6 py-5 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate">
            Real-time stock intelligence · {products.length} active SKUs · {supplierList.length} suppliers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="btn-ghost">Last 30 days</span>
          <Link to="/restock" className="btn-primary">
            Open reorder queue
          </Link>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Inventory Value", value: formatMoney(stats.totalValue), sub: `${formatMoney(stats.retailValue)} at retail`, tone: "text-teal" },
          { label: "Active SKUs", value: String(products.length), sub: `${categories.length} categories`, tone: "text-slate" },
          { label: "Low-Stock Alerts", value: String(stats.lowCount), sub: "at or below threshold", tone: "text-rose", valueTone: "text-rose" },
          { label: "30-Day Units Sold", value: stats.sales30.toLocaleString(), sub: `${stats.turnover.toFixed(1)}× annualized turnover`, tone: "text-teal" },
        ].map((kpi, i) => (
          <div key={kpi.label} className="panel rise p-4" style={{ animationDelay: `${0.05 + i * 0.05}s` }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate/70">{kpi.label}</p>
            <p className={`mt-2 font-display text-[28px] font-semibold leading-none ${kpi.valueTone ?? "text-foreground"}`}>
              {kpi.value}
            </p>
            <p className={`mt-2 font-mono text-xs ${kpi.tone}`}>{kpi.sub}</p>
          </div>
        ))}
      </section>

      {/* Bento: donut + velocity */}
      <section className="mt-3 grid grid-cols-12 gap-3">
        <div className="panel rise col-span-12 p-5 lg:col-span-5" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-medium text-foreground">Value by Category</h2>
            <span className="font-mono text-[11px] text-slate/70">COST BASIS</span>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative shrink-0">
              <div
                className="grid size-36 place-items-center overflow-hidden rounded-full"
                style={{ background: donutGradient }}
              >
                <div className="grid size-24 place-items-center rounded-full bg-ink">
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate/60">Total</p>
                    <p className="font-display text-lg font-semibold text-foreground">{formatMoney(stats.totalValue)}</p>
                  </div>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2.5 text-sm">
              {categoryValues.map(({ category, value }) => (
                <li key={category.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: categoryColor[category.color] }}
                    />
                    {category.name}
                  </span>
                  <span className="font-mono text-slate">{formatMoney(value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel rise col-span-12 p-5 lg:col-span-7" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-medium text-foreground">Sales Velocity vs Restocks</h2>
            <div className="flex items-center gap-4 font-mono text-[11px] text-slate/70">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-cyan/60" />
                Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px] bg-teal" />
                Restocks
              </span>
            </div>
          </div>
          <div className="mt-4 flex h-44 items-end gap-2">
            {weekly.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative flex h-full w-full items-end justify-center gap-0.5">
                  <div
                    className="bar-grow w-1/2 rounded-t-sm bg-cyan/60"
                    style={{ height: `${w.sales}%`, animationDelay: `${0.1 + i * 0.05}s` }}
                  />
                  <div
                    className="bar-grow w-1/2 rounded-t-sm bg-teal"
                    style={{ height: `${w.restocks}%`, animationDelay: `${0.15 + i * 0.05}s` }}
                  />
                </div>
                <span className="font-mono text-[9px] text-slate/50">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Low stock table + AI panel */}
      <section className="mt-3 grid grid-cols-12 gap-3">
        <div className="panel rise col-span-12 overflow-hidden lg:col-span-8" style={{ animationDelay: "0.25s" }}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="font-display text-base font-medium text-foreground">Low-Stock Products</h2>
            <Link to="/products" className="font-mono text-[11px] text-slate/70 hover:text-teal">
              View catalog →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-slate/60">
                <th className="px-5 py-2.5 text-left font-medium">SKU</th>
                <th className="px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium">On hand</th>
                <th className="px-3 py-2.5 text-right font-medium">Min</th>
                <th className="px-5 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lowStock.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-glass">
                  <td className="px-5 py-3 font-mono text-[13px] text-cyan">{p.sku}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-3 text-slate">
                    {supplierList.find((s) => s.id === p.supplierId)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-rose">{p.currentStock}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate/60">{p.minThreshold}</td>
                  <td className="px-5 py-3 text-right">
                    <StatusBadge status={stockStatus(p)} />
                  </td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate">
                    All products are above their minimum thresholds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          className="rise col-span-12 rounded-xl border border-teal/20 bg-gradient-to-b from-teal/10 to-glass p-5 backdrop-blur-xl lg:col-span-4"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-teal/20 text-teal ring-1 ring-teal/40">◆</span>
            <h2 className="font-display text-base font-medium text-foreground">AI Restock Queue</h2>
          </div>
          <p className="mt-1 text-xs text-slate">
            {recommendations.length} replenishments predicted from 30-day velocity.
          </p>

          <div className="mt-4 space-y-2.5">
            {recommendations.map((r) => (
              <div key={r.product.id} className="rounded-lg bg-glass p-3 ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan">{r.product.sku}</span>
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  Order {r.reorderQty.toLocaleString()} units · lead {r.supplier.leadTimeDays}d
                </p>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-sm text-slate">No replenishment needed right now.</p>
            )}
          </div>

          <Link to="/restock" className="btn-primary mt-4 w-full">
            Generate Purchase Order
          </Link>
          <p className="mt-2 text-center font-mono text-[10px] text-slate/60">
            Est. spend {formatMoney(poTotal)} · {poSuppliers} supplier{poSuppliers === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      {/* Movers */}
      <section className="mt-3 grid grid-cols-12 gap-3 pb-6">
        <div className="panel rise col-span-12 p-5 lg:col-span-6" style={{ animationDelay: "0.35s" }}>
          <h2 className="font-display text-base font-medium text-foreground">Fastest Moving — 30d</h2>
          <ul className="mt-3 space-y-2">
            {topMovers.map(({ p, sold }) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan">{p.sku}</span>
                  <span className="text-foreground">{p.name}</span>
                </span>
                <span className="font-mono text-teal">{sold} sold</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel rise col-span-12 p-5 lg:col-span-6" style={{ animationDelay: "0.4s" }}>
          <h2 className="font-display text-base font-medium text-foreground">Dead Inventory — 30d</h2>
          <ul className="mt-3 space-y-2">
            {deadStock.map(({ p, sold }) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan">{p.sku}</span>
                  <span className="text-foreground">{p.name}</span>
                </span>
                <span className="font-mono text-rose">{sold} sold · {p.currentStock} on hand</span>
              </li>
            ))}
            {deadStock.length === 0 && <li className="text-sm text-slate">No dead stock detected.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
