import pytest

# Expense CRUD integration tests.
# Run with: docker-compose up -d mongo && pytest tests/test_expenses.py

@pytest.mark.anyio
async def test_placeholder():
    assert True
