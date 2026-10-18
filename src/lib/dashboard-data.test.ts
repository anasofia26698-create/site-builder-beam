import { describe, expect, test } from "bun:test";
import { buildImportStatus, createEmptyStore, getCommissionRateForMonth, selectStoreAtReferenceMonth } from "./dashboard-data";

const store = { ...createEmptyStore("L001", "Setembro 2026"), name: "Loja teste", city: "Curitiba", grossSales: 900, orders: 12, cmv: 200 };
const snapshot = { ...store, id: "snapshot-id", storeId: "L001", referenceMonth: "Setembro 2026", grossSales: 1500, orders: 20, productsJson: JSON.stringify([{ category: "Saúde", name: "Produto", orders: 3, shareOrders: 0.15, revenue: 200 }]) };

describe("Entrada por competência", () => {
  test("carrega valores salvos e preserva o ID da loja, não o ID do snapshot", () => {
    const loaded = selectStoreAtReferenceMonth(store, "Setembro 2026", [snapshot]);
    expect(loaded.id).toBe("L001");
    expect(loaded.referenceMonth).toBe("Setembro 2026");
    expect(loaded.grossSales).toBe(1500);
    expect(loaded.orders).toBe(20);
    expect(loaded.products[0]?.revenue).toBe(200);
  });
  test("competência pendente preserva identidade e zera todas as métricas e produtos", () => {
    const pending = selectStoreAtReferenceMonth(store, "Outubro 2026", [snapshot]);
    expect(pending).toEqual({ ...createEmptyStore("L001", "Outubro 2026"), name: "Loja teste", city: "Curitiba", status: store.status });
  });
  test("controle indica importação somente no mês ativo", () => {
    expect(buildImportStatus([store], [snapshot], "Setembro 2026")[0]?.imported).toBe(true);
    expect(buildImportStatus([store], [snapshot], "Outubro 2026")[0]?.imported).toBe(false);
  });
  test("comissão acompanha a competência: 14% em setembro e 10,5% em outubro", () => {
    expect(getCommissionRateForMonth("Setembro 2026")).toBe(0.14);
    expect(getCommissionRateForMonth("Outubro 2026")).toBe(0.105);
  });
});