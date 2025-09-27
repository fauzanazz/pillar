# MODYV Backend API

A modern, production-ready backend API built with **Hono.js**, **TypeScript**, and **Bun** runtime. This service provides the core business logic, data management, and API endpoints for the MODYV contract management platform.

## 🚀 Features

- **High-Performance API**: Built with Hono.js for ultra-fast HTTP handling
- **Type-Safe Development**: Full TypeScript support with strict type checking
- **Modern Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Enterprise Authentication**: Better Auth integration with session management
- **Message Queue Integration**: RabbitMQ for asynchronous event processing
- **OpenAPI Documentation**: Auto-generated API documentation with Scalar
- **Real-time Alerts**: Smart notification system for contract events
- **Comprehensive Validation**: Zod schemas for request/response validation
- **Health Monitoring**: Built-in health checks and observability

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MODYV Backend API                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Controllers│  │  Services   │  │ Repositories│         │
│  │             │  │             │  │             │         │
│  │ • API Routes│  │ • Business  │  │ • Data      │         │
│  │ • Validation│  │   Logic     │  │   Access    │         │
│  │ • Middleware│  │ • Processing│  │ • Queries   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│           │               │               │                 │
│           └───────────────┼───────────────┘                 │
│                           │                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ PostgreSQL  │  │  RabbitMQ   │  │ Better Auth │         │
│  │ Database    │  │ Message     │  │ Session     │         │
│  │             │  │ Queue       │  │ Management  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/       # API route controllers
│   │   ├── api.controller.ts     # Main API router
│   │   ├── contracts.controller.ts
│   │   ├── alerts.controller.ts
│   │   └── health.controller.ts
│   ├── services/          # Business logic services
│   │   ├── contract.service.ts
│   │   ├── alert.service.ts
│   │   ├── workflow.service.ts
│   │   └── alert-event-consumer.service.ts
│   ├── repositories/      # Data access layer
│   │   ├── contract.repository.ts
│   │   ├── alert.repository.ts
│   │   └── user.repository.ts
│   ├── db/               # Database configuration
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   ├── index.ts      # Database connection
│   │   └── migrations/   # Database migrations
│   ├── lib/              # Utilities and configurations
│   │   ├── auth.ts       # Better Auth configuration
│   │   ├── rabbitmq.ts   # RabbitMQ service
│   │   └── validation.ts # Zod schemas
│   ├── middlewares/      # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── cors.middleware.ts
│   │   └── validation.middleware.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── contract.types.ts
│   │   └── alert.types.ts
│   ├── configs/         # Configuration files
│   │   ├── env.ts       # Environment variables
│   │   └── database.ts  # Database configuration
│   └── index.ts         # Application entry point
├── drizzle/             # Database migration files
├── docs/                # Additional documentation
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── drizzle.config.ts    # Drizzle ORM configuration
├── eslint.config.mjs    # ESLint configuration
├── Dockerfile           # Container configuration
└── README.md           # This file
```

## 🚦 Quick Start

### Prerequisites

- **Bun** runtime 1.0+
- **PostgreSQL** 14+
- **RabbitMQ** 3.8+
- **Node.js** 18+ (for compatibility)

### 1. Install Dependencies

```bash
cd backend
bun install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/modyv_db

# Server Configuration
PORT=5001
NODE_ENV=development

# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-here
BETTER_AUTH_URL=http://localhost:5001

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=modyv_events
RABBITMQ_QUEUE_ALERTS=alert_events

# External Services
AI_SERVICE_URL=http://localhost:8081

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Generate database schema
bun run db:generate

# Run migrations
bun run db:migrate

# Optional: Open database studio
bun run db:studio
```

### 4. Start Development Server

```bash
# Start with hot reload
bun run dev

# Or start production server
bun run start
```

### 5. Verify Installation

```bash
# Health check
curl http://localhost:5001/

# API documentation
open http://localhost:5001/docs
```

## 📚 API Endpoints

### Health & Documentation

- `GET /` - Service health check
- `GET /docs` - Interactive API documentation
- `GET /openapi.json` - OpenAPI specification

### Authentication

- `POST /api/auth/sign-in` - User sign in
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-out` - User sign out
- `GET /api/auth/session` - Get current session

### Contracts

- `GET /api/contracts` - List contracts with filtering
- `POST /api/contracts` - Create new contract
- `GET /api/contracts/:id` - Get contract details
- `PUT /api/contracts/:id` - Update contract
- `DELETE /api/contracts/:id` - Delete contract
- `POST /api/contracts/:id/generate-pdf` - Generate PDF

### Alerts

- `GET /api/alerts` - List user alerts
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert
- `POST /api/alerts/:id/acknowledge` - Mark alert as read

### Workflows

- `POST /api/workflows/start` - Start contract workflow
- `GET /api/workflows/:id/status` - Get workflow status
- `POST /api/workflows/:id/approve` - Approve workflow step
- `POST /api/workflows/:id/reject` - Reject workflow step

## 🔧 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server with hot reload
bun run start            # Start production server

# Database
bun run db:generate      # Generate database schema
bun run db:migrate       # Run database migrations
bun run db:studio        # Open Drizzle Studio (database GUI)

# Code Quality
bun run typecheck        # TypeScript type checking
bun run codecheck        # ESLint code analysis
bun run format           # Auto-fix ESLint issues
bun run pretty           # Format code with Prettier
bun run check            # Run all checks (typecheck + codecheck)
bun run check:write      # Run all checks and fix issues
```

### Database Management

#### Schema Definition

```typescript
// src/db/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const contracts = pgTable('contracts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'),
  status: text('status').default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: text('user_id').notNull(),
});

export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message'),
  type: text('type').default('info'),
  acknowledged: boolean('acknowledged').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  userId: text('user_id').notNull(),
});
```

#### Creating Migrations

```bash
# After modifying schema.ts
bun run db:generate

# Apply migrations
bun run db:migrate
```

### API Development Patterns

#### Controller Example

```typescript
// src/controllers/contracts.controller.ts
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

const contracts = new OpenAPIHono();

contracts.openapi('GET', '/contracts', {
  request: {
    query: z.object({
      page: z.string().default('1'),
      limit: z.string().default('10'),
      status: z.enum(['draft', 'active', 'completed']).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            contracts: z.array(ContractSchema),
            pagination: PaginationSchema,
          }),
        },
      },
      description: 'List of contracts',
    },
  },
  tags: ['contracts'],
}, async (c) => {
  const query = c.req.valid('query');
  const contracts = await contractService.getContracts(query);
  return c.json(contracts);
});
```

#### Service Example

```typescript
// src/services/contract.service.ts
export class ContractService {
  async getContracts(params: GetContractsParams) {
    const { page, limit, status, userId } = params;

    return await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.userId, userId),
          status ? eq(contracts.status, status) : undefined
        )
      )
      .limit(limit)
      .offset((page - 1) * limit);
  }

  async createContract(data: CreateContractData) {
    const [contract] = await db
      .insert(contracts)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Emit event for workflow processing
    await rabbitMQService.publishEvent('contract.created', contract);

    return contract;
  }
}
```

### Authentication Integration

```typescript
// src/lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});

// Middleware usage
app.use('/api/protected/*', async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.header(),
  });

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  c.set('user', session.user);
  await next();
});
```

### Message Queue Integration

```typescript
// src/lib/rabbitmq.ts
export class RabbitMQService {
  async publishEvent(eventType: string, data: any) {
    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    await this.channel.publish(
      this.exchangeName,
      eventType,
      Buffer.from(JSON.stringify(message))
    );
  }

  async consumeEvents(queueName: string, handler: EventHandler) {
    await this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const event = JSON.parse(msg.content.toString());
          await handler(event);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          this.channel.nack(msg, false, false);
        }
      }
    });
  }
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/services/contract.service.test.ts

# Run tests with coverage
bun test --coverage
```

### API Testing

```bash
# Test contract creation
curl -X POST http://localhost:5001/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Contract",
    "content": "Contract content here",
    "status": "draft"
  }'

# Test health endpoint
curl http://localhost:5001/
```

## 🚀 Deployment

### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN bun run build

# Expose port
EXPOSE 5001

# Start application
CMD ["bun", "run", "start"]
```

### Build and Run

```bash
# Build Docker image
docker build -t modyv-backend .

# Run container
docker run -d \
  -p 5001:5001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e RABBITMQ_URL=amqp://host:5672 \
  --name modyv-backend \
  modyv-backend
```

### Environment-Specific Configuration

#### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/modyv_prod
RABBITMQ_URL=amqp://prod_rabbitmq:5672
BETTER_AUTH_SECRET=super-secure-production-secret
LOG_LEVEL=warn
```

#### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
PORT=5001
DATABASE_URL=postgresql://staging_user:staging_pass@staging_host:5432/modyv_staging
RABBITMQ_URL=amqp://staging_rabbitmq:5672
LOG_LEVEL=info
```

## 📊 Monitoring & Observability

### Health Checks

The service provides comprehensive health checks:

```typescript
// Health check endpoint
app.get('/health', async (c) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      rabbitmq: await checkRabbitMQHealth(),
      external: await checkExternalServices(),
    },
  };

  const isHealthy = Object.values(health.services).every(
    service => service.status === 'healthy'
  );

  return c.json(health, isHealthy ? 200 : 503);
});
```

### Logging

Structured logging with correlation IDs:

```typescript
import { logger } from 'hono/logger';

app.use(logger((message, ...rest) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message,
    requestId: rest[0]?.requestId,
    ...rest,
  }));
}));
```

### Performance Metrics

Monitor key performance indicators:

- Request/response times
- Database query performance
- Message queue throughput
- Error rates and types
- Active connections

## 🔐 Security

### Security Headers

```typescript
app.use('*', async (c, next) => {
  await next();

  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000');
});
```

### Input Validation

```typescript
const CreateContractSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed']),
  parties: z.array(z.string()).min(1).max(10),
});
```

### Rate Limiting

```typescript
app.use('/api/*', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
}));
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use Zod for all input validation
3. Write comprehensive tests
4. Include JSDoc comments
5. Follow the established project structure
6. Update documentation for new features

### Code Style

- Use camelCase for variables and functions
- Use PascalCase for classes and types
- Use UPPER_SNAKE_CASE for constants
- Prefer async/await over Promises
- Use meaningful variable names

## 📄 License

This project is proprietary software for PT Integrasi Logistik Cipta Solusi (ILCS).

---

**MODYV Backend API** - Built with Hono.js, TypeScript, and Bun for maximum performance and developer experience.

*Last updated: September 2025*