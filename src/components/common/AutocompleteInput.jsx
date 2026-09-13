import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Search, Check, FileBadge, Hash, ChevronRight } from 'lucide-react';
import {
  buscarPessoasUnificadas,
  buscarEmpresasUnificadas,
  sincronizarBaseUnificada,
  obterBaseUnificadaPessoas,
  obterBaseUnificadaEmpresas
} from '../../services/baseUnificadaService';

/**
 * Componente Reutilizável de Input com Autocomplete Inteligente
 * Conectado à Base Unificada Global de Cadastros (Provisórios, Visitantes, RFID, Ocorrências)
 */
export default function AutocompleteInput({
  value = '',
  onChange,
  onSelect,
  tipo = 'pessoa', // 'pessoa' | 'empresa'
  placeholder = '',
  label = '',
  required = false,
  disabled = false,
  className = '',
  inputClassName = '',
  icon: IconProp = null,
  uppercase = true
}) {
  const [sugestoes, setSugestoes] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  // Sincroniza a base ao montar o componente
  useEffect(() => {
    sincronizarBaseUnificada();
  }, []);

  // Fecha o menu suspenso ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca sugestões conforme o usuário digita
  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (val && val.trim().length >= 1) {
      if (tipo === 'pessoa') {
        const matches = buscarPessoasUnificadas(val, 8);
        setSugestoes(matches);
        setIsOpen(matches.length > 0);
      } else if (tipo === 'empresa') {
        const matches = buscarEmpresasUnificadas(val, 8);
        setSugestoes(matches);
        setIsOpen(matches.length > 0);
      }
      setSelectedIndex(-1);
    } else {
      // Se limpar o texto, mostra sugestões gerais recentes
      const iniciais = tipo === 'pessoa' 
        ? obterBaseUnificadaPessoas().slice(0, 8)
        : obterBaseUnificadaEmpresas().slice(0, 8);
      setSugestoes(iniciais);
      setIsOpen(iniciais.length > 0);
    }
  };

  // Foco no campo: sincroniza e exibe sugestões correspondentes ou recentes
  const handleFocus = () => {
    sincronizarBaseUnificada();
    if (value && value.trim().length >= 1) {
      if (tipo === 'pessoa') {
        const matches = buscarPessoasUnificadas(value, 8);
        setSugestoes(matches);
        setIsOpen(matches.length > 0);
      } else if (tipo === 'empresa') {
        const matches = buscarEmpresasUnificadas(value, 8);
        setSugestoes(matches);
        setIsOpen(matches.length > 0);
      }
    } else {
      const iniciais = tipo === 'pessoa' 
        ? obterBaseUnificadaPessoas().slice(0, 8)
        : obterBaseUnificadaEmpresas().slice(0, 8);
      if (iniciais.length > 0) {
        setSugestoes(iniciais);
        setIsOpen(true);
      }
    }
  };

  // Seleciona um item da lista
  const handleSelect = (item) => {
    if (tipo === 'pessoa') {
      onChange(item.nome);
      if (onSelect) onSelect(item);
    } else if (tipo === 'empresa') {
      onChange(typeof item === 'string' ? item : item.empresa || item);
      if (onSelect) onSelect(item);
    }
    setIsOpen(false);
    setSugestoes([]);
  };

  // Navegação por teclado
  const handleKeyDown = (e) => {
    if (!isOpen || sugestoes.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < sugestoes.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : sugestoes.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < sugestoes.length) {
        e.preventDefault();
        handleSelect(sugestoes[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const DefaultIcon = tipo === 'empresa' ? Building2 : User;
  const InputIcon = IconProp || DefaultIcon;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <InputIcon className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors ${
            uppercase ? 'uppercase' : ''
          } ${inputClassName}`}
          autoComplete="off"
        />
      </div>

      {/* Dropdown de sugestões flutuante */}
      {isOpen && sugestoes.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
          <div className="px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Sugestões da Base Unificada</span>
            <span className="text-indigo-400 font-mono text-[9px]">Global</span>
          </div>

          <div className="py-1">
            {sugestoes.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              if (tipo === 'pessoa') {
                return (
                  <button
                    key={item.nome + idx}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-800/40 last:border-0 ${
                      isSelected
                        ? 'bg-indigo-600/30 text-white'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 truncate">{item.nome}</span>
                        {item.origens && item.origens.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-mono shrink-0">
                            {item.origens[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                        {item.empresa && (
                          <span className="truncate text-slate-300 font-medium">
                            🏢 {item.empresa}
                          </span>
                        )}
                        {item.matricula && (
                          <span className="text-slate-400 font-mono shrink-0">
                            Mat: {item.matricula}
                          </span>
                        )}
                        {item.documento && (
                          <span className="text-slate-400 font-mono shrink-0">
                            Doc: {item.documento}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </button>
                );
              }

              // tipo === 'empresa'
              const nomeEmpresa = typeof item === 'string' ? item : item.empresa || item;
              return (
                <button
                  key={nomeEmpresa + idx}
                  type="button"
                  onClick={() => handleSelect(nomeEmpresa)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-800/40 last:border-0 ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white'
                      : 'text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="font-bold text-slate-100 truncate">{nomeEmpresa}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
