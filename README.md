# 🛡️ CCO Security Suite v1.0

> **Plataforma Integrada de Gestão Operacional, Inteligência de Acessos e Auditoria para Centrais de Controle Operacional (CCO)**

---

## 📌 Visão Geral do Sistema

O **CCO Security Suite v1.0** é uma solução corporativa de alta performance desenvolvida pela **TecPrimus Soluções Tecnológicas** para atender às rigorosas demandas operacionais de Centrais de Monitoramento e Segurança Patrimonial. 

O software centraliza, padroniza e automatiza a gestão de ocorrências patrimoniais, o fluxo de liberação de credenciais provisórias com aplicação de regras de reincidência, a recepção e controle de visitantes com vínculo de anfitriões, e o inventário completo de cartões RFID em tempo real.

---

## 🚀 Ferramentas Principais & Módulos

O sistema é estruturado em **1 Painel Executivo Estratégico** e **4 Ferramentas Operacionais Especializadas**:

### 📊 1. Dashboard Executivo & Indicadores Estratégicos
* **Consolidação em Tempo Real:** Totalizadores de Ocorrências (RO), Credenciais Provisórias, Visitantes Ativos e Estoque RFID.
* **Detalhamento Analítico:** 4 tabelas de apoio à tomada de decisão gerencial:
  1. *Alerta de Reincidência (Provisórios):* Identificação de colaboradores que excederam o limite mensal de acessos.
  2. *Inadimplência de Credenciais (Perdidos):* Controle de cartões extraviados sem ressarcimento (em conformidade com as diretrizes operacionais do cliente).
  3. *Produtividade CCO:* Ranking de emissões e registros por operador de plantão.
  4. *Credenciais Provisórias Pendentes:* Listagem imediata de crachás retidos e não devolvidos no dia.
* **Exportação Corporativa:**
  * **Relatório Executivo em PDF:** Layout multipágina com formatação paisagem, quebra de página inteligente (`page-break-inside: avoid`) e cabeçalho oficial.
  * **Base Analítica em Excel (.XLSX):** Pasta de trabalho completa contendo abas dedicadas para KPIs, Análise, Ocorrências, Provisórios, Visitantes e Inventário RFID.

---

### 📝 2. Ferramenta 1 (F1) – Relatório de Ocorrências (RO)
* Registro padronizado de incidentes e ocorrências patrimoniais com numeração sequencial automática (`RO-XXXX/ANO`).
* Categorização dinâmica por criticidade (Baixa, Média, Alta, Crítica), tópico e área do complexo.
* Anexo e compressão de evidências fotográficas em alta resolução.
* Geração instantânea de Relatório de Ocorrência em PDF pronto para auditoria, integrando automaticamente as assinaturas da Gerência de Operações, Coordenação de Segurança Local (SERVIS) e Fiscalização do Contrato.
* Gravação no diretório corporativo de rede (`MAPA DE CALOR`).

---

### 💳 3. Ferramenta 2 (F2) – Controle de Credenciais Provisórias (P1 / P2)
* Controle ágil de empréstimo e devolução de crachás provisórios nas portarias (Portaria Principal P1 e Portaria de Cargas P2).
* **Regra dos 3 (Anti-Reincidência):** Alerta visual imediato e bloqueio de segurança para colaboradores que atingem ou ultrapassam 3 retiradas no mês vigente por motivo de esquecimento.
* Cálculo automático do tempo de permanência entre a liberação e a devolução do cartão.
* Barra de pesquisa inteligente e filtros rápidos por status (Todos, Devolvidos, Pendentes).

---

### 👥 4. Ferramenta 3 (F3) – Controle de Visitantes
* Cadastro completo de terceiros, prestadores de serviços e visitantes externos.
* Vínculo obrigatório com Colaborador Anfitrião / Responsável interno pela autorização de entrada.
* Registro de documento (RG/CPF), empresa de origem, motivo da visita e crachá de acesso atribuído.
* Monitoramento de permanência ativa e encerramento com registro do vigilante de plantão.

---

### 📡 5. Ferramenta 4 (F4) – Gestão Geral RFID
* Monitoramento e inventário dos 351 cartões rotativos (`CSN SERVIÇOS 00` ao `350`) e cartões fixos.
* Controle de status operacional: *Disponível no Estoque*, *Em Uso / Ativo*, *Manutenção* ou *Extraviado / Perdido*.
* Métricas automáticas de perdas, reposições e índice de ressarcimento.

---

## 🔒 Segurança do Sistema & Configurações por Senha Mestra

Para garantir a integridade dos dados e impedir alterações indevidas por operadores não autorizados, o sistema possui uma arquitetura com separação de privilégios:

* **Bloqueio Administrativo:** O módulo de **Configurações** é restrito e exige autenticação via **Senha Mestra** em modal criptografado.
* **Senha Mestra Padrão de Fábrica:** `admin123` (armazenada de forma segura e configurável dentro do próprio painel).
* **Gerenciamento Dinâmico de Efetivo CCO (CRUD):** Cadastro, edição, inativação e exclusão de vigilantes e operadores da central. O dropdown de *Operador em Turno* do Dashboard e do cabeçalho lê dinamicamente essa lista.
* **CRUD de Turnos Operacionais:** Gestão dos regimes de escala (`12x36 Diurno`, `12x36 Noturno`, `Administrativo`).
* **CRUD de Observações Padrão:** Gestão das justificativas oficiais (`ESQUECEU`, `PERDEU`, `COM DEFEITO`, `RETIDO`, `OUTROS`).
* **Responsáveis do Site & Caminho de Rede:** Configuração centralizada dos nomes do Gerente do Site, Coordenador de Segurança e Fiscal do Contrato, além do caminho do diretório de rede para arquivamento digital.

---

## 💻 Tecnologias Utilizadas

| Tecnologia | Versão | Função na Aplicação |
| :--- | :--- | :--- |
| **React** | `18.3.1` | Biblioteca central para interface de usuário reativa |
| **Vite** | `6.1.0` | Bundler e ambiente de desenvolvimento ultrarrápido |
| **Tailwind CSS** | `3.4.17` | Framework utilitário moderno para estilização e responsividade |
| **Lucide React** | `1.16.0` | Iconografia consistente de alta definição |
| **jsPDF & AutoTable** | `2.5.2 / 3.8.4` | Motor de geração de relatórios e dashboards em PDF |
| **SheetJS (xlsx)** | `0.18.5` | Processamento, leitura e exportação analítica de planilhas Excel |
| **Vite API Middleware** | Customizado | Servidor de persistência local para arquivos JSON e XLSX |

---

## ⚙️ Instalação & Execução Local do Zero

Siga o passo a passo abaixo para rodar o projeto localmente em qualquer ambiente:

### 1. Pré-requisitos
* **Node.js**: Versão `18.x` ou superior ([Download Node.js](https://nodejs.org/))
* **npm**: Versão `9.x` ou superior (instalado junto com o Node)
* **Git**: Para clonagem e versionamento ([Download Git](https://git-scm.com/))

### 2. Clonagem do Repositório
```bash
git clone https://github.com/YagoVasconcelos/CCO.git
cd CCO
```

### 3. Instalação das Dependências
Instale todos os pacotes necessários definidos no `package.json`:
```bash
npm install
```

### 4. Inicialização do Banco de Dados Limpo
O repositório já inclui os arquivos de template `data/database_template.json` e `templates/database_template.json`. Caso inicialize em um ambiente novo, o sistema carrega automaticamente os valores padrão e a Senha Mestra inicial `admin123`.

### 5. Execução do Ambiente de Desenvolvimento
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O console exibirá o endereço local (geralmente `http://localhost:3000` ou `http://localhost:5173`). Abra o navegador para utilizar a aplicação.

### 6. Build de Produção
Para compilar a versão final otimizada para publicação:
```bash
npm run build
```
Para testar o build localmente via servidor de pré-visualização:
```bash
npm run preview
```

---

## 📂 Estrutura de Diretórios

```
CCO/
├── data/                       # Armazenamento JSON local (ignorado pelo Git)
│   ├── .gitkeep
│   └── database_template.json  # Modelo padrão de banco limpo para distribuição
├── exports/                    # Destino de relatórios PDF e planilhas geradas (ignorado)
│   └── .gitkeep
├── public/                     # Arquivos estáticos e logotipos
├── src/
│   ├── components/             # Componentes globais (Sidebar, Header, Modais)
│   │   ├── common/             # Modais (Senha Mestra, Sobre o Sistema, ErrorBoundary)
│   │   └── layout/             # Sidebar corporativa e Barra superior
│   ├── modules/                # Módulos operacionais e visões do sistema
│   │   ├── dashboard/          # Dashboard Executivo e Tabelas Analíticas
│   │   ├── ocorrencias/        # Gerador e Formulário de RO (F1)
│   │   ├── provisorios/        # Controle de Provisórios P1/P2 (F2)
│   │   ├── visitantes/         # Controle de Visitantes (F3)
│   │   ├── rfid/               # Gestão e Inventário RFID (F4)
│   │   └── configuracoes/      # Gestão de Efetivo, Turnos, Parâmetros e Segurança
│   ├── services/               # Regras de negócio, cálculos e exportadores
│   ├── server/                 # Plugin Vite para persistência em disco local
│   ├── App.jsx                 # Componente raiz da aplicação
│   ├── index.css               # Estilos globais e regras de impressão (@media print)
│   └── main.jsx                # Ponto de entrada React
├── templates/                  # Templates de estrutura de banco de dados
├── .gitignore                  # Regras rigorosas de sigilo e exclusão de dados
├── package.json                # Manifesto do projeto e dependências
├── README.md                   # Documentação oficial do software
└── vite.config.js              # Configuração do Vite e servidor backend embutido
```

---

## 🛡️ Autoria & Direitos Autorais

* **Desenvolvedor:** Yago Marinho
* **Empresa:** TecPrimus Soluções Tecnológicas
* **Versão Oficial:** 1.0 (Produção)
* **LinkedIn:** [linkedin.com/in/yago-marinho-b8a309141](https://www.linkedin.com/in/yago-marinho-b8a309141/)
* **GitHub:** [github.com/YagoVasconcelos](https://github.com/YagoVasconcelos)
* **E-mail de Contato:** tecprimus2021@outlook.com

### ⚖️ Licença e Proteção Legal
> **Aviso de Propriedade Intelectual (Copyright © 2026):**  
> Todos os direitos reservados à **TecPrimus Soluções Tecnológicas** e **Yago Marinho**.  
> O código-fonte, arquitetura e documentação deste software são protegidos pelas leis de direitos autorais e propriedade intelectual. É proibida a reprodução, redistribuição comercial ou alteração não autorizada sem a expressa anuência dos titulares.
