from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_FILE, override=True)


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
    llm_provider: str = os.getenv("LLM_PROVIDER", "siliconflow").strip().lower()

    siliconflow_api_key: str = os.getenv("SILICONFLOW_API_KEY", "")
    siliconflow_base_url: str = os.getenv(
        "SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1"
    )
    siliconflow_model: str = os.getenv("SILICONFLOW_MODEL", "Qwen/Qwen2.5-7B-Instruct")
    siliconflow_system_prompt: str = os.getenv(
        "SILICONFLOW_SYSTEM_PROMPT",
        "你是 aikai 助手。请默认使用中文，清晰且简洁地回答；仅在用户明确要求其他语言时再切换。",
    )
    siliconflow_max_tokens: int = _parse_int("SILICONFLOW_MAX_TOKENS", 800)

    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    openai_system_prompt: str = os.getenv(
        "OPENAI_SYSTEM_PROMPT",
        "你是 aikai 助手。请默认使用中文，清晰且简洁地回答；仅在用户明确要求其他语言时再切换。",
    )
    openai_max_tokens: int = _parse_int("OPENAI_MAX_TOKENS", 800)


SETTINGS = Settings()
