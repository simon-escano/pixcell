# getUserById
# getAllUsers
# getAllUsersWithProfiles
# getRecentUploads
# getRecentUploadsByUser
# getMonthlyStats
# getImageURLFromImageId



from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role, require_auth
import logging
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# getSupabaseUserCount
@router.get("/user/count")
def get_supabase_user_count():
    try:
        client = get_supabase_admin_client()
        users = client.auth.admin.list_users()
        
        # Handle both list and dict formats safely
        if isinstance(users, list):
            count = len(users)
        elif isinstance(users, dict) and "users" in users:
            count = len(users["users"])
        else:
            raise ValueError("Unexpected response format from Supabase.")
        
        return {"count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/images")
def get_images():
    client = get_supabase_admin_client()

    response = client.table('image').select('*').execute()

    return{
        'count' : len(response.data) if response.data else 0
    }


@router.get("/images/authenticated", dependencies=[Depends(require_auth)])
def get_images(request: Request):
    client = get_supabase_jwt_client(request)

    response = client.table('image').select('*').execute()

    return{
        'count' : len(response.data) if response.data else 0
    }


