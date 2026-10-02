from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EventHub API"
    database_url: str = "sqlite:///./eventhub.db"
    secret_key: str = "dev-secret-key-change-me"
    access_token_expire_minutes: int = 120
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    bootstrap_admin_email: str = "admin@eventhub.in"
    bootstrap_admin_password: str = "admin123"
    demo_customer_email: str = "customer@eventhub.in"
    demo_customer_password: str = "customer123"
    vite_api_base_url: str = "http://localhost:8000/api"
    smtp_host: str = ""
    smtp_port: int = 587
    postgres_db: str = "eventhub"
    postgres_user: str = "eventhub"
    postgres_password: str = "eventhub"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
