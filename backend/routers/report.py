from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter()

# getAllReports
@router.get('',dependencies=[Depends(require_auth)] )
def all_reports_accessible_by_user(request:Request):
  client = get_supabase_jwt_client(request)
  response = client.table('report').select('*').execute()
  return{
    'count': len(response.data) if response.data else 0,
    'data': response.data
  }  

# getReportsBySampleId
@router.get('/sample/{sample_id}',dependencies=[Depends(require_auth)])
def all_reports_by_sample_id(sample_id: str, request: Request):
  client = get_supabase_jwt_client(request)
  response = client.table('report').select('*').eq('sample_id',sample_id).execute()
  
  return{
    'count': len(response.data) if response.data else 0,
    'data': response.data
  }

# getReportById
@router.get('/{report_id}',dependencies=[Depends(require_auth)])
def report_by_id(report_id: str, request: Request):
  client = get_supabase_jwt_client(request)
  response = client.table('report').select('*').eq('id', report_id).execute()
  return{
    'count': len(response.data) if response.data else 0,
    'data': response.data
  }

# getReportsByGeneratedBy
@router.get('/generated-by/{staff_id}',dependencies=[Depends(require_auth)])
def report_by_staff_id(staff_id: str, request: Request):
    client = get_supabase_jwt_client(request)
    
    # Fetch reports and join with sample and patient data
    response = client.table('report') \
        .select('*, sample:sample_id(*), patient:patient_id(*)') \
        .eq('generated_by', staff_id) \
        .execute()

    if not response.data:
        return {'count': 0, 'data': []}

    data = []
    for report in response.data:
        profile_id = report.get('generated_by')
        if profile_id:
            generated_by = client.table('profile').select('*').eq('id', profile_id).execute()
            report['generated_by'] = generated_by.data[0] if generated_by.data else None
        data.append(report)

    return {
        'count': len(data),
        'data': data
    }

# getReportCountByPatientId
@router.get('/count/patient/{patient_id}',dependencies=[Depends(require_auth)])
def report_count_by_patient_id(patient_id: str, request: Request):
  client = get_supabase_jwt_client(request)
  response = client.table('report').select('id').eq('patient_id', patient_id).execute()

  count = len(response.data) if response.data else 0
  return {'patient_id': patient_id, 'count': count}

# getReportsLast30DaysByUser
@router.get('/last-thirty-days/{user_id}',dependencies=[Depends(require_auth)])
def get_reports_last_30_days_by_user(user_id: str, request: Request):
    client = get_supabase_jwt_client(request)

    # Compute 30 days ago using timezone-aware UTC datetime
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()

    # Query Supabase
    response = client.table("report") \
        .select("id", count="exact") \
        .gte("created_at", thirty_days_ago) \
        .eq("generated_by", user_id) \
        .execute()

    count = response.count or 0

    return {"count": count}

# getReportsLast30Days
@router.get('/last-thirty-days/',dependencies=[Depends(require_auth)])
def get_reports_last_30_days(request: Request):
  client = get_supabase_jwt_client(request)
  thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
  response = client.table("report") \
        .select("id", count="exact") \
        .gte("created_at", thirty_days_ago) \
        .execute()
  count = response.count or 0

  return {"count": count}



# getPatientsWithLastReport
@router.get("/patients/last-report", dependencies=[Depends(require_auth)])
def get_patients_with_last_report(request: Request):
    client = get_supabase_jwt_client(request)

    # Step 1: Get last 5 reports
    reports = client.table("report") \
        .select("*") \
        .eq('status','Finalized')\
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()
    
    result = []

    # Step 2: For each report, fetch related info manually
    for report in reports.data:
        sample = client.table("sample").select("*").eq("id", report.get('sample_id')).single().execute().data
        patient = client.table("patient").select("*").eq("id", sample["patient_id"]).single().execute().data
        sample_image = client.table("sample_image") \
                    .select("*").eq("sample_id", sample["id"]) \
                    .order('captured_at',desc=True) \
                    .limit(1) \
                    .single() \
                    .execute().data
        profile = client.table("profile").select("*").eq("id", report["generated_by"]).maybe_single().execute().data

        profile_image = None
        if profile and profile.get("image_id"):
          profile_image = client.table("image").select("*").eq("id", profile["image_id"]).maybe_single().execute().data

        result.append({
            "patientId": patient["id"],
            "patientName": f"{patient['first_name']} {patient['last_name']}",
            "sampleId": sample["id"],
            "sampleName": sample["sample_name"],
            "dateTaken": sample_image["captured_at"] if sample_image else None,
            'userId' : profile['user_id'],
            "userName": f"{profile['first_name']} {profile['last_name']}" if profile else None,
            "patientEmail": patient["email"],
            "userImage": profile_image["image_url"] if profile_image else None,
            "isAiGenerated": report["is_ai_generated"],
            "reportCreatedAt": report["created_at"]
        })

    return {
       'count': len(result),
       "data": result}

#getPatientsWithLastReportByUser
@router.get("/patients/last-report/{user_id}", dependencies=[Depends(require_auth)])
def get_patients_with_last_report_by_user(user_id: str, request: Request):
    client = get_supabase_jwt_client(request)

    profile_id = client.table('profile').select('id')\
              .eq('user_id', user_id)\
              .single()\
              .execute().data

    # Step 1: Get the last 5 finalized reports generated by the given user
    reports = client.table("report") \
        .select("*") \
        .eq("generated_by", profile_id['id']) \
        .eq("status", "Finalized") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    result = []

    # Step 2: For each report, fetch related entities manually
    for report in reports.data:
        # Get the sample associated with this report
        sample = client.table("sample") \
            .select("*") \
            .eq("id", report.get("sample_id")) \
            .maybe_single() \
            .execute() \
            .data
        if not sample:
            continue

        # Get the patient for that sample
        patient = client.table("patient") \
            .select("*") \
            .eq("id", sample["patient_id"]) \
            .maybe_single() \
            .execute() \
            .data
        if not patient:
            continue

        # Get the latest sample image (if any)
        sample_image = client.table("sample_image") \
            .select("*") \
            .eq("sample_id", sample["id"]) \
            .order("captured_at", desc=True) \
            .limit(1) \
            .maybe_single() \
            .execute() \
            .data

        # Get the profile of the user who generated the report
        profile = client.table("profile") \
            .select("*") \
            .eq("id", report["generated_by"]) \
            .maybe_single() \
            .execute() \
            .data

        # Get the profile image if available
        profile_image = None
        if profile and profile.get("image_id"):
            profile_image = client.table("image") \
                .select("*") \
                .eq("id", profile["image_id"]) \
                .maybe_single() \
                .execute() \
                .data

        # Combine all data into a single record
        result.append({
            "patientId": patient["id"],
            "patientName": f"{patient['first_name']} {patient['last_name']}",
            "sampleId": sample["id"],
            "sampleName": sample["sample_name"],
            "dateTaken": sample_image["captured_at"] if sample_image else None,
            "userId": profile["user_id"] if profile else None,
            "userName": f"{profile['first_name']} {profile['last_name']}" if profile else None,
            "patientEmail": patient["email"],
            "userImage": profile_image["image_url"] if profile_image else None,
            "isAiGenerated": report["is_ai_generated"],
            "reportCreatedAt": report["created_at"]
        })

    return {
        "count": len(result),
        "data": result,
    }


# getReportByCode
@router.get('/code/{code}')
def report_by_code(code: str):
   client = get_supabase_client()
   response = client.table('report').select('*').eq('code',code).execute()
   return {
      'data' : response.data
   }

# getAllReportsByUserId
@router.get("/user/{user_id}", dependencies=[Depends(require_auth)])
def get_all_reports_by_user_id(user_id: str, request: Request):
    client = get_supabase_jwt_client(request)

    # Step 1: Fetch all reports generated by the user
    reports = client.table("report") \
        .select("*") \
        .eq("generated_by", user_id) \
        .order("created_at", desc=True) \
        .execute() \
        .data

    result = []

    # Step 2: For each report, fetch related info manually
    for report in reports:
        # Get the sample
        sample = client.table("sample") \
            .select("id, sample_name, patient_id") \
            .eq("id", report["sample_id"]) \
            .maybe_single() \
            .execute() \
            .data

        # Get the patient
        patient = None
        if sample:
            patient = client.table("patient") \
                .select("id, first_name, last_name, image_id") \
                .eq("id", sample["patient_id"]) \
                .maybe_single() \
                .execute() \
                .data

        # Get patient image if available
        patient_image = None
        if patient and patient.get("image_id"):
            patient_image = client.table("image") \
                .select("image_url") \
                .eq("id", patient["image_id"]) \
                .maybe_single() \
                .execute() \
                .data

        # Get profile info of the report generator
        profile = client.table("profile") \
            .select("id, first_name, last_name, image_id, role_id, user_id") \
            .eq("id", report["generated_by"]) \
            .maybe_single() \
            .execute() \
            .data

        # Get profile image if available
        generated_by_image = None
        if profile and profile.get("image_id"):
            generated_by_image = client.table("image") \
                .select("image_url") \
                .eq("id", profile["image_id"]) \
                .maybe_single() \
                .execute() \
                .data

        # Get role name
        role = None
        if profile and profile.get("role_id"):
            role = client.table("role") \
                .select("name") \
                .eq("id", profile["role_id"]) \
                .maybe_single() \
                .execute() \
                .data

        # Step 3: Append the combined result
        result.append({
            "id": report["id"],
            "title": report.get("title"),
            "content": report.get("content"),
            "isAiGenerated": report["is_ai_generated"],
            "createdAt": report["created_at"],
            "exportedUrl": report.get("exported_url"),
            "exportFormat": report.get("export_format"),
            "sampleId": sample["id"] if sample else None,
            "sampleName": sample["sample_name"] if sample else None,
            "patientId": patient["id"] if patient else None,
            "patientName": f"{patient['first_name']} {patient['last_name']}" if patient else None,
            "patientImage": patient_image["image_url"] if patient_image else None,
            "generatedById": profile["id"] if profile else None,
            "generatedByName": f"{profile['first_name']} {profile['last_name']}" if profile else None,
            "generatedByImage": generated_by_image["image_url"] if generated_by_image else None,
            "generatedByRole": role["name"] if role else None,
            "testType": report.get("test_type")
        })

    return {
        "count": len(result),
        "data": result
    }

# getReportsByPatientId
@router.get("/patient/{patient_id}", dependencies=[Depends(require_auth)])
def get_reports_by_patient_id(patient_id: str, request: Request):
    client = get_supabase_jwt_client(request)

    # Step 1: Get all reports for the given patient
    samples = client.table("sample") \
        .select("id, sample_name") \
        .eq("patient_id", patient_id) \
        .execute() \
        .data

    result = []

    # Step 2: For each sample, fetch its reports
    for sample in samples:
        reports = client.table("report") \
            .select("*") \
            .eq("sample_id", sample["id"]) \
            .order("created_at", desc=True) \
            .execute() \
            .data

        # Step 3: Get patient info once (shared across all)
        patient = client.table("patient") \
            .select("id, first_name, last_name, email") \
            .eq("id", patient_id) \
            .maybe_single() \
            .execute() \
            .data

        for report in reports:
            result.append({
                "id": report["id"],
                "title": report["title"],
                "content": report["content"],
                "isAiGenerated": report["is_ai_generated"],
                "createdAt": report["created_at"],
                "exportedUrl": report.get("exported_url"),
                "exportFormat": report.get("export_format"),
                "sampleId": sample["id"],
                "sampleName": sample["sample_name"],
                "patientId": patient["id"],
                "patientName": f"{patient['first_name']} {patient['last_name']}" if patient else None,
                "status": report["status"]
            })

    return {
        "count": len(result),
        "data": result
    }