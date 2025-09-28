import os
from fastapi import FastAPI
from db import get_supabase_client 
from routers import auth, organization
app = FastAPI()

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
