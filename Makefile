# Makefile - CCO Security Suite
# Automação de Comandos de Desenvolvimento, Compilação e Documentação

.PHONY: help install dev start build build-exe build-portable docs clean

help:
	@echo "=========================================================="
	@echo " CCO Security Suite - Central de Controle Operacional"
	@echo " TecPrimus Solucoes Tecnologicas"
	@echo "=========================================================="
	@echo "Comandos disponiveis:"
	@echo "  make install        - Instala as dependencias do projeto (npm install)"
	@echo "  make dev            - Inicia ambiente de desenvolvimento completo (Vite + Electron)"
	@echo "  make start          - Inicia o Electron a partir da build existente"
	@echo "  make build          - Compila o frontend React com Vite"
	@echo "  make build-exe      - Gera o instalador Windows (.exe / NSIS)"
	@echo "  make build-portable - Gera o executavel portatil para Windows"
	@echo "  make docs           - Regenera a documentacao em PDF homologada"
	@echo "  make clean          - Limpa caches e builds anteriores (clean:dist e clean:data)"
	@echo "=========================================================="

install:
	npm install

dev:
	npm run electron:dev

start:
	npm run electron:start

build:
	npm run build

build-exe:
	npm run build:exe

build-portable:
	npm run build:portable

docs:
	npm run generate:docs-pdf

clean:
	npm run clean:dist
	npm run clean:data
