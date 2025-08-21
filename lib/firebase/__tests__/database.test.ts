import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  increment,
} from 'firebase/firestore'
import * as database from '../database'
import { SlideType } from '@/lib/models/slide'

// Mock Firestore
jest.mock('firebase/firestore')
jest.mock('../config', () => ({
  db: { type: 'firestore' },
}))
jest.mock('../collections')

describe('Firebase Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock writeBatch
    ;(writeBatch as jest.Mock).mockReturnValue({
      delete: jest.fn(),
      update: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })
  })

  const mockCollections = {
    getUserDoc: jest.fn((userId) => ({ id: userId, path: `users/${userId}` })),
    getUserPresentationsCollection: jest.fn((userId) => ({ 
      id: 'presentations', 
      path: `users/${userId}/presentations` 
    })),
    getUserPresentationDoc: jest.fn((userId, presentationId) => ({ 
      id: presentationId, 
      path: `users/${userId}/presentations/${presentationId}` 
    })),
    getPresentationSlidesCollection: jest.fn((userId, presentationId) => ({ 
      id: 'slides', 
      path: `users/${userId}/presentations/${presentationId}/slides` 
    })),
    getPresentationSlideDoc: jest.fn((userId, presentationId, slideId) => ({ 
      id: slideId, 
      path: `users/${userId}/presentations/${presentationId}/slides/${slideId}` 
    })),
  }

  beforeAll(() => {
    // Mock the collections module
    jest.doMock('../collections', () => mockCollections)
  })

  describe('User Operations', () => {
    describe('createUserProfile', () => {
      it('should create a new user profile with default stats', async () => {
        ;(setDoc as jest.Mock).mockResolvedValue(undefined)
        
        const user = {
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
          preferences: { theme: 'dark' },
        }
        
        await database.createUserProfile(user)
        
        expect(mockCollections.getUserDoc).toHaveBeenCalledWith('user-123')
        expect(setDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...user,
            createdAt: expect.any(Date),
            lastLoginAt: expect.any(Date),
            stats: {
              totalPresentations: 0,
              totalSlides: 0,
              totalViews: 0,
              storageUsed: 0,
            },
          })
        )
      })
    })

    describe('getUserProfile', () => {
      it('should retrieve user profile', async () => {
        const mockUser = {
          uid: 'user-123',
          email: 'test@example.com',
          displayName: 'Test User',
        }
        
        ;(getDoc as jest.Mock).mockResolvedValue({
          exists: () => true,
          data: () => mockUser,
        })
        
        const result = await database.getUserProfile('user-123')
        
        expect(mockCollections.getUserDoc).toHaveBeenCalledWith('user-123')
        expect(getDoc).toHaveBeenCalled()
        expect(result).toEqual(mockUser)
      })

      it('should return null for non-existent user', async () => {
        ;(getDoc as jest.Mock).mockResolvedValue({
          exists: () => false,
          data: () => null,
        })
        
        const result = await database.getUserProfile('non-existent')
        
        expect(result).toBeNull()
      })
    })
  })

  describe('Presentation Operations', () => {
    describe('createPresentation', () => {
      it('should create presentation with default title slide', async () => {
        const mockDocRef = { id: 'pres-123' }
        ;(addDoc as jest.Mock).mockResolvedValue(mockDocRef)
        ;(updateDoc as jest.Mock).mockResolvedValue(undefined)
        ;(increment as jest.Mock).mockReturnValue({ increment: 1 })
        
        const result = await database.createPresentation(
          'user-123',
          'My Presentation',
          'Test description'
        )
        
        // Verify presentation was created
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            title: 'My Presentation',
            description: 'Test description',
            owner: 'user-123',
            slideCount: 0,
            isPublic: false,
          })
        )
        
        // Verify user stats were updated
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            'stats.totalPresentations': { increment: 1 },
          })
        )
        
        // Verify default slide was created
        expect(addDoc).toHaveBeenCalledTimes(2) // One for presentation, one for slide
        
        expect(result).toBe('pres-123')
      })
    })

    describe('getUserPresentations', () => {
      it('should retrieve all user presentations ordered by date', async () => {
        const mockPresentations = [
          { id: 'pres-1', title: 'Presentation 1' },
          { id: 'pres-2', title: 'Presentation 2' },
        ]
        
        ;(getDocs as jest.Mock).mockResolvedValue({
          docs: mockPresentations.map(p => ({
            data: () => p,
          })),
        })
        
        const result = await database.getUserPresentations('user-123')
        
        expect(query).toHaveBeenCalled()
        expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc')
        expect(result).toEqual(mockPresentations)
      })
    })

    describe('deletePresentation', () => {
      it('should delete presentation and all slides', async () => {
        const mockBatch = {
          delete: jest.fn(),
          update: jest.fn(),
          commit: jest.fn().mockResolvedValue(undefined),
        }
        ;(writeBatch as jest.Mock).mockReturnValue(mockBatch)
        ;(increment as jest.Mock).mockImplementation((n) => ({ increment: n }))
        
        // Mock slides to delete
        ;(getDocs as jest.Mock).mockResolvedValue({
          size: 3,
          docs: [
            { ref: 'slide-1-ref' },
            { ref: 'slide-2-ref' },
            { ref: 'slide-3-ref' },
          ],
        })
        
        await database.deletePresentation('user-123', 'pres-123')
        
        // Verify slides were deleted
        expect(mockBatch.delete).toHaveBeenCalledTimes(4) // 3 slides + 1 presentation
        
        // Verify user stats were updated
        expect(mockBatch.update).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            'stats.totalPresentations': { increment: -1 },
            'stats.totalSlides': { increment: -3 },
          })
        )
        
        expect(mockBatch.commit).toHaveBeenCalled()
      })
    })
  })

  describe('Slide Operations', () => {
    describe('createSlide', () => {
      it('should create a new slide and update counters', async () => {
        const mockDocRef = { id: 'slide-123' }
        ;(addDoc as jest.Mock).mockResolvedValue(mockDocRef)
        ;(updateDoc as jest.Mock).mockResolvedValue(undefined)
        ;(increment as jest.Mock).mockReturnValue({ increment: 1 })
        
        const slideData = {
          type: SlideType.TITLE,
          content: { heading: 'Title', subheading: 'Subtitle' },
          order: 0,
        }
        
        const result = await database.createSlide('user-123', 'pres-123', slideData)
        
        // Verify slide was created
        expect(addDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...slideData,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          })
        )
        
        // Verify presentation slide count was updated
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            slideCount: { increment: 1 },
          })
        )
        
        // Verify user stats were updated
        expect(updateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            'stats.totalSlides': { increment: 1 },
          })
        )
        
        expect(result).toBe('slide-123')
      })
    })

    describe('getPresentationSlides', () => {
      it('should retrieve slides ordered by position', async () => {
        const mockSlides = [
          { id: 'slide-1', order: 0, type: 'title' },
          { id: 'slide-2', order: 1, type: 'bullet' },
        ]
        
        ;(getDocs as jest.Mock).mockResolvedValue({
          docs: mockSlides.map(s => ({
            data: () => s,
          })),
        })
        
        const result = await database.getPresentationSlides('user-123', 'pres-123')
        
        expect(query).toHaveBeenCalled()
        expect(orderBy).toHaveBeenCalledWith('order', 'asc')
        expect(result).toEqual(mockSlides)
      })
    })

    describe('reorderSlides', () => {
      it('should update slide order in batch', async () => {
        const mockBatch = {
          update: jest.fn(),
          commit: jest.fn().mockResolvedValue(undefined),
        }
        ;(writeBatch as jest.Mock).mockReturnValue(mockBatch)
        
        const slideOrders = [
          { slideId: 'slide-1', newOrder: 2 },
          { slideId: 'slide-2', newOrder: 0 },
          { slideId: 'slide-3', newOrder: 1 },
        ]
        
        await database.reorderSlides('user-123', 'pres-123', slideOrders)
        
        // Verify each slide was updated
        expect(mockBatch.update).toHaveBeenCalledTimes(4) // 3 slides + 1 presentation
        
        slideOrders.forEach(({ newOrder }) => {
          expect(mockBatch.update).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
              order: newOrder,
              updatedAt: expect.anything(),
            })
          )
        })
        
        expect(mockBatch.commit).toHaveBeenCalled()
      })
    })
  })
})