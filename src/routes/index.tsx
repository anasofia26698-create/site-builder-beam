import { createFileRoute } from "@tanstack/react-router";

import DashboardHome from "@/components/DashboardHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Resultado — iFood e Farmácias App" },
      {
        name: "description",
        content:
          "Resultados mensais das lojas no iFood e Farmácias App: margens, custos, campanhas e comparativo por competência.",
      },
      { property: "og:title", content: "Resultado — iFood e Farmácias App" },
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
