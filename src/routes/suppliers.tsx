import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { categories, formatMoney, useInventory } from "@/lib/inventory";
import { Mail, Phone, MapPin, Plus, Star } from "lucide-react";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers & Categories — Foundry OS" },
      {
        name: "description",
        content:
          "Supplier directory with lead times and performance ratings, plus category-level inventory value summaries.",
      },
      { property: "og:title", content: "Suppliers & Categories — Foundry OS" },
      {
        property: "og:description",
        content:
          "Supplier directory with lead times and performance ratings, plus category-level inventory value summaries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuppliersPage,
});

const categoryColor: Record<string, string> = {
  teal: "bg-teal",
  cyan: "bg-cyan",
  amber: "bg-amber",
  rose: "bg-rose",
};

function SuppliersPage() {
  const { products, supplierList, addSupplier } = useInventory();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", leadTimeDays: "" });

  const submit = () => {
    if (!form.name.trim()) return;
    addSupplier({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      leadTimeDays: Number(form.leadTimeDays) || 7,
      rating: 4.0,
    });
    setShowForm(false);
    setForm({ name: "", email: "", phone: "", address: "", leadTimeDays: "" });
  };

  return (
    <main className="px-6 py-5 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Suppliers & Categories
          </h1>
          <p className="mt-1 text-sm text-slate">
            {supplierList.length} suppliers · {categories.length} categories · lead times feed the AI reorder engine
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
          <Plus className="size-4" /> Add supplier
        </button>
      </header>

      {showForm && (
        <section className="panel rise mt-5 p-5">
          <h2 className="font-display text-base font-medium text-foreground">New supplier</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <input className="input-glass" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input-glass" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input-glass" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input-glass" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input className="input-glass" type="number" placeholder="Lead time (days)" value={form.leadTimeDays} onChange={(e) => setForm({ ...form, leadTimeDays: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={submit} className="btn-primary">
              Create supplier
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {categories.map((c, i) => {
          const items = products.filter((p) => p.categoryId === c.id);
          const value = items.reduce((s, p) => s + p.costPrice * p.currentStock, 0);
          return (
            <div key={c.id} className="panel rise p-4" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${categoryColor[c.color]}`} />
                <h2 className="font-display text-sm font-medium text-foreground">{c.name}</h2>
              </div>
              <p className="mt-1 text-xs text-slate">{c.description}</p>
              <p className="mt-3 font-display text-xl font-semibold text-foreground">{formatMoney(value)}</p>
              <p className="mt-1 font-mono text-[11px] text-slate/70">{items.length} SKUs</p>
            </div>
          );
        })}
      </section>

      {/* Suppliers */}
      <section className="mt-3 grid grid-cols-1 gap-3 pb-6 lg:grid-cols-2">
        {supplierList.map((s, i) => {
          const linked = products.filter((p) => p.supplierId === s.id);
          const value = linked.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
          return (
            <div key={s.id} className="panel rise p-5" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-base font-medium text-foreground">{s.name}</h2>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, star) => (
                      <Star
                        key={star}
                        className={`size-3 ${star < Math.round(s.rating) ? "fill-amber text-amber" : "text-slate/30"}`}
                      />
                    ))}
                    <span className="ml-1 font-mono text-[11px] text-slate/70">{s.rating.toFixed(1)}</span>
                  </div>
                </div>
                <span className="rounded-full bg-teal/15 px-2.5 py-1 font-mono text-[11px] font-medium text-teal ring-1 ring-teal/30">
                  {s.leadTimeDays}d lead
                </span>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate">
                <p className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate/60" /> {s.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-3.5 text-slate/60" /> {s.phone}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-slate/60" /> {s.address}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-slate/70">
                <span>{linked.length} active products</span>
                <span>{formatMoney(value)} on hand</span>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
