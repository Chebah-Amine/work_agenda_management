.DEFAULT_GOAL := help
.PHONY: help install start android ios web clear test typecheck lint check env

help: ## Affiche cette aide
	@echo "Commandes disponibles :"
	@echo "  make install    Installe les dependances"
	@echo "  make start      Lance l'app (QR code pour Expo Go)"
	@echo "  make android    Lance l'app sur Android"
	@echo "  make ios        Lance l'app sur iOS (macOS uniquement)"
	@echo "  make web        Lance l'app dans le navigateur"
	@echo "  make clear      Lance l'app en vidant le cache Metro"
	@echo "  make test       Lance les tests unitaires"
	@echo "  make typecheck  Verifie les types TypeScript"
	@echo "  make lint       Lance le linter"
	@echo "  make check      Tests + types + lint"
	@echo "  make env        Cree le fichier .env a partir de .env.example"

install:
	npm install

start:
	npx expo start

android:
	npx expo start --android

ios:
	npx expo start --ios

web:
	npx expo start --web

clear:
	npx expo start --clear

test:
	npm test

typecheck:
	npm run typecheck

lint:
	npm run lint

check: test typecheck lint

env:
	node -e "const fs=require('fs'); if(fs.existsSync('.env')){console.log('.env existe deja')}else{fs.copyFileSync('.env.example','.env'); console.log('.env cree : renseignez les cles Firebase')}"
