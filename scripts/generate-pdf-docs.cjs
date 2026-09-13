// Gerador Oficial de Documentação Técnica e de Usuário em PDF (Normas ABNT)
// CCO Security Suite Rev 1.0 - TecPrimus Soluções Tecnológicas (2026)
// Em conformidade com ABNT NBR 14724, NBR 6024, NBR 6027, NBR 6028 e Lei nº 9.609/1998 (INPI)

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

// Template base de estilo ABNT oficial para impressão A4
function getAbntCss() {
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #ffffff;
    }
    
    /* Páginas ABNT com margens: Sup 3cm, Esq 3cm, Dir 2cm, Inf 2cm */
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 30mm 20mm 20mm 30mm;
      position: relative;
      page-break-after: always;
      background: #ffffff;
      overflow: hidden;
    }
    
    /* Capa Oficial ABNT */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
      padding: 35mm 25mm 25mm 30mm;
    }
    .cover-institution {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      line-height: 1.3;
      color: #0f172a;
    }
    .cover-author {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 15mm;
      color: #1e293b;
    }
    .cover-title-box {
      margin: auto 0;
      padding: 15mm 0;
    }
    .cover-title {
      font-size: 18pt;
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.25;
      color: #020617;
      margin-bottom: 5mm;
    }
    .cover-subtitle {
      font-size: 13pt;
      font-weight: 600;
      color: #2563eb;
      line-height: 1.4;
    }
    .cover-badge {
      display: inline-block;
      margin-top: 6mm;
      padding: 2mm 5mm;
      border: 1px solid #94a3b8;
      border-radius: 4px;
      font-size: 9.5pt;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cover-footer {
      font-size: 11pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #334155;
      line-height: 1.4;
    }

    /* Folha de Rosto Oficial ABNT */
    .title-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 30mm 20mm 20mm 30mm;
    }
    .title-header {
      text-align: center;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #0f172a;
    }
    .title-center {
      text-align: center;
      margin: auto 0 8mm 0;
    }
    .title-center h1 {
      font-size: 16pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #020617;
      margin-bottom: 4mm;
    }
    .title-center h2 {
      font-size: 12pt;
      font-weight: 600;
      color: #2563eb;
    }
    .title-natureza {
      margin-left: 45%;
      text-align: justify;
      font-size: 10pt;
      line-height: 1.35;
      color: #334155;
      padding: 3mm 0 3mm 4mm;
      border-left: 2px solid #cbd5e1;
      margin-bottom: 15mm;
    }
    .title-footer {
      text-align: center;
      font-size: 11pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #334155;
    }

    /* Ficha Catalográfica / Registro de Propriedade Intelectual (INPI) */
    .catalog-card {
      border: 1.5px solid #475569;
      padding: 6mm 8mm;
      font-size: 9pt;
      line-height: 1.4;
      margin-top: 8mm;
      background: #f8fafc;
      border-radius: 4px;
    }
    .catalog-title {
      text-align: center;
      font-weight: bold;
      font-size: 9.5pt;
      margin-bottom: 3mm;
      text-transform: uppercase;
    }

    /* Elementos Textuais e Cabeçalhos Internos */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2mm;
      margin-bottom: 6mm;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .page-footer {
      position: absolute;
      bottom: 12mm;
      left: 30mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5pt;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 2mm;
    }

    /* Tipografia de Seções ABNT NBR 6024 */
    h1.sec-1 {
      font-size: 14pt;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      margin-top: 5mm;
      margin-bottom: 4mm;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1.5mm;
    }
    h2.sec-2 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #1e293b;
      margin-top: 4mm;
      margin-bottom: 2.5mm;
    }
    h3.sec-3 {
      font-size: 12pt;
      font-weight: bold;
      color: #334155;
      margin-top: 3.5mm;
      margin-bottom: 2mm;
    }

    p {
      text-align: justify;
      text-indent: 12.5mm;
      margin-bottom: 3mm;
      margin-top: 0;
    }
    p.no-indent {
      text-indent: 0;
    }

    ul, ol {
      margin-top: 1mm;
      margin-bottom: 3mm;
      padding-left: 8mm;
      text-align: justify;
    }
    li {
      margin-bottom: 1.5mm;
    }

    /* Tabelas Padrão ABNT / IBGE */
    table.abnt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin: 4mm 0 5mm 0;
    }
    table.abnt-table caption {
      font-size: 10pt;
      font-weight: bold;
      text-align: left;
      margin-bottom: 2mm;
      color: #0f172a;
    }
    table.abnt-table th {
      border-top: 1.5px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding: 2.5mm 3mm;
      text-align: left;
      font-weight: bold;
      color: #0f172a;
      background: #f1f5f9;
      text-transform: uppercase;
      font-size: 8.5pt;
    }
    table.abnt-table td {
      padding: 2mm 3mm;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
      vertical-align: top;
    }
    table.abnt-table tr:last-child td {
      border-bottom: 1.5px solid #0f172a;
    }
    .table-source {
      font-size: 8pt;
      color: #64748b;
      margin-top: 1.5mm;
      text-align: left;
    }

    /* Boxes de Destaque / Alerta Técnico */
    .callout {
      border-left: 4px solid #2563eb;
      background: #f8fafc;
      padding: 3mm 4mm;
      margin: 3mm 0 4mm 0;
      font-size: 10pt;
      color: #1e293b;
      border-radius: 0 4px 4px 0;
    }
    .callout-warning {
      border-left-color: #dc2626;
      background: #fef2f2;
    }
    .callout-title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
      margin-bottom: 1mm;
      color: #0f172a;
    }

    /* Sumário ABNT NBR 6027 */
    .toc-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2.5mm;
      font-size: 11pt;
    }
    .toc-title {
      font-weight: bold;
      text-transform: uppercase;
      color: #0f172a;
    }
    .toc-sub {
      padding-left: 6mm;
      font-weight: normal;
      text-transform: uppercase;
      font-size: 10.5pt;
      color: #334155;
    }
    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted #94a3b8;
      margin: 0 3mm 1mm 3mm;
    }
    .toc-page {
      font-weight: bold;
      color: #0f172a;
    }

    /* Assinaturas Formais */
    .sign-container {
      margin-top: 10mm;
      display: flex;
      justify-content: space-between;
      gap: 5mm;
    }
    .sign-box {
      flex: 1;
      text-align: center;
      font-size: 8.5pt;
      line-height: 1.3;
      color: #334155;
    }
    .sign-line {
      border-top: 1px solid #475569;
      margin-bottom: 2mm;
    }
  `;
}

// 1. GERADOR DO DOCUMENTO DE REQUISITOS DE SOFTWARE (DRS)
function generateDrsHtml() {
  const css = getAbntCss();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>DRS - CCO Security Suite Rev 1.0</title>
  <style>${css}</style>
</head>
<body>

  <!-- CAPA (ABNT NBR 14724) -->
  <div class="page cover-page">
    <div>
      <div class="cover-institution">
        TECPRIMUS SOLUÇÕES TECNOLÓGICAS LTDA<br>
        DIVISÃO DE ENGENHARIA DE SOFTWARE & SEGURANÇA PATRIMONIAL
      </div>
      <div class="cover-author">YAGO MARINHO</div>
    </div>

    <div class="cover-title-box">
      <div class="cover-title">DOCUMENTO DE REQUISITOS DE SOFTWARE (DRS)</div>
      <div class="cover-subtitle">ESPECIFICAÇÃO DE REQUISITOS FUNCIONAIS, NÃO FUNCIONAIS E REGRAS DE NEGÓCIO DA CENTRAL DE CONTROLE OPERACIONAL</div>
      <div class="cover-badge">SISTEMA CCO SECURITY SUITE — VERSÃO Rev 1.0 (RELEASE DE PRODUÇÃO)</div>
    </div>

    <div class="cover-footer">
      DIVISÃO DE ENGENHARIA & PRODUTOS CORPORATIVOS<br>
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- FOLHA DE ROSTO (ABNT NBR 14724) -->
  <div class="page title-page">
    <div class="title-header">
      YAGO MARINHO
    </div>

    <div class="title-center">
      <h1>DOCUMENTO DE REQUISITOS DE SOFTWARE (DRS)</h1>
      <h2>CCO SECURITY SUITE Rev 1.0</h2>
    </div>

    <div class="title-natureza">
      Documento técnico oficial integrante do registro de propriedade intelectual de programa de computador (software) CCO Security Suite junto ao Instituto Nacional da Propriedade Industrial (INPI), nos termos da Lei nº 9.609/1998 e Lei nº 9.610/1998, desenvolvido por TecPrimus Soluções Tecnológicas sob autoria de Yago Marinho.
    </div>

    <!-- Ficha de Propriedade Intelectual -->
    <div class="catalog-card">
      <div class="catalog-title">Declaração Oficial de Propriedade Intelectual & Dados da Obra</div>
      <strong>Título da Obra:</strong> CCO Security Suite (Plataforma Integrada de Inteligência de Segurança)<br>
      <strong>Autor e Desenvolvedor:</strong> Yago Marinho (TecPrimus Soluções Tecnológicas)<br>
      <strong>Ano de Criação:</strong> 2026 | <strong>Versão:</strong> 1.0 (Build Final)<br>
      <strong>Linguagens e Tecnologias:</strong> JavaScript (ES2022), React 18, Electron 44, Node.js, Tailwind CSS, SheetJS, jsPDF.<br>
      <strong>Campo de Aplicação:</strong> Segurança Patrimonial, Controle de Acesso e Gestão Operacional de Complexos Industriais.<br>
      <strong>Titularidade dos Direitos:</strong> Direitos autorais e patrimoniais reservados à TecPrimus Soluções Tecnológicas. Proteção jurídica contra reprodução não autorizada, engenharia reversa e distribuição sem licenciamento.
    </div>

    <div class="title-footer">
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- SUMÁRIO (ABNT NBR 6027) -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>Sumário</span>
    </div>

    <h1 class="sec-1">SUMÁRIO</h1>

    <div class="toc-item">
      <span class="toc-title">1 INTRODUÇÃO E ESCOPO DO SISTEMA</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.1 Objetivos e Justificativa</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.2 Público-Alvo e Atores Envolvidos</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">2 REQUISITOS FUNCIONAIS (RF)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.1 [RF01] Emissão e Gestão de Relatórios de Ocorrências (RO)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.2 [RF02] Controle de Credenciais Provisórias (P1 e P2)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.3 [RF03] Controle de Acesso e Permanência de Visitantes</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.4 [RF04] Gestão de Chaves Mestras e Dispositivos RFID</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.5 [RF05] Dashboard Executivo e Relatórios Analíticos</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.6 [RF06] Gestão Administrativa e Parametrização Restrita</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">3 REQUISITOS NÃO FUNCIONAIS (RNF)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">4 REGRAS DE NEGÓCIO CRUCIAIS (RN)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.1 [RN01] Isolamento Administrativo por Senha Mestra</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.2 [RN02] Matriz de Taxonomia Parametrizável da Planta</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.3 [RN03] Proibição Estrita de Inputs de Valores Financeiros</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.4 [RN04] Regra de Reincidência Operacional (Limite de 3 Acessos)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">5 REFERÊNCIAS NORMATIVAS E LEGAIS</span>
      <span class="toc-dots"></span>
      <span class="toc-page">10</span>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>3</span>
    </div>
  </div>

  <!-- PÁGINA 4: INTRODUÇÃO E ESCOPO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>1 Introdução e Escopo</span>
    </div>

    <h1 class="sec-1">1 INTRODUÇÃO E ESCOPO DO SISTEMA</h1>

    <p>O <strong>CCO Security Suite</strong> é um sistema computacional desenvolvido sob medida para a Central de Controle Operacional (CCO) da segurança patrimonial e inteligência de plantas industriais, complexos corporativos, centros logísticos e condomínios empresariais. O sistema centraliza a governança operacional de portarias de acesso, galpões operacionais, prédios administrativos, áreas produtivas e empresas terceirizadas prestadoras de serviços.</p>

    <h2 class="sec-2">1.1 Objetivos e Justificativa</h2>
    <p>Historicamente, a rotina de controle operacional de portarias, registros de perdas de cartões funcionais, custódia de chaves mestras e emissão de Relatórios de Ocorrências (RO) era conduzida através de anotações físicas em livros de ocorrência e planilhas descentralizadas. Tal metodologia acarretava lentidão na consolidação de indicadores, suscetibilidade a perdas de dados e divergências nas auditorias de segurança.</p>
    <p>O CCO Security Suite visa:</p>
    <ul>
      <li>Centralizar o fluxo de eventos em uma aplicação desktop de alta performance, 100% autônoma e resiliente à instabilidade de rede ou ausência de conexão com a internet;</li>
      <li>Padronizar a taxonomia de locais, setores e naturezas de sinistros através de matrizes fechadas de seleção;</li>
      <li>Automatizar o controle de concessão de credenciais provisórias, monitorando com precisão a reincidência mensal de cada colaborador;</li>
      <li>Entregar inteligência acionável à gerência e fiscalização contratual através de relatórios formais em PDF com assinaturas digitais e bases analíticas em Excel.</li>
    </ul>

    <h2 class="sec-2">1.2 Arquitetura de Usuários e Separação Estrita de Papéis</h2>
    <p>O sistema estabelece uma divisão rigorosa e auditável entre as atribuições operacionais da central e os postos físicos de campo:</p>
    <ul>
      <li><strong>Operadores do Sistema (Central CCO):</strong> Únicos perfis com credenciais de login e acesso administrativo ao software da CCO. Responsáveis pela emissão de relatórios, gestão de parâmetros, custódia de dados, painel executivo e execução do módulo de backup;</li>
      <li><strong>Efetivo de Vigilância de Campo:</strong> Cadastro dedicado aos profissionais alocados fisicamente nos postos operacionais (<strong>Portaria 1</strong>, <strong>Portaria 2</strong> e <strong>Ronda</strong>). Constam na base de dados exclusivamente para fins de responsabilidade funcional e vínculo na entrega e devolução de credenciais provisórias, <em>sem privilégios de acesso ou login no software</em>;</li>
      <li><strong>Liderança e Fiscalização:</strong> Gerente de Site, Coordenação de Segurança e Fiscal de Contrato integrados como instâncias homologatórias superiores nos relatórios corporativos.</li>
    </ul>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>4</span>
    </div>
  </div>

  <!-- PÁGINA 5: REQUISITOS FUNCIONAIS (RF01 e RF02) -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>2 Requisitos Funcionais</span>
    </div>

    <h1 class="sec-1">2 REQUISITOS FUNCIONAIS (RF)</h1>

    <h2 class="sec-2">2.1 [RF01] Emissão e Gestão de Relatórios de Ocorrências (RO)</h2>
    <p>O módulo de RO formaliza todas as anomalias, incidentes e quebras de procedimento no complexo industrial:</p>
    <ul>
      <li><strong>RF01.1 - Numeração Única Sequencial:</strong> O sistema deve gerar automaticamente um identificador único de formato <code>RO-AAAA-XXXXX</code> para cada registro, impedindo duplicidade ou sobrescrita involuntária.</li>
      <li><strong>RF01.2 - Metadados Obrigatórios:</strong> O formulário deve registrar Data, Hora, Turno Operacional, Operador Responsável, Prédio Oficial, Setor/Área, Tópico e Grau de Severidade (Baixa, Média, Alta ou Crítica).</li>
      <li><strong>RF01.3 - Registro Dinâmico de Envolvidos:</strong> Possibilidade de inclusão de múltiplos colaboradores por ocorrência, registrando Nome, Empresa Contratada, Cargo e Vínculo (Autor, Vítima, Notificante ou Testemunha).</li>
      <li><strong>RF01.4 - Evidências Fotográficas:</strong> Suporte ao upload de múltiplas imagens com compressão em base64, visualização em miniatura e exclusão individual.</li>
      <li><strong>RF01.5 - Template Linear Estrito e Impressão Limpa (@media print):</strong> Compilação oficial estruturada em 9 níveis estritos: (1) Topo institucional azul escuro com Protocolo (RO-2026-XXXX) e Gravidade exclusivos na caixa lateral; (2) Subtítulo oficial destacado; (3) Grid superior fixo de aprovadores (Gerente de Site, Coordenação de Segurança, Fiscal de Contrato); (4) Seção 1 - Dados Gerais do Fato; (5) Título da Ocorrência; (6) Seção 2 - Relato Cronológico; (7) Seção 3 - Envolvidos com tabela formal sem inputs; (8) Seção 4 - Registro Fotográfico com legendas padronizadas (Anexo X - Legenda); (9) Rodapé padrão de auditoria (Página 1 de 1). Proibição estrita de caixas de assinatura picotadas, hashes criptográficos visuais ou poluição visual na impressão.</li>
      <li><strong>RF01.6 - Salvamento Multidestino:</strong> Gravação concorrente na base JSON local (<code>data/ocorrencias.json</code>), na planilha histórica (<code>ocorrencias.xlsx</code>) e na pasta de rede da CCO (<code>MAPA DE CALOR/</code>).</li>
    </ul>

    <h2 class="sec-2">2.2 [RF02] Controle de Credenciais Provisórias (Portaria 1 e Portaria 2)</h2>
    <p>O módulo de provisórios gerencia a custódia temporária de crachás de acesso para funcionários que não portam sua credencial titular:</p>
    <ul>
      <li><strong>RF02.1 - Registro de Retirada:</strong> Inserção rápida de Nome, Empresa, Número do Cartão Provisório, Portaria (P1 ou P2), Data, Hora e Motivo (ESQUECEU, PERDEU, COM DEFEITO, RETIDO, OUTROS).</li>
      <li><strong>RF02.2 - Alerta Dinâmico de Reincidência:</strong> Cálculo automático da quantidade de retiradas no mês corrente. Caso o total atinja 4 ou mais acessos, o sistema aplica um badge visual vermelho de <code>REINCIDENTE</code>.</li>
      <li><strong>RF02.3 - Baixa e Cálculo de Duração:</strong> Registro de devolução em 1 clique com cálculo do tempo total de permanência do cartão com o colaborador.</li>
      <li><strong>RF02.4 - Gestão de Cartões Perdidos:</strong> Identificação e encaminhamento de cartões perdidos para a lista de inadimplência patrimonial do Dashboard Executivo.</li>
    </ul>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>5</span>
    </div>
  </div>

  <!-- PÁGINA 6: REQUISITOS FUNCIONAIS (RF03, RF04 e RF05) -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>2 Requisitos Funcionais</span>
    </div>

    <h2 class="sec-2">2.3 [RF03] Controle de Acesso e Permanência de Visitantes</h2>
    <p>Controla a entrada, permanência e saída de pessoas externas em visita comercial ou prestação de serviços:</p>
    <ul>
      <li><strong>RF03.1 - Painel Visual de Slots:</strong> Interface intuitiva que exibe o total de crachás de visitantes disponíveis e ocupados por portaria (P1 e P2).</li>
      <li><strong>RF03.2 - Cadastro Rápido de Entrada:</strong> Registro de Nome, Documento (RG/CPF), Empresa de Origem, Contato Interno (Anfitrião na Planta), Portaria e Número do Crachá.</li>
      <li><strong>RF03.3 - Monitoramento de Tempo Decorrido:</strong> Cronômetro visual em cada card de visitante indicando há quanto tempo ele está dentro das instalações industriais.</li>
      <li><strong>RF03.4 - Checkout Imediato:</strong> Registro de saída com liberação automática do slot do crachá para novas visitas.</li>
    </ul>

    <h2 class="sec-2">2.4 [RF04] Gestão de Chaves Mestras e Dispositivos RFID</h2>
    <p>Garante a cadeia de custódia do claviculário de chaves mestras e tags veiculares:</p>
    <ul>
      <li><strong>RF04.1 - Matriz de Inventário:</strong> Cadastro centralizado das chaves de prédios, salas técnicas, subestações, portões perimetrais e tags de docas.</li>
      <li><strong>RF04.2 - Cautela e Devolução:</strong> Registro de quem retirou a chave (Operador/Prestador), horário, destinação e registro de baixa na devolução.</li>
    </ul>

    <h2 class="sec-2">2.5 [RF05] Dashboard Executivo e Relatórios Analíticos</h2>
    <p>Centraliza a inteligência de segurança e gera os relatórios oficiais da gestão:</p>
    <ul>
      <li><strong>RF05.1 - Indicadores em Tempo Real (KPIs):</strong> Contadores instantâneos de Ocorrências no período, Provisórios em Circulação, Visitantes Ativos, Colaboradores Reincidentes e Inadimplências Patrimoniais.</li>
      <li><strong>RF05.2 - Detalhamento Analítico:</strong> 4 tabelas de resumo crítico:
        <ol>
          <li><em>Alerta de Reincidência (Provisórios):</em> Colaboradores que excederam 3 retiradas no mês;</li>
          <li><em>Inadimplência de Credenciais:</em> Cartões perdidos não pagos (Nome, Empresa e Data da Perda — sem valores em R$);</li>
          <li><em>Produtividade CCO:</em> Total de ROs emitidos por Operador CCO na escala;</li>
          <li><em>Credenciais Pendentes:</em> Cartões provisórios atualmente fora da portaria.</li>
        </ol>
      </li>
      <li><strong>RF05.3 - Exportações Corporativas:</strong>
        - <em>Relatório PDF:</em> Relatório formatado em A4 com assinaturas e proteção contra quebra de tabelas (<code>page-break-inside: avoid</code>);<br>
        - <em>Base Excel:</em> Exportação em planilha única (<code>.xlsx</code>) com abas estruturadas de ocorrências, provisórios e visitantes.
      </li>
    </ul>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>6</span>
    </div>
  </div>

  <!-- PÁGINA 7: REQUISITOS NÃO FUNCIONAIS E RF06 -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>3 Requisitos Não Funcionais</span>
    </div>

    <h2 class="sec-2">2.6 [RF06] Gestão Administrativa e Parametrização Restrita</h2>
    <p>Permite à liderança configurar o comportamento do software sem alterar o código-fonte:</p>
    <ul>
      <li><strong>RF06.1 - Bloqueio por Senha Mestra:</strong> Exige a senha corporativa para liberar o acesso ao menu de configurações;</li>
      <li><strong>RF06.2 - CRUD de Turnos:</strong> Gerenciador de escalas (12x36 Diurno, 12x36 Noturno e Administrativo);</li>
      <li><strong>RF06.3 - CRUD de Observações:</strong> Gerenciador de motivos de concessão de crachás provisórios;</li>
      <li><strong>RF06.4 - CRUD de Operadores:</strong> Gerenciador de operadores com matrícula e turno;</li>
      <li><strong>RF06.5 - Responsáveis do Site:</strong> Parametrização dos nomes do Gerente do Site, Coordenação e Fiscal para rodapés de relatórios e caminhos de rede.</li>
    </ul>

    <h2 class="sec-2">2.7 [RF07] Módulo de Backup & Restauração (Merge Inteligente Anti-Duplicidade)</h2>
    <p>Localizado no painel restrito de Configurações, provê mecanismo seguro para preservação e consolidação de dados:</p>
    <ul>
      <li><strong>RF07.1 - Exportação Unificada via Electron SaveDialog:</strong> Coleta todos os arquivos JSON locais da aplicação e aciona a janela nativa do Windows (<code>dialog.showSaveDialog</code>) para salvar com nome padronizado (<code>backup_cco_YYYY-MM-DD_HH-mm-ss.json</code>);</li>
      <li><strong>RF07.2 - Restauração Segura sem Duplicidade:</strong> Mecanismo de merge inteligente que compara registros por protocolos únicos (<code>RO-2026-XXXX</code>), chaves compostas e matrículas corporativas. Preserva dados locais, integra registros inéditos e impede compulsoriamente a duplicação ou perda de informações;</li>
      <li><strong>RF07.3 - Diagnóstico Prévio Quantitativo:</strong> Modal de conferência que quantifica novos registros a integrar, registros preservados e duplicidades evitadas antes da confirmação.</li>
    </ul>

    <h1 class="sec-1">3 REQUISITOS NÃO FUNCIONAIS (RNF)</h1>
    <p>Os Requisitos Não Funcionais definem as restrições arquiteturais, de segurança e desempenho do sistema, consolidadas na Tabela 1:</p>

    <table class="abnt-table">
      <caption>Tabela 1 – Especificação dos Requisitos Não Funcionais (RNF)</caption>
      <thead>
        <tr>
          <th style="width: 15%;">Item</th>
          <th style="width: 25%;">Categoria</th>
          <th style="width: 60%;">Descrição Técnica</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>RNF01</strong></td>
          <td>Interface & UX</td>
          <td>Frontend desenvolvido com React 18, Tailwind CSS e ícones Lucide. Design corporativo escuro (Dark Glassmorphism) com alto contraste.</td>
        </tr>
        <tr>
          <td><strong>RNF02</strong></td>
          <td>Runtime Nativo</td>
          <td>Aplicação Desktop nativa para Windows (x64) empacotada em Electron 44. Janela maximizada por padrão, sem barra de menus de navegador.</td>
        </tr>
        <tr>
          <td><strong>RNF03</strong></td>
          <td>Persistência Local</td>
          <td>Armazenamento baseado em arquivos JSON em <code>data/</code> servidos via HTTP local (127.0.0.1) embutido no Node.js, sem dependência de SGBD externo.</td>
        </tr>
        <tr>
          <td><strong>RNF04</strong></td>
          <td>Autonomia de Rede</td>
          <td>Operação 100% offline. O sistema funciona plenamente em estações isoladas ou sem conexão com a internet.</td>
        </tr>
        <tr>
          <td><strong>RNF05</strong></td>
          <td>Segurança de Processos</td>
          <td>Isolamento de contexto (<code>contextIsolation: true</code>) e ponte segura (<code>preload.cjs</code>). Interceptação e abertura forçada de links externos no navegador do SO.</td>
        </tr>
        <tr>
          <td><strong>RNF06</strong></td>
          <td>Compatibilidade</td>
          <td>Homologado para execução nativa em Microsoft Windows 10 e Windows 11 (64 bits).</td>
        </tr>
      </tbody>
    </table>
    <div class="table-source">Fonte: TecPrimus Soluções Tecnológicas (2026).</div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>7</span>
    </div>
  </div>

  <!-- PÁGINA 8: REGRAS DE NEGÓCIO CRUCIAIS -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>4 Regras de Negócio</span>
    </div>

    <h1 class="sec-1">4 REGRAS DE NEGÓCIO CRUCIAIS (RN)</h1>

    <h2 class="sec-2">4.1 [RN01] Isolamento Administrativo por Senha Mestra</h2>
    <p>O acesso às funções de parametrização de turnos, operadores, motivos e dados da contratante é restrito à liderança da CCO. O software protege a rota de configurações solicitando uma Senha Mestra (senha inicial padrão: <code>admin123</code>). A senha é armazenada de forma persistente no arquivo <code>data/seguranca.json</code> e pode ser alterada diretamente no painel administrativo.</p>

    <h2 class="sec-2">4.2 [RN02] Matriz de Taxonomia Estruturada da Planta Corporativa</h2>
    <p>Para assegurar a precisão estatística e integridade analítica nos mapas de calor e relatórios gerenciais, o software proíbe campos de digitação livre para localização e classificação, adotando uma taxonomia parametrizável que se molda a qualquer planta:</p>

    <div class="callout">
      <div class="callout-title">Exemplos de Prédios e Instalações (Customizáveis)</div>
      PORTARIA PRINCIPAL (P1), PORTARIA DE SERVIÇOS (P2), CENTRAL DE COMPOSTAGEM / MEIO AMBIENTE, ESPAÇO SAÚDE / AMBULATÓRIO, RESTAURANTE CENTRAL / REFEITÓRIO, LABORATÓRIO DE QUALIDADE & P&D, BIORREFINARIA / PROCESSAMENTO, PRÉDIO ADMINISTRATIVO (ADM), HALL DE ENTRADA, FÁBRICA / MANUFATURA, GALPÃO LOGÍSTICO 1, GALPÃO LOGÍSTICO 2, DOCAS, CENTRAL DE UTILIDADES, PARQUE DE TANCAGEM, CASA DE CALDEIRAS e GESTÃO DE RESÍDUOS.
    </div>

    <div class="callout">
      <div class="callout-title">Áreas e Setores dos Prédios (12 Setores)</div>
      INTERNA / OPERACIONAL, EXTERNA / PERÍMETRO, PÁTIO / CIRCULAÇÃO, CARGA E DESCARGA / DOCAS, LINHA DE PRODUÇÃO, ESCRITÓRIOS / ADM, ESTACIONAMENTO, VESTIÁRIOS / SANITÁRIOS, REFEITÓRIO / CONVIVÊNCIA, ALMOXARIFADO / ESTOQUE, CASA DE MÁQUINAS / SUBESTAÇÃO e OUTRA ÁREA.
    </div>

    <div class="callout">
      <div class="callout-title">Tópicos e Naturezas de Ocorrência (16 Classificações)</div>
      USO INDEVIDO DE EPI, NÃO UTILIZAÇÃO DE EPI, ARRASTA PALHETE, ERGONOMIA, FURTO, ALIMENTO, DESVIO DE CONDUTA, QUEBRA DE PROCEDIMENTO, USO DE CELULAR INDEVIDO, FONES DE OUVIDO, DANOS PATRIMONIAIS, QUASE ACIDENTE (Q.A), ACIDENTE, DESCARTE INDEVIDO, QUEBRA DE ACESSO e AMBULÂNCIA.
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>8</span>
    </div>
  </div>

  <!-- PÁGINA 9: REGRAS DE NEGÓCIO (RN03 e RN04) E CONCLUSÃO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Documento de Requisitos de Software</span>
      <span>4 Regras de Negócio</span>
    </div>

    <h2 class="sec-2">4.3 [RN03] Proibição Estrita de Inputs de Valores Financeiros</h2>
    <div class="callout callout-warning">
      <div class="callout-title">Diretriz Crítica de Governança & Compliance Contratual</div>
      Em conformidade com as diretrizes de governança corporativa e neutralidade financeira, a tarifação, ressarcimento e cobrança pecuniária por extravio de credenciais são geridos exclusivamente através dos processos e formulários administrativos externos controlados pela área de Recursos Humanos / Facilities da organização contratante.
    </div>
    <p>O CCO Security Suite <strong>não deve conter campos de digitação de valores monetários nem exibir cifras monetárias (ex: R$ 50,00)</strong> na tabela de Inadimplência de Credenciais ou em qualquer exportação em PDF e Excel. O sistema limita-se a reportar os dados fáticos e auditáveis: <em>Nome do Colaborador, Empresa Prestadora e Data do Extravio</em>.</p>

    <h2 class="sec-2">4.4 [RN04] Regra de Reincidência Operacional (Limite de 3 Acessos Provisórios/Mês)</h2>
    <p>A concessão de cartões provisórios possui teto mensal estrito:</p>
    <ul>
      <li>Todo colaborador tem direito à cota de até <strong>3 retiradas de provisórios</strong> dentro do mesmo mês civil (seja por esquecimento, perda provisória ou dano);</li>
      <li>Ao registrar a <strong>4ª retirada no mesmo mês</strong>, o software classifica compulsoriamente o colaborador como <strong>REINCIDENTE</strong>;</li>
      <li>O sistema sinaliza a etiqueta visual vermelha no painel e inclui o registro na tabela de "Alerta de Reincidência" do Dashboard Executivo para notificação à liderança da empresa prestadora.</li>
    </ul>

    <h1 class="sec-1">5 REFERÊNCIAS NORMATIVAS E LEGAIS</h1>
    <ul>
      <li><strong>BRASIL. Lei nº 9.609, de 19 de fevereiro de 1998:</strong> Dispõe sobre a proteção da propriedade intelectual de programa de computador e sua comercialização.</li>
      <li><strong>BRASIL. Lei nº 9.610, de 19 de fevereiro de 1998:</strong> Altera, atualiza e consolida a legislação sobre direitos autorais.</li>
      <li><strong>ABNT NBR 14724:2011:</strong> Informação e documentação — Trabalhos acadêmicos e técnicos — Apresentação.</li>
      <li><strong>ABNT NBR 6024:2012:</strong> Numeração progressiva das seções de um documento.</li>
      <li><strong>ABNT NBR 6027:2012:</strong> Informação e documentação — Sumário — Apresentação.</li>
      <li><strong>ISO/IEC/IEEE 29148:2018:</strong> Systems and software engineering — Life cycle processes — Requirements engineering.</li>
      <li><strong>ABNT NBR ISO/IEC 25010:</strong> Engenharia de sistemas e software — Requisitos e avaliação da qualidade de software (SQuaRE).</li>
    </ul>

    <div class="sign-container">
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>YAGO MARINHO</strong><br>
        Engenheiro de Software & Autor<br>
        TecPrimus Soluções Tecnológicas
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>CENTRAL DE CONTROLE OPERACIONAL</strong><br>
        Gestão de Segurança Patrimonial<br>
        Planta Corporativa & Operações
      </div>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>9</span>
    </div>
  </div>

</body>
</html>`;
}

// 2. GERADOR DO MANUAL DE OPERAÇÃO DO USUÁRIO
function generateManualHtml() {
  const css = getAbntCss();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Manual do Usuário - CCO Security Suite Rev 1.0</title>
  <style>${css}</style>
</head>
<body>

  <!-- CAPA (ABNT NBR 14724) -->
  <div class="page cover-page">
    <div>
      <div class="cover-institution">
        TECPRIMUS SOLUÇÕES TECNOLÓGICAS LTDA<br>
        SUPORTE TÉCNICO & OPERAÇÕES DE SEGURANÇA PATRIMONIAL
      </div>
      <div class="cover-author">YAGO MARINHO</div>
    </div>

    <div class="cover-title-box">
      <div class="cover-title">MANUAL DE OPERAÇÃO DO USUÁRIO</div>
      <div class="cover-subtitle">GUIA DE PROCEDIMENTOS OPERACIONAIS E DIRETRIZES DE USO DA CENTRAL DE CONTROLE OPERACIONAL (CCO)</div>
      <div class="cover-badge">CCO SECURITY SUITE — VERSÃO Rev 1.0</div>
    </div>

    <div class="cover-footer">
      DIVISÃO DE ENGENHARIA & PRODUTOS CORPORATIVOS<br>
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- FOLHA DE ROSTO (ABNT NBR 14724) -->
  <div class="page title-page">
    <div class="title-header">
      YAGO MARINHO
    </div>

    <div class="title-center">
      <h1>MANUAL DE OPERAÇÃO DO USUÁRIO</h1>
      <h2>CCO SECURITY SUITE Rev 1.0</h2>
    </div>

    <div class="title-natureza">
      Manual oficial de procedimentos operacionais e treinamento de usuários da Central de Controle Operacional (CCO). Documento técnico registrado perante a legislação de propriedade intelectual de software (Lei nº 9.609/1998).
    </div>

    <div class="catalog-card">
      <div class="catalog-title">Ficha de Identificação do Manual Operacional</div>
      <strong>Obra:</strong> Manual de Operação do Usuário – CCO Security Suite Rev 1.0<br>
      <strong>Autoria e Desenvolvimento:</strong> Yago Marinho (TecPrimus Soluções Tecnológicas)<br>
      <strong>Data de Homologação:</strong> Setembro de 2026 | <strong>Edição:</strong> 1ª Edição Oficial<br>
      <strong>Ambiente Operacional:</strong> Microsoft Windows 10/11 (Desktop App)<br>
      <strong>Destinação:</strong> Operadores de CCO, Supervisores de Segurança Patrimonial, Facilities e Fiscais de Contrato.<br>
      <strong>Direitos Reservados:</strong> Proibida a comercialização ou reprodução parcial sem autorização da TecPrimus Soluções Tecnológicas.
    </div>

    <div class="title-footer">
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- SUMÁRIO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>Sumário</span>
    </div>

    <h1 class="sec-1">SUMÁRIO</h1>

    <div class="toc-item">
      <span class="toc-title">1 INTRODUÇÃO E VISÃO GERAL</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.1 Boas-Vindas ao Operador de CCO</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.2 Navegação e Menu Lateral Corporativo</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">2 GUIA PRÁTICO DE OPERAÇÃO</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.1 Emissão de Relatórios de Ocorrências (RO)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.2 Controle de Credenciais Provisórias e Alerta de Reincidência</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.3 Controle de Visitantes e Painel de Slots</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.4 Gestão de Chaves e RFID</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">2.5 Painel de Configurações e Senha Mestra</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">3 EXPORTAÇÃO DE RELATÓRIOS GERENCIAIS</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">3.1 Relatório Executivo em PDF</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">3.2 Base Consolidada em Excel (XLSX)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">4 DICAS DE PRODUTIVIDADE E SUPORTE</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>3</span>
    </div>
  </div>

  <!-- PÁGINA 4: INTRODUÇÃO E NAVEGAÇÃO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>1 Introdução e Visão Geral</span>
    </div>

    <h1 class="sec-1">1 INTRODUÇÃO E VISÃO GERAL</h1>

    <h2 class="sec-2">1.1 Boas-Vindas e Separação de Papéis</h2>
    <p>Prezado(a) Operador(a), o <strong>CCO Security Suite (Rev 1.0)</strong> é a sua ferramenta oficial de trabalho na Central de Controle Operacional. O sistema estabelece uma separação rigorosa de perfis:</p>
    <ul>
      <li><strong>Operadores da Central (CCO):</strong> Únicos usuários com login e acesso ao software desktop. Responsáveis por lançar e emitir ROs, conceder credenciais provisórias e gerenciar os parâmetros operacionais;</li>
      <li><strong>Efetivo de Vigilância de Campo:</strong> Profissionais alocados nos postos externos (Portaria 1, Portaria 2 e Ronda). Não operam o software; seus cadastros existem estritamente para vínculo funcional e assinatura nas entregas/devoluções de crachás provisórios.</li>
    </ul>

    <h2 class="sec-2">1.2 Navegação e Menu Lateral Corporativo</h2>
    <p>O aplicativo opera em modo desktop nativo no Windows, iniciando automaticamente maximizado. A navegação é realizada exclusivamente através do menu lateral escuro fixado à esquerda:</p>
    <ul>
      <li><strong>Dashboard Executivo:</strong> Visão geral de métricas, gráficos e tabelas analíticas;</li>
      <li><strong>Ferramenta 1 - Relatório de Ocorrências (RO):</strong> Tela de emissão e arquivamento de sinistros;</li>
      <li><strong>Ferramenta 2 - Credenciais Provisórias:</strong> Controle de crachás temporários de colaboradores;</li>
      <li><strong>Ferramenta 3 - Controle de Visitantes:</strong> Monitoramento de fluxo e permanência de terceiros;</li>
      <li><strong>Ferramenta 4 - Controle RFID / Chaves:</strong> Custódia e empréstimo de chaves mestras e tags;</li>
      <li><strong>Configurações:</strong> Acesso restrito a parâmetros (protegido pela Senha Mestra);</li>
      <li><strong>Sobre o Sistema:</strong> Dados de versão, autoria e contatos oficiais de suporte.</li>
    </ul>

    <div class="callout">
      <div class="callout-title">Dica de Produtividade</div>
      Você pode navegar rapidamente entre os campos pressionando a tecla <code>Tab</code> e fechar modais/janelas instantaneamente com a tecla <code>Esc</code>.
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>4</span>
    </div>
  </div>

  <!-- PÁGINA 5: EMISSÃO DE RO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>2 Guia de Operação</span>
    </div>

    <h1 class="sec-1">2 GUIA PRÁTICO DE OPERAÇÃO</h1>

    <h2 class="sec-2">2.1 Emissão de Relatórios de Ocorrências (RO)</h2>
    <p>A emissão de RO é obrigatória para qualquer evento de desvio, quebra de procedimento, acidente de trabalho ou avaria patrimonial. Siga a sequência padrão:</p>

    <ol>
      <li><strong>Acesso ao Módulo:</strong> Clique em <em>Relatório de Ocorrências</em> no menu lateral.</li>
      <li><strong>Identificação Básica:</strong>
        <ul>
          <li>O número do RO (ex: <code>RO-2026-00045</code>) é gerado de forma automática e sequencial;</li>
          <li>Confira a <em>Data</em> e <em>Horário</em> da ocorrência;</li>
          <li>Selecione o seu nome no dropdown <em>Operador CCO</em> e indique o seu <em>Turno</em>.</li>
        </ul>
      </li>
      <li><strong>Classificação Taxonômica:</strong>
        <ul>
          <li>Selecione o <em>Prédio do Site</em> (ex: PORTARIA 1, BIORREFINARIA, RESTAURANTE);</li>
          <li>Selecione a <em>Área / Setor</em> (ex: PÁTIO / CIRCULAÇÃO, LINHA DE PRODUÇÃO);</li>
          <li>Escolha o <em>Tópico da Ocorrência</em> (ex: NÃO UTILIZAÇÃO DE EPI, ARRASTA PALHETE);</li>
          <li>Defina a <em>Gravidade</em>: Baixa, Média, Alta ou Crítica.</li>
        </ul>
      </li>
      <li><strong>Descrição dos Fatos:</strong> Insira um título resumido e descreva no campo descritivo os fatos com imparcialidade e rigor cronológico, detalhando placas de veículos e áreas exatas.</li>
      <li><strong>Cadastro de Envolvidos:</strong> Clique em <em>+ Adicionar Envolvido</em> e cadastre cada pessoa citada, informando Nome, Empresa Contratada, Cargo e Tipo de Envolvimento.</li>
      <li><strong>Evidências Fotográficas:</strong> Clique em <em>Anexar Fotos</em> para anexar registros do CFTV ou fotos recebidas dos inspetores de campo.</li>
      <li><strong>Conclusão, Visualização e Impressão Limpa:</strong> Clique em <em>Salvar Ocorrência e Gerar PDF</em>. O sistema grava os dados localmente, atualiza o Excel e gera o <strong>Template Linear Estrito Oficial</strong>: Topo azul escuro com Protocolo e Gravidade, Subtítulo formal, Grid superior de aprovadores (Gerente de Site, Coordenação de Segurança, Fiscal de Contrato), Seções 1 a 4 limpas e Rodapé padrão, sem qualquer poluição visual na impressão (@media print).</li>
    </ol>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>5</span>
    </div>
  </div>

  <!-- PÁGINA 6: PROVISÓRIOS E REINCIDÊNCIA -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>2 Guia de Operação</span>
    </div>

    <h2 class="sec-2">2.2 Controle de Credenciais Provisórias e Alerta de Reincidência</h2>
    <p>O módulo de credenciais provisórias atende os funcionários que chegam à Portaria 1 ou Portaria 2 sem o crachá titular.</p>

    <div class="callout callout-warning">
      <div class="callout-title">Regra dos 3 Acessos por Mês (Reincidência Operacional)</div>
      Cada colaborador pode retirar no máximo <strong>3 provisórios por mês</strong>. Na <strong>4ª retirada</strong>, o sistema aplicará automaticamente a tag vermelha <strong>REINCIDENTE</strong>. O operador deve orientar formalmente o colaborador e seu registro integrará o relatório de reincidência mensal da CCO.
    </div>

    <h3>A. Cadastrar Nova Credencial Provisória:</h3>
    <ol>
      <li>Acesse a tela <em>Credenciais Provisórias</em>;</li>
      <li>Na barra superior, clique no botão <strong>+ Nova Credencial</strong>;</li>
      <li>Preencha o <em>Nome Completo do Colaborador</em>;</li>
      <li>Informe a <em>Empresa Contratada / Prestadora</em> (ex: Prestadora de Facilities, Segurança, Logística);</li>
      <li>Digite o <em>Número do Cartão Provisório</em> entregue;</li>
      <li>Selecione a <em>Portaria de Atendimento</em> (P1 ou P2);</li>
      <li>Selecione o <em>Motivo</em> (ESQUECEU, PERDEU, COM DEFEITO, RETIDO);</li>
      <li>Clique em <strong>Registrar Acesso</strong>.</li>
    </ol>

    <h3>B. Devolver / Baixar Credencial:</h3>
    <ol>
      <li>Utilize a <em>Barra de Pesquisa</em> para digitar o nome do colaborador;</li>
      <li>Na linha correspondente ao cartão em aberto, clique em <strong>Dar Baixa / Devolver</strong>;</li>
      <li>O sistema registra o horário final e calcula o tempo total de permanência.</li>
    </ol>

    <h3>C. Tratamento de Cartões Perdidos (Inadimplência Patrimonial):</h3>
    <p>Se o colaborador comunicar o extravio definitivo do crachá, selecione o motivo <strong>PERDEU</strong>. O cartão constará na lista de inadimplência patrimonial. <strong>Atenção:</strong> A CCO não cobra dinheiro na portaria. A cobrança e eventual segunda via são emitidas via formulário e processos administrativos próprios da organização contratante.</p>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>6</span>
    </div>
  </div>

  <!-- PÁGINA 7: VISITANTES E RFID -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>2 Guia de Operação</span>
    </div>

    <h2 class="sec-2">2.3 Controle de Visitantes e Painel de Slots</h2>
    <p>O módulo de visitantes monitora pessoas que acessam o complexo para prestação de serviços eventuais, reuniões comerciais e auditorias.</p>

    <h3>A. Registrar Entrada de Visitante:</h3>
    <ol>
      <li>Acesse o menu <em>Controle de Visitantes</em>;</li>
      <li>Observe os <em>Slots Visuais</em> da portaria correspondente (P1 ou P2);</li>
      <li>Clique em <strong>+ Novo Visitante</strong> (ou em um slot livre);</li>
      <li>Preencha: Nome Completo, Documento Oficial (RG ou CPF), Empresa de Origem, Pessoa/Setor Visitado (Anfitrião) e Número do Crachá de Visitante entregue;</li>
      <li>Clique em <strong>Confirmar Entrada</strong>. O slot ficará colorido com o cronômetro de tempo de permanência em execução.</li>
    </ol>

    <h3>B. Registrar Saída (Checkout):</h3>
    <ol>
      <li>Localize o visitante no painel ou digite o nome no campo de busca rápida;</li>
      <li>Clique no botão <strong>Registrar Saída (Checkout)</strong>;</li>
      <li>O crachá é liberado imediatamente no painel de slots para a próxima visita.</li>
    </ol>

    <h2 class="sec-2">2.4 Gestão de Chaves e RFID</h2>
    <p>Gerencia a cautela de chaves mestras e tags veiculares de docas:</p>
    <ul>
      <li><strong>Empréstimo:</strong> Selecione a chave no painel, informe o Nome do Solicitante, a Empresa e o Setor de Destino e confirme a cautela. O status da chave muda para <em>Em Uso</em>;</li>
      <li><strong>Devolução:</strong> Na lista de chaves cauteladas, localize o item e clique em <strong>Confirmar Devolução</strong>. O item retorna para status <em>Disponível</em>.</li>
    </ul>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>7</span>
    </div>
  </div>

  <!-- PÁGINA 8: CONFIGURAÇÕES E EXPORTAÇÃO PDF -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>3 Exportação de Relatórios</span>
    </div>

    <h2 class="sec-2">2.5 Painel de Configurações e Senha Mestra</h2>
    <p>A tela de configurações é restrita aos líderes de turno da CCO:</p>
    <ol>
      <li>Clique em <em>Configurações</em> no menu lateral;</li>
      <li>Digite a Senha Mestra (senha inicial: <code>admin123</code>);</li>
      <li>Dentro do painel restrito, é possível cadastrar/inativar <em>Turnos</em>, <em>Observações</em> e <em>Operadores</em>, alterar a <em>Senha Mestra</em> e atualizar os <em>Responsáveis do Site</em> (nomes de assinaturas de rodapé).</li>
    </ol>

    <h1 class="sec-1">3 EXPORTAÇÃO DE RELATÓRIOS GERENCIAIS</h1>

    <h2 class="sec-2">3.1 Relatório Executivo em PDF</h2>
    <p>Para gerar o relatório executivo completo para reuniões de alinhamento (DDS) ou envio para a fiscalização de segurança:</p>
    <ol>
      <li>Acesse o <strong>Dashboard Executivo</strong>;</li>
      <li>Selecione o mês/ano de referência ou aplique o filtro de turno desejado;</li>
      <li>Clique no botão <strong>Relatório PDF</strong> no canto superior direito;</li>
      <li>O sistema compilará os indicadores de KPIs, gráficos de gravidade e as 4 tabelas analíticas (Reincidência, Inadimplência, Produtividade de Operadores e Pendências) em formato A4 perfeitamente diagramado, contendo os campos de assinaturas formais no rodapé.</li>
    </ol>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>8</span>
    </div>
  </div>

  <!-- PÁGINA 9: EXCEL, DICAS E ASSINATURAS -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Manual de Operação do Usuário</span>
      <span>4 Produtividade e Suporte</span>
    </div>

    <h2 class="sec-2">3.2 Base Consolidada em Excel (XLSX)</h2>
    <p>Para alimentar relatórios de Business Intelligence ou auditorias de RH:</p>
    <ol>
      <li>No Dashboard Executivo, clique no botão <strong>Base Excel</strong>;</li>
      <li>O sistema exportará instantaneamente um arquivo <code>.xlsx</code> com todas as ocorrências, provisórios e registros de visitantes preenchidos com integridade colunar.</li>
    </ol>

    <h1 class="sec-1">4 DICAS DE PRODUTIVIDADE E SUPORTE</h1>
    <ul>
      <li><strong>Pesquisa Dinâmica:</strong> Utilize a barra de pesquisa das telas em vez de rolar listas longas;</li>
      <li><strong>Zero Risco de Perda de Dados:</strong> O sistema grava cada caractere em disco de forma transacional. Mesmo em caso de queda de energia ou desligamento repentino, seus dados estão seguros;</li>
      <li><strong>Suporte Técnico:</strong> Para dúvidas ou requisições de novas funcionalidades, contate o desenvolvedor via canal oficial da TecPrimus: <code>tecprimus2021@outlook.com</code>.</li>
    </ul>

    <div class="sign-container">
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>YAGO MARINHO</strong><br>
        TecPrimus Soluções Tecnológicas<br>
        Suporte & Engenharia
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>EQUIPE OPERACIONAL CCO</strong><br>
        Central de Controle Operacional<br>
        Planta Corporativa & Operações
      </div>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>9</span>
    </div>
  </div>

</body>
</html>`;
}

// 3. GERADOR DO GUIA TÉCNICO DE ARQUITETURA E IMPLANTAÇÃO
function generateArquiteturaHtml() {
  const css = getAbntCss();
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Arquitetura e Implantação - CCO Security Suite Rev 1.0</title>
  <style>${css}</style>
</head>
<body>

  <!-- CAPA (ABNT NBR 14724) -->
  <div class="page cover-page">
    <div>
      <div class="cover-institution">
        TECPRIMUS SOLUÇÕES TECNOLÓGICAS LTDA<br>
        DEPARTAMENTO DE ENGENHARIA & ARQUITETURA DE SOFTWARE
      </div>
      <div class="cover-author">YAGO MARINHO</div>
    </div>

    <div class="cover-title-box">
      <div class="cover-title">ARQUITETURA DE SOFTWARE E GUIA DE IMPLANTAÇÃO</div>
      <div class="cover-subtitle">ESPECIFICAÇÃO TÉCNICA DE TI, ESTRUTURA DE DADOS, PROCESSO DE COMPILAÇÃO E IMPLANTAÇÃO LIMPA (CLEAN DEPLOY)</div>
      <div class="cover-badge">CCO SECURITY SUITE — VERSÃO Rev 1.0</div>
    </div>

    <div class="cover-footer">
      DIVISÃO DE ENGENHARIA & PRODUTOS CORPORATIVOS<br>
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- FOLHA DE ROSTO (ABNT NBR 14724) -->
  <div class="page title-page">
    <div class="title-header">
      YAGO MARINHO
    </div>

    <div class="title-center">
      <h1>ARQUITETURA DE SOFTWARE E GUIA DE IMPLANTAÇÃO</h1>
      <h2>CCO SECURITY SUITE Rev 1.0</h2>
    </div>

    <div class="title-natureza">
      Memorial descritivo de arquitetura computacional, diagrama de integração e manual de engenharia de implantação do sistema CCO Security Suite. Documento elaborado para a equipe de Tecnologia da Informação (TI) e homologação de registro de software perante o Instituto Nacional da Propriedade Industrial (INPI), nos termos da Lei nº 9.609/1998.
    </div>

    <div class="catalog-card">
      <div class="catalog-title">Ficha Técnica e Registro de Arquitetura de Software</div>
      <strong>Denominação da Obra:</strong> CCO Security Suite – Arquitetura e Guia Técnico de TI<br>
      <strong>Engenheiro Responsável:</strong> Yago Marinho (TecPrimus Soluções Tecnológicas)<br>
      <strong>Padrão Arquitetural:</strong> Desktop SPA Híbrida (Electron Main Process + Preload Bridge + Node Embedded HTTP Server + React 18 Renderer)<br>
      <strong>Mecanismo de Persistência:</strong> File-Based JSON Storage Engine com escrita atômica local e fallback seguro para %APPDATA%.<br>
      <strong>Licenciamento e Direitos:</strong> Todos os direitos autorais e de reprodução reservados à TecPrimus Soluções Tecnológicas.
    </div>

    <div class="title-footer">
      BRASIL<br>
      2026
    </div>
  </div>

  <!-- SUMÁRIO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>Sumário</span>
    </div>

    <h1 class="sec-1">SUMÁRIO</h1>

    <div class="toc-item">
      <span class="toc-title">1 VISÃO GERAL DA ARQUITETURA COMPUTACIONAL</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.1 Padrão Arquitetural Híbrido</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">1.2 Subsistemas do Runtime Desktop</span>
      <span class="toc-dots"></span>
      <span class="toc-page">4</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">2 ESTRUTURA DE DIRETÓRIOS E MÓDULOS</span>
      <span class="toc-dots"></span>
      <span class="toc-page">5</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">3 MODELO DE PERSISTÊNCIA E STORAGE ENGINE</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">3.1 Arquivos JSON Estruturados</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">3.2 Algoritmo de Fallback de Escrita em Produção</span>
      <span class="toc-dots"></span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">3.3 Inicialização Automática de Templates de Fábrica</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">4 PROCEDIMENTOS DE BUILD E COMPILAÇÃO</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.1 Comandos Oficiais de Compilação</span>
      <span class="toc-dots"></span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">4.2 Executáveis Gerados na Pasta dist-electron/</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">5 GUIA DE IMPLANTAÇÃO LIMPA (CLEAN DEPLOY)</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">5.1 Instalação em Nova Estação de Trabalho</span>
      <span class="toc-dots"></span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-sub">5.2 Rotinas de Backup e Recuperação de Desastres</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>

    <div class="toc-item">
      <span class="toc-title">6 REFERÊNCIAS NORMATIVAS</span>
      <span class="toc-dots"></span>
      <span class="toc-page">9</span>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>3</span>
    </div>
  </div>

  <!-- PÁGINA 4: VISÃO GERAL ARQUITETURA -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>1 Visão Geral da Arquitetura</span>
    </div>

    <h1 class="sec-1">1 VISÃO GERAL DA ARQUITETURA COMPUTACIONAL</h1>

    <h2 class="sec-2">1.1 Padrão Arquitetural Híbrido</h2>
    <p>O <strong>CCO Security Suite</strong> adota uma arquitetura híbrida de alto rendimento que unifica a riqueza de interface de uma SPA web (React 18) com a capacidade operacional do sistema operacional Microsoft Windows através do runtime <strong>Electron 44</strong> e do servidor embutido Node.js.</p>

    <h2 class="sec-2">1.2 Subsistemas do Runtime Desktop</h2>
    <p>O software é modularizado em 4 subsistemas integrados:</p>
    <ul>
      <li><strong>Processo Principal (Main Process - <code>electron/main.cjs</code>):</strong> Controla o ciclo de vida da aplicação nativa, inicializa a janela com propriedades de segurança (<code>autoHideMenuBar: true</code>, <code>Menu.setApplicationMenu(null)</code>), maximiza a tela nativamente e intercepta links externos para abrir no navegador padrão do usuário via <code>shell.openExternal()</code>.</li>
      <li><strong>Ponte de Contexto Seguro (Preload Bridge - <code>electron/preload.cjs</code>):</strong> Implementa isolamento rigoroso de contexto (<code>contextIsolation: true</code>, <code>nodeIntegration: false</code>), expondo apenas canais seguros de comunicação entre o frontend e o sistema.</li>
      <li><strong>Servidor Local Node.js Embutido (<code>electron/server.cjs</code>):</strong> Servidor HTTP leve rodando na interface de loopback (<code>127.0.0.1</code>). Fornece endpoints REST (<code>/api/salvar-ocorrencia</code>, <code>/api/salvar-pdf</code>, <code>/api/salvar-excel</code>, etc.), executa manipulação de arquivos com o pacote SheetJS (XLSX) e serve os arquivos estáticos compilados (<code>dist/</code>).</li>
      <li><strong>Frontend SPA (React 18 + Vite 6):</strong> Interface interativa com roteamento dinâmico, processamento de formulários complexos, manipulação de estado em tempo real e compilação vetorial de relatórios.</li>
    </ul>

    <div class="callout">
      <div class="callout-title">Vantagem Operacional para a TI</div>
      A utilização do servidor HTTP embutido elimina qualquer dependência de instalação e manutenção de servidores de banco de dados (SQL Server, MySQL) nas estações de portaria, reduzindo os custos de licenciamento e suporte de TI a zero.
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>4</span>
    </div>
  </div>

  <!-- PÁGINA 5: ESTRUTURA DE DIRETÓRIOS -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>2 Estrutura de Diretórios</span>
    </div>

    <h1 class="sec-1">2 ESTRUTURA DE DIRETÓRIOS E MÓDULOS</h1>
    <p>A organização física do repositório reflete uma separação clara de responsabilidades entre código de infraestrutura, regras de negócio e persistência:</p>

    <table class="abnt-table">
      <caption>Tabela 1 – Organização Estrutural dos Diretórios do Projeto</caption>
      <thead>
        <tr>
          <th style="width: 25%;">Diretório / Arquivo</th>
          <th style="width: 25%;">Tecnologia / Papel</th>
          <th style="width: 50%;">Finalidade Técnica</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>electron/main.cjs</code></td>
          <td>Node.js / Electron</td>
          <td>Ponto de entrada nativo. Gerencia janela maximizada, menus e inicialização do servidor embutido.</td>
        </tr>
        <tr>
          <td><code>electron/server.cjs</code></td>
          <td>Node.js HTTP Server</td>
          <td>Servidor embutido em produção. Processa APIs locais de persistência JSON, PDF e XLSX.</td>
        </tr>
        <tr>
          <td><code>electron/preload.cjs</code></td>
          <td>Electron Context Bridge</td>
          <td>Camada de isolamento e segurança entre o Chromium e APIs do Node.js.</td>
        </tr>
        <tr>
          <td><code>src/modules/</code></td>
          <td>React 18 / JSX</td>
          <td>Componentes de tela das 4 ferramentas (RO, Provisórios, Visitantes, RFID) e Dashboard Executivo.</td>
        </tr>
        <tr>
          <td><code>src/services/</code></td>
          <td>JavaScript ES6+</td>
          <td>Regras de negócio, cálculos de tempo, validação de limites mensais e exportações.</td>
        </tr>
        <tr>
          <td><code>src/constants/</code></td>
          <td>Taxonomia CCO</td>
          <td>Matriz estruturada de prédios, áreas, naturezas operacionais e empresas prestadoras.</td>
        </tr>
        <tr>
          <td><code>data/</code></td>
          <td>JSON Files</td>
          <td>Armazenamento primário de dados operacionais (ocorrencias, provisorios, visitantes, rfid, seguranca).</td>
        </tr>
        <tr>
          <td><code>templates/</code></td>
          <td>JSON Template</td>
          <td>Modelos limpos de inicialização para implantações virgens de fábrica.</td>
        </tr>
        <tr>
          <td><code>scripts/</code></td>
          <td>Automação Node.js</td>
          <td>Scripts de higienização de banco (<code>clean-data.cjs</code>) e gerador de ícones (<code>generate-icon.cjs</code>).</td>
        </tr>
        <tr>
          <td><code>docs/</code></td>
          <td>Documentação</td>
          <td>Especificação DRS, Manual de Operação e Guia de Implantação em Markdown e PDF ABNT.</td>
        </tr>
      </tbody>
    </table>
    <div class="table-source">Fonte: TecPrimus Soluções Tecnológicas (2026).</div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>5</span>
    </div>
  </div>

  <!-- PÁGINA 6: MODELO DE PERSISTÊNCIA -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>3 Modelo de Persistência</span>
    </div>

    <h1 class="sec-1">3 MODELO DE PERSISTÊNCIA E STORAGE ENGINE</h1>

    <h2 class="sec-2">3.1 Arquivos JSON Estruturados</h2>
    <p>O armazenamento é estruturado em arquivos JSON tipados, localizados na pasta <code>data/</code>. Cada arquivo corresponde a uma entidade do domínio de segurança:</p>
    <ul>
      <li><code>ocorrencias.json</code>: Registros de ROs contendo fotos em Base64, envolvidos e hash identificador;</li>
      <li><code>provisorios.json</code>: Histórico de retiradas e baixas de credenciais temporárias;</li>
      <li><code>visitantes.json</code>: Cadastro de terceiros, horários de entrada e checkouts;</li>
      <li><code>rfid.json</code>: Inventário de chaves e tags de docas com status de custódia;</li>
      <li><code>seguranca.json</code>: Hash da Senha Mestra de acesso às configurações;</li>
      <li><code>turnos.json</code>, <code>operadores.json</code>, <code>observacoes.json</code>: Tabelas de parametrização dinâmica.</li>
    </ul>

    <h2 class="sec-2">3.2 Algoritmo de Fallback de Escrita em Produção</h2>
    <p>Para assegurar que o software funcione sem erros de permissão de escrita (<code>EPERM</code>) em ambientes corporativos com políticas de grupo (GPO) restritas, o <code>main.cjs</code> adota o seguinte algoritmo:</p>
    <ol>
      <li>Ao iniciar, o software tenta criar um arquivo temporário no mesmo diretório do executável (<code>exeDir</code>);</li>
      <li>Se a escrita for bem-sucedida, o sistema adota a pasta local <code>./data</code> (modo portátil ideal para Pen Drives ou pastas locais do usuário);</li>
      <li>Caso a pasta do executável seja protegida (ex: <code>C:\\Program Files\\</code>), o sistema redireciona automaticamente e de forma transparente o banco de dados para a pasta oficial do usuário:
        <br><code>%APPDATA%\\CCO Security Suite\\database\\data\\</code></li>
    </ol>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>6</span>
    </div>
  </div>

  <!-- PÁGINA 7: BUILD E COMPILAÇÃO -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>4 Procedimentos de Build</span>
    </div>

    <h2 class="sec-2">3.3 Inicialização Automática de Templates de Fábrica</h2>
    <p>O servidor embutido (<code>server.cjs</code>) conta com a rotina <code>initializeCleanDataIfMissing()</code>. Quando o aplicativo é instalado pela primeira vez em um computador virgem, o sistema identifica que os arquivos de dados ainda não existem e copia automaticamente os modelos padronizados de <code>database_template.json</code>, entregando o software 100% pronto e limpo para a operação.</p>

    <h1 class="sec-1">4 PROCEDIMENTOS DE BUILD E COMPILAÇÃO</h1>

    <h2 class="sec-2">4.1 Comandos Oficiais de Compilação</h2>
    <p>A esteira de automação está configurada no <code>package.json</code> através dos seguintes comandos de terminal:</p>

    <table class="abnt-table">
      <caption>Tabela 2 – Scripts de Automação e Build no package.json</caption>
      <thead>
        <tr>
          <th style="width: 30%;">Comando NPM</th>
          <th style="width: 70%;">Ação Executada</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>npm run electron:dev</code></td>
          <td>Inicia o Vite e o Electron concorrentemente com recarregamento em tempo real (HMR).</td>
        </tr>
        <tr>
          <td><code>npm run clean:data</code></td>
          <td>Higieniza o banco de dados, resetando arquivos locais com os templates de fábrica limpos.</td>
        </tr>
        <tr>
          <td><code>npm run generate:icon</code></td>
          <td>Renderiza o <code>shield.svg</code> e compila o <code>build/icon.ico</code> multi-resolução para Windows.</td>
        </tr>
        <tr>
          <td><strong><code>npm run build:exe</code></strong></td>
          <td><strong>Gera o Instalador Oficial Windows (.exe NSIS)</strong> com atalhos e desinstalador limpo.</td>
        </tr>
        <tr>
          <td><strong><code>npm run build:portable</code></strong></td>
          <td><strong>Gera o Executável Único Portátil (.exe)</strong> autônomo, sem necessidade de instalação.</td>
        </tr>
        <tr>
          <td><strong><code>npm run build:all</code></strong></td>
          <td>Executa o ciclo completo e compila ambos os executáveis simultaneamente.</td>
        </tr>
      </tbody>
    </table>
    <div class="table-source">Fonte: TecPrimus Soluções Tecnológicas (2026).</div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>7</span>
    </div>
  </div>

  <!-- PÁGINA 8: EXECUTÁVEIS E IMPLANTAÇÃO LIMPA -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>5 Guia de Implantação</span>
    </div>

    <h2 class="sec-2">4.2 Executáveis Gerados na Pasta dist-electron/</h2>
    <p>Ao finalizar o comando de build, os binários oficiais são gerados em <code>dist-electron/</code>:</p>
    <ul>
      <li><strong>CCO Security Suite Setup 1.0.0.exe (~120 MB):</strong> Instalador corporativo padrão NSIS. Guia o usuário passo a passo, cria atalhos na Área de Trabalho e Menu Iniciar e adiciona entrada no Painel de Controle do Windows;</li>
      <li><strong>CCO Security Suite Portable 1.0.0.exe (~105 MB):</strong> Arquivo executável único. Abre instantaneamente com duplo clique em qualquer pasta ou Pen Drive sem requerer privilégios de Administrador;</li>
      <li><strong>win-unpacked/CCO Security Suite.exe (~246 MB):</strong> Pasta descompactada com os arquivos descompactados prontos para execução em rede local.</li>
    </ul>

    <h1 class="sec-1">5 GUIA DE IMPLANTAÇÃO LIMPA (CLEAN DEPLOY)</h1>

    <h2 class="sec-2">5.1 Instalação em Nova Estação de Trabalho</h2>
    <p>Para implantar o sistema no posto de trabalho da CCO em uma máquina nova:</p>
    <ol>
      <li>Copie o instalador <code>CCO Security Suite Setup 1.0.0.exe</code> para a máquina de destino;</li>
      <li>Execute o instalador com privilégios normais de usuário e conclua o assistente de instalação;</li>
      <li>Abra o aplicativo pelo atalho criado na Área de Trabalho;</li>
      <li>No primeiro boot, o sistema se auto-inicializará com o banco zerado de fábrica;</li>
      <li>Acesse o menu <em>Configurações</em> com a Senha Mestra padrão <code>admin123</code> e configure a escala de operadores e os nomes dos responsáveis do contrato.</li>
    </ol>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>8</span>
    </div>
  </div>

  <!-- PÁGINA 9: BACKUP, REFERÊNCIAS E ASSINATURAS -->
  <div class="page">
    <div class="page-header">
      <span>CCO Security Suite Rev 1.0 — Arquitetura de Software e Implantação</span>
      <span>6 Referências Normativas</span>
    </div>

    <h2 class="sec-2">5.2 Rotinas de Backup e Recuperação de Desastres</h2>
    <p>Para assegurar a integridade histórica dos dados operacionais da CCO:</p>
    <ul>
      <li><strong>Procedimento de Backup:</strong> Copiar periodicamente a pasta <code>data/</code> para um diretório de rede compartilhado corporativo ou armazenamento seguro em nuvem da contratante;</li>
      <li><strong>Procedimento de Restauração:</strong> Com o software fechado, basta substituir o conteúdo da pasta <code>data/</code> pelos arquivos de backup e reiniciar o sistema. A recuperação é instantânea e completa.</li>
    </ul>

    <h1 class="sec-1">6 REFERÊNCIAS NORMATIVAS</h1>
    <ul>
      <li><strong>BRASIL. Lei nº 9.609, de 19 de fevereiro de 1998:</strong> Lei do Software. Proteção da propriedade intelectual de programa de computador e seu registro.</li>
      <li><strong>ABNT NBR 14724:2011:</strong> Informação e documentação — Trabalhos acadêmicos e técnicos — Apresentação.</li>
      <li><strong>ABNT NBR 6024:2012:</strong> Numeração progressiva das seções de um documento.</li>
      <li><strong>ISO/IEC 25010:2011:</strong> Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE).</li>
      <li><strong>IEEE Std 1016-2009:</strong> IEEE Standard for Information Technology — Systems Design — Software Design Descriptions.</li>
    </ul>

    <div class="sign-container">
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>YAGO MARINHO</strong><br>
        Engenheiro de Software & Arquiteto<br>
        TecPrimus Soluções Tecnológicas
      </div>
      <div class="sign-box">
        <div class="sign-line"></div>
        <strong>DEPARTAMENTO DE TI & SEGURANÇA</strong><br>
        Infraestrutura & Operações de TI<br>
        Planta Corporativa & Operações
      </div>
    </div>

    <div class="page-footer">
      <span>TecPrimus Soluções Tecnológicas</span>
      <span>9</span>
    </div>
  </div>

</body>
</html>`;
}

// EXECUÇÃO DO PROCESSO DE GERAÇÃO DOS 3 PDFs VIA ELECTRON OFFSCREEN
app.whenReady().then(async () => {
  console.log('[PDF Generator ABNT] Iniciando compilação dos documentos oficiais...');

  const docsDir = path.join(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const tasks = [
    {
      id: 'drs',
      name: 'DRS_CCO_Security_Suite.pdf',
      htmlContent: generateDrsHtml(),
      title: 'Documento de Requisitos de Software (DRS)'
    },
    {
      id: 'manual',
      name: 'Manual_Usuario_CCO.pdf',
      htmlContent: generateManualHtml(),
      title: 'Manual de Operação do Usuário'
    },
    {
      id: 'arquitetura',
      name: 'Arquitetura_Implantacao.pdf',
      htmlContent: generateArquiteturaHtml(),
      title: 'Arquitetura de Software e Guia de Implantação'
    }
  ];

  const win = new BrowserWindow({
    width: 1200,
    height: 1600,
    show: false,
    frame: false,
    webPreferences: {
      offscreen: true
    }
  });

  for (const task of tasks) {
    console.log(`[PDF Generator ABNT] Processando: ${task.title}...`);
    const tempHtmlPath = path.join(__dirname, `temp_${task.id}.html`);
    fs.writeFileSync(tempHtmlPath, task.htmlContent, 'utf-8');

    await win.loadFile(tempHtmlPath);
    // Aguarda renderização completa das fontes e layouts
    await new Promise(resolve => setTimeout(resolve, 800));

    // Compilação em PDF padrão A4 com margens controladas pelo CSS ABNT
    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        marginType: 'none'
      }
    });

    const outputPath = path.join(docsDir, task.name);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`  ✓ PDF gerado com sucesso: docs/${task.name} (${pdfBuffer.length} bytes)`);

    try { fs.unlinkSync(tempHtmlPath); } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  win.destroy();
  console.log('[PDF Generator ABNT] Sucesso! Todos os 3 PDFs oficiais ABNT foram gerados na pasta docs/.');
  app.exit(0);
}).catch(err => {
  console.error('[PDF Generator ABNT] Erro fatal:', err);
  app.exit(1);
});
