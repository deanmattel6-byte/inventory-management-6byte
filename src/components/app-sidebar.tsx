import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package, ArrowLeftRight, Truck, Sparkles } from "lucide-react";
import { useInventory, computeRecommendation } from "@/lib/inventory";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/ledger", label: "Stock Ledger", icon: ArrowLeftRight },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/restock", label: "AI Restock", icon: Sparkles },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { products, movements } = useInventory();
  const alertCount = products.filter(
    (p) => computeRecommendation(p, movements).urgency !== "OPTIMAL",
  ).length;

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-line bg-sidebar backdrop-blur-2xl">
      <Link to="/" className="flex items-center gap-2.5 px-5 pt-6 pb-5">
        <div className="grid size-8 place-items-center rounded-lg bg-teal/20 ring-1 ring-teal/40">
          <span className="font-mono text-sm font-semibold text-teal">F</span>
        </div>
        <div>
          <p className="font-display text-[15px] font-semibold leading-none tracking-tight text-foreground">
            Foundry OS
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate/70">
            Inventory
          </p>
        </div>
      </Link>

      <div className="px-3">
        <p className="px-2 pb-2 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate/50">
          Operations
        </p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const active = "exact" in item && item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  active
                    ? "flex items-center gap-3 rounded-lg bg-glass-strong px-3 py-2 text-sm font-medium text-foreground ring-1 ring-line"
                    : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate transition-colors hover:bg-glass hover:text-foreground"
                }
              >
                <Icon className={`size-4 shrink-0 ${active ? "text-teal" : "text-slate/70"}`} />
                {item.label}
                {item.label === "AI Restock" && alertCount > 0 && (
                  <span className="ml-auto rounded-full bg-amber/20 px-1.5 py-0.5 font-mono text-[10px] text-amber">
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto px-3 pb-5">
        <div className="rounded-xl bg-glass p-3 ring-1 ring-line">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate/70">
              Warehouse A
            </span>
            <span className="size-1.5 rounded-full bg-teal" />
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">Live sync</p>
          <p className="font-mono text-[11px] text-slate/70">session data · in-browser</p>
        </div>
      </div>
    </aside>
  );
}
