# Concluir iFood e Farmácias App
- [x] Plano e mapeamento aprovados.
- [ ] Unificar catálogo com cópia privada e preservar todos os snapshots.
- [x] Concluir correções iFood e validar cálculos e seleção mensal.
- [x] Criar armazenamento protegido e acesso por equipe Farmácias App.
- [x] Criar entrada, visão geral, produtos, ações e comparação dos canais.
- [ ] Testar regras e persistência; conferir telas computador/celular.
- [ ] Autorizar administradora inicial após entrada por conta identificada.

## Registro de execução — 2026-10-19
- Corrigida a participação por segmento usando a receita de todos os produtos do Top 10 de cada loja.
- Produtos sem segmento agora aparecem como “Sem segmento”.
- Análise crítica sem dados agora mostra a competência selecionada sem gerar texto analítico.
- Testes unitários da competência e dos segmentos: 5 aprovados.
- Banco, migrações, políticas e reorganização de catálogo não foram alterados; aguardam aprovação explícita.
- Farmácias App recebeu as sub-abas Inserir dados, Dashboard e Loja a loja, com acesso condicionado à equipe autorizada.
- Formulário inclui códigos do portal, solicitações pendentes e Prateleira Infinita; dados ausentes permanecem vazios ou pendentes.
- Persistência de Farmácias App permanece desabilitada nesta etapa para não alterar o banco sem aprovação do SQL.
- Catálogo oficial ainda aguarda confirmação; nenhum ID ou nome novo foi criado no componente.
- Farmácias App reativada na navegação com acesso restrito à equipe autorizada; arquivos, funções, migração, tabelas, políticas e dados preservados.
- Dashboard Farmácias App agora consolida até 3 meses, recalcula percentuais sobre as somas, destaca os meses selecionados, consolida produtos por EAN e exibe cobertura, alertas e pendência de CMV.
- Persistência de novos registros continua pendente de aprovação explícita do SQL; a tela não altera banco, tabelas, políticas ou dados existentes.
- Gráficos de promoções e CAC/ticket agora exibem nomes das lojas com código completo no tooltip; Visão consolidada recebeu Pontos de atenção dinâmicos por período.
- DRE individual recebeu Pontos de atenção clicáveis antes da DRE, com cobertura de CMV, consolidação de até três meses e âncoras para margem, CMV, promoções e anúncios.
- Farmácias App abre sem login/verificação, usa o catálogo oficial L001–L012, oferece mês ou últimos 3 meses e apresenta valores ausentes como Pendente; comissão padrão 13% e operacional 5% preservados.
- Inserir dados agora usa somente o catálogo oficial L001–L012, ignora registros externos na interface, remove criação automática de novos IDs e avisa sobre registros fora do catálogo para a etapa de limpeza do banco.
