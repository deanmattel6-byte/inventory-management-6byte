import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { computeRecommendation, formatMoney, useInventory } from "@/lib/inventory";
import { UrgencyBadge } from "@/components/badges";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/restock")({
  head: () => ({
    meta: [
      { title: "AI Restock Engine — Foundry OS" },
      {
        name: "description",
        content:
          "Algorithmic replenishment: 30-day burn rates, supplier lead-time demand, dynamic safety stock and one-click purchase orders.",
      },
      { property: "og:title", content: "AI Restock Engine — Foundry OS" },
      {
        property: "og:description",
        content:
          "Algorithmic replenishment: 30-day burn rates, supplier lead-time demand, dynamic safety stock and one-click purchase orders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RestockPage,
});

function RestockPage() {
  const { products, movements, recordMovement } = useInventory();
  const [ordered, setOrdered] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const recs = useMemo(
    () =>
      products
        .map((p) => computeRecommendation(p, movements))
        .sort((a, b) => {
          const rank = { CRITICAL: 0, WARNING: 1, OPTIMAL: 2 } as const;
          return rank[a.urgency] - rank[b.urgency] || a.daysOfStock - b.daysOfStock;
        }),
    [products, movements],
  );

  const actionable = recs.filter((r) => r.urgency !== "OPTIMAL" && !ordered.includes(r.product.id));
  const totalSpend = actionable.reduce((s, r) => s + r.estimatedCost, 0);
  const supplierCount = new Set(actionable.map((r) => r.supplier.id)).size;
  const counts = {
    critical: recs.filter((r) => r.urgency === "CRITICAL").length,
    warning: recs.filter((r) => r.urgency === "WARNING").length,
    optimal: recs.filter((r) => r.urgency === "OPTIMAL").length,
  };

  const generatePo = () => {
    let n = 0;
    for (const r of actionable) {
      if (r.reorderQty > 0) {
        recordMovement(r.product.id, "RESTOCK", r.reorderQty, `AI purchase order · ${r.supplier.name}`);
        n++;
      }
    }
    setOrdered(actionable.map((r) => r.product.id));
    setFlash(`Purchase order generated: ${n} line items across ${supplierCount} suppliers (${formatMoney(totalSpend)}). Stock updated in the ledger.`);
    setTimeout(() => setFlash(null), 6000);
  };

  return (
    <main className="px-6 py-5 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            AI Restock Engine
          </h1>
          <p className="mt-1 text-sm text-slate">
            ROP = burn rate × lead time + safety stock · 35-day target supply
          </p>
        </div>
        <button onClick={generatePo} disabled={actionable.length === 0} className="btn-primary">
          Generate Purchase Order
        </button>
      </header>

      {flash && (
        <div className="rise mt-4 flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">
          <CheckCircle2 className="size-4 shrink-0" />
          {flash}
        </div>
      )}

      {/* Summary */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Critical", value: counts.critical, tone: "text-rose", sub: "stockout < 3 days" },
          { label: "Warning", value: counts.warning, tone: "text-amber", sub: "at reorder point" },
          { label: "Optimal", value: counts.optimal, tone: "text-teal", sub: "no action needed" },
          { label: "Est. PO Spend", value: formatMoney(totalSpend), tone: "text-foreground", sub: `${supplierCount} suppliers` },
        ].map((k, i) => (
          <div key={k.label} className="panel rise p-4" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-slate/70">{k.label}</p>
            <p className={`mt-2 font-display text-[28px] font-semibold leading-none ${k.tone}`}>{k.value}</p>
            <p className="mt-2 font-mono text-xs text-slate/70">{k.sub}</p>
          </div>
        ))}
      </section>

      {/* Recommendation table */}
      <section className="panel rise mt-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-slate/60">
                <th className="px-5 py-2.5 text-left font-medium">SKU</th>
                <th className="px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium">Burn /day</th>
                <th className="px-3 py-2.5 text-right font-medium">Lead</th>
                <th className="px-3 py-2.5 text-right font-medium">ROP</th>
                <th className="px-3 py-2.5 text-right font-medium">On hand</th>
                <th className="px-3 py-2.5 text-right font-medium">Days left</th>
                <th className="px-3 py-2.5 text-right font-medium">Order qty</th>
                <th className="px-3 py-2.5 text-right font-medium">Est. cost</th>
                <th className="px-5 py-2.5 text-right font-medium">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recs.map((r) => (
                <tr key={r.product.id} className="transition-colors hover:bg-glass">
                  <td className="px-5 py-3 font-mono text-[13px] text-cyan">{r.product.sku}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{r.product.name}</td>
                  <td className="px-3 py-3 text-slate">{r.supplier.name}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate">{r.burnRate.toFixed(1)}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate">{r.supplier.leadTimeDays}d</td>
                  <td className="px-3 py-3 text-right font-mono text-slate">{Math.ceil(r.reorderPoint)}</td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">{r.product.currentStock}</td>
                  <td
                    className={`px-3 py-3 text-right font-mono ${
                      r.daysOfStock < 3 ? "text-rose" : r.daysOfStock < 10 ? "text-amber" : "text-slate"
                    }`}
                  >
                    {r.daysOfStock === Infinity ? "—" : r.daysOfStock.toFixed(1)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-medium text-foreground">
                    {r.urgency === "OPTIMAL" ? "—" : r.reorderQty}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate">
                    {r.urgency === "OPTIMAL" ? "—" : formatMoney(r.estimatedCost)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <UrgencyBadge urgency={r.urgency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-4 pb-6 font-mono text-[11px] text-slate/60">
        Algorithm: B_d over rolling 30-day SALE movements · LTD = B_d × supplier lead time · SS = B_d × 3 buffer
        days · ROP = LTD + SS · ROQ = 35-day supply − on hand.
      </p>
    </main>
  );
}
