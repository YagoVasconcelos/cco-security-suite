# CCO Security Suite v1.0 | TecPrimus Soluções Tecnológicas
**Desenvolvedor:** Yago Marinho | **Empresa:** TecPrimus Soluções Tecnológicas | **Versão:** 1.0 (2026)  
**Contato:** [LinkedIn](https://www.linkedin.com/in/yago-marinho-b8a309141/) | [GitHub](https://github.com/YagoVasconcelos) | **E-mail:** tecprimus2021@outlook.com

---

# Manual de Operação do Usuário (Central de Controle Operacional)

## 1. Introdução e Boas-Vindas

Prezado(a) Operador(a) da **Central de Controle Operacional (CCO)**,

Seja bem-vindo ao **CCO Security Suite**, a plataforma integrada de inteligência e segurança corporativa desenvolvida para a gestão patrimonial, controle de acessos e monitoramento de plantas industriais, complexos corporativos, centros logísticos e condomínios empresariais.

O objetivo deste manual é fornecer um guia prático, visual e completo de todos os módulos do sistema, orientando você passo a passo sobre como emitir ocorrências, controlar o fluxo de colaboradores e visitantes, custodiar chaves e gerar relatórios gerenciais com máxima eficiência e conformidade.

### Navegação pelo Menu Lateral Corporativo
O sistema opera como aplicativo desktop nativo no Windows, iniciando automaticamente com a janela maximizada. O acesso a todas as ferramentas é feito pelo menu lateral escuro fixado à esquerda da tela:
* 📊 **Dashboard Executivo:** Visão unificada de indicadores (KPIs), gráficos de severidade e tabelas analíticas.
* 🚨 **Ferramenta 1 (Relatório de Ocorrências - RO):** Cadastro, documentação com fotos e emissão de PDFs de sinistros e desvios.
* 🎫 **Ferramenta 2 (Credenciais Provisórias):** Gestão de cartões temporários nas Portarias 1 e 2 com alerta de reincidência.
* 👥 **Ferramenta 3 (Controle de Visitantes):** Painel visual de slots por portaria com cronômetro de permanência e checkout.
* 🔑 **Ferramenta 4 (Controle RFID / Chaves):** Claviculário digital e custódia de chaves mestras e tags veiculares de docas.
* ⚙️ **Configurações:** Área restrita para supervisores e líderes de turno (protegida por Senha Mestra).
* ℹ️ **Sobre o Sistema:** Informações de autoria, versão, direitos autorais e contatos de suporte técnico.

---

## 2. Dashboard Executivo & Inteligência Analítica

O Dashboard Executivo é a central de comando do sistema, reunindo os principais indicadores em tempo real para apoiar a liderança da CCO e a fiscalização de segurança nas tomadas de decisão.

![Dashboard Executivo e Indicadores](./prints/dashboard.png)

### 2.1 Indicadores Principais (Cards de KPIs)
No topo do Dashboard, os cards visuais destacam o cenário operacional em tempo real:
1. **Total de Ocorrências (RO):** Quantidade consolidada de registros de desvios e incidentes no período selecionado.
2. **Inadimplência Crachás:** Quantidade de credenciais avariadas ou extraviadas no período.
3. **Cartões Pendentes:** Cartões provisórios que ultrapassaram o limite de devolução (>24h).
4. **Acessos Visitantes:** Volume total de liberações de visitantes efetuadas.
5. **Provisórios Ativos:** Total de cartões temporários que se encontram atualmente em uso dentro do complexo.

### 2.2 Barra de Filtros do Dashboard
* **Filtros de Período:** Botões de clique rápido (*Hoje*, *7 Dias*, *30 Dias*, *Mês Atual*, *Ano*) e seletor *Personalizado*.
* **Filtros Dinâmicos:** Permitem refinar os dados por *Turno Operacional*, *Operador Responsável* e *Localização / Prédio*.
* **Status do Sistema & Terminal:** Identificação do destino das exportações (`cco/exports`) e indicador em tempo real de `Sistema Operante`.

![Detalhamento Analítico - As 4 Tabelas de Gestão](./prints/dashboard_detalhamento1.png)

### 2.3 Detalhamento Analítico (As 4 Tabelas de Gestão)
1. **Alerta de Reincidência (Top Usuários):**
   * *Objetivo:* Identificar colaboradores com reincidência de esquecimento ou extravio de crachás no mês.
   * *Colunas:* Nome do Colaborador, Empresa Contratada e Total de Acessos Provisórios no Período.
   * *Regra de Negócio:* Aplica destaque aos colaboradores que ultrapassaram o teto de 3 acessos mensais.

2. **Inadimplência de Credenciais (Avarias & Perdas):**
   * *Objetivo:* Controle patrimonial estrito de perdas e avarias para encaminhamento aos setores de Recursos Humanos e Facilities.
   * *Colunas:* Nome do Colaborador, Empresa Contratada, Data do Fato e Motivo/Tipo de Perda.
   * *Regra de Compliance e Neutralidade Financeira:* **Nenhum valor financeiro (R$) é exibido nesta tela**. A cobrança e eventual ressarcimento seguem exclusivamente os fluxos e formulários administrativos externos da organização contratante.

3. **Produtividade CCO por Turno & Operador:**
   * *Objetivo:* Rastreabilidade operacional de lançamentos por escala de serviço e matrícula do operador.
   * *Colunas:* Operador CCO, Matrícula, Turno e Quantidade de Registros Gerados.

4. **Cartões Provisórios Pendentes (>24h):**
   * *Objetivo:* Alerta prioritário de crachás retidos fora da portaria além do expediente regulamentar.
   * *Colunas:* Nome do Colaborador, Empresa, Número do Provisório, Portaria de Retirada (P1/P2) e Horário de Liberação.

![Gráficos de Severidade e Fluxo Operacional](./prints/dashboard_detalhamento2.png)

### 2.4 Gráficos Estratégicos & Acesso Rápido
* **Distribuição por Severidade:** Gráfico circular dividindo as ocorrências em *Baixa*, *Média*, *Alta* e *Crítica*.
* **Fluxo Operacional por Portaria (P1 vs P2):** Comparativo em barras do volume de atendimentos e movimentações entre a Portaria Principal 1 e a Portaria Secundária 2.
* **Cards de Acesso Rápido:** Atalhos operacionais integrados com teclas de atalho do teclado (`F1` para Ocorrências, `F2` para Provisórios, `F3` para Visitantes e `F4` para Chaves/RFID).

### 2.5 Botões de Exportação do Dashboard
No canto superior direito da tela, você encontra os botões oficiais de exportação:
* **Botão `Relatório PDF`:** Compila o Dashboard completo em formato A4 institucional, com cabeçalho oficial, gráficos, tabelas protegidas contra quebra de página e bloco de assinaturas formais (Gerência da Planta, Coordenação de Segurança e Fiscalização do Contrato).
* **Botão `Base Excel`:** Gera e baixa imediatamente uma planilha formatada (`.xlsx`) com abas estruturadas de ocorrências, provisórios e visitantes para auditorias e cruzamento de dados.

---

## 3. Ferramenta 1: Relatório de Ocorrências (RO)

A Ferramenta 1 é o instrumento oficial para registro de anomalias, acidentes, quase-acidentes, danos patrimoniais e desvios de segurança.

![Ferramenta 1 - Dados Gerais da Ocorrência](./prints/relatorio_ocorrencias1.png)

### 3.1 Campos do Formulário de Registro
O formulário de ocorrência foi estruturado para evitar erros de digitação e garantir conformidade estatística:
* **Número do RO:** Gerado automaticamente de forma sequencial (ex: `RO-2026-548`). Não pode ser editado pelo operador, garantindo integridade de protocolo.
* **Data e Hora do Fato:** Registra o momento exato em que o evento ocorreu ou foi detectado pelo CFTV/patrulha.
* **Operador CCO Responsável:** Dropdown dinâmico que lê a lista oficial de operadores cadastrados na base de dados.
* **Turno Operacional:** Seleção da escala em vigor (*12x36 Diurno*, *12x36 Noturno*, *Administrativo*).
* **Classificação Estruturada de Localização (Taxonomia Corporativa Parametrizável):**
  * *Prédios / Instalações:* Portaria Principal, Portaria de Serviços, Prédio Administrativo, Fábrica / Produção, Galpão Logístico, Refeitório Central, Central de Utilidades, etc. (parametrizável para se adaptar à arquitetura de qualquer complexo ou planta).
  * *Áreas / Setores:* Pátio / Circulação, Interna / Operacional, Estacionamento, Linha de Produção, etc.
* **Tópico / Natureza da Ocorrência (16 opções):** Uso Indevido de EPI, Arrasta Palhete, Uso de Celular Indevido, Desvio de Conduta, Quase Acidente, Furto, etc., com chips de preenchimento rápido para agilidade no atendimento.
* **Gravidade:** *Baixa* (informativa), *Média* (atenção), *Alta* (intervenção necessária) ou *Crítica* (acionamento de plano de crise/ambulância).
* **Título e Relato Circunstanciado:** Campo descritivo detalhado para narrativa cronológica, factual e imparcial do acontecimento.

![Ferramenta 1 - Pessoas Envolvidas e Evidências](./prints/relatorio_ocorrencias2.png)

### 3.2 Inclusão Dinâmica de Envolvidos
Na tabela **Pessoas Envolvidas / Identificação**, clique no botão **+ Adicionar Envolvido** para associar os intervenientes:
* **Nome Completo**
* **Empresa Contratada / Prestadora** (ex: Prestadora de Segurança, Facilities, Logística, Manutenção, etc.)
* **Documento (CPF / RG)**
* **Tipo de Vínculo:** Notificante, Vítima, Autor ou Testemunha.
*(Você pode adicionar múltiplos envolvidos; cada registro conta com botões de edição rápida ou exclusão individual)*.

### 3.3 Anexo e Gestão de Evidências Fotográficas
* A área de **Evidências Fotográficas & Anexos** permite anexar imagens via arrastar-e-soltar ou botão de seleção.
* Exibe pré-visualização em miniaturas com campos para legendas técnicas e botão de exclusão imediata.

### 3.4 Botões de Ação da Ferramenta 1
* **Botão `Salvar e Gerar RO (PDF)`:** Grava o registro no banco local (`data/ocorrencias.json`), atualiza a planilha de histórico (`ocorrencias.xlsx`), gera o PDF oficial A4 com assinaturas e salva uma cópia automática na pasta configurada.
* **Botão `Salvar Rascunho`:** Preserva as informações já digitadas sem fechar o protocolo.
* **Botão `Cancelar`:** Descarta alterações não salvas com segurança.

---

## 4. Ferramenta 2: Controle de Credenciais Provisórias

Gerencia os cartões de acesso temporários entregues a colaboradores que comparecem à Portaria 1 ou Portaria 2 sem o crachá funcional regular.

![Ferramenta 2 - Controle de Credenciais Provisórias](./prints/credenciais_provisorias.png)

### 4.1 Barra de Pesquisa e Filtros Rápidos
A interface conta com uma barra horizontal no topo:
* **Campo de Busca por Texto:** Permite localizar imediatamente um colaborador digitando parte do seu nome ou da empresa prestadora (filtra a tabela em tempo real enquanto você digita).
* **Filtro de Status:**
  * *Todos:* Exibe o histórico geral de movimentações.
  * *Pendentes (Em Aberto):* Exibe apenas os cartões que estão atualmente em circulação e aguardam devolução.
  * *Devolvidos:* Exibe registros já baixados com data e hora de retorno.
* **Botão `+ Nova Credencial`:** Abre o modal de lançamento de nova concessão.

### 4.2 Formulário de Cadastro de Credencial
Ao clicar em **+ Nova Credencial**, preencha os campos obrigatórios:
* **Nome Completo do Colaborador**
* **Empresa Prestadora**
* **Número do Cartão Provisório**
* **Portaria de Atendimento:** `Portaria 1 (P1)` ou `Portaria 2 (P2)`.
* **Motivo / Observação:** Lê a lista dinâmica gerenciada nas Configurações (*ESQUECEU*, *PERDEU*, *COM DEFEITO*, *RETIDO*, *OUTROS*).
* Clique em **Registrar Acesso**. O sistema grava o registro e carimba automaticamente a data e o horário da concessão.

### 4.3 A Regra Crítica de Reincidência (Limite de 3 Acessos/Mês)
> **Atenção Máxima do Operador:**
> Todo colaborador tem o direito operacional de retirar até **3 credenciais provisórias por mês civil**.
> Quando o operador cadastra a **4ª retirada** para o mesmo colaborador no mesmo mês, o sistema aplica compulsoriamente a etiqueta vermelha destacada: **`REINCIDENTE`**.
> O colaborador deve ser orientado sobre a norma interna e seu nome passará a constar na lista de reincidências do Dashboard.

### 4.4 Processo de Devolução (Dar Baixa)
1. Localize o colaborador na lista de pendentes através da barra de busca.
2. Na extremidade direita da linha, clique no botão **Dar Baixa / Devolver**.
3. O sistema grava o horário de retorno e calcula a duração total da permanência (ex: *7h 45m*). O cartão provisório fica liberado na portaria para o próximo uso.

### 4.5 Gestão de Cartões Perdidos (Inadimplência)
Caso o colaborador declare que perdeu definitivamente o cartão titular ou provisório, selecione a observação **PERDEU**. O caso é encaminhado à tabela de inadimplência patrimonial. **Lembre-se:** A CCO não cobra dinheiro na portaria. A cobrança é feita pelo formulário externo da contratante.

---

## 5. Ferramenta 3: Controle de Visitantes e Painel de Slots

Gerencia a entrada, permanência e saída de visitantes, prestadores pontuais, auditores e fornecedores na planta corporativa.

![Ferramenta 3 - Controle de Visitantes e Painel de Slots](./prints/controle_visitantes.png)

### 5.1 Painel Visual de Slots por Portaria
A tela exibe cartões em formato de grid que representam visualmente os crachás físicos de visitantes disponíveis nas portarias:
* **Slot Verde / Livre:** Crachá disponível na portaria, pronto para entrega.
* **Slot Azul / Ocupado:** Visitante ativo dentro da planta portando o crachá correspondente. Mostra o nome, empresa, anfitrião e o **cronômetro de tempo decorrido**.

### 5.2 Registro de Entrada de Visitante
1. Clique no botão **+ Novo Visitante** (ou clique diretamente sobre um slot livre).
2. No modal que se abre, preencha:
   * **Nome Completo do Visitante**
   * **Documento de Identificação Oficial:** RG ou CPF (obrigatório para seguro e compliance patrimonial).
   * **Empresa de Origem**
   * **Anfitrião / Setor de Destino:** Colaborador interno ou setor responsável pela visita (ex: *Gerência de Manutenção*, *Recursos Humanos*, *Engenharia de Processos*).
   * **Portaria de Acesso:** P1 ou P2.
   * **Número do Crachá de Visitante:** Número do cartão plástico entregue.
3. Clique em **Confirmar Entrada**. O slot passa para o status ocupado imediatamente.

### 5.3 Registro de Saída (Checkout)
1. Quando o visitante se apresentar na portaria para devolver o crachá, localize o seu card no painel ou utilize a barra de busca por nome/documento.
2. Clique no botão **Registrar Saída (Checkout)**.
3. O sistema encerra o cronômetro, arquiva a permanência no histórico diário e devolve o slot para o status *Livre*.

---

## 6. Ferramenta 4: Gestão de RFID e Chaves Mestras

Garante a cadeia de custódia e o inventário em tempo real das chaves mestras de prédios, salas técnicas, subestações, portões perimetrais e tags de docas.

![Ferramenta 4 - Gestão de RFID e Claviculário de Chaves](./prints/controle_rfid.png)

### 6.1 Matriz do Claviculário Digital
A tela exibe todas as chaves e dispositivos cadastrados:
* **Status `Disponível` (Verde):** A chave está no claviculário físico da portaria.
* **Status `Em Uso / Cautelada` (Âmbar):** A chave foi retirada por um operador ou prestador autorizado e está em circulação.

### 6.2 Procedimento de Empréstimo (Cautela)
1. Clique no botão **Nova Cautela / Empréstimo**.
2. Selecione o item desejado (ex: *Chave 04 - Casa de Máquinas F-01* ou *Tag 08 - Doca 02*).
3. Informe o **Nome do Solicitante**, a **Empresa Contratada**, o **Setor de Destino** e o **Motivo da Abertura**.
4. Clique em **Confirmar Empréstimo**. O status do item é alterado na hora para *Em Uso*.

### 6.3 Procedimento de Baixa e Devolução
1. Quando a chave for entregue de volta na portaria, localize o registro na lista de chaves cauteladas.
2. Clique em **Confirmar Devolução**.
3. O sistema registra o horário exato da entrega, calcula o tempo de custódia e retorna o item para o status *Disponível*.

---

## 7. Painel de Configurações Administrativas (Área Restrita)

O módulo de configurações permite parametrizar o sistema de acordo com as necessidades contratuais e operacionais da CCO.

![Painel Administrativo de Configurações e Senha Mestra](./prints/configuracoes.png)

### 7.1 Bloqueio por Senha Mestra
Por razões de segurança e governança, o acesso a esta tela é protegido.
1. Ao clicar em **Configurações** no menu lateral, o sistema abre um modal solicitando a **Senha Mestra**.
2. Digite a senha oficial (senha padrão de fábrica: **`admin123`**) e confirme.
3. Caso a senha esteja correta, o painel restrito é liberado; caso contrário, o acesso é negado com aviso visual.

### 7.2 Gerenciadores Disponíveis na Área Restrita
* **CRUD de Turnos Operacionais:** Permite cadastrar, editar e desativar escalas de trabalho (padrões: *12x36 Diurno*, *12x36 Noturno*, *Administrativo*). Todos os dropdowns do sistema leem dessa lista.
* **CRUD de Observações Padrão:** Permite gerenciar a lista de motivos de entrega de cartões provisórios (*ESQUECEU*, *PERDEU*, *COM DEFEITO*, *RETIDO*, *OUTROS*).
* **CRUD de Operadores CCO:** Permite cadastrar novos membros da equipe da CCO com nome completo, matrícula corporativa e turno de atuação.
* **Responsáveis da Planta e Assinaturas:** Atualização dos nomes da Gerência da Planta, Coordenação de Segurança e Fiscalização do Contrato, além do caminho de rede compartilhado para gravação dos relatórios.
* **Segurança do Sistema:** Formulário direto para alteração da Senha Mestra atual por uma nova chave secreta.

---

## 8. Exportação de Relatórios e Auditorias

### 8.1 Relatório Executivo do Dashboard em PDF
* **Finalidade:** Utilizado em reuniões diárias de alinhamento (DDS), apresentações executivas mensais e auditorias de segurança patrimonial.
* **Como Gerar:** No Dashboard Executivo, defina o mês de competência e clique no botão **Relatório PDF**.
* **Características do Arquivo:** O documento gerado possui layout A4 executivo, sem cortes de tabelas no meio da folha, com cabeçalho oficial e rodapé para assinaturas formais.

### 8.2 Base Consolidada em Excel (.xlsx)
* **Finalidade:** Utilizada pelos setores de Inteligência, Facilities e RH para elaboração de gráficos dinâmicos, cruzamento de acessos e cálculo de permanência.
* **Como Gerar:** No Dashboard Executivo, clique no botão **Base Excel**. O download inicia em segundos com as abas de Ocorrências, Provisórios e Visitantes preenchidas e tipadas.

---

## 9. Suporte Técnico e Autoria do Software

![Modal Sobre o Sistema e Direitos Autorais](./prints/sobre.png)

O **CCO Security Suite** é uma solução corporativa desenvolvida e comercializada pela **TecPrimus Soluções Tecnológicas**:

* **Desenvolvedor:** Yago Marinho (Engenharia & Arquitetura de Software)
* **Empresa:** TecPrimus Soluções Tecnológicas
* **Versão:** 1.0 (Release Oficial de Produção - 2026)
* **LinkedIn:** [https://www.linkedin.com/in/yago-marinho-b8a309141/](https://www.linkedin.com/in/yago-marinho-b8a309141/)
* **GitHub:** [https://github.com/YagoVasconcelos](https://github.com/YagoVasconcelos)
* **E-mail de Suporte:** `tecprimus2021@outlook.com`
* **Aviso Legal & Propriedade Intelectual:** Obra protegida nos termos da Lei nº 9.609/1998 e Lei nº 9.610/1998 (Copyright © 2026). Todos os direitos reservados à TecPrimus Soluções Tecnológicas. É estritamente vedada a reprodução desautorizada, engenharia reversa ou distribuição sem licenciamento formal.

