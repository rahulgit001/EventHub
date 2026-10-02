import os

from backend.app.config import Settings


def test_settings_accepts_project_env_vars(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./eventhub.db")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:5173")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_EMAIL", "admin@eventhub.in")
    monkeypatch.setenv("BOOTSTRAP_ADMIN_PASSWORD", "AdminPassword123!")
    monkeypatch.setenv("DEMO_CUSTOMER_EMAIL", "customer@eventhub.in")
    monkeypatch.setenv("DEMO_CUSTOMER_PASSWORD", "CustomerPassword123!")
    monkeypatch.setenv("VITE_API_BASE_URL", "http://localhost:8000/api")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "587")
    monkeypatch.setenv("POSTGRES_DB", "eventhub")
    monkeypatch.setenv("POSTGRES_USER", "eventhub")
    monkeypatch.setenv("POSTGRES_PASSWORD", "postgres-password")

    settings = Settings()

    assert settings.database_url == "sqlite:///./eventhub.db"
    assert settings.secret_key == "test-secret"
    assert settings.cors_origins == "http://localhost:5173"
    assert settings.bootstrap_admin_email == "admin@eventhub.in"

    assert settings.model_config["extra"] == "ignore"
