from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import string
import os
import resend
from datetime import datetime, timedelta
import json
from jose import jwt
from config import settings
from supabase import create_client, Client

_supabase: Client = create_client(settings.supabase_url, settings.supabase_secret_key)

router = APIRouter(prefix="/auth", tags=["Auth"])

# OTPs are now stored in the Supabase 'otps' table to support serverless environments.

class SendOTPRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

def parse_nim(email: str):
    prefix = email.split("@")[0][:3]
    if not prefix.isdigit():
        return None, None
        
    try:
        # nim_parse.json is in the backend root directory
        with open("nim_parse.json", "r") as f:
            data = json.load(f)
            
        for fak in data.get("fakultas", []):
            if fak.get("kode_tpb") == prefix:
                return fak.get("singkatan"), "TPB"
            for ps in fak.get("program_studi", []):
                if ps.get("kode") == prefix:
                    return fak.get("singkatan"), ps.get("nama")
    except Exception as e:
        print(f"Error parsing NIM: {e}")
        
    return None, None

@router.post("/send-otp")
def send_otp(req: SendOTPRequest):
    email = req.email.lower().strip()
    # Check if ITB email
    if not (email.endswith("@itb.ac.id") or ".itb.ac.id" in email):
        raise HTTPException(status_code=400, detail="Only ITB student or faculty emails are allowed.")
    
    otp = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Store OTP in Supabase (upsert creates or updates the record for this email)
    _supabase.table("otps").upsert({
        "email": email,
        "otp": otp,
        "expires_at": expires_at.isoformat()
    }).execute()
    
    # Send email via Resend
    resend_api_key = settings.resend_api_key
    if resend_api_key:
        resend.api_key = resend_api_key
        try:
            resend.Emails.send({
                "from": "Ganesha Repository <ganesha.repository@eagleies.com>",
                "to": [email],
                "subject": "Your Login Code - Ganesha Repository",
                "html": f"""
                <div style="font-family: sans-serif; max-w-md; margin: 0 auto; text-align: center;">
                    <h2>Welcome back to Ganesha Repository</h2>
                    <p>Here is your 6-digit login code:</p>
                    <h1 style="font-size: 32px; letter-spacing: 4px; color: #18181b; background: #f4f4f5; padding: 16px; border-radius: 8px;">{otp}</h1>
                    <p style="color: #71717a; font-size: 14px;">This code will expire in 5 minutes.</p>
                </div>
                """
            })
            print(f"✅ OTP email sent to {email} via Resend")
        except Exception as e:
            print(f"❌ Failed to send OTP email via Resend: {e}")
            # Fallback to console print if it fails
            print(f"\n{'='*50}\n OTP FOR {email}: {otp}\n{'='*50}\n")
    else:
        # Fallback to console if no API key is provided
        print(f"\n{'='*50}\n OTP FOR {email}: {otp}\n{'='*50}\n")
        print("⚠️  RESEND_API_KEY not found in environment, printing OTP to console instead.")
    
    return {"message": "OTP sent successfully. Please check your email."}

@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    email = req.email.lower().strip()
    
    # Fetch OTP record from Supabase
    resp = _supabase.table("otps").select("*").eq("email", email).execute()
    if not resp.data:
        raise HTTPException(status_code=400, detail="No OTP requested for this email.")
        
    record = resp.data[0]
    
    # Safely parse ISO format datetime string
    expires_at_str = record["expires_at"]
    if expires_at_str.endswith("Z"):
        expires_at_str = expires_at_str[:-1] + "+00:00"
    expires_at = datetime.fromisoformat(expires_at_str).replace(tzinfo=None)
        
    if datetime.utcnow() > expires_at:
        _supabase.table("otps").delete().eq("email", email).execute()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    if record["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP.")
        
    faculty, major = parse_nim(email)

    # Check profiles table for existing role
    role_resp = _supabase.table("profiles").select("role").eq("email", email).execute()
    db_role = "student"
    if role_resp.data:
        db_role = role_resp.data[0]["role"]
        # Update faculty/major in case they changed
        _supabase.table("profiles").update({
            "faculty": faculty,
            "major": major,
        }).eq("email", email).execute()
    else:
        # First login — save full profile to database
        _supabase.table("profiles").insert({
            "email": email,
            "role": "student",
            "faculty": faculty,
            "major": major,
        }).execute()

    # Generate JWT compatible with Supabase Auth
    # Payload must include sub, email, role
    payload = {
        "sub": email,
        "email": email,
        "faculty": faculty,
        "major": major,
        "role": db_role,
        "aud": "authenticated",
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    
    token = jwt.encode(payload, settings.supabase_jwt_secret, algorithm="HS256")
    
    # Clean up OTP from Supabase after successful login
    _supabase.table("otps").delete().eq("email", email).execute()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": email,
            "faculty": faculty,
            "major": major,
            "role": db_role
        }
    }
