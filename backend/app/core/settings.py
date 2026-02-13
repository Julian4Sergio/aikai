from __future__ import annotations

import os
from dataclasses import dataclass


def _parse_int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _parse_csv(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "dev")
    app_name: str = os.getenv("APP_NAME", "aikai-backend")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    request_timeout_ms: int = _parse_int("REQUEST_TIMEOUT_MS", 15000)
    default_edition: str = os.getenv("DEFAULT_EDITION", "personal")
    default_tenant_id: str = os.getenv("DEFAULT_TENANT_ID", "tenant_personal_default")
    backend_host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    backend_port: int = _parse_int("BACKEND_PORT", 8000)
    cors_allow_origins: tuple[str, ...] = tuple(
        _parse_csv("CORS_ALLOW_ORIGINS", "http://localhost:3000")
    )


SETTINGS = Settings()
