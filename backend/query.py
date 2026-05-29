import asyncio
from supabase import create_client
from config import settings

supabase = create_client(settings.supabase_url, settings.supabase_secret_key)
res = supabase.table("documents").select("*").execute()
print(res.data)
