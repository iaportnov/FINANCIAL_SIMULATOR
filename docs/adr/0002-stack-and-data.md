# ADR-0002 — Технологический стек и слой данных

Статус: принято · Дата: 2026-06-18

## Контекст
Full-stack платформа, маленькая команда, цель — архитектура + MVP. Стек заранее
предпочтён командой: Python/FastAPI + React/TypeScript.

## Решение
- **Backend:** FastAPI, **async SQLAlchemy 2.0** + `asyncpg`, **Alembic** (единая
  история миграций на всю БД), `pydantic-settings` для конфигурации, `uv` для
  зависимостей.
- **БД:** PostgreSQL, одна на весь монолит.
- **Frontend:** React + TypeScript + Vite, **Mantine** (UI), **React Router**,
  **TanStack Query** (серверный стейт), **Zustand** (сессия), типы из OpenAPI
  через `openapi-typescript`.
- **Запуск:** Docker Compose (`db` + `backend` + `frontend`).

## Последствия
- (+) Идиоматичный для FastAPI async I/O; единые типы между фронтом и бэком.
- (+) Mantine ускоряет лепку MVP (формы/модалки/нотификации из коробки).
- (−) Async добавляет сложности (async-сессии, аккуратность в тестах) — осознанно
  принято вместо более простого sync.

## Альтернативы
- sync SQLAlchemy — проще, но команда выбрала async.
- Tailwind + shadcn/ui — гибче, но больше ручной сборки; выбран Mantine ради скорости.
