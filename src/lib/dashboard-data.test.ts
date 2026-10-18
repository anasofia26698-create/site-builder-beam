import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildImportStatus, createEmptyStore, getCommissionRateForMonth, selectStoreAtReferenceMonth } from "./dashboard-data";

const store = { ...createEmptyStore("L001", "Setembro 2026"), name: "Loja teste", city: "Curitiba", grossSales: 900, orders: 12, cmv: 200 };
const snapshot = { ...store, id: "snapshot-id", storeId: "L001", referenceMonth: "Setembro 2026", grossSales: 1500, orders: 20, productsJson: JSON.stringify([{ category: "Saúde", name: "Produto", orders: 3, shareOrders: 0.15, revenue: 200 }]) };

describe("Entrada por competência", () => {
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