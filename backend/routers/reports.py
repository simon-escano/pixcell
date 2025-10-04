from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user

router = APIRouter()

@router.get('/{sample_id}',dependencies=[Depends(require_auth)])
def all_reports_by_sample_id(sample_id: str, request: Request):
  client = get_supabase_jwt_client(request)
  pass

# getReportsBySampleId
# getReportById
# getReportsByGeneratedBy
# getReportCountByPatientId
# getReportsLast30Days
# getPatientsWithLastReport
# getAllReports