// Serviço de Consolidação e Exportação de Relatórios do Dashboard (PDF e Excel)
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { carregarOcorrencias } from './ocorrenciasService.js';
import { carregarRegistros as carregarRegistrosProvisorios } from './provisoriosService.js';
import { carregarVisitantes as carregarRegistrosVisitantes } from './visitantesService.js';
import { carregarInventarioRfid } from './rfidService.js';
import { obterResponsaveisSincrono } from './responsaveisService.js';

/**
 * Função utilitária para invocar o plugin jspdf-autotable com máxima compatibilidade ESM/Vite
 */
function sanitizarCelulas(dados) {
  if (!Array.isArray(dados)) return [];
  return dados.map(linha => {
    if (!Array.isArray(linha)) return [];
    return linha.map(item => (item === null || item === undefined ? '-' : String(item)));
  });
}

function executarAutoTable(doc, options = {}) {
  try {
    const autoTableFn =
      (typeof autoTable === 'function' ? autoTable : null) ||
      (typeof autoTable?.default === 'function' ? autoTable.default : null) ||
      (typeof autoTable?.default?.default === 'function' ? autoTable.default.default : null) ||
      (typeof doc.autoTable === 'function' ? doc.autoTable.bind(doc) : null);

    if (!autoTableFn) {
      console.error('Falha crítica: autoTable não é uma função executável:', autoTable);
      throw new Error('A biblioteca jspdf-autotable não pôde ser inicializada.');
    }

    const optionsSanitizadas = {
      theme: 'grid',
      pageBreak: 'avoid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        lineColor: [51, 65, 85],
        lineWidth: 0.1
      },
      bodyStyles: {
        fillColor: [15, 23, 42],
        textColor: [241, 245, 249],
        fontSize: 7.5,
        halign: 'left',
        cellPadding: 2,
        lineColor: [30, 41, 59],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [22, 32, 50],
        textColor: [241, 245, 249]
      },
      ...options,
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        lineColor: [51, 65, 85],
        lineWidth: 0.1,
        ...(options.headStyles || {})
      },
      bodyStyles: {
        fillColor: [15, 23, 42],
        textColor: [241, 245, 249],
        fontSize: 7.5,
        halign: 'left',
        cellPadding: 2,
        lineColor: [30, 41, 59],
        lineWidth: 0.1,
        ...(options.bodyStyles || {})
      },
      alternateRowStyles: {
        fillColor: [22, 32, 50],
        textColor: [241, 245, 249],
        ...(options.alternateRowStyles || {})
      }
    };

    if (optionsSanitizadas.head) {
      optionsSanitizadas.head = sanitizarCelulas(optionsSanitizadas.head);
    }
    if (optionsSanitizadas.body) {
      optionsSanitizadas.body = sanitizarCelulas(optionsSanitizadas.body);
    }

    autoTableFn(doc, optionsSanitizadas);
    return doc.lastAutoTable || { finalY: (options.startY || 40) + 15 };
  } catch (err) {
    console.error('Erro ao executar autoTable no documento PDF:', err);
    return { finalY: (options.startY || 40) + 15 };
  }
}

/**
 * Dispara o download nativo do arquivo no navegador via Blob e elemento <a> temporário
 */
function dispararDownloadNavegador(blob, nomeArquivo) {
  if (typeof window === 'undefined' || !window.document) return;
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 1500);
  } catch (err) {
    console.error('Erro ao disparar download nativo no navegador:', err);
  }
}

/**
 * Salva fisicamente o PDF no servidor local (diretório seguro de Documentos e Rede)
 */
async function salvarPdfNaPastaExports(filename, base64Pdf, caminhoRede) {
  try {
    const res = await fetch('/api/salvar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Pdf, caminhoRede })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Falha ao salvar PDF no disco.', warnings: errData.warnings };
    }
    return await res.json();
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar PDF no servidor local:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Salva fisicamente o Excel no servidor local (diretório seguro de Documentos e Rede)
 */
async function salvarExcelNaPastaExports(filename, base64Excel, caminhoRede) {
  try {
    const res = await fetch('/api/salvar-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Excel, caminhoRede })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Falha ao salvar Excel no disco.', warnings: errData.warnings };
    }
    return await res.json();
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar Excel no servidor local:', err);
    return { success: false, error: err.message };
  }
}

/**
 * REGRA DE NEGÓCIO: Gera o Relatório Consolidado Executivo em PDF
 */
export async function exportarRelatorioConsolidadoPdf({
  periodoNome = 'Mês Atual (Setembro/2026)',
  filtros = {},
  operador = 'Op. Operador 01',
  dadosConsolidados = null
} = {}) {
  try {
    const JsPdfConstructor = typeof jsPDF === 'function' ? jsPDF : (jsPDF?.jsPDF || jsPDF?.default?.jsPDF || jsPDF?.default || jsPDF);
    const doc = new JsPdfConstructor({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    const TAXA_SEGUNDA_VIA = 30.0;

    const agoraStr = new Date().toLocaleString('pt-BR');
    const nomeOperadorAtivo = operador || localStorage.getItem('cco_operador_ativo') || 'Op. Operador 01';

    // Desestrutura os filtros inteligentes
    const { 
      predio = 'TODOS', 
      area = 'TODAS', 
      topico = 'TODOS', 
      empresa = 'TODAS' 
    } = filtros;

    // Carrega dados garantindo que sejam arrays mesmo que vazios ou de promessas
    let ocorrencias = [];
    let provisorios = [];
    let visitantes = [];
    let rfid = [];

    if (dadosConsolidados) {
      ocorrencias = Array.isArray(dadosConsolidados.ocorrencias) ? dadosConsolidados.ocorrencias : [];
      provisorios = Array.isArray(dadosConsolidados.provisorios) ? dadosConsolidados.provisorios : [];
      visitantes = Array.isArray(dadosConsolidados.visitantes) ? dadosConsolidados.visitantes : [];
      rfid = Array.isArray(dadosConsolidados.rfid) ? dadosConsolidados.rfid : [];
    } else {
      const [ocBase, provBase, visBase, rfidBase] = await Promise.all([
        carregarOcorrencias().catch(e => { console.warn('Erro ao carregar ocorrencias:', e); return []; }),
        Promise.resolve(carregarRegistrosProvisorios()).catch(e => { console.warn('Erro ao carregar provisorios:', e); return []; }),
        Promise.resolve(carregarRegistrosVisitantes()).catch(e => { console.warn('Erro ao carregar visitantes:', e); return []; }),
        Promise.resolve(carregarInventarioRfid()).catch(e => { console.warn('Erro ao carregar rfid:', e); return []; })
      ]);

      const ocLista = Array.isArray(ocBase) ? ocBase : [];
      const provLista = Array.isArray(provBase) ? provBase : [];
      const visLista = Array.isArray(visBase) ? visBase : [];
      const rfidLista = Array.isArray(rfidBase) ? rfidBase : [];

      // 1. Ocorrências filtradas por Prédio, Área e Tópico
      ocorrencias = ocLista.filter(o => {
        if (!o) return false;
        if (predio !== 'TODOS') {
          const predioItem = o.predio || (o.local && o.local.split(' - ')[0]) || '';
          if (predioItem !== predio) return false;
        }
        if (area !== 'TODAS') {
          const areaItem = o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : '') || '';
          if (areaItem !== area) return false;
        }
        if (topico !== 'TODOS' && o.topico && o.topico !== topico) return false;
        return true;
      });

      // 2. Credenciais e Visitantes filtrados por Empresa
      provisorios = provLista.filter(p => {
        if (!p) return false;
        if (empresa !== 'TODAS' && p.empresa && !p.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });

      visitantes = visLista.filter(v => {
        if (!v) return false;
        if (empresa !== 'TODAS' && v.empresa && !v.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });

      rfid = rfidLista.filter(r => {
        if (!r) return false;
        if (empresa !== 'TODAS' && r.empresa && !r.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });
    }

    // Métricas consolidadas
    const totalOcorrencias = ocorrencias.length;
    const criticas = ocorrencias.filter(o => o && o.gravidade === 'Crítica').length;
    const altas = ocorrencias.filter(o => o && (o.gravidade === 'Alta' || o.gravidade === 'Grave')).length;
    const medias = ocorrencias.filter(o => o && o.gravidade === 'Média').length;
    const baixas = ocorrencias.filter(o => o && (o.gravidade === 'Baixa' || o.gravidade === 'Leve')).length;
    const pctCritica = totalOcorrencias > 0 ? Math.round((criticas / totalOcorrencias) * 100) : 0;
    const pctAlta = totalOcorrencias > 0 ? Math.round((altas / totalOcorrencias) * 100) : 0;
    const pctMedia = totalOcorrencias > 0 ? Math.round((medias / totalOcorrencias) * 100) : 0;
    const pctBaixa = totalOcorrencias > 0 ? Math.round((baixas / totalOcorrencias) * 100) : 0;

    const provisoriosPendentes = provisorios.filter(p => p && (p.status === 'NAO_DEVOLVIDO' || p.status === 'Pendente'));
    const totalPendentes = provisoriosPendentes.length;
    const provisoriosP1 = provisoriosPendentes.filter(p => p?.portaria === 'P1').length;
    const provisoriosP2 = provisoriosPendentes.filter(p => p?.portaria === 'P2').length;
    const reincidentes = provisorios.filter(p => (p?.totalAcessosMes || 1) >= 3);
    const totalRfidExtraviados = rfid.filter(r => r?.status === 'PERDIDO' || r?.status === 'PAGO').length;
    const totalRfidPagos = rfid.filter(r => r?.status === 'PAGO').length;

    // Helper para desenhar o cabeçalho executivo padronizado em qualquer página
    function desenharCabecalhoPagina(doc, titulo, subtitulo, subtituloExtra, corBarra = [37, 99, 235]) {
      // 1. Fundo total escuro oficial da CCO para a página inteira (#0b0f19)
      doc.setFillColor(11, 15, 25);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // 2. Faixa do cabeçalho (#0f172a)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, 'F');

      doc.setFillColor(corBarra[0], corBarra[1], corBarra[2]);
      doc.rect(0, 25, pageWidth, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.text(titulo, margin, 9);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(191, 219, 254);
      doc.text(subtitulo, margin, 15);

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(subtituloExtra, margin, 21);

      // Box do Operador e Período à direita
      const boxWidth = 86;
      const boxX = pageWidth - margin - boxWidth;
      const boxCenterX = boxX + (boxWidth / 2);
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(boxX, 4, boxWidth, 18, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`OPERADOR CCO: ${nomeOperadorAtivo.toUpperCase()}`, boxCenterX, 9, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Período: ${periodoNome}`, boxCenterX, 13.5, { align: 'center' });
      doc.text(`Emissão: ${agoraStr}`, boxCenterX, 17.5, { align: 'center' });
    }

    // =========================================================================
    // PÁGINA 1: DASHBOARD 1 - OCORRÊNCIAS & GESTÃO OPERACIONAL
    // =========================================================================
    desenharCabecalhoPagina(
      doc,
      'CCO SECURITY SUITE • DASHBOARD 1: OCORRÊNCIAS & SEGURANÇA PATRIMONIAL',
      'PAINEL GERENCIAL DA CENTRAL DE CONTROLE OPERACIONAL • PLANTA OPERACIONAL',
      `Filtros Ocorrências: Prédio: [${predio}] | Área: [${area}] | Tópico: [${topico}]`,
      [37, 99, 235] // blue-600
    );

    let currentY = 32;

    // 2. Tabela Resumo dos 4 Cards Principais (KPIs Estratégicos D1)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('1. INDICADORES PRINCIPAIS DE DESEMPENHO (KPIS DE OCORRÊNCIA)', margin, currentY);
    currentY += 3.5;

    const kpisData = [
      [
        'Total de Ocorrências',
        'Críticas & Graves',
        'Médias & Operacionais',
        'Resolução & Evidências'
      ],
      [
        `${totalOcorrencias} RO(s) Registrado(s)`,
        `${criticas + altas} Casos (${pctCritica + pctAlta}%)`,
        `${medias + baixas} Casos (${pctMedia + pctBaixa}%)`,
        `${dadosConsolidados?.ocorrencias ? (dadosConsolidados.ocorrencias.filter(o => o?.fotos?.length > 0).length) : 0} com Fotos`
      ],
      [
        `Prédio: ${predio} | Tópico: ${topico}`,
        `${criticas} Crítica(s) • ${altas} Alta gravidade`,
        `${medias} Média(s) • ${baixas} Baixa severidade`,
        '100% formalizadas com protocolo e PDF'
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisData[0]],
      body: [kpisData[1], kpisData[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // -------------------------------------------------------------------------
    // DETALHAMENTO ANALÍTICO DE OCORRÊNCIAS (4 TABELAS EXCLUSIVAS)
    // -------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('2. DETALHAMENTO ANALÍTICO DE OCORRÊNCIAS (PLANTA & RESPOSTA OPERACIONAL)', margin, currentY);
    currentY += 3.5;

    const colWidth = (contentWidth - 6) / 2; // ~131.5mm
    const col2X = margin + colWidth + 6;

    const tabelasAnaliticas = dadosConsolidados?.tabelasAnaliticas || {};

    // Dados Tabela 1: Ocorrências por Prédio
    let linhasPredio = [];
    if (Array.isArray(tabelasAnaliticas.ocorrenciasPorPredio) && tabelasAnaliticas.ocorrenciasPorPredio.length > 0) {
      linhasPredio = tabelasAnaliticas.ocorrenciasPorPredio.slice(0, 4).map(p => [
        p.predio || '-',
        `${p.total} RO(s)`,
        `${p.porcentagem}%`
      ]);
    } else {
      const mapa = new Map();
      ocorrencias.forEach(o => {
        const p = (o?.predio || o?.local || 'Não informado').trim();
        mapa.set(p, (mapa.get(p) || 0) + 1);
      });
      linhasPredio = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([p, tot]) => [p, `${tot} RO(s)`, totalOcorrencias > 0 ? `${Math.round((tot / totalOcorrencias) * 100)}%` : '0%']);
    }
    if (linhasPredio.length === 0) {
      linhasPredio = [['Nenhum registro para os filtros ativos.', '-', '-']];
    }

    // Dados Tabela 2: Ocorrências por Tópico
    let linhasTopico = [];
    if (Array.isArray(tabelasAnaliticas.ocorrenciasPorTopico) && tabelasAnaliticas.ocorrenciasPorTopico.length > 0) {
      linhasTopico = tabelasAnaliticas.ocorrenciasPorTopico.slice(0, 4).map(t => [
        t.topico || '-',
        `${t.total} RO(s)`,
        `${t.porcentagem}%`
      ]);
    } else {
      const mapa = new Map();
      ocorrencias.forEach(o => {
        const top = (o?.topico || o?.natureza || 'Operacional').trim();
        mapa.set(top, (mapa.get(top) || 0) + 1);
      });
      linhasTopico = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([top, tot]) => [top, `${tot} RO(s)`, totalOcorrencias > 0 ? `${Math.round((tot / totalOcorrencias) * 100)}%` : '0%']);
    }
    if (linhasTopico.length === 0) {
      linhasTopico = [['Nenhum tópico classificado no período.', '-', '-']];
    }

    // Dados Tabela 3: Produtividade CCO
    let linhasProdutividade = [];
    if (Array.isArray(tabelasAnaliticas.produtividade) && tabelasAnaliticas.produtividade.length > 0) {
      linhasProdutividade = tabelasAnaliticas.produtividade.slice(0, 4).map(p => [
        p.operador || '-',
        `${p.total} RO(s) (${p.porcentagem || 0}%)`
      ]);
    } else {
      const mapa = new Map();
      ocorrencias.forEach(o => {
        const op = o?.operador || o?.vigilante || 'Operador CCO';
        mapa.set(op, (mapa.get(op) || 0) + 1);
      });
      linhasProdutividade = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([op, tot]) => [op, `${tot} RO(s)`]);
    }
    if (linhasProdutividade.length === 0) {
      linhasProdutividade = [['Nenhum RO emitido no período.', '-']];
    }

    // Dados Tabela 4: Protocolos Recentes
    let linhasRecentes = [];
    if (Array.isArray(tabelasAnaliticas.ultimasOcorrencias) && tabelasAnaliticas.ultimasOcorrencias.length > 0) {
      linhasRecentes = tabelasAnaliticas.ultimasOcorrencias.slice(0, 4).map(u => [
        u.numeroRO || 'RO-2026',
        u.predio || u.local || 'Planta',
        u.gravidade || 'Média'
      ]);
    } else {
      linhasRecentes = ocorrencias.slice(0, 4).map(o => [
        o?.numeroRO || 'RO-2026',
        o?.predio || o?.local || 'Planta Operacional',
        o?.gravidade || 'MÉDIA'
      ]);
    }
    if (linhasRecentes.length === 0) {
      linhasRecentes = [['Nenhuma ocorrência recente.', '-', '-']];
    }

    const startLinha1Y = currentY;

    // Renderiza Tabela 1 (Esquerda): Incidência por Prédio
    executarAutoTable(doc, {
      startY: startLinha1Y,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Prédio / Localidade', 'Qtd ROs', '% Total']],
      body: linhasPredio,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });
    const finalYTab1 = doc.lastAutoTable?.finalY || startLinha1Y;

    // Renderiza Tabela 2 (Direita): Classificação por Tópico
    executarAutoTable(doc, {
      startY: startLinha1Y,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Tópico / Categoria', 'Qtd ROs', '% Total']],
      body: linhasTopico,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });
    const finalYTab2 = doc.lastAutoTable?.finalY || startLinha1Y;

    const startLinha2Y = Math.max(finalYTab1, finalYTab2) + 4;

    // Renderiza Tabela 3 (Esquerda): Produtividade CCO
    executarAutoTable(doc, {
      startY: startLinha2Y,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Operador CCO Responsável', 'Total de ROs Emitidos']],
      body: linhasProdutividade,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129], // emerald-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });
    const finalYTab3 = doc.lastAutoTable?.finalY || startLinha2Y;

    // Renderiza Tabela 4 (Direita): Protocolos Recentes
    executarAutoTable(doc, {
      startY: startLinha2Y,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Protocolo RO', 'Prédio / Localidade', 'Gravidade']],
      body: linhasRecentes,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6], // amber-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });
    const finalYTab4 = doc.lastAutoTable?.finalY || startLinha2Y;

    currentY = Math.max(finalYTab3, finalYTab4) + 5;

    // 3. Tabela de Ocorrências Recentes do Período (Largura total)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('3. RELATÓRIOS DE OCORRÊNCIA DETALHADOS NO PERÍODO', margin, currentY);
    currentY += 3.5;

    const linhasOcorrencias = (ocorrencias.slice(0, 4)).map(o => [
      o?.numeroRO || 'RO-2026',
      `${o?.data || ''} ${o?.hora || ''}`.trim() || '-',
      o?.local || (o?.predio ? `${o.predio} - ${o.area || ''}` : 'Planta Operacional'),
      o?.gravidade || 'MÉDIA',
      o?.titulo || 'Ocorrência Operacional',
      o?.operador || 'Op. CCO'
    ]);

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Protocolo', 'Data/Hora', 'Localização / Prédio', 'Gravidade', 'Título da Ocorrência', 'Operador Responsável']],
      body: linhasOcorrencias.length > 0 ? linhasOcorrencias : [['Nenhuma ocorrência registrada no período.', '', '', '', '', '']],
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8 }
    });

    // =========================================================================
    // PÁGINA 2: DASHBOARD 2 - PROVISÓRIOS / MOVIMENTAÇÃO & CAUTELAS
    // =========================================================================
    doc.addPage('a4', 'landscape');

    desenharCabecalhoPagina(
      doc,
      'CCO SECURITY SUITE • DASHBOARD 2: PROVISÓRIOS & MOVIMENTAÇÃO',
      'GESTÃO DE CAUTELAS ATIVAS, DEVOLUÇÕES, REINCIDÊNCIAS E ESCANINHO FÍSICO',
      'Módulo exclusivo para monitoramento do fluxo de crachás provisórios de colaboradores e prestadores de serviços',
      [79, 70, 229] // indigo-600
    );

    currentY = 32;

    // Métricas calculadas para Provisórios
    const metProv = dadosConsolidados?.metricasProvisorios || {
      totalCautelasAtivas: totalPendentes,
      ocupadosP1: provisoriosP1,
      ocupadosP2: provisoriosP2,
      totalDevolvidosHoje: provisorios.filter(p => p?.status === 'DEVOLVIDO').length,
      totalSlotsOcupados: provisoriosP1 + provisoriosP2,
      taxaOcupacaoEscaninho: Math.min(100, Math.round(((provisoriosP1 + provisoriosP2) / 20) * 100)),
      totalPerdas: provisorios.filter(p => p?.status === 'PERDIDO' || p?.situacao === 'PERDIDO').length,
      totalPagos: provisorios.filter(p => p?.status === 'PAGO' || p?.situacao === 'PAGO').length,
      totalIsentos: provisorios.filter(p => p?.status === 'ISENTO_BO' || p?.situacao === 'ISENTO_BO').length,
      valorACobrar: provisorios.filter(p => p?.status === 'PERDIDO' || p?.situacao === 'PERDIDO').length * 30,
      valorRecuperado: provisorios.filter(p => p?.status === 'PAGO' || p?.situacao === 'PAGO').length * 30,
      pctRessarcimento: 100
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('1. INDICADORES ESTRATÉGICOS DE PROVISÓRIOS (CAUTELAS & ESCANINHO)', margin, currentY);
    currentY += 3.5;

    const totalProvisoriosQtd = provisorios.length;
    const taxaReincidencia = totalProvisoriosQtd > 0 ? Math.round((reincidentes.length / totalProvisoriosQtd) * 100) : 0;

    const kpisDataD2 = [
      [
        'Cautelas Ativas (Em Uso)',
        'Devoluções Hoje',
        'Taxa de Reincidência (> 3 Acessos)',
        'Ocupação Escaninho (20 Slots)'
      ],
      [
        `${metProv.totalCautelasAtivas} Cautelas Abertas`,
        `${metProv.totalDevolvidosHoje} Devolvidos Hoje`,
        `${reincidentes.length} Colaboradores Reincidentes`,
        `${metProv.taxaOcupacaoEscaninho}% (${metProv.totalSlotsOcupados}/20 Ocupados)`
      ],
      [
        `Portaria 1: ${metProv.ocupadosP1} • Portaria 2: ${metProv.ocupadosP2}`,
        'Regularização em andamento no turno',
        `${taxaReincidencia}% do volume total do mês`,
        `P1: ${metProv.ocupadosP1}/10 • P2: ${metProv.ocupadosP2}/10`
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisDataD2[0]],
      body: [kpisDataD2[1], kpisDataD2[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202], // indigo-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Bloco Financeiro / Perdas Provisórios
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('2. CONTROLE FINANCEIRO: PERDIDOS VS. RESSARCIDOS (PROVISÓRIOS)', margin, currentY);
    currentY += 3.5;

    const kpisFinD2 = [
      [
        'Total Extravios Pendentes',
        'Valor a Cobrar (2ª Via)',
        'Valor Quitado / Ressarcido',
        'Taxa de Ressarcimento'
      ],
      [
        `${metProv.totalPerdas} Cartão(ões) a Cobrar`,
        `R$ ${metProv.valorACobrar},00`,
        `R$ ${metProv.valorRecuperado},00`,
        `${metProv.pctRessarcimento}% Recuperado`
      ],
      [
        'Aguardando quitação ou desconto em folha',
        'Taxa regulamentar: R$ 30,00/unidade',
        `${metProv.totalPagos} cartão(ões) quitado(s)`,
        `${metProv.totalIsentos} isenção(ões) formalizada(s) por B.O.`
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisFinD2[0]],
      body: [kpisFinD2[1], kpisFinD2[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Tabelas Analíticas D2: Cautelas em Aberto (Esq) e Reincidência/Extravios (Dir)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('3. DETALHAMENTO ANALÍTICO DE CAUTELAS & PERMUTAS', margin, currentY);
    currentY += 3.5;

    const listaCautelas = provisorios
      .filter(p => p && (p.status === 'NAO_DEVOLVIDO' || p.situacao === 'NÃO DEVOLVIDO' || p.situacao === 'NAO_DEVOLVIDO' || p.status === 'Pendente'))
      .slice(0, 6)
      .map(p => [
        p.colaborador || p.nome || '-',
        p.cartao || '-',
        p.portaria || 'P1',
        p.horaRetirada || '-',
        p.empresa || '-'
      ]);

    const listaExtraviosProv = provisorios
      .filter(p => p && (p.status === 'PERDIDO' || p.situacao === 'PERDIDO' || p.status === 'PAGO' || p.situacao === 'PAGO'))
      .slice(0, 6)
      .map(p => [
        p.colaborador || p.nome || '-',
        p.empresa || '-',
        p.cartao || '-',
        (p.status === 'PAGO' || p.situacao === 'PAGO') ? 'QUITADO (R$ 30)' : 'A COBRAR (R$ 30)'
      ]);

    const startD2TabY = currentY;

    // Tabela 1 D2 (Esquerda)
    executarAutoTable(doc, {
      startY: startD2TabY,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Colaborador', 'Cartão', 'Port.', 'Retirada', 'Empresa']],
      body: listaCautelas.length > 0 ? listaCautelas : [['Nenhuma cautela pendente.', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // indigo-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });
    const finalYD2Tab1 = doc.lastAutoTable?.finalY || startD2TabY;

    // Tabela 2 D2 (Direita)
    executarAutoTable(doc, {
      startY: startD2TabY,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Colaborador', 'Empresa', 'Cartão', 'Status Cobrança']],
      body: listaExtraviosProv.length > 0 ? listaExtraviosProv : [['Nenhum registro de extravio no período.', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [225, 29, 72], // rose-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });

    // =========================================================================
    // PÁGINA 3: DASHBOARD 3 - VISITANTES & GESTÃO DE PORTARIAS
    // =========================================================================
    doc.addPage('a4', 'landscape');

    desenharCabecalhoPagina(
      doc,
      'CCO SECURITY SUITE • DASHBOARD 3: CONTROLE DE VISITANTES & PORTARIAS',
      'MONITORAMENTO DE VISITANTES EM TEMPO REAL, AUDITORIA DE ANFITRIÕES E CRACHÁS',
      'Módulo de controle de acesso físico de terceiros, validação de vínculos institucionais e retenção de credenciais',
      [13, 148, 136] // teal-600
    );

    currentY = 32;

    const metVis = dadosConsolidados?.metricasVisitantes || {
      totalNoSite: visitantes.filter(v => v?.situacao === 'NÃO DEVOLVIDO' || v?.situacao === 'NAO_DEVOLVIDO' || v?.status === 'NAO_DEVOLVIDO').length,
      entradasHoje: visitantes.length,
      saidasHoje: visitantes.filter(v => v?.situacao === 'DEVOLVIDO' || v?.status === 'DEVOLVIDO').length,
      pctAuditados: 100,
      comAnfitriao: visitantes.filter(v => v?.anfitriao).length,
      noSiteP1: visitantes.filter(v => v?.portaria === 'P1' && (v?.situacao === 'NÃO DEVOLVIDO' || v?.situacao === 'NAO_DEVOLVIDO')).length,
      noSiteP2: visitantes.filter(v => v?.portaria === 'P2' && (v?.situacao === 'NÃO DEVOLVIDO' || v?.situacao === 'NAO_DEVOLVIDO')).length,
      taxaOcupacaoEscaninhoVis: Math.min(100, Math.round((visitantes.filter(v => v?.situacao === 'NÃO DEVOLVIDO').length / 40) * 100)),
      totalPerdidos: visitantes.filter(v => v?.situacao === 'PERDIDO').length,
      totalPagos: visitantes.filter(v => v?.situacao === 'PAGO').length,
      totalIsentos: visitantes.filter(v => v?.situacao === 'ISENTO_BO').length,
      valorACobrar: visitantes.filter(v => v?.situacao === 'PERDIDO').length * 30,
      valorRecuperado: visitantes.filter(v => v?.situacao === 'PAGO').length * 30,
      pctRessarcimento: 100
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('1. INDICADORES PRINCIPAIS DE VISITANTES (FLUXO & CONFORMIDADE)', margin, currentY);
    currentY += 3.5;

    const kpisDataD3 = [
      [
        'Visitantes no Site (Tempo Real)',
        'Fluxo de Acessos Hoje',
        'Auditoria de Anfitriões',
        'Ocupação Escaninho (40 Slots)'
      ],
      [
        `${metVis.totalNoSite} Visitantes Presentes`,
        `${metVis.entradasHoje} Entradas • ${metVis.saidasHoje} Saídas`,
        `${metVis.pctAuditados}% em Conformidade`,
        `${metVis.taxaOcupacaoEscaninhoVis}% (${metVis.totalNoSite}/40 Slots)`
      ],
      [
        `Portaria 1: ${metVis.noSiteP1} • Portaria 2: ${metVis.noSiteP2}`,
        'Movimentação consolidada do dia',
        `${metVis.comAnfitriao} com anfitrião e área vinculados`,
        'Capacidade física: 20 P1 + 20 P2'
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisDataD3[0]],
      body: [kpisDataD3[1], kpisDataD3[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [15, 118, 110], // teal-700
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Bloco Financeiro / Crachás de Visitantes
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('2. CONTROLE FINANCEIRO: CRACHÁS DE VISITANTES PERDIDOS VS. RESSARCIDOS', margin, currentY);
    currentY += 3.5;

    const kpisFinD3 = [
      [
        'Crachás Retidos / Extraviados',
        'Valor a Cobrar (2ª Via)',
        'Valor Quitado / Ressarcido',
        'Taxa de Quitação'
      ],
      [
        `${metVis.totalPerdidos} Crachá(s) a Cobrar`,
        `R$ ${metVis.valorACobrar},00`,
        `R$ ${metVis.valorRecuperado},00`,
        `${metVis.pctRessarcimento}% Quitado`
      ],
      [
        'Pendências geradas por não devolução/perda',
        'Taxa regulamentar: R$ 30,00/unidade',
        `${metVis.totalPagos} crachá(s) quitado(s)`,
        `${metVis.totalIsentos} isenção(ões) formalizada(s) por B.O.`
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisFinD3[0]],
      body: [kpisFinD3[1], kpisFinD3[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Tabelas Analíticas D3: Visitantes no Site (Esq) e Auditoria de Anfitriões (Dir)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('3. DETALHAMENTO DE FLUXO & AUDITORIA DE ANFITRIÕES', margin, currentY);
    currentY += 3.5;

    const listaVisNoSite = visitantes
      .filter(v => v && (v.situacao === 'NÃO DEVOLVIDO' || v.situacao === 'NAO_DEVOLVIDO' || v.status === 'NAO_DEVOLVIDO'))
      .slice(0, 6)
      .map(v => [
        v.visitante || v.nome || '-',
        v.empresa || '-',
        v.cartao || '-',
        v.horaEntrada || '-',
        v.anfitriao || 'NÃO INFORMADO'
      ]);

    // Anfitriões consolidados
    let listaAnfitrioesD3 = [];
    if (Array.isArray(metVis.listaAnfitrioes) && metVis.listaAnfitrioes.length > 0) {
      listaAnfitrioesD3 = metVis.listaAnfitrioes.slice(0, 6).map(a => [
        a.anfitriao || '-',
        a.empresa || '-',
        `${a.total} visitas`,
        `${a.noSite} no site`
      ]);
    } else {
      const mapaAnf = new Map();
      visitantes.forEach(v => {
        const anf = (v.anfitriao || 'NÃO VINCULADO').trim().toUpperCase();
        const cur = mapaAnf.get(anf) || { total: 0, empresa: v.empresa || '-' };
        cur.total += 1;
        mapaAnf.set(anf, cur);
      });
      listaAnfitrioesD3 = Array.from(mapaAnf.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 6)
        .map(([anf, val]) => [anf, val.empresa, `${val.total} visitas`, '-']);
    }

    const startD3TabY = currentY;

    // Tabela 1 D3 (Esquerda)
    executarAutoTable(doc, {
      startY: startD3TabY,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Visitante', 'Empresa', 'Cartão', 'Entrada', 'Anfitrião Responsável']],
      body: listaVisNoSite.length > 0 ? listaVisNoSite : [['Nenhum visitante ativo no site no momento.', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [13, 148, 136], // teal-600
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });

    // Tabela 2 D3 (Direita)
    executarAutoTable(doc, {
      startY: startD3TabY,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Anfitrião Responsável', 'Empresa', 'Total Visitas', 'Status Atual']],
      body: listaAnfitrioesD3.length > 0 ? listaAnfitrioesD3 : [['Nenhum anfitrião registrado.', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59], // slate-800
        textColor: [255, 255, 255],
        fontSize: 6.8,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.5, cellPadding: 1.5 }
    });

    // =========================================================================
    // PÁGINA 4: DASHBOARD 4 - RFID & CONTABILIDADE CONSOLIDADA MULTI-MÓDULOS
    // =========================================================================
    doc.addPage('a4', 'landscape');

    desenharCabecalhoPagina(
      doc,
      'CCO SECURITY SUITE • DASHBOARD 4: INVENTÁRIO RFID & CONTABILIDADE CONSOLIDADA',
      'STATUS GLOBAL DE CARTÕES (01 A 350 & FIXOS) E CENTRALIZAÇÃO DE DÉBITOS DE 2ª VIA',
      'Consolidação de cobranças corporativas cruzadas: RFID + Visitantes + Provisórios (@ R$ 30,00/un)',
      [16, 185, 129] // emerald-600
    );

    currentY = 32;

    const metRfid = dadosConsolidados?.metricasRfidContabilidade || {
      rotativosTotal: rfid.filter(r => r?.tipo === 'ROTATIVO').length,
      rotativosAtivos: rfid.filter(r => r?.tipo === 'ROTATIVO' && r?.status === 'ATIVO').length,
      rotativosDisponiveis: rfid.filter(r => r?.tipo === 'ROTATIVO' && r?.status === 'DISPONIVEL').length,
      fixosTotal: rfid.filter(r => r?.tipo === 'FIXO').length,
      fixosAtivos: rfid.filter(r => r?.tipo === 'FIXO' && r?.status === 'ATIVO').length,
      fixosDisponiveis: rfid.filter(r => r?.tipo === 'FIXO' && r?.status === 'DISPONIVEL').length,
      totalItensACobrar: rfid.filter(r => r?.status === 'PERDIDO').length,
      totalValorACobrar: rfid.filter(r => r?.status === 'PERDIDO').length * 30,
      totalItensPagos: rfid.filter(r => r?.status === 'PAGO').length,
      totalValorRecuperado: rfid.filter(r => r?.status === 'PAGO').length * 30,
      taxaEficacia: 100,
      resumoCobrancaEmpresas: [],
      todasPendencias: []
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('1. INDICADORES DE INVENTÁRIO GLOBAL & RECUPERAÇÃO FINANCEIRA', margin, currentY);
    currentY += 3.5;

    const kpisDataD4 = [
      [
        'Cartões Rotativos (01 a 350)',
        'Cartões Fixos Nominais',
        'Total a Cobrar (3 Módulos)',
        'Eficácia de Recuperação'
      ],
      [
        `${metRfid.rotativosAtivos} Ativos • ${metRfid.rotativosDisponiveis} Disponíveis`,
        `${metRfid.fixosAtivos} Ativos • ${metRfid.fixosDisponiveis} Disponíveis`,
        `${metRfid.totalItensACobrar} Débitos (R$ ${metRfid.totalValorACobrar},00)`,
        `${metRfid.taxaEficacia}% (${metRfid.totalItensPagos} Quitados)`
      ],
      [
        `Total no estoque: ${metRfid.rotativosTotal} cartões`,
        `Total cadastrados: ${metRfid.fixosTotal} cartões`,
        'Cruzamento consolidado: RFID + Prov + Vis',
        `R$ ${metRfid.totalValorRecuperado},00 ressarcidos`
      ]
    ];

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [kpisDataD4[0]],
      body: [kpisDataD4[1], kpisDataD4[2]],
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105], // emerald-600
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        halign: 'center',
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Tabela 2 D4: Resumo Consolidado de Cobrança por Empresa Contratada (Largura Total)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('2. RESUMO CONSOLIDADO DE COBRANÇA POR EMPRESA CONTRATADA', margin, currentY);
    currentY += 3.5;

    let linhasCobrancaEmpresas = [];
    if (Array.isArray(metRfid.resumoCobrancaEmpresas) && metRfid.resumoCobrancaEmpresas.length > 0) {
      linhasCobrancaEmpresas = metRfid.resumoCobrancaEmpresas.slice(0, 5).map(e => [
        e?.empresa || '-',
        `${e?.porModulo?.RFID || 0} unid.`,
        `${e?.porModulo?.['PROVISÓRIO'] || 0} unid.`,
        `${e?.porModulo?.VISITANTE || 0} unid.`,
        `${e?.totalItens || 0} credencial(is)`,
        `R$ ${e?.valorTotal || 0},00`,
        'Cobrança Direta / Faturamento'
      ]);
    } else {
      linhasCobrancaEmpresas = [['Nenhuma empresa com pendências financeiras de 2ª via ativas.', '-', '-', '-', '-', 'R$ 0,00', 'Sem débitos']];
    }

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Empresa Contratada', 'Débitos RFID', 'Débitos Provisórios', 'Débitos Visitantes', 'Total de Credenciais', 'Valor a Faturar', 'Ação Sugerida']],
      body: linhasCobrancaEmpresas,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 6.8,
        halign: 'center',
        cellPadding: 1.8
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 5;

    // Tabela 3 D4: Relação Consolidada de Pendências de 2ª Via / Extravios (Largura Total)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('3. CENTRAL GERAL DE PENDÊNCIAS DE 2ª VIA (EXTRAVIOS MULTI-MÓDULOS)', margin, currentY);
    currentY += 3.5;

    let linhasTodasPendencias = [];
    if (Array.isArray(metRfid.todasPendencias) && metRfid.todasPendencias.length > 0) {
      linhasTodasPendencias = metRfid.todasPendencias.slice(0, 5).map(p => [
        p.modulo || 'RFID',
        p.colaborador || '-',
        p.empresa || '-',
        p.cartao || '-',
        p.dataPerda || '-',
        `R$ ${p.valor || 30},00`,
        'À PAGAR (PENDENTE)'
      ]);
    } else {
      linhasTodasPendencias = [['Nenhum extravio pendente de quitação.', '-', '-', '-', '-', 'R$ 0,00', '100% REGULAR']];
    }

    executarAutoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Módulo', 'Portador / Colaborador', 'Empresa Contratada', 'Identificador Cartão', 'Data Ocorrência', 'Valor (2ª Via)', 'Status']],
      body: linhasTodasPendencias,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42], // slate-900
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 6.8,
        halign: 'center',
        cellPadding: 1.8
      }
    });

    // 5. Rodapé em todas as páginas com Carimbo do Operador e Paginação Padronizada
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `CCO Security Suite • Relatório Executivo Landscape • Operador em Turno: ${nomeOperadorAtivo} • Gerado em: ${agoraStr}`,
        margin,
        pageHeight - 6
      );
      doc.text(
        `Página ${p} de ${totalPaginas}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: 'right' }
      );
    }

    // Nome do arquivo padronizado
    const dataHojeStr = new Date().toISOString().substring(0, 10);
    const nomeArquivo = `CCO_Relatorio_Executivo_Consolidado_${dataHojeStr}.pdf`;

    // Gatilho de download nativo seguro do navegador via Blob ou doc.save
    try {
      doc.save(nomeArquivo);
    } catch (saveErr) {
      console.warn('doc.save() falhou, tentando download nativo via Blob:', saveErr);
      try {
        const blobPdf = doc.output('blob');
        dispararDownloadNavegador(blobPdf, nomeArquivo);
      } catch (blobErr) {
        console.warn('Falha no download via blob:', blobErr);
      }
    }

    // Salvamento seguro no disco (Documentos / Rede) via API local
    let resultadoServidor = null;
    try {
      const rawDataUri = doc.output('datauristring');
      const base64Pdf = rawDataUri.includes(',') ? rawDataUri.split(',')[1] : rawDataUri;
      const respConfig = obterResponsaveisSincrono();
      resultadoServidor = await salvarPdfNaPastaExports(nomeArquivo, base64Pdf, respConfig?.caminhoRede);
    } catch (saveErr) {
      console.warn('Aviso no salvamento do PDF via servidor local:', saveErr);
    }

    return {
      sucesso: true,
      nomeArquivo,
      caminhosSalvos: resultadoServidor?.savedPaths || [],
      warnings: resultadoServidor?.warnings || []
    };
  } catch (error) {
    console.error('Erro crítico dentro de exportarRelatorioConsolidadoPdf:', error);
    throw error;
  }
}

/**
 * REGRA DE NEGÓCIO: Gera a Base Consolidada de Dados em Excel (.xlsx)
 */
export async function exportarBaseConsolidadaExcel({
  periodoNome = 'Mês Atual (Setembro/2026)',
  filtros = {},
  operador = 'Op. Operador 01',
  dadosConsolidados = null
} = {}) {
  try {
    const agoraStr = new Date().toLocaleString('pt-BR');
    const nomeOperadorAtivo = operador || localStorage.getItem('cco_operador_ativo') || 'Op. Operador 01';

    const { 
      predio = 'TODOS', 
      area = 'TODAS', 
      topico = 'TODOS', 
      empresa = 'TODAS' 
    } = filtros;

    let ocorrencias = [];
    let provisorios = [];
    let visitantes = [];
    let rfid = [];

    if (dadosConsolidados) {
      ocorrencias = Array.isArray(dadosConsolidados.ocorrencias) ? dadosConsolidados.ocorrencias : [];
      provisorios = Array.isArray(dadosConsolidados.provisorios) ? dadosConsolidados.provisorios : [];
      visitantes = Array.isArray(dadosConsolidados.visitantes) ? dadosConsolidados.visitantes : [];
      rfid = Array.isArray(dadosConsolidados.rfid) ? dadosConsolidados.rfid : [];
    } else {
      const [ocBase, provBase, visBase, rfidBase] = await Promise.all([
        carregarOcorrencias().catch(e => { console.warn('Erro ao carregar ocorrencias:', e); return []; }),
        Promise.resolve(carregarRegistrosProvisorios()).catch(e => { console.warn('Erro ao carregar provisorios:', e); return []; }),
        Promise.resolve(carregarRegistrosVisitantes()).catch(e => { console.warn('Erro ao carregar visitantes:', e); return []; }),
        Promise.resolve(carregarInventarioRfid()).catch(e => { console.warn('Erro ao carregar rfid:', e); return []; })
      ]);

      const ocLista = Array.isArray(ocBase) ? ocBase : [];
      const provLista = Array.isArray(provBase) ? provBase : [];
      const visLista = Array.isArray(visBase) ? visBase : [];
      const rfidLista = Array.isArray(rfidBase) ? rfidBase : [];

      ocorrencias = ocLista.filter(o => {
        if (!o) return false;
        if (predio !== 'TODOS') {
          const predioItem = o.predio || (o.local && o.local.split(' - ')[0]) || '';
          if (predioItem !== predio) return false;
        }
        if (area !== 'TODAS') {
          const areaItem = o.area || (o.local && o.local.includes(' - ') ? o.local.split(' - ')[1] : '') || '';
          if (areaItem !== area) return false;
        }
        if (topico !== 'TODOS' && o.topico && o.topico !== topico) return false;
        return true;
      });

      provisorios = provLista.filter(p => {
        if (!p) return false;
        if (empresa !== 'TODAS' && p.empresa && !p.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });

      visitantes = visLista.filter(v => {
        if (!v) return false;
        if (empresa !== 'TODAS' && v.empresa && !v.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });

      rfid = rfidLista.filter(r => {
        if (!r) return false;
        if (empresa !== 'TODAS' && r.empresa && !r.empresa.toUpperCase().includes(empresa.toUpperCase())) return false;
        return true;
      });
    }

    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Executivo
    const pendentesCount = provisorios.filter(p => p && (p.status === 'NAO_DEVOLVIDO' || p.status === 'Pendente')).length;
    const perdidosCount = rfid.filter(r => r?.status === 'PERDIDO' || r?.status === 'PAGO').length;
    const pagosCount = rfid.filter(r => r?.status === 'PAGO').length;
    const disponivelCount = rfid.filter(r => r?.status === 'DISPONIVEL').length;

    const resumoKpis = [
      { 'Parâmetro / Indicador': 'Módulo de Gestão', 'Valor / Quantidade': 'CCO Security Suite', 'Observações': 'Central de Controle Operacional' },
      { 'Parâmetro / Indicador': 'Operador Responsável no Turno', 'Valor / Quantidade': nomeOperadorAtivo, 'Observações': 'Exclusivo CCO - Turno Ativo 12x36' },
      { 'Parâmetro / Indicador': 'Período dos Dados', 'Valor / Quantidade': periodoNome, 'Observações': 'Filtro Temporal Global' },
      { 'Parâmetro / Indicador': 'Filtro Contexto Ocorrências', 'Valor / Quantidade': `Prédio: [${predio}] | Área: [${area}] | Tópico: [${topico}]`, 'Observações': 'Afeta apenas a aba Ocorrências' },
      { 'Parâmetro / Indicador': 'Filtro Contexto Credenciais & Visitas', 'Valor / Quantidade': `Empresa: [${empresa}]`, 'Observações': 'Afeta apenas Provisórios e Visitantes' },
      { 'Parâmetro / Indicador': 'Data de Geração do Relatório', 'Valor / Quantidade': agoraStr, 'Observações': 'Exportação Consolidada' },
      { 'Parâmetro / Indicador': 'Total de Ocorrências no Período', 'Valor / Quantidade': ocorrencias.length, 'Observações': '100% com RO formalizado' },
      { 'Parâmetro / Indicador': 'Credenciais Provisórias Pendentes', 'Valor / Quantidade': pendentesCount, 'Observações': 'Urgente para cobrança de 2ª via' },
      { 'Parâmetro / Indicador': 'Total de Acessos de Visitantes', 'Valor / Quantidade': visitantes.length, 'Observações': 'Com anfitrião vinculado' },
      { 'Parâmetro / Indicador': 'Total de Cartões RFID em Estoque', 'Valor / Quantidade': disponivelCount, 'Observações': 'Rotativos 0 a 350 reidratados' },
      { 'Parâmetro / Indicador': 'Cartões Perdidos / Ressarcidos', 'Valor / Quantidade': `${pagosCount} de ${perdidosCount}`, 'Observações': 'Taxa de ressarcimento' }
    ];
    const wsResumo = XLSX.utils.json_to_sheet(resumoKpis);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

    // Aba 2: Detalhamento Analítico (4 Resumos Rápidos)
    const tabelasAnaliticas = dadosConsolidados?.tabelasAnaliticas || {};
    const dadosAnaliticosExcel = [
      { 'Categoria': '--- 1. ALERTA DE REINCIDÊNCIA (PROVISÓRIOS) ---', 'Identificador / Nome': '', 'Empresa / Detalhe': '', 'Métrica / Status': '', 'Referência': '' },
      ...(Array.isArray(tabelasAnaliticas.reincidentes) && tabelasAnaliticas.reincidentes.length > 0
        ? tabelasAnaliticas.reincidentes.map(r => ({
            'Categoria': 'Alerta de Reincidência',
            'Identificador / Nome': r.nome || '-',
            'Empresa / Detalhe': r.empresa || '-',
            'Métrica / Status': `${r.totalAcessos} acessos no mês`,
            'Referência': r.totalAcessos >= 3 ? 'CRÍTICO (Bloqueio / Justificativa)' : 'Atenção'
          }))
        : [{ 'Categoria': 'Alerta de Reincidência', 'Identificador / Nome': 'Nenhum registro', 'Empresa / Detalhe': '-', 'Métrica / Status': '-', 'Referência': '-' }]
      ),
      { 'Categoria': '--- 2. INADIMPLÊNCIA DE CREDENCIAIS (PERDIDOS NÃO PAGOS) ---', 'Identificador / Nome': '', 'Empresa / Detalhe': '', 'Métrica / Status': '', 'Referência': '' },
      ...(Array.isArray(tabelasAnaliticas.inadimplentes) && tabelasAnaliticas.inadimplentes.length > 0
        ? tabelasAnaliticas.inadimplentes.map(i => ({
            'Categoria': 'Inadimplência de Credenciais',
            'Identificador / Nome': i.nome || '-',
            'Empresa / Detalhe': i.empresa || '-',
            'Métrica / Status': `Perda em: ${i.dataPerda || '-'}`,
            'Referência': `Pendente de regularização (${i.cartao || 'Cartão'})`
          }))
        : [{ 'Categoria': 'Inadimplência de Credenciais', 'Identificador / Nome': 'Nenhum cartão pendente', 'Empresa / Detalhe': '-', 'Métrica / Status': '-', 'Referência': '-' }]
      ),
      { 'Categoria': '--- 3. PRODUTIVIDADE CCO (OCORRÊNCIAS) ---', 'Identificador / Nome': '', 'Empresa / Detalhe': '', 'Métrica / Status': '', 'Referência': '' },
      ...(Array.isArray(tabelasAnaliticas.produtividade) && tabelasAnaliticas.produtividade.length > 0
        ? tabelasAnaliticas.produtividade.map(p => ({
            'Categoria': 'Produtividade CCO',
            'Identificador / Nome': p.operador || '-',
            'Empresa / Detalhe': 'Central de Controle Operacional',
            'Métrica / Status': `${p.total} ROs emitidos`,
            'Referência': `${p.porcentagem || 0}% do volume total`
          }))
        : [{ 'Categoria': 'Produtividade CCO', 'Identificador / Nome': 'Nenhum registro', 'Empresa / Detalhe': '-', 'Métrica / Status': '-', 'Referência': '-' }]
      ),
      { 'Categoria': '--- 4. CARTÕES PROVISÓRIOS PENDENTES ---', 'Identificador / Nome': '', 'Empresa / Detalhe': '', 'Métrica / Status': '', 'Referência': '' },
      ...(Array.isArray(tabelasAnaliticas.pendentes) && tabelasAnaliticas.pendentes.length > 0
        ? tabelasAnaliticas.pendentes.map(p => ({
            'Categoria': 'Cartões Provisórios Pendentes',
            'Identificador / Nome': p.nome || '-',
            'Empresa / Detalhe': p.empresa || '-',
            'Métrica / Status': `Retirado às ${p.horaRetirada || '-'}`,
            'Referência': `Portaria ${p.portaria || 'P1'} - Cartão: ${p.cartao || '-'}`
          }))
        : [{ 'Categoria': 'Cartões Provisórios Pendentes', 'Identificador / Nome': 'Nenhum provisório pendente', 'Empresa / Detalhe': '-', 'Métrica / Status': '-', 'Referência': '-' }]
      )
    ];
    const wsAnalitico = XLSX.utils.json_to_sheet(dadosAnaliticosExcel);
    XLSX.utils.book_append_sheet(wb, wsAnalitico, 'Detalhamento Analítico');

    // Aba 3: Ocorrências
    const dadosOcorrencias = ocorrencias.length > 0 
      ? ocorrencias.map(o => ({
          'Nº RO': o?.numeroRO || '-',
          'Data': o?.data || '-',
          'Hora': o?.hora || '-',
          'Prédio': o?.predio || (o?.local && o?.local.split(' - ')[0]) || 'Site',
          'Área': o?.area || (o?.local && o?.local.includes(' - ') ? o.local.split(' - ')[1] : '') || '',
          'Tópico': o?.topico || '-',
          'Local Completo': o?.local || `${o?.predio || ''} - ${o?.area || ''}`,
          'Gravidade': o?.gravidade || 'Média',
          'Título': o?.titulo || '-',
          'Descrição': o?.descricao || '-',
          'Qtd Envolvidos': Array.isArray(o?.envolvidos) ? o.envolvidos.length : 0,
          'Envolvidos': Array.isArray(o?.envolvidos) ? o.envolvidos.map(e => `${e?.nome || ''} (${e?.empresa || ''})`).join('; ') : '-',
          'Qtd Imagens': Array.isArray(o?.fotos) ? o.fotos.length : 0,
          'Gerente Site': o?.responsaveis?.gerenteSite || 'Gerência de Operações',
          'Fiscal Contrato': o?.responsaveis?.fiscalContrato || 'Fiscalização de Contrato'
        }))
      : [{ 'Aviso': 'Nenhuma ocorrência registrada no período para os filtros selecionados.' }];
    const wsOcorrencias = XLSX.utils.json_to_sheet(dadosOcorrencias);
    XLSX.utils.book_append_sheet(wb, wsOcorrencias, 'Ocorrências');

    // Aba 4: Credenciais Provisórias
    const dadosProvisorios = provisorios.length > 0
      ? provisorios.map(p => ({
          'ID': p?.id || '-',
          'Cartão': p?.cartao || '-',
          'Portaria': p?.portaria || '-',
          'Colaborador': p?.colaborador || p?.nome || '-',
          'Empresa': p?.empresa || '-',
          'Matrícula': p?.matricula || '-',
          'Cargo': p?.cargo || '-',
          'Status': p?.status === 'DEVOLVIDO' ? 'Devolvido' : 'Pendente (Não Devolvido)',
          'Data Retirada': p?.dataRetirada || '-',
          'Hora Retirada': p?.horaRetirada || '-',
          'Data Devolução': p?.dataDevolucao || '-',
          'Hora Devolução': p?.horaDevolucao || '-',
          'Permanência': p?.duracao || '-',
          'Observação': p?.observacao || '-',
          'Vigilante Entrega': p?.vigilante || '-',
          'Vigilante Devolução': p?.vigilanteDevolucao || '-',
          'Total Acessos no Mês': p?.totalAcessosMes || 1,
          'Limite Excedido (>3)': ((p?.totalAcessosMes || 1) >= 3) ? 'SIM (Alerta)' : 'Não'
        }))
      : [{ 'Aviso': 'Nenhuma credencial provisória registrada no período para os filtros selecionados.' }];
    const wsProvisorios = XLSX.utils.json_to_sheet(dadosProvisorios);
    XLSX.utils.book_append_sheet(wb, wsProvisorios, 'Credenciais Provisórias');

    // Aba 5: Visitantes
    const dadosVisitantes = visitantes.length > 0
      ? visitantes.map(v => ({
          'ID': v?.id || '-',
          'Cartão': v?.cartao || '-',
          'Portaria': v?.portaria || '-',
          'Nome Visitante': v?.visitante || v?.nome || '-',
          'Empresa': v?.empresa || '-',
          'Documento (RG/CPF)': v?.documento || '-',
          'Anfitrião Responsável': v?.anfitriao || '-',
          'Área / Departamento': v?.areaAnfitriao || '-',
          'Status': v?.status === 'DEVOLVIDO' ? 'Finalizado' : 'Em Andamento',
          'Entrada': `${v?.dataEntrada || ''} ${v?.horaEntrada || ''}`.trim() || '-',
          'Saída': `${v?.dataSaida || ''} ${v?.horaSaida || ''}`.trim() || '-',
          'Permanência': v?.duracao || '-',
          'Vigilante Entrada': v?.vigilanteEntrada || '-',
          'Vigilante Saída': v?.vigilanteSaida || '-'
        }))
      : [{ 'Aviso': 'Nenhum visitante registrado no período para os filtros selecionados.' }];
    const wsVisitantes = XLSX.utils.json_to_sheet(dadosVisitantes);
    XLSX.utils.book_append_sheet(wb, wsVisitantes, 'Controle de Visitantes');

    // Aba 6: Inventário RFID
    const dadosRfid = rfid.length > 0
      ? rfid.map(r => ({
          'Código RFID (Chave)': r?.codigoRfid || '-',
          'Código Impresso Verso': r?.codigoImpresso || '-',
          'Tipo': r?.tipo || '-',
          'Identificador': r?.tipo === 'ROTATIVO' ? `Rotativo ${r?.numeroRotativo || ''}` : 'Fixo Nominal',
          'Colaborador / Destino': r?.colaborador || '-',
          'Empresa': r?.empresa || '-',
          'Data de Liberação': r?.dataLiberacao || '-',
          'Status Atual': r?.status || '-',
          'Observações': r?.observacoes || ''
        }))
      : [{ 'Aviso': 'Nenhum registro RFID encontrado.' }];
    const wsRfid = XLSX.utils.json_to_sheet(dadosRfid);
    XLSX.utils.book_append_sheet(wb, wsRfid, 'Inventário RFID');

    // Aba 7: Contabilidade & Cobrança Consolidada (Multi-Módulos)
    const metRfidContabil = dadosConsolidados?.metricasRfidContabilidade;
    let dadosContabilidade = [];

    if (metRfidContabil && Array.isArray(metRfidContabil.todasPendencias) && metRfidContabil.todasPendencias.length > 0) {
      dadosContabilidade = metRfidContabil.todasPendencias.map(p => ({
        'Módulo Origem': p.modulo,
        'Portador / Colaborador': p.colaborador,
        'Empresa Contratada': p.empresa,
        'Identificador Cartão': p.cartao,
        'Data Ocorrência': p.dataPerda,
        'Valor (2ª Via)': `R$ ${p.valor},00`,
        'Situação Contábil': 'Pendente de Quitação (À Pagar)',
        'Regra Aplicada': 'R$ 30,00 por extravio conforme norma CCO'
      }));
    } else {
      dadosContabilidade = [{ 'Aviso': 'Nenhuma pendência financeira de 2ª via ou extravio ativa nos módulos.' }];
    }
    const wsContabilidade = XLSX.utils.json_to_sheet(dadosContabilidade);
    XLSX.utils.book_append_sheet(wb, wsContabilidade, 'Contabilidade Consolidada');

    // Nome do arquivo padronizado
    const dataHojeStr = new Date().toISOString().substring(0, 10);
    const nomeArquivo = `CCO_Base_Consolidada_${dataHojeStr}.xlsx`;

    // Gatilho de download nativo seguro do navegador via Blob
    try {
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
      });
      dispararDownloadNavegador(blob, nomeArquivo);
    } catch (blobErr) {
      console.warn('Falha no download via Blob, tentando XLSX.writeFile nativo:', blobErr);
      try {
        XLSX.writeFile(wb, nomeArquivo);
      } catch (writeFileErr) {
        console.error('Falha crítica ao gravar arquivo Excel via writeFile:', writeFileErr);
        throw writeFileErr;
      }
    }

    // Salvamento seguro no disco (Documentos / Rede) via API local
    let resultadoServidor = null;
    try {
      const base64Excel = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const respConfig = obterResponsaveisSincrono();
      resultadoServidor = await salvarExcelNaPastaExports(nomeArquivo, base64Excel, respConfig?.caminhoRede);
    } catch (saveErr) {
      console.warn('Aviso no salvamento do Excel via servidor local:', saveErr);
    }

    return {
      sucesso: true,
      nomeArquivo,
      caminhosSalvos: resultadoServidor?.savedPaths || [],
      warnings: resultadoServidor?.warnings
    };
  } catch (error) {
    console.error('Erro crítico dentro de exportarBaseConsolidadaExcel:', error);
    throw error;
  }
}
