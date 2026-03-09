import pytest

# User management integration tests.
# Run with: docker-compose up -d mongo && pytest tests/test_users.py

@pytest.mark.anyio
async def test_placeholder():
    assert True
