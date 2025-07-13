# API Test Examples

This file contains examples of how to test the authentication API endpoints using curl commands.

## 1. Health Check

```bash
curl -X GET http://localhost:3000/
```

## 2. Sign Up (User Registration)

### Valid user registration:

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123"
  }'
```

### Another valid user:

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johnsmith",
    "password": "MySecure456"
  }'
```

### Test duplicate username (should fail):

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "AnotherPass789"
  }'
```

### Test invalid username (too short - should fail):

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "Password123"
  }'
```

### Test weak password (should fail):

```bash
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "validuser",
    "password": "123"
  }'
```

## 3. Login

### Valid login:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123"
  }'
```

### Invalid username (should fail):

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistentuser",
    "password": "Password123"
  }'
```

### Invalid password (should fail):

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "WrongPassword"
  }'
```

## 4. Get All Users (for testing)

```bash
curl -X GET http://localhost:3000/users
```

## PowerShell Examples (if using Windows PowerShell)

### Sign up:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/signup" -Method POST -ContentType "application/json" -Body '{"username": "testuser", "password": "Password123"}'
```

### Login:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/login" -Method POST -ContentType "application/json" -Body '{"username": "testuser", "password": "Password123"}'
```

### Get users:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/users" -Method GET
```
