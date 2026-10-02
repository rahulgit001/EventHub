import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi.testclient import TestClient

from backend.app.auth import get_password_hash
from backend.app.database import SessionLocal
from backend.app.main import app
from backend.app.models import Customer, User

client = TestClient(app)


def test_register_and_login():
    email = f"testuser_{uuid4().hex[:8]}@example.com"
    assert client.post("/api/auth/register", json={"full_name": "Weak", "email": email, "password": "short"}).status_code == 422
    assert client.post("/api/auth/register", json={"full_name": "Bad Email", "email": "not-an-email", "password": "securepass123"}).status_code == 422
    payload = {
        "full_name": "Test User",
        "email": email,
        "phone": "9999999999",
        "password": "securepass123",
        "role": "admin",
    }
    register = client.post("/api/auth/register", json=payload)
    assert register.status_code == 200, register.text
    body = register.json()
    assert "access_token" in body
    assert body["user"]["role"] == "customer"

    login = client.post("/api/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    profile = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    assert profile.json()["email"] == payload["email"]
    assert profile.json()["role"] == "customer"

    profile_update = client.patch(
        f"/api/customers/{body['user']['id']}",
        json={"full_name": "Test User Updated", "phone": "1112223333", "address": "12 Test Road", "city": "Aurangabad", "district": "Aurangabad", "state": "Maharashtra", "pincode": "431001"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert profile_update.status_code == 200, profile_update.text
    assert profile_update.json()["address"] == "12 Test Road"
    assert client.get(
        f"/api/customers/{body['user']['id']}",
        headers={"Authorization": f"Bearer {token}"},
    ).json()["city"] == "Aurangabad"

    db = SessionLocal()
    customer_profile = db.query(Customer).filter(Customer.user_id == body["user"]["id"]).first()
    assert customer_profile is not None
    admin = db.query(User).filter(User.email == "admin@eventhub.in").first()
    if admin is None:
        db.add(User(
            full_name="EventHub Admin",
            email="admin@eventhub.in",
            phone="9876543210",
            password_hash=get_password_hash("admin123"),
            role="admin",
        ))
        db.commit()
    db.close()

    admin_login = client.post("/api/auth/login", json={"email": "admin@eventhub.in", "password": "admin123"})
    assert admin_login.status_code == 200, admin_login.text
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    customers = client.get("/api/customers", headers=admin_headers)
    assert customers.status_code == 200
    assert any(customer["email"] == email for customer in customers.json())
    bookings = client.get("/api/bookings", headers=admin_headers)
    assert bookings.status_code == 200

    staff_payload = {
        "full_name": "Sam Staff",
        "email": f"staff_{uuid4().hex[:8]}@example.com",
        "phone": "8888888888",
        "password": "staffpass123",
        "designation": "Event Coordinator",
        "department": "Operations",
    }
    assert client.get("/api/staff").status_code == 401
    assert client.get("/api/staff", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert client.post("/api/staff", json=staff_payload, headers={"Authorization": f"Bearer {token}"}).status_code == 403
    created_staff = client.post("/api/staff", json=staff_payload, headers=admin_headers)
    assert created_staff.status_code == 200, created_staff.text
    staff_data = created_staff.json()
    assert staff_data["role"] == "staff"
    assert staff_data["email"] == staff_payload["email"]
    assert "password" not in staff_data
    staff_login = client.post("/api/auth/login", json={"email": staff_payload["email"], "password": staff_payload["password"]})
    assert staff_login.status_code == 200
    staff_token = staff_login.json()["access_token"]
    updated_staff = client.patch(
        f"/api/staff/{staff_data['id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert updated_staff.status_code == 200
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {staff_token}"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": staff_payload["email"], "password": staff_payload["password"]}).status_code == 401

    vehicle_payload = {
        "name": "EventHub Van",
        "vehicle_number": f"MH20{uuid4().hex[:6].upper()}",
        "vehicle_type": "Transport",
        "driver_name": "Ravi Patil",
        "driver_phone": "9999999999",
        "price_per_day": 1800,
        "price_per_km": 18,
    }
    assert client.get("/api/vehicles").status_code == 401
    assert client.get("/api/vehicles", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert client.post("/api/vehicles", json=vehicle_payload, headers={"Authorization": f"Bearer {token}"}).status_code == 403
    created_vehicle = client.post("/api/vehicles", json=vehicle_payload, headers=admin_headers)
    assert created_vehicle.status_code == 200, created_vehicle.text
    assert created_vehicle.json()["vehicle_number"] == vehicle_payload["vehicle_number"]
    vehicle_catalog = client.get("/api/vehicle-catalog", params={"date": "2026-12-05"})
    assert vehicle_catalog.status_code == 200
    catalog_vehicle = next(item for item in vehicle_catalog.json() if item["id"] == created_vehicle.json()["id"])
    assert "driver_phone" not in catalog_vehicle
    duplicate_vehicle = client.post("/api/vehicles", json=vehicle_payload, headers=admin_headers)
    assert duplicate_vehicle.status_code == 409
    maintenance_vehicle = client.patch(
        f"/api/vehicles/{created_vehicle.json()['id']}",
        json={"availability": "Maintenance"},
        headers=admin_headers,
    )
    assert maintenance_vehicle.status_code == 200
    assert maintenance_vehicle.json()["availability"] == "Maintenance"

    menu_payload = {
        "name": "Wedding Dinner",
        "description": "Seasonal vegetarian dinner menu",
        "price_per_plate": 650,
        "plates": 250,
        "is_veg": True,
        "serving_time": "Dinner",
    }
    assert client.get("/api/catering-menus").status_code == 200
    assert client.post("/api/catering-menus", json=menu_payload, headers={"Authorization": f"Bearer {token}"}).status_code == 403
    created_menu = client.post("/api/catering-menus", json=menu_payload, headers=admin_headers)
    assert created_menu.status_code == 200, created_menu.text
    updated_menu = client.patch(
        f"/api/catering-menus/{created_menu.json()['id']}",
        json={"price_per_plate": 700, "is_veg": False},
        headers=admin_headers,
    )
    assert updated_menu.status_code == 200
    assert updated_menu.json()["price_per_plate"] == 700
    assert updated_menu.json()["is_veg"] is False
