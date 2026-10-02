from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(Text, default="")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(30), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="customer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    address = Column(Text, default="")
    city = Column(String(100), default="")
    district = Column(String(100), default="")
    state = Column(String(100), default="")
    pincode = Column(String(20), default="")
    total_bookings = Column(Integer, default=0)
    total_spending = Column(Float, default=0.0)
    pending_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(Text, default="")
    images = Column(Text, default="[]")
    quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    rental_price = Column(Float, default=0.0)
    unit = Column(String(50), default="Piece")
    security_deposit = Column(Float, default=0.0)
    delivery_charge = Column(Float, default=0.0)
    setup_charge = Column(Float, default=0.0)
    status = Column(String(50), default="active")
    location = Column(String(150), default="Aurangabad")
    tags = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, unique=True)
    total_quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)
    booked_quantity = Column(Integer, default=0)
    damaged_quantity = Column(Integer, default=0)
    lost_quantity = Column(Integer, default=0)
    returned_quantity = Column(Integer, default=0)
    location = Column(String(150), default="Warehouse")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(80), default="Wedding")
    event_date = Column(Date, nullable=False)
    start_time = Column(String(20), default="10:00")
    end_time = Column(String(20), default="22:00")
    address = Column(String(200), default="")
    city = Column(String(80), default="")
    district = Column(String(80), default="")
    state = Column(String(80), default="")
    pincode = Column(String(20), default="")
    status = Column(String(50), default="Pending")
    subtotal = Column(Float, default=0.0)
    delivery_charge = Column(Float, default=0.0)
    setup_charge = Column(Float, default=0.0)
    security_deposit = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    items = relationship("BookingItem", back_populates="booking", cascade="all, delete-orphan")
    vehicle_items = relationship("BookingVehicle", back_populates="booking", cascade="all, delete-orphan")
    catering_items = relationship("BookingCatering", back_populates="booking", cascade="all, delete-orphan")
    assignment = relationship("BookingAssignment", back_populates="booking", uselist=False, cascade="all, delete-orphan")


class BookingItem(Base):
    __tablename__ = "booking_items"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    booking = relationship("Booking", back_populates="items")
    product = relationship("Product")


class BookingVehicle(Base):
    __tablename__ = "booking_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    days = Column(Integer, nullable=False)
    kilometers = Column(Float, default=0.0)
    daily_rate = Column(Float, default=0.0)
    km_rate = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    booking = relationship("Booking", back_populates="vehicle_items")
    vehicle = relationship("Vehicle")


class BookingCatering(Base):
    __tablename__ = "booking_catering"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    menu_id = Column(Integer, ForeignKey("catering_menus.id"), nullable=False)
    plates = Column(Integer, nullable=False)
    price_per_plate = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    booking = relationship("Booking", back_populates="catering_items")
    menu = relationship("CateringMenu")


class BookingAssignment(Base):
    __tablename__ = "booking_assignments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), unique=True, nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    assigned_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="assignment")
    staff = relationship("Staff")
    assigned_by = relationship("User")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    amount = Column(Float, default=0.0)
    payment_method = Column(String(50), default="Cash")
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(150), nullable=False)
    customer_phone = Column(String(30), default="")
    business_name = Column(String(150), default="EventHub")
    event_date = Column(Date, nullable=False)
    location = Column(String(200), default="")
    total_amount = Column(Float, default=0.0)
    status = Column(String(50), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("QuotationOwner", back_populates="quotation", uselist=False, cascade="all, delete-orphan")
    items = relationship("QuotationItem", back_populates="quotation", cascade="all, delete-orphan")


class QuotationOwner(Base):
    __tablename__ = "quotation_owners"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    quotation = relationship("Quotation", back_populates="owner")
    user = relationship("User")


class QuotationItem(Base):
    __tablename__ = "quotation_items"

    id = Column(Integer, primary_key=True, index=True)
    quotation_id = Column(Integer, ForeignKey("quotations.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)

    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    delivery_charge = Column(Float, default=0.0)
    setup_charge = Column(Float, default=0.0)
    security_deposit = Column(Float, default=0.0)
    final_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    vehicle_number = Column(String(50), unique=True, nullable=False)
    vehicle_type = Column(String(80), default="Luxury")
    driver_name = Column(String(120), default="")
    driver_phone = Column(String(30), default="")
    price_per_day = Column(Float, default=0.0)
    price_per_km = Column(Float, default=0.0)
    availability = Column(String(30), default="Available")
    image_url = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class CateringMenu(Base):
    __tablename__ = "catering_menus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, default="")
    price_per_plate = Column(Float, default=0.0)
    plates = Column(Integer, default=0)
    is_veg = Column(Boolean, default=True)
    serving_time = Column(String(30), default="Dinner")
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, default="")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class NotificationRead(Base):
    __tablename__ = "notification_reads"
    __table_args__ = (UniqueConstraint("notification_id", "user_id", name="uq_notification_read_user"),)

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    designation = Column(String(80), default="Staff")
    department = Column(String(80), default="Operations")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    details = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class BusinessSettings(Base):
    __tablename__ = "business_settings"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(150), default="EventHub")
    gst_number = Column(String(80), default="")
    tax_rate = Column(Float, default=5.0)
    currency = Column(String(10), default="INR")
    whatsapp_number = Column(String(30), default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
