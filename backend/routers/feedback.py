

from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth

router = APIRouter()
@router.get('/')
def get_all_feedbacks():
  client = get_supabase_admin_client()
  response = client.table('feedback').select('*').execute()

  return{
    'count' : len(response.data) if response.data else 0,
    'data' : response.data
  }

# getFeedbackByUser
@router.get('/user/{user_id}')
def get_feedback_by_user(user_id: str):
  client = get_supabase_admin_client()
  response = client.table('feedback').select('*').eq('user_id',user_id).execute()

  return{
    'count' : len(response.data) if response.data else 0,
    'data' : response.data
  }