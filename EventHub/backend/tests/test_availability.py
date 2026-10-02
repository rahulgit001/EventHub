import os
from pathlib import Path
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi.testclient import TestClient

from backend.app.auth import get_password_hash
from backend.app.database import SessionLocal
from backend.app.main import app
from backend.app.models import CateringMenu, Category, Inventory, Product, Staff, User, Vehicle

client = TestClient(app)


def test_availability_blocks_overbooking():
    db = SessionLocal()
    category = db.query(Category).filter(Category.id == 1).first()
    if category is None:
        category = Category(name="Availability Test Category", description="Test products")
        db.add(category)
        db.flush()
    category_id = category.id
    product = Product(
        name="Test Chair",
        category_id=category_id,
        description="Availability test item",
        quantity=100,
        available_quantity=100,
        rental_price=10,
        unit="Piece",
        security_deposit=500,
        delivery_charge=0,
        setup_charge=0,
        status="active",
        location="Aurangabad",
        tags="[]",
    )
    vehicle = Vehicle(
        name="Test Van",
        vehicle_number=f"TEST-{uuid4().hex[:8].upper()}",
        vehicle_type="Transport",
        price_per_day=1000,
        price_per_km=10,
        availability="Available",
    )
    catering_menu = CateringMenu(
        name="Test Event Menu",
        description="Availability test menu",
        price_per_plate=650,
        plates=100,
        is_veg=True,
        serving_time="Dinner",
    )
    db.add(product)
    db.add_all([vehicle, catering_menu])
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
    db.refresh(product)
    vehicle_id = vehicle.id
    catering_menu_id = catering_menu.id
    db.close()

    user_response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Booking User",
            "email": f"bookinguser_{uuid4().hex[:8]}@example.com",
            "phone": "7777777777",
            "password": "strongpass123",
        },
    )
    assert user_response.status_code == 200, user_response.text
    token = user_response.json()["access_token"]

    first = client.post(
        "/api/bookings",
        json={
            "event_type": "Wedding",
            "event_date": "2026-11-15",
            "start_time": "09:00",
            "end_time": "22:00",
            "address": "Test Address",
            "city": "Aurangabad",
            "district": "Aurangabad",
            "state": "Maharashtra",
            "pincode": "431001",
            "items": [{"product_id": product.id, "quantity": 70}],
            "vehicles": [{"vehicle_id": vehicle_id, "days": 1, "kilometers": 20}],
            "catering": [{"menu_id": catering_menu_id, "plates": 50}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert first.status_code == 200, first.text
    assert first.json()["grand_total"] == 36900
    same_day_vehicle_catalog = client.get("/api/vehicle-catalog", params={"date": "2026-11-15"})
    assert all(vehicle["id"] != vehicle_id for vehicle in same_day_vehicle_catalog.json())
    next_day_vehicle_catalog = client.get("/api/vehicle-catalog", params={"date": "2026-11-16"})
    assert any(vehicle["id"] == vehicle_id for vehicle in next_day_vehicle_catalog.json())

    vehicle_conflict = client.post(
        "/api/bookings",
        json={"event_date": "2026-11-15", "vehicles": [{"vehicle_id": vehicle_id}]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert vehicle_conflict.status_code == 400
    catering_over_capacity = client.post(
        "/api/bookings",
        json={"event_date": "2026-11-15", "catering": [{"menu_id": catering_menu_id, "plates": 60}]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert catering_over_capacity.status_code == 400

    owner_notifications = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert owner_notifications.status_code == 200
    booking_notification = owner_notifications.json()[0]
    assert booking_notification["title"] == "Booking request received"
    assert booking_notification["is_read"] is False

    assert client.get("/api/bookings").status_code == 401
    owner_bookings = client.get("/api/bookings", headers={"Authorization": f"Bearer {token}"})
    assert owner_bookings.status_code == 200
    assert [booking["id"] for booking in owner_bookings.json()] == [first.json()["booking_id"]]
    bookings_on_event_date = client.get(
        "/api/bookings",
        params={"start_date": "2026-11-15", "end_date": "2026-11-15"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert [booking["id"] for booking in bookings_on_event_date.json()] == [first.json()["booking_id"]]
    invalid_date_range = client.get(
        "/api/bookings",
        params={"start_date": "2026-11-16", "end_date": "2026-11-15"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invalid_date_range.status_code == 400

    other_user = client.post(
        "/api/auth/register",
        json={
            "full_name": "Other Booking User",
            "email": f"otheruser_{uuid4().hex[:8]}@example.com",
            "password": "strongpass123",
        },
    )
    other_token = other_user.json()["access_token"]
    assert client.get("/api/notifications", headers={"Authorization": f"Bearer {other_token}"}).json() == []
    assert client.patch(
        f"/api/notifications/{booking_notification['id']}/read",
        headers={"Authorization": f"Bearer {other_token}"},
    ).status_code == 403
    assert client.patch(
        f"/api/notifications/{booking_notification['id']}/read",
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 200
    read_notifications = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert read_notifications.json()[0]["is_read"] is True
    other_bookings = client.get("/api/bookings", headers={"Authorization": f"Bearer {other_token}"})
    assert other_bookings.status_code == 200
    assert other_bookings.json() == []
    assert client.get("/api/payments").status_code == 401
    assert client.get("/api/payments", headers={"Authorization": f"Bearer {other_token}"}).json() == []
    assert client.get("/api/invoices").status_code == 401
    assert client.get("/api/invoices", headers={"Authorization": f"Bearer {other_token}"}).json() == []
    assert client.get("/api/quotations").status_code == 401

    quotation = client.post(
        "/api/quotations",
        json={
            "event_date": "2026-12-01",
            "location": "Aurangabad",
            "items": [{"product_id": product.id, "quantity": 2}],
            "total_amount": 1,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert quotation.status_code == 200, quotation.text
    quotation_data = quotation.json()
    assert quotation_data["total_amount"] == 20
    assert quotation_data["items"][0]["total_price"] == 20
    own_quotation = client.get(
        f"/api/quotations/{quotation_data['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert own_quotation.status_code == 200
    assert own_quotation.json()["customer_email"] == user_response.json()["user"]["email"]
    quotation_notification = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"}).json()[0]
    assert quotation_notification["title"] == "Quotation created"
    assert f"#{quotation_data['id']}" in quotation_notification["message"]
    assert client.get(
        f"/api/quotations/{quotation_data['id']}",
        headers={"Authorization": f"Bearer {other_token}"},
    ).status_code == 403
    assert client.get("/api/quotations", headers={"Authorization": f"Bearer {other_token}"}).json() == []
    assert client.patch(
        f"/api/quotations/{quotation_data['id']}/status",
        json={"status": "Accepted"},
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403
    assert client.get("/api/customers").status_code == 401
    assert client.get("/api/customers", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert client.get(
        f"/api/customers/{other_user.json()['user']['id']}",
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403

    same_day_availability = client.get(
        "/api/availability",
        params={"product_id": product.id, "date": "2026-11-15", "requested_quantity": 50},
    )
    assert same_day_availability.status_code == 200
    assert same_day_availability.json()["available_quantity"] == 30
    assert same_day_availability.json()["status"] == "PARTIALLY AVAILABLE"

    next_day_availability = client.get(
        "/api/availability",
        params={"product_id": product.id, "date": "2026-11-16", "requested_quantity": 100},
    )
    assert next_day_availability.json()["available_quantity"] == 100

    second = client.post(
        "/api/bookings",
        json={
            "event_type": "Birthday",
            "event_date": "2026-11-15",
            "start_time": "09:00",
            "end_time": "22:00",
            "address": "Second Address",
            "city": "Aurangabad",
            "district": "Aurangabad",
            "state": "Maharashtra",
            "pincode": "431001",
            "items": [{"product_id": product.id, "quantity": 50}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert second.status_code == 400

    next_day_booking = client.post(
        "/api/bookings",
        json={
            "event_type": "Birthday",
            "event_date": "2026-11-16",
            "items": [{"product_id": product.id, "quantity": 50}],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert next_day_booking.status_code == 200, next_day_booking.text

    overpayment = client.post(
        "/api/payments",
        json={"booking_id": first.json()["booking_id"], "amount": first.json()["grand_total"] + 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert overpayment.status_code == 400

    unauthorized_payment = client.post(
        "/api/payments",
        json={"booking_id": first.json()["booking_id"], "amount": 100},
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert unauthorized_payment.status_code == 403

    payment = client.post(
        "/api/payments",
        json={"booking_id": first.json()["booking_id"], "amount": 100, "status": "Paid"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert payment.status_code == 200, payment.text
    assert payment.json()["status"] == "Pending"
    payment_notification = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"}).json()[0]
    assert payment_notification["title"] == "Payment submitted"
    invoice_url = f"/api/invoices/{first.json()['invoice_id']}"
    assert client.get(invoice_url).status_code == 401
    assert client.get(invoice_url, headers={"Authorization": f"Bearer {other_token}"}).status_code == 403
    assert client.patch(
        f"/api/payments/{payment.json()['payment_id']}/status",
        json={"status": "Paid"},
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403

    admin_login = client.post("/api/auth/login", json={"email": "admin@eventhub.in", "password": "admin123"})
    assert admin_login.status_code == 200, admin_login.text
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
    assert client.patch(
        f"/api/bookings/{first.json()['booking_id']}/status",
        json={"status": "Confirmed"},
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403
    confirmed_booking = client.patch(
        f"/api/bookings/{first.json()['booking_id']}/status",
        json={"status": "Confirmed"},
        headers=admin_headers,
    )
    assert confirmed_booking.status_code == 200, confirmed_booking.text
    assert confirmed_booking.json()["status"] == "Confirmed"
    assert client.patch(
        f"/api/bookings/{first.json()['booking_id']}/status",
        json={"status": "Rejected"},
        headers=admin_headers,
    ).status_code == 400
    staff_user = client.post(
        "/api/staff",
        json={"full_name": "Assigned Staff", "email": f"assigned_{uuid4().hex[:8]}@example.com", "password": "staffpass123", "designation": "Coordinator"},
        headers=admin_headers,
    )
    assert staff_user.status_code == 200, staff_user.text
    staff_record = db.query(Staff).filter(Staff.user_id == staff_user.json()["user_id"]).first()
    staff_token_response = client.post("/api/auth/login", json={"email": staff_user.json()["email"], "password": "staffpass123"})
    assert staff_token_response.status_code == 200
    staff_headers = {"Authorization": f"Bearer {staff_token_response.json()['access_token']}"}
    assert client.get("/api/bookings", headers=staff_headers).json() == []
    assignment = client.put(
        f"/api/bookings/{first.json()['booking_id']}/staff",
        json={"staff_id": staff_record.id},
        headers=admin_headers,
    )
    assert assignment.status_code == 200
    assert assignment.json()["assigned_staff_name"] == "Assigned Staff"
    staff_bookings = client.get("/api/bookings", headers=staff_headers)
    assert [booking["id"] for booking in staff_bookings.json()] == [first.json()["booking_id"]]
    assert staff_bookings.json()[0]["can_cancel"] is False
    assert client.put(
        f"/api/bookings/{first.json()['booking_id']}/staff",
        json={"staff_id": staff_record.id},
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403
    assert client.post("/api/products", json={}).status_code == 401
    assert client.post("/api/products", json={}, headers={"Authorization": f"Bearer {token}"}).status_code == 403
    assert client.post("/api/products", json={}, headers=admin_headers).status_code == 422
    created_product = client.post(
        "/api/products",
        json={
            "name": "New rental stock",
            "category_id": category_id,
            "quantity": 12,
            "available_quantity": 0,
            "rental_price": 40,
        },
        headers=admin_headers,
    )
    assert created_product.status_code == 200, created_product.text
    assert created_product.json()["available_quantity"] == 12
    inventory_record = db.query(Inventory).filter(Inventory.product_id == created_product.json()["id"]).first()
    assert inventory_record.total_quantity == 12
    assert inventory_record.available_quantity == 12
    assert client.patch("/api/inventory/99999", json={"damaged_quantity": 1}, headers=admin_headers).status_code == 404
    assert client.patch(
        f"/api/inventory/{created_product.json()['id']}",
        json={"total_quantity": 12, "damaged_quantity": 2, "lost_quantity": 1},
        headers={"Authorization": f"Bearer {token}"},
    ).status_code == 403
    invalid_inventory_adjustment = client.patch(
        f"/api/inventory/{created_product.json()['id']}",
        json={"total_quantity": 12, "damaged_quantity": 8, "lost_quantity": 5},
        headers=admin_headers,
    )
    assert invalid_inventory_adjustment.status_code == 400
    inventory_adjustment = client.patch(
        f"/api/inventory/{created_product.json()['id']}",
        json={"total_quantity": 12, "damaged_quantity": 2, "lost_quantity": 1},
        headers=admin_headers,
    )
    assert inventory_adjustment.status_code == 200
    assert inventory_adjustment.json()["available_quantity"] == 9
    adjusted_availability = client.get(
        "/api/availability",
        params={"product_id": created_product.json()["id"], "date": "2026-12-01", "requested_quantity": 10},
    )
    assert adjusted_availability.json()["available_quantity"] == 9
    assert client.get("/api/dashboard/stats").status_code == 401
    assert client.get("/api/dashboard/stats", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    accepted_quotation = client.patch(
        f"/api/quotations/{quotation_data['id']}/status",
        json={"status": "Accepted"},
        headers=admin_headers,
    )
    assert accepted_quotation.status_code == 200, accepted_quotation.text
    assert client.get(
        f"/api/quotations/{quotation_data['id']}",
        headers={"Authorization": f"Bearer {token}"},
    ).json()["status"] == "Accepted"
    confirmed = client.patch(
        f"/api/payments/{payment.json()['payment_id']}/status",
        json={"status": "Paid"},
        headers={"Authorization": f"Bearer {admin_login.json()['access_token']}"},
    )
    assert confirmed.status_code == 200, confirmed.text
    confirmed_notification = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"}).json()[0]
    assert confirmed_notification["title"] == "Payment confirmed"
    invoice = client.get(
        invoice_url,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert invoice.status_code == 200
    assert invoice.json()["customer_name"] == "Test Booking User"
    assert invoice.json()["event_date"] == "2026-11-15"
    assert invoice.json()["items"][0]["product_name"] == "Test Chair"
    assert invoice.json()["items"][0]["quantity"] == 70
    assert len(invoice.json()["items"]) == 3
    assert invoice.json()["items"][1]["product_name"].startswith("Test Van rental")
    assert invoice.json()["items"][2]["product_name"] == "Test Event Menu catering"
    assert invoice.json()["paid_amount"] == 100
    assert invoice.json()["remaining_amount"] == first.json()["grand_total"] - 100
    customer_profile = client.get(
        f"/api/customers/{user_response.json()['user']['id']}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert customer_profile.status_code == 200
    assert customer_profile.json()["total_bookings"] == 2
    assert customer_profile.json()["total_spending"] == 100
    assert customer_profile.json()["pending_amount"] == invoice.json()["remaining_amount"] + next_day_booking.json()["grand_total"]
    customer_directory = client.get("/api/customers", headers=admin_headers)
    test_customer = next(item for item in customer_directory.json() if item["id"] == user_response.json()["user"]["id"])
    assert test_customer["total_spending"] == 100
    dashboard_stats = client.get("/api/dashboard/stats", headers=admin_headers)
    assert dashboard_stats.status_code == 200
    assert dashboard_stats.json()["total_revenue"] == 100
    revenue = client.get("/api/dashboard/revenue", headers=admin_headers)
    assert revenue.status_code == 200
    assert sum(month["revenue"] for month in revenue.json()) == 100
    event_types = client.get("/api/dashboard/bookings", headers=admin_headers)
    assert event_types.status_code == 200
    assert sum(item["value"] for item in event_types.json()) == 2
    assert client.get("/api/reports/summary").status_code == 401
    assert client.get("/api/reports/summary", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    report = client.get(
        "/api/reports/summary",
        params={"start_date": "2026-11-15", "end_date": "2026-11-15"},
        headers=admin_headers,
    )
    assert report.status_code == 200
    assert report.json()["totals"]["total_bookings"] == 1
    assert report.json()["totals"]["booking_value"] == 36900
    assert report.json()["totals"]["revenue_collected"] == 100
    assert report.json()["totals"]["outstanding_balance"] == 36800
    assert client.get("/api/reports/summary").status_code == 401
    assert client.get("/api/reports/summary", headers={"Authorization": f"Bearer {token}"}).status_code == 403
    report = client.get(
        "/api/reports/summary",
        params={"start_date": "2026-11-15", "end_date": "2026-11-15"},
        headers=admin_headers,
    )
    assert report.status_code == 200
    assert report.json()["totals"]["total_bookings"] == 1
    assert report.json()["totals"]["booking_value"] == 36900
    assert report.json()["totals"]["revenue_collected"] == 100
    assert report.json()["totals"]["outstanding_balance"] == 36800

    cancellation = client.post(
        f"/api/bookings/{first.json()['booking_id']}/cancel",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert cancellation.status_code == 200, cancellation.text
    cancellation_notification = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"}).json()[0]
    assert cancellation_notification["title"] == "Booking cancelled"
    released_vehicle_catalog = client.get("/api/vehicle-catalog", params={"date": "2026-11-15"})
    assert any(vehicle["id"] == vehicle_id for vehicle in released_vehicle_catalog.json())

    available_after_cancellation = client.get(
        "/api/availability",
        params={"product_id": product.id, "date": "2026-11-15", "requested_quantity": 100},
    )
    assert available_after_cancellation.json()["available_quantity"] == 100
    final_dashboard_stats = client.get("/api/dashboard/stats", headers=admin_headers)
    assert final_dashboard_stats.json()["pending_payments"] == next_day_booking.json()["grand_total"]
