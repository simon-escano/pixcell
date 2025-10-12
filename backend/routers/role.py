

from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth



router = APIRouter()



# getAllRoles

@router.get('/')
def all_roles():
  client = get_supabase_admin_client()
  response = client.table('role').select('*').execute()

  return {
    'count' : len(response.data) if response.data else 0,
    'data' : response.data
  }

# getRoleById
@router.get('/{role_id}')
def get_role_by_id(role_id : str):
  client = get_supabase_admin_client()
  response = client.table('role').select('*').eq('id',role_id).execute()

  return {
    'count' : len(response.data) if response.data else 0,
    'data' : response.data
  }