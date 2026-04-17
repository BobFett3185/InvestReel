import os
import uuid
import random
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or "replace-with-your-url" in SUPABASE_URL:
    print("Error: Please set real VITE_SUPABASE_URL in your .env file")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

USERS = [
    {"username": "alex_creates", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"},
    {"username": "maya.vibes", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=maya"},
    {"username": "techbro_mike", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mike"},
]

SAMPLE_VIDEOS = [
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
]

CAPTIONS = [
    "This sunset was unreal 🌅 #goldenhour",
    "POV: you finally get the shot 📸 #creator",
    "Nature never disappoints 🌿 #peaceful",
    "City lights hit different at night 🌃",
    "Can't stop watching this 🔥 #viral",
    "Wait for it... 😱 #unexpected",
]

def seed_db():
    print("Seeding database...")
    
    # 1. Insert dummy users
    inserted_users = []
    for u in USERS:
        uid = str(uuid.uuid4())
        resp = supabase.table("users").insert({
            "id": uid,
            "username": u["username"],
            "avatar_url": u["avatar_url"],
            "preferences": ["tech", "music", "comedy"]
        }).execute()
        inserted_users.append(uid)
        print(f"Inserted user {u['username']}")

    # 2. Insert reels assigned to these users
    for i in range(12):
        uid = random.choice(inserted_users)
        vid = random.choice(SAMPLE_VIDEOS)
        cap = random.choice(CAPTIONS)
        
        supabase.table("reels").insert({
            "user_id": uid,
            "video_url": vid,
            "caption": cap,
            "like_count": random.randint(10, 500)
        }).execute()
        
    print("Successfully seeded 12 reels!")

if __name__ == "__main__":
    seed_db()
