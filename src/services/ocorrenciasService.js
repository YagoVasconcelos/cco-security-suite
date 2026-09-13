import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const STORAGE_KEY = 'cco_ocorrencias_registros';

/**
 * Converte um arquivo de imagem (File/Blob) em Data URL base64 com compressão opcional
 */
export function fileToDataUrl(file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target.result;
      if (typeof window === 'undefined' || !window.Image) {
        resolve(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxWidth && height <= maxHeight && file.size < 400 * 1024) {
          resolve(rawDataUrl);
          return;
        }

        // Redimensiona proporcionalmente para otimizar espaço no JSON e PDF
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mime, quality);
          resolve(compressedDataUrl);
        } catch (errCanvas) {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Obtém as dimensões naturais de uma imagem a partir de um Data URL
 */
export function getImageDimensions(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl) {
      resolve({ width: 800, height: 600 });
      return;
    }
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth || 800,
        height: img.naturalHeight || 600
      });
    };
    img.onerror = () => {
      resolve({ width: 800, height: 600 });
    };
    img.src = dataUrl;
  });
}

/**
 * Carrega a lista de ocorrências salvas localmente
 */
export async function carregarOcorrencias() {
  // Tenta buscar da API local primeiro (com arquivos em disco)
  try {
    const res = await fetch('/api/ocorrencias');
    if (res.ok) {
      const dados = await res.json();
      if (Array.isArray(dados)) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
        } catch (e) {
          // Ignora caso exceda quota de localStorage
        }
        return dados;
      }
    }
  } catch (err) {
    console.warn('API local não respondeu, utilizando localStorage:', err);
  }

  // Fallback para o localStorage
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo !== null) {
      const parsed = JSON.parse(salvo);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler do localStorage:', e);
  }

  return [];
}

/**
 * REGRA DE NEGÓCIO E GERAÇÃO: Gera o documento PDF profissional do Relatório de Ocorrência
 */
export async function gerarRelatorioPdf({ formData, envolvidos = [], fotos = [], responsaveis = {} }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm

  // Formatador de data brasileira
  const formatarDataBr = (dataIso) => {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataIso;
  };

  // Helper para desenhar o cabeçalho padrão
  const desenharCabecalho = (numeroPagina) => {
    // Barra superior decorativa azul
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setFillColor(37, 99, 235); // blue-600
    doc.rect(0, 23, pageWidth, 1.5, 'F');

    // Título no cabeçalho
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CCO SECURITY SUITE CENTRAL DE CONTROLE OPERACIONAL', margin, 10);

    const nomeOperadorAtivo = responsaveis?.operador || localStorage.getItem('cco_operador_ativo') || 'Operador CCO';
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(191, 219, 254); // blue-200
    doc.text(`SEGURANÇA PATRIMONIAL & CONTROLE DE ACESSO — OPERADOR: ${nomeOperadorAtivo.toUpperCase()}`, margin, 16);

    // Box do protocolo no canto direito
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(pageWidth - margin - 46, 5, 46, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(formData.numeroRO || 'RO-2026', pageWidth - margin - 23, 11, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setTextColor(147, 197, 253);
    doc.text(`GRAVIDADE: ${String(formData.gravidade || 'MÉDIA').toUpperCase()}`, pageWidth - margin - 23, 16, { align: 'center' });
  };

  // 1. Renderiza Cabeçalho da Primeira Página
  desenharCabecalho(1);
  let currentY = 32;

  // Título do Documento
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RELATÓRIO DE OCORRÊNCIA (RO)', margin, currentY);
  currentY += 6;

  // Subtítulo descritivo
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Documento emitido para apuração, registro de fatos e controle da segurança patrimonial`, margin, currentY);
  currentY += 6;

  // Box: Responsáveis do Site / Assinaturas (Conforme modelo padrão)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  const colWidth = contentWidth / 3;
  // Coluna 1: Gerente de Site
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('GERENTE DE SITE:', margin + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(responsaveis.gerenteSite || 'Gerência de Operações', margin + 3, currentY + 11);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Aprovação Executiva', margin + 3, currentY + 17);

  // Coluna 2: Coordenação de Segurança
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COORDENAÇÃO DE SEGURANÇA:', margin + colWidth + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  const coordLinhas = doc.splitTextToSize(responsaveis.coordenacao || 'Coordenação de Segurança Corporativa', colWidth - 6);
  doc.text(coordLinhas, margin + colWidth + 3, currentY + 11);

  // Coluna 3: Fiscal de Contrato
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('FISCAL DE CONTRATO:', margin + (colWidth * 2) + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.text(responsaveis.fiscalContrato || 'Fiscalização de Contrato', margin + (colWidth * 2) + 3, currentY + 11);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Fiscalização e Auditoria', margin + (colWidth * 2) + 3, currentY + 17);

  currentY += 28;

  // Box: 1. Dados Gerais da Ocorrência
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. DADOS GERAIS DO FATO', margin + 3, currentY + 4.5);
  currentY += 6.5;

  // Tabela interna com Dados Gerais
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 14, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATA DO FATO:', margin + 3, currentY + 5);
  doc.text('HORÁRIO:', margin + 35, currentY + 5);
  doc.text('PRÉDIO / ÁREA (LOCAL):', margin + 60, currentY + 5);
  doc.text('TÓPICO & GRAVIDADE:', margin + 130, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.text(formatarDataBr(formData.data), margin + 3, currentY + 10);
  doc.text(formData.hora || '--:--', margin + 35, currentY + 10);

  const localFormatado = formData.predio && formData.area
    ? `${formData.predio} - ${formData.area}`
    : (formData.local || 'Planta Operacional');
  const localLinhas = doc.splitTextToSize(localFormatado, 66);
  doc.text(localLinhas, margin + 60, currentY + 10);

  const topicoGravidade = `${formData.topico || 'Natureza Padrão'} (${formData.gravidade || 'Média'})`;
  const topicoLinhas = doc.splitTextToSize(topicoGravidade, 50);
  doc.text(topicoLinhas, margin + 130, currentY + 10);
  currentY += 17;

  // Título e Descrição Detalhada (Espaçamento robusto contra sobreposição)
  const tituloTexto = `TÍTULO: ${formData.titulo || 'Ocorrência Operacional sem título'}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  const tituloLinhas = doc.splitTextToSize(tituloTexto, contentWidth - 6);
  const tituloBoxHeight = Math.max(8.5, (tituloLinhas.length * 4.5) + 3.5);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, tituloBoxHeight, 'FD');
  doc.setTextColor(15, 23, 42);
  doc.text(tituloLinhas, margin + 3, currentY + 5.5);

  // Espaçamento vertical explícito de segurança: caixa do título + 6mm livres
  currentY += tituloBoxHeight + 6;

  // Texto da Descrição Detalhada / Relato Cronológico
  if (currentY > pageHeight - 35) {
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());
    currentY = 32;
  }

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. RELATO CRONOLÓGICO DOS FATOS', margin + 3, currentY + 4.5);
  currentY += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const linhasDescricao = doc.splitTextToSize(
    formData.descricao || 'Sem descrição detalhada registrada.',
    contentWidth
  );

  const lineHeightMm = 4.2;
  for (let i = 0; i < linhasDescricao.length; i++) {
    // Se a próxima linha ultrapassar a margem de segurança da página
    if (currentY + lineHeightMm > pageHeight - 25) {
      doc.addPage();
      desenharCabecalho(doc.internal.getNumberOfPages());
      currentY = 32;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
    }
    doc.text(linhasDescricao[i], margin, currentY);
    currentY += lineHeightMm;
  }
  currentY += 6;

  // 3. Tabela de Envolvidos / Identificação de Pessoas
  // Se não houver espaço suficiente para o cabeçalho e pelo menos 2 linhas da tabela
  if (currentY > pageHeight - 45) {
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());
    currentY = 32;
  }

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS', margin + 3, currentY + 4.5);
  currentY += 7.5;

  // Monta linhas da tabela de envolvidos
  const bodyEnvolvidos = envolvidos.map((e, idx) => [
    String(idx + 1),
    e.nome || (e.naoIdentificado ? '(Não identificado)' : 'NÃO INFORMADO'),
    e.funcao || (e.naoIdentificado ? '(Não identificado)' : '-'),
    e.empresa || (e.naoIdentificado ? '(Não identificado)' : '-'),
    e.matricula || (e.naoIdentificado ? 'N/A' : '-')
  ]);

  const autoTableFn = autoTable.default?.default || autoTable.default || autoTable;

  autoTableFn(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['#', 'Nome Completo', 'Função / Cargo', 'Empresa', 'Matrícula']],
    body: bodyEnvolvidos.length > 0 ? bodyEnvolvidos : [['-', 'Nenhum envolvido registrado', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 42 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : currentY + 30;

  // 4. Registro Fotográfico / Imagens da Ocorrência
  // Verifica se há espaço para a seção de fotos na página atual
  if (currentY > pageHeight - 50) {
    doc.addPage();
    desenharCabecalho(doc.internal.getNumberOfPages());
    currentY = 32;
  }

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS (${fotos.length} ${fotos.length === 1 ? 'REGISTRO' : 'REGISTROS'})`,
    margin + 3,
    currentY + 4.5
  );
  currentY += 9;

  if (fotos.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhuma imagem fotográfica foi anexada a este relatório.', margin, currentY + 3);
    currentY += 12;
  } else {
    // Processa e insere cada imagem com ajuste proporcional
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      let dataUrl = foto.url;

      // Se for File/Blob, converte para DataURL para inserção segura no jsPDF
      if (foto.file) {
        try {
          dataUrl = await fileToDataUrl(foto.file);
        } catch (e) {
          console.warn('Erro ao converter arquivo para dataUrl:', e);
        }
      }

      if (dataUrl) {
        const { width: imgW, height: imgH } = await getImageDimensions(dataUrl);

        // Calcula tamanho máximo preservando aspecto (largura máxima 85mm para caber até 2 por linha se couber, ou 160mm)
        const maxW = 140; // mm
        const maxH = 85; // mm
        const proporcao = imgW / imgH;

        let renderW = maxW;
        let renderH = renderW / proporcao;

        if (renderH > maxH) {
          renderH = maxH;
          renderW = renderH * proporcao;
        }

        const blocoAltura = renderH + 12; // Imagem + caixa de legenda

        // Verifica quebra de página
        if (currentY + blocoAltura > pageHeight - 25) {
          doc.addPage();
          desenharCabecalho(doc.internal.getNumberOfPages());
          currentY = 32;
        }

        const posX = margin + ((contentWidth - renderW) / 2); // Centraliza a imagem

        try {
          // Moldura ao redor da foto
          doc.setFillColor(241, 245, 249);
          doc.setDrawColor(203, 213, 225);
          doc.roundedRect(posX - 1.5, currentY - 1.5, renderW + 3, renderH + 11, 1.5, 1.5, 'FD');

          // Insere a imagem detectando formato PNG/JPEG
          const formato = dataUrl.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(dataUrl, formato, posX, currentY, renderW, renderH);

          // Legenda abaixo da foto (Padrão limpo: "Anexo X - Registro fotográfico da ocorrência")
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);

          let descricaoFoto = (foto.legenda || 'Registro fotográfico da ocorrência').trim();
          // Remove múltiplos prefixos redundantes existentes (ex: "Figura 1: Foto 1:", "Foto 1:", "Anexo 1 -")
          while (/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i.test(descricaoFoto)) {
            descricaoFoto = descricaoFoto.replace(/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i, '').trim();
          }
          const textoLegenda = `Anexo ${i + 1} - ${descricaoFoto || 'Registro fotográfico da ocorrência'}`;
          doc.text(textoLegenda, posX, currentY + renderH + 5, { maxWidth: renderW });

          currentY += blocoAltura + 6;
        } catch (imgErr) {
          console.error('Erro ao adicionar imagem ao PDF:', imgErr);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(239, 68, 68);
          doc.text(`[Erro ao carregar Imagem ${i + 1}: ${foto.nomeArquivo || ''}]`, margin, currentY);
          currentY += 8;
        }
      }
    }
  }

  // 4. Rodapé e Carimbo de Autenticidade em todas as páginas
  const totalPaginas = doc.internal.getNumberOfPages();
  const agoraStr = new Date().toLocaleString('pt-BR');

  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);

    // Linha inferior de separação
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    // Esquerda: Hash, operador ativo e protocolo CCO
    const nomeOperadorAtivo = responsaveis?.operador || localStorage.getItem('cco_operador_ativo') || 'Operador CCO';
    doc.text(
      `CCO Security Suite • Protocolo: ${formData.numeroRO} • Operador de Turno: ${nomeOperadorAtivo} • Emitido em: ${agoraStr}`,
      margin,
      pageHeight - 8
    );

    // Direita: Paginação oficial
    doc.text(
      `Página ${p} de ${totalPaginas}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Gera o nome padronizado do arquivo
  const tituloLimpo = (formData.titulo || 'Ocorrencia')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 35);
  const nomeArquivo = `${formData.numeroRO}_${tituloLimpo}.pdf`;

  // Gera base64 e Blob
  const base64Pdf = doc.output('datauristring');
  const blobPdf = doc.output('blob');

  return {
    doc,
    blobPdf,
    base64Pdf,
    nomeArquivo
  };
}

/**
 * SALVA COMPLETO: Salva os dados no banco de dados local (JSON/Excel) E grava o PDF em CCO/exports
 */
export async function salvarRelatorioOcorrenciaCompleto({ formData, envolvidos, fotos, responsaveis }) {
  // 1. Processa e garante Base64 para todas as fotos anexadas
  const fotosProcessadas = await Promise.all(
    (fotos || []).map(async (f) => {
      let base64 = f.base64 || f.dataUrl || '';
      if (!base64 && f.url && f.url.startsWith('data:')) {
        base64 = f.url;
      }
      if (!base64 && f.file) {
        try {
          base64 = await fileToDataUrl(f.file);
        } catch (err) {
          console.error('Erro ao converter foto para base64:', err);
        }
      }
      return {
        id: f.id || `${Date.now()}-${Math.random()}`,
        nomeArquivo: f.nomeArquivo || 'foto.jpg',
        tamanho: f.tamanho || '',
        legenda: f.legenda || 'Registro fotográfico da ocorrência',
        base64: base64,
        url: base64 || f.url || ''
      };
    })
  );

  // 2. Gera o PDF formatado com imagens (usando as fotos com base64 garantido)
  const { doc, blobPdf, base64Pdf, nomeArquivo } = await gerarRelatorioPdf({
    formData,
    envolvidos,
    fotos: fotosProcessadas,
    responsaveis
  });

  // 3. Monta o objeto de dados estruturado incluindo o Base64 das fotos para o histórico
  const registroOcorrencia = {
    id: formData.id || Date.now(),
    numeroRO: formData.numeroRO,
    data: formData.data,
    hora: formData.hora,
    local: formData.local,
    gravidade: formData.gravidade,
    titulo: formData.titulo,
    descricao: formData.descricao,
    envolvidos: (envolvidos || []).map(e => ({
      id: e.id,
      nome: e.nome,
      funcao: e.funcao,
      empresa: e.empresa,
      matricula: e.matricula,
      naoIdentificado: !!e.naoIdentificado
    })),
    // FOTOS COM BASE64 PERSISTIDO NO BANCO LOCAL (JSON):
    fotos: fotosProcessadas.map(f => ({
      id: f.id,
      nomeArquivo: f.nomeArquivo,
      tamanho: f.tamanho,
      legenda: f.legenda,
      base64: f.base64
    })),
    responsaveis: {
      gerenteSite: responsaveis.gerenteSite || 'Gerência de Operações',
      coordenacao: responsaveis.coordenacao || 'Coordenação de Segurança Corporativa',
      fiscalContrato: responsaveis.fiscalContrato || 'Fiscalização de Contrato',
      caminhoRede: responsaveis.caminhoRede || 'MAPA DE CALOR/2026/09.SETEMBRO'
    },
    nomeArquivoPdf: nomeArquivo,
    dataCadastro: formData.dataCadastro || new Date().toISOString()
  };

  const resultados = {
    sucesso: true,
    numeroRO: formData.numeroRO,
    nomeArquivo,
    caminhosSalvos: [],
    erros: [],
    avisos: []
  };

  // 4. Salva os dados em JSON e Excel na pasta segura via endpoint /api/salvar-ocorrencia
  try {
    const resOcorrencia = await fetch('/api/salvar-ocorrencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registroOcorrencia)
    });

    if (resOcorrencia.ok) {
      const dataRes = await resOcorrencia.json();
      if (dataRes.savedPaths) {
        resultados.caminhosSalvos.push(...dataRes.savedPaths);
      }
    } else {
      const errRes = await resOcorrencia.json().catch(() => ({}));
      resultados.erros.push(errRes.error || 'Falha no salvamento do banco de dados local via API.');
    }
  } catch (apiErr) {
    console.warn('API local offline para salvar ocorrência, gravando em cache local:', apiErr);
  }

  // 5. Salva o PDF fisicamente na pasta segura do Windows (Documentos) e na rede via /api/salvar-pdf
  try {
    const resPdf = await fetch('/api/salvar-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: nomeArquivo,
        base64Pdf,
        caminhoRede: responsaveis.caminhoRede || 'MAPA DE CALOR/2026/09.SETEMBRO'
      })
    });

    if (resPdf.ok) {
      const dataPdf = await resPdf.json();
      if (dataPdf.savedPaths) {
        resultados.caminhosSalvos.push(...dataPdf.savedPaths);
      }
      if (dataPdf.warnings && Array.isArray(dataPdf.warnings)) {
        resultados.avisos.push(...dataPdf.warnings);
      }
    } else {
      const errData = await resPdf.json().catch(() => ({}));
      resultados.erros.push(errData.error || 'Falha de permissão ao salvar PDF em disco.');
      if (errData.warnings && Array.isArray(errData.warnings)) {
        resultados.avisos.push(...errData.warnings);
      }
    }
  } catch (pdfErr) {
    console.warn('API local offline para salvar PDF:', pdfErr);
    resultados.avisos.push('Servidor local offline: o PDF foi disponibilizado diretamente para download pelo navegador.');
  }

  // 6. Salva no localStorage como garantia de redundância offline
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    let lista = salvo ? JSON.parse(salvo) : [];
    if (!Array.isArray(lista)) lista = [];
    lista = lista.filter(o => o.numeroRO !== registroOcorrencia.numeroRO);
    lista.unshift(registroOcorrencia);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  } catch (localErr) {
    console.warn('Aviso: localStorage com quota cheia para base64 completo, salvando versão compacta:', localErr);
    try {
      const registroLeve = {
        ...registroOcorrencia,
        fotos: registroOcorrencia.fotos.map(({ base64, ...rest }) => rest)
      };
      const salvo = localStorage.getItem(STORAGE_KEY);
      let lista = salvo ? JSON.parse(salvo) : [];
      lista = lista.filter(o => o.numeroRO !== registroOcorrencia.numeroRO);
      lista.unshift(registroLeve);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
    } catch (e) {
      // Ignora erro de localStorage pois os arquivos em disco foram gravados com sucesso
    }
  }

  // 7. Dispara download manual via navegador EXCLUSIVAMENTE se a gravação direta em disco não ocorreu (fallback offline)
  if (!resultados.caminhosSalvos || resultados.caminhosSalvos.length === 0) {
    try {
      doc.save(nomeArquivo);
    } catch (downloadErr) {
      console.error('Erro ao disparar download no navegador:', downloadErr);
    }
  }

  return resultados;
}
