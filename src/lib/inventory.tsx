import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MovementType = "RESTOCK" | "SALE" | "RETURN" | "ADJUSTMENT";

export interface Category {
  id: string;
  name: string;
  description: string;
  color: "teal" | "cyan" | "amber" | "rose";
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  leadTimeDays: number;
  rating: number; // 0-5
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  categoryId: string;
  supplierId: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minThreshold: number;
}

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  quantityChange: number;
  notes: string;
  createdAt: string; // ISO
}

export type StockStatus = "out" | "low" | "ok";
export type Urgency = "CRITICAL" | "WARNING" | "OPTIMAL";

export const categories: Category[] = [
  { id: "cat-elc", name: "Electronics", description: "Devices, accessories and components", color: "teal" },
  { id: "cat-app", name: "Apparel", description: "Clothing and wearable goods", color: "cyan" },
  { id: "cat-hom", name: "Home Goods", description: "Kitchen, bedding and living", color: "amber" },
  { id: "cat-con", name: "Consumables", description: "Food, beverage and perishables", color: "rose" },
];

export const suppliers: Supplier[] = [
  { id: "sup-nws", name: "Northwind Supply", email: "orders@northwind.io", phone: "+1 415 555 0182", address: "88 Pier Rd, Oakland CA", leadTimeDays: 5, rating: 4.6 },
  { id: "sup-cbt", name: "Cobalt Textiles", email: "sales@cobalttextiles.com", phone: "+1 212 555 0943", address: "14 Loom St, New York NY", leadTimeDays: 12, rating: 4.1 },
  { id: "sup-vco", name: "Vessel & Co", email: "hello@vesselco.shop", phone: "+1 503 555 0771", address: "230 Kiln Ave, Portland OR", leadTimeDays: 9, rating: 4.8 },
  { id: "sup-pfd", name: "Pinnacle Foods", email: "wholesale@pinnaclefoods.co", phone: "+1 312 555 0330", address: "5 Harvest Way, Chicago IL", leadTimeDays: 4, rating: 4.4 },
  { id: "sup-lmw", name: "Lumen Works", email: "b2b@lumenworks.dev", phone: "+1 206 555 0514", address: "77 Volt Blvd, Seattle WA", leadTimeDays: 7, rating: 3.9 },
];

const seedProducts: Product[] = [
  { id: "p-01", sku: "ELC-2041", name: "Wireless Charging Pad", barcode: "850001204117", categoryId: "cat-elc", supplierId: "sup-nws", costPrice: 12.5, sellingPrice: 29.99, currentStock: 18, minThreshold: 60 },
  { id: "p-02", sku: "ELC-3390", name: "USB-C Docking Station", barcode: "850001339020", categoryId: "cat-elc", supplierId: "sup-nws", costPrice: 48.0, sellingPrice: 109.0, currentStock: 0, minThreshold: 40 },
  { id: "p-03", sku: "ELC-3310", name: "Vanta Rechargeable Lamp", barcode: "850001331034", categoryId: "cat-elc", supplierId: "sup-lmw", costPrice: 22.0, sellingPrice: 54.0, currentStock: 5, minThreshold: 30 },
  { id: "p-04", sku: "ELC-4102", name: "Noise-Cancel Headphones", barcode: "850001410229", categoryId: "cat-elc", supplierId: "sup-nws", costPrice: 64.0, sellingPrice: 149.0, currentStock: 142, minThreshold: 50 },
  { id: "p-05", sku: "ELC-5520", name: "Mechanical Keyboard 65%", barcode: "850001552045", categoryId: "cat-elc", supplierId: "sup-lmw", costPrice: 39.0, sellingPrice: 89.0, currentStock: 88, minThreshold: 35 },
  { id: "p-06", sku: "APP-1187", name: "Merino Crew Sweater", barcode: "850002118716", categoryId: "cat-app", supplierId: "sup-cbt", costPrice: 28.0, sellingPrice: 78.0, currentStock: 64, minThreshold: 80 },
  { id: "p-07", sku: "APP-4471", name: "Drift Merino Beanie", barcode: "850002447156", categoryId: "cat-app", supplierId: "sup-cbt", costPrice: 9.0, sellingPrice: 26.0, currentStock: 41, minThreshold: 45 },
  { id: "p-08", sku: "APP-2305", name: "Trail Running Jacket", barcode: "850002230526", categoryId: "cat-app", supplierId: "sup-cbt", costPrice: 42.0, sellingPrice: 118.0, currentStock: 156, minThreshold: 40 },
  { id: "p-09", sku: "HOM-0452", name: "Ceramic Pour-Over Set", barcode: "850003045217", categoryId: "cat-hom", supplierId: "sup-vco", costPrice: 16.0, sellingPrice: 44.0, currentStock: 41, minThreshold: 45 },
  { id: "p-10", sku: "HOM-0932", name: "Solace Memory Pillow", barcode: "850003093229", categoryId: "cat-hom", supplierId: "sup-vco", costPrice: 14.0, sellingPrice: 39.0, currentStock: 26, minThreshold: 35 },
  { id: "p-11", sku: "HOM-0770", name: "Linen Duvet Set", barcode: "850003077042", categoryId: "cat-hom", supplierId: "sup-cbt", costPrice: 55.0, sellingPrice: 129.0, currentStock: 73, minThreshold: 30 },
  { id: "p-12", sku: "KCH-1187", name: "Aurel Cast-Iron Skillet", barcode: "850004118712", categoryId: "cat-hom", supplierId: "sup-vco", costPrice: 21.0, sellingPrice: 59.0, currentStock: 14, minThreshold: 25 },
  { id: "p-13", sku: "CON-0218", name: "Cold-Brew Coffee 500g", barcode: "850005021817", categoryId: "cat-con", supplierId: "sup-pfd", costPrice: 6.5, sellingPrice: 16.0, currentStock: 112, minThreshold: 120 },
  { id: "p-14", sku: "CON-0310", name: "Ceremonial Matcha 250g", barcode: "850005031046", categoryId: "cat-con", supplierId: "sup-pfd", costPrice: 11.0, sellingPrice: 28.0, currentStock: 240, minThreshold: 60 },
];

// Deterministic pseudo-random generator so seeded history is stable.
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

function seedMovements(): Movement[] {
  const rand = lcg(20260912);
  const out: Movement[] = [];
  const now = Date.now();
  let n = 0;
  for (const p of seedProducts) {
    // velocity per product: units/day baseline
    const velocity = 0.5 + rand() * 2.4;
    for (let d = 30; d >= 1; d--) {
      if (rand() < velocity * 0.55) {
        const qty = -(1 + Math.floor(rand() * Math.min(9, velocity * 4)));
        out.push({
          id: `m-${n++}`,
          productId: p.id,
          type: "SALE",
          quantityChange: qty,
          notes: "Order fulfillment",
          createdAt: new Date(now - d * 86400000 - rand() * 43200000).toISOString(),
        });
      }
      if (rand() < 0.045) {
        const qty = 40 + Math.floor(rand() * 200);
        out.push({
          id: `m-${n++}`,
          productId: p.id,
          type: "RESTOCK",
          quantityChange: qty,
          notes: "Inbound purchase order",
          createdAt: new Date(now - d * 86400000 - rand() * 43200000).toISOString(),
        });
      }
      if (rand() < 0.02) {
        out.push({
          id: `m-${n++}`,
          productId: p.id,
          type: rand() < 0.6 ? "RETURN" : "ADJUSTMENT",
          quantityChange: rand() < 0.6 ? 1 + Math.floor(rand() * 3) : -(1 + Math.floor(rand() * 2)),
          notes: rand() < 0.6 ? "Customer return" : "Cycle count adjustment",
          createdAt: new Date(now - d * 86400000 - rand() * 43200000).toISOString(),
        });
      }
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function stockStatus(p: Product): StockStatus {
  if (p.currentStock <= 0) return "out";
  if (p.currentStock <= p.minThreshold) return "low";
  return "ok";
}

export function salesLast30Days(productId: string, movements: Movement[]): number {
  const cutoff = Date.now() - 30 * 86400000;
  return movements
    .filter((m) => m.productId === productId && m.type === "SALE" && new Date(m.createdAt).getTime() >= cutoff)
    .reduce((sum, m) => sum + Math.abs(m.quantityChange), 0);
}

export interface Recommendation {
  product: Product;
  supplier: Supplier;
  burnRate: number; // units/day, 30d horizon
  reorderPoint: number;
  reorderQty: number;
  daysOfStock: number;
  urgency: Urgency;
  estimatedCost: number;
}

export function computeRecommendation(
  p: Product,
  movements: Movement[],
): Recommendation {
  const supplier = suppliers.find((s) => s.id === p.supplierId)!;
  const burnRate = salesLast30Days(p.id, movements) / 30;
  const leadTimeDemand = burnRate * supplier.leadTimeDays;
  const safetyStock = burnRate * 3; // simplified buffer days
  const reorderPoint = leadTimeDemand + safetyStock;
  const daysOfStock = burnRate > 0 ? p.currentStock / burnRate : Infinity;
  const targetSupply = burnRate * 35; // 35-day target
  const reorderQty = Math.max(0, Math.ceil(targetSupply - p.currentStock));
  let urgency: Urgency = "OPTIMAL";
  if (daysOfStock < 3 || p.currentStock <= 0) urgency = "CRITICAL";
  else if (p.currentStock <= Math.max(reorderPoint, p.minThreshold)) urgency = "WARNING";
  return {
    product: p,
    supplier,
    burnRate,
    reorderPoint,
    reorderQty,
    daysOfStock,
    urgency,
    estimatedCost: reorderQty * p.costPrice,
  };
}

export function margin(p: Product): number {
  if (p.sellingPrice <= 0) return 0;
  return ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100;
}

export function formatMoney(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 10_000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface InventoryStore {
  products: Product[];
  movements: Movement[];
  supplierList: Supplier[];
  recordMovement: (productId: string, type: MovementType, qty: number, notes: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addSupplier: (s: Omit<Supplier, "id">) => void;
  lastAction: string | null;
}

const InventoryContext = createContext<InventoryStore | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [movements, setMovements] = useState<Movement[]>(seedMovements);
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const recordMovement = useCallback(
    (productId: string, type: MovementType, qty: number, notes: string) => {
      const signed =
        type === "SALE" || (type === "ADJUSTMENT" && qty > 0) ? -Math.abs(qty) : Math.abs(qty);
      const finalQty = type === "ADJUSTMENT" ? qty : signed;
      setMovements((prev) => [
        {
          id: `m-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          productId,
          type,
          quantityChange: type === "ADJUSTMENT" ? finalQty : signed,
          notes,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, currentStock: Math.max(0, p.currentStock + (type === "ADJUSTMENT" ? finalQty : signed)) }
            : p,
        ),
      );
    },
    [],
  );

  const addProduct = useCallback((p: Omit<Product, "id">) => {
    setProducts((prev) => [...prev, { ...p, id: `p-${Date.now()}` }]);
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setMovements((prev) => prev.filter((m) => m.productId !== id));
  }, []);

  const addSupplier = useCallback((s: Omit<Supplier, "id">) => {
    setSupplierList((prev) => [...prev, { ...s, id: `sup-${Date.now()}` }]);
  }, []);

  const value = useMemo(
    () => ({
      products,
      movements,
      supplierList,
      recordMovement,
      addProduct,
      updateProduct,
      deleteProduct,
      addSupplier,
      lastAction,
    }),
    [products, movements, supplierList, recordMovement, addProduct, updateProduct, deleteProduct, addSupplier, lastAction],
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryStore {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error("useInventory must be used inside InventoryProvider");
  return ctx;
}

export function categoryById(id: string): Category {
  return categories.find((c) => c.id === id) ?? (categories[0] as Category);
}

export { seedProducts };
