from enum import Enum
from pydantic import BaseModel, Field


class Edition(str, Enum):
    PERSONAL = "personal"
    ENTERPRISE = "enterprise"


class ChatCompletionRequest(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    tenant_id: str = Field(min_length=1)
    edition: Edition


class ChatCompletionResponse(BaseModel):
    answer: str
    request_id: str
    latency_ms: int = Field(ge=0)


class ErrorResponse(BaseModel):
    error_code: str
    error_message: str
    request_id: str


class HealthResponse(BaseModel):
    status: str
    request_id: str
