/**
 * Re-exporta o módulo central de criptografia localizado em electron/cryptoHelper.cjs
 * Garante fonte única de verdade compatível com Vite e Electron empacotado
 */
module.exports = require('../../electron/cryptoHelper.cjs');
