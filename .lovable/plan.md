# Concluir iFood e criar Farmácias App

## 1. Preservar os dados e corrigir a identidade das lojas
- Manter os nomes oficiais enviados e os IDs L001–L012 já usados em setembro, sem renumerá-los pela ordem da lista.
- Usar as cidades já importadas: Curitiba, Pinhais e São José dos Pinhais. A Vila Amelia está registrada em Pinhais.
- Antes de reorganizar os registros, conferir conflitos por loja + mês e comparar quantidades e valores financeiros antes/depois. Se houver duas versões da mesma competência, apresentar o conflito; não escolher nem sobrescrever silenciosamente.
- Nunca apagar uma linha de `store_snapshots`. Atualizar apenas a ligação com a filial correta, preservando ID do snapshot, mês, valores e produtos. Remover somente cadastros duplicados de `store_records`, após aprovação deste mapeamento e da execução no banco.
- Manter cópia de segurança privada e permitir reversão da reorganização. Nomes sem correspondência ficam intactos para revisão.

### Mapeamento encontrado para agosto de 2026
O banco tem 12 filiais em agosto, de **L013 a L024**, não apenas até L022.

| ID antigo | ID definitivo | Nome oficial | Cidade existente |
|---|---|---|---|
| L013 | L012 | Farmasull Vitoria Regia | Curitiba |
| L014 | L001 | Farmácia Farmasull Hauer - 01 | Curitiba |
| L015 | L002 | Farmasull Alto Boqueirão | Curitiba |
| L016 | L003 | Farmasull Boqueirão | Curitiba |
| L017 | L004 | Farmasull Cajuru | Curitiba |
| L018 | L005 | Farmasull Centenario | Curitiba |
| L019 | L006 | Farmasull Novo Mundo | Curitiba |
| L020 | L007 | Farmasull Pinhais | Pinhais |
| L021 | L008 | Farmasull Santa Candida | Curitiba |
| L022 | L009 | Farmasull São José dos Pinhais | São José dos Pinhais |
| L023 | L010 | Farmasull Uberaba | Curitiba |
| L024 | L011 | Farmasull Vila Amelia | Pinhais |

Criar um catálogo comum a ambos os canais, com os 12 IDs definitivos e nomes acima. “Inserir dados de [mês]” seleciona uma filial existente; “Nova loja” exige confirmação de uma nova unidade física e não é usado para lançar outro mês.

## 2. Terminar os ajustes anteriores do iFood
As únicas mudanças no iFood serão as correções já solicitadas:
- Comissão calculada com `getCommissionRateForMonth` pelo mês de cada registro: janeiro–setembro/2026 = 14%; outubro/2026 em diante = 10,5%, inclusive anos posteriores. Não usar a data atual nem uma taxa global editável para recalcular meses antigos.
- DRE, consolidado, comparativos e históricos usam a competência própria de cada snapshot. Rótulos gerados pela taxa aplicada. Simulador usa outubro/2026 e identifica essa referência.
- Corrigir alerta do simulador: **“PREJUÍZO: Cada R$ 1,00 vendido gera custo de R$ X,XX.”** O custo é `1 − margem líquida` como fração, formatado com `formatBrl`, sem multiplicar por 100.
- Remover “Importar planilha”, o campo oculto e sua função; ocultar “Regras de cálculo” e remover sua mensagem fictícia.
- Corrigir menus para “Comparativo de lojas” e “Análise por Loja”.
- Análise crítica baseada em venda consolidada, margem ponderada, líder por margem percentual, menor margem, lojas com prejuízo, ROAS abaixo de 4 e comissão do mês. Sem dados, mostrar estado vazio em vez de análise genérica.
- Usar somente snapshots da competência escolhida nas telas de resultado; não misturar meses ou dados locais. Remover gravação de lojas no localStorage, mantendo armazenamento de sessão de acesso intacto.
- “Dados salvos” somente após confirmação do banco; erros mantêm os campos preenchidos. Preservar confirmação de reimportação. Remover fallback de loja demonstrativa e sincronizações duplicadas do formulário, se presentes.

## 3. Navegação e acesso da equipe
- Duas abas no topo: **iFood** e **Farmácias App**, compartilhando mês e catálogo. Preservar o estilo atual, com destaque verde-azulado no novo canal e boa leitura no celular.
- Farmácias App terá **Visão geral**, **Inserir dados** e acesso de equipe por contas identificadas, com entrada Google/Lovable.
- Novos membros só acessam a equipe após convite/autorização; criar conta não concede acesso aos dados. Não incluir perfis pessoais desnecessários.
- Não copiar o padrão atual de funções iFood com acesso privilegiado sem identificação. Novos acessos verificam sessão e participação na equipe no servidor e no banco.
- Não alterar permissões existentes do iFood sem confirmação separada. O comparativo lê apenas os resultados iFood necessários e é exibido à equipe autorizada. A proteção integral dos acessos antigos do iFood ficará separada do escopo, salvo autorização expressa.

## 4. Inserir dados — Farmácias App
Formulário por filial + competência, carregando valores salvos ou campos vazios para nova competência, sem duplicar cadastro.
- **Situação:** Ativa, Inativa, Em ativação; Docas; markup opcional.
- **Vendas:** GMV, pedidos, ticket informado e calculado, nota, cancelamento, venda Docas. Acrescentar GMV entregue, fechamento completo e repasses conciliados para não confundir atrasos de pagamento com comissão.
- **Repasses:** várias linhas com data, valor e origem OTB/TUNA/outro; total e lembrete dos prazos e pedidos entregues.
- **Custos:** CMV opcional sem estimativa, comissão padrão 13%, operacional padrão 5%, descontos, perdas com observação e chamado.
- **Frete:** verba e consumo, barra e alerta acima de 80%.
- **Ações:** nome, datas, participação, modelo de custo, fixo, percentual, média, vendas da ação, preço de custo, NF recebida/paga e valor da NF. Permitir adicionar/remover linhas e calcular custos sem cobrar duas vezes pela NF.
- **Metas e preços:** meta mensal, destaque em novembro, percentuais acima da cidade/estado.
- **Produtos:** até 10 linhas com nome, EAN, pedidos, unidades, receita e custo unitário opcional. Colagem do texto do portal com prévia e indicação de linhas não reconhecidas antes de aplicar.
- **Projeção e dias 1–5:** informar data de corte das vendas e venda/pedidos da janela 1–5. Não inferir essa janela a partir de totais mensais. Projeção usa dias da competência e corte informado; mês fechado mostra realizado.

## 5. Cálculos e visão geral
- Margem bruta = GMV − CMV. Margem líquida desconta comissão, frete usado, campanhas participantes, cupons, perdas e operacional. Sem CMV, margem pendente, não zero; excluir margens pendentes das médias e informar cobertura.
- Comissão prevista = GMV × taxa da competência. Comissão real = GMV entregue − repasse conciliado. Usar a real apenas com fechamento e conciliação completos; apresentar comissão efetiva no mesmo universo de vendas conciliadas. Atrasos não devem virar comissão artificial.
- Divergência acima de 1 ponto percentual da taxa contratada gera alerta; quando padrão, o texto mostra 13%. Se faltar informação de entrega/repasse, mostrar conferência pendente.
- Modelos das ações: fixo + percentual do GMV da ação; fixo + percentual do excedente positivo da média; só fixo; só percentual. Retorno = vendas/custo; custo zero aparece sem divisão inválida. Preço de custo sinaliza tráfego, não margem.
- Cards: GMV, pedidos, ticket, comissão efetiva, frete e consumo, ações, margens, nota e cancelamento. Variação vs. competência anterior quando houver base; sem base, “Sem comparação”. Inativas fora das médias; GMV/totais continuam distinguindo valores efetivamente registrados.
- Ranking com 3 melhores e 3 piores margens válidas; gráfico jan–dez e modo dias 1–5; calendário das ações; produtos somados por EAN; bloco de inativas/sem Docas com última venda conhecida.
- Alertas: cancelamento >10%, nota <4,5, divergência de repasse, frete >80%, retorno <3, CMV ausente, ticket divergente, menos de 10 produtos e NF pendente. Mostrar fórmulas em dicas ao passar o mouse ou tocar.
- Comparativo por filial/mês: vendas, pedidos, ticket, comissão, marketing e margem de cada canal; indicar melhor margem somente com valores completos e comparáveis. Margens e ausência de dados identificadas, sem preencher faltas com zeros fictícios.
- Os números históricos 1–5 citados no documento serão referência identificada, não vendas reais das filiais nem dados importados inventados.

## Detalhes técnicos — novas tabelas
Todas em `public`, com permissões explícitas e RLS; nenhuma nova leitura pública de vendas.

| Tabela | Finalidade |
|---|---|
| `store_catalog` | Catálogo compartilhado com IDs definitivos, nome e cidade; sem mover métricas iFood para esta tabela. |
| `workspace_members` | Usuário, equipe e participação autorizada; sem autoconcessão de acesso. |
| `workspace_invitations` | Convites pendentes, validade e aceite vinculado à conta verificada. |
| `user_roles` | Papéis de administrador/membro separados de perfis, validados no servidor. |
| `fapp_monthly_records` | Equipe, loja, mês, status, métricas, custos, taxas, metas, corte, fechamento, conciliação e janela 1–5. Único por equipe + loja + mês; CMV nulo permitido. |
| `fapp_payments` | Repasses ligados ao registro mensal, data, valor e origem. |
| `fapp_campaigns` | Ações ligadas ao registro mensal com período, modelo, valores e controle da NF. |
| `fapp_products` | Até 10 produtos por registro, com EAN e custo opcional. |
| `store_identity_migration_backup` | Cópia privada dos registros afetados e ligações originais para reversão, sem acesso público. |

- Gravação mensal e listas filhas em transação: falha em qualquer parte não deixa fechamento parcial. Reimportação atualiza o mesmo registro.
- Regras temporais e validações mutáveis em funções/gatilhos apropriados. Não criar ligações indevidas com tabelas gerenciadas de autenticação.
- Separar telas e cálculo Farmácias App em módulos próprios; manter seletor e catálogo compartilhados. Consultas e gravações autenticadas via funções do servidor. Documentar decisões no `AGENTS.md`.
- Não simular conexão automática com o portal: dados serão informados/colados pela equipe.

## Ordem e aceite
1. Aprovar este plano, o mapeamento e a criação das tabelas/proteção da nova aba.
2. Conferir banco, preservar cópia e executar reorganização transacional sem alterar valores financeiros.
3. Concluir correções iFood e testar meses antigos, outubro e meses posteriores.
4. Implementar acesso da equipe, armazenamento e telas Farmácias App.
5. Testar regras concretas, cálculos, autorização, falhas de gravação, reimportação e colagem. Conferir no navegador com dados salvos nos dois canais e nos tamanhos de computador/celular.
6. Entregar lista de arquivos alterados e pendências; não publicar automaticamente.

**Nenhuma alteração no banco ou nas telas foi executada nesta etapa.** O envio de convites aguardará os destinatários que você quiser autorizar; nomes/cidades divergentes ou conflitos encontrados serão apresentados, sem migração silenciosa.