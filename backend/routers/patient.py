from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user

router = APIRouter()


@router.get('/')
def all_patients():
  client = get_supabase_admin_client()
  patients = client.table('patient').select("*").execute()
  return {
      "count": len(patients.data) if patients.data else 0,
      "data": patients.data
    }



@router.get("/my-patients", dependencies=[Depends(require_auth)])
async def all_doctors_patients(request: Request):
    client = get_supabase_jwt_client(request)   # <-- now bound to user’s token

    
    patients = client.table('patient').select("*, image:image_id(image_url)").execute()

    data = []
    for p in patients.data:
        data.append({
            **p,
            "imageUrl": p.get("image", {}).get("image_url")
        })

    return {
        "count": len(patients.data) if patients.data else 0,
        "data": data
    }

# {'user_id': '7fdd9ed0-b1c9-4939-9374-1ca842c2c081', 'role': {'id': '6c11f0e2-7936-467f-b13c-d0ad9f14c1b1', 'name': 'Administrator'}}