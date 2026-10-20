export type Product = {
  category: string;
  name: string;
  ean?: string;
  orders: number;
  shareOrders: number;
  revenue: number;
};

export type StoreInput = {
  id: string;
  name: string;
  city: string;
  status: "Ativa" | "Em revisão";
  referenceMonth: string;
  grossSales: number;
  orders: number;
  newCustomers: number;
  promoSales: number;
  promoOrders: number;
  promoTicket: number;
  promoNewCustomers: number;
  recoveredCustomers: number;
  storePromoInvestment: number;
  ifoodPromoInvestment: number;
  promoReturn: number;
  roas: number;
  adSales: number;
  adTicket: number;
  adOrders: number;
  adNewCustomers: number;
  cac: number;
  adVisits: number;
  conversion: number;
  adInvestment: number;
  costPerOrder: number;
  cmv: number;
  products: Product[];
};

export type PersistedStoreRecord = {
  id: string;
  name: string;
  city: string;
  status: "Ativa" | "Em revisão";
  referenceMonth: string;
  grossSales: string | number;
  orders: number;
  newCustomers: number;
  promoSales: string | number;
  promoOrders: number;
  promoTicket: string | number;
  promoNewCustomers: number;
  recoveredCustomers: number;
  storePromoInvestment: string | number;
  ifoodPromoInvestment: string | number;
  promoReturn: string | number;
  roas: string | number;
  adSales: string | number;
  adTicket: string | number;
  adOrders: number;
  adNewCustomers: number;
  cac: string | number;
  adVisits: number;
  conversion: string | number;
  adInvestment: string | number;
  costPerOrder: string | number;
  cmv: string | number;
  productsJson?: string | null;
};

const persistedNumber = (value: string | number | null | undefined) => Number(value ?? 0);

const persistedProducts = (productsJson?: string | null): Product[] => {
  if (!productsJson) return [];
  try {
    const parsed = JSON.parse(productsJson);
    return Array.isArray(parsed) ? parsed as Product[] : [];
  } catch {
    return [];
  }
};

export const mapPersistedStore = (record: PersistedStoreRecord): StoreInput => ({
  id: record.id,
  name: record.name,
  city: record.city,
  status: record.status,
  referenceMonth: record.referenceMonth,
  grossSales: persistedNumber(record.grossSales),
  orders: record.orders,
  newCustomers: record.newCustomers,
  promoSales: persistedNumber(record.promoSales),
  promoOrders: record.promoOrders,
  promoTicket: persistedNumber(record.promoTicket),
  promoNewCustomers: record.promoNewCustomers,
  recoveredCustomers: record.recoveredCustomers,
  storePromoInvestment: persistedNumber(record.storePromoInvestment),
  ifoodPromoInvestment: persistedNumber(record.ifoodPromoInvestment),
  promoReturn: persistedNumber(record.promoReturn),
  roas: persistedNumber(record.roas),
  adSales: persistedNumber(record.adSales),
  adTicket: persistedNumber(record.adTicket),
  adOrders: record.adOrders,
  adNewCustomers: record.adNewCustomers,
  cac: persistedNumber(record.cac),
  adVisits: record.adVisits,
  conversion: persistedNumber(record.conversion),
  adInvestment: persistedNumber(record.adInvestment),
  costPerOrder: persistedNumber(record.costPerOrder),
  cmv: persistedNumber(record.cmv),
  products: persistedProducts(record.productsJson),
});

export const storeCompetencyKey = (storeId: string, referenceMonth: string) => `${storeId}::${referenceMonth}`;

export const resolveStoreInputs = (dbStores: PersistedStoreRecord[] | null | undefined, localStores: StoreInput[]) => {
  const byStoreId = new Map<string, StoreInput>();
  (dbStores ?? []).map(mapPersistedStore).forEach((store) => byStoreId.set(store.id, store));
  localStores.forEach((store) => byStoreId.set(store.id, store));
  return Array.from(byStoreId.values());
};

export type StoreImportStatus = {
  id: string;
  name: string;
  city: string;
  referenceMonth: string;
  imported: boolean;
};

export type CompetencySaveMode = "insert" | "update";

export const getCompetencySaveMode = (snapshots: Array<{ storeId: string; referenceMonth: string }>, storeId: string, referenceMonth: string): CompetencySaveMode => (
  snapshots.some((snapshot) => storeCompetencyKey(snapshot.storeId, snapshot.referenceMonth) === storeCompetencyKey(storeId, referenceMonth)) ? "update" : "insert"
);

export const canProceedWithCompetencyUpdate = (mode: CompetencySaveMode, confirmed: boolean) => mode === "insert" || confirmed;

export const executeCompetencySave = (mode: CompetencySaveMode, confirmed: boolean, save: () => void) => {
  if (!canProceedWithCompetencyUpdate(mode, confirmed)) return false;
  save();
  return true;
};

export const selectStoreAtReferenceMonth = (
  store: StoreInput,
  referenceMonth: string,
  snapshots: Array<PersistedStoreRecord & { storeId: string }> = [],
): StoreInput => {
  const snapshot = snapshots.find((row) => row.storeId === store.id && row.referenceMonth === referenceMonth);
  if (snapshot) return mapPersistedStore({ ...snapshot, id: store.id });
  return {
    ...createEmptyStore(store.id, referenceMonth),
    name: store.name,
    city: store.city,
    status: store.status,
  };
};

export const buildImportStatus = (
  stores: StoreInput[],
  snapshots: Array<{ storeId: string; referenceMonth: string }> = [],
  referenceMonth: string,
): StoreImportStatus[] => {
  const importedKeys = new Set(snapshots.map((snapshot) => storeCompetencyKey(snapshot.storeId, snapshot.referenceMonth)));
  return stores
    .map((store) => ({
      id: store.id,
      name: store.name || "Loja sem nome",
      city: store.city || "Cidade não informada",
      referenceMonth,
      imported: importedKeys.has(storeCompetencyKey(store.id, referenceMonth)),
    }))
    .sort((a, b) => Number(a.imported) - Number(b.imported) || a.id.localeCompare(b.id));
};

export type StoreMetrics = StoreInput & {
  grossTicket: number;
  salesWithoutPromo: number;
  commission: number;
  operatingCost: number;
  totalDeductions: number;
  netSales: number;
  grossMargin: number;
  grossMarginPct: number;
  netMargin: number;
  netMarginPct: number;
  cmvPct: number;
  platformImpact: number;
  spendTotal: number;
  health: "saudável" | "atenção" | "crítica";
};

export type StoreAlert = {
  severity: "critical" | "warning";
  title: string;
  detail: string;
};

export type ProductAggregate = {
  category: string;
  name: string;
  ean?: string;
  orders: number;
  revenue: number;
  storeIds: string[];
};

export type SegmentAggregate = {
  category: string;
  productCount: number;
  orders: number;
  revenue: number;
  storeIds: string[];
};

export const DEFAULT_PARAMETERS = {
  commissionRate: 0.14,
  operatingRate: 0.05,
  roasAlert: 4,
  grossMarginAlert: 0.3,
  cmvAlert: 0.7,
};

// Comissão iFood: 14% até Setembro 2026; 10,5% a partir de Outubro 2026.
export const COMMISSION_RATE_FROM_OCTOBER_2026 = 0.105;

export const getCommissionRateForMonth = (referenceMonth: string): number => {
  const normalized = referenceMonth.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const year = Number(normalized.match(/\d{4}/)?.[0]);
  const months = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const month = months.findIndex((name) => normalized.includes(name));
  return year > 2026 || (year === 2026 && month >= 9) ? COMMISSION_RATE_FROM_OCTOBER_2026 : DEFAULT_PARAMETERS.commissionRate;
};

const productCatalog = [
  { category: "Dermocosméticos", name: "Protetor solar FPS 60" },
  { category: "Vitaminas", name: "Vitamina D 2.000 UI" },
  { category: "Dermocosméticos", name: "Hidratante facial" },
  { category: "Higiene", name: "Sabonete líquido" },
  { category: "Higiene", name: "Shampoo anticaspa" },
  { category: "Infantil", name: "Fralda descartável M" },
  { category: "Medicamentos", name: "Analgésico 500mg" },
  { category: "Vitaminas", name: "Ômega 3" },
  { category: "Vitaminas", name: "Colágeno hidrolisado" },
  { category: "Higiene", name: "Repelente corporal" },
];

const makeProducts = (seed: number, grossSales: number, storeOrders: number): Product[] => {
  const weights = [1.16, 1.04, 0.96, 0.87, 0.79, 0.72, 0.64, 0.57, 0.48, 0.4];
  return productCatalog.map((item, index) => {
    const weight = weights[index] ?? 0.4;
    const orders = Math.max(3, Math.round((18 + seed * 2) * weight + ((seed + index * 3) % 5)));
    const revenue = grossSales * (0.018 + (weight * 0.011));
    return { ...item, orders, shareOrders: storeOrders ? orders / storeOrders : 0, revenue };
  });
};

const demoConfigs = [
  { id: "L001", name: "Forma Total — Unidade Centro", city: "São Paulo", grossSales: 2704.61, orders: 42, cmv: 1767.83, promoSales: 2651.23, storePromoInvestment: 309.35, ifoodPromoInvestment: 575.03, roas: 1.2, adSales: 888.86, adInvestment: 765.32, adOrders: 13, adVisits: 1007, conversion: 1.3, promoReturn: 3.61 },
  { id: "L002", name: "Forma Total — Unidade Norte", city: "São Paulo", grossSales: 3986.2, orders: 61, cmv: 2254.1, promoSales: 3410.4, storePromoInvestment: 382.2, ifoodPromoInvestment: 611.8, roas: 4.8, adSales: 1268.4, adInvestment: 264.25, adOrders: 18, adVisits: 1320, conversion: 1.36, promoReturn: 6.2 },
  { id: "L003", name: "Forma Total — Unidade Sul", city: "São Paulo", grossSales: 3224.8, orders: 54, cmv: 1981.7, promoSales: 2876.5, storePromoInvestment: 350.4, ifoodPromoInvestment: 540.1, roas: 3.3, adSales: 1011.3, adInvestment: 306.45, adOrders: 15, adVisits: 1114, conversion: 1.35, promoReturn: 5.14 },
  { id: "L004", name: "Drogaria Aurora — Moema", city: "São Paulo", grossSales: 4768.4, orders: 69, cmv: 2461.9, promoSales: 3921.3, storePromoInvestment: 402.1, ifoodPromoInvestment: 618.7, roas: 5.6, adSales: 1645.7, adInvestment: 293.88, adOrders: 22, adVisits: 1482, conversion: 1.48, promoReturn: 7.16 },
  { id: "L005", name: "Drogaria Aurora — Pinheiros", city: "São Paulo", grossSales: 4281.9, orders: 63, cmv: 2916.8, promoSales: 3694.5, storePromoInvestment: 428.6, ifoodPromoInvestment: 570.4, roas: 3.9, adSales: 1329.1, adInvestment: 340.8, adOrders: 19, adVisits: 1401, conversion: 1.36, promoReturn: 5.31 },
  { id: "L006", name: "Drogaria Essencial — Vila Madalena", city: "São Paulo", grossSales: 2910.8, orders: 47, cmv: 2143.5, promoSales: 2496.4, storePromoInvestment: 311.4, ifoodPromoInvestment: 421.9, roas: 2.7, adSales: 864.4, adInvestment: 320.15, adOrders: 14, adVisits: 1078, conversion: 1.3, promoReturn: 4.01 },
  { id: "L007", name: "Drogaria Essencial — Tatuapé", city: "São Paulo", grossSales: 3655.7, orders: 58, cmv: 2266.5, promoSales: 3134.8, storePromoInvestment: 356.3, ifoodPromoInvestment: 509.2, roas: 4.1, adSales: 1200.2, adInvestment: 292.73, adOrders: 17, adVisits: 1260, conversion: 1.35, promoReturn: 5.82 },
  { id: "L008", name: "Farma Bairro — Campinas", city: "Campinas", grossSales: 5192.3, orders: 82, cmv: 2855.8, promoSales: 4611.2, storePromoInvestment: 485.8, ifoodPromoInvestment: 711.5, roas: 6.2, adSales: 2080.6, adInvestment: 335.58, adOrders: 28, adVisits: 1744, conversion: 1.61, promoReturn: 8.15 },
  { id: "L009", name: "Farma Bairro — Jundiaí", city: "Jundiaí", grossSales: 3488.9, orders: 57, cmv: 2458.7, promoSales: 3021.6, storePromoInvestment: 399.2, ifoodPromoInvestment: 476.5, roas: 3.6, adSales: 1116.4, adInvestment: 310.11, adOrders: 16, adVisits: 1207, conversion: 1.33, promoReturn: 4.82 },
  { id: "L010", name: "Farma Bairro — Sorocaba", city: "Sorocaba", grossSales: 4437.2, orders: 71, cmv: 2537.4, promoSales: 3841.2, storePromoInvestment: 422.9, ifoodPromoInvestment: 621.2, roas: 4.6, adSales: 1492.8, adInvestment: 324.52, adOrders: 21, adVisits: 1523, conversion: 1.38, promoReturn: 6.71 },
  { id: "L011", name: "Vida Plena — Santo André", city: "Santo André", grossSales: 2566.5, orders: 39, cmv: 1869.1, promoSales: 2134.2, storePromoInvestment: 284.6, ifoodPromoInvestment: 399.2, roas: 2.2, adSales: 694.3, adInvestment: 315.59, adOrders: 11, adVisits: 894, conversion: 1.23, promoReturn: 3.88 },
  { id: "L012", name: "Vida Plena — São Bernardo", city: "São Bernardo", grossSales: 3890.6, orders: 60, cmv: 2487.9, promoSales: 3320.5, storePromoInvestment: 370.4, ifoodPromoInvestment: 532.2, roas: 4.2, adSales: 1331.6, adInvestment: 316.99, adOrders: 18, adVisits: 1294, conversion: 1.39, promoReturn: 6.05 },
  { id: "L013", name: "Bem Estar — Osasco", city: "Osasco", grossSales: 3074.1, orders: 51, cmv: 2050.7, promoSales: 2678.9, storePromoInvestment: 318.5, ifoodPromoInvestment: 483.3, roas: 3.1, adSales: 909.8, adInvestment: 293.48, adOrders: 14, adVisits: 1024, conversion: 1.37, promoReturn: 4.66 },
  { id: "L014", name: "Bem Estar — Barueri", city: "Barueri", grossSales: 4682.8, orders: 74, cmv: 2622.4, promoSales: 4092.7, storePromoInvestment: 448.1, ifoodPromoInvestment: 664.8, roas: 5.1, adSales: 1587.7, adInvestment: 311.31, adOrders: 22, adVisits: 1558, conversion: 1.41, promoReturn: 7.24 },
];

export const DEMO_STORES: StoreInput[] = demoConfigs.map((config, index) => {
  const promoOrders = Math.max(18, Math.round(config.orders * 0.9));
  const adTicket = config.adSales / config.adOrders;
  return {
    ...config,
    status: "Ativa",
    referenceMonth: "Julho 2026",
    newCustomers: Math.round(config.orders * 0.78),
    promoOrders,
    promoTicket: config.promoSales / promoOrders,
    promoNewCustomers: Math.round(promoOrders * 0.82),
    recoveredCustomers: Math.max(1, Math.round(promoOrders * 0.04)),
    adTicket,
    adNewCustomers: config.adOrders,
    cac: config.adInvestment / config.adOrders,
    costPerOrder: config.adInvestment / config.adOrders,
    products: makeProducts(index + 1, config.grossSales, config.orders),
  };
});

export const createEmptyStore = (id: string, referenceMonth = "Julho 2026"): StoreInput => ({
  id,
  name: "",
  city: "",
  status: "Em revisão",
  referenceMonth,
  grossSales: 0,
  orders: 0,
  newCustomers: 0,
  promoSales: 0,
  promoOrders: 0,
  promoTicket: 0,
  promoNewCustomers: 0,
  recoveredCustomers: 0,
  storePromoInvestment: 0,
  ifoodPromoInvestment: 0,
  promoReturn: 0,
  roas: 0,
  adSales: 0,
  adTicket: 0,
  adOrders: 0,
  adNewCustomers: 0,
  cac: 0,
  adVisits: 0,
  conversion: 0,
  adInvestment: 0,
  costPerOrder: 0,
  cmv: 0,
  products: Array.from({ length: 10 }, () => ({ category: "", name: "", orders: 0, shareOrders: 0, revenue: 0 })),
});

export const calculateMetrics = (store: StoreInput, parameters = DEFAULT_PARAMETERS): StoreMetrics => {
  const commission = store.grossSales * getCommissionRateForMonth(store.referenceMonth);
  const operatingCost = store.grossSales * parameters.operatingRate;
  const totalDeductions = store.storePromoInvestment + commission + store.adInvestment + operatingCost;
  const netSales = store.grossSales - totalDeductions;
  const grossMargin = store.grossSales - store.cmv;
  const netMargin = netSales - store.cmv;
  const cmvPct = store.grossSales ? store.cmv / store.grossSales : 0;
  const netMarginPct = store.grossSales ? netMargin / store.grossSales : 0;
  const health = netMarginPct >= 0.08 ? "saudável" : netMargin >= 0 ? "atenção" : "crítica";
  const roas = store.adInvestment > 0 ? store.adSales / store.adInvestment : 0;
  const cac = store.adOrders > 0 ? store.adInvestment / store.adOrders : 0;
  const adTicket = store.adOrders > 0 ? store.adSales / store.adOrders : 0;
  return {
    ...store,
    roas,
    grossTicket: store.orders ? store.grossSales / store.orders : 0,
    cac,
    adTicket,
    costPerOrder: cac,
    salesWithoutPromo: Math.max(0, store.grossSales - store.promoSales),
    commission,
    operatingCost,
    totalDeductions,
    netSales,
    grossMargin,
    grossMarginPct: store.grossSales ? grossMargin / store.grossSales : 0,
    netMargin,
    netMarginPct,
    cmvPct,
    platformImpact: grossMargin - netMargin,
    spendTotal: store.storePromoInvestment + store.adInvestment,
    health,
  };
};

export const calculateAll = (stores: StoreInput[], parameters = DEFAULT_PARAMETERS) => stores.map((store) => calculateMetrics(store, parameters));

export type PeriodAggregate = {
  months: string[];
  pairs: number;
  possiblePairs: number;
  storesWithData: number;
  stores: StoreMetrics[];
  totals: StoreMetrics;
  monthly: Array<{ month: string; metrics: StoreMetrics | null; pairs: number }>;
  cmvCoverage: number;
};

const sumStoreInputs = (id: string, name: string, city: string, referenceMonth: string, inputs: StoreMetrics[]): StoreMetrics => {
  const base = createEmptyStore(id, referenceMonth);
  const numericKeys: Array<keyof StoreInput> = ["grossSales", "orders", "newCustomers", "promoSales", "promoOrders", "promoNewCustomers", "recoveredCustomers", "storePromoInvestment", "ifoodPromoInvestment", "adSales", "adOrders", "adNewCustomers", "adVisits", "adInvestment", "cmv"];
  const sum = Object.fromEntries(numericKeys.map((key) => [key, inputs.reduce((total, input) => total + Number(input[key] ?? 0), 0)])) as Partial<StoreInput>;
  const products = inputs.flatMap((input) => input.products);
  const merged = { ...base, ...sum, id, name, city, referenceMonth, products };
  const result = calculateMetrics(merged);
  const commission = inputs.reduce((total, input) => total + input.commission, 0);
  const operatingCost = inputs.reduce((total, input) => total + input.operatingCost, 0);
  const netSales = inputs.reduce((total, input) => total + input.netSales, 0);
  const grossMargin = inputs.reduce((total, input) => total + input.grossMargin, 0);
  const netMargin = inputs.reduce((total, input) => total + input.netMargin, 0);
  return { ...result, commission, operatingCost, netSales, grossMargin, netMargin, totalDeductions: merged.grossSales - netSales, grossMarginPct: merged.grossSales ? grossMargin / merged.grossSales : 0, netMarginPct: merged.grossSales ? netMargin / merged.grossSales : 0, cmvPct: merged.grossSales ? merged.cmv / merged.grossSales : 0, platformImpact: grossMargin - netMargin, spendTotal: merged.storePromoInvestment + merged.adInvestment };
};

export const aggregatePeriodMetrics = (snapshots: Array<PersistedStoreRecord & { storeId: string; referenceMonth: string }>, months: string[]): PeriodAggregate => {
  const selected = snapshots.filter((snapshot) => months.includes(snapshot.referenceMonth));
  const pairMetrics = selected.map((snapshot) => calculateMetrics(mapPersistedStore({ ...snapshot, id: snapshot.storeId } as PersistedStoreRecord), { ...DEFAULT_PARAMETERS, commissionRate: getCommissionRateForMonth(snapshot.referenceMonth) }));
  const grouped = new Map<string, StoreMetrics[]>();
  pairMetrics.forEach((metric) => grouped.set(metric.id, [...(grouped.get(metric.id) ?? []), metric]));
  const stores = [...grouped.entries()].map(([id, metrics]) => sumStoreInputs(id, metrics[0].name, metrics[0].city, months[0] ?? metrics[0].referenceMonth, metrics));
  const total = sumStoreInputs("TOTAL", "Total do período", "", months[0] ?? "", pairMetrics);
  const monthly = months.map((month) => {
    const monthMetrics = pairMetrics.filter((metric) => metric.referenceMonth === month);
    return { month, metrics: monthMetrics.length ? sumStoreInputs(`MONTH-${month}`, month, "", month, monthMetrics) : null, pairs: monthMetrics.length };
  });
  const cmvCoverage = selected.length ? selected.filter((snapshot) => snapshot.cmv !== null && snapshot.cmv !== undefined && snapshot.cmv !== "").length / selected.length : 0;
  return { months, pairs: selected.length, possiblePairs: new Set(snapshots.map((snapshot) => snapshot.storeId)).size * months.length, storesWithData: stores.length, stores, totals: total, monthly, cmvCoverage };
};

export const getSegmentBreakdown = (products: Product[]): SegmentAggregate[] => {
  const map = new Map<string, SegmentAggregate>();
  products.forEach((product) => {
    const category = product.category.trim() || "Sem segmento";
    const current = map.get(category) ?? { category, productCount: 0, orders: 0, revenue: 0, storeIds: [] };
    current.productCount += 1;
    current.orders += product.orders;
    current.revenue += product.revenue;
    map.set(category, current);
  });
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
};

export const getTopProducts = (store: StoreMetrics | StoreInput) => [...store.products].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
export const getDominantSegment = (store: StoreMetrics | StoreInput) => getSegmentBreakdown(store.products)[0] ?? { category: "Sem dados", productCount: 0, orders: 0, revenue: 0, storeIds: [] };

export const aggregateProducts = (stores: Array<StoreMetrics | StoreInput>): ProductAggregate[] => {
  const map = new Map<string, ProductAggregate>();
  stores.forEach((store) => store.products.forEach((product) => {
    const category = product.category.trim() || "Sem segmento";
    const identity = product.ean?.trim() || product.name;
    const key = identity;
    const current = map.get(key) ?? { category, name: product.name, ean: product.ean, orders: 0, revenue: 0, storeIds: [] };
    current.orders += product.orders;
    current.revenue += product.revenue;
    if (!current.storeIds.includes(store.id)) current.storeIds.push(store.id);
    map.set(key, current);
  }));
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
};

export const aggregateSegments = (stores: Array<StoreMetrics | StoreInput>): SegmentAggregate[] => {
  const map = new Map<string, SegmentAggregate>();
  stores.forEach((store) => getSegmentBreakdown(store.products).forEach((segment) => {
    const current = map.get(segment.category) ?? { category: segment.category, productCount: 0, orders: 0, revenue: 0, storeIds: [] };
    current.productCount += segment.productCount;
    current.orders += segment.orders;
    current.revenue += segment.revenue;
    if (!current.storeIds.includes(store.id)) current.storeIds.push(store.id);
    map.set(segment.category, current);
  }));
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
};

export const getStoreAlerts = (store: StoreMetrics): StoreAlert[] => {
  const alerts: StoreAlert[] = [];
  const dominant = getDominantSegment(store);
  const topRevenue = store.products.reduce((sum, product) => sum + product.revenue, 0);
  if (store.netMarginPct < 0) alerts.push({ severity: "critical", title: "LOJA OPERANDO COM PREJUÍZO", detail: `Margem líquida de ${formatCurrency(store.netMargin)}.` });
  if (store.adInvestment > 0 && store.roas < DEFAULT_PARAMETERS.roasAlert) alerts.push({ severity: "warning", title: "ROAS ABAIXO DO CORTE DE 4,0x", detail: `${store.roas.toFixed(1).replace(".", ",")}x contra referência de 4,0x.` });
  if (store.grossMarginPct < DEFAULT_PARAMETERS.grossMarginAlert) alerts.push({ severity: "warning", title: "CMV ELEVADO — REVISAR MIX DE PRODUTOS", detail: `Margem bruta em ${formatPercent(store.grossMarginPct)}.` });
  if (store.cmvPct > DEFAULT_PARAMETERS.cmvAlert) alerts.push({ severity: "critical", title: "CMV CRÍTICO", detail: `CMV representa ${formatPercent(store.cmvPct)} da venda bruta.` });
  if (store.adOrders > 0 && store.cac > store.adTicket) alerts.push({ severity: "critical", title: "CAC MAIOR QUE TICKET MÉDIO", detail: `CAC de ${formatCurrency(store.cac)} contra ticket de ${formatCurrency(store.adTicket)}.` });
  if (topRevenue > 0 && dominant.revenue / topRevenue > 0.5) alerts.push({ severity: "warning", title: "CONCENTRAÇÃO EM UM ÚNICO SEGMENTO", detail: `${dominant.category} concentra mais de 50% da receita Top 10.` });
  return alerts;
};

export const formatCurrency = (value: number, compact = false) => {
  if (compact && Math.abs(value) >= 1000000) return `R$ ${(value / 1000000).toFixed(1).replace(".", ",")} mi`;
  if (compact && Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1).replace(".", ",")} mil`;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(value);
};
export const formatPercent = (value: number) => `${(value * 100).toFixed(1).replace(".", ",")}%`;
export const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);

export const REFERENCE_MONTHS_2026 = [
  "Janeiro 2026",
  "Fevereiro 2026",
  "Março 2026",
  "Abril 2026",
  "Maio 2026",
  "Junho 2026",
  "Julho 2026",
  "Agosto 2026",
  "Setembro 2026",
  "Outubro 2026",
  "Novembro 2026",
  "Dezembro 2026",
] as const;

export const getLatestDataMonths = (availableMonths: string[]) => availableMonths.slice(-3);
export const togglePeriodMonth = (selectedMonths: string[], month: string) => {
  if (selectedMonths.includes(month)) return { months: selectedMonths.filter((selected) => selected !== month), blocked: false };
  if (selectedMonths.length >= 3) return { months: selectedMonths, blocked: true };
  return { months: [...selectedMonths, month].sort((a, b) => REFERENCE_MONTHS_2026.indexOf(a as typeof REFERENCE_MONTHS_2026[number]) - REFERENCE_MONTHS_2026.indexOf(b as typeof REFERENCE_MONTHS_2026[number])), blocked: false };
};

const annualPeriods = REFERENCE_MONTHS_2026.map((referenceMonth, index) => ({
  key: String(index + 1).padStart(2, "0"),
  label: referenceMonth.slice(0, 3).replace("ç", "ç"),
}));

const monthKeyFromReference = (referenceMonth: string) => {
  const normalized = referenceMonth.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const year = normalized.match(/20\d{2}/)?.[0];
  if (year !== "2026") return null;
  const monthNames = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  const monthIndex = monthNames.findIndex((month) => normalized.includes(month));
  return monthIndex >= 0 ? String(monthIndex + 1).padStart(2, "0") : null;
};

export type StoreSnapshotRecord = {
  storeId: string;
  referenceMonth: string;
  grossSales: string | number;
  cmv: string | number;
  storePromoInvestment: string | number;
  adInvestment: string | number;
  productsJson?: string | null;
  [key: string]: any;
};

export const buildHistoryForStore = (storeId: string, allSnapshots: StoreSnapshotRecord[], currentStore: StoreMetrics) => {
  const storeSnapshots = allSnapshots.filter((s) => s.storeId === storeId);
  const mapByMonthKey = new Map<string, StoreMetrics>();

  storeSnapshots.forEach((snap) => {
    const key = monthKeyFromReference(snap.referenceMonth);
    if (!key) return;
    const input = mapPersistedStore(snap as any);
    const metrics = calculateMetrics(input, { ...DEFAULT_PARAMETERS, commissionRate: getCommissionRateForMonth(snap.referenceMonth) });
    mapByMonthKey.set(key, metrics);
  });

  const currentKey = monthKeyFromReference(currentStore.referenceMonth);
  if (currentKey) {
    mapByMonthKey.set(currentKey, currentStore);
  }

  return annualPeriods.map(({ key, label }) => {
    const metrics = mapByMonthKey.get(key);
    if (!metrics) {
      return { period: label, grossSales: null, grossMarginPct: null, netMarginPct: null, adInvestment: null };
    }
    return {
      period: label,
      grossSales: metrics.grossSales,
      grossMarginPct: metrics.grossMarginPct,
      netMarginPct: metrics.netMarginPct,
      adInvestment: metrics.adInvestment,
    };
  });
};

export const buildConsolidatedHistory = (stores: StoreMetrics[], allSnapshots: StoreSnapshotRecord[]) => {
  const identities = new Map(stores.map(store => [store.id, store]));
  allSnapshots.forEach(snapshot => {
    if (!identities.has(snapshot.storeId)) identities.set(snapshot.storeId, calculateMetrics(mapPersistedStore({ ...snapshot, id: snapshot.storeId } as unknown as PersistedStoreRecord)));
  });
  const storeHistories = [...identities.values()].map((store) => buildHistoryForStore(store.id, allSnapshots, store));
  return annualPeriods.map(({ label }, periodIndex) => {
    const monthlyPoints = storeHistories
      .map((history) => history[periodIndex])
      .filter((point): point is NonNullable<typeof point> => point != null && point.grossSales !== null);
    const grossSales = monthlyPoints.reduce((sum, point) => sum + Number(point.grossSales ?? 0), 0);
    const weightedNetMargin = monthlyPoints.reduce((sum, point) => sum + Number(point.grossSales ?? 0) * Number(point.netMarginPct ?? 0), 0);
    return {
      period: label,
      grossSales: monthlyPoints.length ? grossSales : null,
      netMarginPct: monthlyPoints.length && grossSales ? weightedNetMargin / grossSales : null,
    };
  });
};

export const buildHistory = (store: StoreMetrics) => buildHistoryForStore(store.id, [], store);

// Conversão numérica pt-BR: aceita 2.704,61, R$ 2.704,61, 2704,61 e também números já normalizados.
export const parseBrl = (value: string | number): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim().replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (!raw) return 0;
  const sign = raw.startsWith("-") ? -1 : 1;
  const unsigned = raw.replace(/^-/, "");
  const dotParts = unsigned.split(".");
  const normalized = unsigned.includes(",")
    ? unsigned.replace(/\./g, "").replace(",", ".")
    : dotParts.length > 2
      ? unsigned.replace(/\./g, "")
      : dotParts.length === 2 && (dotParts[0]?.length ?? 0) <= 3 && dotParts[1]?.length === 3
        ? unsigned.replace(".", "")
        : unsigned;
  const parsed = Number(normalized.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? sign * parsed : 0;
};

export const formatBrl = (value: string | number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseBrl(value));
export const formatBrlCurrency = (value: string | number) => `R$ ${formatBrl(value)}`;
export const formatDecimalBr = (value: string | number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(parseBrl(value));


export type SimulationInput = {
  grossSales: number;
  cmv: number;
  storePromoInvestment: number;
  adInvestment: number;
};

export type SimulationResult = SimulationInput & {
  commission: number;
  operatingCost: number;
  totalDeductions: number;
  grossMargin: number;
  grossMarginPct: number;
  netSales: number;
  netSalesPct: number;
  netMargin: number;
  netMarginPct: number;
};

export const calculateSimulation = (input: SimulationInput, commissionRate = COMMISSION_RATE_FROM_OCTOBER_2026): SimulationResult => {
  const grossSales = Math.max(0, parseBrl(input.grossSales));
  const cmv = Math.max(0, parseBrl(input.cmv));
  const storePromoInvestment = Math.max(0, parseBrl(input.storePromoInvestment));
  const adInvestment = Math.max(0, parseBrl(input.adInvestment));
  const commission = grossSales * commissionRate;
  const operatingCost = grossSales * 0.05;
  const totalDeductions = storePromoInvestment + adInvestment + commission + operatingCost;
  const grossMargin = grossSales - cmv;
  const netSales = grossSales - totalDeductions;
  const netMargin = netSales - cmv;
  return {
    grossSales,
    cmv,
    storePromoInvestment,
    adInvestment,
    commission,
    operatingCost,
    totalDeductions,
    grossMargin,
    grossMarginPct: grossSales ? grossMargin / grossSales : 0,
    netSales,
    netSalesPct: grossSales ? netSales / grossSales : 0,
    netMargin,
    netMarginPct: grossSales ? netMargin / grossSales : 0,
  };
};

export const costPerRealSold = (netMarginPct: number) => 1 - netMarginPct;
