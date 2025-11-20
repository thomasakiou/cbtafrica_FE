# Forum Backend API Documentation

This document outlines the API endpoints and data structures required to support the forum feature for the CBT application.

## Base URL

```
https://vmi2848672.contaboserver.net/cbt/api/v1/forum
```

## Authentication

All write operations (POST, PUT, DELETE) require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get Forum Posts

Retrieve a paginated list of forum posts for a specific subject.

```
GET /posts
```

#### Query Parameters

| Parameter | Type    | Required | Description                                      |
|-----------|---------|----------|--------------------------------------------------|
| subject   | string  | Yes      | The subject to filter posts by (e.g., "mathematics") |
| page      | integer | No       | Page number (default: 1)                         |
| limit     | integer | No       | Number of posts per page (default: 10)           |
| sort      | string  | No       | Sort order: "newest" or "popular" (default: "newest") |

#### Example Request

```
GET /posts?subject=mathematics&page=1&limit=10&sort=newest
```

#### Response (200 OK)

```json
{
  "posts": [
    {
      "id": "post_id_123",
      "title": "Understanding Quadratic Equations",
      "content": "Can someone explain the quadratic formula in simple terms?",
      "imageUrl": "https://example.com/images/quadratic.jpg",
      "likes": 5,
      "replyCount": 3,
      "createdAt": "2025-11-20T10:30:00Z",
      "author": {
        "id": "user_123",
        "name": "John Doe",
        "avatar": "https://example.com/avatars/john.jpg"
      }
    }
  ],
  "totalPages": 5,
  "currentPage": 1
}
```

### 2. Create New Post

Create a new forum post. Supports text and optional image upload.

```
POST /posts
```

#### Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <your_jwt_token>
```

#### Form Data

| Field   | Type   | Required | Description                     |
|---------|--------|----------|---------------------------------|
| title   | string | Yes      | Post title                      |
| content | string | Yes      | Post content                    |
| subject | string | Yes      | Subject (e.g., "mathematics")  |
| image   | file   | No       | Optional image file             |

#### Example Request

```
POST /posts
Content-Type: multipart/form-data

{
  "title": "Help with Calculus Problem",
  "content": "I'm having trouble understanding how to solve this integral...",
  "subject": "mathematics"
}
```

#### Response (201 Created)

```json
{
  "id": "new_post_id_456",
  "message": "Post created successfully"
}
```

### 3. Like a Post

Like or unlike a forum post.

```
POST /posts/:postId/like
```

#### Headers

```
Authorization: Bearer <your_jwt_token>
```

#### URL Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| postId    | string | Yes      | ID of the post to like |

#### Response (200 OK)

```json
{
  "postId": "post_id_123",
  "likes": 6,
  "message": "Post liked"
}
```

## Data Models

### Post

```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  subject: string;
  imageUrl?: string;
  likes: number;
  replyCount: number;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation Error",
  "message": "Title is required",
  "statusCode": 400
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action",
  "statusCode": 403
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Post not found",
  "statusCode": 404
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```

## Implementation Notes

1. **File Storage**: The backend should handle file uploads for post images and store them in a secure, scalable storage solution (e.g., AWS S3, Google Cloud Storage).

2. **Pagination**: All list endpoints should support pagination to handle large datasets efficiently.

3. **Caching**: Consider implementing caching for frequently accessed posts to improve performance.

4. **Rate Limiting**: Implement rate limiting to prevent abuse of the API.

5. **Validation**: All input should be validated on the server side to ensure data integrity.

6. **Error Handling**: Provide meaningful error messages to help with debugging and user feedback.

7. **Security**:
   - Use HTTPS for all API requests
   - Validate and sanitize all user input
   - Implement proper CORS policies
   - Use secure, HTTP-only cookies for authentication if applicable

## Example Frontend Integration

```javascript
// Example: Fetching posts
async function fetchPosts(subject, page = 1, limit = 10, sort = 'newest') {
  try {
    const response = await fetch(
      `${API_BASE_URL}/posts?subject=${subject}&page=${page}&limit=${limit}&sort=${sort}`,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}
```

## Rate Limits

- **Unauthenticated**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **File Uploads**: 10MB maximum file size

## Versioning

This is version 1.0.0 of the Forum API. Future versions will be documented separately.
