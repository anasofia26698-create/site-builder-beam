import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { calculateFapp, emptyCampaign, emptyFapp, parsePortalProducts, type FappRecord } from "./fapp-data";

const record = (changes: Partial<FappRecord> = {}): FappRecord => ({ ...emptyFapp("L001", "Outubro 2026"), gmv: 10000, orders: 100, ...changes });

describe("Farmácias App — cálculos", () => {
  test("mantém margem pendente quando o CMV não foi informado", () => {
    const result = calculateFapp(record());
    assert.equal(result.grossMargin, null);
    assert.equal(result.netMargin, null);
    assert.ok(result.alerts.includes("Margem pendente: informar CMV"));
  });

  test("calcula margem com CMV e comissão padrão de 13%", () => {
    const result = calculateFapp(record({ cmv: 4000 }));
    assert.equal(result.commission, 1300);
    assert.equal(result.grossMargin, 6000);
    assert.equal(result.netMargin, 4200);
  });

  test("usa comissão real somente com fechamento e repasses conciliados", () => {
    const result = calculateFapp(record({ cmv: 4000, deliveredGmv: 9000, payments: [{ date: "2026-10-31", value: 7800, origin: "OTB" }], closed: true, reconciled: true }));
    assert.equal(result.commission, 1200);
    assert.equal(result.effective, 1200 / 9000);
  });

  test("calcula os quatro modelos de campanha sem cobrar NF duas vezes", () => {
    const models = ["gmv", "excess", "fixed", "percent"] as const;
    const expected = [200, 150, 100, 100];
    models.forEach((model, index) => {
      const campaign = { ...emptyCampaign(), model, fixed: 100, percent: 10, average: 500, sales: 1000, invoiceValue: 900 };
      const result = calculateFapp(record({ campaigns: [campaign] }));
      assert.equal(result.actions, expected[index]);
    });
  });

  test("lê produtos colados e preserva linhas não reconhecidas para conferência", () => {
    const parsed = parsePortalProducts("Produto A\nEAN 7891234567890\n10 pedidos\n12 unidades\nR$ 1.234,50\n\nProduto B\nEAN 12345678\n10 pedidos");
    assert.equal(parsed.products[0]?.name, "Produto A");
    assert.equal(parsed.products[0]?.revenue, 1234.5);
    assert.equal(parsed.unrecognized.length, 1);
  });

  test("projeta mês em andamento usando a data de corte informada", () => {
    const result = calculateFapp(record({ cutoff: "2026-10-10", closed: false, gmv: 1000 }));
    assert.equal(result.projection, 3100);
  });
});
