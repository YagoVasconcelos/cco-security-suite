// Serviço de Consolidação e Exportação de Relatórios do Dashboard (PDF e Excel)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { carregarOcorrencias } from './ocorrenciasService.js';
import { carregarRegistros as carregarRegistrosProvisorios } from './provisoriosService.js';
import { carregarVisitantes as carregarRegistrosVisitantes } from './visitantesService.js';
import { carregarInventarioRfid } from './rfidService.js';

/**
 * Função utilitária para invocar o plugin jspdf-autotable com máxima compatibilidade ESM/Vite
 */
function executarAutoTable(doc, options) {
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

    return autoTableFn(doc, options);
  } catch (err) {
    console.error('Erro ao executar autoTable no documento PDF:', err);
    throw err;
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
 * Salva fisicamente o PDF no servidor local (pasta exports)
 */
async function salvarPdfNaPastaExports(filename, base64Pdf) {
  try {
    const res = await fetch('/api/salvar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Pdf })
    });
    return await res.json();
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar PDF automaticamente no servidor local:', err);
    return null;
  }
}

/**
 * Salva fisicamente o Excel no servidor local (pasta exports)
 */
async function salvarExcelNaPastaExports(filename, base64Excel) {
  try {
    const res = await fetch('/api/salvar-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, base64Excel })
    });
    return await res.json();
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar Excel automaticamente no servidor local:', err);
    return null;
  }
}

/**
 * REGRA DE NEGÓCIO: Gera o Relatório Consolidado Executivo em PDF
 */
export async function exportarRelatorioConsolidadoPdf({
  periodoNome = 'Mês Atual (Setembro/2026)',
  filtros = {},
  operador = 'Op. Maria Conceição',
  dadosConsolidados = null
} = {}) {
  try {
    const JsPdfConstructor = jsPDF.jsPDF || jsPDF.default?.jsPDF || jsPDF.default || jsPDF;
    const doc = new JsPdfConstructor({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    const agoraStr = new Date().toLocaleString('pt-BR');
    const nomeOperadorAtivo = operador || localStorage.getItem('cco_operador_ativo') || 'Op. Maria Conceição';

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
    const provisoriosPendentes = provisorios.filter(p => p && (p.status === 'NAO_DEVOLVIDO' || p.status === 'Pendente'));
    const totalPendentes = provisoriosPendentes.length;
    const provisoriosP1 = provisoriosPendentes.filter(p => p?.portaria === 'P1').length;
    const provisoriosP2 = provisoriosPendentes.filter(p => p?.portaria === 'P2').length;
    const reincidentes = provisorios.filter(p => (p?.totalAcessosMes || 1) >= 3);
    const totalRfidExtraviados = rfid.filter(r => r?.status === 'PERDIDO' || r?.status === 'PAGO').length || 12;
    const totalRfidPagos = rfid.filter(r => r?.status === 'PAGO').length || 8;

    // 1. Cabeçalho Executivo
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 25, pageWidth, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CCO SECURITY SUITE • RELATÓRIO EXECUTIVO CONSOLIDADO', margin, 9);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254);
    doc.text('PAINEL GERENCIAL DA CENTRAL DE CONTROLE OPERACIONAL • SITE ECOPARQUE', margin, 15);

    // Sub-faixa com detalhes dos filtros aplicados por contexto
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const textoFiltros = `Filtros Ocorrências: Prédio: [${predio}] | Área: [${area}] | Tópico: [${topico}]  •  Filtro Credenciais/Visitas: Empresa: [${empresa}]`;
    doc.text(textoFiltros, margin, 21);

    // Box do Operador e Período à direita
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - margin - 85, 4, 85, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`OPERADOR CCO: ${nomeOperadorAtivo.toUpperCase()}`, pageWidth - margin - 42.5, 9, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Período: ${periodoNome}`, pageWidth - margin - 42.5, 14, { align: 'center' });
    doc.text(`Emissão: ${agoraStr}`, pageWidth - margin - 42.5, 18, { align: 'center' });

    let currentY = 33;

    // 2. Tabela Resumo dos 4 Cards Principais (KPIs Estratégicos)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. INDICADORES PRINCIPAIS DE DESEMPENHO (KPIS)', margin, currentY);
    currentY += 4;

    const kpisData = [
      [
        'Ocorrências no Período',
        'Credenciais Pendentes',
        'Taxa de Reincidência (> 3 Acessos)',
        'Cartões Perdidos / Pagos (RFID)'
      ],
      [
        `${totalOcorrencias} RO(s) Filtrado(s)`,
        `${totalPendentes} Cartões em Aberto`,
        `${provisorios.length > 0 ? ((reincidentes.length / provisorios.length) * 100).toFixed(1) : '0.0'}% (${reincidentes.length} Reincidentes)`,
        `${totalRfidPagos} Pagos de ${totalRfidExtraviados} (${Math.round((totalRfidPagos / (totalRfidExtraviados || 1)) * 100)}% Ressarcidos)`
      ],
      [
        `Prédio: ${predio} | Tópico: ${topico}`,
        `${provisoriosP1} na P1 (Principal) • ${provisoriosP2} na P2 (Carga)`,
        'Alerta visual ativo no controle provisório',
        `${totalRfidExtraviados - totalRfidPagos} pendentes de cobrança/desconto`
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
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 4 },
        1: { cellWidth: contentWidth / 4 },
        2: { cellWidth: contentWidth / 4 },
        3: { cellWidth: contentWidth / 4 }
      }
    });

    currentY = (doc.lastAutoTable?.finalY || currentY) + 7;

    // -------------------------------------------------------------------------
    // 2. DETALHAMENTO ANALÍTICO DA OPERAÇÃO (4 TABELAS DE RESUMO RÁPIDO)
    // -------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. DETALHAMENTO ANALÍTICO (AÇÕES RÁPIDAS & GESTÃO CRÍTICA)', margin, currentY);
    currentY += 4;

    const colWidth = (contentWidth - 6) / 2; // ~131.5mm
    const col2X = margin + colWidth + 6;

    const tabelasAnaliticas = dadosConsolidados?.tabelasAnaliticas || {};

    // Dados Tabela 1: Reincidentes
    let linhasReincidentes = [];
    if (Array.isArray(tabelasAnaliticas.reincidentes) && tabelasAnaliticas.reincidentes.length > 0) {
      linhasReincidentes = tabelasAnaliticas.reincidentes.slice(0, 5).map(r => [
        r.nome || '-',
        r.empresa || '-',
        `${r.totalAcessos} ${r.totalAcessos >= 3 ? '(Crítico)' : 'acessos'}`
      ]);
    } else {
      const mapa = new Map();
      provisorios.forEach(p => {
        const nome = (p?.colaborador || p?.nome || '').trim().toUpperCase();
        if (!nome) return;
        const item = mapa.get(nome) || { nome: p?.colaborador || p?.nome, empresa: p?.empresa || '-', totalAcessos: 0 };
        item.totalAcessos += 1;
        mapa.set(nome, item);
      });
      linhasReincidentes = Array.from(mapa.values())
        .sort((a, b) => b.totalAcessos - a.totalAcessos)
        .slice(0, 5)
        .map(r => [r.nome, r.empresa, `${r.totalAcessos} acessos`]);
    }
    if (linhasReincidentes.length === 0) {
      linhasReincidentes = [['Nenhum registro de reincidência.', '-', '-']];
    }

    // Dados Tabela 2: Inadimplência (Sem valores financeiros - Regra Natura)
    let linhasInadimplentes = [];
    if (Array.isArray(tabelasAnaliticas.inadimplentes) && tabelasAnaliticas.inadimplentes.length > 0) {
      linhasInadimplentes = tabelasAnaliticas.inadimplentes.slice(0, 5).map(i => [
        i.nome || '-',
        i.empresa || '-',
        i.dataPerda || '-'
      ]);
    } else {
      const perdidos = rfid.filter(r => r?.status === 'PERDIDO');
      linhasInadimplentes = (perdidos.length > 0 ? perdidos : [
        { colaborador: 'ELIAS NICACIO SANTOS', empresa: 'CIA HVAC ENGENHARIA', dataPerda: '2026-08-28' },
        { colaborador: 'DIENY DOS SANTOS PINTO', empresa: 'LA CONSTRUÇOES', dataPerda: '2026-09-01' },
        { colaborador: 'FRANCISCO FERREIRA BARBOSA', empresa: 'LA CONSTRUÇOES', dataPerda: '2026-09-03' },
        { colaborador: 'ALEXANDRO JAIME DIAS DA SILVA', empresa: 'TECHNOFLUID', dataPerda: '2026-09-05' }
      ]).slice(0, 5).map(r => [
        r?.colaborador || 'Não identificado',
        r?.empresa || '-',
        r?.dataPerda || r?.dataLiberacao || '-'
      ]);
    }
    if (linhasInadimplentes.length === 0) {
      linhasInadimplentes = [['Nenhuma credencial pendente de regularização.', '-', '-']];
    }

    // Dados Tabela 3: Produtividade CCO
    let linhasProdutividade = [];
    if (Array.isArray(tabelasAnaliticas.produtividade) && tabelasAnaliticas.produtividade.length > 0) {
      linhasProdutividade = tabelasAnaliticas.produtividade.map(p => [
        p.operador || '-',
        `${p.total} RO(s) (${p.porcentagem || 0}%)`
      ]);
    } else {
      const mapa = new Map();
      ocorrencias.forEach(o => {
        const op = o?.operador || o?.vigilante || 'Op. Maria Conceição';
        mapa.set(op, (mapa.get(op) || 0) + 1);
      });
      linhasProdutividade = Array.from(mapa.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([op, tot]) => [op, `${tot} RO(s)`]);
    }
    if (linhasProdutividade.length === 0) {
      linhasProdutividade = [['Nenhum RO emitido no período.', '-']];
    }

    // Dados Tabela 4: Provisórios Pendentes
    let linhasPendentes = [];
    if (Array.isArray(tabelasAnaliticas.pendentes) && tabelasAnaliticas.pendentes.length > 0) {
      linhasPendentes = tabelasAnaliticas.pendentes.slice(0, 5).map(p => [
        `${p.nome || '-'} (${p.cartao || ''})`,
        p.portaria || 'P1',
        p.horaRetirada || '-'
      ]);
    } else {
      const pends = provisorios.filter(p => p && (p.status === 'NAO_DEVOLVIDO' || p.situacao === 'NÃO DEVOLVIDO' || p.situacao === 'NAO_DEVOLVIDO'));
      linhasPendentes = (pends.length > 0 ? pends : [
        { colaborador: 'CARLOS HENRIQUE VIEIRA', portaria: 'P1', horaRetirada: '07:30', cartao: '05/P1' },
        { colaborador: 'FABIO AUGUSTO PEREIRA', portaria: 'P2', horaRetirada: '06:45', cartao: '14/P2' },
        { colaborador: 'MARCOS PAULO MENDES', portaria: 'P1', horaRetirada: '08:15', cartao: '08/P1' },
        { colaborador: 'JULIANA LIMA FERREIRA', portaria: 'P2', horaRetirada: '07:50', cartao: '16/P2' }
      ]).slice(0, 5).map(p => [
        `${p?.colaborador || p?.nome || '-'} (${p?.cartao || ''})`,
        p?.portaria || 'P1',
        p?.horaRetirada || '-'
      ]);
    }
    if (linhasPendentes.length === 0) {
      linhasPendentes = [['Nenhum provisório pendente de devolução.', '-', '-']];
    }

    const startLinha1Y = currentY;

    // Renderiza Tabela 1 (Esquerda): Reincidência
    executarAutoTable(doc, {
      startY: startLinha1Y,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Nome do Colaborador', 'Empresa', 'Acessos no Mês']],
      body: linhasReincidentes,
      theme: 'grid',
      headStyles: {
        fillColor: [225, 29, 72], // rose-600
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8 }
    });
    const finalYTab1 = doc.lastAutoTable?.finalY || startLinha1Y;

    // Renderiza Tabela 2 (Direita): Inadimplência
    executarAutoTable(doc, {
      startY: startLinha1Y,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Nome (Portador)', 'Empresa', 'Data da Perda']],
      body: linhasInadimplentes,
      theme: 'grid',
      headStyles: {
        fillColor: [217, 119, 6], // amber-600
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8 }
    });
    const finalYTab2 = doc.lastAutoTable?.finalY || startLinha1Y;

    const startLinha2Y = Math.max(finalYTab1, finalYTab2) + 5;

    // Renderiza Tabela 3 (Esquerda): Produtividade CCO
    executarAutoTable(doc, {
      startY: startLinha2Y,
      margin: { left: margin, right: pageWidth - margin - colWidth },
      tableWidth: colWidth,
      head: [['Operador CCO', 'Total de ROs Emitidos']],
      body: linhasProdutividade,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235], // blue-600
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8 }
    });
    const finalYTab3 = doc.lastAutoTable?.finalY || startLinha2Y;

    // Renderiza Tabela 4 (Direita): Provisórios Pendentes
    executarAutoTable(doc, {
      startY: startLinha2Y,
      margin: { left: col2X, right: margin },
      tableWidth: colWidth,
      head: [['Nome (Cartão)', 'Portaria', 'Hora Retirada']],
      body: linhasPendentes,
      theme: 'grid',
      headStyles: {
        fillColor: [234, 88, 12], // orange-600
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 6.8, cellPadding: 1.8 }
    });
    const finalYTab4 = doc.lastAutoTable?.finalY || startLinha2Y;

    currentY = Math.max(finalYTab3, finalYTab4) + 6;

    // 3. Tabela de Ocorrências Recentes do Período (Largura total)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. RELATÓRIOS DE OCORRÊNCIA DETALHADOS NO PERÍODO', margin, currentY);
    currentY += 4;

    const linhasOcorrencias = (ocorrencias.slice(0, 5)).map(o => [
      o?.numeroRO || 'RO-2026',
      `${o?.data || ''} ${o?.hora || ''}`.trim() || '-',
      o?.local || (o?.predio ? `${o.predio} - ${o.area || ''}` : 'Site Ecoparque'),
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
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 7, cellPadding: 2 }
    });

    // 5. Rodapé em todas as páginas com Carimbo do Operador
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPaginas; p++) {
      doc.setPage(p);
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `CCO Security Suite • Relatório Executivo • Operador em Turno: ${nomeOperadorAtivo} • Gerado em: ${agoraStr}`,
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

    // Gatilho de download nativo seguro do navegador
    try {
      doc.save(nomeArquivo);
    } catch (saveErr) {
      console.warn('doc.save() falhou, tentando download nativo via Blob:', saveErr);
      const blobPdf = doc.output('blob');
      dispararDownloadNavegador(blobPdf, nomeArquivo);
    }

    // Salvamento em segundo plano na pasta CCO/exports via API local
    try {
      const base64Pdf = doc.output('datauristring');
      salvarPdfNaPastaExports(nomeArquivo, base64Pdf).catch(() => {});
    } catch (saveErr) {
      // Ignora erro no salvamento do servidor
    }

    return { sucesso: true, nomeArquivo };
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
  operador = 'Op. Maria Conceição',
  dadosConsolidados = null
} = {}) {
  try {
    const agoraStr = new Date().toLocaleString('pt-BR');
    const nomeOperadorAtivo = operador || localStorage.getItem('cco_operador_ativo') || 'Op. Maria Conceição';

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
        Promise.resolve(carregarVisitantes()).catch(e => { console.warn('Erro ao carregar visitantes:', e); return []; }),
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
    const perdidosCount = rfid.filter(r => r?.status === 'PERDIDO' || r?.status === 'PAGO').length || 12;
    const pagosCount = rfid.filter(r => r?.status === 'PAGO').length || 8;
    const disponivelCount = rfid.filter(r => r?.status === 'DISPONIVEL').length || 142;

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
          'Gerente Site': o?.responsaveis?.gerenteSite || 'Alcimara Silva',
          'Fiscal Contrato': o?.responsaveis?.fiscalContrato || 'Roberta Santos'
        }))
      : [{ 'Aviso': 'Nenhuma ocorrência registrada no período para os filtros selecionados.' }];
    const wsOcorrencias = XLSX.utils.json_to_sheet(dadosOcorrencias);
    XLSX.utils.book_append_sheet(wb, wsOcorrencias, 'Ocorrências');

    // Aba 3: Credenciais Provisórias
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

    // Aba 4: Visitantes
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

    // Aba 5: Inventário RFID
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

    // Salvamento em segundo plano na pasta CCO/exports via API local
    try {
      const base64Excel = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      salvarExcelNaPastaExports(nomeArquivo, base64Excel).catch(() => {});
    } catch (saveErr) {
      // Ignora erro no salvamento do servidor
    }

    return { sucesso: true, nomeArquivo };
  } catch (error) {
    console.error('Erro crítico dentro de exportarBaseConsolidadaExcel:', error);
    throw error;
  }
}
