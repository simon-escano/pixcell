import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import HTTPException, Request

load_dotenv()


# Regular anon client (unauthenticated)
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    return create_client(url, key)


# Admin client (bypasses RLS)
def get_supabase_admin_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not service_key:
        raise HTTPException(status_code=500, detail="Supabase admin configuration missing")

    return create_client(url, service_key)


# JWT client (respects RLS)
def get_supabase_jwt_client(request: Request) -> Client:
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not anon_key:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")

    # Extract token from cookies or Authorization header
    access_token = request.cookies.get("sb-access-token")
    if not access_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]

    if not access_token:
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    client = create_client(url, anon_key)
    client.auth.set_session(access_token, request.cookies.get("sb-refresh-token", ""))

    return client
