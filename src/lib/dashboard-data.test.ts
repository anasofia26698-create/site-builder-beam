import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { aggregatePeriodMetrics, aggregateProducts, aggregateSegments, buildImportStatus, calculateMetrics, createEmptyStore, getCommissionRateForMonth, getLatestDataMonths, getStoreAlerts, OFFICIAL_STORE_CATALOG, resolveStoreInputs, selectStoreAtReferenceMonth, togglePeriodMonth } from "./dashboard-data";

const store = { ...createEmptyStore("L001", "Setembro 2026"), name: "Loja teste", city: "Curitiba", grossSales: 900, orders: 12, cmv: 200 };
const snapshot = { ...store, id: "snapshot-id", storeId: "L001", referenceMonth: "Setembro 2026", grossSales: 1500, orders: 20, productsJson: JSON.stringify([{ category: "Saúde", name: "Produto", orders: 3, shareOrders: 0.15, revenue: 200 }]) };

describe("Entrada por competência", () => {
  test("resolve somente as 12 lojas oficiais e ignora registros fora do catálogo", () => {
    const outside = { ...snapshot, id: "L013", name: "Duplicada", city: "Curitiba", storeId: "L013" };
    const resolved = resolveStoreInputs([snapshot, outside], []);
    assert.equal(OFFICIAL_STORE_CATALOG.length, 12);
    assert.deepEqual(resolved.map((item) => item.id), OFFICIAL_STORE_CATALOG.map((item) => item.id));
    assert.equal(resolved.some((item) => item.id === "L013"), false);
    assert.equal(resolved.find((item) => item.id === "L001")?.name, OFFICIAL_STORE_CATALOG[0].name);
  });
  test("carrega valores salvos e preserva o ID da loja, não o ID do snapshot", () => {
    const loaded = selectStoreAtReferenceMonth(store, "Setembro 2026", [snapshot]);
    assert.equal(loaded.id, "L001");
    assert.equal(loaded.referenceMonth, "Setembro 2026");
    assert.equal(loaded.grossSales, 1500);
    assert.equal(loaded.orders, 20);
    assert.equal(loaded.products[0]?.revenue, 200);
  });
  test("competência pendente preserva identidade e zera todas as métricas e produtos", () => {
    const pending = selectStoreAtReferenceMonth(store, "Outubro 2026", [snapshot]);
    assert.deepEqual(pending, { ...createEmptyStore("L001", "Outubro 2026"), name: "Loja teste", city: "Curitiba", status: store.status });
  });
  test("controle indica importação somente no mês ativo", () => {
    assert.equal(buildImportStatus([store], [snapshot], "Setembro 2026")[0]?.imported, true);
    assert.equal(buildImportStatus([store], [snapshot], "Outubro 2026")[0]?.imported, false);
  });
  test("comissão acompanha a competência: 14% em setembro e 10,5% em outubro", () => {
    assert.equal(getCommissionRateForMonth("Setembro 2026"), 0.14);
    assert.equal(getCommissionRateForMonth("Outubro 2026"), 0.105);
  });
});

describe("Análise por segmento", () => {
  test("agrega toda a receita do Top 10 e classifica produtos sem segmento", () => {
    const products = [
      { category: "Medicamentos", name: "Produto A", orders: 1, shareOrders: 0.5, revenue: 600 },
      { category: "", name: "Produto B", orders: 1, shareOrders: 0.5, revenue: 400 },
    ];
    const segments = aggregateSegments([{ ...store, products }]);
    const mappedRevenue = segments.reduce((sum, segment) => sum + segment.revenue, 0);
    const percentages = segments.map((segment) => segment.revenue / mappedRevenue);

    assert.equal(mappedRevenue, 1000);
    assert.deepEqual(segments.map((segment) => segment.category), ["Medicamentos", "Sem segmento"]);
    assert.ok(Math.abs(percentages.reduce((sum, percentage) => sum + percentage, 0) - 1) < Number.EPSILON);
  });
});

describe("Indicadores de anúncios", () => {
  test("calcula CAC e ticket de anúncios a partir dos pedidos via anúncios", () => {
    const metrics = calculateMetrics({ ...store, adInvestment: 300, adSales: 500, adOrders: 10 });
    assert.equal(metrics.cac, 30);
    assert.equal(metrics.adTicket, 50);
  });
  test("mantém CAC e ticket de anúncios em zero quando não há pedidos via anúncios", () => {
    const metrics = calculateMetrics({ ...store, adInvestment: 300, adSales: 500, adOrders: 0 });
    assert.equal(metrics.cac, 0);
    assert.equal(metrics.adTicket, 0);
  });
  test("dispara alerta quando o CAC supera o ticket de anúncios", () => {
    const metrics = calculateMetrics({ ...store, adInvestment: 600, adSales: 500, adOrders: 10 });
    assert.ok(getStoreAlerts(metrics).some((alert) => alert.title === "CAC MAIOR QUE TICKET MÉDIO"));
  });
  test("calcula ROAS a partir de vendas e investimento em anúncios", () => {
    const metrics = calculateMetrics({ ...store, adSales: 1000, adInvestment: 250, adOrders: 10 });
    assert.equal(metrics.roas, 4);
  });
  test("mantém ROAS zero sem investimento e não cria alerta de corte", () => {
    const metrics = calculateMetrics({ ...store, adSales: 1000, adInvestment: 0, adOrders: 10 });
    assert.equal(metrics.roas, 0);
    assert.equal(getStoreAlerts(metrics).some((alert) => alert.title === "ROAS ABAIXO DO CORTE DE 4,0x"), false);
  });
  test("mantém verde no corte exato e vermelho abaixo dele", () => {
    const atCut = calculateMetrics({ ...store, adSales: 1000, adInvestment: 250 });
    const belowCut = calculateMetrics({ ...store, adSales: 1000, adInvestment: 1000 / 3.9 });
    assert.ok(atCut.roas >= 4);
    assert.ok(belowCut.roas < 4);
    assert.ok(getStoreAlerts(belowCut).some((alert) => alert.title === "ROAS ABAIXO DO CORTE DE 4,0x"));
  });
});

describe("Visão consolidada por período", () => {
  const snapshotFor = (storeId: string, month: string, sales: number, orders: number, cmv: number) => ({
    ...createEmptyStore(storeId, month), id: storeId, storeId, name: storeId === "L001" ? "Loja A" : "Loja B", city: "Curitiba", referenceMonth: month, grossSales: sales, orders, cmv, adSales: sales / 2, adInvestment: sales / 8, adOrders: Math.max(1, Math.round(orders / 5)), productsJson: JSON.stringify([{ category: "Saúde", name: "Produto comum", orders, shareOrders: 1, revenue: sales }]),
  });
  test("soma três meses e aplica a comissão de cada competência antes do total", () => {
    const result = aggregatePeriodMetrics([
      snapshotFor("L001", "Setembro 2026", 1000, 10, 400),
      snapshotFor("L001", "Outubro 2026", 2000, 20, 800),
      snapshotFor("L002", "Outubro 2026", 500, 5, 200),
      snapshotFor("L002", "Novembro 2026", 700, 7, 280),
    ], ["Setembro 2026", "Outubro 2026", "Novembro 2026"]);
    assert.equal(result.pairs, 4);
    assert.equal(result.possiblePairs, 6);
    assert.equal(result.totals.grossSales, 4200);
    assert.equal(result.totals.orders, 42);
    assert.equal(result.totals.commission, 140 + 210 + 52.5 + 73.5);
    assert.equal(result.totals.grossMarginPct, result.totals.grossMargin / result.totals.grossSales);
    assert.equal(result.storesWithData, 2);
    assert.equal(result.monthly[0]?.pairs, 1);
    assert.equal(result.monthly[1]?.pairs, 2);
  });
  test("não trata mês sem snapshot como zero para a loja ausente", () => {
    const result = aggregatePeriodMetrics([snapshotFor("L001", "Setembro 2026", 1000, 10, 400)], ["Setembro 2026", "Outubro 2026"]);
    assert.equal(result.pairs, 1);
    assert.equal(result.stores[0]?.grossSales, 1000);
    assert.equal(result.monthly[1]?.metrics, null);
  });
  test("atalho usa os três meses mais recentes com dados e bloqueia o quarto", () => {
    assert.deepEqual(getLatestDataMonths(["Janeiro 2026", "Março 2026", "Agosto 2026", "Outubro 2026"]), ["Março 2026", "Agosto 2026", "Outubro 2026"]);
    const blocked = togglePeriodMonth(["Agosto 2026", "Setembro 2026", "Outubro 2026"], "Novembro 2026");
    assert.equal(blocked.blocked, true);
    assert.deepEqual(blocked.months, ["Agosto 2026", "Setembro 2026", "Outubro 2026"]);
  });
  test("soma o Top 10 pelo mesmo EAN entre competências", () => {
    const products = aggregateProducts([
      { ...store, products: [{ category: "Saúde", name: "Produto A", ean: "789", orders: 2, shareOrders: 1, revenue: 100 }] },
      { ...store, id: "L002", products: [{ category: "Medicamentos", name: "Produto A mês 2", ean: "789", orders: 3, shareOrders: 1, revenue: 150 }] },
    ]);
    assert.equal(products.length, 1);
    assert.equal(products[0]?.orders, 5);
    assert.equal(products[0]?.revenue, 250);
  });
});
