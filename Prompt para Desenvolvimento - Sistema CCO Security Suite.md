# **MASTER PROMPT PARA O ANTIGRAVITY**

# **Especificação Técnica e Funcional do Sistema CCO Security Suite**

O texto abaixo foi reestruturado em padrão profissional de Engenharia de Software. Você pode copiar o bloco de prompt e inseri-lo diretamente no Antigravity (ou Cursor/Claude Code) para iniciar a criação automatizada do projeto.

---

## **PROMPT PARA A IA / ANTIGRAVITY**

Você é um Engenheiro de Software Fullstack Sênior especialista em arquitetura de sistemas operacionais e automação de processos internos.

Crie para mim um sistema web completo, moderno, ágil e padronizado para a Central de Segurança (CCO). O objetivo principal é eliminar a geração manual de ocorrências em Microsoft Word e planilhas avulsas do Excel, unificando os fluxos operacionais em uma única aplicação web de alto nível profissional.

---

## **1\. VISÃO GERAL DA ARQUITETURA & TECNOLOGIA**

* **Tipo de Aplicação:** Sistema Web Fullstack Desktop-First (Responsivo para tablets de portaria).  
* **Tech Stack Recomendada:**  
  * **Frontend:** React (Vite \+ Tailwind CSS \+ Lucide Icons \+ Shadcn UI ou UI Library similar).  
  * **Backend / Persistência:** Node.js / Express ou Next.js (com leitura/escrita de dados em formato JSON/Excel na pasta raiz para fácil portabilidade) ou PHP (Laravel/Pure PHP).  
  * **Banco de Dados:** Arquivo de base local (SQLite ou arquivos Excel/JSON sincronizados) na pasta raiz `CCO/` para evitar burocracia de infraestrutura e permitir cópia rápida da base de dados.  
  * **Geração de Documentos:** Bibliotecas nativas para geração e exportação de PDF (`pdfmake`, `jspdf` ou `puppeteer`) e integração com arquivos templates na raiz.

---

## **2\. ESTRUTURA DE PASTAS E CONTEXTO**

O sistema utilizará como diretório base a pasta raiz `CCO/`. O sistema deve analisar e utilizar os modelos existentes nas subpastas:

* `CCO/` (Diretório Raiz)  
  * `templates/` (Modelos padrão em `.docx` para Ocorrências e `.xlsx` para Credenciais)  
  * `data/` (Bases de dados em `.xlsx` / `.json` para persistência ágil)  
  * `exports/` (Pasta configurável para salvamento automático dos PDFs)

---

## **3\. MÓDULOS E FUNCIONALIDADES DO SISTEMA**

### **FERRAMENTA 1: GERADOR DE RELATÓRIO DE OCORRÊNCIAS (RO)**

* **Objetivo:** Padronizar e agilizar a criação de relatórios de ocorrência com anexo de imagens e exportação automática em PDF.  
* **Formulário de Registro:**  
  * **Dados Gerais:** Data, Hora, Título da Ocorrência, Descrição detalhada do fato.  
  * **Upload de Imagens:** Campo para anexar fotos da ocorrência (preview imediato e ajuste de layout automático no relatório final).  
  * **Tabela 1 \- Envolvidos / Identificação de Pessoas:**  
    * Campos: Nome Completo, Função, Empresa, Matrícula.  
    * Caso a pessoa não seja identificada, deve haver um botão de atalho/checkbox que preenche automaticamente o registro como **"(Não identificado)"**.  
* **Menu de Configurações / Responsáveis do Site (Valores Padrão Dinâmicos):**  
  * Permitir editar facilmente os nomes dos responsáveis que constam no rodapé/cabeçalho dos relatórios sem alterar código:  
    * *Gerente de Site "Ecoparque":* Default: **Alcimara Silva**  
    * *Coordenação:* Default: **Ordiley Batista – Coordenador de segurança local \- SERVIS**  
    * *Fiscal de Contrato:* Default: **Roberta Santos**  
* **Automação de Salvamento e PDF:**  
  * Permitir configurar um caminho de rede padrão para salvamento automático (Exemplo de estrutura dinâmica: `MAPA DE CALOR/2026/09.SETEMBRO`).  
  * Ao clicar em "Salvar Relatório", o sistema deve:  
    1. Salvar o registro no histórico/base de dados.  
    2. Gerar automaticamente o arquivo PDF formatado idêntico ao modelo Word padrão da central.  
    3. Fazer o download e/ou salvar diretamente na pasta de rede configurada.

---

### **FERRAMENTA 2: CONTROLE DE CREDENCIAIS PROVISÓRIAS**

* **Objetivo:** Registrar a saída e devolução de cartões provisórios para colaboradores e visitantes por portaria.  
* **Estrutura dos Cartões por Portaria:**  
  * *Portaria 1 (P1):* Cartões Provisórios de **01 a 10** | Visitantes de **01 a 20**.  
  * *Portaria 2 (P2):* Cartões Provisórios de **11 a 20** | Visitantes de **21 a 40**.  
  * *Expansão:* Permitir cadastrar e incluir novos intervalos e novas portarias dinamicamente.  
* **Fluxo de Operação & Preenchimento Inteligente:**  
  * **Busca Automática / Autocomplete:** Ao digitar o nome do colaborador, o sistema consulta a base histórica e sugere o preenchimento automático dos complementos (Empresa, Matrícula, Cargo).  
  * **Registros de Tempo (Timestamps):**  
    * *Data/Hora de Retirada:* Registrada automaticamente no momento da inclusão.  
    * *Data/Hora de Devolução:* Registrada no momento da baixa/devolução.  
  * **Status da Credencial:** `Devolvido` | `Não Devolvido` (Pendências ficam destacadas em vermelho para sinalizar necessidade de confecção de 2ª via e cobrança).  
  * **Menu de Observações Padrão (Dropdown \+ Outros):**  
    * Opções pré-definidas: `ESQUECEU`, `PERDEU`, `ATM`, `COM DEFEITO`, `BLOQUEADO`, `RETORNO DE FÉRIAS`, `RETORNO DE LICENÇA`, `AINDA NÃO POSSUI`, `NÃO PASSOU`, `FURTADO`, `OUTROS`.  
    * Ao selecionar `OUTROS`, habilita um campo de texto livre para digitação.  
* **Mapeamento do Vigilante Operacional:**  
  * Campo para selecionar qual vigilante informou/registrou a entrega ou devolução.  
  * Menu de cadastro/gestão de vigilantes para que seus nomes apareçam como sugestão/autocomplete ágil.  
* **Regra de Negócio & Alerta de Limite Excedido:**  
  * **Regra dos 3 Acessos:** O limite máximo de retirada de credencial provisória é de **3 vezes no mês** ou seguidas.  
  * Se o colaborador ultrapassar esse limite, o sistema deve exibir um **Alerta Visual Amarelo/Vermelho** sinalizando a recorrência (permitindo a liberação mediante justificativa da cliente ou situação atípica).  
* **Dashboards e Métricas:**  
  * Gráfico com quantitativo de retiradas por colaborador no mês.  
  * Relatório de cartões perdidos/não devolvidos.  
  * Exportação de dados para Excel/PDF.

---

### **FERRAMENTA 3: CONTROLE DE LIBERAÇÃO DE CREDENCIAIS PARA VISITANTES**

* **Objetivo:** Registrar o acesso de visitantes no site.  
* **Funcionamento:** Idêntico ao Módulo de Credencial Provisória, contendo as mesmas validações, buscas e status.  
* **Diferencial Obrigatório:**  
  * Inclusão do campo **Anfitrião (Solicitante)**: Nome e área/empresa do colaborador interno da empresa que autorizou e solicitou a credencial para o visitante.

---

### **FERRAMENTA 4: GESTÃO GERAL DE CREDENCIAIS (FIXAS E ROTATIVAS / RFID)**

* **Objetivo:** Cadastro centralizado de todo o inventário de cartões RFID e acompanhamento do ciclo de vida das credenciais.  
* **Tipos de Cartões:**  
  * *Rotativos / Serviços:* Intervalo de **0 a 350**.  
  * *Cartões Fixos:* Vinculados permanentemente ao colaborador (Contém o nome impresso e o código impresso de 5 dígitos no verso).  
* **Chave Primária & Campos Obrigatórios:**  
  * **Chave Primária / Identificador Único:** Código interno RFID do cartão (**6 a 10 dígitos** alfa-numéricos ou numéricos).  
  * **Código Impresso Verso:** 5 dígitos.  
  * **Nome Completo do Colaborador**  
  * **Empresa**  
  * **Data de Liberação / Ativação**  
* **Indicadores e Métricas Gerais (Dashboard do Módulo):**  
  * Total de cartões confeccionados e liberados no mês.  
  * Total de cartões perdidos vs. pagos/ressarcidos.  
  * Total de cartões devolvidos e reidratados/disponíveis para reutilização.

---

## **4\. DASHBOARDS E RELATÓRIOS EXPORTÁVEIS**

Crie um painel executivo (Dashboard) unificado com visualização limpa e moderna:

1. **Cards Principais:** Ocorrências no Mês, Credenciais Pendentes de Devolução, Taxa de Reincidência (\> 3 retiradas provisórias), Cartões Perdidos/Pagos.  
2. **Filtros Avançados:** Por Período (Dia/Mês/Ano), Portaria (P1/P2), Tipo de Ocorrência, Empresa do Colaborador.  
3. **Exportações:** Botões para exportação rápida dos dados filtrados em **Excel (.xlsx)** e relatórios consolidados em **PDF**.

---

## **5\. REQUISITOS DA INTERFACE DE USUÁRIO (UI/UX)**

* **Tema:** Profissional, limpo, moderno, com tons corporativos de azul escuro, cinza e branco.  
* **Navegação:** Menu lateral fixo (Sidebar) com acesso rápido aos 4 módulos, Configurações e Dashboards.  
* **Agilidade na Digitação:** Foco total em atalhos de teclado, sugestões automáticas (autocomplete) e campos auto-preenchíveis para minimizar o tempo digitado pelo vigilante/operador.

---

## **6\. PASSO A PASSO PARA INICIAR A CRIAÇÃO**

1. Monte a estrutura de pastas e arquivos da aplicação.  
2. Crie a camada de dados em memória/arquivos locais sincronizados em `.json` ou `.xlsx`.  
3. Desenvolva os componentes de tela para cada um dos 4 módulos.  
4. Implemente as rotinas de geração de PDF e exportação para a pasta `CCO/exports`.  
5. Apresente o código completo e as instruções de execução local.

---

## **Tabela de Resumo das Regras de Negócio e Atalhos**

| Módulo | Campo Chave | Regra de Negócio Crítica | Ação de Automação |
| :---- | :---- | :---- | :---- |
| **Ocorrências** | ID da Ocorrência | Se sem dados de pessoa $\\rightarrow$ utilizar `(Não identificado)`. | Gerar PDF formatado na pasta de rede e incluir fotos. |
| **Provisórios** | Nome / Empresa | Bloqueio/Alerta visual se retirado mais de **3x no mês**. | Autocomplete de colaborador e timestamp no clique de baixa. |
| **Visitantes** | Nome do Visitante | Obrigatório vínculo com o **Anfitrião** responsável. | Registro de histórico de acesso vinculado ao anfitrião. |
| **Gestão RFID** | Código RFID (6-10 dígitos) | Chave primária do cartão. Controle de fixos vs rotativos (0-350). | Contabilidade de cartões perdidos, pagos e reutilizáveis. |

*Inicie o desenvolvimento com foco na interface limpa e na geração perfeita do relatório de ocorrências.*