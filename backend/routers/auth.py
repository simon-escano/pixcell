from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends, Response, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import logging
from datetime import datetime, timedelta
import asyncio
from supabase import create_client, Client
from db import get_supabase_client, get_supabase_admin_client
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
    user: Optional[dict] = None
    session: Optional[dict] = None

class UserInfo(BaseModel):
    id: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None




# Get authenticated user from session
async def get_current_user(request: Request) -> Optional[dict]:
    """Extract user from session token"""
    try:
        # Get access token from cookie or Authorization header
        access_token = request.cookies.get("sb-access-token")
        if not access_token:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                access_token = auth_header.split(" ")[1]
        
        if not access_token:
            logger.warning("No access token found")
            return None
            
        supabase = get_supabase_client()
        
        # Set the session with the access token
        refresh_token = request.cookies.get("sb-refresh-token", "")
        
        try:
            supabase.auth.set_session(access_token, refresh_token)
            logger.info("Session set in get_current_user")
        except Exception as session_error:
            logger.error(f"Failed to set session in get_current_user: {session_error}")
            return None
        
        # Get the current user
        try:
            user_response = supabase.auth.get_user()
            logger.info(f"User response: {user_response}")
            
            if user_response.user:
                return user_response.user.__dict__
            else:
                logger.warning("No user found in response")
                return None
                
        except Exception as user_error:
            logger.error(f"Failed to get user: {user_error}")
            return None
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        return None

async def get_current_user_role(request: Request):
    """Fetch the current user's role from profile.role_id → role table"""
    try:
        # Get the current user first
        user = await get_current_user(request)
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        user_id = user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user session")

        client = get_supabase_admin_client()

        # Step 1: Get profile for this user
        profile_resp = client.table("profile").select("role_id").eq("user_id", user_id).single().execute()
        if not profile_resp.data:
            raise HTTPException(status_code=404, detail="Profile not found for user")

        role_id = profile_resp.data.get("role_id")
        if not role_id:
            raise HTTPException(status_code=404, detail="Role not assigned")

        # Step 2: Get role details
        role_resp = client.table("role").select("id, name").eq("id", role_id).single().execute()
        if not role_resp.data:
            raise HTTPException(status_code=404, detail="Role not found")

        return {
            "user_id": user_id,
            "role": role_resp.data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user role: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user role")


def get_error_message(error: Exception) -> str:
    """Convert exception to user-friendly error message"""
    error_str = str(error)
    # Handle common Supabase auth errors
    if "Invalid login credentials" in error_str:
        return "Invalid email or password"
    elif "Email not confirmed" in error_str:
        return "Please check your email and confirm your account"
    elif "User already registered" in error_str:
        return "An account with this email already exists"
    return error_str

def set_auth_cookies(response: Response, session_data: dict):
    """Set secure HTTP-only cookies for authentication"""
    if not session_data:
        return
        
    access_token = session_data.get("access_token")
    refresh_token = session_data.get("refresh_token")
    expires_in = session_data.get("expires_in", 3600)
    
    if access_token:
        response.set_cookie(
            key="sb-access-token",
            value=access_token,
            max_age=expires_in,
            httponly=True,
            secure=True,  # Set to False for local development
            samesite="lax"
        )
    
    if refresh_token:
        response.set_cookie(
            key="sb-refresh-token", 
            value=refresh_token,
            max_age=60 * 60 * 24 * 7,  # 7 days
            httponly=True,
            secure=True,  # Set to False for local development
            samesite="lax"
        )

def clear_auth_cookies(response: Response):
    """Clear authentication cookies"""
    response.delete_cookie("sb-access-token")
    response.delete_cookie("sb-refresh-token")

@router.post("/signup", response_model=AuthResponse)
async def signup_endpoint(
    response: Response,
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
        admin_supabase = get_supabase_admin_client()
        
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
        
        # Use admin client for database operations (bypasses RLS)
        # Insert image record
        image_id = str(uuid.uuid4())
        image_insert_response = admin_supabase.table("image").insert({
            "id": image_id,
            "image_url": image_url
        }).execute()
        
        if not image_insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create image record")
            
        logger.info(f"Created image record with ID: {image_id}")
        
        # Verify role exists
        role_response = admin_supabase.table("role").select("*").eq("id", roleId).execute()
        
        if not role_response.data:
            raise HTTPException(status_code=400, detail=f"Role with id '{roleId}' not found in the database")
            
        logger.info(f"Found role: {role_response.data[0]}")
        
        # Insert profile record
        profile_data = {
            "id": user_id,
            "first_name": firstName,
            "last_name": lastName,
            "user_id": user_id,
            "role_id": roleId,
            "image_id": image_id,
        }
        
        profile_response = admin_supabase.table("profile").insert(profile_data).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=500, detail="Failed to create profile record")
            
        logger.info(f"Created profile with data: {profile_data}")
        
        # If session exists, set cookies for immediate login
        if auth_response.session:
            set_auth_cookies(response, auth_response.session.__dict__)
            return AuthResponse(
                errorMessage=None,
                message="User created and logged in successfully",
                user=auth_response.user.__dict__ if auth_response.user else None,
                session={
                    "access_token": auth_response.session.access_token,
                    "expires_in": auth_response.session.expires_in,
                    "expires_at": auth_response.session.expires_at
                }
            )
        else:
            return AuthResponse(
                errorMessage=None,
                message="User created successfully. Please check your email to confirm your account."
            )
        
    except Exception as error:
        logger.error(f"Signup error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

@router.post("/login", response_model=AuthResponse)
async def login_endpoint(
    response: Response,
    email: str = Form(...),
    password: str = Form(...)
):
    """
    User login endpoint
    Authenticates user with Supabase Auth and sets session cookies
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
        
        # Set authentication cookies
        set_auth_cookies(response, auth_response.session.__dict__)
        
        return AuthResponse(
            errorMessage=None,
            message="Login successful",
            user=auth_response.user.__dict__ if auth_response.user else None,
            session={
                "access_token": auth_response.session.access_token,
                "expires_in": auth_response.session.expires_in,
                "expires_at": auth_response.session.expires_at
            }
        )
        
    except Exception as error:
        logger.error(f"Login error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

@router.post("/logout")
async def logout_endpoint(response: Response, request: Request):
    """
    Logout endpoint
    Clears session and cookies
    """
    try:
        # Get current user to sign them out properly
        user = await get_current_user(request)
        
        if user:
            supabase = get_supabase_client()
            supabase.auth.sign_out()
        
        # Clear cookies regardless
        clear_auth_cookies(response)
        
        return {"message": "Logged out successfully"}
        
    except Exception as error:
        logger.error(f"Logout error: {error}")
        clear_auth_cookies(response)  # Clear cookies even if there's an error
        return {"message": "Logged out"}

@router.get("/me", response_model=UserInfo)
async def get_me_endpoint(request: Request):
    """
    Get current authenticated user
    """
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        logger.info(f"Getting profile for user: {user['id']}")
        
        # Get user profile with RLS enabled (using user's token)
        access_token = request.cookies.get("sb-access-token")
        refresh_token = request.cookies.get("sb-refresh-token")
        
        if not access_token:
            logger.error("No access token found in cookies")
            raise HTTPException(status_code=401, detail="No access token")
        
        supabase = get_supabase_client()
        
        # Set the session with both tokens
        try:
            supabase.auth.set_session(access_token, refresh_token or "")
            logger.info("Session set successfully")
        except Exception as session_error:
            logger.error(f"Failed to set session: {session_error}")
            raise HTTPException(status_code=401, detail="Invalid session")
        
        # This will respect RLS policies
        try:
            profile_response = supabase.table("profile").select("*").eq("user_id", user["id"]).execute()
            logger.info(f"Profile query response: {profile_response}")
            
            if profile_response.data:
                profile_data = profile_response.data[0] if isinstance(profile_response.data, list) else profile_response.data
            else:
                logger.warning(f"No profile found for user {user['id']}")
                profile_data = {}
                
        except Exception as db_error:
            logger.error(f"Database query error: {db_error}")
            # If profile query fails, still return basic user info
            profile_data = {}
        
        return UserInfo(
            id=user["id"],
            email=user["email"],
            firstName=profile_data.get("first_name"),
            lastName=profile_data.get("last_name")
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as error:
        logger.error(f"Get me error: {error}")
        logger.error(f"Error type: {type(error)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user information: {str(error)}")

@router.get("/email-exists/{email}")
async def check_if_email_exists(email: str):
    client = get_supabase_admin_client()
    
    # Fetch all users (returns a list of User objects)
    users = client.auth.admin.list_users()  # list of User objects
    
    # Check if email exists
    exists = any(user.email == email for user in users)

    return {"exists": exists}
    

@router.post("/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    """
    Refresh authentication token
    """
    try:
        refresh_token = request.cookies.get("sb-refresh-token")
        
        if not refresh_token:
            raise HTTPException(status_code=401, detail="No refresh token")
        
        supabase = get_supabase_client()
        auth_response = supabase.auth.refresh_session(refresh_token)
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Failed to refresh session")
        
        # Set new cookies
        set_auth_cookies(response, auth_response.session.__dict__)
        
        return {
            "message": "Token refreshed successfully",
            "session": {
                "access_token": auth_response.session.access_token,
                "expires_in": auth_response.session.expires_in,
                "expires_at": auth_response.session.expires_at
            }
        }
        
    except Exception as error:
        logger.error(f"Refresh token error: {error}")
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Failed to refresh token")

# JSON-based endpoints
@router.post("/signup-json", response_model=AuthResponse)
async def signup_json_endpoint(request: SignupRequest, response: Response):
    """JSON-based signup endpoint"""
    try:
        supabase = get_supabase_client()
        admin_supabase = get_supabase_admin_client()
        
        app_url = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
        
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
        image_insert_response = admin_supabase.table("image").insert({
            "id": image_id,
            "image_url": image_url
        }).execute()
        
        if not image_insert_response.data:
            raise HTTPException(status_code=500, detail="Failed to create image record")
        
        # Verify role exists
        role_response = admin_supabase.table("role").select("*").eq("id", request.roleId).execute()
        
        if not role_response.data:
            raise HTTPException(status_code=400, detail=f"Role with id '{request.roleId}' not found in the database")
        
        # Insert profile record
        profile_data = {
            "id": user_id,
            "first_name": request.firstName,
            "last_name": request.lastName,
            "user_id": user_id,
            "role_id": request.roleId,
            "image_id": image_id,
        }
        
        profile_response = admin_supabase.table("profile").insert(profile_data).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=500, detail="Failed to create profile record")
        
        # Set cookies if session exists
        if auth_response.session:
            set_auth_cookies(response, auth_response.session.__dict__)
        
        return AuthResponse(
            errorMessage=None,
            message="User created successfully. Please check your email to confirm your account.",
            user=auth_response.user.__dict__ if auth_response.user else None,
            session=auth_response.session.__dict__ if auth_response.session else None
        )
        
    except Exception as error:
        logger.error(f"Signup error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

@router.post("/login-json", response_model=AuthResponse)
async def login_json_endpoint(request: LoginRequest, response: Response):
    """JSON-based login endpoint"""
    try:
        supabase = get_supabase_client()
        
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if auth_response.session is None:
            raise HTTPException(status_code=401, detail="No session created")
        
        # Set authentication cookies
        set_auth_cookies(response, auth_response.session.__dict__)
        
        return AuthResponse(
            errorMessage=None,
            message="Login successful",
            user=auth_response.user.__dict__ if auth_response.user else None,
            session={
                "access_token": auth_response.session.access_token,
                "expires_in": auth_response.session.expires_in,
                "expires_at": auth_response.session.expires_at
            }
        )
        
    except Exception as error:
        logger.error(f"Login error: {error}")
        return AuthResponse(errorMessage=get_error_message(error))

# Dependency for protected routes
async def require_auth(request: Request):
    """Dependency to require authentication for protected routes"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# Debug endpoint to help troubleshoot
@router.get("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to check authentication status"""
    try:
        # Check cookies
        access_token = request.cookies.get("sb-access-token")
        refresh_token = request.cookies.get("sb-refresh-token")
        
        debug_info = {
            "has_access_token": bool(access_token),
            "access_token_length": len(access_token) if access_token else 0,
            "has_refresh_token": bool(refresh_token),
            "refresh_token_length": len(refresh_token) if refresh_token else 0,
            "cookies": list(request.cookies.keys()),
        }
        
        # Try to get current user
        user = await get_current_user(request)
        debug_info["user_found"] = bool(user)
        
        if user:
            debug_info["user_id"] = user.get("id")
            debug_info["user_email"] = user.get("email")
            
            # Try to query profile
            try:
                supabase = get_supabase_client()
                supabase.auth.set_session(access_token, refresh_token or "")
                
                profile_response = supabase.table("profile").select("*").eq("user_id", user["id"]).execute()
                debug_info["profile_query_success"] = True
                debug_info["profile_data_length"] = len(profile_response.data) if profile_response.data else 0
                
                if profile_response.data:
                    debug_info["profile_sample"] = profile_response.data[0] if isinstance(profile_response.data, list) else profile_response.data
                    
            except Exception as profile_error:
                debug_info["profile_query_success"] = False
                debug_info["profile_error"] = str(profile_error)
        
        return debug_info
        
    except Exception as error:
        return {
            "error": str(error),
            "error_type": str(type(error))
        }

# Example protected route
@router.get("/protected")
async def protected_route(current_user: dict = Depends(require_auth)):
    """Example of a protected route that requires authentication"""
    return {
        "message": "This is a protected route",
        "user": current_user
    }