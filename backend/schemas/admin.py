from typing import Optional, Dict, Any
from pydantic import BaseModel

class AdminActionRequest(BaseModel):
    action: str
    target_entity: str
    target_id: str
    details: Optional[Dict[str, Any]] = None
