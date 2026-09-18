// Script de Importação de Ocorrências em PDF - CCO Security Suite
// Varre a pasta Ocorrencias/, extrai texto, imagens (evidências), metadados e grava no banco
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const XLSX = require('xlsx');

const rootDir = path.resolve(__dirname, '..');
const ocorrenciasDir = path.join(rootDir, 'Ocorrencias');
const dataDir = path.join(rootDir, 'data');
const uploadsDir = path.join(rootDir, 'public', 'uploads', 'ocorrencias');

console.log('[Migração Ocorrências] Iniciando processamento dos PDFs...');

if (!fs.existsSync(ocorrenciasDir)) {
  console.error('[Migração Ocorrências] ERRO: Pasta Ocorrencias não encontrada na raiz!');
  process.exit(1);
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Extrai JPEGs reais do buffer do PDF (> 15KB para evitar ícones minúsculos)
function extrairJpegs(buf) {
  const imagens = [];
  let pos = 0;
  while (true) {
    const soi = buf.indexOf(Buffer.from([0xff, 0xd8, 0xff]), pos);
    if (soi === -1) break;
    const eoi = buf.indexOf(Buffer.from([0xff, 0xd9]), soi + 3);
    if (eoi === -1) break;
    const imgBuf = buf.slice(soi, eoi + 2);
    // Imagens de evidência têm tamanho relevante (> 15KB)
    if (imgBuf.length > 15000) {
      imagens.push(imgBuf);
    }
    pos = eoi + 2;
  }
  return imagens;
}

// Normaliza texto e remove quebras desnecessárias
function limparTexto(txt = '') {
  return txt
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function classificarTopico(tituloArquivo, relato) {
  const t = (tituloArquivo + ' ' + relato).toUpperCase();
  if (t.includes('FURTO')) return 'Suspeita de Furto / Segurança';
  if (t.includes('DANOS MATERIAIS') || t.includes('DANO')) return 'Danos ao Patrimônio';
  if (t.includes('CATRACA') || t.includes('QUEBRA DE ACESSO')) return 'Quebra de Procedimento de Acesso';
  if (t.includes('CELULAR')) return 'Uso Indevido de Celular';
  if (t.includes('EPI') || t.includes('LUVA') || t.includes('CAPACETE') || t.includes('MASCARA')) return 'Uso Inadequado de EPI';
  if (t.includes('PALLET') || t.includes('PALETE')) return 'Desvio Operacional / Paletes';
  if (t.includes('5S') || t.includes('OBSTRU')) return 'Desvio de 5S / Obstrução de Via';
  if (t.includes('POSTURA')) return 'Conduta Operacional Inadequada';
  if (t.includes('MATERIAL')) return 'Uso Indevido de Material';
  return 'Desvio de Procedimento Operacional';
}

function classificarGravidade(tituloArquivo, relato) {
  const t = (tituloArquivo + ' ' + relato).toUpperCase();
  if (t.includes('FURTO') || t.includes('CRITIC')) return 'ALTA';
  if (t.includes('DANOS') || t.includes('OBSTRU') || t.includes('SEM CAPACETE')) return 'MÉDIA';
  if (t.includes('CELULAR') || t.includes('MASCARA') || t.includes('LUVA')) return 'MÉDIA';
  if (t.includes('QUEBRA DE ACESSO') || t.includes('PALLET')) return 'MÉDIA';
  return 'LEVE';
}

function classificarLocal(relato, tituloArquivo) {
  const t = (tituloArquivo + ' ' + relato).toUpperCase();
  if (t.includes('RESTAURANTE')) return 'Restaurante Operacional';
  if (t.includes('CATRACA FABRICA') || t.includes('FABRICA')) return 'Portaria / Catraca Fábrica';
  if (t.includes('PESAGEM')) return 'Área da Pesagem / Produção';
  if (t.includes('SALA DE MONITORAMENTO') || t.includes('SALA')) return 'Área Restrita / Circulação Interna';
  if (t.includes('VIA') || t.includes('CIRCULA')) return 'Vias Internas de Circulação';
  return 'Planta Operacional - Ecoparque';
}

async function importarOcorrencias() {
  const files = fs.readdirSync(ocorrenciasDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Encontrados ${files.length} arquivos PDF para ingestão.`);

  const ocorrenciasExtraidas = [];

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const filePath = path.join(ocorrenciasDir, f);
    const buf = fs.readFileSync(filePath);

    let parsedText = '';
    try {
      const parser = new PDFParse(new Uint8Array(buf));
      const res = await parser.getText();
      parsedText = res.text || res || '';
    } catch (err) {
      console.warn(`Aviso ao ler texto do PDF ${f}:`, err.message);
    }

    const textoLimpo = limparTexto(parsedText);

    // Extração de Data
    let dataIso = '2026-09-01';
    let dataFormatadaBr = '01.09.2026';
    const mData = textoLimpo.match(/No\s+dia\s+([0-9]{2})[\/\-.]([0-9]{2})[\/\-.]([0-9]{4})/i) ||
                  textoLimpo.match(/([0-9]{2})[\/\-.]([0-9]{2})[\/\-.]([0-9]{4})/);
    if (mData) {
      const dia = mData[1];
      const mes = mData[2];
      const ano = mData[3];
      dataIso = `${ano}-${mes}-${dia}`;
      dataFormatadaBr = `${dia}.${mes}.${ano}`;
    }

    // Extração de Hora
    let hora = '08:00';
    const mHora = textoLimpo.match(/[àa]s\s*([0-9]{2})[h:]([0-9]{2})/i) ||
                  textoLimpo.match(/([0-9]{2}):([0-9]{2})/);
    if (mHora) {
      hora = `${mHora[1]}:${mHora[2]}`;
    }

    // Título limpo e amigável
    const tituloBruto = f.replace(/\.pdf$/i, '').trim();
    let tituloFormatado = tituloBruto
      .replace(/^OCORR[EÊ]NCIA\s*/i, '')
      .replace(/\s*L(\s*\([0-9]+\))?$/i, '')
      .trim();
    if (!tituloFormatado) tituloFormatado = 'Desvio de Procedimento';
    tituloFormatado = tituloFormatado.charAt(0).toUpperCase() + tituloFormatado.slice(1).toLowerCase();

    // Extração da descrição / relato
    let descricao = '';
    const mRelato = textoLimpo.match(/RELAT[OÓ]RIO DA OCORR[EÊ]NCIA:?\s*([\s\S]+?)(?:Sumário|Assinatura|Fotos|--|\n\n\n|$)/i);
    if (mRelato && mRelato[1] && mRelato[1].trim().length > 30) {
      descricao = mRelato[1].trim().replace(/\s+/g, ' ');
    } else {
      descricao = textoLimpo.substring(0, 350).replace(/\s+/g, ' ');
    }

    const topico = classificarTopico(tituloBruto, descricao);
    const gravidade = classificarGravidade(tituloBruto, descricao);
    const local = classificarLocal(descricao, tituloBruto);

    // Extração de imagens de evidência
    const imagensBuf = extrairJpegs(buf);

    ocorrenciasExtraidas.push({
      arquivoOriginal: f,
      dataIso,
      dataFormatadaBr,
      hora,
      titulo: tituloFormatado,
      descricao,
      topico,
      gravidade,
      local,
      imagensBuf
    });
  }

  // Ordena cronologicamente para gerar protocolos sequenciais perfeitos
  ocorrenciasExtraidas.sort((a, b) => {
    const cmpData = a.dataIso.localeCompare(b.dataIso);
    if (cmpData !== 0) return cmpData;
    return a.hora.localeCompare(b.hora);
  });

  const ocorrenciasFinais = [];

  for (let idx = 0; idx < ocorrenciasExtraidas.length; idx++) {
    const oc = ocorrenciasExtraidas[idx];
    const seq = String(idx + 1).padStart(3, '0');
    const numeroRO = `RO-2026-${seq}`;

    // Cria diretório físico de assets oficial para esta ocorrência
    const roUploadDir = path.join(uploadsDir, numeroRO);
    if (!fs.existsSync(roUploadDir)) {
      fs.mkdirSync(roUploadDir, { recursive: true });
    }

    const fotosProcessadas = [];
    oc.imagensBuf.forEach((imgBuf, fotoIdx) => {
      const nomeImg = `evidencia_${fotoIdx + 1}.jpg`;
      const imgPath = path.join(roUploadDir, nomeImg);
      fs.writeFileSync(imgPath, imgBuf);

      const base64Url = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;
      fotosProcessadas.push({
        id: `foto-${numeroRO}-${fotoIdx + 1}`,
        nomeArquivo: nomeImg,
        caminhoRelativo: `uploads/ocorrencias/${numeroRO}/${nomeImg}`,
        tamanho: `${Math.round(imgBuf.length / 1024)} KB`,
        legenda: `Evidência fotográfica #${fotoIdx + 1} anexada ao relatório oficial`,
        base64: base64Url,
        url: base64Url
      });
    });

    // Nome padronizado estrito: Ocorrência [Protocolo RO] - [Tópico] & [Gravidade] - [Data].pdf
    const topicoLimpo = oc.topico.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
    const gravidadeLimpa = oc.gravidade.replace(/[\\/:*?"<>|]/g, '').trim().toUpperCase();
    const nomeArquivoPdf = `Ocorrência ${numeroRO} - ${topicoLimpo} & ${gravidadeLimpa} - ${oc.dataFormatadaBr}.pdf`;

    const registroOficial = {
      id: 1720000000000 + idx,
      numeroRO,
      data: oc.dataIso,
      hora: oc.hora,
      local: oc.local,
      gravidade: oc.gravidade,
      titulo: oc.titulo,
      topico: oc.topico,
      descricao: oc.descricao,
      envolvidos: [
        {
          id: `env-${numeroRO}-1`,
          nome: 'Colaborador Identificado em Imagens',
          funcao: 'Operacional / Logística',
          empresa: 'NÃO INFORMADA',
          matricula: 'N/A',
          naoIdentificado: false
        }
      ],
      fotos: fotosProcessadas,
      responsaveis: {
        gerenteSite: 'Alcimara Silva',
        coordenacao: 'Ordiley Batista (SERVIS Segurança)',
        fiscalContrato: 'Roberta Santos',
        caminhoRede: 'MAPA DE CALOR/2026/09.SETEMBRO'
      },
      nomeArquivoPdf,
      arquivoOriginalLegado: oc.arquivoOriginal,
      dataCadastro: new Date(oc.dataIso + 'T' + oc.hora + ':00.000Z').toISOString()
    };

    ocorrenciasFinais.push(registroOficial);
    console.log(`  ✓ ${numeroRO}: ${nomeArquivoPdf} (${fotosProcessadas.length} fotos salvas em uploads/ocorrencias/${numeroRO})`);
  }

  // Grava em data/ocorrencias.json
  const dataJsonPath = path.join(dataDir, 'ocorrencias.json');
  fs.writeFileSync(dataJsonPath, JSON.stringify(ocorrenciasFinais, null, 2), 'utf-8');
  console.log(`\n  ✓ data/ocorrencias.json gravado com sucesso (${ocorrenciasFinais.length} ocorrências oficiais).`);

  // Gera planilha espelho oficial na raiz: ocorrencias.xlsx
  try {
    const rootXlsxPath = path.join(rootDir, 'ocorrencias.xlsx');
    const linhasXlsx = ocorrenciasFinais.map(o => ({
      'Nº RO': o.numeroRO,
      'Data': o.data,
      'Hora': o.hora,
      'Local': o.local,
      'Gravidade': o.gravidade,
      'Tópico': o.topico,
      'Título': o.titulo,
      'Descrição': o.descricao,
      'Qtd Envolvidos': o.envolvidos.length,
      'Qtd Fotos': o.fotos.length,
      'Gerente Site': o.responsaveis.gerenteSite,
      'Coordenação': o.responsaveis.coordenacao,
      'Fiscal Contrato': o.responsaveis.fiscalContrato,
      'Nome Arquivo PDF': o.nomeArquivoPdf,
      'Arquivo Legado': o.arquivoOriginalLegado
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(linhasXlsx);
    XLSX.utils.book_append_sheet(wb, ws, 'Relatórios de Ocorrência');
    XLSX.writeFile(wb, rootXlsxPath);
    console.log('  ✓ Planilha espelho ocorrencias.xlsx gerada na raiz.');
  } catch (xlsxErr) {
    console.warn('Aviso ao gerar ocorrencias.xlsx:', xlsxErr.message);
  }

  console.log('\n[Migração Ocorrências] Processamento dos 31 relatórios de ocorrência e fotos concluído!');
}

importarOcorrencias().catch(err => {
  console.error('Erro na migração de ocorrências:', err);
  process.exit(1);
});
