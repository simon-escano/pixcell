import requests
import uuid
from supabase import create_client, Client
from datetime import datetime, timedelta, UTC  # Add UTC import
import random

SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcW1qYWxrdGZobm50b2Fva2ZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkwNzUwNywiZXhwIjoyMDY1NDgzNTA3fQ.wRk98woiD5RBnyc-8HzJfP-fZa9myvE87-v2NTetKY8"
SUPABASE_URL = "https://deqmjalktfhnntoaokfi.supabase.co"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)  # Create the client

doctor_resp = supabase.table("profile").select("id").execute()
if not doctor_resp.data:
    raise Exception("No doctor profile found in 'profile' table.")


# STEP 2: Generate and insert 10 random patients
response = requests.get("https://randomuser.me/api/?results=137")
users = response.json()["results"]

blood_types = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

for user in users:
    doctor_id = random.choice(doctor_resp.data)["id"]
    # Generate image first
    image_id = str(uuid.uuid4())
    image_url = user["picture"]["large"]
    supabase.table("image").insert({
        "id": image_id,
        "image_url": image_url
    }).execute()

    # Patient info
    patient_id = str(uuid.uuid4())
    birth_date_str = user["dob"]["date"].split("T")[0]
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
    today = datetime.now(UTC)
    # Generate a random date between start_date and today
    start_date = datetime(2025, 1, 1, tzinfo=UTC)
    random_days = random.randint(0, (today - start_date).days)
    created_at = (start_date + timedelta(days=random_days)).isoformat()

    sex = "M" if user["gender"].lower() == "male" else "F"

    patient_data = {
        "id": patient_id,
        "birth_date": birth_date_str,
        "sex": sex,
        "first_name": user["name"]["first"],
        "last_name": user["name"]["last"],
        "created_at": created_at,
        "contact_number": user["phone"],
        "email": user["email"],
        "address": f"{user['location']['street']['number']} {user['location']['street']['name']}, {user['location']['city']}, {user['location']['country']}",
        "height": 160 + (hash(user["name"]["first"]) % 20),
        "weight": 50 + (hash(user["name"]["last"]) % 25),
        "blood_type": random.choice(blood_types),
        "image_id": image_id,
        "created_by": doctor_id
    }
    supabase.table("patient").insert(patient_data).execute()

    supabase.table("doctor_patient").insert({
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "order_no": 1,
        "created_at": datetime.now(UTC).isoformat()
    }).execute()