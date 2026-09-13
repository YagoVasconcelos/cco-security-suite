# 🛡️ CCO Security Suite — Rev 1.0

<div align="center">

![Versão](https://img.shields.io/badge/Vers%C3%A3o-Rev%201.0-0ea5e9.svg?style=for-the-badge&logo=electron&logoColor=white)
![Status](https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o%20%2F%20Corporativo-10b981.svg?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%2010%20%2F%2011%20x64-3b82f6.svg?style=for-the-badge&logo=windows&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-Electron%2044%20%7C%20React%2018%20%7C%20Node-6366f1.svg?style=for-the-badge&logo=react&logoColor=white)
![Propriedade](https://img.shields.io/badge/Propriedade-TecPrimus%20Solu%C3%A7%C3%B5es-f59e0b.svg?style=for-the-badge)

**Central de Controle Operacional — Plataforma Integrada de Inteligência de Segurança Patrimonial, Controle de Acessos e Auditoria Corporativa**

---

</div>

## 📌 1. Visão Geral do Sistema

O **CCO Security Suite (Rev 1.0)** é uma solução de software corporativa nativa para desktop (Windows), projetada e desenvolvida pela **TecPrimus Soluções Tecnológicas** para atender às exigências operacionais e regulatórias de **Centrais de Controle Operacional (CCO)**, complexos industriais, condomínios corporativos, centros logísticos e plantas produtivas.

O sistema elimina definitivamente o uso de formulários manuais em papel, livros físicos de ocorrência e planilhas descentralizadas de Excel, consolidando todo o ciclo operacional em um ambiente unificado, altamente seguro, auditável e **100% autônomo (operação offline sem dependência de internet ou nuvem)**.

### Destaques Estratégicos da Release Rev 1.0:
* **Relatórios Oficiais Limpos:** Unificação da tela com o documento executivo impresso em estrutura linear estrita, sem poluição visual.
* **Segurança e Merge Inteligente:** Módulo nativo de Backup e Restauração com algoritmo anti-duplicidade para consolidação de dados.
* **Governança de Perfis:** Separação estrita entre Operadores da Central (software) e Efetivo de Vigilância de Campo (vínculo físico de crachás).
* **Salvamento Concorrente e Resiliente:** Parametrização de diretório de rede ou disco local em Configurações com garantia de espelhamento permanente em Documentos do Windows.
* **Compliance Financeiro:** Gestão de perdas e avarias sem exposição de valores em moeda corrente, respeitando a neutralidade patrimonial da CCO.

---

## 👥 2. Arquitetura de Usuários & Separação de Papéis

Para preservar a integridade dos dados e atender às normas de governança de segurança física, o sistema estabelece uma divisão estrita entre os perfis que operam a aplicação e o efetivo que atua nos postos externos:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA DE PERFIS & RESPONSABILIDADE                  │
├──────────────────────────────────────┬───────────────────────────────────────┤
│    OPERADORES DO SISTEMA (CENTRAL)   │     EFETIVO DE VIGILÂNCIA DE CAMPO    │
├──────────────────────────────────────┼───────────────────────────────────────┤
│ • Acesso com Login ao Software CCO   │ • SEM acesso ao software ou login     │
│ • Emissão e Gestão de ROs Oficiais   │ • Alocados nos postos: P1, P2 e Ronda │
│ • Controle de Provisórios & Visitas  │ • Cadastro na base apenas para vínculo│
│ • Custódia de Chaves Mestras / RFID  │ • Rastreabilidade física de entrega   │
│ • Visualização do Dashboard Executivo│ • Rastreabilidade de recebimento      │
│ • Backup & Parâmetros (Senha Mestra) │ • Fiscalização presencial de acesso   │
└──────────────────────────────────────┴───────────────────────────────────────┘
```

1. **Operadores do Sistema (Central CCO):**  
   Profissionais alocados no console central de monitoramento. Possuem credenciais funcionais individuais para operar a aplicação desktop, preencher ocorrências, conceder credenciais temporárias, dar baixa em visitantes, monitorar indicadores analíticos e, mediante validação da **Senha Mestra**, executar manutenções e backups.
2. **Efetivo de Vigilância de Campo:**  
   Vigilantes patrimoniais posicionados fisicamente nos postos de triagem (**Portaria 1**, **Portaria 2** e **Ronda Operacional**). **Não operam o software nem possuem credenciais de acesso**. Seus nomes constam no banco de dados exclusivamente para fins de responsabilidade funcional e assinatura/vínculo no ato da entrega e recolhimento de crachás provisórios.

---

## 🚀 3. Módulos Principais do Sistema

O sistema está organizado em **1 Console Executivo Analítico** e **4 Ferramentas Operacionais Especializadas**:

### 📊 3.1 Dashboard Executivo & Inteligência Analítica
* **Painel de Indicadores em Tempo Real (KPIs):** Monitoramento contínuo de Ocorrências (RO), Provisórios Ativos, Visitantes no Complexo, Colaboradores Reincidentes e Inadimplências Patrimoniais.
* **As 4 Tabelas Estratégicas de Gestão:**
  1. *Alerta de Reincidência (Provisórios):* Identifica colaboradores com 4 ou mais retiradas no mês.
  2. *Inadimplência de Credenciais (Perdidos/Avariados):* Rastreia crachás extraviados encaminhados para apuração corporativa (**sem exibição de valores em R$**, atendendo ao compliance).
  3. *Produtividade CCO:* Rastreabilidade do volume de atendimentos e ROs por operador de plantão.
  4. *Credenciais Pendentes (>24h):* Alerta prioritário de crachás em circulação além da jornada regular.
* **Exportação Executiva:** Relatório completo em PDF formatado em A4 e base analítica completa consolidada em planilha Excel (`.xlsx`).

---

### 📝 3.2 Central de Ocorrências — Relatório de Ocorrência (RO) Oficial
A Ferramenta 1 (F1) formaliza desvios, acidentes, quase-acidentes e sinistros patrimoniais com rigor pericial:
* **Protocolo Automatizado:** Sequencial oficial inviolável no formato `RO-2026-XXXX`.
* **Taxonomia Fechada e Parametrizável:** Classificação padronizada por Prédio, Setor/Área, Grau de Severidade (Baixa, Média, Alta, Crítica) e Tópico Oficial (16 naturezas padrão).
* **Quadro de Envolvidos Dinâmico:** Cadastro de múltiplos envolvidos (Nome, Empresa Prestadora, Cargo, Matrícula e Tipo de Envolvimento).
* **Anexo Fotográfico de Evidências:** Inclusão de imagens com legendas automatizadas (`Anexo X - [Descrição]`).
* **Salvamento Concorrente:** Persistência em JSON (`data/ocorrencias.json`), atualização na planilha consolidada (`ocorrencias.xlsx`) e arquivamento digital na pasta de rede (`MAPA DE CALOR/`).

---

### 💳 3.3 Controle de Credenciais Provisórias (Portarias 1 e 2)
A Ferramenta 2 (F2) controla os crachás temporários concedidos nas portarias físicas:
* **Registro de Concessão:** Nome do colaborador, empresa prestadora, número do cartão, portaria de atendimento (P1 ou P2), justificativa (Esqueceu, Perdeu, Defeito, etc.) e vínculo com o **Vigilante de Campo**.
* **Regra dos 3 Acessos (Anti-Reincidência):** O sistema monitora o histórico mensal de cada funcionário. Ao registrar a **4ª retirada no mês corrente**, o colaborador recebe compulsoriamente a etiqueta visual vermelha **`REINCIDENTE`**, sendo notificado para orientação e inserido no relatório gerencial.
* **Baixa e Devolução Ágil:** Registro de retorno com cálculo automático do tempo de permanência.

---

### 👥 3.4 Controle de Visitantes & Painel de Slots
A Ferramenta 3 (F3) gerencia o acesso de terceiros, fornecedores e prestadores eventuais:
* **Painel Visual de Slots:** Cartões gráficos intuitivos que indicam crachás *Livres (Verde)* e *Ocupados (Azul)* em cada portaria.
* **Cadastro de Entrada Rápido:** Nome, Documento Oficial (RG/CPF), Empresa de Origem, Anfitrião / Setor Interno de Destino e Crachá Vinculado.
* **Cronômetro de Permanência Ativa:** Contagem em tempo real das horas de permanência dentro da planta.
* **Checkout em 1 Clique:** Encerramento imediato da visita com devolução do crachá para o slot disponível.

---

### 📡 3.5 Gestão Geral RFID & Claviculário Digital
A Ferramenta 4 (F4) assegura a cadeia de custódia do patrimônio móvel:
* **Inventário Centralizado:** Monitoramento de chaves mestras de prédios, salas técnicas, subestações, portões perimetrais e tags veiculares de docas.
* **Cautela e Devolução:** Registro de quem retirou, empresa, destino, justificativa e carimbo de data/hora de baixa.

---

## 💾 4. Módulo de Backup & Restauração (Merge Inteligente)

Para garantir resiliência operacional absoluta, prevenção contra perda de dados e facilidade em manutenções ou migrações de computadores da CCO, o sistema integra um módulo especializado na aba de **Configurações** (protegido por **Senha Mestra**):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  MÓDULO CORPORATIVO DE BACKUP E RESTAURAÇÃO                  │
│                                                                              │
│    [ Fazer Backup / Exportar ]            [ Restaurar Backup / Importar ]    │
│    (dialog.showSaveDialog nativo)         (Merge Inteligente Anti-Duplicidade)│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Exportação Unificada de Dados
* Coleta e compacta automaticamente todos os arquivos JSON locais da aplicação: `ocorrencias.json`, `provisorios.json`, `visitantes.json`, `operadores.json`, `vigilantes.json`, `turnos.json`, `observacoes.json`, `rfid.json`, `responsaveis.json` e `seguranca.json`.
* Dispara a caixa de diálogo nativa do Windows Explorer (`dialog.showSaveDialog`), sugerindo automaticamente o nome oficial `backup_cco_YYYY-MM-DD_HH-mm-ss.json`.
* Compatível com download via Blob em ambiente de navegador web convencional.

### 4.2 Restauração Segura com Merge Inteligente (Anti-Duplicidade)
* O operador seleciona o arquivo `.json` de backup através do `dialog.showOpenDialog`.
* **Modal de Diagnóstico Prévio:** Antes de aplicar qualquer alteração, o sistema analisa o arquivo e apresenta contadores em tempo real:
  * Total de registros no arquivo;
  * **Novos Registros a Integrar** (inéditos que serão adicionados);
  * **Registros Já Existentes** (que serão mantidos intactos);
  * **Duplicidades Evitadas** (que serão descartadas).
* **Critério Rigoroso de Chaves Únicas:**
  * *Ocorrências:* Protocolo oficial `numeroRO` (`RO-2026-XXXX`) ou `id`.
  * *Provisórios:* Chave primária composta `${cartao}_${colaborador}_${dataRetirada}_${horaRetirada}` ou `id`.
  * *Visitantes:* Chave primária composta `${documento}_${dataEntrada}_${horaEntrada}` ou `id`.
  * *Operadores & Vigilantes:* `matricula` funcional corporativa única.
* **Preservação Não-Destrutiva:** Os dados da base local **nunca são apagados ou corrompidos**. O sistema mescla novos registros, descarta repetições e regrava os arquivos JSON e a planilha Excel de forma atômica.

---

## 📄 5. Padrão Oficial de Relatórios de Ocorrência (RO) & Impressão Limpa

O **CCO Security Suite** unifica a visualização em tela com o documento executivo gerado para impressão nativa (`@media print`) e exportação em PDF, aplicando uma **Estrutura Linear Estrita em 9 Níveis**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. TOPO INSTITUCIONAL AZUL ESCURO (#0f172a)                                  │
│    CCO SECURITY SUITE CENTRAL DE CONTROLE OPERACIONAL                        │
│    SEGURANÇA PATRIMONIAL & CONTROLE DE ACESSO — OPERADOR: [NOME]             │
│    ──────────────────────────── [ CAIXA LATERAL: PROTOCOLO & GRAVIDADE ]    │
├──────────────────────────────────────────────────────────────────────────────┤
│ 2. SUBTÍTULO OFICIAL                                                         │
│    RELATÓRIO DE OCORRÊNCIA (RO)                                              │
│    Documento emitido para apuração, registro de fatos e controle...          │
├──────────────────────────────────────────────────────────────────────────────┤
│ 3. APROVADORES (GRID SUPERIOR FIXO NO TOPO)                                  │
│    [ GERENTE DE SITE ]    [ COORDENAÇÃO SEGURANÇA ]    [ FISCAL CONTRATO ]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 4. SEÇÃO 1: 1. DADOS GERAIS DO FATO                                          │
│    [ DATA DO FATO ]    [ HORÁRIO ]    [ PRÉDIO / ÁREA ]    [ TÓPICO & GRAV ] │
├──────────────────────────────────────────────────────────────────────────────┤
│ 5. TÍTULO: [NOME RESUMIDO DA OCORRÊNCIA]                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ 6. SEÇÃO 2: 2. RELATO CRONOLÓGICO DOS FATOS (Texto corrido)                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 7. SEÇÃO 3: 3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS                           │
│    (Tabela formal: # | Nome Completo | Função/Cargo | Empresa | Matrícula)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 8. SEÇÃO 4: 4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS                       │
│    (Galeria estruturada com legendas: Anexo X - Legenda)                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ 9. RODAPÉ FINAL PADRÃO DO SISTEMA                                            │
│    CCO Security Suite • Protocolo: ... • Operador: ... • Data • Pág 1 de 1   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Diretriz Estrita de Isenção de Poluição Visual:
* **Sem caixas de assinatura complexas ou rubricas picotadas** no meio do relatório ou rodapé.
* **Sem hashes criptográficos visuais gigantes** ou códigos desnecessários no corpo do documento.
* **Sem botões, modais ou campos editáveis** na folha impressa (`@media print`).
* Quebra de página inteligente (`page-break-inside: avoid`) impedindo o corte indevido de tabelas ou galerias.

---

## 💻 6. Stack Tecnológica Corporativa

| Componente | Tecnologia | Versão | Papel no Ecossistema |
| :--- | :--- | :--- | :--- |
| **Runtime Desktop** | **Electron** | `44.x` | Empacotamento nativo Windows, IPC seguro e janelas nativas |
| **Frontend Framework** | **React** | `18.3.1` | Interface reativa, modular e de alta responsividade |
| **Bundler & Dev Server** | **Vite** | `6.1.0` | Compilação ultrarrápida e middleware de desenvolvimento |
| **Estilização** | **Tailwind CSS** | `3.4.17` | Design corporativo, Dark Glassmorphism e regras de impressão |
| **Iconografia** | **Lucide React** | `1.16.0` | Ícones vetoriais modernos de alta fidelidade |
| **Geração de PDF** | **jsPDF & AutoTable** | `2.5.2 / 3.8.4` | Renderização nativa de relatórios e dashboards em PDF |
| **Planilhas Analíticas** | **SheetJS (xlsx)** | `0.18.5` | Criação, leitura e exportação de pastas de trabalho Excel |
| **Backend Local** | **Node.js HTTP Server** | Embutido | Servidor REST local (`127.0.0.1`) para I/O atômico e merge |

---

## ⚙️ 7. Instruções de Instalação, Execução e Compilação (Build)

### 7.1 Pré-requisitos
* **Sistema Operacional:** Microsoft Windows 10 ou Windows 11 (64 bits).
* **Node.js:** Versão `18.x` ou superior ([Download LTS](https://nodejs.org/)).
* **NPM:** Versão `9.x` ou superior.
* **Git:** Para versionamento e controle de código ([Download Git](https://git-scm.com/)).

### 7.2 Instalação Inicial
```bash
# 1. Clonar o repositório oficial
git clone https://github.com/YagoVasconcelos/CCO.git
cd CCO

# 2. Instalar dependências do projeto
npm install
```

---

### 7.3 Execução em Ambiente de Desenvolvimento

```bash
# Modo Web (Servidor Vite convencional no navegador):
npm run dev

# Modo Desktop Nativo (Vite + Electron com Hot-Reload):
npm run electron:dev
# ou alternativamente via Makefile:
make dev
```

---

### 7.4 Compilação de Produção (Builds para Windows)

O projeto está configurado com scripts automatizados via **electron-builder** para geração de instaladores e binários portáteis:

#### A. Gerar o Instalador Oficial Windows (`.exe` NSIS)
Gera o instalador padrão com assistente de instalação, seleção de diretório e criação de atalhos na Área de Trabalho e Menu Iniciar:
```bash
npm run build:exe
```
> **Saída:** `dist/CCO Security Suite Setup 1.0.0.exe`

#### B. Gerar o Executável Portátil (`.exe` Portable)
Gera o executável autônomo de arquivo único, pronto para ser executado diretamente de um Pen Drive ou pasta segura, sem necessidade de privilégios de administrador ou instalação no Windows:
```bash
npm run build:portable
```
> **Saída:** `dist/CCO Security Suite Portable 1.0.0.exe`

#### C. Compilar Todas as Versões Simultaneamente
Executa a higienização de dados, compilação de ícones e gera tanto o Instalador quanto a versão Portátil em uma única operação:
```bash
npm run build:all
```

---

### 7.5 Geração dos Manuais Oficiais em PDF (Normas ABNT)

```bash
# Compilação dos 3 documentos técnicos oficiais em PDF (DRS, Manual e Arquitetura):
npm run generate:docs-pdf

# Compilação do Manual do Usuário ilustrado com screenshots:
npm run build:pdf
```
> **Saída:** Pasta `docs/` (`DRS_CCO_Security_Suite.pdf`, `Manual_Usuario_CCO.pdf`, `Arquitetura_Implantacao.pdf`).

---

## 🔒 8. Diretrizes de Segurança & Parametrização

* **Acesso Restrito às Configurações:** O menu de configurações é rigorosamente bloqueado por modal criptografado.
* **Senha Mestra Inicial de Fábrica:** **`admin123`** (deve ser alterada pela supervisão no primeiro uso).
* **Armazenamento Seguro:** Persistência em `data/seguranca.json` no disco local.
* **Diretriz de Compliance Financeiro:** O sistema adota neutralidade financeira estrita. Não existem campos de moeda ou valores em R$ para evitar inconsistências contábeis com os setores de Facilities/RH da organização contratante.

---

## 🛡️ 9. Autoria, Propriedade Intelectual & Suporte

* **Desenvolvedor & Engenheiro de Software:** Yago Marinho
* **Empresa Proprietária:** TecPrimus Soluções Tecnológicas
* **Versão Homologada:** **Rev 1.0** (Release Oficial de Produção - 2026)
* **LinkedIn:** [linkedin.com/in/yago-marinho-b8a309141](https://www.linkedin.com/in/yago-marinho-b8a309141/)
* **GitHub:** [github.com/YagoVasconcelos](https://github.com/YagoVasconcelos)
* **E-mail de Suporte Técnico:** `tecprimus2021@outlook.com`

---

### ⚖️ Aviso Legal de Direitos Autorais
> **Copyright © 2026 TecPrimus Soluções Tecnológicas. Todos os direitos reservados.**  
> Esta obra de software, sua arquitetura, código-fonte, layout e respectiva documentação são protegidos pela **Lei nº 9.609, de 19 de fevereiro de 1998** (Proteção da Propriedade Intelectual de Programa de Computador) e pela **Lei nº 9.610, de 19 de fevereiro de 1998** (Lei de Direitos Autorais). É estritamente vedada a reprodução desautorizada, engenharia reversa, comercialização ou distribuição sem o consentimento formal por escrito dos detentores dos direitos.
