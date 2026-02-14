from app.modules.chat.service import _extract_stream_delta


def test_extract_stream_delta_returns_content():
    line = 'data: {"choices":[{"delta":{"content":"hello"}}]}'
    assert _extract_stream_delta(line) == "hello"


def test_extract_stream_delta_ignores_done_marker():
    assert _extract_stream_delta("data: [DONE]") == ""


def test_extract_stream_delta_ignores_invalid_payload():
    assert _extract_stream_delta("data: not-json") == ""
