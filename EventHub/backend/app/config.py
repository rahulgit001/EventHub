from pydantic_settings import BaseSettings


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

    class Config:
        env_file = ".env"


settings = Settings()
