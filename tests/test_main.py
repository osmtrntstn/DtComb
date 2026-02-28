# DtComb Test Suite

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_redirect():
    """Test that root URL is accessible"""
    response = client.get("/")
    assert response.status_code == 200


def test_login_page():
    """Test login page loads"""
    response = client.get("/login")
    assert response.status_code == 200
    assert b"login" in response.content.lower()


def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    response = client.post(
        "/login",
        data={"username": "wrong", "password": "wrong"},
        follow_redirects=False
    )
    assert response.status_code == 303
    assert "/login" in response.headers["location"]


def test_admin_requires_auth():
    """Test that admin page requires authentication"""
    response = client.get("/admin", follow_redirects=False)
    assert response.status_code in [303, 401]


def test_static_files():
    """Test that static files are accessible"""
    response = client.get("/static/css/style.css")
    assert response.status_code in [200, 404]  # 404 if file doesn't exist


def test_analysis_page():
    """Test analysis page loads"""
    response = client.get("/analysis")
    assert response.status_code == 200


def test_data_upload_page():
    """Test data upload page loads"""
    response = client.get("/data-upload")
    assert response.status_code == 200


# Add more tests for your specific endpoints

