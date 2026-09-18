# CCO Security Suite Rev 1.1 | TecPrimus Soluções Tecnológicas
**Desenvolvedor:** Yago Marinho | **Empresa:** TecPrimus Soluções Tecnológicas | **Versão:** Rev 1.1 (2026)  
**Contato:** [LinkedIn](https://www.linkedin.com/in/yago-marinho-b8a309141/) | [GitHub](https://github.com/YagoVasconcelos) | **E-mail:** tecprimus2021@outlook.com

---

# Manual de Operação do Usuário (Central de Controle Operacional) — Rev 1.1

## 1. Introdução e Boas-Vindas

Prezado(a) Operador(a) da **Central de Controle Operacional (CCO)**,

Seja bem-vindo ao **CCO Security Suite (Rev 1.1)**, a plataforma corporativa integrada de inteligência e segurança desenvolvida para a gestão patrimonial, controle de acessos, registro de sinistros e monitoramento analítico de plantas industriais, complexos corporativos, centros logísticos e condomínios empresariais.

O objetivo deste manual é fornecer um guia prático, visual e completo de todos os módulos do sistema, orientando você passo a passo sobre como emitir ocorrências, controlar o fluxo de colaboradores e visitantes, custodiar chaves e gerar relatórios gerenciais com máxima eficiência, rastreabilidade e conformidade com as diretrizes da governança corporativa.

### 1.1 Arquitetura de Usuários e Separação de Papéis
O sistema adota uma separação rigorosa de perfis e responsabilidades:
* **Operadores do Sistema (Central CCO):**  
  São os **únicos perfis com credenciais de login e acesso ao software desktop da CCO**. Possuem permissões operacionais e administrativas para preencher e emitir Relatórios de Ocorrência (RO), conceder e baixar credenciais provisórias e visitantes, custodiar chaves/RFID, auditar indicadores no Dashboard Executivo e, sob validação de Senha Mestra, parametrizar dados do sistema e realizar rotinas de backup e restauração.
* **Efetivo de Vigilância de Campo:**  
  Cadastro dedicado exclusivamente aos profissionais alocados fisicamente nos postos operacionais externos (**Portaria 1**, **Portaria 2** e **Ronda**). **Eles não possuem credenciais de acesso ao software**. Seus cadastros constam na base de dados exclusivamente para fins de responsabilidade funcional e vínculo no momento da entrega e devolução física de crachás provisórios.

### 1.2 Navegação pelo Menu Lateral Corporativo
O sistema opera como aplicativo desktop nativo no Windows, iniciando automaticamente com a janela maximizada. O acesso a todas as ferramentas é feito pelo menu lateral escuro fixado à esquerda da tela:
* 📊 **Dashboard Executivo:** Visão unificada de indicadores (KPIs), gráficos de severidade e tabelas analíticas.
* 🚨 **Ferramenta 1 (Relatório de Ocorrências - RO):** Cadastro, documentação com fotos e emissão de PDFs de sinistros e desvios no padrão corporativo oficial limpo.
* 🎫 **Ferramenta 2 (Credenciais Provisórias):** Gestão de cartões temporários nas Portarias 1 e 2 com alerta compulsório de reincidência e vínculo ao vigilante de campo.
* 👥 **Ferramenta 3 (Controle de Visitantes):** Painel visual de slots por portaria com cronômetro de permanência e checkout.
* 🔑 **Ferramenta 4 (Controle RFID / Chaves):** Claviculário digital e custódia de chaves mestras e tags veiculares de docas.
* ⚙️ **Configurações:** Área restrita para supervisores e líderes de turno (protegida por Senha Mestra), contendo parametrizações e o **Painel de Backup & Restauração (Merge Inteligente)**.
* ℹ️ **Sobre o Sistema:** Informações de autoria, versão Rev 1.1, direitos autorais e contatos de suporte técnico.

---

## 2. Dashboard Executivo & Inteligência Analítica

O Dashboard Executivo é o centro nervoso da CCO Security Suite, projetado sob o padrão de **4 Dashboards Paisagem Independentes** (A4 Landscape com paginação limpa). O painel oferece inteligência situacional em tempo real, suporte à tomada de decisão para gerência e diretoria, e isolamento total de filtros para conformidade de impressão.

![Dashboard Executivo e Indicadores](./prints/dashboard.png)

### 2.1 Os 4 Módulos do Dashboard Executivo (Visão Paisagem Dedicada)

A suíte organiza os dados corporativos em 4 módulos estruturados que podem ser visualizados de forma unificada (4 páginas contínuas) ou individualmente através das abas superiores de navegação:

1. **Dashboard 1: Ocorrências & Segurança Patrimonial (Página 1 Paisagem)**
   * **Indicadores Consolidados:** Total de Ocorrências (ROs), Incidentes Críticos & Graves (ação imediata), Ocorrências Médias e de Rotina, Tempo Médio de Resposta e Taxa de Formalização com Evidências Fotográficas.
   * **Painel Interativo de Gravidade & Severidade:** Gráficos de barras em gradiente colorido com drill-down por clique:
     * 🔴 **Crítica:** Incidentes graves de alta prioridade.
     * 🟠 **Alta:** Desvios com impacto operacional que requerem apuração detalhada.
     * 🟡 **Média:** Ocorrências de rotina e inconformidades padrão.
     * 🔵 **Baixa:** Notificações leves e registros preventivos.
     * *Funcionalidade Drill-down:* Ao clicar em qualquer um dos cards de severidade, as tabelas analíticas inferiores são filtradas instantaneamente para a gravidade selecionada.
   * **Detalhamento Analítico (4 Tabelas Exclusivas de Ocorrências):**
     * *Incidência por Prédio / Localidade:* Concentração de eventos por instalação física da planta.
     * *Classificação por Tópico de Ocorrência:* Distribuição pelas 16 naturezas padrão de desvio.
     * *Produtividade CCO por Operador:* Rastreabilidade de lançamentos com destaque do operador em plantão.
     * *Últimas Ocorrências Registradas:* Histórico recente protocolado com badges coloridos de gravidade.

2. **Dashboard 2: Provisórios & Cautelas de Acesso (Página 2 Paisagem)**
   * **Escaninho Físico de Portaria (20 Slots):** Monitoramento visual dos escaninhos de crachás temporários divididos entre **Portaria 1 (Slots 01 a 10)** e **Portaria 2 (Slots 11 a 20)**, com cálculo automático da taxa de ocupação física.
   * **Controle de Circulação:** Contagem em tempo real de cautelas ativas, crachás pendentes que ultrapassaram o expediente e devoluções realizadas na data.
   * **Ranking de Reincidência (Regra dos 3 Acessos):** Identificação imediata de colaboradores com 3 ou mais retiradas no mês para aplicação de advertência e emissão de 2ª via definitiva.
   * **Auditoria de Perdas & Extravios:** Rastreabilidade de cartões com motivo "PERDEU" ou retidos.

3. **Dashboard 3: Visitantes & Fluxo de Portarias (Página 3 Paisagem)**
   * **Censo em Tempo Real:** Visitantes com permanência ativa dentro do complexo, entradas registradas no dia e saídas confirmadas (checkout).
   * **Ranking de Anfitriões / Destinos:** Apuração dos colaboradores internos e departamentos que mais recebem visitas externas no complexo.
   * **Conformidade de Identificação:** Taxa percentual de cadastros com documento oficial e veículo regularizado.
   * **Extravios de Credenciais de Visitante:** Monitoramento de crachás de visitantes não devolvidos na saída.

4. **Dashboard 4: RFID & Contabilidade de Acessos (Página 4 Paisagem)**
   * **Inventário Físico de Tags:** Total de cartões RFID cadastrados no claviculário, divididos entre cartões rotativos de prestadores e cartões permanentes de efetivo.
   * **Balanço Patrimonial & Recuperação:** Indicador de cartões ativos, bloqueados, extraviados e ressarcidos, com taxa percentual de recuperação patrimonial.

---

### 2.2 Política Financeira Fixa de 2ª Via (R$ 30,00) & Modal de Cobrança

Para coibir o esquecimento habitual, o extravio indiscriminado de credenciais e garantir o ressarcimento de custos materiais, a CCO Security Suite adota a taxa financeira padronizada de **R$ 30,00** por ocorrência de perda ou dano irreparável em todos os módulos (Provisórios, RFID e Visitantes).

* **Regra de Aplicação:** Sempre que um crachá provisório, tag RFID ou credencial de visitante é registrado com a condição `PERDEU`, `EXTRAVIADO` ou `DANIFICADO`, o sistema contabiliza o débito financeiro fixo de **R$ 30,00**.
* **Modal de Cobrança Financeira Integrado:**
  * Localizado no Dashboard através do botão **Cobrança 2ª Via**.
  * Apresenta o consolidado de perdas pendentes, valor total a ressarcir e valor já quitado.
  * Permite ao supervisor selecionar qualquer ocorrência de perda e emitir instantaneamente a **Ficha Oficial de Cobrança / Ressarcimento de 2ª Via em PDF**, com protocolo formal, identificação do colaborador, empresa prestadora, data do evento, portaria de custódia e o valor tabelado de R$ 30,00 para encaminhamento ao RH e Financeiro da contratada.

---

### 2.3 Separação Lógica Estrita dos Filtros Inteligentes

Para eliminar distorções estatísticas entre módulos distintos, o Dashboard adota segregação estrita de escopo:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  SEPARAÇÃO LÓGICA REGRADA DE FILTROS CCO                     │
├─────────────────────────┬────────────────────────────────────────────────────┤
│ 1. Filtro Temporal      │ Afeta TODOS os 4 Dashboards (Data de corte única)  │
├─────────────────────────┼────────────────────────────────────────────────────┤
│ 2. Filtros Ocorrências  │ Afetam APENAS o Módulo 1 (Ocorrências):            │
│                         │ • Prédio / Instalação (17 prédios oficiais)        │
│                         │ • Área / Setor (Áreas dinâmicas do prédio)         │
│                         │ • Tópico da Ocorrência (16 naturezas oficiais)     │
│                         │ • Gravidade / Severidade (Crítica/Alta/Média/Baixa)│
├─────────────────────────┼────────────────────────────────────────────────────┤
│ 3. Filtro de Empresa    │ Afeta APENAS os Módulos 2, 3 e 4:                  │
│                         │ • Provisórios, Visitantes e Credenciais RFID       │
│                         │ (Empresa NUNCA mascara ocorrências de segurança)   │
└─────────────────────────┴────────────────────────────────────────────────────┘
```

* **Botão Redefinir Filtros:** Restaura todos os filtros para os valores padrão de fábrica (*Mês Atual*, *Todos os Prédios*, *Todas as Áreas*, *Todos os Tópicos*, *Todas as Gravidades* e *Todas as Empresas*).
* **Navegação por Abas:** Permite alternar instantaneamente entre a visualização de todos os módulos (`Visão Completa`) ou focar em um único dashboard operacional (`1. Ocorrências`, `2. Provisórios`, `3. Visitantes`, `4. RFID`).

---

### 2.4 Exportação Executiva e Impressão de Alta Resolução

No cabeçalho do Dashboard, o operador dispõe dos recursos oficiais de exportação de dados:
* **Relatório PDF Consolidado (Modo Paisagem):** Gera o documento executivo em formato A4 Paisagem de altíssima resolução, contendo sumário executivo, gráficos vetoriais SVG (donut e barras), tabelas de detalhamento e bloco de assinaturas para aprovação da Gerência de Site, Coordenação de Segurança e Fiscalização de Contrato. Respeita rigorosamente a aba ativa (se filtrado em Ocorrências, exporta apenas a página 1 dedicada).
* **Base Consolidada em Excel (.xlsx):** Gera arquivo com planilhas segmentadas em abas estruturadas com cabeçalho corporativo, dados brutos e formatação profissional de colunas para cruzamento em Business Intelligence.

---

## 3. Ferramenta 1: Relatório de Ocorrências (RO)

A Ferramenta 1 é o instrumento oficial para registro de anomalias, acidentes, quase-acidentes, danos patrimoniais e desvios de segurança. O sistema unifica perfeitamente a interface de visualização ao documento executivo oficial impresso.

![Ferramenta 1 - Dados Gerais da Ocorrência](./prints/relatorio_ocorrencias1.png)

### 3.1 Campos do Formulário de Registro
O formulário de ocorrência foi estruturado para evitar erros de digitação e garantir conformidade estatística:
* **Número do RO:** Gerado automaticamente de forma sequencial (ex: `RO-2026-548`). Não pode ser editado pelo operador, garantindo integridade de protocolo.
* **Data e Hora do Fato:** Registra o momento exato em que o evento ocorreu ou foi detectado pelo CFTV/patrulha.
* **Operador CCO Responsável:** Dropdown dinâmico que lê a lista oficial de operadores cadastrados na base de dados.
* **Turno Operacional:** Seleção da escala em vigor (*12x36 Diurno*, *12x36 Noturno*, *Administrativo*).
* **Classificação Estruturada de Localização (Taxonomia Corporativa Parametrizável):**
  * *Prédios / Instalações:* Portaria Principal, Portaria de Serviços, Prédio Administrativo, Fábrica / Produção, Galpão Logístico, Refeitório Central, Central de Utilidades, etc.
  * *Áreas / Setores:* Pátio / Circulação, Interna / Operacional, Estacionamento, Linha de Produção, etc.
* **Tópico / Natureza da Ocorrência (16 opções oficiais):** Uso Indevido de EPI, Arrasta Palhete, Uso de Celular Indevido, Desvio de Conduta, Quase Acidente, Furto, etc.
* **Gravidade:** *Baixa* (informativa), *Média* (atenção), *Alta* (intervenção necessária) ou *Crítica* (acionamento de plano de crise/ambulância).
* **Título e Relato Circunstanciado:** Campo descritivo detalhado para narrativa cronológica, factual e imparcial do acontecimento.

![Ferramenta 1 - Pessoas Envolvidas e Evidências](./prints/relatorio_ocorrencias2.png)

### 3.2 Inclusão Dinâmica de Envolvidos
Na tabela **Pessoas Envolvidas / Identificação**, adicione os envolvidos:
* **Nome Completo**
* **Empresa Contratada / Prestadora** (ex: Prestadora de Segurança, Facilities, Logística, Manutenção, etc.)
* **Cargo / Função**
* **Matrícula Funcional**
* **Tipo de Vínculo:** Notificante, Vítima, Autor ou Testemunha.

### 3.3 Anexo e Gestão de Evidências Fotográficas
* Permite anexar imagens fotográficas da ocorrência.
* O sistema formata e numera automaticamente as legendas como `Anexo X - [Legenda da Foto]`.

---

### 3.4 Padrão Corporativo do Relatório de Ocorrência (RO) e Impressão Limpa

O documento oficial de visualização e impressão (`@media print`) segue rigorosamente a **Estrutura Linear Estrita Oficial (Rev 1.1)**, sem desalinhamentos e isento de poluição visual:

1. **Topo (Cabeçalho Institucional Azul Escuro):**
   * Banner institucional com fundo escuro (`#0f172a`) e borda inferior azul corporativo (`#2563eb`).
   * Lado esquerdo: Título `CCO SECURITY SUITE CENTRAL DE CONTROLE OPERACIONAL` e linha de identificação do operador em maiúsculas: `SEGURANÇA PATRIMONIAL & CONTROLE DE ACESSO — OPERADOR: [NOME DO OPERADOR]`.
   * Lado direito: **Caixa lateral contendo APENAS o Protocolo (`RO-2026-XXXX`) e a `GRAVIDADE: [MÉDIA/ALTA/BAIXA]`**. Nenhum outro texto polui este bloco.
2. **Subtítulo Oficial:**
   * Título destacado: `RELATÓRIO DE OCORRÊNCIA (RO)`.
   * Subtítulo formal: *"Documento emitido para apuração, registro de fatos e controle da segurança patrimonial"*.
3. **Aprovadores (Grid Superior):**
   * Bloco posicionado **exclusivamente no topo**, logo abaixo do subtítulo e antes do corpo do texto:
     * **GERENTE DE SITE:** Aprovação Executiva.
     * **COORDENAÇÃO DE SEGURANÇA:** Supervisão Técnica.
     * **FISCAL DE CONTRATO:** Fiscalização e Auditoria.
   * *Garantia de Padrão:* Os blocos de aprovação nunca aparecem no meio do relato ou no rodapé.
4. **Seção 1: 1. DADOS GERAIS DO FATO:**
   * Tabela limpa e alinhada contendo: `DATA DO FATO`, `HORÁRIO`, `PRÉDIO / ÁREA (LOCAL)` e `TÓPICO & GRAVIDADE`.
5. **Título da Ocorrência:**
   * Bloco horizontal com fundo suave: `TÍTULO: [NOME DA OCORRÊNCIA]`.
6. **Seção 2: 2. RELATO CRONOLÓGICO DOS FATOS:**
   * Bloco em texto corrido e fluido com narrativa factual completa dos acontecimentos.
7. **Seção 3: 3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS:**
   * Tabela formal sem campos de digitação (somente leitura), com colunas padronizadas:
     * `#` | `Nome Completo` | `Função / Cargo` | `Empresa` | `Matrícula`
8. **Seção 4: 4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS:**
   * Galeria organizada com fotos em moldura limpa e legendas identificadas como `Anexo X - [Descrição]`.
9. **Rodapé Final de Auditoria:**
   * Barra horizontal única no rodapé: `CCO Security Suite • Protocolo: RO-2026-XXXX • Operador: [Nome] • Emitido em: DD/MM/AAAA às HH:MM | Página 1 de 1`.

#### Diretriz de Isenção Total de Poluição Visual:
* Não são exibidas caixas de assinaturas picotadas, rabiscos digitais, hashes visuais criptográficos gigantes, botões ou badges de edição na folha impressa. A impressão (`@media print` ou exportação em PDF) gera um documento 100% limpo e executivo.

---

## 4. Ferramenta 2: Controle de Credenciais Provisórias

Gerencia os cartões de acesso temporários entregues a colaboradores que comparecem à Portaria 1 ou Portaria 2 sem o crachá funcional regular.

![Ferramenta 2 - Controle de Credenciais Provisórias](./prints/credenciais_provisorias.png)

### 4.1 Barra de Pesquisa e Filtros Rápidos
* **Campo de Busca:** Localização imediata por nome do colaborador ou empresa prestadora.
* **Filtros de Status:** *Todos*, *Pendentes (Em Aberto)* e *Devolvidos*.
* **Botão `+ Nova Credencial`:** Abre o modal de lançamento de nova concessão.

### 4.2 Formulário de Cadastro de Credencial
Ao clicar em **+ Nova Credencial**, preencha:
* **Nome Completo do Colaborador**
* **Empresa Prestadora**
* **Número do Cartão Provisório**
* **Portaria de Atendimento:** `Portaria 1 (P1)` ou `Portaria 2 (P2)`.
* **Vigilante de Campo Responsável:** Seleção do vigilante físico que efetuou a entrega da credencial no posto.
* **Motivo / Observação:** *ESQUECEU*, *PERDEU*, *COM DEFEITO*, *RETIDO*, *OUTROS*.
* Clique em **Registrar Acesso**. O sistema grava o registro e carimba automaticamente a data e o horário da concessão.

### 4.3 A Regra Crítica de Reincidência (Limite de 3 Acessos/Mês)
> **Atenção Máxima do Operador:**  
> Todo colaborador tem o direito operacional de retirar até **3 credenciais provisórias por mês civil**.  
> Quando o operador cadastra a **4ª retirada** para o mesmo colaborador no mesmo mês, o sistema aplica compulsoriamente a etiqueta vermelha destacada: **`REINCIDENTE`**.  
> O colaborador deve ser orientado sobre a norma interna e seu nome passará a constar na lista de reincidências do Dashboard Executivo.

### 4.4 Processo de Devolução (Dar Baixa)
1. Localize o colaborador na lista de pendentes.
2. Clique no botão **Dar Baixa / Devolver**.
3. O sistema grava o horário de retorno, calcula a permanência total e libera o cartão para novo uso na portaria.

---

## 5. Ferramenta 3: Controle de Visitantes e Painel de Slots

Gerencia a entrada, permanência e saída de visitantes, prestadores pontuais, auditores e fornecedores na planta corporativa.

![Ferramenta 3 - Controle de Visitantes e Painel de Slots](./prints/controle_visitantes.png)

### 5.1 Painel Visual de Slots por Portaria
* **Slot Verde / Livre:** Crachá disponível na portaria, pronto para entrega.
* **Slot Azul / Ocupado:** Visitante ativo dentro da planta portando o crachá correspondente, com **cronômetro de permanência ativo**.

### 5.2 Registro de Entrada e Checkout
1. Clique em **+ Novo Visitante** (ou clique diretamente sobre um slot livre).
2. Informe: Nome Completo, Documento Oficial (RG ou CPF), Empresa, Anfitrião/Setor de Destino e Cartão.
3. Clique em **Confirmar Entrada**.
4. No momento da saída, clique em **Registrar Saída (Checkout)** para encerrar a visita e liberar o crachá.

---

## 6. Ferramenta 4: Gestão de RFID e Chaves Mestras

Garante a cadeia de custódia e o inventário em tempo real das chaves mestras de prédios, salas técnicas, subestações, portões perimetrais e tags de docas.

![Ferramenta 4 - Gestão de RFID e Claviculário de Chaves](./prints/controle_rfid.png)

### 6.1 Procedimento de Empréstimo e Devolução
1. **Cautela:** Selecione o item, informe solicitante, empresa, setor de destino e motivo. Confirme para marcar o item como *Em Uso*.
2. **Devolução:** Localize o item cautelado, clique em **Confirmar Devolução**. O sistema calcula a duração da custódia e retorna o item para o status *Disponível*.

---

## 7. Painel de Configurações Administrativas (Área Restrita)

O módulo de configurações permite parametrizar o sistema e executar rotinas de segurança sob controle da liderança da CCO.

![Painel Administrativo de Configurações e Senha Mestra](./prints/configuracoes.png)

### 7.1 Bloqueio e Blindagem de Segurança (safeStorage DPAPI & PBKDF2)
1. **Acesso Protegido:** Ao clicar em **Configurações** no menu lateral, o sistema solicita a **Senha Mestra** administrativa.
2. **Criptografia Nível Bancário (Zero Senhas em Texto Plano):**
   * O sistema implementou o módulo `cryptoHelper.cjs` integrado ao processo principal do Electron.
   * A senha mestra é protegida nativamente pelo **Windows Data Protection API (DPAPI)** através do `safeStorage` do Electron. Em ambientes sem DPAPI disponível, o sistema emprega derivação criptográfica **PBKDF2 com Salt aleatório de 16 bytes e 100.000 iterações de HMAC-SHA256**.
   * Nenhum arquivo em disco armazena senhas legíveis por humanos.
3. **Fluxo de Alteração de Senha Mestra:**
   * Para alterar a senha, acesse a aba **Segurança & Senha Mestra**.
   * O sistema exige a confirmação da senha atual antes de aceitar a nova credencial.
   * A nova credencial passa por validação de tamanho mínimo e complexidade e é gravada de forma criptografada imediatamente.

---

### 7.2 Gerenciamento Dinâmico de Cargos e Funções
A CCO Security Suite dispõe de um módulo dedicado para centralização da estrutura hierárquica e operacional do complexo:
* **Aba "Cargos e Funções":** Permite cadastrar, editar e remover nomenclaturas de cargos corporativos (ex: *Supervisor de Operações*, *Operador de CCO I/II*, *Vigilante Líder*, *Vigilante Patrimonial*, *Bombeiro Civil*, *Técnico de Segurança*, *Fiscal de Piso*).
* **Reatividade Global em 100% dos Formulários:**
  * O cadastro de **Operadores CCO** consome dinamicamente os cargos ativos cadastrados.
  * O cadastro de **Vigilantes de Campo** consome a mesma matriz centralizada.
  * O formulário de **Envolvidos em Ocorrências (RO)** oferece preenchimento e autocomplete baseado nas funções homologadas.
  * Alterações ou novos cargos disparam o evento global `cco_cargos_changed`, atualizando instantaneamente todos os formulários da suíte sem necessidade de reiniciar a aplicação.

---

### 7.3 Arquitetura de Usuários & Gerenciamento de Efetivo
A tela de configurações possui abas dedicadas para o cadastro e separação de funções:
* **Operadores CCO (Central):** Cadastro de profissionais com acesso ao software desktop (Nome, Matrícula, Cargo, Escala de Turno e status Ativo/Inativo).
* **Efetivo de Vigilância de Campo:** Cadastro de vigilantes alocados nas Portarias 1 e 2 e Ronda, utilizados para vínculo operacional nas credenciais provisórias.

---

### 7.4 Responsáveis do Site & Diretório de Salvamento em Rede (Auditoria & Compliance)

O CCO Security Suite permite a parametrização dos responsáveis corporativos cujos nomes e cargos constam formalmente no rodapé e blocos de assinatura de todos os Relatórios de Ocorrência (RO) e Relatórios Executivos em PDF, além do caminho físico onde os arquivos serão arquivados:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│        RESPONSÁVEIS INSTITUCIONAIS & DIRETÓRIO DE ARQUIVAMENTO               │
├────────────────────────────┬─────────────────────────────────────────────────┤
│ Gerência de Operações      │ Nome do Gerente Geral do Complexo / Planta      │
│ Coordenação de Segurança   │ Coordenador ou Supervisor da Segurança Local   │
│ Fiscalização de Contrato   │ Fiscal técnico responsável pelo contrato        │
│ Local de Salvamento / Rede │ Caminho absoluto (ex: C:\...) ou UNC de rede    │
└────────────────────────────┴─────────────────────────────────────────────────┘
```

#### A. Como Selecionar e Validar a Pasta de Salvamento:
1. Acesse **Configurações** > aba **Responsáveis e Diretório**.
2. No campo **Local de Salvamento / Diretório de Rede**, você pode:
   * Clicar no botão **`Procurar Pasta`**: Abre a caixa de diálogo nativa do Windows Explorer (`dialog.showOpenDialog`) para navegar e selecionar qualquer diretório no computador, pendrive ou pasta mapeada de rede.
   * Digitar ou colar manualmente um caminho absoluto (ex: `C:\Relatorios_CCO` ou `D:\Seguranca\Setembro_2026`) ou compartilhamento corporativo UNC (ex: `\\servidor01\seguranca\relatorios`).
   * Clicar no botão **`Abrir Pasta (Explorer)`** (ícone com seta externa) para abrir instantaneamente o diretório no Windows Explorer e conferir os arquivos gerados.
3. Clique em **Salvar Parâmetros** no rodapé para persistir as alterações.

#### B. Nomenclatura Dinâmica Oficial de Arquivos Exportados:
Para garantir perfeita indexação no Windows Explorer e em backups corporativos, todos os documentos gerados pelo sistema obedecem a padrões rígidos de nomenclatura:
* **Relatório de Ocorrência (RO):** `Ocorrência [Protocolo RO] - [Tópico] & [Gravidade] - [Data].pdf`  
  *(Exemplo: `Ocorrência RO-2026-004 - USO INDEVIDO DE EPI & MÉDIA - 18-09-2026.pdf`)*
* **Relatório Executivo Consolidado:** `Relatorio_Executivo_CCO_[Periodo]_[Data].pdf`  
  *(Exemplo: `Relatorio_Executivo_CCO_mes_atual_2026-09-18.pdf`)*
* **Cobrança de 2ª Via / Ressarcimento:** `Cobranca_2via_Credencial_[Colaborador]_[Data].pdf`
* **Backup Geral do Sistema:** `backup_cco_YYYY-MM-DD_HH-mm-ss.json`

#### C. Garantia de Redundância e Salvamento Concorrente:
* **Dupla Proteção:** Sempre que um Relatório de Ocorrência é finalizado ou um Relatório Executivo é exportado, o sistema salva automaticamente uma via no diretório configurado E garante uma cópia inviolável na pasta segura do sistema em `Documentos\CCO Security Suite\exports`.
* **Resolução Automática:** Caso uma pasta de rede esteja temporariamente desconectada ou sem permissão de escrita, o sistema notifica o operador via aviso em tela e preserva o documento intacto na pasta Documentos, eliminando qualquer risco de perda de relatório.
* **Persistência Centralizada:** As configurações são gravadas fisicamente no arquivo `data/responsaveis.json` e espelhadas na base local (`localStorage`), disparando notificações em tempo real para todos os módulos abertos.

---

### 7.5 Padronização Visual das Tabelas (`SortableHeader`) e Acessibilidade
* **Ordenação Bidirecional em 100% das Tabelas:** Todas as telas de listagem (Ocorrências, Provisórios, Visitantes, RFID, Operadores e Vigilantes) contam com o componente padronizado `SortableHeader`, exibindo setinhas interativas de ordenação alfabética, cronológica e numérica para auditorias ágeis.
* **Gerenciador de Foco e Atalhos (`ModalKeyboardManager`):** Todas as janelas modais suportam fechamento imediato via tecla `ESC`, submissão rápida via tecla `Enter` e controle refinado de acessibilidade sem perda de dados digitados.

---

### 7.6 Módulo de Backup & Restauração (Merge Inteligente)

O CCO Security Suite dispõe de uma central moderna e segura de salvamento e recuperação de dados na aba de Configurações:

```
[ Fazer Backup / Exportar ]   [ Restaurar Backup / Importar ]
```

#### A. Como Fazer o Backup / Exportar Dados
1. No painel de Configurações, acerte na seção **Backup & Restauração de Dados**.
2. Clique no botão azul **Fazer Backup / Exportar**.
3. O sistema abre a janela nativa do Windows Explorer (`dialog.showSaveDialog`), sugerindo automaticamente o nome `backup_cco_YYYY-MM-DD_HH-mm-ss.json`.
4. Escolha a pasta de destino (Pen Drive, disco local ou rede segura) e confirme.
5. O sistema unifica todos os bancos de dados (`ocorrencias`, `provisorios`, `visitantes`, `operadores`, `vigilantes`, `turnos`, `observacoes`, `rfid`, `responsaveis`, `seguranca`) em um único arquivo estruturado.

#### B. Como Restaurar um Backup com Merge Inteligente (Anti-Duplicidade)
1. Clique no botão esmeralda **Restaurar Backup / Importar**.
2. O sistema abre a janela nativa do Windows Explorer (`dialog.showOpenDialog`) para você selecionar o arquivo `.json` de backup.
3. **Modal de Diagnóstico Prévio (Anti-Duplicidade):**
   * O sistema analisa o arquivo antes de aplicar qualquer alteração.
   * Apresenta contadores em tempo real:
     * Total de registros no arquivo;
     * **Novos Registros a Integrar** (inéditos que serão incorporados);
     * **Registros Já Existentes** (que serão rigorosamente mantidos);
     * **Duplicidades Evitadas** (que foram descartadas para não poluir o banco).
4. Clique em **Confirmar Restauração**.
5. O mecanismo de **Merge Inteligente** executa a fusão não-destrutiva baseada nos protocolos oficiais (`RO-2026-XXXX`) e chaves primárias compostas.
6. Ao término, um modal de feedback exibe o resumo completo da operação e atualiza as telas operacionais em tempo real.

---

## 8. Exportação de Relatórios e Auditorias

### 8.1 Relatório Executivo do Dashboard em PDF
* **Finalidade:** Utilizado em reuniões diárias (DDS), auditorias e apresentações mensais à diretoria.
* **Como Gerar:** No Dashboard Executivo, defina o período e clique em **Relatório PDF**.
* **Características:** Formato A4 institucional com gráficos, KPIs e bloco de assinaturas executivas.

### 8.2 Base Consolidada em Excel (.xlsx)
* **Finalidade:** Utilizada pelos setores de Facilities, Inteligência e RH para cruzamento de dados.
* **Como Gerar:** No Dashboard Executivo, clique em **Base Excel** para baixar a planilha estruturada com todas as abas.

---

## 9. Suporte Técnico e Autoria do Software

![Modal Sobre o Sistema e Direitos Autorais](./prints/sobre.png)

O **CCO Security Suite** é uma solução corporativa desenvolvida e homologada pela **TecPrimus Soluções Tecnológicas**:

* **Desenvolvedor & Arquiteto:** Yago Marinho
* **Empresa:** TecPrimus Soluções Tecnológicas
* **Versão Oficial:** Rev 1.1 (Release Oficial de Produção - 2026)
* **LinkedIn:** [https://www.linkedin.com/in/yago-marinho-b8a309141/](https://www.linkedin.com/in/yago-marinho-b8a309141/)
* **GitHub:** [https://github.com/YagoVasconcelos](https://github.com/YagoVasconcelos)
* **E-mail de Suporte:** `tecprimus2021@outlook.com`
* **Aviso Legal & Propriedade Intelectual:** Obra protegida nos termos da Lei nº 9.609/1998 e Lei nº 9.610/1998 (Copyright © 2026). Todos os direitos reservados à TecPrimus Soluções Tecnológicas. É estritamente vedada a reprodução desautorizada, engenharia reversa ou distribuição sem licenciamento formal.

---
*Manual oficial de operação homologado para a versão Rev 1.1.*
