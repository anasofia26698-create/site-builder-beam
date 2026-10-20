import { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, Database, FileText, Save, Store, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StoreInput } from "@/lib/dashboard-data";
import { formatCurrency, formatNumber, formatPercent, REFERENCE_MONTHS_2026 } from "@/lib/dashboard-data";
import { aggregateFappPeriod, calculateFapp, emptyFapp, type FappRecord } from "@/lib/fapp-data";
import FappForm from "@/components/fapp/FappForm";

type FappTab = "input" | "dashboard" | "stores";

type FarmaciasAppProps = {
  period: string;
  setPeriod: (value: string) => void;
  catalog: StoreInput[];
  ifoodSnapshots: unknown[];
};

type Summary = {
  month: string;
  gmv: number;
  orders: number;
  commission: number;
  infiniteShelfSales: number;
  activeStores: number;
  storesWithSales: number;
  cancellation: number | null;
  rating: number | null;
  margin: number | null;
  coverage: number;
  projection: number | null;
  alerts: string[];
};

const monthIndex = (month: string) => REFERENCE_MONTHS_2026.indexOf(month);
const previousMonth = (month: string) => {
  const index = monthIndex(month);
  return index > 0 ? REFERENCE_MONTHS_2026[index - 1] : null;
};
const activeForAverage = (record: FappRecord) => record.status !== "Inativa";
const monthSummary = (month: string, records: FappRecord[], firstFive = false): Summary => {
  const monthRecords = records.filter((record) => record.referenceMonth === month);
  const averageRecords = monthRecords.filter(activeForAverage);
  const values = monthRecords.map((record) => calculateFapp(record));
  const gmv = firstFive ? monthRecords.reduce((sum, record) => sum + record.firstFiveSales, 0) : monthRecords.reduce((sum, record) => sum + record.gmv, 0);
  const orders = firstFive ? monthRecords.reduce((sum, record) => sum + record.firstFiveOrders, 0) : monthRecords.reduce((sum, record) => sum + record.orders, 0);
  const completeMargin = averageRecords.filter((record) => record.cmv !== null);
  const margin = completeMargin.length === averageRecords.length && completeMargin.length > 0 ? completeMargin.reduce((sum, record) => sum + (calculateFapp(record).netMargin ?? 0), 0) : null;
  const alerts: string[] = [];
  if (averageRecords.some((record) => record.cancellation > 10)) alerts.push("Cancelamento acima de 10%");
  if (averageRecords.some((record) => record.rating !== null && record.rating < 4.5)) alerts.push("Nota abaixo de 4,5");
  if (monthRecords.some((record) => calculateFapp(record).freightPct !== null && (calculateFapp(record).freightPct ?? 0) > 0.8)) alerts.push("Frete acima de 80%");
  if (averageRecords.some((record) => record.cmv === null)) alerts.push("CMV ausente: margem pendente");
  if (monthRecords.some((record) => record.campaigns.some((campaign) => campaign.participated && (!campaign.invoiceReceived || !campaign.invoicePaid)))) alerts.push("NF pendente");
  const projection = monthRecords.find((record) => record.cutoff && !record.closed);
  return {
    month,
    gmv,
    orders,
    commission: values.reduce((sum, result) => sum + result.commission, 0),
    infiniteShelfSales: monthRecords.reduce((sum, record) => sum + record.infiniteShelfSales, 0),
    activeStores: averageRecords.length,
    storesWithSales: averageRecords.filter((record) => record.gmv > 0).length,
    cancellation: averageRecords.length ? averageRecords.reduce((sum, record) => sum + record.cancellation, 0) / averageRecords.length : null,
    rating: averageRecords.filter((record) => record.rating !== null).length ? averageRecords.reduce((sum, record) => sum + (record.rating ?? 0), 0) / averageRecords.filter((record) => record.rating !== null).length : null,
    margin,
    coverage: averageRecords.length ? completeMargin.length / averageRecords.length : 0,
    projection: projection ? calculateFapp(projection).projection : null,
    alerts,
  };
};

const fappMoney = (value: number | null | undefined) => value === null || value === undefined || value === 0 ? "Pendente" : formatCurrency(value);

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <article className="fapp-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function EmptyFapp({ children }: { children: string }) {
  return <div className="fapp-empty"><Database size={22} /><strong>{children}</strong><span>Sem dados fictícios: informe uma competência real para iniciar.</span></div>;
}

function FappDashboard({ records, period, setPeriod }: { records: FappRecord[]; period: string; setPeriod: (value: string) => void }) {
  const [firstFive, setFirstFive] = useState(false);
  const summaries = REFERENCE_MONTHS_2026.map((month) => monthSummary(month, records, firstFive));
  const current = summaries.find((summary) => summary.month === period) ?? summaries[0];
  const previous = previousMonth(period);
  const previousSummary = previous ? summaries.find((summary) => summary.month === previous) : undefined;
  const variation = (value: number, oldValue: number) => oldValue > 0 ? `${formatPercent((value - oldValue) / oldValue)} vs. mês anterior` : "Sem comparação";
  const hasData = records.some((record) => record.referenceMonth === period);
  return <>
    <section className="fapp-hero"><div><div className="eyebrow">Farmácias App / dashboard</div><h1 className="page-title">O fechamento mês a mês, sem preencher lacunas.</h1><p>Margens, repasses, campanhas e cobertura de CMV somente quando houver dados informados pela equipe.</p></div><TrendingUp size={34} /></section>
    <section className="fapp-toolbar"><label className="form-label">Competência<select value={period} onChange={(event) => setPeriod(event.target.value)}>{REFERENCE_MONTHS_2026.map((month) => <option key={month}>{month}</option>)}</select></label><label className="fapp-toggle"><input type="checkbox" checked={firstFive} onChange={(event) => setFirstFive(event.target.checked)} /> Modo dias 1–5</label></section>
    {!hasData ? <EmptyFapp> Ainda não há dados lançados em {period}. </EmptyFapp> : <>
      <section className="fapp-metric-grid"><Metric label="GMV consolidado" value={formatCurrency(current.gmv)} note={firstFive ? "dias 1–5" : variation(current.gmv, previousSummary?.gmv ?? 0)} /><Metric label="Pedidos" value={formatNumber(current.orders)} note={variation(current.orders, previousSummary?.orders ?? 0)} /><Metric label="Ticket médio" value={current.orders ? formatCurrency(current.gmv / current.orders) : "—"} note="calculado" /><Metric label="Comissão" value={formatCurrency(current.commission)} note="prevista ou efetiva" /><Metric label="Prateleira Infinita" value={formatCurrency(current.infiniteShelfSales)} note="registrada" /><Metric label="Margem líquida" value={current.margin === null ? "Pendente" : formatCurrency(current.margin)} note={current.margin === null ? `${Math.round(current.coverage * 100)}% das lojas com CMV` : variation(current.margin, previousSummary?.margin ?? 0)} /></section>
      <section className="fapp-grid"><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>Janeiro a dezembro de 2026</h2><p>Meses sem registro aparecem vazios.</p></div><BarChart3 size={18} /></div><div className="fapp-month-table">{summaries.map((summary) => <button type="button" className={summary.month === period ? "selected" : ""} key={summary.month} onClick={() => setPeriod(summary.month)}><span>{summary.month.replace(" 2026", "")}</span><strong>{summary.gmv ? formatCurrency(summary.gmv) : "—"}</strong><small>{summary.gmv ? `${summary.storesWithSales} lojas com venda` : "Sem dados"}</small></button>)}</div></div><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>Leitura do mês</h2><p>Indicadores que exigem conferência.</p></div><ClipboardList size={18} /></div><div className="fapp-stat-list"><div><span>Lojas ativas</span><strong>{current.activeStores}</strong></div><div><span>Lojas com venda</span><strong>{current.storesWithSales}</strong></div><div><span>Cancelamento médio</span><strong>{current.cancellation === null ? "—" : formatPercent(current.cancellation / 100)}</strong></div><div><span>Nota média</span><strong>{current.rating === null ? "—" : current.rating.toFixed(2).replace(".", ",")}</strong></div><div><span>Projeção</span><strong>{current.projection === null ? "—" : `${formatCurrency(current.projection)} · projeção`}</strong></div></div><ul className="fapp-alerts">{current.alerts.length ? current.alerts.map((alert) => <li key={alert}>{alert}</li>) : <li>Sem alertas no mês informado.</li>}</ul></div></section>
    </>}
  </>;
}

function StoreView({ record, catalog, records, period, setPeriod, setRecord }: { record: FappRecord | null; catalog: StoreInput[]; records: FappRecord[]; period: string; setPeriod: (value: string) => void; setRecord: (record: FappRecord) => void }) {
  if (!record) return <EmptyFapp>Selecione uma loja do catálogo compartilhado.</EmptyFapp>;
  const result = calculateFapp(record);
  const history = REFERENCE_MONTHS_2026.map((month) => {
    const item = records.find((candidate) => candidate.storeId === record.storeId && candidate.referenceMonth === month);
    return { month: month.replace(" 2026", ""), result: item ? calculateFapp(item) : null, gmv: item?.gmv ?? null };
  });
  const products = record.products.filter((product) => product.name).sort((a, b) => b.revenue - a.revenue);
  const productRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  return <>
    <section className="fapp-toolbar"><label className="form-label">Loja<select value={record.storeId} onChange={(event) => setRecord(emptyFapp(event.target.value, period))}>{catalog.map((store) => <option key={store.id} value={store.id}>{store.id} · {store.name} · {store.city}</option>)}</select></label><label className="form-label">Competência<select value={period} onChange={(event) => setPeriod(event.target.value)}>{REFERENCE_MONTHS_2026.map((month) => <option key={month}>{month}</option>)}</select></label></section>
    <section className="fapp-grid"><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>DRE · {catalog.find((store) => store.id === record.storeId)?.name ?? record.storeId}</h2><p>Competência {record.referenceMonth}. Fórmulas disponíveis nas dicas dos valores.</p></div><FileText size={18} /></div><div className="fapp-dre"><div><span>Venda bruta (GMV)</span><strong>{fappMoney(record.gmv)}</strong></div><div><span>(−) CMV → margem bruta</span><strong>{result.grossMargin === null ? "Pendente" : formatCurrency(result.grossMargin)}</strong></div><div title="Comissão prevista = GMV × taxa. Comissão real somente com fechamento completo e repasses conciliados."><span>(−) Comissão</span><strong>{record.gmv ? formatCurrency(result.commission) : "Pendente"}</strong></div><div><span>(−) Frete usado</span><strong>{fappMoney(record.freightUsed)}</strong></div><div title="Soma dos custos de campanhas conforme o modelo selecionado."><span>(−) Ações e campanhas</span><strong>{record.gmv ? formatCurrency(result.actions) : "Pendente"}</strong></div><div><span>(−) Cupons e descontos</span><strong>{fappMoney(record.discounts)}</strong></div><div><span>(−) Perdas</span><strong>{fappMoney(record.losses)}</strong></div><div><span>(−) Operacional</span><strong>{record.gmv ? formatCurrency(record.gmv * record.operatingRate / 100) : "Pendente"}</strong></div><div className="total"><span>(=) Margem líquida</span><strong>{result.netMargin === null ? "Pendente" : `${formatCurrency(result.netMargin)} · ${formatPercent(result.netMarginPct ?? 0)}`}</strong></div></div></div><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>Histórico mensal</h2><p>Somente competências salvas ou preenchidas nesta sessão.</p></div><BarChart3 size={18} /></div><div className="fapp-history">{history.map((item) => <div key={item.month} title={item.gmv === null ? "Sem dados" : `${item.month}: ${formatCurrency(item.gmv)}`}><span>{item.month.slice(0, 3)}</span><i style={{ height: `${item.gmv ? Math.max(8, Math.min(100, item.gmv / Math.max(...history.map((point) => point.gmv ?? 0), 1) * 100)) : 3}%` }} /><small>{item.gmv ? formatCurrency(item.gmv) : "—"}</small></div>)}</div></div></section>
    <section className="fapp-grid"><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>Top 10 do mês</h2><p>Participação por segmento calculada sobre a receita informada.</p></div><Store size={18} /></div>{products.length ? <div className="fapp-product-list">{products.map((product) => <div key={`${product.ean}-${product.name}`}><span><strong>{product.name}</strong><small>{product.ean || "EAN não informado"}</small></span><b>{formatPercent(productRevenue ? product.revenue / productRevenue : 0)}</b></div>)}</div> : <EmptyFapp>Não há produtos informados nesta competência.</EmptyFapp>}</div><div className="fapp-panel"><div className="fapp-panel-heading"><div><h2>Alertas da loja</h2><p>Regras do plano aplicadas ao registro atual.</p></div><LockKeyhole size={18} /></div><ul className="fapp-alerts">{result.alerts.length ? result.alerts.map((alert) => <li key={alert}>{alert}</li>) : <li>Nenhum alerta ativo.</li>}</ul></div></section>
  </>;
}

export default function FarmaciasApp({ period, setPeriod, catalog }: FarmaciasAppProps) {
  const [tab, setTab] = useState<FappTab>("input");
  const officialCatalog = useMemo(() => catalog.filter((store) => /^L00[1-9]$|^L01[0-2]$/.test(store.id)), [catalog]);
  const [selectedStoreId, setSelectedStoreId] = useState(officialCatalog[0]?.id ?? "");
  const [records, setRecords] = useState<FappRecord[]>([]);
  const [draft, setDraft] = useState<FappRecord | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (officialCatalog.length && !officialCatalog.some((store) => store.id === selectedStoreId)) setSelectedStoreId(officialCatalog[0].id);
  }, [officialCatalog, selectedStoreId]);
  useEffect(() => {
    if (!selectedStoreId) return;
    const saved = records.find((record) => record.storeId === selectedStoreId && record.referenceMonth === period);
    setDraft(saved ?? emptyFapp(selectedStoreId, period));
  }, [records, selectedStoreId, period]);

  const selectedRecord = draft?.storeId === selectedStoreId && draft.referenceMonth === period ? draft : null;
  const changeDraft = (next: FappRecord) => { setDraft(next); setRecords((current) => [...current.filter((record) => !(record.storeId === next.storeId && record.referenceMonth === next.referenceMonth)), next]); };
  const saveDraft = () => setNotice("Não gravado: a persistência no banco aguarda aprovação explícita do SQL. Os campos continuam disponíveis nesta sessão.");
  const discard = () => { const saved = records.find((record) => record.storeId === selectedStoreId && record.referenceMonth === period); setDraft(saved ?? emptyFapp(selectedStoreId, period)); setNotice(""); };
  const catalogReady = officialCatalog.length > 0;

  return <section className="fapp-app"><div className="fapp-heading"><div><div className="eyebrow">Resultado / Farmácias App</div><h1 className="page-title">O canal de farmácias com rastreabilidade.</h1><p className="page-subtitle">Entrada, consolidado e loja a loja em um único espaço. Sem CMV, a margem permanece pendente.</p></div></div><nav className="fapp-tabs" aria-label="Seções do Farmácias App">{([ ["input", "Inserir dados", Save], ["dashboard", "Dashboard", BarChart3], ["stores", "Loja a loja", FileText] ] as const).map(([key, label, Icon]) => <button type="button" className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)}><Icon size={15} />{label}</button>)}</nav>{!catalogReady && <div className="fapp-pending"><Store size={17} /><strong>Catálogo pendente de confirmação.</strong><span>Conecte o catálogo oficial L001–L012 para começar. Nenhum dado fictício será criado.</span></div>}{notice && <div className="fapp-notice"><ClipboardList size={16} />{notice}</div>}{tab === "input" && catalogReady && selectedRecord && <><div className="fapp-toolbar"><label className="form-label">Loja do catálogo<select value={selectedStoreId} onChange={(event) => { setSelectedStoreId(event.target.value); setNotice(""); }}>{officialCatalog.map((store) => <option key={store.id} value={store.id}>{store.id} · {store.name} · {store.city}</option>)}</select></label><label className="form-label">Mês de referência<select value={period} onChange={(event) => { setPeriod(event.target.value); setNotice(""); }}>{REFERENCE_MONTHS_2026.map((month) => <option key={month}>{month}</option>)}</select></label></div><FappForm draft={selectedRecord} setDraft={changeDraft} save={saveDraft} busy={false} discard={discard} /></>}{tab === "dashboard" && <FappDashboard records={records} period={period} setPeriod={setPeriod} />}{tab === "stores" && <StoreView record={selectedRecord} catalog={officialCatalog} records={records} period={period} setPeriod={setPeriod} setRecord={(next) => { setSelectedStoreId(next.storeId); changeDraft(next); }} />}</section>;
}
