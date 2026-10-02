from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: str = Field(min_length=3, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=30)
    password: str = Field(min_length=8)
    designation: str = Field(default="Staff", min_length=1, max_length=80)
    department: str = Field(default="Operations", min_length=1, max_length=80)


class StaffUpdate(BaseModel):
    designation: Optional[str] = Field(default=None, min_length=1, max_length=80)
    department: Optional[str] = Field(default=None, min_length=1, max_length=80)
    is_active: Optional[bool] = None


class VehicleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    vehicle_number: str = Field(min_length=1, max_length=50)
    vehicle_type: str = Field(default="Luxury", min_length=1, max_length=80)
    driver_name: str = Field(default="", max_length=120)
    driver_phone: str = Field(default="", max_length=30)
    price_per_day: float = Field(default=0, ge=0)
    price_per_km: float = Field(default=0, ge=0)
    availability: Literal["Available", "Booked", "Maintenance", "Unavailable"] = "Available"
    image_url: str = ""


class VehicleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    vehicle_type: Optional[str] = Field(default=None, min_length=1, max_length=80)
    driver_name: Optional[str] = Field(default=None, max_length=120)
    driver_phone: Optional[str] = Field(default=None, max_length=30)
    price_per_day: Optional[float] = Field(default=None, ge=0)
    price_per_km: Optional[float] = Field(default=None, ge=0)
    availability: Optional[Literal["Available", "Booked", "Maintenance", "Unavailable"]] = None
    image_url: Optional[str] = None


class CateringMenuCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str = ""
    price_per_plate: float = Field(ge=0)
    plates: int = Field(ge=0)
    is_veg: bool = True
    serving_time: str = Field(default="Dinner", min_length=1, max_length=30)


class CateringMenuUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    description: Optional[str] = None
    price_per_plate: Optional[float] = Field(default=None, ge=0)
    plates: Optional[int] = Field(default=None, ge=0)
    is_veg: Optional[bool] = None
    serving_time: Optional[str] = Field(default=None, min_length=1, max_length=30)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class CategoryOut(BaseModel):
    id: int
    name: str
    description: str = ""


class ProductOut(BaseModel):
    id: int
    name: str
    category_id: int
    description: str = ""
    images: list[str] = Field(default_factory=list)
    quantity: int = 0
    available_quantity: int = 0
    rental_price: float = 0.0
    unit: str = "Piece"
    security_deposit: float = 0.0
    delivery_charge: float = 0.0
    setup_charge: float = 0.0
    status: str = "active"
    location: str = "Aurangabad"
    tags: list[str] = Field(default_factory=list)


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category_id: int = Field(gt=0)
    description: str = ""
    quantity: int = Field(ge=0)
    rental_price: float = Field(ge=0)
    unit: str = Field(default="Piece", min_length=1, max_length=50)
    security_deposit: float = Field(default=0, ge=0)
    delivery_charge: float = Field(default=0, ge=0)
    setup_charge: float = Field(default=0, ge=0)
    location: str = Field(default="Aurangabad", max_length=150)


class InventoryUpdate(BaseModel):
    total_quantity: Optional[int] = Field(default=None, ge=0)
    damaged_quantity: Optional[int] = Field(default=None, ge=0)
    lost_quantity: Optional[int] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=150)


class AvailabilityCheck(BaseModel):
    product_id: int
    date: str
    start_time: str = "10:00"
    end_time: str = "22:00"
    requested_quantity: int = 1


class BookingItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class BookingVehicleCreate(BaseModel):
    vehicle_id: int = Field(gt=0)
    days: int = Field(default=1, ge=1)
    kilometers: float = Field(default=0, ge=0)


class BookingCateringCreate(BaseModel):
    menu_id: int = Field(gt=0)
    plates: int = Field(gt=0)


class StaffAssignment(BaseModel):
    staff_id: Optional[int] = Field(default=None, gt=0)


class BookingCreate(BaseModel):
    event_type: str = "Wedding"
    event_date: date
    start_time: str = "10:00"
    end_time: str = "22:00"
    address: str = ""
    city: str = ""
    district: str = ""
    state: str = ""
    pincode: str = ""
    items: List[BookingItemCreate] = Field(default_factory=list)
    vehicles: List[BookingVehicleCreate] = Field(default_factory=list)
    catering: List[BookingCateringCreate] = Field(default_factory=list)


class BookingStatusUpdate(BaseModel):
    status: Literal["Confirmed", "Rejected", "Completed"]


class PaymentCreate(BaseModel):
    booking_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    payment_method: str = Field(default="Cash", min_length=1, max_length=50)


class PaymentStatusUpdate(BaseModel):
    status: Literal["Paid", "Failed"]


class QuotationItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class QuotationCreate(BaseModel):
    event_date: date
    location: str = Field(min_length=1, max_length=200)
    items: List[QuotationItemCreate] = Field(min_length=1)


class QuotationStatusUpdate(BaseModel):
    status: Literal["Accepted", "Rejected"]


class DashboardStat(BaseModel):
    total_bookings: int = 0
    total_revenue: float = 0.0
    pending_payments: float = 0.0
    available_products: int = 0
    low_stock_items: int = 0
    customers: int = 0


class CustomerOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    total_bookings: int = 0
    total_spending: float = 0.0
    pending_amount: float = 0.0


class CustomerUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=30)
    address: str = Field(default="", max_length=500)
    city: str = Field(default="", max_length=100)
    district: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    pincode: str = Field(default="", max_length=20)
