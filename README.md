# 🛡️ CCO Security Suite — Rev 1.1

<div align="center">

![Versão](https://img.shields.io/badge/Vers%C3%A3o-Rev%201.1%20(2026)-0ea5e9.svg?style=for-the-badge&logo=electron&logoColor=white)
![Status](https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o%20%2F%20Miss%C3%A3o%20Cr%C3%ADtica-10b981.svg?style=for-the-badge)
![Plataforma](https://img.shields.io/badge/Plataforma-Windows%2010%20%2F%2011%20x64-3b82f6.svg?style=for-the-badge&logo=windows&logoColor=white)
![Stack](https://img.shields.io/badge/Stack-Electron%2044%20%7C%20React%2018%20%7C%20Node%20%7C%20Tailwind%20%7C%20SQLite-6366f1.svg?style=for-the-badge&logo=react&logoColor=white)
![Segurança](https://img.shields.io/badge/Criptografia-safeStorage%20DPAPI%20%2B%20PBKDF2--SHA512-ec4899.svg?style=for-the-badge&logo=securityscorecard&logoColor=white)
![Propriedade](https://img.shields.io/badge/Propriedade-TecPrimus%20Solu%C3%A7%C3%B5es-f59e0b.svg?style=for-the-badge)

**Central de Controle Operacional — Plataforma Integrada de Inteligência de Segurança Patrimonial, Controle de Acessos e Auditoria Corporativa**

[Visão Geral](#-1-visão-geral-da-solução) • [Arquitetura & Pilares](#-2-arquitetura-e-os-4-pilares-do-sistema) • [Dashboard Executivo](#-3-dashboard-executivo-de-4-módulos-paisagem) • [Política Financeira](#-4-política-financeira-fixa-de-2ª-via-r-3000) • [Segurança Criptográfica](#-5-segurança-criptográfica-e-blindagem-de-dados) • [Ergonomia de UI](#-6-ergonomia-de-interface-e-acessibilidade) • [Execução & Build](#-7-instruções-de-execução-e-build) • [Autoria](#-8-autoria-e-propriedade-intelectual)

---

</div>

## 📌 1. Visão Geral da Solução

O **CCO Security Suite (Rev 1.1)** é uma aplicação desktop corporativa de alta performance, projetada e homologada pela **TecPrimus Soluções Tecnológicas** para atender às exigências operacionais e regulatórias de **Centrais de Controle Operacional (CCO)**, plantas industriais, complexos logísticos, portuários e condomínios empresariais.

O ecossistema foi construído para erradicar a confecção manual de relatórios em Microsoft Word e planilhas avulsas de Excel nas portarias. A suíte centraliza todo o fluxo de segurança física em uma arquitetura **100% autônoma (Offline/Local-First)**, sem dependência de nuvem, assegurando disponibilidade operacional ininterrupta mesmo em cenários de contingência severa ou perda de conectividade externa.

### Destaques Tecnológicos e Operacionais:
* **Estrutura Linear Oficial de RO:** Relatórios periciais de ocorrência com galeria fotográfica proporcional e sem poluição visual (`@media print`).
* **Dashboard Executivo em 4 Módulos Paisagem:** Relatório analítico em A4 Landscape contínuo com isolamento total de escopo de filtros e drill-down interativo de severidade.
* **Criptografia Nível Bancário:** Eliminação de senhas em texto plano através da integração de **Windows DPAPI (`safeStorage`)** e derivação **PBKDF2-HMAC-SHA512 (100.000 iterações)**.
* **Matriz Reativa de Cargos e Funções:** Catálogo centralizado (`cargos.json`) que sincroniza dinamicamente operadores, vigilantes e envolvidos sem recarregamento de página.
* **Política Financeira de 2ª Via:** Taxa padronizada de **R$ 30,00** para cartões extraviados com emissão de Ficha Oficial de Cobrança em PDF para o RH/Financeiro da contratada.
* **Merge Inteligente Anti-Duplicidade:** Mecanismo não-destrutivo de backup e restauração com modal prévio de diagnóstico.

---

## 🏛️ 2. Arquitetura e os 4 Pilares do Sistema

O sistema estrutura a operação de segurança física em torno de **4 pilares fundamentais**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CCO SECURITY SUITE                                       │
├────────────────────┬────────────────────┬───────────────────────┬──────────────────────┤
│ 1. OCORRÊNCIAS     │ 2. PROVISÓRIOS     │ 3. VISITANTES         │ 4. RFID & CHAVES     │
│ (Sinistros & RO)   │ (Cartões Portaria) │ (Censo de Portaria)   │ (Custódia & Clavic.) │
├────────────────────┼────────────────────┼───────────────────────┼──────────────────────┤
│ • Protocolo Sequen.│ • Escaninho 20 pos.│ • Painel visual slots │ • Inventário RFID    │
│ • Taxonomia Fechada│ • Regra 3 Acessos  │ • Vínculo Anfitrião   │ • Custódia de Chaves │
│ • Quadro Envolvidos│ • Vínculo Vigilante│ • Cronômetro permanên.│ • Balanço Patrimonial│
│ • Fotos em Grade   │ • Alerta Reincidên.│ • Checkout 1 clique   │ • Taxa de Recuperação│
└────────────────────┴────────────────────┴───────────────────────┴──────────────────────┘
```

### 🚨 Pilar 1: Gestão de Ocorrências & Segurança Patrimonial (RO)
* **Protocolo Automatizado:** Sequencial anual inviolável (`RO-2026-XXXX`).
* **Taxonomia Corporativa Fechada:** Classificação padronizada por Prédio (17 instalações), Área/Setor dinâmico, Tópico da Ocorrência (16 naturezas oficiais) e Grau de Severidade (*Crítica*, *Alta*, *Média*, *Baixa*).
* **Quadro Formal de Envolvidos:** Registro completo de colaboradores e terceiros com autocomplete integrado à matriz de cargos corporativos.
* **Evidências Fotográficas:** Inclusão de imagens com redimensionamento proporcional e legendas institucionais (`Anexo X - Descrição`).
* **Regra de Não-Valoração Financeira:** O RO apura exclusivamente danos e fatos patrimoniais, sendo expressamente proibida a inserção de valores monetários no laudo.

### 🎫 Pilar 2: Controle de Credenciais Provisórias (Portarias 1 e 2)
* **Escaninho Físico de 20 Slots:** Monitoramento visual dividido entre **Portaria 1 (Slots 01 a 10)** e **Portaria 2 (Slots 11 a 20)** com taxa de ocupação instantânea.
* **Regra dos 3 Acessos (Anti-Reincidência):** Contabilidade contínua de concessões mensais por colaborador. Ao atingir a **4ª retirada no mês**, o sistema sinaliza com tag visual vermelha **`REINCIDENTE`**, exigindo advertência e cobrança de 2ª via definitiva.
* **Vínculo com Vigilante de Campo:** Todo crachá entregue ou devolvido é atrelado ao vigilante físico alocado no posto operacional.

### 👥 Pilar 3: Controle de Fluxo de Visitantes e Prestadores
* **Painel Gráfico de Slots:** Identificação rápida de crachás livres (verde) e ocupados (azul).
* **Vínculo Compulsorio de Anfitrião:** Registro obrigatório do colaborador interno responsável pela autorização e recepção da visita.
* **Censo em Tempo Real:** Cronômetro com duração da permanência no complexo e checkout ágil em 1 clique na liberação da portaria.

### 🔑 Pilar 4: Claviculário Digital e Gestão Geral RFID
* **Cadeia de Custódia:** Cautela e devolução de chaves mestras de prédios, salas elétricas, utilidades e tags de pesagem de docas.
* **Inventário Completo:** Classificação entre cartões rotativos de serviços e fixos pessoais.
* **Auditoria de Ciclo de Vida:** Controle de status (*Ativo*, *Bloqueado*, *Extraviado*, *Ressarcido/Pago*, *Reidratado*).

---

## 📊 3. Dashboard Executivo de 4 Módulos Paisagem

O Dashboard Executivo foi remodelado para operar sob o padrão de **4 Dashboards Paisagem Independentes** (A4 Landscape com paginação limpa via `@media print`), oferecendo suporte decisório à liderança:

1. **Página 1 (Paisagem):** Ocorrências & Segurança Patrimonial (KPIs, Gráfico de Severidade com drill-down interativo e 4 tabelas analíticas).
2. **Página 2 (Paisagem):** Provisórios & Cautelas de Acesso (Slots P1/P2, ranking de reincidência e cartões pendentes >24h).
3. **Página 3 (Paisagem):** Visitantes & Fluxo de Portarias (Censo ativo, ranking de anfitriões e conformidade de veículos).
4. **Página 4 (Paisagem):** RFID & Contabilidade de Acessos (Inventário de tags, perdas ativas e taxa percentual de recuperação).

### Segregação Estrita de Filtros Analíticos
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  SEPARAÇÃO LÓGICA REGRADA DE FILTROS CCO                     │
├─────────────────────────┬────────────────────────────────────────────────────┤
│ 1. Filtro Temporal      │ Afeta TODOS os 4 Dashboards (Data de corte única)  │
├─────────────────────────┼────────────────────────────────────────────────────┤
│ 2. Filtros Ocorrências  │ Afetam APENAS o Módulo 1 (Ocorrências):            │
│                         │ • Prédio / Instalação (17 prédios)                 │
│                         │ • Área / Setor (Setores dinâmicos da instalação)   │
│                         │ • Tópico da Ocorrência (16 tópicos oficiais)       │
│                         │ • Gravidade (Crítica / Alta / Média / Baixa)       │
├─────────────────────────┼────────────────────────────────────────────────────┤
│ 3. Filtro de Empresa    │ Afeta APENAS os Módulos 2, 3 e 4:                  │
│                         │ • Provisórios, Visitantes e Credenciais RFID       │
│                         │ (Empresa NUNCA mascara ocorrências de segurança)   │
└─────────────────────────┴────────────────────────────────────────────────────┘
```

---

## 💰 4. Política Financeira Fixa de 2ª Via (R$ 30,00)

Para coibir o esquecimento habitual de credenciais e ressarcir despesas operacionais de confecção de cartões RFID, a suíte implementa a **Taxa Administrativa Padronizada de R$ 30,00**:
* **Aplicação Universal:** Disparada automaticamente sempre que uma credencial provisória, tag RFID ou crachá de visitante for classificado como `PERDEU`, `EXTRAVIADO` ou `DANIFICADO`.
* **Modal de Cobrança 2ª Via:** Centraliza todas as inadimplências patrimoniais abertas, indicando o valor consolidado a ressarcir e valores já quitados.
* **Emissão de Ficha Oficial em PDF:** Gera o documento de ressarcimento (`Cobranca_2via_Credencial_[Nome]_[Data].pdf`) contendo protocolo formal, identificação do colaborador, CNPJ da contratada e instruções financeiras para desconto em fatura corporativa.

---

## 🔒 5. Segurança Criptográfica e Blindagem de Dados

A CCO Security Suite aplica as melhores práticas da engenharia de segurança em sistemas desktop para proteção da **Senha Mestra**:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  BLINDAGEM CRIPTOGRÁFICA DE DADOS (CCO_SECURE_V2)            │
├────────────────────────────┬─────────────────────────────────────────────────┤
│ Windows DPAPI              │ Electron safeStorage atrelado ao usuário do SO  │
│ PBKDF2-HMAC-SHA512         │ 100.000 iterações com salt aleatório de 32 bytes│
│ Timing-Attack Resistance   │ Comparação em tempo constante via timingSafeEqual│
│ Auto-Migração Transparente │ Migração instantânea de senhas legadas em texto │
└────────────────────────────┴─────────────────────────────────────────────────┘
```

* **Zero Senhas em Texto Plano:** O arquivo `data/seguranca.json` armazena exclusivamente hashes criptográficos de alta entropia ou cifras DPAPI.
* **Separação Rigorosa de Papéis:**
  * **Operadores CCO:** Contas com credencial de acesso ao software para emissão de relatórios e controle de acessos.
  * **Vigilantes de Campo:** Registros físicos para assinatura e vínculo de crachás nas portarias, **sem permissão de login na aplicação**.

---

## 🎨 6. Ergonomia de Interface e Acessibilidade

* **Ordenação Bidirecional em 100% das Tabelas (`SortableHeader`):** Indicadores visuais de ordenação (setas clicáveis ascendente/descendente) em todas as colunas de dados (texto, números, datas e protocolos).
* **Navegação Eficiente por Teclado (`ModalKeyboardManager`):** Fechamento ágil de qualquer modal através da tecla `ESC` e submissão rápida com `Enter`, mantendo o foco retido e prevenindo acionamento acidental de elementos ao fundo.
* **Dark Mode de Alto Contraste:** Interface corporativa projetada para centrais de monitoramento 24/7, reduzindo a fadiga visual através de tons Slate balanceados e acentuações semafóricas nítidas.

---

## 💻 7. Instruções de Execução e Build

### 7.1 Pré-requisitos
* **Sistema Operacional:** Windows 10 ou 11 (64 bits).
* **Node.js:** Versão `18.x` ou superior (LTS recomendada).
* **NPM:** Versão `9.x` ou superior.
* **Git:** Para clonagem do repositório.

### 7.2 Instalação Inicial
```bash
# Clonar o repositório
git clone https://github.com/YagoVasconcelos/CCO.git
cd CCO

# Instalar as dependências de desenvolvimento
cmd /c "npm install"
```

### 7.3 Execução em Desenvolvimento
```bash
# Executar o ambiente Desktop com Hot-Reload (Electron + Vite):
cmd /c "npm run electron:dev"

# Executar exclusivamente em modo Web (navegador):
cmd /c "npm run dev"
```

### 7.4 Compilação de Produção (Builds para Windows)
```bash
# 1. Gerar o Instalador Oficial Windows (.exe NSIS com assistente de instalação):
cmd /c "npm run build:exe"

# 2. Gerar a Versão Portátil Independente (.exe único sem instalação):
cmd /c "npm run build:portable"

# 3. Compilar Tudo (Instalador + Portátil + Higienização de Dados):
cmd /c "npm run build:all"
```
> Os binários executáveis finais são gerados no diretório `dist/`.

---

## 👤 8. Autoria e Propriedade Intelectual

A **CCO Security Suite** é um projeto de engenharia de software corporativo de autoria de **Yago Marinho**, desenvolvido sob os padrões de excelência técnica da **TecPrimus Soluções Tecnológicas**:

* **Arquiteto de Software & Desenvolvedor Fullstack:** Yago Marinho
* **Empresa:** TecPrimus Soluções Tecnológicas
* **Versão Oficial:** `Rev 1.1 (2026)`
* **LinkedIn:** [linkedin.com/in/yago-marinho-b8a309141](https://www.linkedin.com/in/yago-marinho-b8a309141/)
* **GitHub:** [github.com/YagoVasconcelos](https://github.com/YagoVasconcelos)
* **E-mail de Contato:** `tecprimus2021@outlook.com`

---
*CCO Security Suite — Excelência e Rigor Técnico em Gestão de Segurança Patrimonial e Centrais de Controle Operacional.*
