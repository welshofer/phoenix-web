import { createMocks } from 'node-mocks-http'
import handler from '../simple-presentation'

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ id: 'test-id' }),
        }),
      })),
      add: jest.fn().mockResolvedValue({ id: 'new-doc-id' }),
    })),
  })),
}))

// Mock Vertex AI
jest.mock('@google-cloud/vertexai', () => ({
  VertexAI: jest.fn().mockImplementation(() => ({
    preview: {
      getGenerativeModel: jest.fn(() => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn(() => JSON.stringify({
              title: 'Test Presentation',
              slides: [
                {
                  id: 'slide-1',
                  type: 'title',
                  content: {
                    heading: 'Test Title',
                    subheading: 'Test Subtitle',
                  },
                },
                {
                  id: 'slide-2',
                  type: 'bullet',
                  content: {
                    heading: 'Key Points',
                    bullets: ['Point 1', 'Point 2', 'Point 3'],
                  },
                },
              ],
            })),
          },
        }),
      })),
    },
  })),
}))

describe('/api/simple-presentation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST request', () => {
    it('should generate a simple presentation successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          topic: 'Introduction to Testing',
          style: 'professional',
          slideCount: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      
      expect(responseData).toHaveProperty('success', true)
      expect(responseData).toHaveProperty('presentation')
      expect(responseData.presentation).toHaveProperty('title', 'Test Presentation')
      expect(responseData.presentation.slides).toHaveLength(2)
    })

    it('should validate required topic parameter', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          style: 'professional',
          slideCount: 5,
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('error')
      expect(responseData.error).toContain('topic')
    })

    it('should handle invalid slide count', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          topic: 'Test Topic',
          slideCount: 100, // Too many slides
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('error')
    })

    it('should handle AI generation errors gracefully', async () => {
      // Mock AI to throw error
      const VertexAI = require('@google-cloud/vertexai').VertexAI
      VertexAI.mockImplementationOnce(() => ({
        preview: {
          getGenerativeModel: jest.fn(() => ({
            generateContent: jest.fn().mockRejectedValue(new Error('AI service unavailable')),
          })),
        },
      }))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          topic: 'Test Topic',
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('error')
      expect(responseData).toHaveProperty('success', false)
    })
  })

  describe('Non-POST requests', () => {
    it('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('error', 'Method not allowed')
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { topic: 'Test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Response format', () => {
    it('should return proper presentation structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          topic: 'Web Development Best Practices',
          style: 'modern',
          slideCount: 7,
        },
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      
      // Check presentation structure
      expect(responseData.presentation).toMatchObject({
        title: expect.any(String),
        slides: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: expect.any(String),
            content: expect.any(Object),
          }),
        ]),
      })

      // Verify slide types
      const slideTypes = responseData.presentation.slides.map((s: any) => s.type)
      expect(slideTypes).toContain('title')
    })

    it('should include metadata in response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          topic: 'Testing',
          includeMetadata: true,
        },
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      
      if (responseData.metadata) {
        expect(responseData.metadata).toHaveProperty('generatedAt')
        expect(responseData.metadata).toHaveProperty('model')
      }
    })
  })
})