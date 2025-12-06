from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends, status, Query
from .auth import require_auth, get_current_user
import logging
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone

# Configure logger
logger = logging.getLogger(__name__)

# Configuration - set to False in production to hide detailed errors from users
SHOW_DETAILED_ERRORS = True  # Set via environment variable in production

router = APIRouter()


# ============================================================================
# Response Models
# ============================================================================

class ReportResponse(BaseModel):
    id: str
    title: Optional[str]
    content: Optional[str]
    is_ai_generated: bool
    created_at: datetime
    status: Optional[str]
    sample_id: Optional[str]
    patient_id: Optional[str]
    generated_by: Optional[str]
    test_type: Optional[str]
    exported_url: Optional[str]
    export_format: Optional[str]

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    count: int
    data: List[Dict[str, Any]]
    page: Optional[int] = None
    page_size: Optional[int] = None
    total_pages: Optional[int] = None


class CountResponse(BaseModel):
    count: int


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

def handle_supabase_error(error: Exception, context: str, show_details: bool = True) -> HTTPException:
    """Convert Supabase errors to appropriate HTTP exceptions"""
    error_str = str(error)
    error_msg = error_str.lower()
    
    # Log the full error for debugging
    logger.error(f"Error in {context}: {error_str}", exc_info=True)
    
    # Determine status code and user-facing message
    if "not found" in error_msg or "no rows" in error_msg or "single() requires exactly one row" in error_msg:
        status_code = status.HTTP_404_NOT_FOUND
        detail = f"Resource not found while {context}"
        
    elif "permission" in error_msg or "unauthorized" in error_msg or "jwt" in error_msg:
        status_code = status.HTTP_403_FORBIDDEN
        detail = f"Access denied: insufficient permissions for {context}"
        
    elif "constraint" in error_msg or "duplicate" in error_msg or "unique" in error_msg:
        status_code = status.HTTP_409_CONFLICT
        detail = f"Conflict: duplicate or constraint violation while {context}"
        
    elif "timeout" in error_msg or "connection" in error_msg:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        detail = f"Database service temporarily unavailable while {context}"
        
    elif "invalid" in error_msg or "malformed" in error_msg:
        status_code = status.HTTP_400_BAD_REQUEST
        detail = f"Invalid request data while {context}"
        
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        # Include actual error in production for better debugging
        detail = f"Error while {context}: {error_str}" if show_details else f"Internal error occurred while {context}"
    
    return HTTPException(
        status_code=status_code,
        detail=detail
    )


def fetch_profile_with_image(client, profile_id: str) -> Optional[Dict]:
    """Fetch profile data with image"""
    try:
        profile = client.table("profile").select("*").eq("id", profile_id).maybe_single().execute().data
        if not profile:
            return None
        
        if profile.get("image_id"):
            image = client.table("image").select("*").eq("id", profile["image_id"]).maybe_single().execute().data
            profile["image"] = image
        
        return profile
    except Exception as e:
        logger.warning(f"Failed to fetch profile {profile_id}: {str(e)}")
        return None


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "",
    response_model=PaginatedResponse,
    summary="Get all reports",
    description="Retrieve all reports accessible by the current user"
)
def get_all_reports(
    request: Request,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    _: str = Depends(require_auth)
):
    """Get all reports with pagination"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        # Get total count
        count_response = client.table('report').select('id', count='exact').execute()
        total_count = count_response.count or 0
        
        # Get paginated data
        response = client.table('report').select('*').range(offset, offset + page_size - 1).execute()
        
        return PaginatedResponse(
            count=total_count,
            data=response.data or [],
            page=page,
            page_size=page_size,
            total_pages=(total_count + page_size - 1) // page_size
        )
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, "fetching all reports", SHOW_DETAILED_ERRORS)


@router.get(
    "/{report_id}",
    response_model=PaginatedResponse,
    summary="Get report by ID",
    description="Retrieve a specific report by its ID"
)
def get_report_by_id(
    report_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get a single report by ID"""
    try:
        client = get_supabase_jwt_client(request)
        response = client.table('report').select('*').eq('id', report_id).maybe_single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with ID {report_id} not found"
            )
        
        return PaginatedResponse(count=1, data=[response.data])
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching report {report_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/code/{code}",
    response_model=PaginatedResponse,
    summary="Get report by code",
    description="Retrieve a report by its unique code (public endpoint)"
)
def get_report_by_code(code: str):
    """Get report by code - public endpoint for patient access"""
    try:
        client = get_supabase_client()
        response = client.table('report').select('*').eq('code', code).maybe_single().execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report with code {code} not found"
            )
        
        return PaginatedResponse(count=1, data=[response.data])
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching report by code {code}", SHOW_DETAILED_ERRORS)


@router.get(
    "/sample/{sample_id}",
    response_model=PaginatedResponse,
    summary="Get reports by sample ID",
    description="Retrieve all reports associated with a specific sample"
)
def get_reports_by_sample_id(
    sample_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get all reports for a specific sample"""
    try:
        client = get_supabase_jwt_client(request)
        response = client.table('report').select('*').eq('sample_id', sample_id).execute()
        
        return PaginatedResponse(
            count=len(response.data) if response.data else 0,
            data=response.data or []
        )
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching reports for sample {sample_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/patient/{patient_id}",
    response_model=PaginatedResponse,
    summary="Get reports by patient ID",
    description="Retrieve all reports for a specific patient"
)
def get_reports_by_patient_id(
    patient_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get all reports for a patient with enriched data"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Get all samples for the patient
        samples = client.table("sample").select("id, sample_name").eq("patient_id", patient_id).execute().data
        
        if not samples:
            return PaginatedResponse(count=0, data=[])
        
        # Get patient info once
        patient = client.table("patient").select("id, first_name, last_name, email").eq("id", patient_id).maybe_single().execute().data
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient with ID {patient_id} not found"
            )
        
        result = []
        
        # Fetch reports for each sample
        for sample in samples:
            reports = client.table("report").select("*").eq("sample_id", sample["id"]).order("created_at", desc=True).execute().data
            
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
                    "patientName": f"{patient['first_name']} {patient['last_name']}",
                    "status": report["status"]
                })
        
        return PaginatedResponse(count=len(result), data=result)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching reports for patient {patient_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/user/{user_id}",
    response_model=PaginatedResponse,
    summary="Get reports by user ID",
    description="Retrieve all reports generated by a specific user"
)
def get_reports_by_user_id(
    user_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get all reports generated by a user with full enrichment"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Fetch all reports generated by the user
        reports = client.table("report").select("*").eq("generated_by", user_id).order("created_at", desc=True).execute().data
        
        if not reports:
            return PaginatedResponse(count=0, data=[])
        
        result = []
        
        for report in reports:
            # Get sample
            sample = client.table("sample").select("id, sample_name, patient_id").eq("id", report["sample_id"]).maybe_single().execute().data
            
            # Get patient
            patient = None
            patient_image = None
            if sample:
                patient = client.table("patient").select("id, first_name, last_name, image_id").eq("id", sample["patient_id"]).maybe_single().execute().data
                
                if patient and patient.get("image_id"):
                    patient_image = client.table("image").select("image_url").eq("id", patient["image_id"]).maybe_single().execute().data
            
            # Get profile
            profile = client.table("profile").select("id, first_name, last_name, image_id, role_id, user_id").eq("id", report["generated_by"]).maybe_single().execute().data
            
            generated_by_image = None
            if profile and profile.get("image_id"):
                generated_by_image = client.table("image").select("image_url").eq("id", profile["image_id"]).maybe_single().execute().data
            
            # Get role
            role = None
            if profile and profile.get("role_id"):
                role = client.table("role").select("name").eq("id", profile["role_id"]).maybe_single().execute().data
            
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
        
        return PaginatedResponse(count=len(result), data=result)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching reports for user {user_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/stats/patient/{patient_id}/count",
    response_model=CountResponse,
    summary="Get report count for patient",
    description="Get the total number of reports for a specific patient"
)
def get_report_count_by_patient(
    patient_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get count of reports for a patient"""
    try:
        client = get_supabase_jwt_client(request)
        response = client.table('report').select('id', count='exact').eq('patient_id', patient_id).execute()
        
        return CountResponse(count=response.count or 0)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"counting reports for patient {patient_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/stats/recent",
    response_model=CountResponse,
    summary="Get recent reports count",
    description="Get count of reports created in the last 30 days"
)
def get_recent_reports_count(
    request: Request,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    _: str = Depends(require_auth)
):
    """Get count of reports in the last N days"""
    try:
        client = get_supabase_jwt_client(request)
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        response = client.table("report").select("id", count="exact").gte("created_at", cutoff_date).execute()
        
        return CountResponse(count=response.count or 0)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, "counting recent reports", SHOW_DETAILED_ERRORS)


@router.get(
    "/stats/recent/user/{user_id}",
    response_model=CountResponse,
    summary="Get recent reports count by user",
    description="Get count of reports created by a user in the last 30 days"
)
def get_recent_reports_count_by_user(
    user_id: str,
    request: Request,
    days: int = Query(30, ge=1, le=365, description="Number of days to look back"),
    _: str = Depends(require_auth)
):
    """Get count of reports by user in the last N days"""
    try:
        client = get_supabase_jwt_client(request)
        cutoff_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        response = client.table("report").select("id", count="exact").gte("created_at", cutoff_date).eq("generated_by", user_id).execute()
        
        return CountResponse(count=response.count or 0)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"counting recent reports for user {user_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/dashboard/recent-patients",
    response_model=PaginatedResponse,
    summary="Get patients with recent reports",
    description="Get the last 5 patients with finalized reports (dashboard view)"
)
def get_patients_with_recent_reports(
    request: Request,
    limit: int = Query(5, ge=1, le=50, description="Number of records to return"),
    _: str = Depends(require_auth)
):
    """Get recent patients with finalized reports for dashboard"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Get recent finalized reports
        reports = client.table("report").select("*").eq('status', 'Finalized').order("created_at", desc=True).limit(limit).execute().data
        
        if not reports:
            return PaginatedResponse(count=0, data=[])
        
        result = []
        
        for report in reports:
            try:
                sample = client.table("sample").select("*").eq("id", report.get('sample_id')).single().execute().data
                patient = client.table("patient").select("*").eq("id", sample["patient_id"]).single().execute().data
                
                sample_image = client.table("sample_image").select("*").eq("sample_id", sample["id"]).order('captured_at', desc=True).limit(1).maybe_single().execute().data
                
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
                    'userId': profile['user_id'] if profile else None,
                    "userName": f"{profile['first_name']} {profile['last_name']}" if profile else None,
                    "patientEmail": patient["email"],
                    "userImage": profile_image["image_url"] if profile_image else None,
                    "isAiGenerated": report["is_ai_generated"],
                    "reportCreatedAt": report["created_at"]
                })
            except Exception as e:
                logger.warning(f"Failed to process report {report.get('id')}: {str(e)}")
                continue
        
        return PaginatedResponse(count=len(result), data=result)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, "fetching recent patients with reports", SHOW_DETAILED_ERRORS)


@router.get(
    "/dashboard/recent-patients/user/{user_id}",
    response_model=PaginatedResponse,
    summary="Get patients with recent reports by user",
    description="Get the last 5 patients with finalized reports for a specific user"
)
def get_patients_with_recent_reports_by_user(
    user_id: str,
    request: Request,
    limit: int = Query(5, ge=1, le=50, description="Number of records to return"),
    _: str = Depends(require_auth)
):
    """Get recent patients with finalized reports for a specific user"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Get profile ID
        profile = client.table('profile').select('id').eq('user_id', user_id).maybe_single().execute().data
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profile not found for user {user_id}"
            )
        
        # Get recent finalized reports by this user
        reports = client.table("report").select("*").eq("generated_by", profile['id']).eq("status", "Finalized").order("created_at", desc=True).limit(limit).execute().data
        
        if not reports:
            return PaginatedResponse(count=0, data=[])
        
        result = []
        
        for report in reports:
            try:
                sample = client.table("sample").select("*").eq("id", report.get("sample_id")).maybe_single().execute().data
                if not sample:
                    continue
                
                patient = client.table("patient").select("*").eq("id", sample["patient_id"]).maybe_single().execute().data
                if not patient:
                    continue
                
                sample_image = client.table("sample_image").select("*").eq("sample_id", sample["id"]).order("captured_at", desc=True).limit(1).maybe_single().execute().data
                
                user_profile = client.table("profile").select("*").eq("id", report["generated_by"]).maybe_single().execute().data
                
                profile_image = None
                if user_profile and user_profile.get("image_id"):
                    profile_image = client.table("image").select("*").eq("id", user_profile["image_id"]).maybe_single().execute().data
                
                result.append({
                    "patientId": patient["id"],
                    "patientName": f"{patient['first_name']} {patient['last_name']}",
                    "sampleId": sample["id"],
                    "sampleName": sample["sample_name"],
                    "dateTaken": sample_image["captured_at"] if sample_image else None,
                    "userId": user_profile["user_id"] if user_profile else None,
                    "userName": f"{user_profile['first_name']} {user_profile['last_name']}" if user_profile else None,
                    "patientEmail": patient["email"],
                    "userImage": profile_image["image_url"] if profile_image else None,
                    "isAiGenerated": report["is_ai_generated"],
                    "reportCreatedAt": report["created_at"]
                })
            except Exception as e:
                logger.warning(f"Failed to process report {report.get('id')}: {str(e)}")
                continue
        
        return PaginatedResponse(count=len(result), data=result)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching recent patients for user {user_id}", SHOW_DETAILED_ERRORS)


@router.get(
    "/generated-by/{staff_id}",
    response_model=PaginatedResponse,
    summary="Get reports by staff member",
    description="Retrieve all reports generated by a specific staff member with enriched data"
)
def get_reports_by_staff_id(
    staff_id: str,
    request: Request,
    _: str = Depends(require_auth)
):
    """Get reports generated by staff with sample, patient, and profile data"""
    try:
        client = get_supabase_jwt_client(request)
        
        # Fetch reports with joined data
        response = client.table('report').select('*, sample:sample_id(*), patient:patient_id(*)').eq('generated_by', staff_id).execute()
        
        if not response.data:
            return PaginatedResponse(count=0, data=[])
        
        data = []
        for report in response.data:
            # Enrich with profile data
            profile_id = report.get('generated_by')
            if profile_id:
                profile = fetch_profile_with_image(client, profile_id)
                report['generated_by'] = profile
            data.append(report)
        
        return PaginatedResponse(count=len(data), data=data)
    except HTTPException:
        raise
    except Exception as e:
        raise handle_supabase_error(e, f"fetching reports by staff {staff_id}", SHOW_DETAILED_ERRORS)