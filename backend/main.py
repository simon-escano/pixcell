import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import get_supabase_client 
from routers import auth, organization, patient, profile, report
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = get_supabase_client()

@app.get("/dbtest")
def test_connection():
    try:
        resp = supabase.table("patient").select("*").limit(1).execute()
        return {"status": "ok", "data": resp.data}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
    
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(organization.router, prefix="/organization", tags=["Organization"])
app.include_router(patient.router, prefix="/patient", tags=["Patient"])
app.include_router(profile.router, prefix="/profile", tags=["Profile"])
app.include_router(report.router, prefix="/report", tags=["Report"])