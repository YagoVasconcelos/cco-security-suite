import React from 'react';

/**
 * COMPONENTE OFICIAL DO RELATÓRIO DE OCORRÊNCIA (RO)
 * Padrão Corporativo Limpo - CCO Security Suite
 * 
 * Estrutura Linear Estrita:
 * 1. Topo: Cabeçalho Institucional Azul Escuro com Título, Operador e Caixa Lateral Direita (Protocolo + Gravidade)
 * 2. Subtítulo: RELATÓRIO DE OCORRÊNCIA (RO) e frase oficial
 * 3. Aprovadores (Grid Superior): Gerente de Site, Coordenação de Segurança, Fiscal de Contrato
 * 4. Seção 1: 1. DADOS GERAIS DO FATO (Data, Horário, Prédio/Área, Tópico & Gravidade)
 * 5. Título: TÍTULO: [NOME DA OCORRÊNCIA]
 * 6. Seção 2: 2. RELATO CRONOLÓGICO DOS FATOS
 * 7. Seção 3: 3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS (Colunas: #, Nome Completo, Função / Cargo, Empresa, Matrícula)
 * 8. Seção 4: 4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS
 * 9. Rodapé Final: Padrão do sistema com Protocolo, Operador e Data/Hora de emissão
 */
export default function RelatorioOcorrenciaOficialDocumento({
  dadosDocumento,
  responsaveis
}) {
  if (!dadosDocumento) return null;

  // Formatador de data brasileira DD/MM/AAAA
  const formatarDataBr = (dataIso) => {
    if (!dataIso) return '--/--/----';
    if (typeof dataIso === 'string' && dataIso.includes('-')) {
      const p = dataIso.split('-');
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    }
    return dataIso;
  };

  const operadorNome = dadosDocumento.operador || responsaveis?.operador || 'Operador CCO';
  const dataEmissaoStr = formatarDataBr(new Date().toISOString().split('T')[0]);
  const horaEmissaoStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Lista segura de envolvidos
  const listaEnvolvidos = Array.isArray(dadosDocumento.envolvidos) ? dadosDocumento.envolvidos : [];
  const envolvidosValidos = listaEnvolvidos.filter(e => e && (e.nome?.trim() || e.matricula?.trim() || e.empresa?.trim() || e.naoIdentificado));

  // Lista segura de fotos
  const listaFotos = Array.isArray(dadosDocumento.fotos) ? dadosDocumento.fotos : [];

  const localFormatado = dadosDocumento.predio
    ? `${dadosDocumento.predio} - ${dadosDocumento.area || 'Geral'}`
    : (dadosDocumento.local || 'Planta Operacional');

  const topicoGravidadeFormatado = `${dadosDocumento.topico || 'Geral'} (${dadosDocumento.gravidade || 'Média'})`;

  const gerenteSite = dadosDocumento.responsaveis?.gerenteSite || responsaveis?.gerenteSite || 'Gerência de Operações';
  const coordenacao = dadosDocumento.responsaveis?.coordenacao || responsaveis?.coordenacao || 'Coordenação de Segurança Corporativa';
  const fiscalContrato = dadosDocumento.responsaveis?.fiscalContrato || responsaveis?.fiscalContrato || 'Fiscalização de Contrato';

  return (
    <div className="ro-oficial-wrapper bg-white text-slate-900 w-full max-w-5xl mx-auto p-6 sm:p-8 space-y-4 font-sans border border-slate-200 rounded-xl shadow-lg print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-full">
      
      {/* ========================================================================= */}
      {/* 1. TOPO: CABEÇALHO INSTITUCIONAL AZUL ESCURO & CAIXA LATERAL DIREITA       */}
      {/* ========================================================================= */}
      <div className="ro-header-banner bg-[#0f172a] text-white rounded-lg p-5 border-b-4 border-[#2563eb] print:rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Lado Esquerdo: Identificação Corporativa Institucional */}
        <div className="space-y-1">
          <h1 className="text-base sm:text-lg font-black tracking-wider text-white uppercase">
            CCO SECURITY SUITE CENTRAL DE CONTROLE OPERACIONAL
          </h1>
          <p className="text-xs text-[#bfdbfe] font-semibold tracking-wide uppercase">
            SEGURANÇA PATRIMONIAL &amp; CONTROLE DE ACESSO — OPERADOR: {operadorNome.toUpperCase()}
          </p>
        </div>

        {/* Lado Direito: Caixa Lateral Direita contendo APENAS o Protocolo e a GRAVIDADE */}
        <div className="text-left sm:text-right shrink-0">
          <div className="bg-[#1e293b] border border-[#3b82f6]/50 rounded-lg px-4 py-2 text-center shadow-sm min-w-[155px]">
            <span className="font-mono text-base font-black text-white tracking-wider block">
              {dadosDocumento.numeroRO || 'RO-2026-507'}
            </span>
            <span className="text-[10px] font-extrabold text-[#93c5fd] uppercase tracking-wider block mt-0.5">
              GRAVIDADE: {(dadosDocumento.gravidade || 'MÉDIA').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUBTÍTULO OFICIAL                                                      */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-slate-800 pb-2.5 pt-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
          RELATÓRIO DE OCORRÊNCIA (RO)
        </h2>
        <p className="text-xs text-slate-600 font-medium mt-0.5">
          Documento emitido para apuração, registro de fatos e controle da segurança patrimonial
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 3. APROVADORES (GRID SUPERIOR): GERENTE, COORDENAÇÃO E FISCAL             */}
      {/* ========================================================================= */}
      <div className="ro-card-muted bg-[#f8fafc] border border-slate-300 rounded-lg p-3 print-avoid-break">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
          <div className="pt-2 sm:pt-0 sm:pr-3 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              GERENTE DE SITE:
            </span>
            <p className="text-xs font-bold text-slate-900 truncate">
              {gerenteSite}
            </p>
            <span className="text-[10px] text-slate-500 block">
              Aprovação Executiva
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              COORDENAÇÃO DE SEGURANÇA:
            </span>
            <p className="text-xs font-bold text-slate-900 truncate">
              {coordenacao}
            </p>
            <span className="text-[10px] text-slate-500 block">
              Supervisão Técnica
            </span>
          </div>

          <div className="pt-2 sm:pt-0 sm:pl-3 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
              FISCAL DE CONTRATO:
            </span>
            <p className="text-xs font-bold text-slate-900 truncate">
              {fiscalContrato}
            </p>
            <span className="text-[10px] text-slate-500 block">
              Fiscalização e Auditoria
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEÇÃO 1: 1. DADOS GERAIS DO FATO                                       */}
      {/* ========================================================================= */}
      <div className="space-y-0 print-avoid-break">
        <div className="ro-section-header bg-[#1e293b] text-white px-3.5 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider">
          1. DADOS GERAIS DO FATO
        </div>

        <div className="border border-slate-300 rounded-b overflow-hidden bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-2 px-3 border-r border-slate-300 w-1/4">DATA DO FATO:</th>
                <th className="py-2 px-3 border-r border-slate-300 w-1/6">HORÁRIO:</th>
                <th className="py-2 px-3 border-r border-slate-300 w-1/3">PRÉDIO / ÁREA (LOCAL):</th>
                <th className="py-2 px-3 w-1/4">TÓPICO &amp; GRAVIDADE:</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-slate-900">
                <td className="py-2.5 px-3 font-mono font-bold border-r border-slate-200">
                  {formatarDataBr(dadosDocumento.data)}
                </td>
                <td className="py-2.5 px-3 font-mono font-bold border-r border-slate-200">
                  {dadosDocumento.hora || '--:--'}
                </td>
                <td className="py-2.5 px-3 font-bold border-r border-slate-200">
                  {localFormatado}
                </td>
                <td className="py-2.5 px-3 font-bold">
                  {topicoGravidadeFormatado}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TÍTULO: [NOME DA OCORRÊNCIA]                                           */}
      {/* ========================================================================= */}
      <div className="ro-card-muted bg-[#f1f5f9] border border-slate-300 rounded p-3 text-xs print-avoid-break flex items-baseline gap-2">
        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] shrink-0">
          TÍTULO:
        </span>
        <span className="font-bold text-slate-950 text-sm sm:text-base leading-snug">
          {dadosDocumento.titulo || 'Ocorrência Operacional sem título cadastrado'}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 6. SEÇÃO 2: 2. RELATO CRONOLÓGICO DOS FATOS                               */}
      {/* ========================================================================= */}
      <div className="space-y-0 print-avoid-break">
        <div className="ro-section-header bg-[#1e293b] text-white px-3.5 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider">
          2. RELATO CRONOLÓGICO DOS FATOS
        </div>
        <div className="ro-card border border-slate-300 rounded-b p-4 bg-white min-h-[110px]">
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
            {dadosDocumento.descricao?.trim() ? (
              dadosDocumento.descricao
            ) : (
              <span className="italic text-slate-400">
                Sem descrição detalhada registrada.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. SEÇÃO 3: 3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS                         */}
      {/* ========================================================================= */}
      <div className="space-y-0 print-avoid-break">
        <div className="ro-section-header bg-[#1e293b] text-white px-3.5 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider">
          3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS
        </div>

        <div className="border border-slate-300 rounded-b overflow-hidden bg-white">
          <table className="ro-table w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#334155] text-white text-[10px] uppercase tracking-wider font-bold">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-600">#</th>
                <th className="py-2.5 px-3 border-r border-slate-600 w-1/3">Nome Completo</th>
                <th className="py-2.5 px-3 border-r border-slate-600">Função / Cargo</th>
                <th className="py-2.5 px-3 border-r border-slate-600">Empresa</th>
                <th className="py-2.5 px-3 w-28 text-center">Matrícula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {envolvidosValidos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-3.5 px-3 text-center text-slate-500 italic bg-[#f8fafc]">
                    Nenhum envolvido registrado
                  </td>
                </tr>
              ) : (
                envolvidosValidos.map((e, idx) => (
                  <tr key={e.id || idx} className="hover:bg-slate-50 transition-colors even:bg-[#f8fafc]">
                    <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                      {e.naoIdentificado ? (
                        <span className="italic text-amber-700 font-bold">(Não identificado)</span>
                      ) : (
                        e.nome || 'NÃO INFORMADO'
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                      {e.naoIdentificado ? '(Não identificado)' : (e.funcao || '-')}
                    </td>
                    <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                      {e.naoIdentificado ? '(Não identificado)' : (e.empresa || '-')}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">
                      {e.naoIdentificado ? 'N/A' : (e.matricula || '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8. SEÇÃO 4: 4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS                     */}
      {/* ========================================================================= */}
      <div className="space-y-0 print-avoid-break">
        <div className="ro-section-header bg-[#1e293b] text-white px-3.5 py-1.5 rounded-t text-xs font-bold uppercase tracking-wider">
          4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS
        </div>

        <div className="ro-card border border-slate-300 rounded-b p-4 bg-white">
          {listaFotos.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-3">
              Nenhuma imagem fotográfica foi anexada a este relatório.
            </p>
          ) : listaFotos.length === 1 ? (
            /* Quando há apenas 1 imagem: centralização perfeita com max-height contido e proporcional */
            <div className="flex flex-col items-center justify-center py-1.5 w-full">
              {(() => {
                const foto = listaFotos[0];
                let descricaoFoto = (foto.legenda || 'Registro fotográfico da ocorrência.').trim();
                while (/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i.test(descricaoFoto)) {
                  descricaoFoto = descricaoFoto.replace(/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i, '').trim();
                }
                return (
                  <div
                    key={foto.id || 0}
                    className="border border-slate-300 rounded-lg overflow-hidden bg-[#f1f5f9] flex flex-col items-center print-avoid-break shadow-sm w-full max-w-md mx-auto"
                  >
                    <div className="bg-slate-100 flex items-center justify-center p-2 w-full overflow-hidden" style={{ maxHeight: '280px' }}>
                      <img
                        src={foto.url || foto.base64 || ''}
                        alt={foto.legenda || 'Foto #1'}
                        className="w-auto h-auto max-h-[270px] max-w-full object-contain rounded"
                        style={{ maxHeight: '270px' }}
                      />
                    </div>
                    <div className="p-2.5 bg-white border-t border-slate-200 w-full text-center">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        Anexo 1 - {descricaoFoto}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Quando há 2 ou mais imagens: grid balanceado em 2 colunas */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listaFotos.map((foto, idx) => {
                let descricaoFoto = (foto.legenda || 'Registro fotográfico da ocorrência.').trim();
                while (/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i.test(descricaoFoto)) {
                  descricaoFoto = descricaoFoto.replace(/^(Figura|Foto|Anexo)\s*\d+[\s:.-]*/i, '').trim();
                }
                return (
                  <div key={foto.id || idx} className="border border-slate-300 rounded-lg overflow-hidden bg-[#f1f5f9] flex flex-col print-avoid-break shadow-sm">
                    <div className="bg-slate-100 aspect-video flex items-center justify-center overflow-hidden max-h-[220px]">
                      <img
                        src={foto.url || foto.base64 || ''}
                        alt={foto.legenda || `Foto #${idx + 1}`}
                        className="w-full h-full object-contain max-h-[220px]"
                      />
                    </div>
                    <div className="p-2.5 bg-white border-t border-slate-200">
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        Anexo {idx + 1} - {descricaoFoto}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 9. RODAPÉ FINAL PADRÃO DO SISTEMA (LINHA ÚNICA E POSICIONAMENTO FIXO)     */}
      {/* ========================================================================= */}
      <footer className="ro-footer-container pt-3 border-t border-slate-300 w-full mt-auto print-avoid-break">
        <div className="ro-print-footer bg-[#f8fafc] border border-slate-300 rounded px-3.5 py-2 text-[10px] sm:text-[11px] text-slate-700 font-mono flex flex-row flex-nowrap items-center justify-between gap-2 w-full whitespace-nowrap leading-none shadow-sm">
          {/* Lado Esquerdo: Linha Única Fluida com Metadados Institucionais */}
          <div className="flex flex-row flex-nowrap items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap min-w-0">
            <span className="font-black text-slate-950 tracking-wider shrink-0 uppercase">CCO SECURITY SUITE</span>
            <span className="text-slate-400 font-bold shrink-0">•</span>
            <span className="shrink-0">Protocolo: <strong className="text-slate-900 font-bold">{dadosDocumento.numeroRO || 'RO-2026'}</strong></span>
            <span className="text-slate-400 font-bold shrink-0">•</span>
            <span className="truncate">Operador: <strong className="text-slate-900 font-bold">{operadorNome}</strong></span>
            <span className="text-slate-400 font-bold shrink-0">•</span>
            <span className="shrink-0">Emitido em: {dataEmissaoStr} às {horaEmissaoStr}</span>
          </div>

          {/* Lado Direito: Contagem de Páginas Estrita em Linha Única */}
          <div className="shrink-0 text-[10px] font-sans font-bold text-slate-600 pl-3 border-l border-slate-300">
            <span className="print:hidden">Página 1 de 1</span>
            <span className="hidden print:inline ro-print-page-counter"></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
