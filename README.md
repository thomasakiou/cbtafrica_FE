# CBT Application Frontend

A responsive web frontend for the Computer Based Testing (CBT) platform that connects to the CBT Backend API.

## Features

### Landing Page (index.html)
- Comprehensive platform description and usage guide
- Education news feed with latest updates
- Integrated authentication (Login/Register) sidebar
- Responsive design for all devices

### Dashboard (dashboard.html)
- Test configuration interface
- Exam type selection (NECO, WAEC, JAMB, NABTEB)
- Customizable test duration and question count
- Previous test results display

### Exam Interface (exam.html)
- Real-time countdown timer
- Question navigation with progress tracking
- Multiple choice question display
- Auto-submit when time expires
- Question navigator grid

### Results Page (results.html)
- Detailed score breakdown and performance stats
- Pass/fail status with visual indicators
- Complete answer review with correct answers
- Option to retake exam or return to dashboard

## File Structure

```
cbt_app-FE/
├── index.html          # Landing page with auth
├── dashboard.html      # Test setup interface
├── exam.html          # Exam taking interface
├── results.html       # Results and review page
├── css/
│   └── style.css      # Complete responsive styling
├── js/
│   ├── auth.js        # Authentication functions
│   ├── dashboard.js   # Dashboard functionality
│   ├── exam.js        # Exam interface logic
│   ├── results.js     # Results display logic
│   └── main.js        # Common utilities
└── images/            # Static assets directory
```

## Setup Instructions

1. **Configure Backend URL**
   - Update `API_BASE_URL` in all JavaScript files
   - Default: `http://localhost:8000/api/v1`

2. **Serve the Frontend**
   ```bash
   # Using Python's built-in server
   python -m http.server 3000
   
   # Using Node.js http-server
   npx http-server -p 3000
   
   # Using any web server of choice
   ```

3. **Access the Application**
   - Open browser to `http://localhost:3000`
   - Ensure backend is running on `http://localhost:8000`

## User Flow

1. **Registration/Login**
   - New users create account with username, email, full name, password
   - Existing users login with username/password
   - JWT token stored in localStorage for session management

2. **Test Setup**
   - Select exam type from dropdown (NECO, WAEC, JAMB, NABTEB)
   - Choose test duration (30min - 2hrs)
   - Select number of questions (10-50)
   - Click "Start Exam" to begin

3. **Taking Exam**
   - Questions load randomly from selected category
   - Timer counts down from chosen duration
   - Navigate between questions using Previous/Next or question grid
   - Submit manually or auto-submit when time expires

4. **View Results**
   - Immediate score display with pass/fail status
   - Performance statistics (correct, wrong, accuracy)
   - Detailed answer review showing correct answers for wrong responses
   - Option to retake or return to dashboard

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /users/register` - User registration
- `POST /users/login` - User authentication
- `GET /categories/` - Fetch exam categories
- `GET /tests/category/{id}` - Get tests by category
- `GET /tests/{id}/with-questions` - Get test with questions
- `POST /attempts/start` - Start exam attempt
- `POST /attempts/submit` - Submit exam answers
- `GET /results/user/{id}` - Get user's previous results

## Security Features

- JWT token-based authentication
- Session management with localStorage
- Input validation and sanitization
- CORS handling for cross-origin requests
- Secure password handling (no client-side storage)

## Responsive Design

- Mobile-first approach
- Flexible grid layouts
- Touch-friendly interface
- Optimized for tablets and smartphones
- Consistent experience across devices

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox layouts
- Local Storage API support

## Customization

### Styling
- Modify `css/style.css` for visual customization
- CSS variables for easy theme changes
- Modular component styling

### Functionality
- Update JavaScript files for feature modifications
- Configurable exam parameters
- Extensible question types support

## Production Deployment

1. **Build Optimization**
   - Minify CSS and JavaScript files
   - Optimize images and assets
   - Enable gzip compression

2. **Environment Configuration**
   - Update API_BASE_URL for production backend
   - Configure proper CORS settings
   - Set up SSL/HTTPS

3. **Hosting Options**
   - Static hosting (Netlify, Vercel, GitHub Pages)
   - CDN deployment for global distribution
   - Web server hosting (Apache, Nginx)

## Performance Features

- Lazy loading of questions
- Efficient DOM manipulation
- Minimal API calls
- Client-side caching where appropriate
- Optimized asset loading