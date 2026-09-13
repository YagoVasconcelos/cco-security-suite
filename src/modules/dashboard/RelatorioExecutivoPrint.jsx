import React from 'react';
import {
  Shield,
  CreditCard,
  UserCheck,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Users,
  TrendingUp,
  DollarSign
} from 'lucide-react';

/**
 * Componente oficial de Impressão e Exportação em PDF do CCO Security Suite
 * Modelo aprimorado de alta fidelidade gerencial para diretoria e gerência
 * 
 * Regras estritas:
 * - 1 página dedicada em modo paisagem por módulo (A4 landscape: 196mm altura útil)
 * - Fundo branco (#ffffff), painéis leves (#f8fafc), bordas limpas (#e2e8f0), texto escuro (#0f172a)
 * - Gráficos analíticos SVG vetoriais em todos os módulos
 * - Respeita o filtro de módulo ativo (se filtrado em Ocorrências, imprime apenas 1 página de Ocorrências)
 * - Em visão completa, imprime rigorosamente os 4 módulos, cada um em sua página (exatamente 4 páginas)
 */
export default function RelatorioExecutivoPrint({
  abaAtiva = 'todas',
  operadorAtivo = 'Op. Yago Marinho',
  turnoAtivo = '12x36 Diurno',
  periodoNome = 'Mês Atual (Setembro/2026)',
  filtros = {},
  dados = {}
}) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Desestruturação dos dados consolidados
  const {
    // Módulo 1
    totalOcorrencias = 0,
    criticas = 0,
    altas = 0,
    medias = 0,
    baixas = 0,
    pctCritica = 0,
    pctAlta = 0,
    pctMedia = 0,
    pctBaixa = 0,
    tempoMedioResposta = '20 min',
    comFotosFormalizadas = '0',
    ocorrenciasPorPredio = [],
    ocorrenciasPorTopico = [],
    produtividadeOperadores = [],
    ultimasOcorrencias = [],

    // Módulo 2
    metricasProvisorios = {},
    cautelasEmCirculacao = [],
    tabelaReincidentes = [],
    extraviosProvisorios = [],

    // Módulo 3
    metricasVisitantes = {},
    visitantesNoSite = [],
    rankingAnfitrioes = [],
    extraviosVisitantes = [],

    // Módulo 4
    metricasRfidContabilidade = {},
    resumoCobrancaPorEmpresa = [],
    tabelaInadimplentes = []
  } = dados;

  // Lógica de visibilidade por aba / filtro
  const mostrarD1 = abaAtiva === 'todas' || abaAtiva === 'd1';
  const mostrarD2 = abaAtiva === 'todas' || abaAtiva === 'd2';
  const mostrarD3 = abaAtiva === 'todas' || abaAtiva === 'd3';
  const mostrarD4 = abaAtiva === 'todas' || abaAtiva === 'd4';

  const ehModuloUnico = abaAtiva !== 'todas';

  // Rótulo dinâmico da página
  const getRotuloPagina = (num) => {
    if (ehModuloUnico) return 'Página 1 de 1';
    return `Página ${num} de 4`;
  };

  // SVG Helper: Donut Chart de Severidade (Módulo 1)
  const renderDonutSeveridade = () => {
    const total = totalOcorrencias > 0 ? totalOcorrencias : 1;
    const raio = 32;
    const circunferencia = 2 * Math.PI * raio; // ~201.06

    const lenCritica = (criticas / total) * circunferencia;
    const lenAlta = (altas / total) * circunferencia;
    const lenMedia = (medias / total) * circunferencia;
    const lenBaixa = (baixas / total) * circunferencia;

    let offset = 0;
    const offsetCritica = -offset;
    offset += lenCritica;
    const offsetAlta = -offset;
    offset += lenAlta;
    const offsetMedia = -offset;
    offset += lenMedia;
    const offsetBaixa = -offset;

    const dashCritica = `${lenCritica} ${circunferencia - lenCritica}`;
    const dashAlta = `${lenAlta} ${circunferencia - lenAlta}`;
    const dashMedia = `${lenMedia} ${circunferencia - lenMedia}`;
    const dashBaixa = `${lenBaixa} ${circunferencia - lenBaixa}`;

    return (
      <div className="flex items-center gap-4">
        {/* Gráfico Donut SVG */}
        <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
            {totalOcorrencias > 0 ? (
              <>
                {criticas > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r={raio}
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray={dashCritica}
                    strokeDashoffset={offsetCritica}
                  />
                )}
                {altas > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r={raio}
                    fill="transparent"
                    stroke="#f97316"
                    strokeWidth="10"
                    strokeDasharray={dashAlta}
                    strokeDashoffset={offsetAlta}
                  />
                )}
                {medias > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r={raio}
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="10"
                    strokeDasharray={dashMedia}
                    strokeDashoffset={offsetMedia}
                  />
                )}
                {baixas > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r={raio}
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray={dashBaixa}
                    strokeDashoffset={offsetBaixa}
                  />
                )}
              </>
            ) : (
              <circle cx="40" cy="40" r={raio} fill="transparent" stroke="#cbd5e1" strokeWidth="10" />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black text-slate-900 leading-none">{totalOcorrencias}</span>
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">ROs</span>
          </div>
        </div>

        {/* Barras Horizontais com Legenda */}
        <div className="flex-1 space-y-1">
          <div>
            <div className="flex justify-between text-[9px] font-bold mb-0.5">
              <span className="text-red-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Crítica ({criticas})
              </span>
              <span className="text-slate-800 font-mono">{pctCritica}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${pctCritica}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-bold mb-0.5">
              <span className="text-orange-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Alta ({altas})
              </span>
              <span className="text-slate-800 font-mono">{pctAlta}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pctAlta}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-bold mb-0.5">
              <span className="text-amber-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Média ({medias})
              </span>
              <span className="text-slate-800 font-mono">{pctMedia}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pctMedia}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[9px] font-bold mb-0.5">
              <span className="text-blue-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Baixa ({baixas})
              </span>
              <span className="text-slate-800 font-mono">{pctBaixa}%</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pctBaixa}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SVG Helper: Gauge Circular Financeiro (Módulo 4)
  const renderGaugeFinanceiro = (percentual = 100) => {
    const raio = 32;
    const circunferencia = Math.PI * raio; // Semicírculo
    const pctClamped = Math.min(100, Math.max(0, percentual));
    const preenchimento = (pctClamped / 100) * circunferencia;

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-24 h-14 flex items-center justify-center">
          <svg className="w-24 h-24 transform -rotate-180" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={raio}
              fill="transparent"
              stroke="#e2e8f0"
              strokeWidth="8"
              strokeDasharray={`${circunferencia} ${circunferencia}`}
            />
            <circle
              cx="40"
              cy="40"
              r={raio}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="8"
              strokeDasharray={`${preenchimento} ${circunferencia}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute bottom-1 flex flex-col items-center">
            <span className="text-base font-black text-slate-900 font-mono leading-none">{pctClamped}%</span>
            <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-tight mt-0.5">Eficácia</span>
          </div>
        </div>
      </div>
    );
  };

  // Dados calculados para Módulo 2
  const cautelasAtivasCount = metricasProvisorios.totalCautelasAtivas ?? (Array.isArray(cautelasEmCirculacao) ? cautelasEmCirculacao.length : 0);
  const devolvidosHojeCount = metricasProvisorios.totalDevolvidosHoje ?? (Array.isArray(metricasProvisorios.devolvidosHoje) ? metricasProvisorios.devolvidosHoje.length : 0);
  const reincidentesCount = (Array.isArray(tabelaReincidentes) ? tabelaReincidentes : []).filter(r => (r.totalAcessos || r.total || 0) >= 3).length;
  const ocupadosP1 = metricasProvisorios.ocupadosP1 ?? 0;
  const ocupadosP2 = metricasProvisorios.ocupadosP2 ?? 0;
  const totalSlotsOcupados = metricasProvisorios.totalSlotsOcupados ?? (ocupadosP1 + ocupadosP2);
  const taxaOcupacaoEscaninho = metricasProvisorios.taxaOcupacaoEscaninho ?? Math.min(100, Math.round((totalSlotsOcupados / 20) * 100));

  // Dados calculados para Módulo 3
  const visitantesNoSiteCount = metricasVisitantes.totalNoSite ?? (Array.isArray(visitantesNoSite) ? visitantesNoSite.length : 0);
  const entradasHojeCount = metricasVisitantes.entradasHoje ?? 0;
  const saidasHojeCount = metricasVisitantes.saidasHoje ?? 0;
  const pctAuditadosAnf = metricasVisitantes.pctAuditados ?? 100;
  const noSiteP1 = metricasVisitantes.noSiteP1 ?? 0;
  const noSiteP2 = metricasVisitantes.noSiteP2 ?? 0;
  const taxaOcupacaoVis = metricasVisitantes.taxaOcupacaoEscaninhoVis ?? Math.min(100, Math.round((visitantesNoSiteCount / 40) * 100));

  // Dados calculados para Módulo 4
  const rotativosDisp = metricasRfidContabilidade.rotativosDisponiveis ?? 0;
  const rotativosAtivos = metricasRfidContabilidade.rotativosAtivos ?? 0;
  const rotativosTotal = metricasRfidContabilidade.rotativosTotal ?? 350;
  const rotativosPerdidos = metricasRfidContabilidade.rotativosPerdidos ?? 0;

  const fixosDisp = metricasRfidContabilidade.fixosDisponiveis ?? 0;
  const fixosAtivos = metricasRfidContabilidade.fixosAtivos ?? 0;
  const fixosTotal = metricasRfidContabilidade.fixosTotal ?? 0;
  const fixosPerdidos = metricasRfidContabilidade.fixosPerdidos ?? 0;

  const totalItensACobrarGeral = metricasRfidContabilidade.totalItensACobrar ?? 0;
  const totalValorACobrarGeral = metricasRfidContabilidade.totalValorACobrar ?? 0;
  const totalItensPagosGeral = metricasRfidContabilidade.totalItensPagos ?? 0;
  const totalValorRecuperadoGeral = metricasRfidContabilidade.totalValorRecuperado ?? 0;
  const taxaEficaciaGeral = metricasRfidContabilidade.taxaEficacia ?? 100;

  return (
    <div className="cco-print-root hidden print:block text-slate-900 bg-white font-sans antialiased">

      {/* =========================================================================
          PÁGINA 1: DASHBOARD 1 - OCORRÊNCIAS & SEGURANÇA PATRIMONIAL
         ========================================================================= */}
      {mostrarD1 && (
        <div className={`cco-print-page p-4 bg-white ${ehModuloUnico || !mostrarD2 ? 'no-break' : 'page-break'}`}>
          {/* Cabeçalho da Página */}
          <div className="border-b-2 border-blue-600 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    {getRotuloPagina(1)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">CCO Security Suite • Central de Controle Operacional</span>
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                  DASHBOARD 1: OCORRÊNCIAS & SEGURANÇA PATRIMONIAL
                </h1>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <div className="font-bold text-slate-900">
                <span className="text-slate-500 font-normal">Operador: </span>
                <span className="font-mono uppercase">{operadorAtivo}</span>
                {turnoAtivo && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px]">
                    {turnoAtivo}
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">
                <span>Período: {periodoNome}</span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span>Emissão: {dataEmissao} às {horaEmissao}</span>
              </div>
            </div>
          </div>

          {/* 4 Cards de Indicadores Principais */}
          <div className="grid grid-cols-4 gap-2.5 my-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Total Ocorrências</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">Filtradas</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono my-1">{totalOcorrencias}</div>
              <p className="text-[9px] text-slate-500 truncate">
                {filtros.predio && filtros.predio !== 'TODOS' ? filtros.predio : 'Todos os Prédios'} • {filtros.area && filtros.area !== 'TODAS' ? filtros.area : 'Todas as Áreas'}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Críticas & Altas</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800">Urgência</span>
              </div>
              <div className="text-2xl font-black text-red-600 font-mono my-1">
                {criticas + altas}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({pctCritica + pctAlta}%)
                </span>
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                {criticas} Crítica(s) • {altas} Alta(s)
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Médias & Baixas</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800">Operacional</span>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono my-1">
                {medias + baixas}
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({pctMedia + pctBaixa}%)
                </span>
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                {medias} Média(s) • {baixas} Baixa(s)
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Taxa de Resolução</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">Eficácia</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono my-1">100%</div>
              <p className="text-[9px] text-slate-500 truncate">
                Formalização digital completa no CCO
              </p>
            </div>
          </div>

          {/* Gráfico Visual: Rosca de Severidade & Destaques de Atendimento */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mb-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">
                  Distribuição Gráfica de Severidade & Tempo de Resposta
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500">
                Padrão Corporativo de Auditoria Operacional CCO
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Gráfico Donut de Severidade */}
              <div className="col-span-8 border-r border-slate-200 pr-4">
                {renderDonutSeveridade()}
              </div>

              {/* Destaques Operacionais */}
              <div className="col-span-4 grid grid-cols-1 gap-1">
                <div className="p-1.5 rounded bg-white border border-slate-200 text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Tempo Médio de Resposta</span>
                  <div className="text-sm font-black text-slate-900 font-mono">{tempoMedioResposta}</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-slate-200 text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Com Fotos Formalizadas</span>
                  <div className="text-sm font-black text-blue-700 font-mono">{comFotosFormalizadas}</div>
                </div>
                <div className="p-1.5 rounded bg-white border border-slate-200 text-center">
                  <span className="text-[8px] uppercase font-bold text-slate-500">PDFs Salvos em Rede</span>
                  <div className="text-sm font-black text-emerald-700 font-mono">{totalOcorrencias} Arquivo(s)</div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Tabelas de Detalhamento Analítico (Grid 2x2) */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {/* Tabela 1: Incidência por Prédio */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Building className="w-3 h-3 text-blue-600" />
                    Incidência por Prédio / Localidade
                  </span>
                  <span className="text-[9px] text-slate-500">Concentração</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Prédio / Local</th>
                      <th className="py-1 text-right">Qtd ROs</th>
                      <th className="py-1 text-right">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ocorrenciasPorPredio.length > 0 ? (
                      ocorrenciasPorPredio.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[140px]">{item.predio}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-slate-900">{item.total}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-blue-700">{item.porcentagem}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhuma ocorrência registrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Monitoramento territorial e ronda preventiva</p>
            </div>

            {/* Tabela 2: Classificação por Tópico */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-blue-600" />
                    Classificação por Tópico & Natureza
                  </span>
                  <span className="text-[9px] text-slate-500">Tipificação</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Tópico / Categoria</th>
                      <th className="py-1 text-right">Qtd ROs</th>
                      <th className="py-1 text-right">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ocorrenciasPorTopico.length > 0 ? (
                      ocorrenciasPorTopico.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[140px]">{item.topico}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-slate-900">{item.total}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-indigo-700">{item.porcentagem}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhuma ocorrência registrada</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Taxonomia oficial padronizada para auditorias</p>
            </div>

            {/* Tabela 3: Produtividade CCO */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Produtividade CCO (Operadores)
                  </span>
                  <span className="text-[9px] text-slate-500">Emissão</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Operador CCO</th>
                      <th className="py-1 text-right">Total Emitido</th>
                      <th className="py-1 text-right">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {produtividadeOperadores.length > 0 ? (
                      produtividadeOperadores.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[140px]">{item.operador}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-slate-900">{item.total} ROs</td>
                          <td className="py-0.5 text-right font-mono font-bold text-emerald-700">{item.porcentagem}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Sem registros de operadores</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Produtividade operacional consolidada do plantão</p>
            </div>

            {/* Tabela 4: Últimas Ocorrências */}
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Últimas Ocorrências Registradas
                  </span>
                  <span className="text-[9px] text-slate-500">Recentes</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Protocolo / Prédio</th>
                      <th className="py-1 text-center">Gravidade</th>
                      <th className="py-1 text-right">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ultimasOcorrencias.length > 0 ? (
                      ultimasOcorrencias.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[130px]">
                            {item.numeroRO || item.protocolo || `RO-${idx + 1}`} • {item.predio || item.local || '-'}
                          </td>
                          <td className="py-0.5 text-center">
                            <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                              (item.severidade || item.prioridade) === 'Crítica'
                                ? 'bg-red-100 text-red-800'
                                : (item.severidade || item.prioridade) === 'Alta'
                                ? 'bg-orange-100 text-orange-800'
                                : (item.severidade || item.prioridade) === 'Média'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.severidade || item.prioridade || 'Baixa'}
                            </span>
                          </td>
                          <td className="py-0.5 text-right font-mono text-slate-600">
                            {item.data || ''} {item.hora || ''}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhuma ocorrência recente</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Histórico recente protocolado no banco de dados</p>
            </div>
          </div>

          {/* Rodapé Oficial da Página 1 */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>CCO Security Suite • Central de Controle Operacional • Módulo 1: Ocorrências</span>
            <span className="font-bold text-slate-700">{getRotuloPagina(1)}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PÁGINA 2: DASHBOARD 2 - PROVISÓRIOS / MOVIMENTAÇÃO & CAUTELAS
         ========================================================================= */}
      {mostrarD2 && (
        <div className={`cco-print-page p-4 bg-white ${ehModuloUnico || !mostrarD3 ? 'no-break' : 'page-break'}`}>
          {/* Cabeçalho da Página */}
          <div className="border-b-2 border-amber-600 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    {getRotuloPagina(2)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">CCO Security Suite • Central de Controle Operacional</span>
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                  DASHBOARD 2: PROVISÓRIOS / MOVIMENTAÇÃO & CAUTELAS
                </h1>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <div className="font-bold text-slate-900">
                <span className="text-slate-500 font-normal">Operador: </span>
                <span className="font-mono uppercase">{operadorAtivo}</span>
                {turnoAtivo && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px]">
                    {turnoAtivo}
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">
                <span>Período: {periodoNome}</span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span>Emissão: {dataEmissao} às {horaEmissao}</span>
              </div>
            </div>
          </div>

          {/* 4 Cards de Indicadores Principais */}
          <div className="grid grid-cols-4 gap-2.5 my-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Cautelas Ativas</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800">Em Posse</span>
              </div>
              <div className="text-2xl font-black text-amber-600 font-mono my-1">{cautelasAtivasCount}</div>
              <p className="text-[9px] text-slate-500 truncate">
                {ocupadosP1} na Portaria 1 • {ocupadosP2} na Portaria 2
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Devolvidos Hoje</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">Hoje</span>
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono my-1">{devolvidosHojeCount}</div>
              <p className="text-[9px] text-slate-500 truncate">
                Retornados e liberados no escaninho físico
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Alertas Reincidência</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800">≥ 3 Acessos</span>
              </div>
              <div className="text-2xl font-black text-red-600 font-mono my-1">{reincidentesCount}</div>
              <p className="text-[9px] text-slate-500 truncate">
                Regra dos 3 acessos: Exige justificativa formal
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Ocupação Escaninho</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-800">
                  {totalSlotsOcupados} / 20 slots
                </span>
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono my-1">{taxaOcupacaoEscaninho}%</div>
              <p className="text-[9px] text-slate-500 truncate">
                {20 - totalSlotsOcupados} cartões disponíveis nas portarias
              </p>
            </div>
          </div>

          {/* Gráfico Visual de Escaninhos Físicos & Cobrança de Provisórios */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mb-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">
                  Visualização Física dos Escaninhos & Regularização Financeira
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500">
                Extravios: Taxa fixa regulamentar R$ 30,00 por credencial
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Rack Portaria 1 (Slots 01-10) */}
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                  <span className="text-blue-900">Portaria 1 (P1) • Slots 01 a 10</span>
                  <span className="font-mono text-slate-700">{ocupadosP1} / 10 em uso</span>
                </div>
                <div className="grid grid-cols-10 gap-1 mb-1">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const ocupado = i < ocupadosP1;
                    return (
                      <div
                        key={i}
                        className={`h-4 rounded flex items-center justify-center text-[7px] font-bold font-mono border ${
                          ocupado ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                        title={`Slot ${i + 1}: ${ocupado ? 'Em uso' : 'Disponível'}`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>{10 - ocupadosP1} cartões livres</span>
                  <span className="text-emerald-700 font-bold">Verde: Livre • Âmbar: Em posse</span>
                </div>
              </div>

              {/* Rack Portaria 2 (Slots 11-20) */}
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                  <span className="text-purple-900">Portaria 2 (P2) • Slots 11 a 20</span>
                  <span className="font-mono text-slate-700">{ocupadosP2} / 10 em uso</span>
                </div>
                <div className="grid grid-cols-10 gap-1 mb-1">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const ocupado = i < ocupadosP2;
                    return (
                      <div
                        key={i}
                        className={`h-4 rounded flex items-center justify-center text-[7px] font-bold font-mono border ${
                          ocupado ? 'bg-amber-500 text-white border-amber-600' : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                        title={`Slot ${i + 11}: ${ocupado ? 'Em uso' : 'Disponível'}`}
                      >
                        {i + 11}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>{10 - ocupadosP2} cartões livres</span>
                  <span className="text-emerald-700 font-bold">Verde: Livre • Âmbar: Em posse</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Tabelas de Detalhamento de Provisórios (Grid 2x2) */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Cautelas Ativas em Circulação
                  </span>
                  <span className="text-[9px] font-bold text-amber-700">{cautelasEmCirculacao.length} Ativas</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Colaborador</th>
                      <th className="py-1">Empresa</th>
                      <th className="py-1 text-center">Cartão</th>
                      <th className="py-1 text-right">Retirada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {cautelasEmCirculacao.length > 0 ? (
                      cautelasEmCirculacao.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[110px]">{item.colaborador || item.nome}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[90px]">{item.empresa || '-'}</td>
                          <td className="py-0.5 text-center font-mono font-bold text-blue-700">{item.cartao || '-'}</td>
                          <td className="py-0.5 text-right font-mono text-slate-600">{item.horaRetirada || item.hora || (item.dataRetirada && item.dataRetirada.length > 10 ? item.dataRetirada.slice(11, 16) : item.dataRetirada) || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="py-1 text-center text-slate-400">Nenhuma cautela ativa no momento</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Portaria 1: Slots 01 a 10 • Portaria 2: Slots 11 a 20</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Reincidentes no Mês (Regra 3 Acessos)
                  </span>
                  <span className="text-[9px] font-bold text-red-700">{reincidentesCount} Reincidentes</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Nome Colaborador</th>
                      <th className="py-1">Empresa</th>
                      <th className="py-1 text-right">Retiradas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tabelaReincidentes.length > 0 ? (
                      tabelaReincidentes.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[130px]">{item.nome || item.colaborador}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[90px]">{item.empresa || '-'}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-red-700">{item.totalAcessos || item.total} acessos</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhum reincidente no período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Critério: ≥ 3 retiradas exige justificativa da gerência</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-600" />
                    Extravios de Provisórios (Cobrança)
                  </span>
                  <span className="text-[9px] font-bold text-slate-600">{extraviosProvisorios.length} Pendentes</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Colaborador</th>
                      <th className="py-1">Cartão</th>
                      <th className="py-1 text-right">Empresa / Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {extraviosProvisorios.length > 0 ? (
                      extraviosProvisorios.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[120px]">{item.colaborador || item.nome}</td>
                          <td className="py-0.5 text-slate-700 font-mono font-bold">{item.cartao || 'Provisório'}</td>
                          <td className="py-0.5 text-right font-mono text-red-700 font-bold">R$ 30,00</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhum extravio pendente de quitação</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Ressarcimento padrão regulamentar: R$ 30,00 por credencial</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Building className="w-3 h-3 text-purple-600" />
                    Status das Portarias & Escaninho
                  </span>
                  <span className="text-[9px] font-bold text-purple-700">20 Slots Totais</span>
                </div>
                <div className="space-y-1 mt-1 text-[9px]">
                  <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-blue-950">Portaria 1 (P1) • Escaninho 01 a 10:</span>
                    <span className="font-mono font-bold text-slate-900">{ocupadosP1} / 10 em uso ({10 - ocupadosP1} disp.)</span>
                  </div>
                  <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-purple-950">Portaria 2 (P2) • Escaninho 11 a 20:</span>
                    <span className="font-mono font-bold text-slate-900">{ocupadosP2} / 10 em uso ({10 - ocupadosP2} disp.)</span>
                  </div>
                </div>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Disponibilidade física monitorada em tempo real</p>
            </div>
          </div>

          {/* Rodapé Oficial da Página 2 */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>CCO Security Suite • Central de Controle Operacional • Módulo 2: Provisórios</span>
            <span className="font-bold text-slate-700">{getRotuloPagina(2)}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PÁGINA 3: DASHBOARD 3 - VISITANTES & CONTROLE DE PORTARIAS
         ========================================================================= */}
      {mostrarD3 && (
        <div className={`cco-print-page p-4 bg-white ${ehModuloUnico || !mostrarD4 ? 'no-break' : 'page-break'}`}>
          {/* Cabeçalho da Página */}
          <div className="border-b-2 border-emerald-600 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {getRotuloPagina(3)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">CCO Security Suite • Central de Controle Operacional</span>
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                  DASHBOARD 3: VISITANTES & CONTROLE DE PORTARIAS
                </h1>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <div className="font-bold text-slate-900">
                <span className="text-slate-500 font-normal">Operador: </span>
                <span className="font-mono uppercase">{operadorAtivo}</span>
                {turnoAtivo && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px]">
                    {turnoAtivo}
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">
                <span>Período: {periodoNome}</span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span>Emissão: {dataEmissao} às {horaEmissao}</span>
              </div>
            </div>
          </div>

          {/* 4 Cards de Indicadores Principais */}
          <div className="grid grid-cols-4 gap-2.5 my-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Visitantes no Site</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">Em Trânsito</span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono my-1">{visitantesNoSiteCount}</div>
              <p className="text-[9px] text-slate-500 truncate">
                {noSiteP1} na Portaria 1 • {noSiteP2} na Portaria 2
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Fluxo do Dia (E / S)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">Hoje</span>
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono my-1">
                {entradasHojeCount} / {saidasHojeCount}
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                Total de entradas registradas vs saídas dadas baixa
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Vínculo Anfitrião</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-800">Auditados</span>
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono my-1">{pctAuditadosAnf}%</div>
              <p className="text-[9px] text-slate-500 truncate">
                Conformidade: Vínculo formal com colaborador da planta
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Escaninho Visitantes</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-100 text-purple-800">
                  {visitantesNoSiteCount} / 40 slots
                </span>
              </div>
              <div className="text-2xl font-black text-purple-600 font-mono my-1">{taxaOcupacaoVis}%</div>
              <p className="text-[9px] text-slate-500 truncate">
                {40 - visitantesNoSiteCount} crachás disponíveis nas portarias
              </p>
            </div>
          </div>

          {/* Seção Gráfica: Fluxo de Portarias & Escaninho de Crachás */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mb-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">
                  Controle Físico das Portarias & Recuperação Financeira de Crachás
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500">
                Extravios: {metricasVisitantes.totalPerdidos || 0} a cobrar • {metricasVisitantes.totalPagos || 0} pagos (R$ {(metricasVisitantes.valorRecuperado || 0).toFixed(2).replace('.', ',')})
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                  <span className="text-emerald-900">Portaria 1 (P1) • Crachás 01 a 20</span>
                  <span className="font-mono text-slate-700">{noSiteP1} / 20 em uso</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (noSiteP1 / 20) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>{20 - noSiteP1} crachás livres</span>
                  <span className="text-emerald-700 font-bold">Ocupação: {Math.round((noSiteP1 / 20) * 100)}%</span>
                </div>
              </div>

              <div className="p-2 bg-white rounded border border-slate-200">
                <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                  <span className="text-indigo-900">Portaria 2 (P2) • Crachás 21 a 40</span>
                  <span className="font-mono text-slate-700">{noSiteP2} / 20 em uso</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (noSiteP2 / 20) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between text-[8px] text-slate-500">
                  <span>{20 - noSiteP2} crachás livres</span>
                  <span className="text-indigo-700 font-bold">Ocupação: {Math.round((noSiteP2 / 20) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Tabelas de Visitantes (Grid 2x2) */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" />
                    Visitantes Atualmente no Site
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700">{visitantesNoSite.length} Presentes</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Visitante</th>
                      <th className="py-1">Empresa</th>
                      <th className="py-1">Anfitrião</th>
                      <th className="py-1 text-right">Crachá</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visitantesNoSite.length > 0 ? (
                      visitantesNoSite.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[100px]">{item.nome || item.visitante}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[80px]">{item.empresa || '-'}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[90px]">{item.anfitriao || '-'}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-emerald-700">{item.cracha || item.cartao || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="py-1 text-center text-slate-400">Nenhum visitante no momento</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Todos os visitantes devem registrar saída com devolução</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    Auditoria de Vínculos de Anfitriões
                  </span>
                  <span className="text-[9px] font-bold text-indigo-700">Ranking</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Anfitrião Responsável</th>
                      <th className="py-1">Empresa</th>
                      <th className="py-1 text-right">Total Visitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rankingAnfitrioes.length > 0 ? (
                      rankingAnfitrioes.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[130px]">{item.anfitriao}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[80px]">{item.empresa || '-'}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-indigo-700">{item.total || item.totalVisitas || 0} visitas</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Sem registros de anfitriões</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Vínculo auditado para conformidade com normas de acesso</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-600" />
                    Crachás de Visitantes Extraviados
                  </span>
                  <span className="text-[9px] font-bold text-slate-600">{extraviosVisitantes.length} a Cobrar</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Visitante</th>
                      <th className="py-1">Crachá</th>
                      <th className="py-1 text-right">Valor 2ª Via</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {extraviosVisitantes.length > 0 ? (
                      extraviosVisitantes.slice(0, 3).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[120px]">{item.visitante || item.nome}</td>
                          <td className="py-0.5 text-slate-700 font-mono font-bold">{item.cracha || item.cartao || 'Crachá'}</td>
                          <td className="py-0.5 text-right font-mono text-red-700 font-bold">R$ 30,00</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="py-1 text-center text-slate-400">Nenhum crachá de visitante extraviado pendente</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Cobrança e ressarcimento de 2ª via: R$ 30,00</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Building className="w-3 h-3 text-purple-600" />
                    Fluxo e Escaninho Visitantes
                  </span>
                  <span className="text-[9px] font-bold text-purple-700">40 Slots Totais</span>
                </div>
                <div className="space-y-1 mt-1 text-[9px]">
                  <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-emerald-950">Portaria 1 (P1) • Crachás 01 a 20:</span>
                    <span className="font-mono font-bold text-slate-900">{noSiteP1} / 20 em uso ({20 - noSiteP1} disp.)</span>
                  </div>
                  <div className="p-1 rounded bg-white border border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-indigo-950">Portaria 2 (P2) • Crachás 21 a 40:</span>
                    <span className="font-mono font-bold text-slate-900">{noSiteP2} / 20 em uso ({20 - noSiteP2} disp.)</span>
                  </div>
                </div>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Capacidade física de recepção das portarias monitorada</p>
            </div>
          </div>

          {/* Rodapé Oficial da Página 3 */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>CCO Security Suite • Central de Controle Operacional • Módulo 3: Visitantes</span>
            <span className="font-bold text-slate-700">{getRotuloPagina(3)}</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          PÁGINA 4: DASHBOARD 4 - SAÍDA DE CARTÃO RFID (CONTABILIDADE E FINANCEIRO)
         ========================================================================= */}
      {mostrarD4 && (
        <div className="cco-print-page p-4 bg-white no-break">
          {/* Cabeçalho da Página */}
          <div className="border-b-2 border-indigo-600 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {getRotuloPagina(4)}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">CCO Security Suite • Central de Controle Operacional</span>
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tight mt-0.5">
                  DASHBOARD 4: SAÍDA DE CARTÃO RFID (CONTABILIDADE E FINANCEIRO)
                </h1>
              </div>
            </div>

            <div className="text-right text-[10px] space-y-0.5">
              <div className="font-bold text-slate-900">
                <span className="text-slate-500 font-normal">Operador: </span>
                <span className="font-mono uppercase">{operadorAtivo}</span>
                {turnoAtivo && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[9px]">
                    {turnoAtivo}
                  </span>
                )}
              </div>
              <div className="text-slate-600 font-medium">
                <span>Período: {periodoNome}</span>
                <span className="mx-1.5 text-slate-300">•</span>
                <span>Emissão: {dataEmissao} às {horaEmissao}</span>
              </div>
            </div>
          </div>

          {/* 4 Cards de Indicadores Principais */}
          <div className="grid grid-cols-4 gap-2.5 my-2.5">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Rotativos de Serviços</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800">
                  {rotativosDisp} Disp.
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono my-1">
                {rotativosAtivos} / {rotativosTotal}
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                Intervalo 001 a 350 • {rotativosPerdidos} extraviados
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Fixos Nominais</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-100 text-indigo-800">
                  {fixosDisp} Disp.
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono my-1">
                {fixosAtivos} / {fixosTotal}
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                Credenciais de colaboradores fixos • {fixosPerdidos} extraviados
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Total a Cobrar (Geral)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-800">
                  {totalItensACobrarGeral} Itens
                </span>
              </div>
              <div className="text-2xl font-black text-red-600 font-mono my-1">
                R$ {totalValorACobrarGeral.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                Consolidação de 2ª via: RFID, Visitantes e Provisórios
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">Total Recuperado (Geral)</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-800">
                  {totalItensPagosGeral} Pagos
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono my-1">
                R$ {totalValorRecuperadoGeral.toFixed(2).replace('.', ',')}
              </div>
              <p className="text-[9px] text-slate-500 truncate">
                Ressarcimentos efetuados e confirmados em caixa
              </p>
            </div>
          </div>

          {/* Seção Gráfica: Gauge Circular & Auditoria Financeira */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mb-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-[11px] font-bold uppercase text-slate-900 tracking-wider">
                  Painel Centralizado de Cobrança de 2ª Via por Extravio
                </span>
              </div>
              <span className="text-[9px] font-semibold text-slate-500">
                Taxa fixa corporativa regulamentar: R$ 30,00 por credencial
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Gauge de Eficácia */}
              <div className="col-span-4 flex items-center justify-center border-r border-slate-200 pr-4">
                {renderGaugeFinanceiro(taxaEficaciaGeral)}
              </div>

              {/* Detalhamento dos Saldos Auditados */}
              <div className="col-span-8 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Módulo Provisórios</span>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    R$ {(metricasProvisorios.valorRecuperado || 0).toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[8px] text-emerald-700 font-bold">
                    {(metricasProvisorios.totalPerdas || 0) > 0 ? `${metricasProvisorios.totalPagos || 0}/${metricasProvisorios.totalPerdas || 0} Quitados` : '100% Regular'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Módulo Visitantes</span>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    R$ {(metricasVisitantes.valorRecuperado || 0).toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[8px] text-emerald-700 font-bold">
                    {(metricasVisitantes.totalPerdidos || 0) > 0 ? `${metricasVisitantes.totalPagos || 0}/${metricasVisitantes.totalPerdidos || 0} Quitados` : '100% Regular'}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[8px] uppercase font-bold text-slate-500">Módulo RFID Fixo/Rot.</span>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    R$ {(((metricasRfidContabilidade.rotativosPagos || 0) + (metricasRfidContabilidade.fixosPagos || 0)) * 30).toFixed(2).replace('.', ',')}
                  </div>
                  <span className="text-[8px] text-emerald-700 font-bold">
                    {(rotativosPerdidos + fixosPerdidos) > 0 ? `${(metricasRfidContabilidade.rotativosPagos || 0) + (metricasRfidContabilidade.fixosPagos || 0)} Quitados` : 'Sem pendências'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2 Tabelas Consolidadas da Gestão Financeira */}
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <Building className="w-3 h-3 text-indigo-600" />
                    Cobrança Consolidada por Empresa Contratada
                  </span>
                  <span className="text-[9px] font-bold text-slate-600">{resumoCobrancaPorEmpresa.length} Empresas</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Empresa Contratada</th>
                      <th className="py-1">Origens</th>
                      <th className="py-1 text-center">Qtd Pend.</th>
                      <th className="py-1 text-right">Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {resumoCobrancaPorEmpresa.length > 0 ? (
                      resumoCobrancaPorEmpresa.slice(0, 4).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[130px]">{item.empresa}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[90px]">
                            {item.origens || (item.porModulo ? Object.entries(item.porModulo).filter(([_, v]) => v > 0).map(([k, v]) => `${k}: ${v}`).join(', ') : 'RFID')}
                          </td>
                          <td className="py-0.5 text-center font-mono font-bold text-slate-900">{item.totalItens || item.qtd || 0}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-red-700">
                            R$ {(item.valorTotal || item.total || 0).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="py-1 text-center text-slate-400">Nenhuma pendência financeira ativa por empresa</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">Cruzamento de todas as ocorrências de extravio em aberto</p>
            </div>

            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-900 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-red-600" />
                    Central Geral de Pendências de 2ª Via (Todos Módulos)
                  </span>
                  <span className="text-[9px] font-bold text-slate-600">{tabelaInadimplentes.length} a Quitar</span>
                </div>
                <table className="w-full text-left text-[9px] mt-1 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                      <th className="py-1">Origem</th>
                      <th className="py-1">Colaborador / Cartão</th>
                      <th className="py-1">Empresa</th>
                      <th className="py-1 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tabelaInadimplentes.length > 0 ? (
                      tabelaInadimplentes.slice(0, 4).map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-0.5 text-slate-600 font-mono text-[8px]">{item.origem || item.modulo || 'RFID'}</td>
                          <td className="py-0.5 font-medium text-slate-900 truncate max-w-[110px]">{item.nome || item.colaborador} • {item.cartao}</td>
                          <td className="py-0.5 text-slate-600 truncate max-w-[80px]">{item.empresa || '-'}</td>
                          <td className="py-0.5 text-right font-mono font-bold text-red-700">
                            R$ {(item.valor ? item.valor.toFixed(2).replace('.', ',') : '30,00')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="py-1 text-center text-slate-400">Nenhuma pendência financeira de 2ª via ativa</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-slate-400 pt-1 border-t border-slate-200 mt-1">A quitação atualiza a base do módulo original e o inventário</p>
            </div>
          </div>

          {/* Rodapé Oficial da Página 4 */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
            <span>CCO Security Suite • Central de Controle Operacional • Módulo 4: RFID & Contabilidade</span>
            <span className="font-bold text-slate-700">{getRotuloPagina(4)}</span>
          </div>
        </div>
      )}

    </div>
  );
}
