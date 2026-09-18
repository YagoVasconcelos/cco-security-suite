import React, { useEffect } from 'react';

/**
 * Seletor abrangente para elementos focáveis válidos
 */
const FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'a[href]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])'
].join(', ');

/**
 * Retorna todas as subjanelas/modais atualmente abertas e visíveis no DOM
 */
function getOpenModals() {
  const overlays = Array.from(
    document.querySelectorAll('.fixed.inset-0, [role="dialog"], .modal-overlay')
  );

  return overlays.filter((el) => {
    if (!el || el.classList.contains('hidden') || el.style.display === 'none') {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return false;
    }
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    return true;
  });
}

/**
 * Retorna a subjanela/modal ativa no topo (top-most)
 */
function getTopmostModal() {
  const modals = getOpenModals();
  if (modals.length === 0) return null;
  if (modals.length === 1) return modals[0];

  return modals.reduce((top, current) => {
    if (!top) return current;
    const topZ = parseInt(window.getComputedStyle(top).zIndex, 10) || 0;
    const curZ = parseInt(window.getComputedStyle(current).zIndex, 10) || 0;
    if (curZ > topZ) return current;
    if (curZ < topZ) return top;
    const followingFlag = (typeof Node !== 'undefined' && Node.DOCUMENT_POSITION_FOLLOWING) ? Node.DOCUMENT_POSITION_FOLLOWING : 4;
    return (top.compareDocumentPosition(current) & followingFlag)
      ? current
      : top;
  }, null);
}

/**
 * Retorna os elementos focáveis visíveis dentro de um container
 */
function getFocusableElements(container) {
  if (!container) return [];
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  return elements.filter((el) => {
    if (el.disabled) return false;
    if (el.offsetParent === null && el.getClientRects().length === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  });
}

/**
 * Procura o gatilho ideal para fechar a subjanela ativa e executa o clique
 */
function triggerModalClose(modal) {
  if (!modal) return false;

  const buttons = Array.from(modal.querySelectorAll('button:not([disabled])'));

  // 1. Botão com atributo explícito data-modal-close
  const dataClose = buttons.find((btn) => btn.hasAttribute('data-modal-close'));
  if (dataClose) {
    dataClose.click();
    return true;
  }

  // 2. Botão de ícone 'X' (Lucide ou aria-label/title de fechar)
  const xButton = buttons.find((btn) => {
    const svg = btn.querySelector('svg');
    const aria = ((btn.getAttribute('aria-label') || '') + ' ' + (btn.getAttribute('title') || '')).toLowerCase();
    if (svg) {
      const cls = svg.getAttribute('class') || '';
      if (cls.includes('lucide-x')) return true;
    }
    return aria.includes('fechar') || aria.includes('close');
  });
  if (xButton) {
    xButton.click();
    return true;
  }

  // 3. Botão com texto "Cancelar"
  const cancelBtn = buttons.find((btn) => {
    const txt = btn.textContent.trim().toLowerCase();
    return txt === 'cancelar' || txt === 'cancel';
  });
  if (cancelBtn) {
    cancelBtn.click();
    return true;
  }

  // 4. Botão com texto "Fechar" ou "Voltar"
  const fecharBtn = buttons.find((btn) => {
    const txt = btn.textContent.trim().toLowerCase();
    return txt === 'fechar' || txt === 'voltar' || txt === 'close' || txt.startsWith('fechar ');
  });
  if (fecharBtn) {
    fecharBtn.click();
    return true;
  }

  // 5. Botão com aria-label ou title contendo fechar/cancelar/voltar
  const ariaBtn = buttons.find((btn) => {
    const aria = ((btn.getAttribute('aria-label') || '') + ' ' + (btn.getAttribute('title') || '')).toLowerCase();
    return aria.includes('cancelar') || aria.includes('fechar') || aria.includes('voltar') || aria.includes('close');
  });
  if (ariaBtn) {
    ariaBtn.click();
    return true;
  }

  // 6. Se o próprio backdrop/overlay tiver ação de clique para fechar
  try {
    modal.click();
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Gerenciador Global de Teclado para Subjanelas / Modais:
 * - ESC: Fecha imediatamente a subjanela ativa (topo)
 * - TAB / Shift+TAB: Enclausura (focus trap) a navegação estritamente na subjanela aberta
 * - Auto-foco: Move o foco para dentro da subjanela recém-aberta
 */
export default function ModalKeyboardManager() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeModal = getTopmostModal();
      if (!activeModal) return;

      // 1. TECLA ESC: Fecha a subjanela ativa
      if (e.key === 'Escape') {
        if (e.defaultPrevented) return;
        e.preventDefault();
        e.stopPropagation();
        triggerModalClose(activeModal);
        return;
      }

      // 2. TECLA TAB: Mantém o foco estritamente na subjanela ativa
      if (e.key === 'Tab') {
        const focusable = getFocusableElements(activeModal);

        if (focusable.length === 0) {
          // Sem elementos focáveis na modal, impede tab para o fundo
          e.preventDefault();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // Se o elemento ativo atual estiver fora da modal
        if (!activeModal.contains(document.activeElement)) {
          e.preventDefault();
          if (e.shiftKey) {
            lastElement.focus();
          } else {
            firstElement.focus();
          }
          return;
        }

        // Navegação reversa (Shift + Tab)
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Navegação direta (Tab)
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Usamos capture: true para garantir interceptação prioritária antes de outros elementos
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Guarda anti-vazamento de foco (se algo tentar focar no fundo enquanto a modal estiver aberta)
  useEffect(() => {
    const handleFocusIn = (e) => {
      const activeModal = getTopmostModal();
      if (!activeModal) return;

      // Se o elemento focado não pertence à subjanela ativa
      if (!activeModal.contains(e.target)) {
        const focusable = getFocusableElements(activeModal);
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  // Auto-foco inteligente ao abrir uma nova subjanela
  useEffect(() => {
    let lastModal = null;

    const observer = new MutationObserver(() => {
      const activeModal = getTopmostModal();
      if (activeModal && activeModal !== lastModal) {
        lastModal = activeModal;
        // Pequeno intervalo para renderização dos filhos
        setTimeout(() => {
          if (!activeModal.contains(document.activeElement)) {
            const focusable = getFocusableElements(activeModal);
            if (focusable.length > 0) {
              const firstInput = focusable.find((el) =>
                ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
              );
              const target = firstInput || focusable[0];
              target.focus();
            }
          }
        }, 50);
      } else if (!activeModal) {
        lastModal = null;
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
