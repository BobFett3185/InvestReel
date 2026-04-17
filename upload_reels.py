import os
import uuid
import random
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

REELS_DIR = Path(__file__).resolve().parent / 'reels'
BUCKET_NAME = 'Reels'

CAPTIONS = [
    "Check out this awesome new reel! 🔥",
    "Wait for the end... 😱",
    "Just living life ✨",
    "Can't believe this happened 😂",
    "Absolute vibes today 🌅"
]

def upload_local_reels():
    print(f"Scanning directory: {REELS_DIR}")
    
    if not REELS_DIR.exists():
        print(f"Directory {REELS_DIR} does not exist!")
        return

    # 1. Fetch available users to assign the videos to
    users_resp = supabase.table("users").select("id").execute()
    if not users_resp.data:
        print("No users found in database! Please sign up or run seed.py first.")
        return
    
    user_ids = [u['id'] for u in users_resp.data]

    # 2. Iterate and upload videos
    for file_path in REELS_DIR.glob("*.mp4"):
        print(f"Uploading {file_path.name}...")
        
        # Create a unique filename to prevent collisions or overwrites
        file_ext = file_path.suffix
        new_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Upload to Supabase Storage
        with open(file_path, "rb") as f:
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path=new_filename,
                file=f,
                file_options={"content-type": "video/mp4"}
            )
            
        print(f"Uploaded to storage: {new_filename}")
        
        # Get public URL
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(new_filename)
        
        # Insert into Database
        owner_id = random.choice(user_ids)
        caption = random.choice(CAPTIONS)
        
        supabase.table("reels").insert({
            "user_id": owner_id,
            "video_url": public_url,
            "caption": caption,
            "like_count": random.randint(5, 500)
        }).execute()
        
        print(f"✅ Added {file_path.name} to the feed!")

if __name__ == "__main__":
    upload_local_reels()
