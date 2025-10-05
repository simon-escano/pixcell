from db import get_supabase_client, get_supabase_admin_client, get_supabase_jwt_client
from fastapi import APIRouter, Request, HTTPException, Depends
from .auth import get_current_user, get_current_user_role
import logging
from pydantic import BaseModel
from typing import Optional
from .auth import require_auth
from .auth import get_current_user

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

# getReportsLast30Days
# getPatientsWithLastReport
# getReportByCode
