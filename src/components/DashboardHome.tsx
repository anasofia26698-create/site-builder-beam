/* Sala de Controle Coral — página principal: decisões de rentabilidade primeiro, detalhes rastreáveis depois. */
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Filter,
  Gauge,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  Store,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSaveStore, useStoreRecords, useStoreSnapshots } from "@/lib/stores-api";
import {
  DEMO_STORES,
  DEFAULT_PARAMETERS,
  buildHistory,
  calculateAll,
  calculateSimulation,
  createEmptyStore,
  formatBrl,
  formatCurrency,
  formatDecimalBr,
  formatNumber,
  formatPercent,
  parseBrl,
  REFERENCE_MONTHS_2026,
  aggregateProducts,
  aggregateSegments,
  buildConsolidatedHistory,
  buildImportStatus,
  buildHistoryForStore,
  executeCompetencySave,
  getCompetencySaveMode,
  getDominantSegment,
  getSegmentBreakdown,
  getStoreAlerts,
  getTopProducts,
  getCommissionRateForMonth,
  mapPersistedStore,
  resolveStoreInputs,
  selectStoreAtReferenceMonth,
  storeCompetencyKey,
  type PersistedStoreRecord,
  type Product,
  type StoreImportStatus,
  type StoreInput,
  type StoreMetrics,
  type SimulationInput,
} from "@/lib/dashboard-data";

type ViewKey = "overview" | "stores" | "dre" | "analysis" | "products" | "input" | "simulator";

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; dataKey?: string; color?: string; payload?: { label?: string } }>;
  label?: string;
  percentage?: boolean;
};

const chartColors = ["#ff7357", "#739a86", "#315f68", "#e1a254", "#a9bcb4"];

// Simulador usa a comissão vigente da competência atual (Outubro 2026: 10,5%).
const SIMULATION_COMMISSION_RATE = getCommissionRateForMonth("Outubro 2026");
const SIMULATION_COMMISSION_LABEL = formatPercent(SIMULATION_COMMISSION_RATE);

function ChartTooltip({ active, payload, label, percentage = false }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{String(payload[0]?.payload?.label ?? label)}</strong>
      {payload.map((entry) => (
        <p key={entry.dataKey}>
          {entry.dataKey === "grossSales" ? "Venda bruta" : entry.dataKey === "netMarginPct" ? "Margem líquida" : entry.dataKey === "grossMarginPct" ? "Margem bruta" : entry.dataKey === "adInvestment" ? "Anúncios" : entry.dataKey}
          {": "}
          {percentage ? formatPercent(Number(entry.value ?? 0)) : entry.dataKey?.toLowerCase().includes("pct") ? formatPercent(Number(entry.value ?? 0)) : formatCurrency(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

function MetricCard({ label, value, foot, tone = "", icon: Icon }: { label: string; value: string; foot: string; tone?: string; icon: typeof Activity }) {
  return (
    <article className={`metric-card fade-in ${tone}`}>
      <Icon className="metric-icon" />
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{foot}</div>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, meta }: { eyebrow?: string; title: string; description?: string; meta?: string }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {meta && <div className="meta">{meta}</div>}
    </div>
  );
}

function StoreTable({ stores, onOpen }: { stores: StoreMetrics[]; onOpen: (id: string) => void }) {
  return (
    <div className="panel table-panel">
      <div className="table-toolbar">
        <div>
          <h3 className="panel-title">Comparativo de lojas</h3>
          <div className="panel-kicker">A rentabilidade real começa depois da venda.</div>
        </div>
        <div className="panel-note">{stores.length} unidades / {stores[0]?.referenceMonth || "período"}</div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Loja</th>
              <th>Venda bruta</th>
              <th>Pedidos</th>
              <th>Ticket médio</th>
              <th>CMV %</th>
              <th>ROAS</th>
              <th>Margem líquida</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store, index) => (
              <tr key={store.id} className={store.health === "crítica" ? "risk-row" : ""} onClick={() => onOpen(store.id)}>
                <td>
                  <div className="store-cell">
                    <div className="store-avatar">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <strong>{store.name}</strong>
                      <span>{store.id} · {store.city}</span>
                    </div>
                  </div>
                </td>
                <td className="table-value">{formatCurrency(store.grossSales)}</td>
                <td className="table-value">{formatNumber(store.orders)}</td>
                <td className="table-value">{formatCurrency(store.grossTicket)}</td>
                <td className={`table-value ${store.cmvPct > DEFAULT_PARAMETERS.cmvAlert ? "bad" : ""}`}>{formatPercent(store.cmvPct)}</td>
                <td className={`table-value ${store.roas < DEFAULT_PARAMETERS.roasAlert ? "bad" : "good"}`}>{store.roas.toFixed(1).replace(".", ",")}x</td>
                <td className={`table-value ${store.netMargin < 0 ? "bad" : "good"}`}>{formatCurrency(store.netMargin)}</td>
                <td><span className={`status-dot ${store.health === "crítica" ? "critical" : ""}`}>{store.health === "crítica" ? "Intervenção" : store.health === "atenção" ? "Monitorar" : "Saudável"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SideNavigation({ activeView, onNavigate, open, onClose }: { activeView: ViewKey; onNavigate: (view: ViewKey) => void; open: boolean; onClose: () => void }) {
  const navItems: Array<{ key: ViewKey; label: string; icon: typeof LayoutDashboard }> = [
    { key: "overview", label: "Visão consolidada", icon: LayoutDashboard },
    { key: "stores", label: "Compativo lojas", icon: Store },
    { key: "dre", label: "Analise por Loja", icon: FileSpreadsheet },
    { key: "analysis", label: "Análise de eficiência", icon: Gauge },
    { key: "products", label: "Produtos e segmentos", icon: Package },
    { key: "input", label: "Inserir dados", icon: Plus },
    { key: "simulator", label: "Simulador de rentabilidade", icon: SlidersHorizontal },
  ];
  return (
    <aside className={`sidebar ${open ? "" : "mobile-hidden"}`}>
      <div className="brand-lockup">
        <div className="brand-mark" aria-label="Símbolo margem clara"><span className="mark-bar mark-bar-one" /><span className="mark-bar mark-bar-two" /><span className="mark-bar mark-bar-three" /></div>
        <div className="brand-wordmark"><strong>RESULTADO</strong><span>iFood / controle</span></div>
        <button className="control" style={{ marginLeft: "auto", display: "none" }} onClick={onClose} aria-label="Fechar navegação"><X size={15} /></button>
      </div>
      <div className="sidebar-section-label">Navegação</div>
      <nav className="nav-list" aria-label="Navegação principal">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`nav-item ${activeView === key ? "active" : ""}`} onClick={() => { onNavigate(key); onClose(); }}>
            <Icon /><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-section-label">Parâmetros</div>
      <button className="nav-item" onClick={() => toast.info("Os parâmetros podem ser ajustados dentro da área de inserção de dados.")}><Settings2 /><span>Regras de cálculo</span></button>
      <div className="sidebar-footer">
        <div className="audit-chip">Base sincronizada · por competência</div>
        <p className="sidebar-note">Acompanhe no painel de Inserir dados quais lojas já foram importadas e quais ainda estão pendentes.</p>
      </div>
    </aside>
  );
}

export default function DashboardHome() {
  const { data: dbStores } = useStoreRecords();
  const { data: dbSnapshots } = useStoreSnapshots();
  const saveStoreMutation = useSaveStore();

  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [period, setPeriodState] = useState("Julho 2026");
  const periodTouchedRef = useRef(false);
  const setPeriod = (value: string) => {
    periodTouchedRef.current = true;
    setPeriodState(value);
    setCommissionRate(getCommissionRateForMonth(value) * 100);
    if (value !== period) {
      setInputDraft((current) => selectStoreAtReferenceMonth(current, value, dbSnapshots ?? []));
    }
  };
  const [localStores, setLocalStores] = useState<StoreInput[]>([]);
  const [inputDraft, setInputDraft] = useState<StoreInput>(() => createEmptyStore("L001", "Julho 2026"));

  const storeInputs = useMemo(() => resolveStoreInputs(dbStores, localStores), [dbStores, localStores]);
  const importRoster = useMemo(() => {
    const roster = [...storeInputs];
    const draftIndex = roster.findIndex((store) => store.id === inputDraft.id);
    if (draftIndex >= 0) roster[draftIndex] = inputDraft;
    else if (inputDraft.name || inputDraft.city || inputDraft.grossSales > 0) roster.push(inputDraft);
    return roster;
  }, [storeInputs, inputDraft]);
  const importStatuses = useMemo(() => buildImportStatus(importRoster, dbSnapshots ?? [], period), [importRoster, dbSnapshots, period]);
  const [selectedStoreId, setSelectedStoreId] = useState("L001");
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commissionRate, setCommissionRate] = useState(DEFAULT_PARAMETERS.commissionRate * 100);
  const [operatingRate, setOperatingRate] = useState(DEFAULT_PARAMETERS.operatingRate * 100);

  // Mês padrão inteligente: abre no mês mais recente com registros salvos.
  useEffect(() => {
    if (periodTouchedRef.current || !dbSnapshots?.length) return;
    const latest = [...REFERENCE_MONTHS_2026].reverse().find((month) => dbSnapshots.some((snapshot) => snapshot.referenceMonth === month));
    if (latest) {
      periodTouchedRef.current = true;
      setPeriodState(latest);
    }
  }, [dbSnapshots]);

  // Comissão padrão da competência: 14% até Set/2026, 10,5% a partir de Out/2026.
  useEffect(() => {
    setCommissionRate(getCommissionRateForMonth(period) * 100);
  }, [period]);

  useEffect(() => {
    localStorage.setItem("margem-clara-stores", JSON.stringify(localStores));
  }, [localStores]);

  useEffect(() => {
    const selectedRaw = storeInputs.find((store) => store.id === selectedStoreId);
    setInputDraft((current) => {
      const identity = current.id === selectedStoreId ? current : selectedRaw;
      return identity ? selectStoreAtReferenceMonth(identity, period, dbSnapshots ?? []) : current;
    });
  }, [selectedStoreId, storeInputs, dbSnapshots, period]);

  const parameters = useMemo(() => ({ ...DEFAULT_PARAMETERS, commissionRate: commissionRate / 100, operatingRate: operatingRate / 100 }), [commissionRate, operatingRate]);
  // Lojas da competência ativa: prioriza os snapshots mensais; sem snapshot, usa o registro atual da loja se for do mesmo mês.
  const periodInputs = useMemo(() => {
    const snapshotInputs = (dbSnapshots ?? [])
      .filter((snapshot) => snapshot.referenceMonth === period)
      .map((snapshot) => mapPersistedStore(snapshot as unknown as PersistedStoreRecord));
    if (snapshotInputs.length) return snapshotInputs;
    return storeInputs.filter((store) => store.referenceMonth === period);
  }, [dbSnapshots, storeInputs, period]);
  const stores = useMemo(() => calculateAll(periodInputs, parameters), [periodInputs, parameters]);
  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const total = useMemo(() => stores.reduce((acc, store) => ({
    grossSales: acc.grossSales + store.grossSales,
    cmv: acc.cmv + store.cmv,
    netSales: acc.netSales + store.netSales,
    grossMargin: acc.grossMargin + store.grossMargin,
    netMargin: acc.netMargin + store.netMargin,
    orders: acc.orders + store.orders,
    adInvestment: acc.adInvestment + store.adInvestment,
    promoInvestment: acc.promoInvestment + store.storePromoInvestment,
  }), { grossSales: 0, cmv: 0, netSales: 0, grossMargin: 0, netMargin: 0, orders: 0, adInvestment: 0, promoInvestment: 0 }), [stores]);
  const ranking = useMemo(() => [...stores].sort((a, b) => b.netMargin - a.netMargin), [stores]);
  const filteredStores = useMemo(() => stores.filter((store) => `${store.name} ${store.city} ${store.id}`.toLowerCase().includes(search.toLowerCase())), [stores, search]);
  const history = selectedStore ? buildHistoryForStore(selectedStore.id, dbSnapshots ?? [], selectedStore) : [];
  const consolidatedHistory = useMemo(() => buildConsolidatedHistory(stores, dbSnapshots ?? []), [stores, dbSnapshots]);

  const navigate = (view: ViewKey) => setActiveView(view);
  const openStore = (id: string, view: ViewKey = "dre") => {
    setSelectedStoreId(id);
    const raw = storeInputs.find((store) => store.id === id);
    if (raw) setInputDraft(selectStoreAtReferenceMonth(raw, period, dbSnapshots ?? []));
    setActiveView(view);
  };

  const updateDraft = (key: keyof StoreInput, value: string) => {
    if (key === "referenceMonth") {
      setPeriod(value);
      return;
    }
    const numericFields: Array<keyof StoreInput> = ["grossSales", "orders", "newCustomers", "promoSales", "promoOrders", "promoTicket", "promoNewCustomers", "recoveredCustomers", "storePromoInvestment", "ifoodPromoInvestment", "promoReturn", "roas", "adSales", "adTicket", "adOrders", "adNewCustomers", "cac", "adVisits", "conversion", "adInvestment", "costPerOrder", "cmv"];
    setInputDraft((current) => ({ ...current, [key]: numericFields.includes(key) ? parseBrl(value) : value } as StoreInput));
  };

  const updateProduct = (index: number, field: keyof Product, value: string) => {
    const numericFields: Array<keyof Product> = ["orders", "shareOrders", "revenue"];
    setInputDraft((current) => ({ ...current, products: current.products.map((product, productIndex) => {
      if (productIndex !== index) return product;
      if (!numericFields.includes(field)) return { ...product, [field]: value };
      const parsed = parseBrl(value);
      return { ...product, [field]: field === "shareOrders" ? parsed / 100 : parsed };
    }) }));
  };

  const saveDraft = () => {
    const normalizedDraft = { ...inputDraft, name: inputDraft.name.trim(), city: inputDraft.city.trim() };
    const competencyKey = storeCompetencyKey(normalizedDraft.id, normalizedDraft.referenceMonth);
    const saveMode = getCompetencySaveMode(dbSnapshots ?? [], normalizedDraft.id, normalizedDraft.referenceMonth);
    const confirmed = saveMode === "update" && typeof window !== "undefined"
      ? window.confirm(`A competência ${normalizedDraft.referenceMonth} da loja ${normalizedDraft.name || normalizedDraft.id} já foi importada. Deseja atualizar os dados existentes sem criar duplicidade?`)
      : true;
    const proceeded = executeCompetencySave(saveMode, confirmed, () => {
      setLocalStores((current) => [...current.filter((store) => storeCompetencyKey(store.id, store.referenceMonth) !== competencyKey), normalizedDraft]);

      saveStoreMutation.mutate({
          id: normalizedDraft.id,
          name: normalizedDraft.name,
          city: normalizedDraft.city,
          status: normalizedDraft.status,
          referenceMonth: normalizedDraft.referenceMonth,
          grossSales: (normalizedDraft.grossSales),
          orders: normalizedDraft.orders,
          newCustomers: normalizedDraft.newCustomers,
          promoSales: (normalizedDraft.promoSales),
          promoOrders: normalizedDraft.promoOrders,
          promoTicket: (normalizedDraft.promoTicket),
          promoNewCustomers: normalizedDraft.promoNewCustomers,
          recoveredCustomers: normalizedDraft.recoveredCustomers,
          storePromoInvestment: (normalizedDraft.storePromoInvestment),
          ifoodPromoInvestment: (normalizedDraft.ifoodPromoInvestment),
          promoReturn: (normalizedDraft.promoReturn),
          roas: (normalizedDraft.roas),
          adSales: (normalizedDraft.adSales),
          adTicket: (normalizedDraft.adTicket),
          adOrders: normalizedDraft.adOrders,
          adNewCustomers: normalizedDraft.adNewCustomers,
          cac: (normalizedDraft.cac),
          adVisits: normalizedDraft.adVisits,
          conversion: (normalizedDraft.conversion),
          adInvestment: (normalizedDraft.adInvestment),
          costPerOrder: (normalizedDraft.costPerOrder),
          cmv: (normalizedDraft.cmv),
          productsJson: JSON.stringify(normalizedDraft.products),
      }, {
        onError: (error: unknown) => toast.error("Não foi possível salvar no banco", { description: error instanceof Error ? error.message : "Tente novamente." }),
      });
    });
    if (!proceeded) {
      toast.info("Atualização cancelada", { description: "Nenhum dado foi alterado nesta competência." });
      return;
    }

    setInputDraft(normalizedDraft);
    setSelectedStoreId(normalizedDraft.id);
    toast.success(`${saveMode === "update" ? "Competência atualizada" : "Dados importados"}: ${normalizedDraft.name || normalizedDraft.id}`, { description: `${normalizedDraft.referenceMonth} foi salvo sem criar duplicidade. A DRE e o ranking foram recalculados.` });
    setActiveView("dre");
  };

  const addNewStore = () => {
    const nextNumber = storeInputs.reduce((max, store) => Math.max(max, Number(store.id.replace(/\D/g, "")) || 0), 0) + 1;
    const newStore = createEmptyStore(`L${String(nextNumber).padStart(3, "0")}`, period);
    setLocalStores((current) => [...current, newStore]);
    setInputDraft(newStore);
    setSelectedStoreId(newStore.id);
    setActiveView("input");
    toast.info("Nova loja criada", { description: `Preencha os dados reais da ${newStore.id} e clique em Calcular e salvar.` });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      if (!base64String) return;

      toast.success("Arquivo carregado", { description: `${file.name} foi lido localmente. Use o formulário para conferir e salvar os dados.` });
    };
    reader.readAsDataURL(file);
  };

  const exportCsv = () => {
    const header = ["ID", "Loja", "Cidade", "Venda bruta", "Pedidos", "Ticket médio", "CMV", "Margem bruta", "Margem líquida", "ROAS", "Investimento anúncios", "Investimento promoções"];
    const rows = stores.map((store) => [store.id, store.name, store.city, formatBrl(store.grossSales), store.orders, formatBrl(store.grossTicket), formatBrl(store.cmv), formatBrl(store.grossMargin), formatBrl(store.netMargin), formatDecimalBr(store.roas), formatBrl(store.adInvestment), formatBrl(store.storePromoInvestment)]);
    const csv = [header, ...rows].map((row) => row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `margem-clara-${period.toLowerCase().replaceAll(" ", "-")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Comparativo exportado", { description: "O CSV inclui os indicadores calculados por loja." });
  };

  const titleMap: Record<ViewKey, { eyebrow: string; title: string; subtitle: string }> = {
    overview: { eyebrow: "dashboard / visão geral", title: "A margem líquida mostra o que a venda esconde.", subtitle: `Acompanhe ${stores.length} loja${stores.length === 1 ? "" : "s"}, identifique os pontos de fuga e encontre onde o caixa realmente acontece.` },
    stores: { eyebrow: "Sala de controle / comparativo", title: "Qual unidade transforma venda em resultado?", subtitle: "A tabela foi desenhada para a decisão de intervenção." },
    dre: { eyebrow: "Sala de controle / DRE individual", title: selectedStore?.name ?? "DRE por loja", subtitle: "Uma leitura completa da receita, do CMV, das deduções e dos motores de aquisição." },
    analysis: { eyebrow: "Sala de controle / eficiência", title: "Onde o investimento deixa de trabalhar?", subtitle: "ROAS, promoções, CAC e conversão lado a lado para separar crescimento saudável de volume caro." },
    products: { eyebrow: "Sala de controle / portfólio", title: "O mix explica a margem.", subtitle: "Leia o Top 10, os segmentos dominantes e os produtos que se repetem entre lojas." },
    input: { eyebrow: "Sala de controle / alimentação", title: "Insira o mês. O sistema revela o resto.", subtitle: "Alimente as três abas do Portal do Parceiro iFood e o CMV do Vetor Farma. As fórmulas são aplicadas na hora." },
    simulator: { eyebrow: "Sala de controle / simulação", title: "Teste a margem antes de decidir.", subtitle: "Ajuste vendas, CMV, promoções e anúncios em tempo real para enxergar o resultado mensal." },
  };

  const currentTitle = titleMap[activeView];
  const criticalStores = stores.filter((store) => store.netMargin < 0);
  const lowRoasStores = stores.filter((store) => store.roas < DEFAULT_PARAMETERS.roasAlert);

  return (
    <div className="app-shell">
      <SideNavigation activeView={activeView} onNavigate={navigate} open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="main-canvas">
        <div className="content-wrap">
          <div className="topbar fade-in">
            <div>
              <div className="eyebrow">{currentTitle.eyebrow}</div>
              <h1 className="page-title">{currentTitle.title}</h1>
              <p className="page-subtitle">{currentTitle.subtitle}</p>
            </div>
            <div className="top-actions">
              <label className="period-control"><CalendarDays size={15} /><select aria-label="Selecionar mês de referência" value={period} onChange={(event) => setPeriod(event.target.value)}>{REFERENCE_MONTHS_2026.map((referenceMonth) => <option key={referenceMonth} value={referenceMonth}>{referenceMonth}</option>)}</select></label>
              <button className="control" onClick={exportCsv}><Download size={15} /> Exportar</button>
              <button className="control primary" onClick={() => navigate("input")}><Plus size={15} /> Inserir dados</button>
              <button className="control mobile-nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={17} /></button>
            </div>
          </div>

          {activeView === "overview" && (
            <OverviewView total={total} stores={stores} ranking={ranking} criticalStores={criticalStores} lowRoasStores={lowRoasStores} consolidatedHistory={consolidatedHistory} period={period} setPeriod={setPeriod} onOpen={openStore} onInsertData={addNewStore} />
          )}
          {activeView === "stores" && (
            <StoresView stores={filteredStores} search={search} setSearch={setSearch} onOpen={openStore} />
          )}
          {activeView === "dre" && selectedStore && (
            <DreView store={selectedStore} stores={stores} history={history} onSelect={(id) => openStore(id, "dre")} onEdit={() => openStore(selectedStore.id, "input")} />
          )}
          {activeView === "dre" && !selectedStore && <EmptyStoreView onNewStore={addNewStore} />}
          {activeView === "analysis" && <AnalysisView stores={stores} />}
          {activeView === "products" && <ProductsView stores={stores} />}
          {activeView === "input" && (
            <>
              <InputView draft={inputDraft} updateDraft={updateDraft} updateProduct={updateProduct} saveDraft={saveDraft} onNewStore={addNewStore} onImport={() => document.getElementById("file-upload")?.click()} commissionRate={commissionRate} operatingRate={operatingRate} setCommissionRate={setCommissionRate} setOperatingRate={setOperatingRate} importStatuses={importStatuses} onSelectStore={(id: string) => openStore(id, "input")} />
              <input id="file-upload" type="file" style={{ display: "none" }} onChange={handleFileUpload} accept=".csv,.xlsx,.xls,.pdf" />
            </>
          )}
          {activeView === "simulator" && <SimulationView />}
        </div>
      </main>
    </div>
  );
}

function formatSimulationPercent(value: number) {
  return `${(value * 100).toFixed(2).replace(".", "," )}%`;
}

function SimulationMoneyInput({ label, value, onChange, placeholder = "R$ 0,00", readOnly = false }: { label: string; value: number; onChange?: (value: number) => void; placeholder?: string; readOnly?: boolean }) {
  const [draft, setDraft] = useState(() => formatBrl(value));
  const editingRef = useRef(false);
  useEffect(() => {
    if (!editingRef.current) setDraft(formatBrl(value));
  }, [value]);
  return <label className="simulation-input"><span>{label}</span><div className="simulation-input-shell"><span>R$</span><input type="text" inputMode="decimal" value={draft} placeholder={placeholder} readOnly={readOnly} onFocus={(event) => { editingRef.current = true; event.currentTarget.select(); }} onChange={(event) => { const next = event.target.value; setDraft(next); onChange?.(parseBrl(next)); }} onBlur={() => { editingRef.current = false; const parsed = parseBrl(draft); setDraft(formatBrl(parsed)); onChange?.(parsed); }} /></div></label>;
}

function SimulationView() {
  const [input, setInput] = useState<SimulationInput>({ grossSales: 0, cmv: 0, storePromoInvestment: 0, adInvestment: 0 });
  const [scenarioBaseline, setScenarioBaseline] = useState<number | null>(null);
  const [scenarioName, setScenarioName] = useState("Ajuste manual");
  const result = useMemo(() => calculateSimulation(input, SIMULATION_COMMISSION_RATE), [input]);
  const maxInvestment = result.grossSales * 0.5;
  const updateInput = (key: keyof SimulationInput, value: number) => {
    setScenarioBaseline(null);
    setScenarioName("Ajuste manual");
    setInput((current) => {
      if (key === "grossSales") {
        const nextGrossSales = Math.max(0, value);
        const nextMaxInvestment = nextGrossSales * 0.5;
        return { ...current, grossSales: nextGrossSales, storePromoInvestment: Math.min(current.storePromoInvestment, nextMaxInvestment), adInvestment: Math.min(current.adInvestment, nextMaxInvestment) };
      }
      return { ...current, [key]: key === "storePromoInvestment" || key === "adInvestment" ? Math.min(Math.max(0, value), maxInvestment) : Math.max(0, value) };
    });
  };
  const applyScenario = (name: string, next: SimulationInput) => {
    setScenarioBaseline(result.netMargin);
    setScenarioName(name);
    setInput(next);
  };
  const percentageOf = (value: number) => result.grossSales ? value / result.grossSales : 0;
  const chartData = [{ label: "Composição da venda bruta", cmv: result.cmv, promotions: result.storePromoInvestment, ads: result.adInvestment, commission: result.commission, operating: result.operatingCost, netMargin: result.netMargin }];
  const alerts = result.grossSales === 0 ? [] : [
    ...(result.netMarginPct < 0 ? [{ tone: "critical", text: `PREJUÍZO: Cada R$ 1 vendido custa ${formatSimulationPercent(1 - result.netMarginPct).replace("%", "")} reais.` }] : []),
    ...(result.grossMarginPct < 0.3 ? [{ tone: "warning", text: "CMV ELEVADO: Revisar mix de produtos." }] : []),
    ...(percentageOf(result.adInvestment) > 0.2 ? [{ tone: "warning", text: "Anúncios acima de 20% da receita — avaliar ROAS." }] : []),
    ...(percentageOf(result.storePromoInvestment) > 0.2 ? [{ tone: "warning", text: "Promoções acima de 20% da receita — avaliar retorno." }] : []),
  ];
  return <>
    <section className="hero-strip fade-in stagger-1"><div className="hero-copy"><div className="eyebrow" style={{ color: "#ffad96" }}>Simulação / rentabilidade mensal</div><div className="hero-title">Teste a margem antes de decidir.</div><p>Ajuste vendas, CMV, promoções e anúncios. Os cards, a DRE e o gráfico respondem instantaneamente.</p></div><div className="hero-index"><span>comissão vigente</span><strong>{SIMULATION_COMMISSION_LABEL}</strong></div></section>
    <section className="section-block simulation-layout"><div className="panel simulation-input-panel"><div className="panel-header"><div><h3 className="panel-title">Entradas da simulação</h3><div className="panel-kicker">Valores em reais no padrão brasileiro.</div></div><SlidersHorizontal size={17} color="#ff7357" /></div><div className="simulation-input-grid"><SimulationMoneyInput label="Venda Bruta até o momento" value={input.grossSales} onChange={(value) => updateInput("grossSales", value)} /><SimulationMoneyInput label="Custo da Mercadoria (CMV) — Fonte: Vetor Farma" value={input.cmv} onChange={(value) => updateInput("cmv", value)} /></div><div className="simulation-slider-group"><div className="simulation-slider-heading"><span>Investimento da loja em promoções</span><strong>{formatCurrency(result.storePromoInvestment)}</strong></div><input className="simulation-range promo-range" type="range" min="0" max={Math.max(0, maxInvestment)} step="10" value={Math.min(result.storePromoInvestment, maxInvestment)} onChange={(event) => updateInput("storePromoInvestment", Number(event.target.value))} /><SimulationMoneyInput label="Digite o valor da promoção" value={input.storePromoInvestment} onChange={(value) => updateInput("storePromoInvestment", value)} /></div><div className="simulation-slider-group"><div className="simulation-slider-heading"><span>Investimento em anúncios</span><strong>{formatCurrency(result.adInvestment)}</strong></div><input className="simulation-range ads-range" type="range" min="0" max={Math.max(0, maxInvestment)} step="10" value={Math.min(result.adInvestment, maxInvestment)} onChange={(event) => updateInput("adInvestment", Number(event.target.value))} /><SimulationMoneyInput label="Digite o valor dos anúncios" value={input.adInvestment} onChange={(value) => updateInput("adInvestment", value)} /></div><div className="simulation-fixed-grid"><div><span>Comissão iFood ({SIMULATION_COMMISSION_LABEL})</span><strong>{formatCurrency(result.commission)}</strong></div><div><span>Custo Operacional (5%)</span><strong>{formatCurrency(result.operatingCost)}</strong></div></div></div><div className="panel simulation-scenario-panel"><div className="panel-header"><div><h3 className="panel-title">Cenários rápidos</h3><div className="panel-kicker">Compare a margem líquida contra o cenário anterior.</div></div><Gauge size={17} color="#e1a254" /></div><div className="scenario-buttons"><button className="control" onClick={() => applyScenario("Cenário Atual", { ...input })}>Cenário Atual</button><button className="control" onClick={() => applyScenario("Reduzir Anúncios 50%", { ...input, adInvestment: input.adInvestment / 2 })}>Reduzir Anúncios 50%</button><button className="control" onClick={() => applyScenario("Zerar Anúncios", { ...input, adInvestment: 0 })}>Zerar Anúncios</button></div>{scenarioBaseline !== null && <div className={`scenario-delta ${result.netMargin - scenarioBaseline >= 0 ? "positive" : "negative"}`}><span>{scenarioName} · diferença na margem líquida</span><strong>{result.netMargin - scenarioBaseline >= 0 ? "+" : ""}{formatCurrency(result.netMargin - scenarioBaseline)}</strong></div>}<div className="inline-form-tip">O limite dos sliders é 50% da Venda Bruta. Comissão e custo operacional são calculados automaticamente e não são editáveis.</div></div></section>
    <section className="section-block simulation-results-grid"><article className={`simulation-card gross-card ${result.grossMargin < 0 ? "negative" : "positive"}`}><span>MARGEM BRUTA</span><strong>{formatCurrency(result.grossMargin)}</strong><b>{formatSimulationPercent(result.grossMarginPct)}</b><small>Venda Bruta − CMV</small></article><article className="simulation-card net-sales-card"><span>VENDA LÍQUIDA</span><strong>{formatCurrency(result.netSales)}</strong><b>{formatSimulationPercent(result.netSalesPct)}</b><small>Venda Bruta − Deduções</small></article><article className={`simulation-card net-card ${result.netMargin < 0 ? "negative" : "positive"}`}><span>MARGEM LÍQUIDA</span><strong>{formatCurrency(result.netMargin)}</strong><b>{formatSimulationPercent(result.netMarginPct)}</b><small>Venda Líquida − CMV</small>{result.netMargin < 0 && result.grossSales > 0 && <em>OPERANDO COM PREJUÍZO</em>}</article></section>
    {result.grossSales === 0 ? <section className="section-block"><div className="panel simulation-empty"><CircleDollarSign size={28} color="#ff7357" /><h3>Insira os valores para iniciar a simulação</h3><p>Digite a Venda Bruta e o CMV. Depois ajuste os sliders para medir o efeito das decisões.</p></div></section> : <>
      <section className="section-block"><div className="panel table-panel"><div className="panel-header"><div><h3 className="panel-title">Detalhamento da simulação</h3><div className="panel-kicker">Cada linha mostra o impacto sobre a Venda Bruta.</div></div><span className="panel-note">sem arredondar intermediários</span></div><div className="table-wrap"><table className="data-table simulation-table"><thead><tr><th>Item</th><th>Valor (R$)</th><th>% da Venda Bruta</th></tr></thead><tbody>{[["Venda Bruta", result.grossSales], ["(−) CMV", result.cmv], ["(=) Margem Bruta", result.grossMargin], ["(−) Promoções", result.storePromoInvestment], ["(−) Anúncios", result.adInvestment], [`(−) Comissão iFood (${SIMULATION_COMMISSION_LABEL})`, result.commission], ["(−) Custo Operacional (5%)", result.operatingCost], ["(=) Venda Líquida", result.netSales], ["(=) Margem Líquida", result.netMargin]].map(([label, value]) => <tr key={String(label)} className={String(label).includes("Margem") && Number(value) < 0 ? "risk-row" : ""}><td style={{ textAlign: "left" }}>{label}</td><td className="table-value">{formatCurrency(Number(value))}</td><td>{formatSimulationPercent(percentageOf(Number(value)))}</td></tr>)}</tbody></table></div></div></section>
      <section className="section-block"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Composição da Venda Bruta</h3><div className="panel-kicker">CMV, investimentos, deduções e margem líquida em uma única leitura.</div></div><BarChart3 size={17} color="#739a86" /></div><div className="simulation-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 18, left: 12, bottom: 10 }}><CartesianGrid horizontal={false} /><XAxis type="number" tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`} /><YAxis type="category" dataKey="label" hide /><Tooltip content={<ChartTooltip />} /><Bar dataKey="cmv" stackId="composition" fill="#315f68" name="CMV" /><Bar dataKey="promotions" stackId="composition" fill="#e1a254" name="Promoções" /><Bar dataKey="ads" stackId="composition" fill="#ff7357" name="Anúncios" /><Bar dataKey="commission" stackId="composition" fill="#739a86" name="Comissão iFood" /><Bar dataKey="operating" stackId="composition" fill="#a9bcb4" name="Custo operacional" /><Bar dataKey="netMargin" stackId="composition" fill={result.netMargin < 0 ? "#c94f4f" : "#4f8d68"} name="Margem líquida" /></BarChart></ResponsiveContainer></div></div></section>
      <section className="section-block"><div className="panel simulation-alert-panel"><div className="panel-header"><div><h3 className="panel-title">Alertas automáticos</h3><div className="panel-kicker">Regras de intervenção aplicadas em tempo real.</div></div><Bell size={17} color="#ff7357" /></div><div className="alert-list">{alerts.length ? alerts.map((alert, index) => <div className={`alert-row ${alert.tone === "critical" ? "coral-rail" : "amber-rail"}`} key={`${alert.text}-${index}`}><div className={`alert-dot ${alert.tone === "warning" ? "amber" : ""}`} /><div><strong>{alert.text}</strong></div></div>) : <div className="alert-row"><CheckCircle2 size={16} color="#a8c3a0" /><div><strong>Simulação dentro dos parâmetros</strong><p>Nenhum alerta crítico foi acionado.</p></div></div>}</div></div></section>
    </>}
  </>;
}

function OverviewView({ total, stores, ranking, criticalStores, lowRoasStores, consolidatedHistory, period, setPeriod, onOpen, onInsertData }: { total: { grossSales: number; cmv: number; netSales: number; grossMargin: number; netMargin: number; orders: number; adInvestment: number; promoInvestment: number }; stores: StoreMetrics[]; ranking: StoreMetrics[]; criticalStores: StoreMetrics[]; lowRoasStores: StoreMetrics[]; consolidatedHistory: Array<{ period: string; grossSales: number | null; netMarginPct: number | null }>; period: string; setPeriod: (value: string) => void; onOpen: (id: string, view?: ViewKey) => void; onInsertData: () => void }) {
  const selectedPeriodLabel = period.slice(0, 3);
  const selectedPeriodData = consolidatedHistory.find((item) => item.period === selectedPeriodLabel);
  const overviewHistory = consolidatedHistory;
  return (
    <>
      <section className="hero-strip fade-in stagger-1">
        <div className="hero-copy"><div className="eyebrow" style={{ color: "#ffad96" }}>Fechamento mensal / {period.toLowerCase()}</div><div className="hero-title">Volume é vaidade. Margem é direção.</div><p>O painel consolida Portal do Parceiro iFood + Vetor Farma em uma DRE de decisão. A base está limpa e pronta para receber as lojas reais, uma a uma.</p></div>
        <div className="hero-index"><span>unidades monitoradas</span><strong>{String(stores.length).padStart(2, "0")}</strong></div>
      </section>
      {!stores.length && (
        <section className="section-block"><div className="panel empty-state-panel"><div className="eyebrow">Competência sem dados</div><h2 className="panel-title">Nenhuma loja importada em {period}.</h2><p className="panel-kicker">Os cards, o ranking e a tabela serão preenchidos assim que a primeira loja desta competência for salva.</p><button className="control primary" onClick={onInsertData}><Plus size={14} /> Inserir dados de {period}</button></div></section>
      )}
      <section className="section-block">
        <SectionHeading eyebrow="Painel de decisão" title="O mês em quatro movimentos" description="O que entrou, o que foi consumido e o que sobrou depois da plataforma." meta="Atualização manual / dia 5–7" />
        <div className="metric-grid">
          <MetricCard label="Venda bruta consolidada" value={formatCurrency(total.grossSales, true)} foot={stores.length ? `${formatNumber(total.orders)} pedidos · ${formatCurrency(total.grossSales / total.orders)} ticket médio` : "Aguardando o primeiro cadastro"} tone="accent" icon={CircleDollarSign} />
          <MetricCard label="Margem bruta" value={formatCurrency(total.grossMargin, true)} foot={stores.length ? `${formatPercent(total.grossMargin / total.grossSales)} da receita · CMV ${formatPercent(total.cmv / total.grossSales)}` : "Será calculada após inserir os dados"} tone="positive" icon={TrendingUp} />
          <MetricCard label="Venda líquida" value={formatCurrency(total.netSales, true)} foot={stores.length ? `${formatPercent(total.netSales / total.grossSales)} preservado após deduções` : "Será calculada após inserir os dados"} icon={WalletCards} />
          <MetricCard label="Margem líquida" value={formatCurrency(total.netMargin, true)} foot={stores.length ? `${formatPercent(total.netMargin / total.grossSales)} consolidado · ${criticalStores.length} críticas` : "Será calculada após inserir os dados"} tone={total.netMargin < 0 ? "warning" : "positive"} icon={total.netMargin < 0 ? TrendingDown : ArrowUpRight} />
        </div>
      </section>
      <section className="section-block content-grid">
        <div className="panel">
          <div className="panel-header"><div><h3 className="panel-title">Evolução consolidada</h3><div className="panel-kicker">Venda bruta x margem líquida · somente dados reais</div></div><select className="select-field" aria-label="Selecionar competência da evolução consolidada" value={period} onChange={(event) => setPeriod(event.target.value)} style={{ width: "auto", minWidth: 138, padding: "7px 9px" }}>{REFERENCE_MONTHS_2026.map((referenceMonth) => <option key={referenceMonth} value={referenceMonth}>{referenceMonth}</option>)}</select></div>
          <div className="chart-shell"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={overviewHistory} margin={{ top: 8, right: 9, left: 1, bottom: 2 }}><CartesianGrid vertical={false} /><XAxis dataKey="period" tickLine={false} axisLine={false} /><YAxis yAxisId="left" tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`} /><YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value * 100)}%`} /><Tooltip content={<ChartTooltip />} /><Area yAxisId="left" type="monotone" dataKey="grossSales" connectNulls={false} fill="#eaf0e8" stroke="#70927f" strokeWidth={2} fillOpacity={.8} /><Line yAxisId="right" type="monotone" dataKey="netMarginPct" connectNulls={false} stroke="#ff7357" strokeWidth={3} dot={{ r: 3, fill: "#ff7357", strokeWidth: 0 }} /></ComposedChart></ResponsiveContainer></div><div className="inline-form-tip">Competência selecionada: <strong>{period}</strong> · {selectedPeriodData?.grossSales !== null && selectedPeriodData?.grossSales !== undefined ? `${formatCurrency(selectedPeriodData.grossSales)} de venda bruta consolidada` : "ainda sem dados cadastrados"}.</div>
        </div>
        <div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Leitura executiva</h3><div className="panel-kicker">Alertas que merecem uma decisão</div></div><Bell size={17} color="#ffad96" /></div><div className="alert-list">
          {criticalStores.slice(0, 2).map((store) => <div className="alert-row coral-rail" key={store.id} onClick={() => onOpen(store.id)} style={{ cursor: "pointer" }}><div className="alert-dot" /><div><strong>{store.name.split(" — ")[1] ?? store.name}</strong><p>Margem líquida de <em>{formatCurrency(store.netMargin)}</em>. Anúncios e CMV comprimem o resultado.</p></div></div>)}
          {lowRoasStores.slice(0, 1).map((store) => <div className="alert-row amber-rail" key={`roas-${store.id}`} onClick={() => onOpen(store.id)} style={{ cursor: "pointer" }}><div className="alert-dot amber" /><div><strong>ROAS abaixo do corte em {store.city}</strong><p>{store.roas.toFixed(1).replace(".", ",")}x contra referência de <em>4,0x</em>. Investimento pede revisão.</p></div></div>)}
          {!criticalStores.length && !lowRoasStores.length && <div className="alert-row"><div className="alert-dot amber" /><div><strong>Operação dentro dos parâmetros</strong><p>Nenhuma loja ultrapassa os limites de alerta configurados.</p></div></div>}
        </div></div>
      </section>
      <section className="section-block content-grid">
        <div className="panel"><div className="panel-header"><div><h3 className="panel-title">Ranking por margem líquida</h3><div className="panel-kicker">A loja mais rentável não é necessariamente a que mais vende.</div></div><span className="panel-note">top 5</span></div><div className="ranking-list">{ranking.slice(0, 5).map((store, index) => <div className={`ranking-row ${store.netMargin < 0 ? "risk-row" : ""}`} key={store.id} onClick={() => onOpen(store.id)} style={{ cursor: "pointer" }}><div className="rank-number">0{index + 1}</div><div className="rank-name"><strong>{store.name}</strong><span>{store.city} · {formatCurrency(store.grossSales)} de venda bruta</span></div><div><div className={`rank-value ${store.netMargin < 0 ? "negative" : ""}`}>{formatCurrency(store.netMargin)}</div><span className={`rank-pill ${store.netMargin < 0 ? "risk" : ""}`}>{formatPercent(store.netMarginPct)}</span></div></div>)}</div></div>
        <div className="panel decision-panel"><div className="panel-header"><div><h3 className="panel-title">Investimento Realizado</h3><div className="panel-kicker">O dinheiro que precisa retornar.</div></div><Activity size={17} color="#ff7357" /></div><div className="dre-line"><span>Anúncios</span><strong>{formatCurrency(total.adInvestment)}</strong></div><div className="dre-line"><span>Promoções da loja</span><strong>{formatCurrency(total.promoInvestment)}</strong></div><div className="dre-line total"><span>Total Investido</span><strong>{formatCurrency(total.adInvestment + total.promoInvestment)}</strong></div><div className="inline-form-tip">Apenas considerar o INVESTIMENTO LOJA  em promoções. 
Investimento do ifood não entra para o calculo.</div></div>
      </section>
      <section className="section-block"><StoreTable stores={ranking} onOpen={(id) => onOpen(id, "dre")} /></section>
    </>
  );
}

function StoresView({ stores, search, setSearch, onOpen }: { stores: StoreMetrics[]; search: string; setSearch: (value: string) => void; onOpen: (id: string, view?: ViewKey) => void }) {
  return <>
    <section className="hero-strip fade-in stagger-1"><div className="hero-copy"><div className="eyebrow" style={{ color: "#ffad96" }}>Comparativo / {stores.length} loja{stores.length === 1 ? "" : "s"}</div><div className="hero-title">Leia o portfólio como uma DRE.</div><p>Use a venda para contextualizar. Use a margem líquida para escolher onde agir primeiro.</p></div><div className="hero-index"><span>critério principal</span><strong>margem</strong></div></section>
    <section className="section-block"><div className="panel table-panel"><div className="table-toolbar"><div><h3 className="panel-title">Tabela de performance</h3><div className="panel-kicker">Clique em uma unidade para abrir a DRE completa.</div></div><div className="filter-bar"><div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#93a09b" }} /><input className="input-field" style={{ paddingLeft: 31 }} placeholder="Buscar loja ou cidade" value={search} onChange={(event) => setSearch(event.target.value)} /></div><button className="control" onClick={() => toast.info("Filtros automáticos ativos", { description: "A tabela sinaliza ROAS < 4x, CMV > 70% e margem líquida negativa." })}><Filter size={14} /> Alertas</button></div></div><StoreTable stores={stores} onOpen={onOpen} /></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Como interpretar</h3><div className="panel-kicker">Três cortes para decisão</div></div><ClipboardList size={17} color="#ff7357" /></div><div className="dre-line"><span>Margem líquida</span><strong>Maior é melhor</strong></div><div className="dre-line"><span>ROAS</span><strong>Acima de 4,0x</strong></div><div className="dre-line"><span>CMV %</span><strong>Abaixo de 65%</strong></div><div className="inline-form-tip">Uma loja com ticket maior pode perder para outra com mix mais saudável. O motor considera CMV, comissão, operação, anúncios e promoções.</div></div><div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Fontes dos dados</h3><div className="panel-kicker">Rastreabilidade do fechamento</div></div><FileSpreadsheet size={17} color="#a8c3a0" /></div><div className="alert-list"><div className="alert-row"><CheckCircle2 size={16} color="#a8c3a0" /><div><strong>Portal do Parceiro iFood</strong><p>Desempenho, Promoções e Anúncios.</p></div></div><div className="alert-row"><Package size={16} color="#ffad96" /><div><strong>Vetor Farma</strong><p>CMV mensal por loja. Dado indispensável para a margem.</p></div></div></div></div></section>
  </>;
}

function EmptyStoreView({ onNewStore }: { onNewStore: () => void }) {
  return <section className="section-block"><div className="panel empty-state-panel"><div className="eyebrow">Análise por Loja / aguardando cadastro</div><h2 className="panel-title">Nenhuma loja foi cadastrada ainda.</h2><p className="panel-kicker">A DRE, a evolução de margens, os indicadores de promoções e anúncios e os produtos aparecerão assim que a primeira loja real for salva.</p><button className="control primary" onClick={onNewStore}><Plus size={14} /> Cadastrar primeira loja</button></div></section>;
}

function OperationalStatsPanel({ store }: { store: StoreMetrics }) {
  return <div className="operational-stats"><div className="dre-section-title"><span>Indicadores operacionais</span><span className="source-tag">leitura ao lado da evolução</span></div><div className="stats-table"><div><span>Total de pedidos</span><strong>{formatNumber(store.orders)}</strong></div><div><span>Ticket médio</span><strong>{formatCurrency(store.grossTicket)}</strong></div><div><span>Novos clientes</span><strong>{formatNumber(store.newCustomers)}</strong></div></div></div>;
}

function InvestmentIndicators({ store }: { store: StoreMetrics }) {
  return <section className="section-block content-grid investment-indicators"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Indicadores de promoções</h3><div className="panel-kicker">Investimento da loja separado do investimento do iFood.</div></div><Target size={17} color="#ff7357" /></div><div className="dre-line"><span>Venda com promoções</span><strong>{formatCurrency(store.promoSales)}</strong></div><div className="dre-line"><span>Pedidos com promoção</span><strong>{formatNumber(store.promoOrders)}</strong></div><div className="dre-line"><span>Ticket médio promoção</span><strong>{formatCurrency(store.promoTicket)}</strong></div><div className="dre-line"><span>Investimento da loja</span><strong>{formatCurrency(store.storePromoInvestment)}</strong></div><div className="dre-line"><span>Investimento do iFood</span><strong>{formatCurrency(store.ifoodPromoInvestment)}</strong></div><div className="dre-line total"><span>Retorno por real investido</span><strong>{store.promoReturn.toFixed(2).replace(".", ",")}x</strong></div></div><div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Indicadores de anúncios</h3><div className="panel-kicker">Aquisição paga e custo de conversão.</div></div><Activity size={17} color="#ffad96" /></div><div className="dre-line" style={{ color: "#a7c0ba" }}><span>ROAS</span><strong style={{ color: store.roas < 4 ? "#ffad96" : "#a8c3a0" }}>{store.roas.toFixed(1).replace(".", ",")}x</strong></div><div className="dre-line" style={{ color: "#a7c0ba" }}><span>Venda via anúncios</span><strong style={{ color: "#f7f2e7" }}>{formatCurrency(store.adSales)}</strong></div><div className="dre-line" style={{ color: "#a7c0ba" }}><span>CAC / custo por pedido</span><strong style={{ color: "#f7f2e7" }}>{formatCurrency(store.cac)}</strong></div><div className="dre-line" style={{ color: "#a7c0ba" }}><span>Visitas · conversão</span><strong style={{ color: "#f7f2e7" }}>{formatNumber(store.adVisits)} · {store.conversion.toFixed(1).replace(".", ",")}%</strong></div><div className="dre-line total" style={{ borderColor: "rgba(234,244,235,.18)", color: "#f7f2e7" }}><span>Investimento em anúncios</span><strong style={{ color: "#ffad96" }}>{formatCurrency(store.adInvestment)}</strong></div></div></section>;
}

function DreView({ store, stores, history, onSelect, onEdit }: { store: StoreMetrics; stores: StoreMetrics[]; history: ReturnType<typeof buildHistory>; onSelect: (id: string) => void; onEdit: () => void }) {
  const cascade = [
    { label: "Venda Bruta (100%)", value: store.grossSales, pct: 1, tone: "#739a86" },
    { label: "(−) CMV → Margem Bruta", value: store.grossMargin, pct: store.grossMarginPct, tone: "#89a98f" },
    { label: "(−) Comissão iFood", value: store.grossMargin - store.commission, pct: (store.grossMargin - store.commission) / store.grossSales, tone: "#e1a254" },
    { label: "(−) Descontos", value: store.grossMargin - store.commission - store.storePromoInvestment, pct: (store.grossMargin - store.commission - store.storePromoInvestment) / store.grossSales, tone: "#d88769" },
    { label: "(−) Anúncios", value: store.grossMargin - store.commission - store.storePromoInvestment - store.adInvestment, pct: (store.grossMargin - store.commission - store.storePromoInvestment - store.adInvestment) / store.grossSales, tone: "#d96d57" },
    { label: "(−) Custo Operacional → Margem Líquida", value: store.netMargin, pct: store.netMarginPct, tone: store.netMargin < 0 ? "#ff7357" : "#739a86" },
  ];
  const topProducts = getTopProducts(store);
  const topProductsRevenue = topProducts.reduce((sum, product) => sum + product.revenue, 0);
  const segmentBreakdown = getSegmentBreakdown(topProducts);
  const storeAlerts = getStoreAlerts(store);
  return <>
    <section className="section-block" style={{ marginTop: 9 }}><div className="panel" style={{ padding: "14px 18px" }}><div className="filter-bar"><div style={{ flex: 1 }}><label className="eyebrow" htmlFor="store-select">Loja selecionada</label><select id="store-select" className="select-field" style={{ width: "100%", marginTop: 6 }} value={store.id} onChange={(event) => onSelect(event.target.value)}>{stores.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}</select></div><button className="control" onClick={onEdit}><SlidersHorizontal size={14} /> Editar dados</button></div></div></section>
    <section className="section-block"><SectionHeading eyebrow="DRE / leitura individual" title={`${store.name} · ${store.referenceMonth}`} description="O resultado calculado a partir das entradas do iFood e do CMV do Vetor Farma." meta={`${store.id} / ${store.city}`} /><div className="metric-grid"><MetricCard label="Venda bruta" value={formatCurrency(store.grossSales)} foot="Base total de receita do período" tone="accent" icon={ShoppingBag} /><MetricCard label="Margem bruta" value={formatCurrency(store.grossMargin)} foot={`${formatPercent(store.grossMarginPct)} da venda · CMV ${formatPercent(store.cmvPct)}`} tone="positive" icon={ArrowUpRight} /><MetricCard label="Venda líquida" value={formatCurrency(store.netSales)} foot={`${formatPercent(store.netSales / store.grossSales)} preservado`} icon={WalletCards} /><MetricCard label="Margem líquida" value={formatCurrency(store.netMargin)} foot={`${formatPercent(store.netMarginPct)} · ${store.health}`} tone={store.netMargin < 0 ? "warning" : "positive"} icon={store.netMargin < 0 ? TrendingDown : CheckCircle2} /></div></section>
    <section className="section-block dre-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">DRE automatizada</h3><div className="panel-kicker">Valores em reais · competência mensal</div></div><span className="panel-note">{store.id}</span></div><div className="dre-section"><div className="dre-section-title"><span>01 · Receita bruta</span><span className="source-tag">iFood / desempenho</span></div><div className="dre-line"><span>(+) Venda bruta total</span><strong>{formatCurrency(store.grossSales)}</strong></div><div className="dre-line"><span>Venda com promoções</span><strong>{formatCurrency(store.promoSales)}</strong></div><div className="dre-line"><span>Venda sem promoções</span><strong>{formatCurrency(store.salesWithoutPromo)}</strong></div></div><div className="dre-section"><div className="dre-section-title"><span>02 · CMV</span><span className="source-tag">Vetor Farma</span></div><div className="dre-line"><span>(−) Custo da mercadoria</span><strong>{formatCurrency(store.cmv)}</strong></div><div className="dre-line total"><span>(=) Margem bruta</span><strong>{formatCurrency(store.grossMargin)} · {formatPercent(store.grossMarginPct)}</strong></div></div><div className="dre-section"><div className="dre-section-title"><span>03 · Deduções</span><span className="source-tag">parâmetros ativos</span></div><div className="dre-line"><span>(−) Descontos loja</span><strong>{formatCurrency(store.storePromoInvestment)}</strong></div><div className="dre-line"><span>(−) Comissão iFood ({formatPercent(store.grossSales ? store.commission / store.grossSales : 0)})</span><strong>{formatCurrency(store.commission)}</strong></div><div className="dre-line"><span>(−) Investimento em anúncios</span><strong>{formatCurrency(store.adInvestment)}</strong></div><div className="dre-line"><span>(−) Custo operacional</span><strong>{formatCurrency(store.operatingCost)}</strong></div><div className="dre-line total"><span>Total de deduções</span><strong>{formatCurrency(store.totalDeductions)}</strong></div></div><div className="dre-section"><div className="dre-section-title"><span>04 · Resultado</span><span className="source-tag">motor de cálculo</span></div><div className={`dre-line total ${store.netMargin < 0 ? "negative" : ""}`}><span>(=) Margem líquida</span><strong>{formatCurrency(store.netMargin)} · {formatPercent(store.netMarginPct)}</strong></div></div></div>
      <div className="panel"><div className="panel-header"><div><h3 className="panel-title">Evolução da unidade</h3><div className="panel-kicker">Margens mensais e investimento em anúncios</div></div><span className="panel-note">Jan–Dez · dados reais</span></div><div className="chart-shell"><ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 8, right: 8, left: -19, bottom: 3 }}><CartesianGrid vertical={false} /><XAxis dataKey="period" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value * 100)}%`} /><Tooltip content={<ChartTooltip />} /><Line type="monotone" dataKey="grossMarginPct" name="Margem bruta" stroke="#739a86" strokeWidth={2.5} connectNulls={false} dot={{ r: 3, fill: "#739a86", strokeWidth: 0 }} /><Line type="monotone" dataKey="netMarginPct" name="Margem líquida" stroke="#ff7357" strokeWidth={2.5} connectNulls={false} dot={{ r: 3, fill: "#ff7357", strokeWidth: 0 }} /></LineChart></ResponsiveContainer></div><div className="dre-section"><div className="dre-section-title"><span>Impacto plataforma</span><span className="source-tag">margem bruta − líquida</span></div><div className="dre-line total"><span>Gap capturado</span><strong>{formatCurrency(store.platformImpact)}</strong></div></div><OperationalStatsPanel store={store} /></div></section>
    <section className="section-block"><div className="panel table-panel"><div className="panel-header"><div><h3 className="panel-title">Cascata de margens</h3><div className="panel-kicker">Venda bruta → CMV → margem bruta → deduções → venda líquida → margem líquida.</div></div><span className="panel-note">100% → {formatPercent(store.netMarginPct)}</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Etapa</th><th>Valor</th><th>Margem acumulada</th></tr></thead><tbody>{cascade.map((step) => <tr key={step.label}><td style={{ textAlign: "left" }}>{step.label}</td><td>{formatCurrency(step.value)}</td><td className={step.pct < 0 ? "table-value bad" : "table-value good"}>{formatPercent(step.pct)}</td></tr>)}</tbody></table></div></div></section>
    <InvestmentIndicators store={store} />
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Alertas automáticos</h3><div className="panel-kicker">Regras do anexo aplicadas à unidade.</div></div><Bell size={17} color="#ff7357" /></div><div className="alert-list">{storeAlerts.length ? storeAlerts.map((alert, index) => <div className={`alert-row ${alert.severity === "critical" ? "coral-rail" : "amber-rail"}`} key={`${alert.title}-${index}`}><div className={`alert-dot ${alert.severity === "warning" ? "amber" : ""}`} /><div><strong>{alert.title}</strong><p>{alert.detail}</p></div></div>) : <div className="alert-row"><CheckCircle2 size={16} color="#a8c3a0" /><div><strong>Operação dentro dos parâmetros</strong><p>Nenhum alerta automático ativo para esta loja.</p></div></div>}</div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Top 10 por segmento</h3><div className="panel-kicker">Receita e participação dentro do Top 10 da loja.</div></div><BarChart3 size={17} color="#739a86" /></div><div className="compact-list">{segmentBreakdown.map((segment) => <div className="compact-row" key={segment.category}><div><strong>{segment.category}</strong><span>{segment.productCount} produtos · {formatNumber(segment.orders)} unidades</span></div><b>{formatPercent(topProductsRevenue ? segment.revenue / topProductsRevenue : 0)}</b></div>)}</div></div></section>
    <section className="section-block content-grid"><div className="panel table-panel"><div className="panel-header"><div><h3 className="panel-title">Top 10 produtos — {store.name}</h3><div className="panel-kicker">Portal iFood / Desempenho / Catálogo.</div></div><Package size={17} color="#ff7357" /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>Segmento / produto</th><th>Qtd</th><th>% pedidos</th><th>Receita</th></tr></thead><tbody>{topProducts.map((product, index) => <tr key={`${product.category}-${product.name}`}><td>{String(index + 1).padStart(2, "0")}</td><td style={{ textAlign: "left" }}><strong>{product.name}</strong><span style={{ display: "block", color: "#8a9690", fontSize: 10 }}>{product.category}</span></td><td>{formatNumber(product.orders)}</td><td>{formatPercent(product.shareOrders)}</td><td className="table-value">{formatCurrency(product.revenue)}</td></tr>)}</tbody></table></div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Leitura do mix</h3><div className="panel-kicker">Participação da receita dentro do Top 10.</div></div><ShoppingBag size={17} color="#739a86" /></div><div className="compact-list">{topProducts.slice(0, 6).map((product, index) => <div className="compact-row" key={`mix-${product.category}-${product.name}`}><div><strong>{String(index + 1).padStart(2, "0")} · {product.name}</strong><span>{product.category} · {formatNumber(product.orders)} pedidos</span></div><b>{formatPercent(topProductsRevenue ? product.revenue / topProductsRevenue : 0)}</b></div>)}</div></div></section>
  </>;
}

function ProductsView({ stores }: { stores: StoreMetrics[] }) {
  const consolidatedProducts = aggregateProducts(stores).slice(0, 10);
  const consolidatedSegments = aggregateSegments(stores);
  const top10Revenue = consolidatedProducts.reduce((sum, product) => sum + product.revenue, 0);
  const repeatedProducts = aggregateProducts(stores).filter((product) => product.storeIds.length >= 2).slice(0, 8);
  const dominantRows = stores.map((store) => ({ store, segment: getDominantSegment(store) })).sort((a, b) => b.segment.revenue - a.segment.revenue);
  return <>
    <section className="hero-strip fade-in stagger-1"><div className="hero-copy"><div className="eyebrow" style={{ color: "#ffad96" }}>Portfólio / produtos e segmentos</div><div className="hero-title">O mix explica a margem.</div><p>O Top 10 por loja e consolidado revela o que gira, o que concentra receita e onde há oportunidade de padronização entre unidades.</p></div><div className="hero-index"><span>produtos mapeados</span><strong>{String(aggregateProducts(stores).length).padStart(2, "0")}</strong></div></section>
    <section className="section-block"><SectionHeading eyebrow="Leitura de portfólio" title="Produto, segmento, decisão." description="As receitas abaixo são calculadas a partir do Top 10 de cada loja e podem ser substituídas pelos dados do Portal iFood." meta={`${stores.length} lojas / Top 10`} /><div className="metric-grid"><MetricCard label="Receita Top 10 consolidada" value={formatCurrency(top10Revenue, true)} foot={`${formatPercent(top10Revenue / stores.reduce((sum, store) => sum + store.grossSales, 0))} da venda bruta consolidada`} tone="accent" icon={ShoppingBag} /><MetricCard label="Unidades no Top 10" value={formatNumber(consolidatedProducts.reduce((sum, product) => sum + product.orders, 0))} foot="quantidades vendidas agregadas" tone="positive" icon={Package} /><MetricCard label="Segmentos ativos" value={formatNumber(consolidatedSegments.length)} foot="categorias com receita registrada" icon={BarChart3} /><MetricCard label="Produtos em múltiplas lojas" value={formatNumber(repeatedProducts.length)} foot="oportunidades de padronização" tone="warning" icon={Target} /></div></section>
    <section className="section-block content-grid"><div className="panel table-panel"><div className="panel-header"><div><h3 className="panel-title">Top 10 produtos consolidado</h3><div className="panel-kicker">Todas as lojas · receita total, unidades e presença.</div></div><Package size={17} color="#ff7357" /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>#</th><th>Segmento / produto</th><th>Qtd total</th><th>Lojas</th><th>Receita total</th><th>% Top 10</th></tr></thead><tbody>{consolidatedProducts.map((product, index) => <tr key={`${product.category}-${product.name}`}><td>{String(index + 1).padStart(2, "0")}</td><td><div className="store-cell"><div className="store-avatar">{String(index + 1).padStart(2, "0")}</div><div><strong>{product.name}</strong><span>{product.category}</span></div></div></td><td>{formatNumber(product.orders)}</td><td>{product.storeIds.length}</td><td className="table-value">{formatCurrency(product.revenue)}</td><td className="table-value good">{formatPercent(top10Revenue ? product.revenue / top10Revenue : 0)}</td></tr>)}</tbody></table></div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Análise por segmento</h3><div className="panel-kicker">Participação sobre a receita consolidada do Top 10.</div></div><BarChart3 size={17} color="#739a86" /></div><div className="segment-list">{consolidatedSegments.map((segment) => <div className="segment-row" key={segment.category}><div><strong>{segment.category}</strong><span>{segment.productCount} produtos · {segment.storeIds.length} lojas</span></div><div className="segment-meter"><div style={{ width: `${top10Revenue ? Math.min(100, (segment.revenue / top10Revenue) * 100) : 0}%` }} /></div><b>{formatPercent(top10Revenue ? segment.revenue / top10Revenue : 0)}</b></div>)}</div><div className="inline-form-tip">O segmento dominante por receita é um sinal de mix; não substitui a leitura de CMV por produto.</div></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Produtos em múltiplas lojas</h3><div className="panel-kicker">Itens que aparecem no Top 10 de duas ou mais unidades.</div></div><Store size={17} color="#ff7357" /></div><div className="compact-list">{repeatedProducts.map((product) => <div className="compact-row" key={`${product.category}-${product.name}`}><div><strong>{product.name}</strong><span>{product.category} · {product.storeIds.join(", ")}</span></div><b>{formatCurrency(product.revenue)}</b></div>)}</div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Segmento dominante por loja</h3><div className="panel-kicker">A maior concentração de receita dentro do Top 10 individual.</div></div><Target size={17} color="#e1a254" /></div><div className="compact-list">{dominantRows.slice(0, 8).map(({ store, segment }) => <div className="compact-row" key={store.id}><div><strong>{store.name}</strong><span>{segment.category} · {store.id}</span></div><b>{formatPercent(segment.revenue / store.products.reduce((sum, product) => sum + product.revenue, 0))}</b></div>)}</div></div></section>
  </>;
}

function AnalysisView({ stores }: { stores: StoreMetrics[] }) {
  const roasData = [...stores].sort((a, b) => b.roas - a.roas).map((store) => ({ name: store.id, roas: store.roas, label: store.name }));
  const promoData = [...stores].sort((a, b) => b.promoReturn - a.promoReturn).map((store) => ({ name: store.id, promoReturn: store.promoReturn, label: store.name }));
  const scatterData = stores.map((store) => ({ name: store.id, ticket: store.adTicket, cac: store.cac, label: store.name }));
  const averagePlatformImpact = stores.length ? stores.reduce((sum, store) => sum + store.platformImpact, 0) / stores.length : 0;
  const globalRanking = [...stores].sort((a, b) => b.netMargin - a.netMargin);
  const bestStore = globalRanking[0];
  const interventionStore = globalRanking[globalRanking.length - 1];
  const negativeStores = stores.filter((store) => store.netMargin < 0);
  const weakRoasStores = stores.filter((store) => store.roas < DEFAULT_PARAMETERS.roasAlert);
  const criticalCmvStores = stores.filter((store) => store.cmvPct > DEFAULT_PARAMETERS.cmvAlert);
  const sharedProducts = aggregateProducts(stores).filter((product) => product.storeIds.length >= 3);
  return <>
    <section className="hero-strip fade-in stagger-1"><div className="hero-copy"><div className="eyebrow" style={{ color: "#ffad96" }}>Eficiência / aquisição e mix</div><div className="hero-title">Mais tráfego não é sinônimo de mais caixa.</div><p>Descubra quais investimentos sustentam a margem e quais só compram volume caro para a operação.</p></div><div className="hero-index"><span>corte roas</span><strong>4,0x</strong></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">ROAS por loja</h3><div className="panel-kicker">Abaixo de 4,0x pede revisão de campanha.</div></div><BarChart3 size={17} color="#ff7357" /></div><div className="chart-shell"><ResponsiveContainer width="100%" height="100%"><BarChart data={roasData} layout="vertical" margin={{ top: 0, right: 10, left: 2, bottom: 0 }}><CartesianGrid horizontal={false} /><XAxis type="number" domain={[0, "dataMax + 1"]} tickLine={false} axisLine={false} /><YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={35} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="roas" radius={[0, 4, 4, 0]}>{roasData.map((entry, index) => <Cell key={entry.name} fill={entry.roas < 4 ? "#ff7357" : chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Retorno em promoções</h3><div className="panel-kicker">Receita gerada por real investido pela loja.</div></div><Target size={17} color="#739a86" /></div><div className="chart-shell"><ResponsiveContainer width="100%" height="100%"><BarChart data={promoData.slice(0, 8)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}x`} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="promoReturn" fill="#739a86" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">CAC versus ticket médio</h3><div className="panel-kicker">Quanto custa comprar um pedido versus o que ele vale.</div></div><CircleDollarSign size={17} color="#ff7357" /></div><div className="chart-shell"><ResponsiveContainer width="100%" height="100%"><BarChart data={scatterData} margin={{ top: 5, right: 5, left: -12, bottom: 0 }}><CartesianGrid vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="ticket" fill="#315f68" radius={[4, 4, 0, 0]} /><Bar dataKey="cac" fill="#ff7357" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Gap de plataforma</h3><div className="panel-kicker">Impacto médio de deduções sobre a margem.</div></div><TrendingDown size={17} color="#ffad96" /></div><div className="metric-value" style={{ color: "#ffad96", marginTop: 28 }}>{formatCurrency(averagePlatformImpact)}</div><div className="metric-foot" style={{ color: "#a7c0ba" }}>por loja / média do período</div><div className="inline-form-tip" style={{ marginTop: 26, background: "rgba(255,115,87,.1)", color: "#ffc4b3", borderColor: "#ff7357" }}>A diferença entre margem bruta e líquida mostra quanto a plataforma e os investimentos estão capturando antes do resultado.</div></div></section>
    <section className="section-block"><div className="panel table-panel"><div className="table-toolbar"><div><h3 className="panel-title">Sinais de intervenção</h3><div className="panel-kicker">Unidades que combinam dois ou mais pontos de atenção.</div></div><span className="panel-note">automático</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Loja</th><th>ROAS</th><th>CMV %</th><th>Margem bruta</th><th>Margem líquida</th><th>Leitura</th></tr></thead><tbody>{[...stores].sort((a, b) => a.netMarginPct - b.netMarginPct).map((store) => <tr key={store.id}><td><div className="store-cell"><div className="store-avatar">{store.id.slice(1)}</div><div><strong>{store.name}</strong><span>{store.city}</span></div></div></td><td className={`table-value ${store.roas < 4 ? "bad" : "good"}`}>{store.roas.toFixed(1).replace(".", ",")}x</td><td className={`table-value ${store.cmvPct > .7 ? "bad" : ""}`}>{formatPercent(store.cmvPct)}</td><td className="table-value">{formatPercent(store.grossMarginPct)}</td><td className={`table-value ${store.netMargin < 0 ? "bad" : "good"}`}>{formatPercent(store.netMarginPct)}</td><td><span className={`status-dot ${store.health === "crítica" ? "critical" : ""}`}>{store.health === "crítica" ? "Rever anúncios e CMV" : store.health === "atenção" ? "Acompanhar" : "Escalar com cautela"}</span></td></tr>)}</tbody></table></div></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Ranking consolidado</h3><div className="panel-kicker">Todas as lojas por margem líquida, não apenas por venda.</div></div><TrendingUp size={17} color="#739a86" /></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Posição</th><th>Loja</th><th>Venda bruta</th><th>CMV</th><th>Margem bruta</th><th>Venda líquida</th><th>Margem líquida</th><th>ROAS</th></tr></thead><tbody>{globalRanking.map((store, index) => <tr key={store.id} className={store.netMargin < 0 ? "risk-row" : ""}><td>{String(index + 1).padStart(2, "0")}</td><td style={{ textAlign: "left" }}><strong>{store.name}</strong><span style={{ display: "block", color: "#8a9690", fontSize: 10 }}>{store.city}</span></td><td>{formatCurrency(store.grossSales)}</td><td>{formatCurrency(store.cmv)}</td><td>{formatPercent(store.grossMarginPct)}</td><td>{formatCurrency(store.netSales)}</td><td className={store.netMargin < 0 ? "table-value bad" : "table-value good"}>{formatPercent(store.netMarginPct)}</td><td>{store.roas.toFixed(1).replace(".", ",")}x</td></tr>)}</tbody></table></div></div><div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Alertas globais</h3><div className="panel-kicker">Pontos de intervenção e oportunidades.</div></div><Bell size={17} color="#ffad96" /></div><div className="alert-list"><div className="alert-row coral-rail"><div className="alert-dot" /><div><strong>{negativeStores.length} lojas com margem líquida negativa</strong><p>{negativeStores.map((store) => store.id).join(", ") || "Nenhuma"}</p></div></div><div className="alert-row amber-rail"><div className="alert-dot amber" /><div><strong>{weakRoasStores.length} lojas abaixo de ROAS 4x</strong><p>{weakRoasStores.map((store) => store.id).join(", ") || "Nenhuma"}</p></div></div><div className="alert-row"><div className="alert-dot amber" /><div><strong>{criticalCmvStores.length} lojas com CMV acima de 70%</strong><p>{criticalCmvStores.map((store) => store.id).join(", ") || "Nenhuma"}</p></div></div><div className="alert-row"><CheckCircle2 size={16} color="#a8c3a0" /><div><strong>Melhor performance: {bestStore?.name}</strong><p>Margem líquida de {bestStore ? formatPercent(bestStore.netMarginPct) : "—"}.</p></div></div><div className="alert-row"><AlertTriangle size={16} color="#ffad96" /><div><strong>Intervenção imediata: {interventionStore?.name}</strong><p>Margem líquida de {interventionStore ? formatCurrency(interventionStore.netMargin) : "—"}.</p></div></div></div></div></section>
    <section className="section-block content-grid"><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Produtos em 3+ lojas</h3><div className="panel-kicker">Oportunidades de padronização de estoque e mix.</div></div><Package size={17} color="#ff7357" /></div><div className="compact-list">{sharedProducts.map((product) => <div className="compact-row" key={`${product.category}-${product.name}`}><div><strong>{product.name}</strong><span>{product.category} · {product.storeIds.length} lojas: {product.storeIds.join(", ")}</span></div><b>{formatCurrency(product.revenue)}</b></div>)}</div></div><div className="panel"><div className="panel-header"><div><h3 className="panel-title">Análise crítica</h3><div className="panel-kicker">Leitura executiva automática do fechamento.</div></div><ClipboardList size={17} color="#e1a254" /></div><div className="critical-copy"><p>O consolidado reúne {stores.length} lojas e mostra que volume e resultado precisam ser analisados separadamente. A unidade líder é {bestStore?.name}, enquanto {interventionStore?.name} exige prioridade de intervenção por apresentar a menor margem líquida do portfólio.</p><p>Os anúncios estão destruindo valor principalmente onde o ROAS fica abaixo de 4,0x. Nessas lojas, o investimento pago não recupera o custo de aquisição com a mesma eficiência das unidades líderes, pressionando a venda líquida após comissão, promoções e custo operacional.</p><p>As lojas com prejuízo devem revisar imediatamente o mix de produtos, o CMV e a verba de anúncios. A primeira ação recomendada é reduzir campanhas de baixo retorno e proteger os itens com margem bruta suficiente para sustentar a comissão de {SIMULATION_COMMISSION_LABEL} e o custo operacional de 5%.</p><p>O Top 10 consolidado revela os segmentos com maior participação e permite identificar concentração. {sharedProducts.length ? `Produtos presentes em três ou mais lojas — como ${sharedProducts.slice(0, 2).map((product) => product.name).join(" e ")} — representam oportunidade de negociação e padronização.` : "Ainda não há produtos presentes em três ou mais lojas no conjunto informado."}</p><p>O segmento dominante deve ser analisado junto do CMV, porque receita concentrada não é sinônimo de margem saudável. A recomendação é priorizar segmentos de boa margem bruta, reduzir itens que combinam baixa rotação com alto custo e testar o mix nas lojas com ROAS e margem abaixo do corte.</p></div></div></section>
  </>;
}

function InputField({ label, value, onChange, prefix }: { label: string; value: string | number; onChange: (value: string) => void; prefix?: string }) {
  const isMoney = prefix === "R$";
  const isNumeric = Boolean(prefix);
  const displayValue = isMoney ? formatBrl(value) : isNumeric ? formatDecimalBr(value) : String(value ?? "");
  const [draftValue, setDraftValue] = useState(displayValue);
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setDraftValue(displayValue); }, [displayValue, editing]);
  const handleBlur = () => { setEditing(false); setDraftValue(isMoney ? formatBrl(parseBrl(draftValue)) : isNumeric ? formatDecimalBr(parseBrl(draftValue)) : draftValue); };
  return <label className="form-label">{label}<div style={{ position: "relative" }}><input inputMode={isNumeric ? "decimal" : "text"} value={draftValue} onFocus={() => setEditing(true)} onChange={(event) => { setDraftValue(event.target.value); onChange(event.target.value); }} onBlur={handleBlur} />{prefix && <span style={{ position: "absolute", right: 10, top: 12, color: "#87948f", fontFamily: "IBM Plex Mono", fontSize: 10 }}>{prefix}</span>}</div></label>;
}

function InlinePtBrInput({ value, onChange, kind, ariaLabel }: { value: number; onChange: (raw: string) => void; kind: "money" | "number" | "percent"; ariaLabel: string }) {
  const displayValue = kind === "money" ? formatBrl(value) : kind === "percent" ? formatDecimalBr(value * 100) : formatDecimalBr(value);
  const [draftValue, setDraftValue] = useState(displayValue);
  const [editing, setEditing] = useState(false);
  useEffect(() => { if (!editing) setDraftValue(displayValue); }, [displayValue, editing]);
  const handleBlur = () => { setEditing(false); setDraftValue(kind === "money" ? formatBrl(parseBrl(draftValue)) : formatDecimalBr(parseBrl(draftValue))); };
  return <input value={draftValue} aria-label={ariaLabel} inputMode="decimal" onFocus={() => setEditing(true)} onChange={(event) => { setDraftValue(event.target.value); onChange(event.target.value); }} onBlur={handleBlur} />;
}

function ImportStatusPanel({ statuses, referenceMonth, onSelectStore }: { statuses: StoreImportStatus[]; referenceMonth: string; onSelectStore: (id: string) => void }) {
  const importedCount = statuses.filter((status) => status.imported).length;
  const pendingCount = statuses.length - importedCount;
  return <section className="section-block" style={{ marginTop: 9 }}><div className="panel import-status-panel"><div className="panel-header"><div><h3 className="panel-title">Controle de importação</h3><div className="panel-kicker">Competência selecionada: {referenceMonth} · chave loja + mês</div></div><div className="import-status-summary"><span className="import-count imported"><CheckCircle2 size={13} /> {importedCount} importada{importedCount === 1 ? "" : "s"}</span><span className="import-count pending"><AlertTriangle size={13} /> {pendingCount} pendente{pendingCount === 1 ? "" : "s"}</span></div></div>{statuses.length ? <div className="import-status-grid">{statuses.map((status) => <button type="button" className={`import-status-card ${status.imported ? "is-imported" : "is-pending"}`} key={status.id} onClick={() => onSelectStore(status.id)}><span className="import-status-icon">{status.imported ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}</span><span className="import-status-copy"><strong>{status.id} · {status.name}</strong><small>{status.city}</small></span><span className="import-status-label">{status.imported ? "Importada" : "Pendente"}</span></button>)}</div> : <div className="empty-state"><strong>Nenhuma loja cadastrada nesta base.</strong><span>Use “Nova loja” para iniciar a importação da competência.</span></div>}<div className="inline-form-tip import-status-note"><strong>Como evitar duplicidade:</strong> se a loja já estiver como “Importada”, salvar novamente a mesma competência apenas atualiza os dados existentes; ao escolher outro mês, uma nova competência é criada sem apagar o histórico.</div></div></section>;
}

function InputView({ draft, updateDraft, updateProduct, saveDraft, onNewStore, onImport, commissionRate, operatingRate, setCommissionRate, setOperatingRate, importStatuses, onSelectStore }: { draft: StoreInput; updateDraft: (key: keyof StoreInput, value: string) => void; updateProduct: (index: number, field: keyof Product, value: string) => void; saveDraft: () => void; onNewStore: () => void; onImport: () => void; commissionRate: number; operatingRate: number; setCommissionRate: (value: number) => void; setOperatingRate: (value: number) => void; importStatuses: StoreImportStatus[]; onSelectStore: (id: string) => void }) {
  return <>
    <ImportStatusPanel statuses={importStatuses} referenceMonth={draft.referenceMonth} onSelectStore={onSelectStore} />
    <section className="section-block" style={{ marginTop: 9 }}><div className="panel dark"><div className="panel-header"><div><h3 className="panel-title">Fluxo de alimentação</h3><div className="panel-kicker">Dia 1–5: receber · Dia 5–7: alimentar · Dia 8: decidir</div></div><div className="top-actions"><button className="control" onClick={onNewStore}><Plus size={14} /> Nova loja</button><button className="control" onClick={onImport}><Upload size={14} /> Importar planilha</button></div></div><div className="alert-list"><div className="alert-row"><div className="alert-dot amber" /><div><strong>Importação controlada por competência</strong><p>Confira o painel acima antes de salvar. Lojas importadas podem ser atualizadas no mesmo mês sem criar duplicidade; outra competência preserva o histórico.</p></div></div></div></div></section>
    <section className="section-block form-shell"><div className="form-step"><div className="section-heading"><div><div className="eyebrow">Entrada 01 / cadastro</div><h3>Desempenho do mês</h3><p>Fonte: Portal do Parceiro iFood · aba Desempenho.</p></div><span className="panel-note">{draft.id}</span></div><div className="form-grid"><InputField label="Nome da loja" value={draft.name} onChange={(value) => updateDraft("name", value)} /><InputField label="Cidade" value={draft.city} onChange={(value) => updateDraft("city", value)} /><label className="form-label">Mês de referência<div><select className="select-field" aria-label="Mês de referência da loja" value={draft.referenceMonth} onChange={(event) => updateDraft("referenceMonth", event.target.value)} style={{ width: "100%", marginTop: 6 }}>{REFERENCE_MONTHS_2026.map((referenceMonth) => <option key={referenceMonth} value={referenceMonth}>{referenceMonth}</option>)}</select></div></label><InputField label="Venda bruta total" value={draft.grossSales} onChange={(value) => updateDraft("grossSales", value)} prefix="R$" /><InputField label="Total de pedidos" value={draft.orders} onChange={(value) => updateDraft("orders", value)} /><InputField label="Novos clientes" value={draft.newCustomers} onChange={(value) => updateDraft("newCustomers", value)} /></div></div>
    <div className="form-step"><div className="section-heading"><div><div className="eyebrow">Entrada 02 / promoções</div><h3>Investimento em promoções</h3><p>Separe o que sai da loja do que é financiado pelo iFood.</p></div><span className="panel-note">iFood / promoções</span></div><div className="form-grid"><InputField label="Vendas com promoção" value={draft.promoSales} onChange={(value) => updateDraft("promoSales", value)} prefix="R$" /><InputField label="Pedidos com promoção" value={draft.promoOrders} onChange={(value) => updateDraft("promoOrders", value)} /><InputField label="Investimento da loja" value={draft.storePromoInvestment} onChange={(value) => updateDraft("storePromoInvestment", value)} prefix="R$" /><InputField label="Investimento do iFood" value={draft.ifoodPromoInvestment} onChange={(value) => updateDraft("ifoodPromoInvestment", value)} prefix="R$" /><InputField label="Retorno por real investido" value={draft.promoReturn} onChange={(value) => updateDraft("promoReturn", value)} prefix="x" /><InputField label="Clientes recuperados" value={draft.recoveredCustomers} onChange={(value) => updateDraft("recoveredCustomers", value)} /></div></div>
    <div className="form-step"><div className="section-heading"><div><div className="eyebrow">Entrada 03 / anúncios</div><h3>Aquisição paga</h3><p>Fonte: Portal do Parceiro iFood · aba Anúncios.</p></div><span className="panel-note">iFood / anúncios</span></div><div className="form-grid"><InputField label="ROAS" value={draft.roas} onChange={(value) => updateDraft("roas", value)} prefix="x" /><InputField label="Vendas via anúncios" value={draft.adSales} onChange={(value) => updateDraft("adSales", value)} prefix="R$" /><InputField label="Pedidos via anúncios" value={draft.adOrders} onChange={(value) => updateDraft("adOrders", value)} /><InputField label="Visitas via anúncios" value={draft.adVisits} onChange={(value) => updateDraft("adVisits", value)} /><InputField label="Conversão no cardápio" value={draft.conversion} onChange={(value) => updateDraft("conversion", value)} prefix="%" /><InputField label="Investimento total" value={draft.adInvestment} onChange={(value) => updateDraft("adInvestment", value)} prefix="R$" /></div></div>
    <div className="form-step"><div className="section-heading"><div><div className="eyebrow">Entrada 04 / Vetor Farma</div><h3>Custo da mercadoria vendida</h3><p>O único dado que não vem do iFood e que decide a margem bruta.</p></div><span className="panel-note">Vetor Farma</span></div><div className="form-grid"><InputField label="CMV do mês" value={draft.cmv} onChange={(value) => updateDraft("cmv", value)} prefix="R$" /><InputField label="Taxa de comissão iFood" value={commissionRate} onChange={(value) => setCommissionRate(parseBrl(value))} prefix="%" /><InputField label="Custo operacional" value={operatingRate} onChange={(value) => setOperatingRate(parseBrl(value))} prefix="%" /></div><div className="inline-form-tip"><strong>Fórmula aplicada:</strong> margem líquida = venda bruta − CMV − descontos − comissão iFood − anúncios − custo operacional. Salve para recalcular ranking e alertas.</div></div>
    <div className="form-step product-input-step"><div className="section-heading"><div><div className="eyebrow">Entrada 05 / catálogo</div><h3>Top 10 produtos</h3><p>Fonte: Portal do Parceiro iFood · Desempenho &gt; Catálogo. Receita por produto e categoria alimentam as análises consolidadas.</p></div><span className="panel-note">10 linhas</span></div><div className="product-input-grid">{draft.products.slice(0, 10).map((product, index) => <div className="product-input-row" key={`${product.name}-${index}`}><span className="rank-number">{String(index + 1).padStart(2, "0")}</span><input value={product.category} aria-label={`Segmento do produto ${index + 1}`} onChange={(event) => updateProduct(index, "category", event.target.value)} /><input value={product.name} aria-label={`Nome do produto ${index + 1}`} onChange={(event) => updateProduct(index, "name", event.target.value)} /><InlinePtBrInput value={product.orders} kind="number" ariaLabel={`Quantidade do produto ${index + 1}`} onChange={(value) => updateProduct(index, "orders", value)} /><InlinePtBrInput value={product.shareOrders} kind="percent" ariaLabel={`Percentual de pedidos do produto ${index + 1}`} onChange={(value) => updateProduct(index, "shareOrders", value)} /><InlinePtBrInput value={product.revenue} kind="money" ariaLabel={`Receita do produto ${index + 1}`} onChange={(value) => updateProduct(index, "revenue", value)} /></div>)}</div><div className="product-input-labels"><span>#</span><span>Segmento</span><span>Produto</span><span>Qtd</span><span>% pedidos</span><span>Receita (R$)</span></div></div>
    <div className="form-actions"><button className="control" onClick={() => toast.info("Alterações descartadas", { description: "O formulário permanece com os dados salvos anteriormente." })}>Descartar</button><button className="control primary" onClick={saveDraft}><CheckCircle2 size={15} /> Calcular e salvar</button></div></section>
  </>;
}
