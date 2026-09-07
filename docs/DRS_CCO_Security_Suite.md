# CCO Security Suite v1.0 | TecPrimus Soluções Tecnológicas
**Desenvolvedor:** Yago Marinho | **Empresa:** TecPrimus Soluções Tecnológicas | **Versão:** 1.0 (2026)  
**Contato:** [LinkedIn](https://www.linkedin.com/in/yago-marinho-b8a309141/) | [GitHub](https://github.com/YagoVasconcelos) | **E-mail:** tecprimus2021@outlook.com

---

# Documento de Requisitos de Software (DRS)

## 1. Visão Geral do Sistema

### 1.1 Escopo e Propósito
O **CCO Security Suite** é uma plataforma corporativa e nativa para desktop (Windows) projetada para a **Central de Controle Operacional (CCO)** de segurança patrimonial, facilities e inteligência de acesso em plantas industriais, complexos corporativos, centros logísticos e condomínios empresariais. 

O sistema substitui formulários manuais em papel e planilhas descentralizadas por um ecossistema unificado, seguro e auditável, que contempla o ciclo de vida completo de registros de segurança:
* Emissão e custódia de Relatórios de Ocorrências (RO);
* Controle de circulação de Credenciais Provisórias nas portarias de acesso (Portaria 1, Portaria 2, etc.);
* Gestão e monitoramento em tempo real do fluxo de Visitantes e terceiros;
* Gerenciamento e custódia de Chaves Mestras e Tags de Acesso RFID;
* Dashboard Executivo Analítico com geração automática de relatórios em PDF e bases consolidadas em Excel.

### 1.2 Objetivos Estratégicos
* **Padronização:** Uniformizar a taxonomia de locais, setores e naturezas operacionais da planta corporativa atendida.
* **Agilidade Operacional:** Reduzir o tempo de preenchimento e despacho de ocorrências pelos operadores da CCO.
* **Prevenção e Compliance:** Identificar reincidência de perdas e esquecimento de crachás sem expor valores monetários de cobrança (atendendo às diretrizes de governança corporativa e compliance).
* **Autonomia e Resiliência:** Operar 100% offline em redes locais sem dependência de internet ou servidores em nuvem externos.

---

## 2. Requisitos Funcionais (RF)

### [RF01] Emissão e Gestão de Relatórios de Ocorrências (RO)
* **RF01.1 - Numeração Única:** O sistema deve gerar automaticamente um identificador sequencial único para cada ocorrência no padrão `RO-YYYY-XXXXX`.
* **RF01.2 - Metadados Obrigatórios:** Cada RO deve registrar Data, Hora, Turno Operacional, Operador Responsável, Prédio do Site, Setor/Área, Tópico/Natureza e Grau de Severidade (Baixa, Média, Alta, Crítica).
* **RF01.3 - Registro de Envolvidos:** Suporte à inclusão dinâmica de múltiplos colaboradores envolvidos, contendo Nome, Empresa Prestadora, Cargo e Tipo de Envolvimento (Autor, Vítima, Testemunha, Notificante).
* **RF01.4 - Evidências Fotográficas:** Upload e compressão de fotos anexas com pré-visualização, legenda e exclusão antes do envio.
* **RF01.5 - Geração Documental:** Geração imediata de relatório formatado em PDF A4 com layout executivo, brasão/logo da CCO e blocos formais para assinaturas do Gerente do Site, Coordenação de Segurança e Fiscal do Contrato.
* **RF01.6 - Salvamento Multidestino:** Persistência automática do RO na base de dados JSON (`data/ocorrencias.json`), atualização concorrente da planilha consolidada (`ocorrencias.xlsx`) e salvamento automático de cópia do PDF no caminho de rede corporativo (`MAPA DE CALOR/`).

### [RF02] Controle de Credenciais Provisórias (Portaria 1 e Portaria 2)
* **RF02.1 - Registro de Retirada:** Lançamento de empréstimo de credenciais temporárias para colaboradores contendo Nome, Empresa, Número do Cartão Provisório, Portaria (P1 ou P2), Data, Horário e Motivo/Observação (ex: Esqueceu, Perdeu, Com Defeito).
* **RF02.2 - Alerta de Reincidência Operacional (Regra dos 3 Acessos):** O sistema deve calcular dinamicamente a quantidade de retiradas efetuadas pelo mesmo colaborador dentro do mês corrente. Ao atingir 4 ou mais retiradas, a interface deve exibir um crachá de alerta visual vermelho destacado (`REINCIDENTE`).
* **RF02.3 - Baixa e Devolução:** Ação rápida de devolução com carimbo de data/hora automática e cálculo do tempo total de permanência.
* **RF02.4 - Gestão de Inadimplência e Perdas:** Marcação de status de crachás perdidos ou avariados, registrando data da perda e encaminhando para a tabela de cobrança administrativa do Dashboard.

### [RF03] Controle de Acesso e Permanência de Visitantes
* **RF03.1 - Grid de Slots Visuais:** Painel intuitivo organizado em cartões/slots que identificam os crachás de visitantes atualmente em uso e os disponíveis por portaria.
* **RF03.2 - Cadastro de Entrada:** Modal simplificado para registro rápido contendo Nome Completo, Documento (RG/CPF), Empresa de Origem, Pessoa ou Setor de Contato Interno (Anfitrião), Portaria de Entrada e Crachá Vinculado.
* **RF03.3 - Cronômetro de Permanência:** Exibição do tempo decorrido desde a entrada para identificação de visitas que excederam a jornada regular.
* **RF03.4 - Checkout Rápido:** Registro de saída em 1 clique com liberação imediata do slot do crachá para o próximo visitante.

### [RF04] Gestão de Chaves e Dispositivos RFID
* **RF04.1 - Matriz de Chaves e Tags:** Inventário das chaves mestras dos prédios, cadeados perimetrais e tags de docas/veículos.
* **RF04.2 - Custódia e Cautela:** Registro de quem retirou a chave (Operador/Prestador), horário de retirada, destinação e assinatura digital de baixa no momento da devolução.

### [RF05] Dashboard Executivo e Inteligência Analítica
* **RF05.1 - Indicadores em Tempo Real (KPIs):** Totalizadores de Ocorrências no período, Provisórios Ativos, Visitantes no Site, Reincidências Ativas e Inadimplências Patrimoniais.
* **RF05.2 - Detalhamento Analítico:** 4 tabelas de apoio à tomada de decisão gerencial:
  1. *Alerta de Reincidência (Provisórios):* Nome, Empresa e Qtd de Acessos no Mês.
  2. *Inadimplência de Credenciais:* Crachás perdidos pendentes de ressarcimento (Nome, Empresa, Data da Perda — sem valores em R$).
  3. *Produtividade CCO:* Ranking de emissão de ROs por Operador CCO.
  4. *Credenciais Provisórias Pendentes:* Cartões em circulação no site.
* **RF05.3 - Filtros Dinâmicos:** Filtragem instantânea por Mês/Ano e por Turno Operacional (12x36 Diurno, 12x36 Noturno, Administrativo).
* **RF05.4 - Exportação Corporativa:**
  - Exportação em PDF A4 do Dashboard completo, com paginação limpa (`page-break-inside: avoid`), cabeçalhos estilizados e rodapé de assinaturas.
  - Exportação da base de dados completa em planilha eletrônica Excel (`.xlsx`).

### [RF06] Gestão Administrativa e Parametrização Segura
* **RF06.1 - Bloqueio por Senha Mestra:** A rota/tela de Configurações deve ser rigorosamente bloqueada. O operador só acessa após validar a Senha Mestra corporativa.
* **RF06.2 - CRUD de Turnos:** Adicionar, editar e inativar turnos operacionais (padrão: 12x36 Diurno, 12x36 Noturno e Administrativo).
* **RF06.3 - CRUD de Observações Padrão:** Gerenciar motivos de concessão de provisórios (ESQUECEU, PERDEU, COM DEFEITO, RETIDO, OUTROS).
* **RF06.4 - CRUD de Operadores CCO:** Cadastrar matrícula, nome e escala dos operadores autorizados.
* **RF06.5 - Responsáveis do Site:** Configuração centralizada dos nomes do Gerente do Site, Coordenador de Segurança, Fiscal do Contrato e Caminho de Rede para gravação de arquivos.
* **RF06.6 - Gestão de Senha:** Formulário para alteração da Senha Mestra com persistência local criptografada/protegida.

---

## 3. Requisitos Não Funcionais (RNF)

| Identificador | Categoria | Descrição |
| :--- | :--- | :--- |
| **RNF01** | **Interface & UX** | Interface construída com React 18, Tailwind CSS, Lucide Icons. Tema escuro corporativo (*Dark Glassmorphism*) na CCO e telas de operação de alto contraste visual. |
| **RNF02** | **Arquitetura Desktop** | Executável nativo empacotado em **Electron 44** com **electron-builder**. A janela deve abrir maximizada, sem barra de menus de navegador, sem URLs visíveis e com atalhos de sistema. |
| **RNF03** | **Persistência Local** | Os dados devem ser salvos em arquivos JSON formatados na pasta `data/`, acessíveis via servidor HTTP Node.js local embutido (`127.0.0.1`), garantindo integridade sem necessidade de SGBD pesado (MySQL/Oracle). |
| **RNF04** | **Independência de Rede** | O sistema não deve realizar chamadas para servidores em nuvem públicos. O software opera em estações ilhadas ou intranet local. |
| **RNF05** | **Performance de Build** | O instalador Windows (`.exe` NSIS) e a versão portátil (`Portable .exe`) devem possuir empacotamento otimizado (tamanho ~105MB a 120MB) com todos os assets locais embutidos. |
| **RNF06** | **Segurança de Execução** | Isolamento de contexto no processo renderer (`contextIsolation: true`), comunicação segura via `preload.cjs`, e interceptação de links externos para abertura forçada no navegador padrão do SO. |
| **RNF07** | **Compatibilidade OS** | Suporte homologado para Windows 10 e Windows 11 (64 bits). |

---

## 4. Regras de Negócio Cruciais (RN)

### [RN01] Isolamento Administrativo por Senha Mestra
* O acesso às telas de parametrização de turnos, operadores, motivos e dados da contratante é restrito à liderança da CCO.
* A senha padrão inicial de fábrica é **`admin123`**.
* O operador não pode editar dados de assinaturas de rodapé ou caminhos de rede diretamente na tela de emissão de RO.

### [RN02] Matriz de Taxonomia Estruturada e Parametrizável
Para garantir consistência estatística e integridade dos relatórios, o sistema adota uma taxonomia fechada e parametrizável que evita discrepâncias de digitação manual e se adapta com facilidade a qualquer planta corporativa ou condomínio industrial. A estrutura padrão de referência contempla:

#### Exemplos de Prédios e Instalações (Customizáveis):
1. `PORTARIA PRINCIPAL (P1)`
2. `PORTARIA DE CARGA / SERVIÇOS (P2)`
3. `CENTRAL DE COMPOSTAGEM / MEIO AMBIENTE`
4. `ESPAÇO SAÚDE / AMBULATÓRIO`
5. `RESTAURANTE CENTRAL / REFEITÓRIO`
6. `LABORATÓRIO DE QUALIDADE & P&D`
7. `BIORREFINARIA / PROCESSAMENTO`
8. `PRÉDIO ADMINISTRATIVO (ADM)`
9. `HALL DE ACESSO PRINCIPAL`
10. `FÁBRICA / PLANTA DE MANUFATURA`
11. `GALPÃO LOGÍSTICO 1`
12. `GALPÃO LOGÍSTICO 2`
13. `DOCAS DE CARGA E DESCARGA`
14. `CENTRAL DE UTILIDADES`
15. `PARQUE DE TANCAGEM`
16. `CASA DE CALDEIRAS`
17. `CENTRO DE GESTÃO DE RESÍDUOS`

#### Áreas e Setores:
`INTERNA / OPERACIONAL`, `EXTERNA / PERÍMETRO`, `PÁTIO / CIRCULAÇÃO`, `CARGA E DESCARGA / DOCAS`, `LINHA DE PRODUÇÃO`, `ESCRITÓRIOS / ADM`, `ESTACIONAMENTO`, `VESTIÁRIOS / SANITÁRIOS`, `REFEITÓRIO / CONVIVÊNCIA`, `ALMOXARIFADO / ESTOQUE`, `CASA DE MÁQUINAS / SUBESTAÇÃO` e `OUTRA ÁREA`.

#### Tópicos Oficiais de Ocorrência:
`USO INDEVIDO DE EPI`, `NÃO UTILIZAÇÃO DE EPI`, `ARRASTA PALHETE`, `ERGONOMIA`, `FURTO`, `ALIMENTO`, `DESVIO DE CONDUTA`, `QUEBRA DE PROCEDIMENTO`, `USO DE CELULAR INDEVIDO`, `FONES DE OUVIDO`, `DANOS PATRIMONIAIS`, `QUASE ACIDENTE (Q.A)`, `ACIDENTE`, `DESCARTE INDEVIDO`, `QUEBRA DE ACESSO` e `AMBULÂNCIA`.

### [RN03] Proibição Estrita de Exibição de Valores Financeiros
* **Diretriz de Compliance e Neutralidade Financeira:** A gestão de custos, precificação e cobrança por extravio ou dano de credenciais compete exclusivamente aos processos e formulários administrativos externos da organização contratante (como Facilities, RH ou Controladoria).
* O CCO Security Suite **nunca** deve exibir valores em dinheiro (como `R$ 50,00`) em suas tabelas de inadimplência, relatórios impressos ou exportações em Excel, evitando conflitos de dados e divergências financeiras. O sistema reporta estritamente: *Nome do Colaborador, Empresa Prestadora e Data da Ocorrência da Perda*.

### [RN04] Regra de Reincidência de Credenciais (3 Acessos/Mês)
* Todo colaborador tem direito operacional de retirar até 3 credenciais provisórias dentro do mesmo mês civil (seja por motivo de esquecimento ou cartão danificado).
* A partir do **4º registro** no mesmo mês, o colaborador é classificado compulsoriamente como **REINCIDENTE**, gerando:
  1. Destaque visual vermelho no painel de provisórios;
  2. Inclusão imediata na tabela de "Alerta de Reincidência" do Dashboard Executivo para envio à liderança de RH/Segurança Empresarial da empresa prestadora.

---
*Documento aprovado e homologado para a Release 1.0.0 de Produção.*
