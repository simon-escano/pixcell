from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import logging
from datetime import datetime
import asyncio
from supabase import create_client, Client
import json
import httpx
from urllib.parse import quote

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class SignupRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    roleId: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    errorMessage: Optional[str] = None
    message: Optional[str] = None

# Initialize Supabase client
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key for admin operations
    
    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    return create_client(url, key)

# Database connection (assuming you have this set up)
# You'll need to replace this with your actual database setup
async def get_db():
    # Replace with your database connection logic
    # This is a placeholder - you'll need to implement your actual DB connection
    pass

def get_error_message(error: Exception) -> str:
    """Convert exception to user-friendly error message"""
    return str(error)

@router.post("/signup", response_model=AuthResponse)
async def signup_endpoint(
    email: str = Form(...),
    password: str = Form(...),
    firstName: str = Form(...),
    lastName: str = Form(...),
    roleId: str = Form(...)
):
    """
    User signup endpoint
    Creates a new user in Supabase Auth and stores profile data in database
    """
    try:
        supabase = get_supabase_client()
        
        # Sign up user with Supabase Auth
        app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
        
        auth_response = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "email_redirect_to": f"{app_url}/login"
            }
        })
        
        if auth_response.user is None:
            raise HTTPException(status_code=400, detail="Failed to create user")
            
        user_id = auth_response.user.id
        logger.info(f"Created user with ID: {user_id}")
        
        # Generate avatar image URL
        encoded_first = quote(firstName)
        encoded_last = quote(lastName)
        image_url = f"https://api.dicebear.com/7.x/initials/svg?seed={encoded_first}%{encoded_last}"
        
        # Insert image record
        image_id = str(uuid.uuid4())
        image_insert_response = supabase.table("image").insert({
            "id": image_id,
            "imageUrl": image_url
        }).execute()
        
        if not image_insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create image record")
            
        logger.info(f"Created image record with ID: {image_id}")
        
        # Verify role exists
        role_response = supabase.table("role").select("*").eq("id", roleId).execute()
        
        if not role_response.data:
            raise HTTPException(status_code=400, detail=f"Role with id '{roleId}' not found in the database")
            
        logger.info(f"Found role: {role_response.data[0]}")
        
        # Insert profile record
        profile_data = {
            "id": user_id,
            "firstName": firstName,
            "lastName": lastName,
            "userId": user_id,
            "roleId": roleId,
            "imageId": image_id,
        }
        
        profile_response = supabase.table("profile").insert(profile_data).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=500, detail="Failed to create profile record")
            
        logger.info(f"Created profile with data: {profile_data}")
        
        return AuthResponse(
            errorMessage=None,
            message="User created successfully. Please check your email to confirm your account."
        )
        
    except Exception as error:
        logger.error(f"Signup error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

@router.post("/login", response_model=AuthResponse)
async def login_endpoint(
    email: str = Form(...),
    password: str = Form(...)
):
    """
    User login endpoint
    Authenticates user with Supabase Auth
    """
    try:
        supabase = get_supabase_client()
        
        # Sign in user with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        
        if auth_response.session is None:
            raise HTTPException(status_code=401, detail="No session created")
            
        logger.info(f"User logged in successfully: {auth_response.user.email}")
        
        # You might want to return the session token or user info
        # For security, consider setting HTTP-only cookies instead
        return AuthResponse(
            errorMessage=None,
            message="Login successful"
        )
        
    except Exception as error:
        logger.error(f"Login error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

# Alternative JSON-based endpoints (if you prefer JSON over form data)
@router.post("/signup-json", response_model=AuthResponse)
async def signup_json_endpoint(request: SignupRequest):
  """JSON-based signup endpoint"""
  try:
      supabase = get_supabase_client()
      
      app_url = os.getenv("SUPABASE_ANON_KEY", "http://localhost:3000")
      
      auth_response = supabase.auth.sign_up({
          "email": request.email,
          "password": request.password,
          "options": {
              "email_redirect_to": f"{app_url}/login"
          }
      })
      
      if auth_response.user is None:
          raise HTTPException(status_code=400, detail="Failed to create user")
          
      user_id = auth_response.user.id
      
      # Generate avatar image URL
      encoded_first = quote(request.firstName)
      encoded_last = quote(request.lastName)
      image_url = f"https://api.dicebear.com/7.x/initials/svg?seed={encoded_first}%{encoded_last}"
      
      # Insert image record
      image_id = str(uuid.uuid4())
      image_insert_response = supabase.table("image").insert({
          "id": image_id,
          "imageUrl": image_url
      }).execute()
      
      if not image_insert_response.data:
          raise HTTPException(status_code=500, detail="Failed to create image record")
      
      # Verify role exists
      role_response = supabase.table("role").select("*").eq("id", request.roleId).execute()
      
      if not role_response.data:
          raise HTTPException(status_code=400, detail=f"Role with id '{request.roleId}' not found in the database")
      
      # Insert profile record
      profile_data = {
          "id": user_id,
          "firstName": request.firstName,
          "lastName": request.lastName,
          "userId": user_id,
          "roleId": request.roleId,
          "imageId": image_id,
      }
      
      profile_response = supabase.table("profile").insert(profile_data).execute()
      
      if not profile_response.data:
          raise HTTPException(status_code=500, detail="Failed to create profile record")
      
      return AuthResponse(
          errorMessage=None,
          message="User created successfully. Please check your email to confirm your account."
      )
      
  except Exception as error:
      logger.error(f"Signup error: {error}")
      return AuthResponse(errorMessage=get_error_message(error))

@router.post("/login-json", response_model=AuthResponse)
async def login_json_endpoint(request: LoginRequest):
  """JSON-based login endpoint"""
  try:
      supabase = get_supabase_client()
      
      auth_response = supabase.auth.sign_in_with_password({
          "email": request.email,
          "password": request.password
      })
      
      if auth_response.session is None:
          raise HTTPException(status_code=401, detail="No session created")
      
      return AuthResponse(
          errorMessage=None,
          message="Login successful"
      )
      
  except Exception as error:
      logger.error(f"Login error: {error}")
      return AuthResponse(errorMessage=get_error_message(error))