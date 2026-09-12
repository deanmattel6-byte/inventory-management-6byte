import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  categories,
  categoryById,
  formatMoney,
  margin,
  stockStatus,
  useInventory,
  type StockStatus,
} from "@/lib/inventory";
import { StatusBadge } from "@/components/badges";
import { Plus, Search, Trash2, Download } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products & SKU Catalog — Foundry OS" },
      {
        name: "description",
        content:
          "Full product catalog with SKU search, category and supplier filters, stock status, pricing and margin tracking.",
      },
      { property: "og:title", content: "Products & SKU Catalog — Foundry OS" },
      {
        property: "og:description",
        content:
          "Full product catalog with SKU search, category and supplier filters, stock status, pricing and margin tracking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { products, supplierList, addProduct, deleteProduct } = useInventory();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StockStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    categoryId: categories[0]!.id,
    supplierId: supplierList[0]?.id ?? "",
    costPrice: "",
    sellingPrice: "",
    currentStock: "",
    minThreshold: "",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.barcode.includes(q))
        return false;
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (supplierFilter !== "all" && p.supplierId !== supplierFilter) return false;
      if (statusFilter !== "all" && stockStatus(p) !== statusFilter) return false;
      return true;
    });
  }, [products, query, categoryFilter, supplierFilter, statusFilter]);

  const exportCsv = () => {
    const header = "SKU,Name,Barcode,Category,Supplier,Cost,Price,Stock,MinThreshold\n";
    const rows = products
      .map((p) =>
        [
          p.sku,
          `"${p.name}"`,
          p.barcode,
          categoryById(p.categoryId).name,
          supplierList.find((s) => s.id === p.supplierId)?.name ?? "",
          p.costPrice,
          p.sellingPrice,
          p.currentStock,
          p.minThreshold,
        ].join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([header + rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "foundry-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = () => {
    if (!form.sku.trim() || !form.name.trim()) return;
    addProduct({
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      barcode: String(Date.now()).slice(-12),
      categoryId: form.categoryId,
      supplierId: form.supplierId,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      currentStock: Number(form.currentStock) || 0,
      minThreshold: Number(form.minThreshold) || 0,
    });
    setShowForm(false);
    setForm({ ...form, sku: "", name: "", costPrice: "", sellingPrice: "", currentStock: "", minThreshold: "" });
  };

  return (
    <main className="px-6 py-5 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-foreground">
            Products
          </h1>
          <p className="mt-1 text-sm text-slate">
            {filtered.length} of {products.length} SKUs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-ghost">
            <Download className="size-4" /> CSV
          </button>
          <button onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Plus className="size-4" /> Add product
          </button>
        </div>
      </header>

      {/* Filters */}
      <section className="panel rise mt-5 flex flex-wrap items-center gap-3 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, barcode…"
            className="input-glass w-72 pl-9"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-glass">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="input-glass">
          <option value="all">All suppliers</option>
          {supplierList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="input-glass"
        >
          <option value="all">Any status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </section>

      {/* Add form */}
      {showForm && (
        <section className="panel rise mt-3 p-5">
          <h2 className="font-display text-base font-medium text-foreground">New product</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <input className="input-glass" placeholder="SKU (e.g. ELC-6001)" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <input className="input-glass" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select className="input-glass" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="input-glass" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              {supplierList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input className="input-glass" type="number" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
            <input className="input-glass" type="number" placeholder="Selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            <input className="input-glass" type="number" placeholder="Opening stock" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
            <input className="input-glass" type="number" placeholder="Min threshold" value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={submit} className="btn-primary">
              Create product
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </section>
      )}

      {/* Table */}
      <section className="panel rise mt-3 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.12em] text-slate/60">
                <th className="px-5 py-2.5 text-left font-medium">SKU</th>
                <th className="px-3 py-2.5 text-left font-medium">Product</th>
                <th className="px-3 py-2.5 text-left font-medium">Category</th>
                <th className="px-3 py-2.5 text-left font-medium">Supplier</th>
                <th className="px-3 py-2.5 text-right font-medium">Cost</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Margin</th>
                <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                <th className="px-3 py-2.5 text-right font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-glass">
                  <td className="px-5 py-3 font-mono text-[13px] text-cyan">{p.sku}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-3 py-3 text-slate">{categoryById(p.categoryId).name}</td>
                  <td className="px-3 py-3 text-slate">{supplierList.find((s) => s.id === p.supplierId)?.name ?? "—"}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate">{formatMoney(p.costPrice)}</td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">{formatMoney(p.sellingPrice)}</td>
                  <td className="px-3 py-3 text-right font-mono text-teal">{margin(p).toFixed(0)}%</td>
                  <td className="px-3 py-3 text-right font-mono text-foreground">{p.currentStock}</td>
                  <td className="px-3 py-3 text-right">
                    <StatusBadge status={stockStatus(p)} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="text-slate/60 transition-colors hover:text-rose"
                      aria-label={`Archive ${p.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-slate">
                    No products match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
