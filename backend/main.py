"""
RealInvest Backend — Prediction Market Social App (Prototype)
Single-file FastAPI server with in-memory data store.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import time
import random
import math

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(title="RealInvest API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models ─────────────────────────────────────────────────────────

class CommentIn(BaseModel):
    username: str
    text: str

class InvestIn(BaseModel):
    username: str
    amount: float

class Comment(BaseModel):
    id: int
    reel_id: int
    username: str
    text: str
    timestamp: float

class User(BaseModel):
    id: int
    username: str
    display_name: str
    avatar: str
    followers: int
    following: int
    bio: str

class Reel(BaseModel):
    id: int
    user_id: int
    username: str
    user_avatar: str
    caption: str
    song: str
    video_url: str
    thumbnail: str
    likes: int
    views: int
    comments_count: int
    shares: int
    liked_by: list[str]
    price: float
    base_price: float
    investments: int
    price_history: list[float]
    created_at: float

# ─── Seed Data ────────────────────────────────────────────────────────────────

# Public domain / free-to-use video URLs from Pexels/Pixabay
SAMPLE_VIDEOS = [
    "https://videos.pexels.com/video-files/3571264/3571264-uhd_1440_2560_30fps.mp4",
    "https://videos.pexels.com/video-files/4763824/4763824-uhd_1440_2560_24fps.mp4",
    "https://videos.pexels.com/video-files/5752729/5752729-uhd_1440_2560_30fps.mp4",
    "https://videos.pexels.com/video-files/4488089/4488089-uhd_1440_2560_24fps.mp4",
    "https://videos.pexels.com/video-files/3209828/3209828-uhd_1440_2560_25fps.mp4",
    "https://videos.pexels.com/video-files/5198055/5198055-uhd_1440_2560_30fps.mp4",
    "https://videos.pexels.com/video-files/4434242/4434242-uhd_1440_2560_24fps.mp4",
    "https://videos.pexels.com/video-files/4065924/4065924-uhd_1440_2560_24fps.mp4",
]

SAMPLE_THUMBNAILS = [
    "https://images.pexels.com/videos/3571264/free-video-3571264.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/4763824/free-video-4763824.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/5752729/free-video-5752729.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/4488089/free-video-4488089.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/3209828/free-video-3209828.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/5198055/free-video-5198055.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/4434242/free-video-4434242.jpg?auto=compress&w=300",
    "https://images.pexels.com/videos/4065924/free-video-4065924.jpg?auto=compress&w=300",
]

USERS: list[dict] = [
    {"id": 1, "username": "alex_creates", "display_name": "Alex Chen", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", "followers": 12400, "following": 320, "bio": "Creator & filmmaker 🎬"},
    {"id": 2, "username": "maya.vibes", "display_name": "Maya Johnson", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=maya", "followers": 8700, "following": 189, "bio": "Living my best life ✨"},
    {"id": 3, "username": "techbro_mike", "display_name": "Mike Williams", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", "followers": 34200, "following": 412, "bio": "Tech | Code | Coffee ☕"},
    {"id": 4, "username": "sofia.dance", "display_name": "Sofia Martinez", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=sofia", "followers": 56100, "following": 230, "bio": "Dance is life 💃"},
    {"id": 5, "username": "nature_jake", "display_name": "Jake Thompson", "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=jake", "followers": 19300, "following": 567, "bio": "Exploring the outdoors 🏔️"},
]

CAPTIONS = [
    "This sunset was unreal 🌅 #goldenhour",
    "POV: you finally get the shot 📸 #creator",
    "Nature never disappoints 🌿 #peaceful",
    "City lights hit different at night 🌃",
    "Can't stop watching this 🔥 #viral",
    "Wait for it... 😱 #unexpected",
    "This is why I love what I do ❤️ #passion",
    "Vibes are immaculate today ✨ #mood",
]

SONGS = [
    "🎵 Blinding Lights — The Weeknd",
    "🎵 Levitating — Dua Lipa",
    "🎵 Stay — Kid LAROI & Bieber",
    "🎵 Sunflower — Post Malone",
    "🎵 Heat Waves — Glass Animals",
    "🎵 good 4 u — Olivia Rodrigo",
    "🎵 Peaches — Justin Bieber",
    "🎵 Montero — Lil Nas X",
]

now = time.time()

REELS: list[dict] = []
for i in range(8):
    user = USERS[i % len(USERS)]
    base_price = round(random.uniform(0.5, 5.0), 2)
    likes = random.randint(200, 15000)
    views = random.randint(1000, 100000)
    investments = random.randint(0, 50)
    price = round(base_price * (1 + 0.01 * likes / 100 + 0.005 * views / 1000 + 0.02 * investments), 2)
    
    # Generate a realistic price history (last 24 data points)
    history = [base_price]
    for _ in range(23):
        delta = random.uniform(-0.1, 0.15) * history[-1]
        history.append(round(max(0.1, history[-1] + delta), 2))
    history.append(price)
    
    REELS.append({
        "id": i + 1,
        "user_id": user["id"],
        "username": user["username"],
        "user_avatar": user["avatar"],
        "caption": CAPTIONS[i],
        "song": SONGS[i],
        "video_url": SAMPLE_VIDEOS[i],
        "thumbnail": SAMPLE_THUMBNAILS[i],
        "likes": likes,
        "views": views,
        "comments_count": random.randint(10, 500),
        "shares": random.randint(5, 200),
        "liked_by": [],
        "price": price,
        "base_price": base_price,
        "investments": investments,
        "price_history": history,
        "created_at": now - random.randint(3600, 86400 * 7),
    })

COMMENTS: list[dict] = []
comment_id_counter = 1

# Seed a few comments per reel
SAMPLE_COMMENTS = [
    "This is amazing! 🔥", "No way! 😱", "Love this ❤️", "Incredible shot!",
    "I need to go here!", "Song goes hard 🎶", "Insane vibes ✨", "How?! 🤯",
    "Underrated content", "Take my money 💰", "Investing NOW 📈", "To the moon! 🚀",
]

for reel in REELS:
    num_comments = random.randint(2, 5)
    for _ in range(num_comments):
        commenter = random.choice(USERS)
        COMMENTS.append({
            "id": comment_id_counter,
            "reel_id": reel["id"],
            "username": commenter["username"],
            "text": random.choice(SAMPLE_COMMENTS),
            "timestamp": now - random.randint(60, 7200),
        })
        comment_id_counter += 1


# ─── Helper: recalculate price ───────────────────────────────────────────────

def recalculate_price(reel: dict) -> None:
    """Recalculate reel price based on engagement metrics."""
    new_price = reel["base_price"] * (
        1
        + 0.01 * reel["likes"] / 100
        + 0.005 * reel["views"] / 1000
        + 0.02 * reel["investments"]
    )
    new_price = round(new_price, 2)
    reel["price_history"].append(new_price)
    # Keep only last 25 data points
    if len(reel["price_history"]) > 25:
        reel["price_history"] = reel["price_history"][-25:]
    reel["price"] = new_price


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/reels")
def get_reels(page: int = 1, limit: int = 10):
    """Get paginated feed of reels."""
    start = (page - 1) * limit
    end = start + limit
    feed = REELS[start:end]
    # Increment views
    for reel in feed:
        reel["views"] += 1
    return {"reels": feed, "total": len(REELS), "page": page}


@app.get("/api/reels/{reel_id}")
def get_reel(reel_id: int):
    """Get a single reel by ID."""
    for reel in REELS:
        if reel["id"] == reel_id:
            reel["views"] += 1
            return reel
    raise HTTPException(status_code=404, detail="Reel not found")


@app.post("/api/reels/{reel_id}/like")
def toggle_like(reel_id: int, username: str = "guest_user"):
    """Toggle like on a reel."""
    for reel in REELS:
        if reel["id"] == reel_id:
            if username in reel["liked_by"]:
                reel["liked_by"].remove(username)
                reel["likes"] -= 1
                liked = False
            else:
                reel["liked_by"].append(username)
                reel["likes"] += 1
                liked = True
            recalculate_price(reel)
            return {"liked": liked, "likes": reel["likes"], "price": reel["price"]}
    raise HTTPException(status_code=404, detail="Reel not found")


@app.get("/api/reels/{reel_id}/comments")
def get_comments(reel_id: int):
    """Get all comments for a reel."""
    reel_comments = [c for c in COMMENTS if c["reel_id"] == reel_id]
    reel_comments.sort(key=lambda c: c["timestamp"], reverse=True)
    return {"comments": reel_comments}


@app.post("/api/reels/{reel_id}/comment")
def add_comment(reel_id: int, body: CommentIn):
    """Add a comment to a reel."""
    global comment_id_counter
    # Verify reel exists
    reel = None
    for r in REELS:
        if r["id"] == reel_id:
            reel = r
            break
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    
    comment = {
        "id": comment_id_counter,
        "reel_id": reel_id,
        "username": body.username,
        "text": body.text,
        "timestamp": time.time(),
    }
    comment_id_counter += 1
    COMMENTS.append(comment)
    reel["comments_count"] += 1
    return comment


@app.post("/api/reels/{reel_id}/invest")
def invest_in_reel(reel_id: int, body: InvestIn):
    """Invest in a reel (simulated)."""
    for reel in REELS:
        if reel["id"] == reel_id:
            reel["investments"] += 1
            recalculate_price(reel)
            return {
                "success": True,
                "new_price": reel["price"],
                "investments": reel["investments"],
                "amount_invested": body.amount,
                "message": f"Successfully invested ${body.amount:.2f} in reel #{reel_id}",
            }
    raise HTTPException(status_code=404, detail="Reel not found")


@app.get("/api/market")
def get_market():
    """Get trending reels with market data."""
    market_data = []
    for reel in REELS:
        history = reel["price_history"]
        if len(history) >= 2:
            prev = history[-2]
            curr = history[-1]
            change_pct = round(((curr - prev) / prev) * 100, 2) if prev > 0 else 0.0
        else:
            change_pct = 0.0
        
        market_data.append({
            "id": reel["id"],
            "username": reel["username"],
            "user_avatar": reel["user_avatar"],
            "caption": reel["caption"],
            "thumbnail": reel["thumbnail"],
            "price": reel["price"],
            "change_pct": change_pct,
            "price_history": reel["price_history"][-12:],  # last 12 points for sparkline
            "likes": reel["likes"],
            "views": reel["views"],
            "investments": reel["investments"],
        })
    
    # Sort by a trending score (views + likes*2 + investments*10)
    market_data.sort(
        key=lambda r: r["views"] + r["likes"] * 2 + r["investments"] * 10,
        reverse=True,
    )
    
    total_market_cap = round(sum(r["price"] for r in market_data), 2)
    total_volume = sum(r["investments"] for r in market_data)
    
    return {
        "reels": market_data,
        "stats": {
            "total_market_cap": total_market_cap,
            "total_volume": total_volume,
            "total_reels": len(market_data),
        },
    }


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    """Get user profile."""
    for user in USERS:
        if user["id"] == user_id:
            user_reels = [r for r in REELS if r["user_id"] == user_id]
            portfolio_value = round(sum(r["price"] for r in user_reels), 2)
            return {
                **user,
                "reels": user_reels,
                "portfolio_value": portfolio_value,
                "total_likes": sum(r["likes"] for r in user_reels),
                "total_views": sum(r["views"] for r in user_reels),
            }
    raise HTTPException(status_code=404, detail="User not found")


# ─── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
