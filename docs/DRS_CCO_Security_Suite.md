# CCO Security Suite Rev 1.0 | TecPrimus Soluções Tecnológicas
**Desenvolvedor:** Yago Marinho | **Empresa:** TecPrimus Soluções Tecnológicas | **Versão:** Rev 1.0 (2026)  
**Contato:** [LinkedIn](https://www.linkedin.com/in/yago-marinho-b8a309141/) | [GitHub](https://github.com/YagoVasconcelos) | **E-mail:** tecprimus2021@outlook.com

---

# Documento de Requisitos de Software (DRS) — Rev 1.0

## 1. Visão Geral do Sistema

### 1.1 Escopo e Propósito
O **CCO Security Suite (Rev 1.0)** é uma plataforma corporativa nativa para desktop (Windows) projetada para a **Central de Controle Operacional (CCO)** de segurança patrimonial, facilities e inteligência de acesso em plantas industriais, complexos corporativos, centros logísticos e condomínios empresariais.

O sistema substitui formulários manuais em papel e planilhas descentralizadas por um ecossistema unificado, seguro e auditável, que contempla o ciclo de vida completo de registros de segurança:
* Emissão e custódia de Relatórios de Ocorrências (RO) com padrão corporativo oficial e impressão limpa;
* Controle de circulação de Credenciais Provisórias nas portarias de acesso (Portaria 1, Portaria 2, etc.) com alerta de reincidência;
* Gestão e monitoramento em tempo real do fluxo de Visitantes e terceiros com cronômetro de permanência;
* Gerenciamento e custódia de Chaves Mestras e Tags de Acesso RFID;
* Módulo corporativo de Backup & Restauração com algoritmo de Merge Inteligente (Anti-Duplicidade);
* Dashboard Executivo Analítico com geração automática de relatórios em PDF e bases consolidadas em Excel (.xlsx).

### 1.2 Objetivos Estratégicos
* **Padronização:** Uniformizar a taxonomia de locais, setores e naturezas operacionais da planta corporativa atendida.
* **Agilidade Operacional:** Reduzir o tempo de preenchimento e despacho de ocorrências pelos operadores da CCO.
* **Prevenção e Compliance:** Identificar reincidência de perdas e esquecimento de crachás sem expor valores monetários de cobrança (atendendo às diretrizes de governança corporativa e compliance).
* **Autonomia e Resiliência:** Operar 100% offline em redes locais sem dependência de internet ou servidores em nuvem externos.
* **Integridade Histórica:** Garantir a preservação e consolidação de registros durante reinstalações, migrações e manutenções de estações.

### 1.3 Arquitetura de Usuários e Separação Estrita de Papéis
O sistema implementa uma separação estrutural e conceitual rigorosa entre os atores da segurança corporativa:
1. **Operadores do Sistema (Central CCO):**
   * Únicos perfis com credenciais de login e acesso administrativo ao software da CCO.
   * Responsáveis pela operação direta do sistema desktop: emissão de ROs, liberação e baixa de credenciais provisórias e visitantes, gestão de claviculário RFID, alteração de parâmetros operacionais, visualização do Dashboard Executivo e execução de rotinas de backup/restauração.
2. **Efetivo de Vigilância de Campo:**
   * Cadastro dedicado exclusivamente aos profissionais alocados fisicamente nos postos operacionais externos (**Portaria 1**, **Portaria 2** e **Ronda**).
   * **Sem privilégios de acesso ao software:** Não possuem credenciais de login na CCO.
   * Constam na base de dados exclusivamente para fins de **rastreabilidade, responsabilidade operacional e vínculo formal** no ato de entrega e devolução física de crachás provisórios nas portarias.

---

## 2. Requisitos Funcionais (RF)

### [RF01] Emissão e Gestão de Relatórios de Ocorrências (RO)
* **RF01.1 - Numeração Única:** O sistema deve gerar automaticamente um identificador sequencial único para cada ocorrência no padrão `RO-YYYY-XXXXX`.
* **RF01.2 - Metadados Obrigatórios:** Cada RO deve registrar Data, Hora, Turno Operacional, Operador Responsável, Prédio do Site, Setor/Área, Tópico/Natureza e Grau de Severidade (Baixa, Média, Alta, Crítica).
* **RF01.3 - Registro de Envolvidos:** Suporte à inclusão dinâmica de múltiplos colaboradores envolvidos, contendo Nome, Empresa Prestadora, Cargo, Matrícula e Tipo de Envolvimento (Notificante, Vítima, Autor, Testemunha).
* **RF01.4 - Evidências Fotográficas:** Upload e compressão de fotos anexas com pré-visualização, legenda padronizada (`Anexo X - Legenda`) e exclusão antes do envio.
* **RF01.5 - Template Linear Estrito e Impressão Limpa:**
  * O documento gerado para visualização, exportação em PDF e impressão nativa (`@media print`) deve obedecer a uma estrutura linear estrita, sem desalinhamentos e isenta de qualquer poluição visual:
    1. **Topo:** Cabeçalho institucional azul escuro (`#0f172a`) com título `CCO SECURITY SUITE CENTRAL DE CONTROLE OPERACIONAL`, subtítulo com operador em maiúsculas (`SEGURANÇA PATRIMONIAL & CONTROLE DE ACESSO — OPERADOR: [NOME]`) e caixa lateral direita exclusiva contendo **APENAS** o Protocolo (`RO-2026-XXXX`) e a `GRAVIDADE: [BAIXA/MÉDIA/ALTA]`.
    2. **Subtítulo:** Identificação destacada `RELATÓRIO DE OCORRÊNCIA (RO)` e texto oficial: *"Documento emitido para apuração, registro de fatos e controle da segurança patrimonial"*.
    3. **Aprovadores (Grid Superior):** Três blocos organizados em linha única no topo (`GERENTE DE SITE` - Aprovação Executiva, `COORDENAÇÃO DE SEGURANÇA` - Supervisão Técnica, `FISCAL DE CONTRATO` - Fiscalização e Auditoria), nunca posicionados no meio do texto ou rodapé.
    4. **Seção 1:** `1. DADOS GERAIS DO FATO` com tabela de Data do Fato, Horário, Prédio/Área (Local) e Tópico & Gravidade.
    5. **Título da Ocorrência:** Bloco destacado `TÍTULO: [NOME DA OCORRÊNCIA]`.
    6. **Seção 2:** `2. RELATO CRONOLÓGICO DOS FATOS` apresentado em texto corrido e fluido.
    7. **Seção 3:** `3. ENVOLVIDOS/IDENTIFICAÇÃO DE PESSOAS` com tabela formal limpa nas colunas `#`, `Nome Completo`, `Função / Cargo`, `Empresa` e `Matrícula`.
    8. **Seção 4:** `4. REGISTRO FOTOGRÁFICO / ANEXO DE IMAGENS` com fotos organizadas e legendadas como `Anexo X - [Legenda]`.
    9. **Rodapé Final:** Barra padrão do sistema contendo Protocolo, Operador, Data/Hora de emissão e paginação (`Página 1 de 1`).
  * **Proibição Estrita de Poluição Visual:** Isenção de caixas de assinatura complexas, rubricas picotadas no meio do texto, hashes visuais gigantes, tags duplicadas de status e campos de edição durante a impressão.
* **RF01.6 - Salvamento Multidestino:** Persistência automática do RO na base de dados JSON (`data/ocorrencias.json`), atualização concorrente da planilha consolidada (`ocorrencias.xlsx`) e gravação opcional de cópia do PDF na pasta de rede configurada (`MAPA DE CALOR/`).

### [RF02] Controle de Credenciais Provisórias (Portaria 1 e Portaria 2)
* **RF02.1 - Registro de Retirada:** Lançamento de empréstimo de credenciais temporárias contendo Nome, Empresa, Número do Cartão Provisório, Portaria (P1 ou P2), Vigilante de Campo Responsável, Data, Horário e Motivo/Observação.
* **RF02.2 - Alerta de Reincidência Operacional (Regra dos 3 Acessos):** Cálculo dinâmico das retiradas do mesmo colaborador no mês civil corrente. Ao atingir 4 ou mais retiradas, a interface exibe compulsoriamente o alerta vermelho `REINCIDENTE`.
* **RF02.3 - Baixa e Devolução:** Ação rápida de retorno com registro automático de data/hora, vínculo do vigilante receptor e cálculo da permanência.
* **RF02.4 - Gestão de Inadimplência e Perdas:** Marcação de status de crachás perdidos ou avariados, encaminhando para o painel de auditoria sem exibição de valores financeiros.

### [RF03] Controle de Acesso e Permanência de Visitantes
* **RF03.1 - Grid de Slots Visuais:** Painel com cartões visuais que identificam os crachás de visitantes disponíveis (Verde/Livre) e em uso (Azul/Ocupado) por portaria.
* **RF03.2 - Cadastro de Entrada:** Modal simplificado contendo Nome Completo, Documento Oficial (RG/CPF), Empresa, Anfitrião/Setor Interno de Contato, Portaria e Crachá Vinculado.
* **RF03.3 - Cronômetro de Permanência:** Contagem em tempo real da permanência do visitante no complexo.
* **RF03.4 - Checkout Rápido:** Registro de saída em 1 clique liberando o slot imediatamente para o próximo atendimento.

### [RF04] Gestão de Chaves e Dispositivos RFID
* **RF04.1 - Matriz de Chaves e Tags:** Inventário das chaves mestras de prédios, salas técnicas, cadeados perimetrais e tags de docas.
* **RF04.2 - Cadeia de Custódia:** Registro de solicitante, empresa, setor de destino, motivo e horário de retirada e devolução.

### [RF05] Dashboard Executivo e Inteligência Analítica
* **RF05.1 - Indicadores em Tempo Real (KPIs):** Totalizadores de Ocorrências, Provisórios Ativos, Visitantes no Site, Reincidências Ativas e Inadimplências Patrimoniais.
* **RF05.2 - Detalhamento Analítico:** 4 tabelas gerenciais estratégicas:
  1. *Alerta de Reincidência (Provisórios):* Colaboradores que ultrapassaram o teto mensal de 3 provisórios.
  2. *Inadimplência de Credenciais:* Crachás perdidos pendentes de ressarcimento (Nome, Empresa, Data — sem valores em R$).
  3. *Produtividade CCO:* Volume de atendimentos e ROs por Operador CCO.
  4. *Credenciais Provisórias Pendentes:* Cartões em circulação no complexo (>24h).
* **RF05.3 - Filtros Dinâmicos:** Filtragem instantânea por Mês/Ano e por Turno Operacional.
* **RF05.4 - Exportação Corporativa:**
  - Exportação em PDF A4 do Dashboard completo com gráficos e assinaturas institucionais.
  - Exportação da base de dados completa em planilha eletrônica Excel (`.xlsx`).

### [RF06] Gestão Administrativa e Parametrização Segura
* **RF06.1 - Bloqueio por Senha Mestra:** A rota/tela de Configurações é estritamente bloqueada, exigindo validação prévia de Senha Mestra corporativa (padrão: `admin123`).
* **RF06.2 - Gestão de Operadores CCO:** CRUD de operadores da central com login, matrícula e escala.
* **RF06.3 - Gestão de Efetivo de Vigilância:** CRUD do efetivo de campo (Portarias 1 e 2, Ronda) para vínculo em provisórios.
* **RF06.4 - CRUD de Turnos e Observações:** Parametrização de turnos de trabalho e justificativas oficiais de entrega de credenciais.
* **RF06.5 - Responsáveis da Planta:** Nomes do Gerente do Site, Coordenação de Segurança, Fiscal do Contrato e Caminho de Rede.

### [RF07] Módulo de Backup & Restauração (Merge Inteligente)
* **RF07.1 - Painel Administrativo Dedicado:** Disponível na aba de Configurações sob controle exclusivo do Administrador/Supervisor CCO.
* **RF07.2 - Exportação Unificada de Dados:**
  - Coleta automatizada de todos os arquivos JSON locais da aplicação (`ocorrencias`, `provisorios`, `visitantes`, `operadores`, `vigilantes`, `turnos`, `observacoes`, `rfid`, `responsaveis`, `seguranca`).
  - Acionamento da caixa de diálogo nativa do Windows via Electron (`dialog.showSaveDialog`) com sugestão automática de nome estruturado (`backup_cco_YYYY-MM-DD_HH-mm-ss.json`).
  - Fallback automático para download direto via navegador web em caso de execução fora do ambiente Electron.
* **RF07.3 - Restauração Segura com Merge Inteligente (Anti-Duplicidade):**
  - Seleção nativa de arquivo via `dialog.showOpenDialog`.
  - Mecanismo de comparação inteligente por chaves primárias e protocolos únicos:
    - *Ocorrências:* Protocolo oficial `numeroRO` (ex: `RO-2026-XXXX`) ou `id`.
    - *Provisórios:* `id` ou chave composta `${cartao}_${colaborador}_${dataRetirada}_${horaRetirada}`.
    - *Visitantes:* `id` ou chave composta `${documento}_${dataEntrada}_${horaEntrada}`.
    - *Operadores & Vigilantes:* `matricula` corporativa funcional única.
    - *Turnos & Observações:* Nome normalizado ou `id`.
    - *RFID:* `numeroCartao`, `codigoHex` ou `id`.
  - **Preservação de Dados Atuais:** Registros já existentes no sistema local são 100% preservados.
  - **Prevenção de Duplicidades:** Registros repetidos no backup são ignorados.
  - **Integração de Inéditos:** Apenas registros ausentes são mesclados na base ativa.
  - Atualização síncrona dos arquivos `.json` e da planilha consolidada `.xlsx`.
* **RF07.4 - Diagnóstico Prévio e Relatório Pós-Fusão:**
  - Modal com pré-análise quantitativa (registros no arquivo, novos a integrar, já existentes e duplicidades evitadas).
  - Modal de feedback pós-restauração com relatório discriminado por entidade operacional.

---

## 3. Requisitos Não Funcionais (RNF)

| Identificador | Categoria | Descrição |
| :--- | :--- | :--- |
| **RNF01** | **Interface & UX** | Interface construída com React 18, Tailwind CSS, Lucide Icons. Tema escuro corporativo (*Dark Glassmorphism*) na CCO e impressão nítida em folha branca no modo relatório. |
| **RNF02** | **Arquitetura Desktop** | Executável nativo empacotado em **Electron 44** com **electron-builder**. A janela abre maximizada, sem barra de menus de navegador, sem URLs visíveis e com atalhos de sistema. |
| **RNF03** | **Persistência Local** | Os dados são mantidos em arquivos JSON na pasta `data/`, acessíveis via servidor HTTP Node.js local (`127.0.0.1`), garantindo integridade sem necessidade de SGBD pesado (MySQL/Oracle). |
| **RNF04** | **Independência de Rede** | Operação 100% offline em redes locais e estações ilhadas, sem dependência de internet ou APIs em nuvem. |
| **RNF05** | **Performance e Build** | Instalador Windows (.exe NSIS) e executável portátil (.exe Portable) otimizados com todos os assets locais embutidos. |
| **RNF06** | **Segurança de Execução** | Isolamento de contexto no processo renderer (`contextIsolation: true`), comunicação segura via `preload.cjs`, e proteção de rotas restritas por Senha Mestra. |
| **RNF07** | **Compatibilidade OS** | Suporte homologado para Windows 10 e Windows 11 (64 bits). |
| **RNF08** | **Fidelidade de Impressão** | Estilos estritos `@media print` que ocultam botões, menus e cabeçalhos de sistema, forçando visualização limpa do documento corporativo oficial. |

---

## 4. Regras de Negócio Cruciais (RN)

### [RN01] Isolamento Administrativo por Senha Mestra
* O acesso às configurações de efetivo, turnos, motivos, responsáveis e ao módulo de Backup/Restauração é restrito à liderança da CCO.
* Senha padrão inicial: **`admin123`**.

### [RN02] Matriz de Taxonomia Estruturada e Parametrizável
* Padronização rigorosa de Prédios, Áreas/Setores e Tópicos Oficiais de Ocorrência (16 naturezas padrão) para garantir consistência estatística e integridade em auditorias.

### [RN03] Proibição Estrita de Exibição de Valores Financeiros
* A gestão financeira compete a processos externos de Facilities/RH. O sistema **nunca** exibe valores em dinheiro em tabelas de perdas de crachás, relatórios impressos ou exportações Excel, reportando apenas: *Nome, Empresa Prestadora e Data da Perda*.

### [RN04] Regra de Reincidência de Credenciais (3 Acessos/Mês)
* Cada colaborador pode retirar até 3 provisórios no mesmo mês civil. A partir da **4ª retirada**, é classificado compulsoriamente como **REINCIDENTE**, gerando alerta vermelho na portaria e destaque no Dashboard Executivo.

### [RN05] Separação de Papéis: Operadores CCO vs Vigilância de Campo
* Operadores CCO detêm login e operam o software da central. O Efetivo de Vigilância de Campo (P1, P2, Ronda) é cadastrado exclusivamente para atribuição de responsabilidade física na entrega e recebimento de provisórios, sem acesso às telas do sistema.

### [RN06] Integridade de Backup e Fusão Não-Destrutiva
* A restauração de dados nunca apaga a base local. O algoritmo de Merge Inteligente compara protocolos únicos (`RO-2026-XXXX`) e chaves primárias para consolidar informações de múltiplos postos ou períodos sem criar duplicidades.

### [RN07] Padronização Visual e Impressão Limpa do Relatório de Ocorrência
* Todo RO gerado segue estritamente a sequência linear oficial (Topo com Protocolo/Gravidade -> Subtítulo -> Grid Superior de Aprovadores -> Seção 1 -> Título -> Seção 2 -> Seção 3 -> Seção 4 -> Rodapé Padrão), sem caixas de assinatura complexas, sem hashes gigantes e sem elementos poluentes na folha de impressão.

### [RN08] Persistência Resiliente e Salvamento Concorrente de Exportações
* O salvamento de relatórios e ocorrências é concorrente e tolerante a falhas: grava na pasta de rede informada pelo operador em Configurações (`caminhoRede`) e espelha compulsoriamente no diretório seguro do Windows (`%USERPROFILE%\Documents\CCO Security Suite\exports`). Se a pasta de rede estiver inacessível, a emissão não é interrompida e a via local é preservada com notificação em tela.

---
*Documento aprovado e homologado para a Release Oficial Rev 1.0 (Produção).*

