import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()



# Initialize Supabase client with anon key for client operations
def get_supabase_client() -> Client:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")  # backend should use service role

    if not SUPABASE_URL or not SUPABASE_KEY:
      raise HTTPException(status_code=500, detail="Supabase configuration missing")

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return supabase


# Admin client for server-side operations (like creating profiles)
def get_supabase_admin_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        raise HTTPException(status_code=500, detail="Supabase admin configuration missing")
    
    return create_client(url, service_key)