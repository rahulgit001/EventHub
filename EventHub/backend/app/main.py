from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse

from backend.app.auth import create_access_token, get_current_admin, get_current_user, get_password_hash, verify_password
from backend.app.config import settings
from backend.app.database import engine, get_db
from backend.app.models import Base, Booking, BookingAssignment, BookingCatering, BookingItem, BookingVehicle, CateringMenu, Category, Customer, Inventory, Invoice, Notification, NotificationRead, Payment, Product, Quotation, QuotationItem, QuotationOwner, Staff, User, Vehicle
from backend.app.schemas import AvailabilityCheck, BookingCateringCreate, BookingCreate, BookingStatusUpdate, BookingVehicleCreate, CateringMenuCreate, CateringMenuUpdate, CustomerOut, CustomerUpdate, DashboardStat, InventoryUpdate, PaymentCreate, PaymentStatusUpdate, ProductCreate, ProductOut, QuotationCreate, QuotationStatusUpdate, StaffAssignment, StaffCreate, StaffUpdate, TokenResponse, UserCreate, UserLogin, VehicleCreate, VehicleUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EventHub API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def seed_database(db: Session) -> None:
    if db.query(Category).count() > 0:
        return

    category_names = [
        "Tent House",
        "Mandap / Decoration",
        "DJ & Sound",
        "Lighting",
        "Furniture",
        "Camera / Photography",
        "Vehicles / Gadi",
        "Catering",
    ]
    categories = []
    for name in category_names:
        category = Category(name=name, description=f"{name} items")
        db.add(category)
        categories.append(category)
    db.commit()

    products = [
        ("Wedding Tent", 1, "Premium wedding tent with side curtains", 120, 120, 15000, "Event", 2000, 1500, 1200, "active", "Aurangabad", ["tent", "wedding"]),
        ("Plastic Chair", 5, "Durable plastic chair for events", 500, 250, 10, "Piece", 500, 0, 0, "active", "Aurangabad", ["chair", "furniture"]),
        ("Road Light", 4, "Outdoor road light setup", 200, 120, 150, "Piece", 300, 100, 80, "active", "Aurangabad", ["lighting", "outdoor"]),
        ("DJ System", 3, "Complete DJ audio system", 20, 10, 8000, "Event", 1200, 1500, 900, "active", "Aurangabad", ["dj", "sound"]),
        ("Wedding Mandap", 2, "Decorative wedding mandap", 30, 25, 15000, "Event", 4000, 3000, 2500, "active", "Aurangabad", ["mandap", "decoration"]),
        ("DSLR Camera", 6, "Photography package camera", 12, 8, 3000, "Day", 800, 500, 300, "active", "Aurangabad", ["camera", "wedding"]),
        ("Luxury Car", 7, "Wedding luxury car", 10, 7, 5000, "Day", 3500, 800, 600, "active", "Aurangabad", ["vehicle", "car"]),
        ("Premium Catering Menu", 8, "Veg-plus-nonveg wedding menu", 300, 250, 450, "Plate", 1500, 600, 500, "active", "Aurangabad", ["catering", "menu"]),
    ]

    for name, category_id, description, quantity, available, price, unit, deposit, delivery, setup, status, location, tags in products:
        product = Product(
            name=name,
            category_id=category_id,
            description=description,
            images="[]",
            quantity=quantity,
            available_quantity=available,
            rental_price=price,
            unit=unit,
            security_deposit=deposit,
            delivery_charge=delivery,
            setup_charge=setup,
            status=status,
            location=location,
            tags=str(tags),
        )
        db.add(product)
    db.commit()

    for product in db.query(Product).all():
        db.add(
            Inventory(
                product_id=product.id,
                total_quantity=product.quantity,
                available_quantity=product.available_quantity,
                booked_quantity=max(0, product.quantity - product.available_quantity),
                location=product.location,
            )
        )
    db.commit()

    admin = db.query(User).filter(User.email == settings.bootstrap_admin_email.lower()).first()
    if admin is None:
        admin_user = User(
            full_name="Event Hub Admin",
            email=settings.bootstrap_admin_email.lower(),
            phone="9876543210",
            password_hash=get_password_hash(settings.bootstrap_admin_password),
            role="admin",
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        db.add(Customer(user_id=admin_user.id, city="Aurangabad", state="Maharashtra", address="Main Office"))
        db.commit()

    customer = db.query(User).filter(User.email == settings.demo_customer_email.lower()).first()
    if customer is None:
        user = User(
            full_name="Aarav Patil",
            email=settings.demo_customer_email.lower(),
            phone="9123456789",
            password_hash=get_password_hash(settings.demo_customer_password),
            role="customer",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.add(Customer(user_id=user.id, city="Aurangabad", state="Maharashtra", address="Shivaji Nagar"))
        db.commit()

    if db.query(Booking).count() == 0:
        product = db.query(Product).filter(Product.name == "Plastic Chair").first()
        booking = Booking(
            user_id=db.query(User).filter(User.email == settings.demo_customer_email.lower()).first().id,
            event_type="Wedding",
            event_date=date(2026, 11, 15),
            start_time="09:00",
            end_time="23:00",
            address="Shivaji Nagar",
            city="Aurangabad",
            district="Aurangabad",
            state="Maharashtra",
            pincode="431001",
            status="Confirmed",
            subtotal=2000,
            delivery_charge=500,
            setup_charge=1000,
            security_deposit=1000,
            tax=420,
            grand_total=5920,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        db.add(BookingItem(booking_id=booking.id, product_id=product.id, quantity=200, unit_price=10, total_price=2000))
        db.add(Invoice(booking_id=booking.id, invoice_number="EVH-1001", subtotal=2000, discount=0, tax=420, delivery_charge=500, setup_charge=1000, security_deposit=1000, final_amount=5920, paid_amount=5920, remaining_amount=0))
        db.add(Payment(booking_id=booking.id, amount=5920, payment_method="UPI", status="Paid"))
        db.commit()


@app.on_event("startup")
def startup_event() -> None:
    with next(get_db()) as db:
        seed_database(db)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "message": "EventHub API is running"}


def add_notification(db: Session, user_id: int, title: str, message: str) -> None:
    db.add(Notification(user_id=user_id, title=title, message=message))


@app.get("/api/notifications")
def list_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    notifications = (
        db.query(Notification)
        .filter(or_(Notification.user_id.is_(None), Notification.user_id == current_user.id))
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .all()
    )
    read_ids = {
        record.notification_id
        for record in db.query(NotificationRead).filter(NotificationRead.user_id == current_user.id).all()
    }
    return [
        {
            "id": item.id,
            "title": item.title,
            "message": item.message,
            "created_at": item.created_at.isoformat(),
            "is_read": item.id in read_ids,
        }
        for item in notifications
    ]


@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.user_id is not None and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot update this notification")

    read_record = db.query(NotificationRead).filter(
        NotificationRead.notification_id == notification_id,
        NotificationRead.user_id == current_user.id,
    ).first()
    if read_record is None:
        db.add(NotificationRead(notification_id=notification_id, user_id=current_user.id))
        db.commit()
    return {"message": "Notification marked as read", "notification_id": notification_id}


@app.post("/api/auth/register", response_model=TokenResponse)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        full_name=payload.full_name,
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role="customer",
    )
    db.add(user)
    db.flush()
    db.add(Customer(user_id=user.id, address="", city="", district="", state="", pincode=""))
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token, user={"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role})


@app.post("/api/auth/login", response_model=TokenResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token, user={"id": user.id, "full_name": user.full_name, "email": user.email, "role": user.role})


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):  # type: ignore[arg-type]
    return {"id": current_user.id, "full_name": current_user.full_name, "email": current_user.email, "role": current_user.role}


@app.get("/api/categories")
def list_categories(db: Session = Depends(get_db)) -> list[dict]:
    return [{"id": item.id, "name": item.name, "description": item.description} for item in db.query(Category).all()]


@app.get("/api/products")
def list_products(db: Session = Depends(get_db), category_id: Optional[int] = Query(default=None)) -> list[dict]:
    query = db.query(Product)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    items = query.all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "category_id": item.category_id,
            "description": item.description,
            "images": [] if not item.images else item.images.strip("[]").replace('"', '').split(",") if item.images else [],
            "quantity": item.quantity,
            "available_quantity": item.available_quantity,
            "rental_price": item.rental_price,
            "unit": item.unit,
            "security_deposit": item.security_deposit,
            "delivery_charge": item.delivery_charge,
            "setup_charge": item.setup_charge,
            "status": item.status,
            "location": item.location,
            "tags": [] if not item.tags else item.tags.strip("[]").replace('"', '').split(",") if item.tags else [],
        }
        for item in items
    ]


@app.post("/api/products")
def create_product(payload: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    product = Product(
        name=payload.name,
        category_id=payload.category_id,
        description=payload.description,
        images="[]",
        quantity=payload.quantity,
        available_quantity=payload.quantity,
        rental_price=payload.rental_price,
        unit=payload.unit,
        security_deposit=payload.security_deposit,
        delivery_charge=payload.delivery_charge,
        setup_charge=payload.setup_charge,
        status="active",
        location=payload.location,
        tags="[]",
    )
    db.add(product)
    db.flush()
    db.add(Inventory(
        product_id=product.id,
        total_quantity=payload.quantity,
        available_quantity=payload.quantity,
        booked_quantity=0,
        location=payload.location,
    ))
    db.commit()
    db.refresh(product)
    return {"message": "Product created", "id": product.id, "available_quantity": product.available_quantity}


@app.get("/api/availability")
def availability(product_id: int = Query(...), event_date: date = Query(..., alias="date"), start_time: str = "10:00", end_time: str = "22:00", requested_quantity: int = Query(default=1, ge=1), db: Session = Depends(get_db)) -> dict:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    reserved_quantity = (
        db.query(func.coalesce(func.sum(BookingItem.quantity), 0))
        .join(Booking, Booking.id == BookingItem.booking_id)
        .filter(
            BookingItem.product_id == product_id,
            Booking.event_date == event_date,
            func.lower(Booking.status).notin_(["cancelled", "rejected"]),
        )
        .scalar()
    )
    availability_count = max(0, product.available_quantity - reserved_quantity)
    status = "AVAILABLE" if availability_count >= requested_quantity else "NOT AVAILABLE"
    if 0 < availability_count < requested_quantity:
        status = "PARTIALLY AVAILABLE"

    return {"product_id": product_id, "product_name": product.name, "date": event_date.isoformat(), "requested_quantity": requested_quantity, "available_quantity": availability_count, "status": status}


@app.get("/api/vehicle-catalog")
def list_available_vehicles(event_date: date = Query(..., alias="date"), db: Session = Depends(get_db)) -> list[dict]:
    reserved_rows = (
        db.query(BookingVehicle.vehicle_id)
        .join(Booking, Booking.id == BookingVehicle.booking_id)
        .filter(
            Booking.event_date == event_date,
            func.lower(Booking.status).notin_(["cancelled", "rejected"]),
        )
        .distinct()
        .all()
    )
    reserved_ids = [vehicle_id for (vehicle_id,) in reserved_rows]
    query = db.query(Vehicle).filter(Vehicle.availability == "Available")
    if reserved_ids:
        query = query.filter(Vehicle.id.notin_(reserved_ids))
    return [
        {
            "id": vehicle.id,
            "name": vehicle.name,
            "vehicle_type": vehicle.vehicle_type,
            "price_per_day": vehicle.price_per_day,
            "price_per_km": vehicle.price_per_km,
        }
        for vehicle in query.order_by(Vehicle.name).all()
    ]


@app.get("/api/bookings")
def list_bookings(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    query = db.query(Booking)
    if current_user.role != "admin":
        if current_user.role == "staff":
            staff = db.query(Staff).filter(Staff.user_id == current_user.id).first()
            if staff is None:
                return []
            query = query.join(BookingAssignment).filter(BookingAssignment.staff_id == staff.id)
        else:
            query = query.filter(Booking.user_id == current_user.id)
    if start_date:
        query = query.filter(Booking.event_date >= start_date)
    if end_date:
        query = query.filter(Booking.event_date <= end_date)
    bookings = query.order_by(Booking.id.desc()).all()
    records = []
    for booking in bookings:
        records.append(
            {
                "id": booking.id,
                "customer_name": booking.user.full_name,
                "event_type": booking.event_type,
                "event_date": str(booking.event_date),
                "start_time": booking.start_time,
                "end_time": booking.end_time,
                "status": booking.status,
                "grand_total": booking.grand_total,
                "city": booking.city,
                "assigned_staff_id": booking.assignment.staff_id if booking.assignment else None,
                "assigned_staff_name": booking.assignment.staff.user.full_name if booking.assignment and booking.assignment.staff.user else None,
                "can_cancel": current_user.role == "admin" or booking.user_id == current_user.id,
                "items": [
                    {"product_id": item.product_id, "quantity": item.quantity, "total_price": item.total_price}
                    for item in booking.items
                ],
                "vehicles": [
                    {"vehicle_id": item.vehicle_id, "name": item.vehicle.name, "days": item.days, "kilometers": item.kilometers, "total_price": item.total_price}
                    for item in booking.vehicle_items
                ],
                "catering": [
                    {"menu_id": item.menu_id, "name": item.menu.name, "plates": item.plates, "total_price": item.total_price}
                    for item in booking.catering_items
                ],
            }
        )
    return records


@app.put("/api/bookings/{booking_id}/staff")
def assign_booking_staff(booking_id: int, payload: StaffAssignment, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    assignment = db.query(BookingAssignment).filter(BookingAssignment.booking_id == booking_id).first()
    if payload.staff_id is None:
        if assignment is not None:
            db.delete(assignment)
        db.commit()
        return {"booking_id": booking_id, "assigned_staff_id": None, "assigned_staff_name": None}

    staff = db.query(Staff).filter(Staff.id == payload.staff_id).first()
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    staff_user = db.query(User).filter(User.id == staff.user_id, User.is_active.is_(True), User.role == "staff").first()
    if staff_user is None:
        raise HTTPException(status_code=400, detail="Staff member is not active")
    if assignment is None:
        assignment = BookingAssignment(booking_id=booking_id, staff_id=staff.id, assigned_by_user_id=current_user.id)
        db.add(assignment)
    else:
        assignment.staff_id = staff.id
        assignment.assigned_by_user_id = current_user.id
    add_notification(db, staff_user.id, "Booking assigned", f"Booking #{booking.id} ({booking.event_type}) is assigned to you for {booking.event_date.isoformat()}.")
    db.commit()
    return {"booking_id": booking_id, "assigned_staff_id": staff.id, "assigned_staff_name": staff_user.full_name}


@app.post("/api/bookings")
def create_booking(payload: BookingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    if not payload.items and not payload.vehicles and not payload.catering:
        raise HTTPException(status_code=400, detail="At least one product or service is required")

    requested_by_product: dict[int, int] = {}
    for item in payload.items:
        requested_by_product[item.product_id] = requested_by_product.get(item.product_id, 0) + item.quantity

    subtotal = 0.0
    products = {}
    for product_id, requested_quantity in requested_by_product.items():
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        reserved_quantity = (
            db.query(func.coalesce(func.sum(BookingItem.quantity), 0))
            .join(Booking, Booking.id == BookingItem.booking_id)
            .filter(
                BookingItem.product_id == product_id,
                Booking.event_date == payload.event_date,
                func.lower(Booking.status).notin_(["cancelled", "rejected"]),
            )
            .scalar()
        )
        available_quantity = max(0, product.available_quantity - reserved_quantity)
        if requested_quantity > available_quantity:
            raise HTTPException(status_code=400, detail=f"Only {available_quantity} units available for {product.name} on {payload.event_date}")
        products[product_id] = product
        subtotal += float(product.rental_price) * requested_quantity

    if len({item.vehicle_id for item in payload.vehicles}) != len(payload.vehicles):
        raise HTTPException(status_code=400, detail="A vehicle can only be selected once per booking")
    vehicle_lines = []
    for item in payload.vehicles:
        vehicle = db.query(Vehicle).filter(Vehicle.id == item.vehicle_id).with_for_update().first()
        if vehicle is None:
            raise HTTPException(status_code=404, detail=f"Vehicle {item.vehicle_id} not found")
        if vehicle.availability != "Available":
            raise HTTPException(status_code=400, detail=f"{vehicle.name} is not available for booking")
        existing_reservation = (
            db.query(BookingVehicle.id)
            .join(Booking, Booking.id == BookingVehicle.booking_id)
            .filter(
                BookingVehicle.vehicle_id == vehicle.id,
                Booking.event_date == payload.event_date,
                func.lower(Booking.status).notin_(["cancelled", "rejected"]),
            )
            .first()
        )
        if existing_reservation:
            raise HTTPException(status_code=400, detail=f"{vehicle.name} is already booked for {payload.event_date}")
        line_total = float(vehicle.price_per_day) * item.days + float(vehicle.price_per_km) * item.kilometers
        vehicle_lines.append((vehicle, item.days, item.kilometers, line_total))
        subtotal += line_total

    requested_plates: dict[int, int] = {}
    for item in payload.catering:
        requested_plates[item.menu_id] = requested_plates.get(item.menu_id, 0) + item.plates

    catering_lines = []
    for menu_id, plates in requested_plates.items():
        menu = db.query(CateringMenu).filter(CateringMenu.id == menu_id).with_for_update().first()
        if menu is None:
            raise HTTPException(status_code=404, detail=f"Catering menu {menu_id} not found")
        reserved_plates = (
            db.query(func.coalesce(func.sum(BookingCatering.plates), 0))
            .join(Booking, Booking.id == BookingCatering.booking_id)
            .filter(
                BookingCatering.menu_id == menu_id,
                Booking.event_date == payload.event_date,
                func.lower(Booking.status).notin_(["cancelled", "rejected"]),
            )
            .scalar()
        )
        available_plates = max(0, menu.plates - reserved_plates)
        if plates > available_plates:
            raise HTTPException(status_code=400, detail=f"Only {available_plates} plates available for {menu.name} on {payload.event_date}")
        line_total = float(menu.price_per_plate) * plates
        catering_lines.append((menu, plates, line_total))
        subtotal += line_total

    total = subtotal + 500 + 1000 + 1000
    booking = Booking(
        user_id=current_user.id,
        event_type=payload.event_type,
        event_date=payload.event_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        address=payload.address,
        city=payload.city,
        district=payload.district,
        state=payload.state,
        pincode=payload.pincode,
        status="Pending",
        subtotal=subtotal,
        delivery_charge=500,
        setup_charge=1000,
        security_deposit=1000,
        tax=0,
        grand_total=total,
    )
    db.add(booking)
    db.flush()

    for item in payload.items:
        product = products[item.product_id]
        line_total = float(product.rental_price) * item.quantity
        db.add(BookingItem(booking_id=booking.id, product_id=item.product_id, quantity=item.quantity, unit_price=product.rental_price, total_price=line_total))
    for vehicle, days, kilometers, line_total in vehicle_lines:
        db.add(BookingVehicle(
            booking_id=booking.id,
            vehicle_id=vehicle.id,
            days=days,
            kilometers=kilometers,
            daily_rate=vehicle.price_per_day,
            km_rate=vehicle.price_per_km,
            total_price=line_total,
        ))
    for menu, plates, line_total in catering_lines:
        db.add(BookingCatering(
            booking_id=booking.id,
            menu_id=menu.id,
            plates=plates,
            price_per_plate=menu.price_per_plate,
            total_price=line_total,
        ))
    invoice = Invoice(
        booking_id=booking.id,
        invoice_number=f"EVH-{booking.id:06d}",
        subtotal=subtotal,
        discount=0,
        tax=0,
        delivery_charge=500,
        setup_charge=1000,
        security_deposit=1000,
        final_amount=total,
        paid_amount=0,
        remaining_amount=total,
    )
    db.add(invoice)
    add_notification(db, current_user.id, "Booking request received", f"Your {booking.event_type} booking request for {booking.event_date.isoformat()} was submitted.")
    db.commit()
    return {"message": "Booking created successfully", "booking_id": booking.id, "invoice_id": invoice.id, "invoice_number": invoice.invoice_number, "grand_total": total}


@app.post("/api/bookings/{booking_id}/cancel")
def cancel_booking(booking_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own bookings")
    if booking.status.lower() in {"cancelled", "rejected", "completed"}:
        raise HTTPException(status_code=400, detail=f"A {booking.status.lower()} booking cannot be cancelled")

    booking.status = "Cancelled"
    add_notification(db, booking.user_id, "Booking cancelled", f"Booking #{booking.id} has been cancelled.")
    db.commit()
    return {"message": "Booking cancelled", "booking_id": booking.id, "status": booking.status}


@app.patch("/api/bookings/{booking_id}/status")
def update_booking_status(booking_id: int, payload: BookingStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    allowed_transitions = {
        "Pending": {"Confirmed", "Rejected"},
        "Confirmed": {"Completed"},
    }
    if payload.status not in allowed_transitions.get(booking.status, set()):
        raise HTTPException(status_code=400, detail=f"Cannot change booking from {booking.status} to {payload.status}")

    booking.status = payload.status
    add_notification(db, booking.user_id, f"Booking {payload.status.lower()}", f"Your booking #{booking.id} is now {payload.status.lower()}.")
    if booking.assignment is not None:
        add_notification(db, booking.assignment.staff.user_id, f"Assigned booking {payload.status.lower()}", f"Booking #{booking.id} is now {payload.status.lower()}.")
    db.commit()
    return {"message": "Booking status updated", "booking_id": booking.id, "status": booking.status}


@app.get("/api/customers")
def list_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    users = db.query(User).filter(User.role == "customer").all()
    metrics = customer_metrics(db, [user.id for user in users])
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            **metrics.get(user.id, {"total_bookings": 0, "total_spending": 0.0, "pending_amount": 0.0}),
        }
        for user in users
    ]


def customer_metrics(db: Session, user_ids: list[int]) -> dict[int, dict]:
    if not user_ids:
        return {}
    booking_counts = dict(
        db.query(Booking.user_id, func.count(Booking.id))
        .filter(Booking.user_id.in_(user_ids))
        .group_by(Booking.user_id)
        .all()
    )
    spending_totals = dict(
        db.query(Booking.user_id, func.coalesce(func.sum(Payment.amount), 0))
        .join(Payment, Payment.booking_id == Booking.id)
        .filter(Booking.user_id.in_(user_ids), func.lower(Payment.status) == "paid")
        .group_by(Booking.user_id)
        .all()
    )
    pending_totals = dict(
        db.query(Booking.user_id, func.coalesce(func.sum(Invoice.remaining_amount), 0))
        .join(Invoice, Invoice.booking_id == Booking.id)
        .filter(Booking.user_id.in_(user_ids), func.lower(Booking.status).notin_(["cancelled", "rejected"]))
        .group_by(Booking.user_id)
        .all()
    )
    return {
        user_id: {
            "total_bookings": int(booking_counts.get(user_id, 0)),
            "total_spending": float(spending_totals.get(user_id, 0)),
            "pending_amount": float(pending_totals.get(user_id, 0)),
        }
        for user_id in user_ids
    }


@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    if current_user.role != "admin" and current_user.id != customer_id:
        raise HTTPException(status_code=403, detail="You can only view your own customer profile")
    user = db.query(User).filter(User.id == customer_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "address": customer.address if customer else "",
        "city": customer.city if customer else "",
        "district": customer.district if customer else "",
        "state": customer.state if customer else "",
        "pincode": customer.pincode if customer else "",
        **customer_metrics(db, [user.id])[user.id],
    }


@app.patch("/api/customers/{customer_id}")
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    if current_user.role != "admin" and current_user.id != customer_id:
        raise HTTPException(status_code=403, detail="You can only update your own customer profile")
    user = db.query(User).filter(User.id == customer_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = db.query(Customer).filter(Customer.user_id == user.id).first()
    if customer is None:
        customer = Customer(user_id=user.id)
        db.add(customer)

    user.full_name = payload.full_name
    user.phone = payload.phone
    customer.address = payload.address
    customer.city = payload.city
    customer.district = payload.district
    customer.state = payload.state
    customer.pincode = payload.pincode
    db.commit()
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "address": customer.address,
        "city": customer.city,
        "district": customer.district,
        "state": customer.state,
        "pincode": customer.pincode,
        **customer_metrics(db, [user.id])[user.id],
    }


def serialize_staff(staff: Staff, user: User) -> dict:
    return {
        "id": staff.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "designation": staff.designation,
        "department": staff.department,
        "is_active": user.is_active,
    }


@app.get("/api/staff")
def list_staff(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    records = db.query(Staff, User).join(User, User.id == Staff.user_id).order_by(Staff.id.desc()).all()
    return [serialize_staff(staff, user) for staff, user in records]


@app.post("/api/staff")
def create_staff(payload: StaffCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")

    user = User(
        full_name=payload.full_name,
        email=email,
        phone=payload.phone,
        password_hash=get_password_hash(payload.password),
        role="staff",
    )
    db.add(user)
    db.flush()
    staff = Staff(user_id=user.id, designation=payload.designation, department=payload.department)
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return serialize_staff(staff, user)


@app.patch("/api/staff/{staff_id}")
def update_staff(staff_id: int, payload: StaffUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="At least one staff field must be provided")

    user = db.query(User).filter(User.id == staff.user_id).first()
    if "designation" in changes:
        staff.designation = changes["designation"]
    if "department" in changes:
        staff.department = changes["department"]
    if "is_active" in changes:
        user.is_active = changes["is_active"]
    db.commit()
    return serialize_staff(staff, user)


def serialize_vehicle(vehicle: Vehicle) -> dict:
    return {
        "id": vehicle.id,
        "name": vehicle.name,
        "vehicle_number": vehicle.vehicle_number,
        "vehicle_type": vehicle.vehicle_type,
        "driver_name": vehicle.driver_name,
        "driver_phone": vehicle.driver_phone,
        "price_per_day": vehicle.price_per_day,
        "price_per_km": vehicle.price_per_km,
        "availability": vehicle.availability,
        "image_url": vehicle.image_url,
    }


@app.get("/api/vehicles")
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    return [serialize_vehicle(vehicle) for vehicle in db.query(Vehicle).order_by(Vehicle.id.desc()).all()]


@app.post("/api/vehicles")
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    vehicle_number = payload.vehicle_number.upper()
    if db.query(Vehicle).filter(func.upper(Vehicle.vehicle_number) == vehicle_number).first():
        raise HTTPException(status_code=409, detail="Vehicle number is already registered")

    vehicle = Vehicle(
        name=payload.name,
        vehicle_number=vehicle_number,
        vehicle_type=payload.vehicle_type,
        driver_name=payload.driver_name,
        driver_phone=payload.driver_phone,
        price_per_day=payload.price_per_day,
        price_per_km=payload.price_per_km,
        availability=payload.availability,
        image_url=payload.image_url,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return serialize_vehicle(vehicle)


@app.patch("/api/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, payload: VehicleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="At least one vehicle field must be provided")
    for field, value in changes.items():
        setattr(vehicle, field, value)
    db.commit()
    return serialize_vehicle(vehicle)


def serialize_catering_menu(menu: CateringMenu) -> dict:
    return {
        "id": menu.id,
        "name": menu.name,
        "description": menu.description,
        "price_per_plate": menu.price_per_plate,
        "plates": menu.plates,
        "is_veg": menu.is_veg,
        "serving_time": menu.serving_time,
    }


@app.get("/api/catering-menus")
def list_catering_menus(db: Session = Depends(get_db)) -> list[dict]:
    return [serialize_catering_menu(menu) for menu in db.query(CateringMenu).order_by(CateringMenu.name).all()]


@app.post("/api/catering-menus")
def create_catering_menu(payload: CateringMenuCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    menu = CateringMenu(**payload.model_dump())
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return serialize_catering_menu(menu)


@app.patch("/api/catering-menus/{menu_id}")
def update_catering_menu(menu_id: int, payload: CateringMenuUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    menu = db.query(CateringMenu).filter(CateringMenu.id == menu_id).first()
    if menu is None:
        raise HTTPException(status_code=404, detail="Catering menu not found")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="At least one menu field must be provided")
    for field, value in changes.items():
        setattr(menu, field, value)
    db.commit()
    return serialize_catering_menu(menu)


@app.get("/api/inventory")
def list_inventory(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    inventory = db.query(Inventory).all()
    response = []
    for item in inventory:
        response.append(
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "total_quantity": item.total_quantity,
                "available_quantity": item.available_quantity,
                "booked_quantity": item.booked_quantity,
                "damaged_quantity": item.damaged_quantity,
                "lost_quantity": item.lost_quantity,
                "returned_quantity": item.returned_quantity,
                "location": item.location,
            }
        )
    return response


@app.patch("/api/inventory/{product_id}")
def update_inventory(product_id: int, payload: InventoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    inventory = db.query(Inventory).filter(Inventory.product_id == product.id).first()
    if inventory is None:
        inventory = Inventory(
            product_id=product.id,
            total_quantity=product.quantity,
            available_quantity=product.available_quantity,
            location=product.location,
        )
        db.add(inventory)

    total_quantity = product.quantity if payload.total_quantity is None else payload.total_quantity
    damaged_quantity = inventory.damaged_quantity if payload.damaged_quantity is None else payload.damaged_quantity
    lost_quantity = inventory.lost_quantity if payload.lost_quantity is None else payload.lost_quantity
    if damaged_quantity + lost_quantity > total_quantity:
        raise HTTPException(status_code=400, detail="Damaged and lost quantities cannot exceed total stock")

    location = product.location if payload.location is None else payload.location
    available_quantity = total_quantity - damaged_quantity - lost_quantity
    product.quantity = total_quantity
    product.available_quantity = available_quantity
    product.location = location
    inventory.total_quantity = total_quantity
    inventory.available_quantity = available_quantity
    inventory.damaged_quantity = damaged_quantity
    inventory.lost_quantity = lost_quantity
    inventory.location = location
    db.commit()
    return {
        "message": "Inventory updated",
        "product_id": product.id,
        "total_quantity": total_quantity,
        "available_quantity": available_quantity,
        "damaged_quantity": damaged_quantity,
        "lost_quantity": lost_quantity,
        "location": location,
    }


@app.get("/api/payments")
def list_payments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    query = db.query(Payment).join(Booking, Booking.id == Payment.booking_id)
    if current_user.role != "admin":
        query = query.filter(Booking.user_id == current_user.id)
    payment_rows = query.order_by(Payment.id.desc()).all()
    return [
        {
            "id": item.id,
            "booking_id": item.booking_id,
            "amount": item.amount,
            "status": item.status,
            "payment_method": item.payment_method,
            "created_at": item.created_at.isoformat(),
        }
        for item in payment_rows
    ]


@app.post("/api/payments")
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only pay for your own bookings")
    if booking.status.lower() in {"cancelled", "rejected"}:
        raise HTTPException(status_code=400, detail="Payments cannot be recorded for cancelled bookings")

    reserved_amount = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.booking_id == booking.id,
            func.lower(Payment.status).in_(["pending", "paid"]),
        )
        .scalar()
    )
    remaining_amount = max(0, booking.grand_total - reserved_amount)
    if payload.amount > remaining_amount:
        raise HTTPException(status_code=400, detail=f"Payment exceeds the remaining balance of {remaining_amount:.2f}")

    payment = Payment(
        booking_id=payload.booking_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        status="Pending",
    )
    db.add(payment)
    add_notification(db, booking.user_id, "Payment submitted", f"Your payment of {payload.amount:.2f} for booking #{booking.id} is awaiting confirmation.")
    db.commit()
    db.refresh(payment)
    return {"message": "Payment recorded for confirmation", "payment_id": payment.id, "status": payment.status}


@app.patch("/api/payments/{payment_id}/status")
def update_payment_status(payment_id: int, payload: PaymentStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payload.status == "Paid":
        other_paid_amount = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.booking_id == payment.booking_id,
                Payment.id != payment.id,
                func.lower(Payment.status) == "paid",
            )
            .scalar()
        )
        booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
        if other_paid_amount + payment.amount > booking.grand_total:
            raise HTTPException(status_code=400, detail="Confirming this payment would exceed the booking total")

    payment.status = payload.status
    db.flush()
    booking = db.query(Booking).filter(Booking.id == payment.booking_id).first()
    title = "Payment confirmed" if payload.status == "Paid" else "Payment failed"
    add_notification(db, booking.user_id, title, f"Payment #{payment.id} for booking #{booking.id} is {payload.status.lower()}.")
    invoice = db.query(Invoice).filter(Invoice.booking_id == payment.booking_id).first()
    if invoice:
        paid_amount = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(Payment.booking_id == payment.booking_id, func.lower(Payment.status) == "paid")
            .scalar()
        )
        invoice.paid_amount = min(float(paid_amount), invoice.final_amount)
        invoice.remaining_amount = max(0, invoice.final_amount - invoice.paid_amount)
    db.commit()
    return {"message": "Payment status updated", "payment_id": payment.id, "status": payment.status}


@app.post("/api/quotations")
def create_quotation(payload: QuotationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    product_lines = []
    quotation_total = 0.0
    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.status == "active").first()
        if product is None:
            raise HTTPException(status_code=404, detail=f"Active product {item.product_id} not found")
        line_total = float(product.rental_price) * item.quantity
        quotation_total += line_total
        product_lines.append(QuotationItem(
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.rental_price,
            total_price=line_total,
        ))

    quotation = Quotation(
        customer_name=current_user.full_name,
        customer_phone=current_user.phone or "",
        event_date=payload.event_date,
        location=payload.location,
        total_amount=quotation_total,
        status="Pending",
    )
    quotation.owner = QuotationOwner(user_id=current_user.id)
    quotation.items = product_lines
    db.add(quotation)
    db.flush()
    add_notification(db, current_user.id, "Quotation created", f"Quotation #{quotation.id} was created for {payload.event_date.isoformat()}.")
    db.commit()
    db.refresh(quotation)
    return {"message": "Quotation created", **serialize_quotation(quotation)}


def serialize_quotation(quotation: Quotation) -> dict:
    return {
        "id": quotation.id,
        "customer_name": quotation.customer_name,
        "customer_email": quotation.owner.user.email if quotation.owner is not None else "",
        "customer_phone": quotation.customer_phone,
        "event_date": quotation.event_date.isoformat(),
        "location": quotation.location,
        "total_amount": quotation.total_amount,
        "status": quotation.status,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
            }
            for item in quotation.items
        ],
    }


@app.get("/api/quotations")
def list_quotations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    query = db.query(Quotation)
    if current_user.role != "admin":
        query = query.join(QuotationOwner).filter(QuotationOwner.user_id == current_user.id)
    return [serialize_quotation(item) for item in query.order_by(Quotation.id.desc()).all()]


@app.get("/api/quotations/{quotation_id}")
def get_quotation(quotation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if current_user.role != "admin" and (quotation.owner is None or quotation.owner.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="You can only view your own quotations")
    return serialize_quotation(quotation)


@app.patch("/api/quotations/{quotation_id}/status")
def update_quotation_status(quotation_id: int, payload: QuotationStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> dict:
    quotation = db.query(Quotation).filter(Quotation.id == quotation_id).first()
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    if quotation.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending quotations can be updated")
    quotation.status = payload.status
    if quotation.owner is not None:
        add_notification(db, quotation.owner.user_id, f"Quotation {payload.status.lower()}", f"Quotation #{quotation.id} was {payload.status.lower()} by EventHub.")
    db.commit()
    return {"message": "Quotation status updated", "id": quotation.id, "status": quotation.status}


@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> DashboardStat:
    total_bookings = db.query(Booking).count()
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(func.lower(Payment.status) == "paid").scalar()
    pending_payments = (
        db.query(func.coalesce(func.sum(Invoice.remaining_amount), 0))
        .join(Booking, Booking.id == Invoice.booking_id)
        .filter(func.lower(Booking.status).notin_(["cancelled", "rejected"]))
        .scalar()
    )
    available_products = db.query(Product).filter(Product.status == "active", Product.available_quantity > 0).count()
    low_stock_items = db.query(Product).filter(Product.status == "active", Product.available_quantity < 10).count()
    customers = db.query(User).filter(User.role == "customer").count()
    return DashboardStat(
        total_bookings=total_bookings,
        total_revenue=float(total_revenue),
        pending_payments=float(pending_payments),
        available_products=available_products,
        low_stock_items=low_stock_items,
        customers=customers,
    )


@app.get("/api/dashboard/revenue")
def revenue_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    today = date.today()
    months = []
    for offset in range(5, -1, -1):
        month_index = today.year * 12 + today.month - 1 - offset
        month_date = date(month_index // 12, month_index % 12 + 1, 1)
        months.append(month_date)

    revenue_by_month = {month.strftime("%Y-%m"): 0.0 for month in months}
    paid_payments = (
        db.query(Payment.amount, Payment.created_at)
        .filter(func.lower(Payment.status) == "paid")
        .all()
    )
    for amount, created_at in paid_payments:
        month_key = created_at.strftime("%Y-%m")
        if month_key in revenue_by_month:
            revenue_by_month[month_key] += float(amount)

    return [
        {"month": month.strftime("%b %Y"), "revenue": revenue_by_month[month.strftime("%Y-%m")]}
        for month in months
    ]


@app.get("/api/dashboard/bookings")
def booking_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)) -> list[dict]:
    rows = (
        db.query(Booking.event_type, func.count(Booking.id))
        .filter(func.lower(Booking.status).notin_(["cancelled", "rejected"]))
        .group_by(Booking.event_type)
        .order_by(func.count(Booking.id).desc())
        .all()
    )
    return [{"name": event_type, "value": count} for event_type, count in rows]


@app.get("/api/reports/summary")
def report_summary(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    query = db.query(Booking).order_by(Booking.event_date, Booking.id)
    if start_date:
        query = query.filter(Booking.event_date >= start_date)
    if end_date:
        query = query.filter(Booking.event_date <= end_date)
    bookings = query.all()
    active_bookings = [booking for booking in bookings if booking.status.lower() not in {"cancelled", "rejected"}]
    active_ids = [booking.id for booking in active_bookings]
    paid_rows = []
    invoice_rows = []
    if active_ids:
        paid_rows = (
            db.query(Payment.booking_id, func.sum(Payment.amount))
            .filter(Payment.booking_id.in_(active_ids), func.lower(Payment.status) == "paid")
            .group_by(Payment.booking_id)
            .all()
        )
        invoice_rows = db.query(Invoice.booking_id, Invoice.remaining_amount).filter(Invoice.booking_id.in_(active_ids)).all()
    paid_by_booking = {booking_id: float(amount) for booking_id, amount in paid_rows}
    due_by_booking = {booking_id: float(amount) for booking_id, amount in invoice_rows}

    event_type_counts: dict[str, int] = {}
    for booking in active_bookings:
        event_type_counts[booking.event_type] = event_type_counts.get(booking.event_type, 0) + 1

    active_ids_set = set(active_ids)
    rows = [
        {
            "booking_id": booking.id,
            "customer_name": booking.user.full_name,
            "event_type": booking.event_type,
            "event_date": booking.event_date.isoformat(),
            "status": booking.status,
            "booking_total": booking.grand_total,
            "paid_amount": paid_by_booking.get(booking.id, 0.0),
            "balance_due": due_by_booking.get(booking.id, max(0, booking.grand_total - paid_by_booking.get(booking.id, 0.0))) if booking.id in active_ids_set else 0.0,
        }
        for booking in bookings
    ]
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "totals": {
            "total_bookings": len(bookings),
            "active_bookings": len(active_bookings),
            "booking_value": sum(booking.grand_total for booking in active_bookings),
            "revenue_collected": sum(paid_by_booking.values()),
            "outstanding_balance": sum(row["balance_due"] for row in rows),
        },
        "event_types": [{"name": name, "count": count} for name, count in sorted(event_type_counts.items())],
        "bookings": rows,
    }


@app.get("/api/reports/summary")
def report_summary(
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
) -> dict:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be on or before end_date")

    query = db.query(Booking).order_by(Booking.event_date, Booking.id)
    if start_date:
        query = query.filter(Booking.event_date >= start_date)
    if end_date:
        query = query.filter(Booking.event_date <= end_date)
    bookings = query.all()
    active_bookings = [booking for booking in bookings if booking.status.lower() not in {"cancelled", "rejected"}]
    active_ids = [booking.id for booking in active_bookings]

    paid_rows = []
    invoice_rows = []
    if active_ids:
        paid_rows = (
            db.query(Payment.booking_id, func.sum(Payment.amount))
            .filter(Payment.booking_id.in_(active_ids), func.lower(Payment.status) == "paid")
            .group_by(Payment.booking_id)
            .all()
        )
        invoice_rows = db.query(Invoice.booking_id, Invoice.remaining_amount).filter(Invoice.booking_id.in_(active_ids)).all()
    paid_by_booking = {booking_id: float(amount) for booking_id, amount in paid_rows}
    due_by_booking = {booking_id: float(amount) for booking_id, amount in invoice_rows}

    event_type_counts: dict[str, int] = {}
    for booking in active_bookings:
        event_type_counts[booking.event_type] = event_type_counts.get(booking.event_type, 0) + 1

    rows = [
        {
            "booking_id": booking.id,
            "customer_name": booking.user.full_name,
            "event_type": booking.event_type,
            "event_date": booking.event_date.isoformat(),
            "status": booking.status,
            "booking_total": booking.grand_total,
            "paid_amount": paid_by_booking.get(booking.id, 0.0),
            "balance_due": due_by_booking.get(booking.id, 0.0) if booking in active_bookings else 0.0,
        }
        for booking in bookings
    ]
    return {
        "start_date": start_date.isoformat() if start_date else None,
        "end_date": end_date.isoformat() if end_date else None,
        "totals": {
            "total_bookings": len(bookings),
            "active_bookings": len(active_bookings),
            "booking_value": sum(booking.grand_total for booking in active_bookings),
            "revenue_collected": sum(paid_by_booking.values()),
            "outstanding_balance": sum(due_by_booking.values()),
        },
        "event_types": [{"name": name, "count": count} for name, count in sorted(event_type_counts.items())],
        "bookings": rows,
    }


@app.get("/api/invoices/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict:
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    booking = db.query(Booking).filter(Booking.id == invoice.booking_id).first()
    if current_user.role != "admin" and booking.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view invoices for your own bookings")
    return {
        "id": invoice.id,
        "booking_id": invoice.booking_id,
        "customer_name": booking.user.full_name,
        "customer_email": booking.user.email,
        "customer_phone": booking.user.phone,
        "event_type": booking.event_type,
        "event_date": booking.event_date.isoformat(),
        "event_address": booking.address,
        "city": booking.city,
        "district": booking.district,
        "state": booking.state,
        "pincode": booking.pincode,
        "invoice_number": invoice.invoice_number,
        "created_at": invoice.created_at.isoformat(),
        "items": [
            {
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "total_price": item.total_price,
            }
            for item in booking.items
        ] + [
            {
                "product_name": f"{item.vehicle.name} rental ({item.days} days, {item.kilometers:g} km)",
                "quantity": 1,
                "unit_price": item.total_price,
                "total_price": item.total_price,
            }
            for item in booking.vehicle_items
        ] + [
            {
                "product_name": f"{item.menu.name} catering",
                "quantity": item.plates,
                "unit_price": item.price_per_plate,
                "total_price": item.total_price,
            }
            for item in booking.catering_items
        ],
        "subtotal": invoice.subtotal,
        "discount": invoice.discount,
        "tax": invoice.tax,
        "delivery_charge": invoice.delivery_charge,
        "setup_charge": invoice.setup_charge,
        "security_deposit": invoice.security_deposit,
        "final_amount": invoice.final_amount,
        "paid_amount": invoice.paid_amount,
        "remaining_amount": invoice.remaining_amount,
    }


@app.get("/api/invoices")
def list_invoices(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict]:
    query = db.query(Invoice).join(Booking, Booking.id == Invoice.booking_id)
    if current_user.role != "admin":
        query = query.filter(Booking.user_id == current_user.id)
    invoices = query.order_by(Invoice.id.desc()).all()
    return [
        {
            "id": invoice.id,
            "booking_id": invoice.booking_id,
            "customer_name": invoice.booking.user.full_name,
            "event_date": invoice.booking.event_date.isoformat(),
            "invoice_number": invoice.invoice_number,
            "subtotal": invoice.subtotal,
            "final_amount": invoice.final_amount,
            "paid_amount": invoice.paid_amount,
            "remaining_amount": invoice.remaining_amount,
        }
        for invoice in invoices
    ]
