from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user

router = APIRouter()

@router.get('/{user_id}',  dependencies=[Depends(require_auth)])
def profile_by_user_id(user_id: str, request: Request):
  client = get_supabase_jwt_client(request)
  response = client.table('profile').select('*, image:image_id(image_url)').eq('user_id', user_id).execute()

  profile = []

  for data in response.data:
    image = data.get('image')
    if image:
      data['image_url'] = image.get('image_url')
      del data['image']
    
    profile.append(data)
    

  return {
    "count" : len(response.data) if response.data else 0,
    "data" : response.data
  }