import os
from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # backend should use service role
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.get("/health")
def health_check():
    try:
        resp = supabase.table("patient").select("*").limit(1).execute()
        return {"status": "ok", "data": resp.data}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
