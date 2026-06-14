ifneq (,$(wildcard .env))
    include .env
    DATABASE_URL := $(subst ",,$(subst ',,$(DATABASE_URL)))
    JWT_SECRET := $(subst ",,$(subst ',,$(JWT_SECRET)))
    CORS_ORIGIN := $(subst ",,$(subst ',,$(CORS_ORIGIN)))
    export
endif

# Gohite BizSphere Makefile

.PHONY: help setup start stop test build backup db-migrate db-seed db-generate

help:
	@echo "Available commands:"
	@echo "  make setup        - Perform initial setup (env config, npm install, docker db, migrate, seed)"
	@echo "  make start        - Start the frontend and backend services in development mode"
	@echo "  make stop         - Stop the dockerized services (PostgreSQL)"
	@echo "  make test         - Run both backend and frontend test suites"
	@echo "  make build        - Build the frontend bundle for production"
	@echo "  make backup       - Create a full database backup"
	@echo "  make db-migrate   - Deploy pending database migrations"
	@echo "  make db-seed      - Seed the database with default metadata and admin account"
	@echo "  make db-generate  - Generate the Prisma ORM client"

setup:
	@echo "Copying environment variables..."
	@if [ ! -f .env ]; then cp .env.example .env; echo ".env created."; else echo ".env already exists. Skipping."; fi
	@echo "Installing dependencies..."
	npm install --ignore-scripts
	@echo "Starting database container..."
	docker compose up -d db
	@echo "Generating Prisma client..."
	npm run db:generate -w backend
	@echo "Running database migrations..."
	npm run db:migrate -w backend
	@echo "Seeding database..."
	npm run db:seed -w backend
	@echo "Setup complete!"

start:
	@echo "Starting database container..."
	docker compose up -d db
	@node scripts/wait-db.js
	@echo "Starting frontend and backend services..."
	npm run dev

stop:
	docker compose down

test:
	npm run test -w backend && npm run test -w frontend

build:
	npm run build -w frontend

backup:
	./scripts/backup.sh

db-migrate:
	npm run db:migrate -w backend

db-seed:
	npm run db:seed -w backend

db-generate:
	npm run db:generate -w backend
