import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  FileSpreadsheet,
  Building,
  Printer,
  Download,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Check,
  CreditCard,
  KeyRound
} from 'lucide-react';

export default function RelatorioCobrancaModal({
  isOpen,
  onClose,
  inventario = [],
  onMarcarPago
}) {
  const [valorUnitario, setValorUnitario] = useState(30.0);
  const [empresaFiltro, setEmpresaFiltro] = useState('TODAS');
  const [termoBusca, setTermoBusca] = useState('');

  // Filtra todos os cartões com status PERDIDO (pendente de ressarcimento)
  const itensPerdidos = useMemo(() => {
    const lista = Array.isArray(inventario) ? inventario : [];
    return lista.filter(item => item && item.status === 'PERDIDO');
  }, [inventario]);

  // Lista de empresas que possuem pendências ativas
  const empresasComPendencia = useMemo(() => {
    const set = new Set();
    itensPerdidos.forEach(item => {
      if (item && item.empresa && item.empresa.trim()) {
        set.add(item.empresa.trim().toUpperCase());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [itensPerdidos]);

  // Itens filtrados para exibição
  const itensFiltrados = useMemo(() => {
    return itensPerdidos.filter(item => {
      const matchEmpresa = empresaFiltro === 'TODAS' || item.empresa === empresaFiltro;
      const termo = termoBusca.toLowerCase().trim();
      const matchBusca = !termo ||
        (item.colaborador && item.colaborador.toLowerCase().includes(termo)) ||
        (item.empresa && item.empresa.toLowerCase().includes(termo)) ||
        (item.codigoRfid && item.codigoRfid.toLowerCase().includes(termo)) ||
        (item.codigoImpresso && item.codigoImpresso.toLowerCase().includes(termo));

      return matchEmpresa && matchBusca;
    });
  }, [itensPerdidos, empresaFiltro, termoBusca]);

  // Resumo financeiro agrupado por Empresa
  const resumoPorEmpresa = useMemo(() => {
    const mapa = new Map();
    itensPerdidos.forEach(item => {
      const emp = item.empresa ? item.empresa.trim().toUpperCase() : 'NÃO ESPECIFICADA';
      if (!mapa.has(emp)) {
        mapa.set(emp, { empresa: emp, quantidade: 0, cartoes: [] });
      }
      const reg = mapa.get(emp);
      reg.quantidade += 1;
      reg.cartoes.push(item);
    });

    return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade);
  }, [itensPerdidos]);

  // Totais consolidados
  const totalCartoesACobrar = itensFiltrados.length;
  const valorTotalGeral = totalCartoesACobrar * valorUnitario;

  // Exportação para planilha CSV (formato Excel Brasil com UTF-8 BOM)
  const handleExportarCsv = () => {
    const dataHoje = new Date().toISOString().split('T')[0];
    const separador = ';';
    
    let csv = '\uFEFF'; // BOM para garantir acentos corretos no Excel
    csv += 'RELATORIO DE COBRANCA DE SEGUNDA VIA DE CREDENCIAIS - CCO SECURITY SUITE\n';
    csv += `Data de Emissao: ${dataHoje};Valor Unitario Base: R$ ${valorUnitario.toFixed(2).replace('.', ',')}\n\n`;
    
    // Cabeçalho
    csv += ['EMPRESA', 'COLABORADOR', 'RFID (CHAVE)', 'VERSO / CARTÃO', 'TIPO', 'DATA REGISTRO', 'VALOR (R$)', 'STATUS COBRANÇA'].join(separador) + '\n';
    
    // Linhas
    itensFiltrados.forEach(item => {
      const colab = (item.colaborador || '-').replace(/;/g, ' ');
      const emp = (item.empresa || '-').replace(/;/g, ' ');
      const rfid = item.codigoRfid || '-';
      const verso = item.codigoImpresso || item.numeroRotativo || '-';
      const tipo = item.tipo === 'ROTATIVO' ? 'Serviços Rotativo' : 'Fixo Nominal';
      const dataReg = item.dataLiberacao ? item.dataLiberacao.split('-').reverse().join('/') : '-';
      const valStr = valorUnitario.toFixed(2).replace('.', ',');
      const statusStr = 'PENDENTE DE RESSARCIMENTO (A COBRAR)';

      csv += [emp, colab, rfid, verso, tipo, dataReg, valStr, statusStr].join(separador) + '\n';
    });

    // Linha de Total
    csv += '\n';
    csv += ['', 'TOTAL GERAL', '', '', `${totalCartoesACobrar} cartoes`, '', valorTotalGeral.toFixed(2).replace('.', ','), 'A RECEBER'].join(separador) + '\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cobranca_segunda_via_cco_${dataHoje}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Impressão formal do documento
  const handleImprimir = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  GESTÃO FINANCEIRA
                </span>
                <span className="text-[11px] text-slate-500">• 2ª Via & Extravios</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Relatório de Cobrança e Ressarcimento por Empresa
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL (SCROLLÁVEL) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* CARDS DE RESUMO FINANCEIRO E CONFIGURAÇÃO DE VALOR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Empresas Inadimplentes */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Empresas com Pendência
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-white">{empresasComPendencia.length}</span>
                <span className="text-xs text-slate-400">fornecedores/terceiros</span>
              </div>
            </div>

            {/* Card 2: Cartões a Cobrar */}
            <div className="bg-slate-950 border border-red-900/40 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                Credenciais Extraviadas
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-red-400">{itensPerdidos.length}</span>
                <span className="text-xs text-red-300">a ressarcir</span>
              </div>
            </div>

            {/* Card 3: Configuração do Valor Unitário */}
            <div className="bg-slate-950 border border-amber-900/40 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label htmlFor="input-valor-unitario" className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  Valor Unitário da 2ª Via
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Editável</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-slate-400 font-bold font-mono">R$</span>
                <input
                  id="input-valor-unitario"
                  type="number"
                  step="1.00"
                  min="0"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-base font-black text-amber-300 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="text-[10px] text-slate-500">/ crachá</span>
              </div>
            </div>

            {/* Card 4: Faturamento Total a Cobrar */}
            <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4">
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Total a Faturar / Cobrar
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">
                  R$ {valorTotalGeral.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          {/* FILTROS DO RELATÓRIO */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Busca textual */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por colaborador, empresa ou RFID..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Dropdown de Empresa */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={empresaFiltro}
                onChange={(e) => setEmpresaFiltro(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold max-w-[200px] truncate cursor-pointer"
              >
                <option value="TODAS">Todas as Empresas ({empresasComPendencia.length})</option>
                {empresasComPendencia.map((emp, i) => (
                  <option key={i} value={emp}>{emp}</option>
                ))}
              </select>
              {empresaFiltro !== 'TODAS' && (
                <button
                  type="button"
                  onClick={() => setEmpresaFiltro('TODAS')}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
                  title="Mostrar todas"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* TABELA 1: CONSOLIDADO POR EMPRESA */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>Resumo Consolidado de Cobrança por Empresa</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {resumoPorEmpresa.length} empresa(s) listada(s)
              </span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {resumoPorEmpresa.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Nenhuma empresa com pendência de ressarcimento encontrada.
                </div>
              ) : (
                resumoPorEmpresa.map((r, i) => {
                  const subtotal = r.quantidade * valorUnitario;
                  const isSelected = empresaFiltro === r.empresa;
                  return (
                    <div
                      key={i}
                      className={`px-4 py-2.5 text-xs flex items-center justify-between gap-4 transition-colors ${
                        isSelected ? 'bg-amber-950/20' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-slate-100 truncate">{r.empresa}</span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                            Filtro Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0 font-mono">
                        <span className="text-red-400 font-bold">{r.quantidade} cartão(ões)</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-emerald-400 font-bold text-xs">
                          R$ {subtotal.toFixed(2).replace('.', ',')}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmpresaFiltro(isSelected ? 'TODAS' : r.empresa)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                        >
                          {isSelected ? 'Ver Todos' : 'Filtrar'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TABELA 2: LISTAGEM DISCRIMINADA DE CARTÕES A COBRAR */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-red-400" />
                <span>Discriminação Individual dos Cartões Extraviados ({itensFiltrados.length})</span>
              </h4>
              <span className="text-[11px] text-red-400 font-semibold">
                Status: Pendente de Cobrança
              </span>
            </div>

            {/* Cabeçalho da Tabela */}
            <div className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
              <div className="w-24 shrink-0">RFID (Chave)</div>
              <div className="w-20 shrink-0">Verso</div>
              <div className="flex-1 min-w-0 pr-2">Colaborador / Responsável</div>
              <div className="w-36 shrink-0 pr-2">Empresa</div>
              <div className="w-20 shrink-0 text-right font-mono">Valor</div>
              <div className="w-28 shrink-0 text-right">Ação Rápida</div>
            </div>

            {/* Linhas */}
            <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
              {itensFiltrados.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  Nenhum item pendente para os filtros selecionados.
                </div>
              ) : (
                itensFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs hover:bg-slate-900/60 transition-colors"
                  >
                    {/* RFID */}
                    <div className="w-24 shrink-0">
                      <span className="font-mono text-[11px] font-bold text-indigo-100 bg-indigo-500/25 px-2 py-0.5 rounded border border-indigo-400/40">
                        {item.codigoRfid}
                      </span>
                    </div>

                    {/* Verso */}
                    <div className="w-20 shrink-0 font-mono text-[11px] text-slate-400">
                      {item.codigoImpresso || item.numeroRotativo || '-'}
                    </div>

                    {/* Colaborador */}
                    <div className="flex-1 min-w-0 pr-2 truncate">
                      <span className="font-bold text-slate-100">{item.colaborador}</span>
                    </div>

                    {/* Empresa */}
                    <div className="w-36 shrink-0 pr-2 truncate text-slate-300 text-[11px]">
                      {item.empresa}
                    </div>

                    {/* Valor */}
                    <div className="w-20 shrink-0 text-right font-mono text-emerald-400 font-bold text-[11px]">
                      R$ {valorUnitario.toFixed(2).replace('.', ',')}
                    </div>

                    {/* Ação: Botão Pago */}
                    <div className="w-28 shrink-0 text-right">
                      <button
                        type="button"
                        onClick={() => onMarcarPago && onMarcarPago(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-sm shadow-emerald-950/40 transition-all cursor-pointer"
                        title="Confirmar quitação deste item e marcar como Pago"
                      >
                        <DollarSign className="w-3 h-3 text-emerald-200" />
                        <span>Marcar Pago</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RODAPÉ COM BOTÕES DE AÇÃO E EXPORTAÇÃO */}
        <div className="px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/70 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Total auditado:</span>
            <strong className="text-white font-mono">{totalCartoesACobrar} crachá(s)</strong>
            <span>•</span>
            <strong className="text-emerald-400 font-mono">
              R$ {valorTotalGeral.toFixed(2).replace('.', ',')}
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Exportar CSV */}
            <button
              type="button"
              onClick={handleExportarCsv}
              disabled={totalCartoesACobrar === 0}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              title="Baixar planilha formatada para o departamento financeiro"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel/CSV</span>
            </button>

            {/* Imprimir */}
            <button
              type="button"
              onClick={handleImprimir}
              disabled={totalCartoesACobrar === 0}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              title="Imprimir relatório formal de cobrança"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
