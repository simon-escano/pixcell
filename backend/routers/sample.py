from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user

router = APIRouter()

# getAllSamples
@router.get('/',dependencies=[Depends(require_auth)])
def get_all_samples(request: Request):
  client = get_supabase_jwt_client(request)

  response = client.table('sample').select('*').execute()

  return {
    "count" : len(response.data) if response.data else 0,
    "data" : response.data
  }

# getSamplesByUserId
# get samples by user id (doctor)
@router.get('/user/{user_id}/samples', dependencies=[Depends(require_auth)])
async def get_samples_by_user_id(user_id: str, request: Request):
    """
    Returns all samples associated with patients of a specific doctor (user_id).
    Includes related sample image metadata and URLs.
    """
    try:
        client = get_supabase_jwt_client(request)

        # Step 1: Get all patient IDs linked to this doctor
        doctor_patients = client.table("doctor_patient").select("patient_id").eq("doctor_id", user_id).execute()
        patient_ids = [p["patient_id"] for p in (doctor_patients.data or [])]

        if not patient_ids:
            return {"count": 0, "data": []}

        # Step 2: Fetch samples linked to these patients
        samples_resp = (
            client.table("sample")
            .select("""
                id,
                patient_id,
                sample_name,
                created_by,
                sample_image (
                    profile_id,
                    metadata,
                    captured_at,
                    image_id
                )
            """)
            .in_("patient_id", patient_ids)
            .execute()
        )

        samples = samples_resp.data or []

        # Step 3: Gather image IDs to fetch image URLs
        image_ids = [
            s_img.get("image_id")
            for s in samples
            for s_img in (s.get("sample_image") or [])
            if s_img.get("image_id")
        ]

        image_map = {}
        if image_ids:
            images_resp = (
                client.table("image")
                .select("id, image_url")
                .in_("id", image_ids)
                .execute()
            )
            for img in images_resp.data or []:
                image_map[img["id"]] = img["image_url"]

        # Step 4: Merge and format response
        data = []
        for sample in samples:
            s_imgs = sample.get("sample_image") or []
            first_img = s_imgs[0] if s_imgs else {}
            image_url = image_map.get(first_img.get("image_id"))

            data.append({
                "id": sample.get("id"),
                "patientId": sample.get("patient_id"),
                "sampleName": sample.get("sample_name"),
                "createdBy": sample.get("created_by"),
                "uploadedBy": first_img.get("profile_id"),
                "metadata": first_img.get("metadata"),
                "capturedAt": first_img.get("captured_at"),
                "imageId": first_img.get("image_id"),
                "imageUrl": image_url
            })

        return {"count": len(data), "data": data}

    except Exception as e:
        return {"error": str(e)}

# getSampleById
# getSamplesByPatientId