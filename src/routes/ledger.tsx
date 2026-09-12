import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInventory, type MovementType } from "@/lib/inventory";
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Wrench } from "lucide-react";

export const Route = createFileRoute("/ledger")({
  head: () => ({
    meta: [
      { title: "Stock Movement Ledger — Foundry OS" },
      {
        name: "description",
        content:
          "Immutable audit trail of every restock, sale, return and adjustment with timestamps, deltas and notes.",
      },
      { property: "og:title", content: "Stock Movement Ledger — Foundry OS" },
      {
        property: "og:description",
        content:
          "Immutable audit trail of every restock, sale, return and adjustment with timestamps, deltas and notes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LedgerPage,
});

const typeMeta: Record<MovementType, { icon: typeof ArrowUpRight; cls: string; label: string }> = {
  RESTOCK: { icon: ArrowUpRight, cls: "text-teal bg-teal/15 ring-teal/30", label: "Restock" },
  SALE: { icon: ArrowDownLeft, cls: "text-cyan bg-cyan/15 ring-cyan/30", label: "Sale" },
  RETURN: { icon: RotateCcw, cls: "text-amber bg-amber/15 ring-amber/30", label: "Return" },
  ADJUSTMENT: { icon: Wrench, cls: "text-slate bg-glass-strong ring-line", label: "Adjustment" },
};

function LedgerPage() {
  const { products, movements, recordMovement } = useInventory();
  const [typeFilter, setTypeFilter] = useState<"all" | MovementType>("all");
  const [productFilter, setProductFilter] = useState("all");
  const [form, setForm] = useState({
    productId: products[0]?.id ?? "",
    type: "RESTOCK" as MovementType,
    qty: "",
    notes: "",
  });
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      movements.filter((m) => {
        if (typeFilter !== "all" && m.type !== typeFilter) return false;
        if (productFilter !== "all" && m.productId !== productFilter) return false;
        return true;
      }),
    [movements, typeFilter, productFilter],
  );

  const submit = () => {
    const qty = Number(form.qty);
    if (!form.productId || !qty) return;
    recordMovement(form.productId, form.type, qty, form.notes || typeMeta[form.type].label);
    const product = products.find((p) => p.id === form.productId);
    setFlash(`${typeMeta[form.type].label} recorded for ${product?.sku ?? "product"} (${qty} units)`);
    setForm({ ...form, qty: "", notes: "" });
    setTimeout(() => setFlash(null), 4000);
  };

  return (
    <main className="px-6 py-5 lg:px-8">
      <header>
        <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
          Stock Ledger
        </h1>
        <p className="mt-1 text-sm text-slate">
          {movements.length} movements · atomic stock adjustments with full audit history
        </p>
      </header>

      {/* Record movement */}
      <section className="panel rise mt-5 p-5">
        <h2 className="font-display text-base font-medium text-foreground">Record movement</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <select
            className="input-glass"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
          <select
            className="input-glass"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as MovementType })}
          >
            <option value="RESTOCK">Restock (inbound)</option>
            <option value="SALE">Sale (outbound)</option>
            <option value="RETURN">Return</option>
            <option value="ADJUSTMENT">Adjustment (damage / audit)</option>
          </select>
          <input
            className="input-glass"
            type="number"
            placeholder="Quantity"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
          <input
            className="input-glass"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button onClick={submit} className="btn-primary">
            Commit movement
          </button>
        </div>
        {flash && <p className="mt-3 font-mono text-xs text-teal">✓ {flash}</p>}
      </section>

      {/* Filters */}
      <section className="panel rise mt-3 flex flex-wrap items-center gap-3 p-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="input-glass"
        >
          <option value="all">All types</option>
          <option value="RESTOCK">Restock</option>
          <option value="SALE">Sale</option>
          <option value="RETURN">Return</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="input-glass">
          <option value="all">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[11px] text-slate/70">{filtered.length} entries</span>
      </section>

      {/* Ledger */}
      <section className="panel rise mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-slate/60">
              <th className="px-5 py-2.5 text-left font-medium">Type</th>
              <th className="px-3 py-2.5 text-left font-medium">Product</th>
              <th className="px-3 py-2.5 text-right font-medium">Delta</th>
              <th className="px-3 py-2.5 text-left font-medium">Notes</th>
              <th className="px-5 py-2.5 text-right font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.slice(0, 80).map((m) => {
              const p = products.find((x) => x.id === m.productId);
              const meta = typeMeta[m.type];
              const Icon = meta.icon;
              return (
                <tr key={m.id} className="transition-colors hover:bg-glass">
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ring-1 ${meta.cls}`}>
                      <Icon className="size-3" />
                      {meta.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-xs text-cyan">{p?.sku ?? "—"}</span>{" "}
                    <span className="text-foreground">{p?.name ?? "Archived product"}</span>
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-mono ${
                      m.quantityChange >= 0 ? "text-teal" : "text-rose"
                    }`}
                  >
                    {m.quantityChange >= 0 ? "+" : ""}
                    {m.quantityChange}
                  </td>
                  <td className="px-3 py-3 text-slate">{m.notes}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-slate/70">
                    {new Date(m.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
