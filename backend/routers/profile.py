from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth


router = APIRouter()

# getAllDoctors & getAllProfiles
@router.get('/',  dependencies=[Depends(require_auth)])
def get_all_doctors(request: Request):
  client = get_supabase_jwt_client(request)

  response = client.table('profile').select('*, image:image_id(image_url), role:role_id(name)').execute()

  profile = []

  for data in response.data:
    image = data.get('image')
    role = data.get('role')
    if role:
      data['role_name'] = role.get('name')
      del data['role']

    if image:
      data['image_url'] = image.get('image_url')
      del data['image']
    
    profile.append(data)
    

  return {
    "count" : len(response.data) if response.data else 0,
    "data" : profile
  }


# getDoctorForPatient
@router.get('/doctor/{patient_id}',  dependencies=[Depends(require_auth)])
def get_doctor_for_patient(patient_id: str, request: Request):
  client = get_supabase_jwt_client(request)

  response = client.table('doctor_patient').select('*').eq('patient_id', patient_id).execute()

    

  return {
    "count" : len(response.data) if response.data else 0,
    "data" : response.data
  }

# isDoctorAssociatedWithPatient
@router.get('/association/{patient_id}/{doctor_id}',  dependencies=[Depends(require_auth)])
def is_doctor_associated_with_patient(patient_id: str, doctor_id: str, request: Request):
  client = get_supabase_jwt_client(request)

  response = client.table('doctor_patient').select('*').eq('patient_id', patient_id).eq('doctor_id', doctor_id).execute()
  return {
    "count" : len(response.data) if response.data else 0,
    "data" : response.data
  }

# getProfileByUserId
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