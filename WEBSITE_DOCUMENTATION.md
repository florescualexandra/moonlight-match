# Moonlight Match Website - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Workflow](#workflow)
7. [Key Features](#key-features)
8. [Security Implementation](#security-implementation)
9. [Payment Integration](#payment-integration)
10. [AI Matching Algorithm](#ai-matching-algorithm)
11. [QR Code System](#qr-code-system)
12. [Real-time Features](#real-time-features)
13. [Data Management](#data-management)
14. [Deployment](#deployment)
15. [Development Setup](#development-setup)
16. [Testing](#testing)
17. [Performance Optimization](#performance-optimization)
18. [Troubleshooting](#troubleshooting)

## Project Overview

Moonlight Match is a sophisticated event matching platform that facilitates exclusive social events with AI-powered compatibility matching. The system manages the complete lifecycle from event registration through post-event connections.

### Core Functionality
- **Event Management**: Create and manage exclusive events
- **User Registration**: QR code-based event entry with Google Forms integration
- **AI Matching**: Advanced compatibility algorithm using machine learning
- **Payment Processing**: Stripe integration for match reveals
- **Real-time Chat**: In-app messaging between matched users
- **Admin Controls**: Comprehensive event and user management
- **Data Privacy**: Automatic data cleanup with retention options

### Business Model
- Event ticket sales
- Premium match reveals ($5 for 2 additional matches)
- Admin-controlled matching process
- 24-hour data retention (extendable)

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Stripe        │    │   AI/ML         │    │   File Storage  │
│   (Payments)    │    │   (Transformers)│    │   (Local/Cloud) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Structure
```
moonlight-match/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── admin/             # Admin pages
│   │   ├── user/              # User pages
│   │   ├── chat/              # Chat interface
│   │   ├── matches/           # Match discovery
│   │   ├── events/            # Event management
│   │   ├── scan/              # QR code scanning
│   │   ├── login/             # Authentication
│   │   ├── register/          # User registration
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   └── globals.css        # Global styles
│   ├── lib/                   # Utility libraries
│   ├── generated/             # Generated files
│   └── screens/               # Screen components
├── prisma/                    # Database schema & migrations
├── public/                    # Static assets
├── scripts/                   # Utility scripts
└── MoonlightMatch.ipynb       # AI/ML notebook
```

## Technology Stack

### Frontend
- **Next.js 15.3.3**: React framework with App Router
- **React 19.0.0**: UI library
- **TypeScript 5**: Type safety
- **Tailwind CSS 4**: Utility-first CSS framework
- **HTML5 QR Code**: QR code scanning library
- **QRCode.react**: QR code generation

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma 6.9.0**: Database ORM
- **PostgreSQL**: Primary database
- **bcryptjs**: Password hashing
- **JWT**: Authentication tokens

### AI/ML
- **@xenova/transformers 2.17.2**: Hugging Face Transformers
- **Custom matching algorithm**: Compatibility scoring
- **Python notebook integration**: ML model development

### Payment Processing
- **Stripe 18.2.1**: Payment gateway
- **@stripe/stripe-js 7.3.1**: Client-side Stripe

### Development Tools
- **ESLint**: Code linting
- **Turbopack**: Fast bundler
- **CSV Parser**: Data import utilities

## Database Schema

### Core Models

#### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  image         String?
  description   String?
  formResponse  Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  dataRetention Boolean   @default(false)
  isAdmin       Boolean   @default(false)
  event         Event     @relation(fields: [eventId], references: [id])
  eventId       String
  matches       Match[]   @relation("UserMatches")
  matchedWith   Match[]   @relation("MatchedWith")
  sentMessages  Message[]
}
```

#### Event Model
```prisma
model Event {
  id                 String    @id @default(cuid())
  name               String
  date               DateTime
  formUrl            String
  isMatching         Boolean   @default(false)
  isMatchingComplete Boolean   @default(false)
  matchesSent        Boolean   @default(false)
  users              User[]
  matches            Match[]
}
```

#### Match Model
```prisma
model Match {
  id                   String    @id @default(cuid())
  user                 User      @relation("UserMatches", fields: [userId], references: [id])
  userId               String
  matchedUser          User      @relation("MatchedWith", fields: [matchedUserId], references: [id])
  matchedUserId        String
  score                Float
  isInitiallyRevealed  Boolean   @default(false)
  isPaidReveal         Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  event                Event     @relation(fields: [eventId], references: [id])
  eventId              String
  chat                 Chat?

  @@unique([userId, matchedUserId, eventId])
}
```

#### Chat & Message Models
```prisma
model Chat {
  id        String    @id @default(cuid())
  match     Match     @relation(fields: [matchId], references: [id])
  matchId   String    @unique
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id        String   @id @default(cuid())
  content   String
  chat      Chat     @relation(fields: [chatId], references: [id])
  chatId    String
  sender    User     @relation(fields: [senderId], references: [id])
  senderId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Database Relationships
- **One-to-Many**: Event → Users
- **Many-to-Many**: Users ↔ Users (through Matches)
- **One-to-One**: Match → Chat
- **One-to-Many**: Chat → Messages
- **One-to-Many**: User → Messages (as sender)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user-profile` - Update user profile
- `GET /api/user/matches` - Get user matches

### Event Management
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event

### Matching System
- `POST /api/match-calculate` - Calculate matches
- `POST /api/match-release` - Release matches to users
- `POST /api/match-reveal` - Reveal additional matches

### Chat System
- `GET /api/chat/[matchId]` - Get chat messages
- `POST /api/chat/[matchId]` - Send message
- `GET /api/chats` - List user chats

### QR Code System
- `POST /api/qr/generate` - Generate QR codes
- `POST /api/qr/scan` - Process QR code scan

### Payment Processing
- `POST /api/payment/create-intent` - Create payment intent
- `POST /api/payment/confirm` - Confirm payment

### Admin Functions
- `GET /api/admin/users` - List all users
- `POST /api/admin/events/[id]/start-matching` - Start matching
- `POST /api/admin/events/[id]/send-matches` - Send matches

### Data Management
- `POST /api/cleanup` - Clean up expired data
- `POST /api/google-forms/process` - Process form responses

## Workflow

### 1. Event Setup Phase
```
Admin creates event → Generates QR codes → Distributes to attendees
```

### 2. User Registration Phase
```
User scans QR code → Completes Google Form → Creates account → Links form response
```

### 3. Matching Phase
```
Admin starts matching → AI processes responses → Calculates compatibility → Creates matches
```

### 4. Match Distribution Phase
```
Admin releases matches → Users see top 3 matches → Users can pay for additional reveals
```

### 5. Interaction Phase
```
Users chat with matches → Build connections → Exchange contact information
```

### 6. Cleanup Phase
```
24 hours after event → Delete user data (unless retention opted in)
```

## Key Features

### QR Code Integration
- **Generation**: Dynamic QR codes for each event
- **Scanning**: Browser-based QR code scanner
- **Form Linking**: Seamless Google Forms integration
- **Validation**: Secure QR code verification

### AI Matching Algorithm
- **Response Analysis**: Process Google Form responses
- **Compatibility Scoring**: Multi-factor matching algorithm
- **Machine Learning**: Uses Hugging Face Transformers
- **Custom Weights**: Configurable importance factors

### Payment System
- **Stripe Integration**: Secure payment processing
- **Match Reveals**: Pay-per-reveal model
- **Webhook Handling**: Payment confirmation
- **Refund Support**: Automatic refund processing

### Real-time Chat
- **WebSocket-like**: Polling-based real-time updates
- **Message Persistence**: Database storage
- **Read Receipts**: Message status tracking
- **File Sharing**: Image and document support

### Admin Dashboard
- **Event Management**: Create and manage events
- **User Overview**: Monitor user registrations
- **Matching Control**: Start and monitor matching process
- **Analytics**: Event statistics and insights

## Security Implementation

### Authentication
- **bcryptjs**: Secure password hashing
- **JWT Tokens**: Stateless authentication
- **Session Management**: Secure session handling
- **Role-based Access**: Admin vs User permissions

### Data Protection
- **Input Validation**: Server-side validation
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Prevention**: Content sanitization
- **CSRF Protection**: Token-based protection

### Privacy Features
- **Data Retention**: Configurable retention periods
- **Automatic Cleanup**: Scheduled data deletion
- **GDPR Compliance**: Data export and deletion
- **Anonymization**: PII protection

## Payment Integration

### Stripe Configuration
```javascript
// Payment intent creation
const paymentIntent = await stripe.paymentIntents.create({
  amount: 500, // $5.00 in cents
  currency: 'usd',
  metadata: {
    userId: user.id,
    matchId: matchId,
    type: 'match_reveal'
  }
});
```

### Payment Flow
1. User requests match reveal
2. Create payment intent
3. Process payment via Stripe
4. Confirm payment via webhook
5. Reveal additional matches
6. Update user account

### Error Handling
- **Payment Failures**: Graceful error handling
- **Network Issues**: Retry mechanisms
- **Invalid Payments**: Automatic refunds
- **Webhook Verification**: Secure webhook processing

## AI Matching Algorithm

### Algorithm Overview
The matching algorithm uses a multi-stage approach:

1. **Response Preprocessing**: Clean and normalize form responses
2. **Feature Extraction**: Extract relevant features from responses
3. **Similarity Calculation**: Compute compatibility scores
4. **Ranking**: Rank potential matches by score
5. **Selection**: Select top matches for each user

### Technical Implementation
```python
# Using Hugging Face Transformers
from transformers import pipeline

# Text similarity calculation
similarity_pipeline = pipeline("text-classification", model="sentence-transformers/all-MiniLM-L6-v2")

# Compatibility scoring
def calculate_compatibility(user1_response, user2_response):
    # Extract features
    features1 = extract_features(user1_response)
    features2 = extract_features(user2_response)
    
    # Calculate similarity scores
    scores = {}
    for feature in features1:
        similarity = similarity_pipeline(features1[feature], features2[feature])
        scores[feature] = similarity
    
    # Weighted average
    weighted_score = sum(scores[feature] * weights[feature] for feature in scores)
    return weighted_score
```

### Feature Categories
- **Demographics**: Age, location, education
- **Interests**: Hobbies, activities, preferences
- **Values**: Life goals, relationship expectations
- **Personality**: Communication style, social preferences

## QR Code System

### Generation Process
```javascript
// Generate QR code for event
const qrData = {
  eventId: event.id,
  formUrl: event.formUrl,
  timestamp: Date.now(),
  signature: createSignature(event.id, event.formUrl)
};

const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
```

### Scanning Implementation
```javascript
// HTML5 QR Code scanner
const html5QrcodeScanner = new Html5QrcodeScanner(
  "qr-reader",
  { fps: 10, qrbox: { width: 250, height: 250 } }
);

html5QrcodeScanner.render((decodedText) => {
  const qrData = JSON.parse(decodedText);
  if (validateQRCode(qrData)) {
    window.open(qrData.formUrl, '_blank');
  }
});
```

### Security Features
- **Digital Signatures**: Prevent QR code tampering
- **Timestamp Validation**: Prevent replay attacks
- **Event Binding**: QR codes tied to specific events
- **Usage Tracking**: Monitor QR code usage

## Real-time Features

### Chat System
```javascript
// Polling-based real-time updates
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/chat/${matchId}/messages`);
    const messages = await response.json();
    setMessages(messages);
  }, 3000);
  
  return () => clearInterval(interval);
}, [matchId]);
```

### Match Updates
- **Real-time Notifications**: New match alerts
- **Status Updates**: Matching progress indicators
- **Live Counters**: User registration counts
- **Progress Bars**: Matching completion status

## Data Management

### Import/Export
```javascript
// CSV import for bulk user creation
const importUsers = async (csvFile) => {
  const users = await parseCSV(csvFile);
  for (const user of users) {
    await createUser(user);
  }
};
```

### Cleanup Processes
```javascript
// Scheduled data cleanup
const cleanupExpiredData = async () => {
  const expiredUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours
      },
      dataRetention: false
    }
  });
  
  for (const user of expiredUsers) {
    await prisma.user.delete({ where: { id: user.id } });
  }
};
```

### Backup Strategy
- **Automated Backups**: Daily database backups
- **Point-in-time Recovery**: Transaction log backups
- **Data Export**: JSON/CSV export capabilities
- **Version Control**: Schema migration tracking

## Deployment

### Environment Configuration
```bash
# Required environment variables
DATABASE_URL="postgresql://user:password@localhost:5432/moonlight_match"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"
```

### Production Setup
1. **Database**: PostgreSQL on cloud provider
2. **Application**: Vercel or similar platform
3. **File Storage**: Cloud storage for images
4. **CDN**: Content delivery network
5. **Monitoring**: Application performance monitoring

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm run deploy
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/moonlight-match.git
cd moonlight-match

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Seed admin user
npm run seed

# Start development server
npm run dev
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database
```

## Testing

### Test Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing
- **Performance Tests**: Load testing

### Test Implementation
```javascript
// Example API test
describe('/api/auth/login', () => {
  it('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports
- **Image Optimization**: Next.js Image component
- **Caching**: Static generation and ISR
- **Bundle Analysis**: Webpack bundle analyzer

### Backend Optimization
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Database connection management
- **Caching**: Redis for session storage
- **CDN**: Static asset delivery

### Monitoring
- **Performance Metrics**: Core Web Vitals
- **Error Tracking**: Sentry integration
- **Analytics**: User behavior tracking
- **Uptime Monitoring**: Service availability

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
npx prisma db push

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

#### Payment Processing Issues
```javascript
// Check Stripe webhook configuration
// Verify webhook endpoint in Stripe dashboard
// Check webhook signature verification
```

#### QR Code Scanning Issues
```javascript
// Ensure HTTPS for camera access
// Check browser permissions
// Verify QR code format
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Check Prisma queries
DEBUG=prisma:query npm run dev
```

### Support Resources
- **Documentation**: Inline code documentation
- **Logs**: Application and error logs
- **Monitoring**: Real-time application monitoring
- **Community**: Developer community support

---

## Conclusion

The Moonlight Match website is a comprehensive event matching platform that combines modern web technologies with AI-powered matching algorithms. The system provides a complete solution for event organizers and attendees, from initial registration through post-event connections.

The architecture is designed for scalability, security, and maintainability, with clear separation of concerns and robust error handling. The platform successfully bridges the gap between physical events and digital connections, creating meaningful experiences for users while providing powerful tools for administrators.

For technical support or feature requests, please refer to the project documentation or contact the development team. 