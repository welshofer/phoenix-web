# Technical Debt & Issues

## Critical Problems

### 1. API Endpoint Chaos
- **4+ different presentation generation endpoints** with incompatible interfaces
- No clear "source of truth" for which endpoint to use
- Each endpoint has different:
  - Authentication requirements
  - Response formats
  - Error handling
  - Performance characteristics

### 2. Firebase/Firestore Issues
- Constant "5 NOT_FOUND" errors in logs
- Project misconfigured or not properly initialized
- Rate limiting and usage tracking fail but don't gracefully degrade
- Authentication works inconsistently

### 3. No Testing
- Zero tests for API endpoints
- No integration tests
- Changes break existing functionality without warning
- Can't refactor safely

### 4. Data Structure Inconsistency
```javascript
// Sometimes:
data.presentation.slides

// Sometimes:
data.slides

// Sometimes:
data.presentation.sections[0].slides

// Response formats vary wildly between endpoints
```

### 5. Performance Issues
- Generation can take 9+ minutes due to auth/network issues
- No proper timeouts
- No retry logic that actually works
- Blocking UI instead of async operations

## Immediate Actions Needed

1. **Pick ONE endpoint and delete the others**
   - `/api/ai/generate-presentation` should be the only one
   - Delete: full-presentation, fast-presentation, simple-presentation

2. **Fix Firebase or remove it entirely**
   - Either properly configure Firebase project
   - OR remove all Firestore dependencies and use local storage

3. **Standardize response format**
   ```typescript
   interface StandardResponse {
     success: boolean;
     slides: Slide[];
     metadata: {
       title: string;
       subtitle?: string;
       generatedAt: Date;
       timing?: { seconds: number };
     };
     error?: string;
   }
   ```

4. **Add basic tests**
   - At minimum: test that endpoint returns 200
   - Test response structure matches expected format
   - Test auth works/fails appropriately

5. **Add proper monitoring**
   - Log generation times
   - Alert on failures
   - Track which endpoints are actually being used

## Long-term Fixes

- Migrate to a proper backend service (not serverless functions)
- Implement proper caching
- Add OpenTelemetry for observability
- Create API documentation
- Version the API properly
- Add end-to-end tests

## The Real Problem

We keep adding "fixes" on top of broken foundations instead of:
1. Fixing the root issues
2. Cleaning up the mess
3. Testing our changes

Every "quick fix" adds more complexity and more potential for regressions.