# MODYV - AI-Powered Contract Management Platform

**MODYV** is a comprehensive, AI-powered contract management platform designed for PT Integrasi Logistik Cipta Solusi (ILCS). The platform combines modern web technologies with advanced AI capabilities to streamline contract drafting, management, and risk assessment processes.

## 🚀 Features

- **AI-Powered Contract Drafting**: Generate intelligent contract clauses with risk assessment using OpenAI's GPT-4
- **Smart Risk Assessment**: Automatic risk scoring (0-100) for each contract clause with detailed rationale
- **Professional PDF Generation**: Convert structured contract data to professionally formatted PDF documents
- **Real-time Collaboration**: Multi-user contract editing and approval workflows
- **Alert Management**: Smart notification system for contract deadlines and important events
- **Indonesian Legal Compliance**: Templates and prompts designed for Indonesian legal requirements
- **Enterprise Authentication**: Secure user management with role-based access control
- **Modern UI/UX**: Responsive design with dark/light theme support

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        MODYV Platform                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │      AI Service         │
│   (Next.js)     │    (Hono.js)    │     (FastAPI)          │
│                 │                 │                         │
│ • React 19      │ • TypeScript    │ • OpenAI GPT-4         │
│ • Tailwind CSS  │ • Drizzle ORM   │ • Risk Assessment      │
│ • Zustand       │ • PostgreSQL    │ • PDF Generation       │
│ • Auth System   │ • RabbitMQ      │ • Template Engine      │
│ • Dark Mode     │ • Better Auth   │ • Indonesian Legal     │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## 📁 Project Structure

```
Final-IFest2025/
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# Reusable UI components
│   │   ├── stores/    # Zustand state management
│   │   ├── services/  # API service layers
│   │   └── types/     # TypeScript type definitions
│   └── package.json
├── backend/           # Hono.js backend API
│   ├── src/
│   │   ├── controllers/# API route handlers
│   │   ├── services/  # Business logic
│   │   ├── db/        # Database schema & migrations
│   │   ├── lib/       # Utilities and configurations
│   │   └── types/     # TypeScript interfaces
│   └── package.json
├── ai/                # FastAPI AI microservice
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── services/  # AI processing logic
│   │   ├── templates/ # Contract templates
│   │   └── models/    # Pydantic models
│   └── requirements.txt
└── README.md         # This file
```

## 🚦 Quick Start

### Prerequisites

- **Node.js** 18+ (for frontend/backend)
- **Bun** runtime (for backend)
- **Python** 3.11+ (for AI service)
- **PostgreSQL** 14+ (for database)
- **RabbitMQ** (for message queuing)
- **OpenAI API Key** (for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/fauzanazz/Final-IFest2025.git
cd Final-IFest2025
```

### 2. Setup Environment Variables

Create `.env` files in each service directory:

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_AI_API_URL=http://localhost:8081
```

**Backend (.env):**
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/modyv
RABBITMQ_URL=amqp://localhost:5672
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
PORT=5001
```

**AI Service (.env):**
```bash
OPENAI_API_KEY=your-openai-api-key-here
MODEL_NAME=gpt-4-turbo-preview
CORS_ORIGINS=http://localhost:3000,http://localhost:5001
```

### 3. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
bun install

# AI Service
cd ../ai
pip install -r requirements.txt
```

### 4. Setup Database

```bash
cd backend
bun run db:generate
bun run db:migrate
```

### 5. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
bun run dev
```

**Terminal 2 - AI Service:**
```bash
cd ai
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **AI Service:** http://localhost:8081
- **API Documentation:** http://localhost:5001/docs
- **AI Documentation:** http://localhost:8081/docs

## 🎯 Usage

### Contract Management Workflow

1. **Login**: Access the platform with your credentials
2. **Create Contract**: Use AI-powered drafting with custom parameters
3. **Review & Edit**: Collaborate on contract clauses with risk assessment
4. **Generate PDF**: Export professional contract documents
5. **Manage Alerts**: Track important dates and notifications

### AI-Powered Features

- **Smart Drafting**: Generate contract clauses based on use case and parties
- **Risk Analysis**: Automatic risk scoring with detailed explanations
- **Template Matching**: Retrieve relevant governance templates
- **Legal Compliance**: Indonesian legal framework compliance

## 🔧 Development

### Frontend Development

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### Backend Development

```bash
cd backend
bun run dev          # Start with hot reload
bun run typecheck    # Type checking
bun run format       # Code formatting
bun run db:studio    # Database GUI
```

### AI Service Development

```bash
cd ai
uvicorn app.main:app --reload  # Start with auto-reload
python -m pytest               # Run tests
python test_e2e.py            # End-to-end tests
```

## 📊 Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios
- **Theme**: next-themes for dark/light mode

### Backend
- **Runtime**: Bun with TypeScript
- **Framework**: Hono.js with OpenAPI integration
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Message Queue**: RabbitMQ with amqplib
- **API Documentation**: Scalar API Reference

### AI Service
- **Framework**: FastAPI with Python 3.11+
- **AI Engine**: OpenAI GPT-4 with structured outputs
- **PDF Generation**: WeasyPrint
- **Template Engine**: Jinja2
- **Validation**: Pydantic V2

## 🔐 Security Features

- **Authentication**: Secure session management with Better Auth
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive validation with Zod/Pydantic
- **CORS Protection**: Configurable cross-origin policies
- **Rate Limiting**: API rate limiting for abuse prevention
- **Environment Isolation**: Secure environment variable management

## 📈 Monitoring & Observability

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Health Checks**: Service health monitoring endpoints
- **Error Tracking**: Detailed error reporting with stack traces
- **Performance Metrics**: Request/response timing data
- **Database Monitoring**: Connection pool and query performance

## 🚀 Deployment

### Docker Deployment

Each service includes a Dockerfile for containerized deployment:

```bash
# Build all services
docker-compose build

# Start the stack
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Considerations

- Use PostgreSQL with connection pooling
- Deploy RabbitMQ cluster for high availability
- Implement reverse proxy with Nginx or Traefik
- Configure environment-specific variables
- Set up monitoring with Prometheus/Grafana
- Enable SSL/TLS certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Semantic commit messages
- **Testing**: Unit and integration tests required

## 📄 License

This project is proprietary software developed for PT Integrasi Logistik Cipta Solusi (ILCS). All rights reserved.

## 🆘 Support

For technical support or questions:

- **Documentation**: Check individual service READMEs
- **Issues**: Create GitHub issues for bugs
- **Contact**: development-team@ilcs.com

## 🗺️ Roadmap

- [ ] Advanced contract analytics dashboard
- [ ] Multi-language support (English, Bahasa Indonesia)
- [ ] Integration with e-signature providers
- [ ] Mobile application development
- [ ] Advanced AI models for legal analysis
- [ ] Blockchain integration for contract verification

---

**Built with ❤️ for PT Integrasi Logistik Cipta Solusi (ILCS)**

*Last updated: September 2025*