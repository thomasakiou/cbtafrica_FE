# Backend Token Refresh Endpoint - Implementation Requirements

## Overview
The frontend now implements automatic token renewal to prevent user sessions from expiring during active use. The backend needs to provide a token refresh endpoint that issues new tokens based on valid existing tokens.

## Required Endpoint

### Endpoint Details
- **URL**: `/cbt/api/v1/users/refresh-token`
- **Method**: `POST`
- **Authentication**: Required (Bearer token in Authorization header)
- **Purpose**: Issue a new access token using a valid existing token

### Request Format

**Headers:**
```http
Authorization: Bearer <current_valid_token>
Content-Type: application/json
```

**Body:** None required (token is in header)

### Success Response

**Status Code:** `200 OK`

**Response Body:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
}
```

**Fields:**
- `access_token` (string, required): The new JWT token with extended expiration
- `token_type` (string, required): Should be "bearer"

### Error Responses

#### 401 Unauthorized - Expired Token
```json
{
    "detail": "Token has expired"
}
```

#### 401 Unauthorized - Invalid Token
```json
{
    "detail": "Could not validate credentials"
}
```

#### 401 Unauthorized - Malformed Token
```json
{
    "detail": "Invalid authentication credentials"
}
```

## Implementation Requirements

### 1. Token Validation
- Decode and verify the incoming JWT token
- Check token signature is valid
- Validate token hasn't been revoked/blacklisted (if you implement token blacklisting)
- Extract user identifier (username/user_id) from token claims

### 2. Token Expiration Handling
- **If token is expired but within grace period**: Issue new token
  - Recommended grace period: 5-10 minutes after expiration
  - This allows refresh during network delays
  
- **If token is expired beyond grace period**: Return 401 error
  - User must login again with credentials

- **If token is valid**: Issue new token with fresh expiration

### 3. New Token Generation
- Create new JWT with same user claims as original token
- Set new expiration time (recommended: 30-60 minutes from now)
- Use same secret key and algorithm as login endpoint
- Include all necessary claims (sub, exp, iat, etc.)

### 4. Security Considerations
- **DO NOT** allow refresh if token signature is invalid
- **DO NOT** extend expiration indefinitely (set max token lifetime)
- **CONSIDER** rotating refresh tokens (advanced feature)
- **CONSIDER** tracking refresh count to detect abuse
- **ENSURE** same CORS settings as other endpoints

## Example FastAPI Implementation

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from typing import Optional
import jwt

router = APIRouter(prefix="/cbt/api/v1", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Configuration (should match your existing auth setup)
SECRET_KEY = "your-secret-key-here"  # Use same as login
ALGORITHM = "HS256"  # Use same as login
ACCESS_TOKEN_EXPIRE_MINUTES = 30
MAX_TOKEN_AGE_DAYS = 7  # Optional: Maximum token lifetime


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()  # Issued at
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/users/refresh-token")
async def refresh_token(token: str = Depends(oauth2_scheme)):
    """
    Refresh an existing JWT token.
    
    This endpoint accepts a valid JWT token and issues a new token
    with an extended expiration time. Used by frontend to maintain
    active user sessions without requiring re-login.
    
    Args:
        token: JWT token from Authorization header
        
    Returns:
        dict: New access token and token type
        
    Raises:
        HTTPException: If token is invalid, expired, or malformed
    """
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the current token
        # Note: This will raise exception if token is expired
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM],
            options={"verify_exp": True}  # Verify expiration
        )
        
        # Extract username from token
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        # Optional: Check if token was issued too long ago
        issued_at = payload.get("iat")
        if issued_at:
            token_age = datetime.utcnow() - datetime.fromtimestamp(issued_at)
            if token_age.days > MAX_TOKEN_AGE_DAYS:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token too old, please login again",
                )
        
        # Optional: Verify user still exists and is active in database
        # user = await get_user_from_db(username)
        # if not user or not user.is_active:
        #     raise credentials_exception
        
        # Create new token with extended expiration
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        new_token = create_access_token(
            data={"sub": username},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": new_token,
            "token_type": "bearer"
        }
        
    except jwt.ExpiredSignatureError:
        # Token has expired - could implement grace period here
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except jwt.InvalidTokenError:
        # Token is malformed or signature is invalid
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except Exception as e:
        # Catch-all for unexpected errors
        print(f"Token refresh error: {str(e)}")
        raise credentials_exception


# Optional: Grace period implementation for recently expired tokens
@router.post("/users/refresh-token-with-grace")
async def refresh_token_with_grace(token: str = Depends(oauth2_scheme)):
    """
    Refresh token with grace period for recently expired tokens.
    Allows refresh of tokens expired within last 10 minutes.
    """
    
    GRACE_PERIOD_MINUTES = 10
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # First try normal decode
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        
    except jwt.ExpiredSignatureError:
        # Token expired - check if within grace period
        try:
            # Decode without verifying expiration
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
                options={"verify_exp": False}
            )
            
            # Check expiration time
            exp = payload.get("exp")
            if not exp:
                raise credentials_exception
            
            expired_at = datetime.fromtimestamp(exp)
            time_since_expiry = datetime.utcnow() - expired_at
            
            # Allow refresh if expired less than grace period ago
            if time_since_expiry > timedelta(minutes=GRACE_PERIOD_MINUTES):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token expired beyond grace period, please login again",
                )
                
        except jwt.InvalidTokenError:
            raise credentials_exception
            
    except jwt.InvalidTokenError:
        raise credentials_exception
    
    # Extract username
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    # Create new token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = create_access_token(
        data={"sub": username},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": new_token,
        "token_type": "bearer"
    }
```

## Testing the Endpoint

### Using cURL
```bash
# Replace YOUR_TOKEN with actual JWT token
curl -X POST https://vmi2848672.contaboserver.net/cbt/api/v1/users/refresh-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VybmFtZSIsImV4cCI6MTcwMDAwMDAwMH0...",
    "token_type": "bearer"
}
```

### Using Python requests
```python
import requests

# Get token from login first
login_response = requests.post(
    "https://vmi2848672.contaboserver.net/cbt/api/v1/users/login",
    json={"username": "testuser", "password": "password123"}
)
token = login_response.json()["access_token"]

# Test refresh endpoint
refresh_response = requests.post(
    "https://vmi2848672.contaboserver.net/cbt/api/v1/users/refresh-token",
    headers={"Authorization": f"Bearer {token}"}
)

print(refresh_response.json())
# Should print new token
```

### Using Postman
1. **Method**: POST
2. **URL**: `https://vmi2848672.contaboserver.net/cbt/api/v1/users/refresh-token`
3. **Headers**:
   - `Authorization`: `Bearer <your_token_here>`
   - `Content-Type`: `application/json`
4. **Expected**: 200 OK with new token in response

## Integration Checklist

- [ ] Endpoint created at `/cbt/api/v1/users/refresh-token`
- [ ] Accepts POST requests
- [ ] Validates JWT token from Authorization header
- [ ] Returns new token with extended expiration
- [ ] Returns 401 for expired/invalid tokens
- [ ] Uses same SECRET_KEY and ALGORITHM as login endpoint
- [ ] CORS configured to allow requests from `https://mycbtapp.netlify.app`
- [ ] Tested with valid token - returns new token
- [ ] Tested with expired token - returns 401 error
- [ ] Tested with invalid token - returns 401 error
- [ ] Tested with no token - returns 401 error
- [ ] Endpoint documented in API documentation
- [ ] Logging added for debugging

## CORS Configuration

Ensure your backend CORS settings include:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mycbtapp.netlify.app",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

## Troubleshooting

### Frontend shows "Token refresh failed"
- Check endpoint URL is exactly `/cbt/api/v1/users/refresh-token`
- Verify CORS headers are present in response
- Check backend logs for errors
- Ensure token is being sent in Authorization header

### Getting 401 errors
- Verify SECRET_KEY matches the one used for login
- Check ALGORITHM matches login endpoint
- Ensure token hasn't been blacklisted (if you use blacklisting)
- Verify token format is correct (Bearer <token>)

### Token refresh succeeds but user still gets logged out
- Check token expiration time is sufficient (30+ minutes)
- Verify frontend is storing new token correctly
- Check if there are multiple refresh attempts conflicting

## Additional Considerations

### Token Blacklisting (Optional)
If you want to invalidate tokens before expiration:

```python
# In-memory blacklist (use Redis in production)
token_blacklist = set()

@router.post("/users/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """Add token to blacklist on logout"""
    token_blacklist.add(token)
    return {"message": "Logged out successfully"}

@router.post("/users/refresh-token")
async def refresh_token(token: str = Depends(oauth2_scheme)):
    # Check blacklist before refreshing
    if token in token_blacklist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )
    # ... rest of refresh logic
```

### Refresh Token Rotation (Advanced)
For enhanced security, issue both access and refresh tokens:

```python
# Issue long-lived refresh token on login
# Use refresh token to get new access tokens
# Rotate refresh token on each use
# This is more complex but more secure
```

### Rate Limiting (Recommended)
Prevent abuse by limiting refresh requests:

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@router.post("/users/refresh-token")
@limiter.limit("10/minute")  # Max 10 refreshes per minute
async def refresh_token(token: str = Depends(oauth2_scheme)):
    # ... refresh logic
```

## Questions for Backend Team

1. What is your current token expiration time?
2. Do you want to implement a grace period for expired tokens?
3. Do you need token blacklisting functionality?
4. Should we add rate limiting to prevent abuse?
5. Do you want to track refresh count per user?
6. Should refresh require additional validation (e.g., check user is still active)?

## Support

If you need clarification on any of these requirements, please contact the frontend team or refer to the frontend implementation in `js/session-manager.js`.
