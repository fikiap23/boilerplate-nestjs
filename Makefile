# =============================================================================
# Makefile - Boilerplate Nest
# =============================================================================

ENV_PROD ?= build/.env.production

COMPOSE_DEV       := -f build/docker-compose.yml
COMPOSE_PROD      := -f build/docker-compose.production.yml $(if $(ENV_PROD),--env-file $(ENV_PROD))
COMPOSE_MIGRATE   := -f build/docker-compose.migrate.yml --env-file build/.env.migrate

CONTAINER_DEV        := boilerplate-nest-dev
CONTAINER_PROD       := boilerplate-nest-production
CONTAINER_MIGRATE    := boilerplate-nest-migrate
CONTAINER_DB_MIGRATE := boilerplate-nest-database-postgres-migrate

# -----------------------------------------------------------------------------
# Dev (local development)
# -----------------------------------------------------------------------------
.PHONY: up down restart logs exec
up:
	docker compose $(COMPOSE_DEV) up -d
	docker logs -f $(CONTAINER_DEV)

down:
	docker compose $(COMPOSE_DEV) down

restart:
	docker restart $(CONTAINER_DEV)
	docker logs -f $(CONTAINER_DEV)

logs:
	docker logs -f $(CONTAINER_DEV)

exec:
	docker exec -it $(CONTAINER_DEV) sh

pull:
	docker compose $(COMPOSE_DEV) pull

# -----------------------------------------------------------------------------
# Production
# -----------------------------------------------------------------------------
.PHONY: up-prod down-prod restart-prod logs-prod exec-prod build-prod
up-prod:
	docker compose $(COMPOSE_PROD) up -d --build
	docker logs -f $(CONTAINER_PROD)

down-prod:
	docker compose $(COMPOSE_PROD) down

restart-prod:
	docker compose $(COMPOSE_PROD) restart $(CONTAINER_PROD)
	docker logs -f $(CONTAINER_PROD)

logs-prod:
	docker logs -f $(CONTAINER_PROD)

exec-prod:
	docker exec -it $(CONTAINER_PROD) sh

build-prod:
	docker compose $(COMPOSE_PROD) build --no-cache

# -----------------------------------------------------------------------------
# Migration
# -----------------------------------------------------------------------------
.PHONY: up-migrate down-migrate logs-migrate exec-migrate reset-migrate
up-migrate:
	docker compose $(COMPOSE_MIGRATE) up -d --build
	docker logs -f $(CONTAINER_MIGRATE)

down-migrate:
	docker compose $(COMPOSE_MIGRATE) down

logs-migrate:
	docker logs -f $(CONTAINER_MIGRATE)

exec-migrate:
	docker exec -it $(CONTAINER_MIGRATE) sh

reset-migrate:
	docker compose $(COMPOSE_MIGRATE) down -v

# -----------------------------------------------------------------------------
# Utils
# -----------------------------------------------------------------------------
.PHONY: network
network:
	docker network create boilerplate-network 2>/dev/null || true
