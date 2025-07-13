import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, validator

app = FastAPI()

users = {}


class User(BaseModel):
    username: str

    @validator("username")
    def username_must_be_alphanumeric_and_start_with_alpha(cls, v):
        if not v:
            raise ValueError("Username must not be empty")
        if not v[0].isalpha():
            raise ValueError("Username must start with an alphabet character")
        if not v.isalnum():
            raise ValueError("Username must be alphanumeric")
        return v


@app.post("/users")
def add_user(user: User):
    username = user.username
    if username in users:
        raise HTTPException(status_code=400, detail="Username already exists")
    users[username] = {}
    return {"message": "User added", "username": username}


@app.get("/users")
def get_users():
    return {"users": list(users.keys())}


@app.post("/users/random")
def select_and_delete_random_user():
    if not users:
        raise HTTPException(status_code=404, detail="No users available")
    username = random.choice(list(users.keys()))
    del users[username]
    return {"selected_user": username}
