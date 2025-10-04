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


# get current user's patients
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


# get current user's patients' samples
# this is for gettingSamplesByUserID and getAllSamples
@router.get("/my-patients/samples", dependencies=[Depends(require_auth)])
async def all_doctors_patients_samples(request: Request):
    client = get_supabase_jwt_client(request)

    try:
        # Fetch all samples for patients accessible to this user
        samples_resp = client.table("sample").select("""
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
        """).execute()

        data = []

        # Collect all image_ids to batch fetch image URLs
        image_ids = [img.get("image_id") for s in (samples_resp.data or []) 
                     for img in (s.get("sample_image") or []) if img.get("image_id")]

        # Fetch all images in one call
        images_map = {}
        if image_ids:
            images_resp = client.table("image").select("id, image_url").in_("id", image_ids).execute()
            for img in images_resp.data or []:
                images_map[img["id"]] = img["image_url"]

        # Build flattened response
        for sample in (samples_resp.data or []):
            images = sample.get("sample_image") or []
            img = images[0] if images else {}
            image_url = images_map.get(img.get("image_id"))

            data.append({
                "id": sample.get("id"),
                "patientId": sample.get("patient_id"),
                "sampleName": sample.get("sample_name"),
                "createdBy": sample.get("created_by"),
                "uploadedBy": img.get("profile_id"),
                "metadata": img.get("metadata"),
                "capturedAt": img.get("captured_at"),
                "imageId": img.get("image_id"),
                "imageUrl": image_url
            })

        return {
            "count": len(data),
            "data": data
        }

    except Exception as e:
        return {"error": str(e)}


# get patient by id
@router.get("/{patient_id}")
async def patient_by_id(patient_id: str, request: Request):
    client = get_supabase_jwt_client(request)  # JWT client

    # Fetch patient
    response = client.table('patient').select('*').eq('id', patient_id).execute()
    patients = response.data or []

    data = []
    for patient in patients:
        image_url = None
        img_id = patient.get("image_id")
        if img_id:
            img_res = client.table('image').select("image_url").eq("id", img_id).execute()
            if img_res.data and len(img_res.data) > 0:
                image_url = img_res.data[0].get("image_url")

        # Add image_url to patient
        patient["image_url"] = image_url
        data.append(patient)

    return {
        "count": len(data),
        "data": data
    }


# get all patient samples by patient id
@router.get("/{patient_id}/samples", dependencies=[Depends(require_auth)])
async def patient_samples(patient_id: str, request: Request):
    try:
        client = get_supabase_jwt_client(request)

        patient = patient_by_id(patient_id, request)

        response = client.table("sample").select("""
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
        """).eq("patient_id", patient_id).execute()

        # Log raw response for debugging
        print("Supabase response:", response)

        data = []
        for sample in (response.data or []):
            images = sample.get("sample_image") or []
            img = images[0] if images else {}

            image_url = None
            if img.get("image_id"):
                img_resp = client.table("image").select("image_url").eq("id", img["image_id"]).execute()
                if img_resp.data and len(img_resp.data) > 0:
                    image_url = img_resp.data[0].get("image_url")


            data.append({
                "id": sample.get("id"),
                "patientId": sample.get("patient_id"),
                "sampleName": sample.get("sample_name"),
                "createdBy": sample.get("created_by"),
                "uploadedBy": img.get("profile_id"),
                "metadata": img.get("metadata"),
                "capturedAt": img.get("captured_at"),
                "imageId": img.get("image_id"),
                "imageUrl": image_url
            })

        return {
            "count": len(data),
            "data": data
        }

    except Exception as e:
        # Return full error for debugging
        return {"error": str(e)}



