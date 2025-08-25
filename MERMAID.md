# Phoenix Web Architecture Diagrams (Updated)

## System Architecture Overview (Production-Ready)

```mermaid
graph TB
    subgraph "Client Browser"
        UI[Next.js Frontend]
        RQ[React Query Cache]
        SR[Slide Renderer<br/>Lazy Loaded]
        ED[Presentation Editor<br/>Lazy Loaded]
        PM[Presentation Mode]
    end
    
    subgraph "Next.js API Routes"
        API["/api/*"]
        subgraph "Protected Endpoints"
            AGP["/api/ai/generate-presentation<br/>✅ Auth + Rate Limit"]
            AIG["/api/imagen/*<br/>✅ Auth + Rate Limit"]
            EXP["/api/export/*<br/>✅ Auth"]
            POD["/api/podcast/*<br/>✅ Auth"]
        end
        MW[Middleware<br/>- Auth Verification<br/>- Rate Limiting<br/>- Input Validation]
    end
    
    subgraph "Caching Layer"
        REDIS[Upstash Redis<br/>- API Cache<br/>- Rate Limits<br/>- Sessions]
        MEM[Memory Cache<br/>Fallback]
    end
    
    subgraph "Firebase Services"
        AUTH[Firebase Auth<br/>+ Admin SDK]
        FS[Firestore Database<br/>✅ Security Rules]
        ST[Firebase Storage<br/>✅ Security Rules]
    end
    
    subgraph "Google Cloud"
        VAI[Vertex AI]
        GEM[Gemini 2.5 Flash]
        ADC[Application Default Credentials]
    end
    
    subgraph "Error Recovery"
        CB[Circuit Breakers]
        EXB[Exponential Backoff]
        RES[Resilient Wrappers]
    end
    
    UI --> RQ
    RQ --> API
    UI --> AUTH
    UI --> FS
    
    API --> MW
    MW --> REDIS
    MW --> AUTH
    
    AGP --> REDIS
    AGP --> CB
    CB --> VAI
    VAI --> GEM
    VAI --> ADC
    
    ED --> FS
    PM --> FS
    SR --> FS
    
    FS --> RES
    ST --> RES
    AUTH --> RES
    
    REDIS --> MEM
```

## Enhanced Data Flow with Security & Caching

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Next.js UI
    participant RQ as React Query
    participant API as API Routes
    participant VAL as Zod Validation
    participant AUTH as Firebase Admin
    participant RL as Rate Limiter
    participant CACHE as Redis Cache
    participant ERR as Error Handler
    participant VAI as Vertex AI
    participant FS as Firestore
    
    U->>UI: Enter presentation topic
    UI->>UI: Client-side validation
    UI->>RQ: Check cache
    RQ-->>UI: Cache miss
    UI->>API: POST /api/ai/generate-presentation
    
    API->>VAL: Validate with Zod schema
    VAL-->>API: Validation result
    
    API->>AUTH: Verify ID token
    AUTH-->>API: Token valid
    
    API->>RL: Check rate limits
    RL->>CACHE: Get user limits
    CACHE-->>RL: Limits OK
    
    API->>CACHE: Check AI cache
    CACHE-->>API: Cache miss
    
    API->>VAI: Generate content (30s timeout)
    VAI-->>API: Return JSON
    
    API->>ERR: Parse & handle errors
    ERR-->>API: Normalized response
    
    API->>CACHE: Store in cache
    API-->>UI: Return presentation data
    
    UI->>RQ: Update cache
    UI->>FS: Save presentation (with retry)
    FS-->>UI: Return presentation ID
    UI->>UI: Redirect to editor
```

## Component Architecture with New Features

```mermaid
graph TD
    subgraph "Pages"
        Home[index.tsx]
        Gen[generate.tsx]
        List[presentations/index.tsx]
        Edit[presentations/[id]/edit.tsx]
        Present[presentations/[id]/present.tsx]
        View[presentations/view.tsx]
    end
    
    subgraph "Lazy Components"
        LC[LazyComponents.tsx]
        LSR[LazySlideRenderer]
        LED[LazyPresentationEditor]
        LIG[LazyImageGenerationPanel]
        LDG[LazyDataGrid]
        LPE[LazyPowerPointExporter]
    end
    
    subgraph "Providers"
        QP[QueryProvider<br/>React Query]
        AP[AuthProvider]
        TP[ThemeProvider]
    end
    
    subgraph "Hooks"
        UA[useAuth]
        UP[usePresentation<br/>+ Caching]
        UAI[useAI]
        UIG[useImageGeneration]
    end
    
    subgraph "Core Libraries"
        FBC[firebase/config]
        FBA[firebase/admin]
        FBP[firebase/presentations]
        FER[firebase/error-recovery]
    end
    
    subgraph "Server Libraries"
        VAL[server/vertex-ai]
        SC[server/slide-converter]
        RL[server/rate-limiter]
        VS[validation/schemas]
        EH[errors/handler]
    end
    
    subgraph "Cache & Queue"
        RC[cache/redis]
        AQ[utils/async-queue]
        PM[monitoring/performance]
    end
    
    Home --> QP
    Home --> UA
    Gen --> UP
    Gen --> VS
    
    Edit --> LC
    LC --> LSR
    LC --> LED
    
    Edit --> FER
    Present --> LSR
    Present --> UP
    
    UP --> RC
    UP --> FER
    
    API --> FBA
    API --> EH
    API --> VS
    
    List --> LDG
    View --> LSR
```

## Security & Error Handling Architecture

```mermaid
flowchart TB
    subgraph "Request Flow"
        REQ[Incoming Request]
        MW[Middleware]
        VAL[Zod Validation]
        AUTH[Auth Check]
        RATE[Rate Limit]
        CACHE[Cache Check]
        PROC[Process Request]
        RES[Response]
    end
    
    subgraph "Error Handling"
        EH[Error Handler]
        NE[Normalize Error]
        AE[AppError Classes]
        CB[Circuit Breaker]
        EXB[Exponential Backoff]
        LOG[Error Logging]
    end
    
    subgraph "Security Layers"
        TOK[ID Token Verification]
        RBAC[Role-Based Access]
        INP[Input Sanitization]
        SEC[Security Headers]
        CORS[CORS Policy]
    end
    
    REQ --> MW
    MW --> VAL
    VAL -->|Invalid| EH
    VAL -->|Valid| AUTH
    AUTH -->|Fail| EH
    AUTH -->|Pass| RATE
    RATE -->|Exceeded| EH
    RATE -->|OK| CACHE
    CACHE -->|Hit| RES
    CACHE -->|Miss| PROC
    PROC -->|Error| EH
    PROC -->|Success| RES
    
    EH --> NE
    NE --> AE
    AE --> CB
    CB --> EXB
    EXB --> LOG
    LOG --> RES
    
    AUTH --> TOK
    TOK --> RBAC
    VAL --> INP
    MW --> SEC
    MW --> CORS
```

## Database Schema with Security Rules

```mermaid
erDiagram
    USERS ||--o{ PRESENTATIONS : creates
    PRESENTATIONS ||--|{ SLIDES : contains
    SLIDES ||--|{ OBJECTS : contains
    PRESENTATIONS ||--|| CACHE : cached
    USERS ||--o{ USAGE : tracks
    USERS ||--o{ RATE_LIMITS : has
    
    USERS {
        string uid PK "Auth.uid only"
        string email "Encrypted"
        string displayName
        timestamp createdAt
        map settings
        boolean isActive
    }
    
    PRESENTATIONS {
        string id PK "UUID"
        string userId FK "Owner only write"
        string title "Required"
        string subtitle
        boolean isPublic "Default false"
        array sharedWith "User IDs"
        timestamp createdAt "Server timestamp"
        timestamp updatedAt "Auto update"
        map metadata
    }
    
    SLIDES {
        string id PK
        string presentationId FK
        string type "Validated enum"
        string heading "Max 100 chars"
        map content "Validated schema"
        array bullets "Max 10 items"
        string imageUrl "Storage ref"
        number order
        string theme
    }
    
    OBJECTS {
        string id PK
        string slideId FK
        string type "text|image|shape"
        map coordinates "x,y,width,height"
        map properties "Type-specific"
        boolean visible
    }
    
    CACHE {
        string key PK "Hash of params"
        string presentationId FK
        map data "Cached response"
        timestamp expiry "TTL 24 hours"
    }
    
    USAGE {
        string userId FK
        string resource "presentations|slides|images"
        number count
        timestamp date
        map metadata
    }
    
    RATE_LIMITS {
        string userId FK
        string endpoint
        number requests
        timestamp windowStart
        timestamp resetAt
    }
```

## API Architecture with Improvements

```mermaid
graph LR
    subgraph "API Gateway"
        GATE[API Gateway<br/>- Authentication<br/>- Rate Limiting<br/>- Caching]
    end
    
    subgraph "Main API (Consolidated)"
        AGP[POST /api/ai/generate-presentation<br/>✅ Protected<br/>✅ Validated<br/>✅ Cached<br/>30s timeout]
    end
    
    subgraph "Deprecated (Redirected)"
        SP[/api/simple-presentation<br/>→ 301 Redirect]
        FP[/api/full-presentation<br/>→ 301 Redirect]
        FSP[/api/fast-presentation<br/>→ 301 Redirect]
    end
    
    subgraph "Image APIs"
        IG[/api/imagen/generate<br/>Queue-based]
        IP[/api/imagen/process-queue<br/>Background job]
        IR[/api/imagen/retry<br/>Error recovery]
    end
    
    subgraph "Export APIs"
        PPT[/api/export/powerpoint<br/>Lazy loaded]
        PDF[/api/export/pdf<br/>Lazy loaded]
    end
    
    subgraph "Validation"
        ZOD[Zod Schemas<br/>- Input validation<br/>- Type safety<br/>- Error messages]
    end
    
    subgraph "Processing"
        QUEUE[Job Queues<br/>- Image generation<br/>- Exports<br/>- Podcasts]
        CACHE[Cache Layer<br/>- Redis/Upstash<br/>- Memory fallback]
    end
    
    GATE --> AGP
    GATE --> IG
    GATE --> PPT
    
    SP --> AGP
    FP --> AGP
    FSP --> AGP
    
    AGP --> ZOD
    IG --> ZOD
    PPT --> ZOD
    
    ZOD --> QUEUE
    ZOD --> CACHE
    
    IG --> QUEUE
    IP --> QUEUE
```

## Performance Optimization Strategy

```mermaid
flowchart LR
    subgraph "Bundle Optimization"
        SPLIT[Code Splitting<br/>- Vendor chunks<br/>- MUI separate<br/>- Firebase separate]
        LAZY[Lazy Loading<br/>- Heavy components<br/>- Routes<br/>- Libraries]
        TREE[Tree Shaking<br/>- Remove unused<br/>- Optimize imports]
    end
    
    subgraph "Caching Strategy"
        L1[Browser Cache<br/>React Query]
        L2[Edge Cache<br/>CDN/Vercel]
        L3[Redis Cache<br/>API responses]
        L4[Memory Cache<br/>Fallback]
    end
    
    subgraph "Runtime Performance"
        WV[Web Vitals<br/>Monitoring]
        RT[Resource Timing<br/>Observation]
        LT[Long Task<br/>Detection]
        MEM[Memory Usage<br/>Tracking]
    end
    
    subgraph "API Performance"
        TO[30s Timeout<br/>vs 7 min]
        RL[Rate Limiting<br/>Sliding window]
        CB[Circuit Breaker<br/>Fail fast]
        BG[Background Jobs<br/>Async processing]
    end
    
    SPLIT --> LAZY
    LAZY --> TREE
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    
    WV --> RT
    RT --> LT
    LT --> MEM
    
    TO --> RL
    RL --> CB
    CB --> BG
```

## CI/CD Pipeline

```mermaid
flowchart TB
    subgraph "Development"
        DEV[Local Development<br/>npm run dev]
        TEST[Testing<br/>npm run test]
        LINT[Linting<br/>npm run lint]
        TC[Type Check<br/>npm run typecheck]
    end
    
    subgraph "GitHub Actions"
        PUSH[Push to main/develop]
        CI[CI Pipeline<br/>- Test matrix<br/>- Node 18.x, 20.x<br/>- Coverage]
        SEC[Security Scan<br/>- npm audit<br/>- Snyk scan]
        BUILD[Build Check<br/>- Next.js build<br/>- Bundle analysis]
    end
    
    subgraph "Deployment"
        RULES[Deploy Rules<br/>- Firestore<br/>- Storage]
        VER[Deploy to Vercel<br/>- Production build<br/>- Env vars]
        FUNC[Deploy Functions<br/>- Firebase functions]
        SMOKE[Smoke Tests<br/>- Health checks<br/>- API tests]
    end
    
    subgraph "Monitoring"
        ALERT[Alerts<br/>- Slack<br/>- Email]
        DASH[Dashboard<br/>- Performance<br/>- Errors]
    end
    
    DEV --> TEST
    TEST --> LINT
    LINT --> TC
    TC --> PUSH
    
    PUSH --> CI
    CI --> SEC
    SEC --> BUILD
    BUILD -->|Pass| RULES
    
    RULES --> VER
    VER --> FUNC
    FUNC --> SMOKE
    
    SMOKE -->|Success| ALERT
    SMOKE -->|Fail| ALERT
    ALERT --> DASH
```

## Testing Architecture

```mermaid
graph TD
    subgraph "Test Types"
        UNIT[Unit Tests<br/>- Components<br/>- Hooks<br/>- Utils]
        INT[Integration Tests<br/>- API routes<br/>- Firebase<br/>- Cache]
        E2E[E2E Tests<br/>- User flows<br/>- Critical paths]
    end
    
    subgraph "Test Infrastructure"
        JEST[Jest<br/>- Test runner<br/>- Coverage]
        RTL[React Testing Library<br/>- Component testing]
        MSW[Mock Service Worker<br/>- API mocking]
        MOCK[Firebase Mocks<br/>- Auth<br/>- Firestore<br/>- Storage]
    end
    
    subgraph "Coverage Areas"
        API[API Tests<br/>✅ Authentication<br/>✅ Rate limiting<br/>✅ Validation]
        COMP[Component Tests<br/>✅ SlideRenderer<br/>✅ Editor<br/>✅ Navigation]
        FB[Firebase Tests<br/>✅ Config<br/>✅ Error recovery<br/>✅ Security]
    end
    
    UNIT --> JEST
    INT --> JEST
    E2E --> JEST
    
    JEST --> RTL
    JEST --> MSW
    JEST --> MOCK
    
    RTL --> COMP
    MSW --> API
    MOCK --> FB
```

## Production Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Vercel Edge Network<br/>Global CDN]
    end
    
    subgraph "Application Tier"
        V1[Vercel Instance 1]
        V2[Vercel Instance 2]
        V3[Vercel Instance N]
    end
    
    subgraph "Caching Tier"
        REDIS[Upstash Redis<br/>- Global replication<br/>- Auto-failover]
        CDN[Vercel CDN<br/>- Static assets<br/>- API cache]
    end
    
    subgraph "Firebase Services"
        subgraph "Multi-Region"
            AUTH[Firebase Auth<br/>Global]
            FS1[Firestore<br/>us-central1]
            FS2[Firestore<br/>europe-west1]
            ST[Cloud Storage<br/>Multi-region]
        end
    end
    
    subgraph "Google Cloud"
        VAI[Vertex AI<br/>- Auto-scaling<br/>- Regional endpoints]
        MON[Cloud Monitoring<br/>- Logs<br/>- Metrics<br/>- Alerts]
    end
    
    subgraph "Error Recovery"
        CB[Circuit Breakers<br/>Per service]
        DLQ[Dead Letter Queue<br/>Failed jobs]
        RETRY[Retry Logic<br/>Exponential backoff]
    end
    
    LB --> V1
    LB --> V2
    LB --> V3
    
    V1 --> REDIS
    V2 --> REDIS
    V3 --> REDIS
    
    V1 --> CDN
    
    V1 --> AUTH
    V1 --> FS1
    V1 --> ST
    
    FS1 -.->|Replication| FS2
    
    V1 --> VAI
    VAI --> MON
    
    V1 --> CB
    CB --> RETRY
    RETRY --> DLQ
```

## Security Model

```mermaid
flowchart TB
    subgraph "Authentication Layer"
        USER[User Request]
        TOKEN[ID Token]
        ADMIN[Firebase Admin SDK]
        VERIFY[Token Verification]
    end
    
    subgraph "Authorization Layer"
        RBAC[Role-Based Access]
        OWNER[Resource Owner Check]
        SHARE[Sharing Permissions]
        PUBLIC[Public Access]
    end
    
    subgraph "Validation Layer"
        ZOD[Zod Schemas]
        SANITIZE[Input Sanitization]
        ESCAPE[XSS Prevention]
        SIZE[Size Limits]
    end
    
    subgraph "Rate Limiting"
        WINDOW[Sliding Window]
        BUCKET[Token Bucket]
        USER_LIMIT[Per User Limits]
        IP_LIMIT[Per IP Limits]
    end
    
    subgraph "Security Rules"
        FS_RULES[Firestore Rules<br/>- User isolation<br/>- Field validation]
        ST_RULES[Storage Rules<br/>- File type check<br/>- Size limits]
    end
    
    subgraph "Security Headers"
        CSP[Content Security Policy]
        HSTS[Strict Transport Security]
        XFO[X-Frame-Options]
        CORS[CORS Configuration]
    end
    
    USER --> TOKEN
    TOKEN --> ADMIN
    ADMIN --> VERIFY
    
    VERIFY --> RBAC
    RBAC --> OWNER
    OWNER --> SHARE
    SHARE --> PUBLIC
    
    USER --> ZOD
    ZOD --> SANITIZE
    SANITIZE --> ESCAPE
    ESCAPE --> SIZE
    
    USER --> WINDOW
    WINDOW --> BUCKET
    BUCKET --> USER_LIMIT
    USER_LIMIT --> IP_LIMIT
    
    RBAC --> FS_RULES
    RBAC --> ST_RULES
    
    USER --> CSP
    CSP --> HSTS
    HSTS --> XFO
    XFO --> CORS
```

---

*Architecture diagrams updated: August 25, 2025*  
*Reflects all implemented improvements including security, caching, error recovery, and performance optimizations*