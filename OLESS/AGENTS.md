# OLESS - Development Guidelines

## Project Overview
OLESS (Online Examination Security System) is a full-stack web application built with Node.js backend and vanilla HTML/CSS/JS frontend.

## Quick Start
```bash
cd backend
npm install
npm start
```

## Running Tests
```bash
cd backend
npm test
```

## Code Style Guidelines

### JavaScript
- Use ES6+ features (const, let, arrow functions)
- Prefer async/await over callbacks
- Use template literals for string interpolation
- Always handle errors with try/catch

### HTML
- Semantic HTML5 elements
- Proper heading hierarchy (h1-h6)
- Alt text for images
- Accessible form labels

### CSS
- Use CSS custom properties for theming
- Mobile-first responsive design
- BEM naming convention for custom classes
- Group related styles together

## File Organization
- Backend: MVC pattern with routes/controllers/models
- Frontend: Page-based with shared JS modules
- Database: Schema-first design with foreign keys

## API Design
- RESTful endpoints
- JSON responses with consistent structure
- Proper HTTP status codes
- Input validation on all endpoints

## Testing Strategy
- Unit tests for controllers
- Integration tests for API routes
- Frontend: Manual testing with browser console

## Security Checklist
- [ ] All user inputs validated
- [ ] SQL injection prevented via parameterized queries
- [ ] XSS prevented via output encoding
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting on auth endpoints
- [ ] Secure password storage (bcrypt)
- [ ] JWT token expiration
- [ ] Role-based authorization checks

## Common Issues
- Database connection: Check .env credentials
- CORS errors: Ensure backend CORS config matches frontend origin
- Token expiration: Implement refresh token flow if needed
