# Phoenix Web Architecture Diagrams

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Browser"
        UI[Next.js Frontend]
        SR[Slide Renderer]
        ED[Presentation Editor]
        PM[Presentation Mode]
    end
    
    subgraph "Next.js API Routes"
        API["/api/*"]
        AGP["/api/ai/generate-presentation"]
        AIG["/api/ai/generate-image"]
        FP["/api/full-presentation"]
        SP["/api/simple-presentation"]
    end
    
    subgraph "Firebase Services"
        AUTH[Firebase Auth]
        FS[Firestore Database]
        ST[Firebase Storage]
    end
    
    subgraph "Google Cloud"
        VAI[Vertex AI]
        GEM[Gemini 2.5 Flash]
        ADC[Application Default Credentials]
    end
    
    UI --> API
    UI --> AUTH
    UI --> FS
    
    API --> VAI
    VAI --> GEM
    VAI --> ADC
    
    AGP --> VAI
    AIG --> VAI
    FP --> VAI
    SP --> VAI
    
    ED --> FS
    PM --> FS
    SR --> FS
    
    AUTH --> FS
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Next.js UI
    participant API as API Routes
    participant FB as Firebase
    participant VAI as Vertex AI
    participant FS as Firestore
    
    U->>UI: Enter presentation topic
    UI->>UI: Validate input
    UI->>API: POST /api/full-presentation
    API->>VAI: Generate content (Gemini 2.5)
    VAI-->>API: Return JSON
    API->>API: Parse & validate JSON
    API-->>UI: Return presentation data
    UI->>FS: Save presentation
    FS-->>UI: Return presentation ID
    UI->>UI: Redirect to editor
    U->>UI: Edit presentation
    UI->>FS: Update slides
    FS-->>UI: Confirm save
    U->>UI: Start presentation
    UI->>UI: Enter presentation mode
```

## Component Architecture

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
    
    subgraph "Components"
        SR[SlideRenderer]
        SO[Slide Objects]
        TO[TextObject]
        IO[ImageObject]
        SHO[ShapeObject]
    end
    
    subgraph "Hooks"
        UA[useAuth]
        UAI[useAI]
    end
    
    subgraph "Libraries"
        FBC[firebase/config]
        FBP[firebase/presentations]
        VAL[server/vertex-ai]
        SC[server/slide-converter]
        RL[server/rate-limiter]
    end
    
    Home --> UA
    Gen --> UA
    Gen --> FBP
    Gen --> VAL
    
    Edit --> SR
    Edit --> FBP
    Edit --> SO
    
    Present --> SR
    Present --> FBP
    
    SR --> TO
    SR --> IO
    SR --> SHO
    
    List --> FBP
    View --> SR
```

## Slide Object Model

```mermaid
classDiagram
    class Slide {
        +string id
        +SlideType type
        +SlideObjectUnion[] objects
        +number order
        +string templateId
        +string colorSetId
        +string typographySetId
        +Date createdAt
        +Date updatedAt
    }
    
    class SlideObjectUnion {
        <<interface>>
        +string id
        +string type
        +Coordinates coordinates
        +boolean visible
    }
    
    class TextObject {
        +string content
        +string role
        +string fontFamily
        +string color
        +number fontSize
    }
    
    class ImageObject {
        +string src
        +string alt
        +ImageFit fit
    }
    
    class ShapeObject {
        +ShapeType shapeType
        +string fill
        +string stroke
        +number strokeWidth
    }
    
    class Coordinates {
        +number x
        +number y
        +number width
        +number height
    }
    
    Slide "1" --> "*" SlideObjectUnion
    SlideObjectUnion <|-- TextObject
    SlideObjectUnion <|-- ImageObject
    SlideObjectUnion <|-- ShapeObject
    SlideObjectUnion --> Coordinates
```

## Presentation Generation Flow

```mermaid
flowchart LR
    Start([User Input]) --> Validate{Valid?}
    Validate -->|No| Error[Show Error]
    Validate -->|Yes| Auth{Authenticated?}
    Auth -->|No| AnonAuth[Anonymous Auth]
    Auth -->|Yes| CheckRate[Check Rate Limits]
    AnonAuth --> CheckRate
    CheckRate -->|Exceeded| RateError[Rate Limit Error]
    CheckRate -->|OK| CallAI[Call Vertex AI]
    CallAI --> Parse{Parse JSON}
    Parse -->|Error| Fallback[Use Fallback]
    Parse -->|Success| Convert[Convert to Slides]
    Fallback --> Convert
    Convert --> Save[Save to Firestore]
    Save --> Redirect[Redirect to Editor]
    Redirect --> End([Edit Mode])
```

## Editor State Management

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> Loaded
    Loading --> Error
    
    Loaded --> Editing
    Editing --> Saving
    Saving --> Saved
    Saved --> Editing
    
    Editing --> AddObject
    AddObject --> Editing
    
    Editing --> SelectObject
    SelectObject --> EditProperties
    EditProperties --> Editing
    
    Editing --> DeleteObject
    DeleteObject --> Editing
    
    Editing --> ReorderSlides
    ReorderSlides --> Editing
    
    Editing --> Presenting
    Presenting --> Editing
    
    Error --> [*]
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ PRESENTATIONS : creates
    PRESENTATIONS ||--|{ SECTIONS : contains
    SECTIONS ||--|{ SLIDES : contains
    SLIDES ||--|{ OBJECTS : contains
    PRESENTATIONS ||--|| SETTINGS : has
    
    USERS {
        string uid PK
        string email
        string displayName
        timestamp createdAt
        map usage
    }
    
    PRESENTATIONS {
        string id PK
        string userId FK
        string title
        string topic
        number slideCount
        string tone
        string goal
        timestamp createdAt
        timestamp updatedAt
    }
    
    SECTIONS {
        string id PK
        string presentationId FK
        string title
        number order
    }
    
    SLIDES {
        string id PK
        string sectionId FK
        string type
        map content
        string speakerNotes
        array presenterNotes
        array images
        number order
    }
    
    OBJECTS {
        string id PK
        string slideId FK
        string type
        map coordinates
        map properties
        boolean visible
    }
    
    SETTINGS {
        string presentationId FK
        string theme
        string colorScheme
        boolean animations
    }
```

## API Endpoints

```mermaid
graph LR
    subgraph "Presentation APIs"
        FP[POST /api/full-presentation<br/>Complex, detailed]
        SP[POST /api/simple-presentation<br/>Simple, reliable]
        FSP[POST /api/fast-presentation<br/>Minimal, fast]
    end
    
    subgraph "AI APIs"
        AGP[POST /api/ai/generate-presentation<br/>With rate limiting]
        AIG[POST /api/ai/generate-image<br/>Image generation]
    end
    
    subgraph "Inputs"
        Topic[topic: string]
        Count[slideCount: number]
        Tone[tone: string]
        Goal[goal: string]
        Audience[audience: string]
    end
    
    subgraph "Outputs"
        Pres[Presentation JSON]
        Meta[Metadata]
        Timing[Performance Metrics]
    end
    
    Topic --> FP
    Count --> FP
    Tone --> FP
    Goal --> FP
    Audience --> FP
    
    Topic --> SP
    Count --> SP
    
    Topic --> FSP
    
    FP --> Pres
    SP --> Pres
    FSP --> Pres
    
    FP --> Meta
    FP --> Timing
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        Local[Local Next.js<br/>localhost:3001]
        DevDB[(Firestore Dev)]
        DevAuth[Firebase Auth Dev]
    end
    
    subgraph "Production Options"
        Vercel[Vercel Hosting]
        GCR[Google Cloud Run]
        GAE[Google App Engine]
    end
    
    subgraph "Shared Services"
        ProdDB[(Firestore Prod)]
        ProdAuth[Firebase Auth Prod]
        VAI[Vertex AI]
        GCS[Google Cloud Storage]
    end
    
    Local --> DevDB
    Local --> DevAuth
    Local --> VAI
    
    Vercel --> ProdDB
    Vercel --> ProdAuth
    Vercel --> VAI
    
    GCR --> ProdDB
    GCR --> ProdAuth
    GCR --> VAI
    
    GAE --> ProdDB
    GAE --> ProdAuth
    GAE --> VAI
    
    ProdDB --> GCS
```

## Coordinate System

```mermaid
graph TD
    subgraph "1920x1080 Canvas"
        Origin[0,0 Top-Left]
        BR[1920,1080 Bottom-Right]
        
        subgraph "Zones"
            Header[Header Zone<br/>100,100 - 1820,300]
            Content[Content Zone<br/>100,350 - 1820,950]
            Footer[Footer Zone<br/>100,980 - 1820,1060]
        end
        
        subgraph "Grid System"
            Col1[Column 1<br/>100-620]
            Col2[Column 2<br/>640-1280]
            Col3[Column 3<br/>1300-1820]
        end
    end
    
    Origin --> Header
    Header --> Content
    Content --> Footer
    Footer --> BR
```