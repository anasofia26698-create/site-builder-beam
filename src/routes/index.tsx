import { createFileRoute } from "@tanstack/react-router";

import DashboardHome from "@/components/DashboardHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard iFood — Margem e rentabilidade por loja" },
      {
        name: "description",
        content:
          "Painel de controle iFood: DRE por loja, comparativo de unidades, produtos, eficiência de anúncios e simulador de rentabilidade.",
      },
      { property: "og:title", content: "Dashboard iFood — Margem e rentabilidade por loja" },
      {
        property: "og:description",
        content:
          "Acompanhe venda bruta, CMV, promoções, anúncios e margem líquida de cada loja em um único painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardHome,
});
