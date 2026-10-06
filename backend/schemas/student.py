from typing import Optional, Dict, Any
from pydantic import BaseModel

class StudentProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

class ChangeInfoSubmit(BaseModel):
    field_to_change: str
    current_value: Optional[str] = None
    requested_value: str
    reason: str

class UpdationInfoSubmit(BaseModel):
    category: str
    details: Dict[str, Any]

class DocumentUpload(BaseModel):
    document_type: str
    title: str
    file_url: Optional[str] = None

class FeePaymentIntent(BaseModel):
    amount: float
    fee_type: str = "Tuition"
    semester: int = 5
