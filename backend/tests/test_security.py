from app.core.config import settings
from app.core.security import create_refresh_token, decode_token


def test_default_jwt_secret_meets_hs256_minimum_key_length():
    assert len(settings.jwt_secret.encode()) >= 32


def test_refresh_tokens_are_unique_even_when_issued_back_to_back():
    first = create_refresh_token("42")
    second = create_refresh_token("42")

    assert first != second
    assert decode_token(first)["type"] == "refresh"
    assert decode_token(second)["type"] == "refresh"
