"""
RealInvest backend API.

The frontend uses Supabase directly for most product features, while this server
owns the messaging workflow so conversation creation and message retrieval stay
consistent in one place.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")

SUPABASE_URL = (
    os.environ.get("SUPABASE_URL")
    or os.environ.get("VITE_SUPABASE_URL")
    or "replace-with-your-url"
)
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("VITE_SUPABASE_ANON_KEY")
    or "replace-with-your-key"
)

supabase: Optional[Client] = None
try:
    if "replace-with-your-url" not in SUPABASE_URL and "replace-with-your-key" not in SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as exc:  # pragma: no cover - startup fallback
    print("Warning: Supabase client could not be initialized:", exc)


app = FastAPI(title="RealInvest API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConversationRequest(BaseModel):
    user1_id: str
    user2_id: str


class MessageRequest(BaseModel):
    conversation_id: str
    sender_id: str
    content: Optional[str] = None
    reel_id: Optional[str] = None


def get_supabase() -> Client:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured on backend.")
    return supabase


#returns a user object with id, username
def get_user(user_id: str) -> dict[str, Any]:
    client = get_supabase()
    resp = client.table("users").select("id, username, avatar_url").eq("id", user_id).single().execute()
    user = resp.data
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
    return user


#returns a list of user_id for participants in a convo
def get_conversation_participants(conversation_id: str) -> list[dict[str, Any]]:
    client = get_supabase() 
    resp = (
        client.table("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversation_id)
        .execute()
    )
    return resp.data or [] # store in an object and return the data
# this uses supabase and python to write sql queries in a readable way
# same as response = select from conversation_participants where conversation_id = convo_id



# convert message into a dict with these fields
def serialize_message(message: dict[str, Any]) -> dict[str, Any]:
    reel = message.get("reels") # returns null if no reel
    # convert message into consistent format 
    return {
        "id": message.get("id"),
        "conversation_id": message.get("conversation_id"),
        "sender_id": message.get("sender_id"),
        "content": message.get("content"),
        "reel_id": message.get("reel_id"),
        "created_at": message.get("created_at"),
        "reel": reel,
    }


# find conversation with both users as participants
def find_shared_conversation(user1_id: str, user2_id: str) -> Optional[str]:
    client = get_supabase()
    user1_conversations = (
        client.table("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user1_id)
        .execute()
    )
    conversation_ids = [row["conversation_id"] for row in user1_conversations.data or []]

    if not conversation_ids:
        return None

    shared = (
        client.table("conversation_participants")
        .select("conversation_id")
        .in_("conversation_id", conversation_ids)
        .eq("user_id", user2_id)
        .execute()
    )
    if not shared.data:
        return None
    return shared.data[0]["conversation_id"]


def create_conversation(user1_id: str, user2_id: str) -> str:
    client = get_supabase()
    conv_resp = client.table("conversations").insert({}).execute()
    conversation_id = conv_resp.data[0]["id"]
    client.table("conversation_participants").insert(
        [
            {"conversation_id": conversation_id, "user_id": user1_id},
            {"conversation_id": conversation_id, "user_id": user2_id},
        ]
    ).execute()
    return conversation_id


def get_or_create_conversation_record(user1_id: str, user2_id: str) -> dict[str, Any]:
    if user1_id == user2_id:
        raise HTTPException(status_code=400, detail="Users cannot message themselves.")

    user1 = get_user(user1_id)
    user2 = get_user(user2_id)
    conversation_id = find_shared_conversation(user1_id, user2_id)
    is_new = False

    if not conversation_id:
        conversation_id = create_conversation(user1_id, user2_id)
        is_new = True

    return {
        "conversation_id": conversation_id,
        "is_new": is_new,
        "participants": [user1, user2],
    }


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/conversations")
def get_or_create_conversation(req: ConversationRequest) -> dict[str, Any]:
    return get_or_create_conversation_record(req.user1_id, req.user2_id)


@app.get("/api/users/{user_id}/conversations")
def list_conversations(user_id: str) -> dict[str, list[dict[str, Any]]]:
    client = get_supabase()
    get_user(user_id)

    conv_resp = (
        client.table("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user_id)
        .execute()
    )
    conversation_ids = [row["conversation_id"] for row in conv_resp.data or []]

    if not conversation_ids:
        return {"conversations": []}

    participants_resp = (
        client.table("conversation_participants")
        .select("conversation_id, users!inner(id, username, avatar_url)")
        .in_("conversation_id", conversation_ids)
        .neq("user_id", user_id)
        .execute()
    )
    other_participants = participants_resp.data or []

    messages_resp = (
        client.table("messages")
        .select("id, conversation_id, sender_id, content, reel_id, created_at")
        .in_("conversation_id", conversation_ids)
        .order("created_at", desc=True)
        .execute()
    )
    latest_by_conversation: dict[str, dict[str, Any]] = {}
    for message in messages_resp.data or []:
        conversation_id = message["conversation_id"]
        if conversation_id not in latest_by_conversation:
            latest_by_conversation[conversation_id] = message

    conversations = []
    for participant in other_participants:
        conversation_id = participant["conversation_id"]
        latest_message = latest_by_conversation.get(conversation_id)
        conversations.append(
            {
                "conversation_id": conversation_id,
                "other_user": participant.get("users"),
                "last_message": latest_message,
            }
        )

    conversations.sort(
        key=lambda convo: (
            convo["last_message"]["created_at"]
            if convo.get("last_message")
            else ""
        ),
        reverse=True,
    )
    return {"conversations": conversations}


@app.get("/api/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str) -> dict[str, list[dict[str, Any]]]:
    client = get_supabase()
    participants = get_conversation_participants(conversation_id)
    if not participants:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    resp = (
        client.table("messages")
        .select("*, reels(*)")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    messages = [serialize_message(message) for message in (resp.data or [])]
    return {"messages": messages}


@app.post("/api/messages")
def send_message(req: MessageRequest) -> dict[str, Any]:
    client = get_supabase()
    participants = get_conversation_participants(req.conversation_id)
    if not participants:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    participant_ids = {participant["user_id"] for participant in participants}
    if req.sender_id not in participant_ids:
        raise HTTPException(status_code=403, detail="Sender is not part of this conversation.")

    content = req.content.strip() if req.content else None
    if not content and not req.reel_id:
        raise HTTPException(status_code=400, detail="Must provide either content or reel_id.")

    payload: dict[str, Any] = {
        "conversation_id": req.conversation_id,
        "sender_id": req.sender_id,
        "content": content,
    }
    if req.reel_id:
        payload["reel_id"] = req.reel_id

    resp = (
        client.table("messages")
        .insert(payload)
        .execute()
    )
    inserted = resp.data[0]

    hydrated = (
        client.table("messages")
        .select("*, reels(*)")
        .eq("id", inserted["id"])
        .single()
        .execute()
    )
    return {"message": serialize_message(hydrated.data)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
