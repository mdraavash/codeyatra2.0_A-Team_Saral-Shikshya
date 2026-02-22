from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

app = FastAPI()

@app.post("/login")
async def login(data : OAuth2PasswordRequestForm = Depends() ):
    user = users.get(data.username)
    if not user:
        raise HTTPException(code=status.HTTP_401_UNAUTHORIZED, detail= "Invalid e-mail or password")
    if user["pwd"] != data.pwd:
        raise HTTPException(code=status.HTTP_401_UNAUTHORIZED, detail= "Invalid e-mail or password")
    return {"access_token" : data.username, "token_type" : "bearer", "message" : "Login Successful"}
    