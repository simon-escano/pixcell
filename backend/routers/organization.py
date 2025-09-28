from db import get_supabase_client, get_supabase_admin_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OrganizationBase(BaseModel):
    name: str
    address: str

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    

@router.get('/', dependencies=[Depends(require_auth)])
def all_organizations():
  client = get_supabase_admin_client()
  return client.table('organization').select("*").execute()

@router.get("/current-organization", dependencies=[Depends(require_auth)])
async def user_organization(request: Request):
    """
    Get the organization(s) the current authenticated user belongs to
    """
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        admin_client = get_supabase_admin_client()

        # Lookup profile first (profile.id is linked to organization_staff.staff_id)
        profile_response = admin_client.table("profile").select("id").eq("user_id", user["id"]).execute()
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Profile not found for current user")

        profile_id = profile_response.data[0]["id"]

        # Fetch organizations linked to this staff profile
        org_response = (
            admin_client.table("organization_staff")
            .select("organization_id, organization(*)")  # includes full org details if FK exists
            .eq("staff_id", profile_id)
            .execute()
        )

        if not org_response.data:
            return {"organizations": []}

        return {"organizations": org_response.data}

    except Exception as e:
        logger.error(f"Error fetching current organization: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch current organization")


# CREATE organization
@router.post("/create", dependencies=[Depends(require_auth)])
async def create_organization(org: OrganizationCreate):
    try:
        admin_client = get_supabase_admin_client()
        response = admin_client.table("organization").insert(org.dict()).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create organization")

        return response.data[0] if isinstance(response.data, list) else response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating organization: {e}")
    
@router.get("/{org_id}", dependencies=[Depends(require_auth)])
async def get_organization(org_id: str):
    try:
        admin_client = get_supabase_admin_client()
        response = admin_client.table("organization").select("*").eq("id", org_id).single().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching organization: {e}")

@router.put("/{org_id}", dependencies=[Depends(require_auth)])
async def update_organization(org_id: str, org: OrganizationUpdate):
    try:
        update_data = {k: v for k, v in org.dict().items() if v is not None}

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        admin_client = get_supabase_admin_client()
        response = (
            admin_client.table("organization")
            .update(update_data)
            .eq("id", org_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        return response.data[0] if isinstance(response.data, list) else response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating organization: {e}")

# DELETE organization
@router.delete("/{org_id}", dependencies=[Depends(require_auth)])
async def delete_organization(org_id: str):
    try:
        admin_client = get_supabase_admin_client()
        response = admin_client.table("organization").delete().eq("id", org_id).execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Organization not found")

        return {"message": "Organization deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting organization: {e}")