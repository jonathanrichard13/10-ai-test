from fastapi.testclient import TestClient
import sys
import os
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app, users

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_users():
    """Clear users dictionary before each test"""
    users.clear()
    yield
    users.clear()


def test_add_user_success():
    response = client.post("/users", json={"username": "Alice123"})
    assert response.status_code == 200
    assert response.json()["username"] == "Alice123"


def test_add_user_duplicate():
    client.post("/users", json={"username": "Bob123"})
    response = client.post("/users", json={"username": "Bob123"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already exists"


def test_add_user_invalid_start():
    response = client.post("/users", json={"username": "1Alice"})
    assert response.status_code == 422
    assert "Username must start with an alphabet character" in response.text


def test_add_user_non_alphanumeric():
    response = client.post("/users", json={"username": "Alice_123"})
    assert response.status_code == 422
    assert "Username must be alphanumeric" in response.text


def test_add_user_empty():
    response = client.post("/users", json={"username": ""})
    assert response.status_code == 422
    assert "Username must not be empty" in response.text


def test_get_users():
    client.post("/users", json={"username": "Charlie"})
    response = client.get("/users")
    assert response.status_code == 200
    assert "Charlie" in response.json()["users"]


def test_select_and_delete_random_user_success():
    client.post("/users", json={"username": "David"})
    response = client.post("/users/random")
    assert response.status_code == 200
    assert response.json()["selected_user"] == "David"
    # After deletion, user should not be in the list
    response = client.get("/users")
    assert "David" not in response.json()["users"]


def test_select_and_delete_random_user_no_users():
    # Ensure users dict is empty
    response = client.post("/users/random")
    assert response.status_code == 404
    assert response.json()["detail"] == "No users available"
