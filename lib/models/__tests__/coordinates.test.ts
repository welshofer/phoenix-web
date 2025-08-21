import { 
  Coordinates, 
  SLIDE_DIMENSIONS,
  validateCoordinates,
  scaleCoordinates,
  translateCoordinates,
  containsPoint,
  getCenter,
  getBoundingBox,
  doOverlap,
  constrainToSlide,
} from '../coordinates'

describe('Coordinates Model', () => {
  describe('SLIDE_DIMENSIONS', () => {
    it('should define standard 16:9 aspect ratio', () => {
      expect(SLIDE_DIMENSIONS.WIDTH).toBe(1920)
      expect(SLIDE_DIMENSIONS.HEIGHT).toBe(1080)
      expect(SLIDE_DIMENSIONS.WIDTH / SLIDE_DIMENSIONS.HEIGHT).toBeCloseTo(16 / 9)
    })
  })

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      const coords: Coordinates = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      }
      
      expect(validateCoordinates(coords)).toBe(true)
    })

    it('should reject negative dimensions', () => {
      const coords: Coordinates = {
        x: 100,
        y: 100,
        width: -200,
        height: 150,
      }
      
      expect(validateCoordinates(coords)).toBe(false)
    })

    it('should reject zero dimensions', () => {
      const coords: Coordinates = {
        x: 100,
        y: 100,
        width: 0,
        height: 150,
      }
      
      expect(validateCoordinates(coords)).toBe(false)
    })

    it('should allow negative positions', () => {
      const coords: Coordinates = {
        x: -50,
        y: -50,
        width: 200,
        height: 150,
      }
      
      expect(validateCoordinates(coords)).toBe(true)
    })

    it('should allow positions outside slide bounds', () => {
      const coords: Coordinates = {
        x: 2000,
        y: 1200,
        width: 100,
        height: 100,
      }
      
      expect(validateCoordinates(coords)).toBe(true)
    })
  })

  describe('scaleCoordinates', () => {
    it('should scale coordinates uniformly', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const scaled = scaleCoordinates(coords, 0.5)
      
      expect(scaled).toEqual({
        x: 50,
        y: 100,
        width: 150,
        height: 200,
      })
    })

    it('should scale with different x and y factors', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const scaled = scaleCoordinates(coords, 2, 0.5)
      
      expect(scaled).toEqual({
        x: 200,
        y: 100,
        width: 600,
        height: 200,
      })
    })

    it('should handle scale factor of 1', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const scaled = scaleCoordinates(coords, 1)
      
      expect(scaled).toEqual(coords)
    })

    it('should handle very small scale factors', () => {
      const coords: Coordinates = {
        x: 1000,
        y: 1000,
        width: 1000,
        height: 1000,
      }
      
      const scaled = scaleCoordinates(coords, 0.001)
      
      expect(scaled).toEqual({
        x: 1,
        y: 1,
        width: 1,
        height: 1,
      })
    })
  })

  describe('translateCoordinates', () => {
    it('should translate coordinates by offset', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const translated = translateCoordinates(coords, 50, -50)
      
      expect(translated).toEqual({
        x: 150,
        y: 150,
        width: 300,
        height: 400,
      })
    })

    it('should handle zero translation', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const translated = translateCoordinates(coords, 0, 0)
      
      expect(translated).toEqual(coords)
    })

    it('should allow translation to negative positions', () => {
      const coords: Coordinates = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }
      
      const translated = translateCoordinates(coords, -200, -300)
      
      expect(translated).toEqual({
        x: -100,
        y: -100,
        width: 300,
        height: 400,
      })
    })
  })

  describe('containsPoint', () => {
    const coords: Coordinates = {
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    }

    it('should return true for point inside rectangle', () => {
      expect(containsPoint(coords, 150, 150)).toBe(true)
      expect(containsPoint(coords, 200, 200)).toBe(true)
    })

    it('should return false for point outside rectangle', () => {
      expect(containsPoint(coords, 50, 50)).toBe(false)
      expect(containsPoint(coords, 350, 350)).toBe(false)
    })

    it('should handle points on edges', () => {
      expect(containsPoint(coords, 100, 100)).toBe(true) // Top-left
      expect(containsPoint(coords, 300, 100)).toBe(true) // Top-right
      expect(containsPoint(coords, 100, 250)).toBe(true) // Bottom-left
      expect(containsPoint(coords, 300, 250)).toBe(true) // Bottom-right
    })

    it('should handle points just outside edges', () => {
      expect(containsPoint(coords, 99, 150)).toBe(false)
      expect(containsPoint(coords, 301, 150)).toBe(false)
      expect(containsPoint(coords, 150, 99)).toBe(false)
      expect(containsPoint(coords, 150, 251)).toBe(false)
    })
  })

  describe('getCenter', () => {
    it('should calculate center of rectangle', () => {
      const coords: Coordinates = {
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      }
      
      const center = getCenter(coords)
      
      expect(center).toEqual({ x: 200, y: 175 })
    })

    it('should handle rectangles at origin', () => {
      const coords: Coordinates = {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }
      
      const center = getCenter(coords)
      
      expect(center).toEqual({ x: 50, y: 50 })
    })

    it('should handle rectangles with negative positions', () => {
      const coords: Coordinates = {
        x: -100,
        y: -100,
        width: 200,
        height: 200,
      }
      
      const center = getCenter(coords)
      
      expect(center).toEqual({ x: 0, y: 0 })
    })
  })

  describe('getBoundingBox', () => {
    it('should calculate bounding box for multiple rectangles', () => {
      const rectangles: Coordinates[] = [
        { x: 100, y: 100, width: 100, height: 100 },
        { x: 300, y: 200, width: 100, height: 100 },
        { x: 150, y: 50, width: 50, height: 50 },
      ]
      
      const bbox = getBoundingBox(rectangles)
      
      expect(bbox).toEqual({
        x: 100,
        y: 50,
        width: 300,
        height: 250,
      })
    })

    it('should handle single rectangle', () => {
      const rectangles: Coordinates[] = [
        { x: 100, y: 100, width: 200, height: 150 },
      ]
      
      const bbox = getBoundingBox(rectangles)
      
      expect(bbox).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
      })
    })

    it('should handle empty array', () => {
      const rectangles: Coordinates[] = []
      
      const bbox = getBoundingBox(rectangles)
      
      expect(bbox).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      })
    })

    it('should handle overlapping rectangles', () => {
      const rectangles: Coordinates[] = [
        { x: 100, y: 100, width: 200, height: 200 },
        { x: 150, y: 150, width: 200, height: 200 },
      ]
      
      const bbox = getBoundingBox(rectangles)
      
      expect(bbox).toEqual({
        x: 100,
        y: 100,
        width: 250,
        height: 250,
      })
    })
  })

  describe('doOverlap', () => {
    it('should detect overlapping rectangles', () => {
      const rect1: Coordinates = { x: 100, y: 100, width: 200, height: 200 }
      const rect2: Coordinates = { x: 200, y: 200, width: 200, height: 200 }
      
      expect(doOverlap(rect1, rect2)).toBe(true)
    })

    it('should detect non-overlapping rectangles', () => {
      const rect1: Coordinates = { x: 100, y: 100, width: 100, height: 100 }
      const rect2: Coordinates = { x: 300, y: 300, width: 100, height: 100 }
      
      expect(doOverlap(rect1, rect2)).toBe(false)
    })

    it('should handle adjacent rectangles', () => {
      const rect1: Coordinates = { x: 100, y: 100, width: 100, height: 100 }
      const rect2: Coordinates = { x: 200, y: 100, width: 100, height: 100 }
      
      expect(doOverlap(rect1, rect2)).toBe(false)
    })

    it('should handle contained rectangles', () => {
      const rect1: Coordinates = { x: 100, y: 100, width: 400, height: 400 }
      const rect2: Coordinates = { x: 200, y: 200, width: 100, height: 100 }
      
      expect(doOverlap(rect1, rect2)).toBe(true)
    })

    it('should handle identical rectangles', () => {
      const rect1: Coordinates = { x: 100, y: 100, width: 200, height: 200 }
      const rect2: Coordinates = { x: 100, y: 100, width: 200, height: 200 }
      
      expect(doOverlap(rect1, rect2)).toBe(true)
    })
  })

  describe('constrainToSlide', () => {
    it('should constrain rectangle within slide bounds', () => {
      const coords: Coordinates = {
        x: 1850,
        y: 1000,
        width: 200,
        height: 200,
      }
      
      const constrained = constrainToSlide(coords)
      
      expect(constrained).toEqual({
        x: 1720, // 1920 - 200
        y: 880,  // 1080 - 200
        width: 200,
        height: 200,
      })
    })

    it('should handle negative positions', () => {
      const coords: Coordinates = {
        x: -50,
        y: -100,
        width: 200,
        height: 200,
      }
      
      const constrained = constrainToSlide(coords)
      
      expect(constrained).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      })
    })

    it('should resize if object is larger than slide', () => {
      const coords: Coordinates = {
        x: 100,
        y: 100,
        width: 2000,
        height: 1200,
      }
      
      const constrained = constrainToSlide(coords)
      
      expect(constrained.width).toBeLessThanOrEqual(SLIDE_DIMENSIONS.WIDTH)
      expect(constrained.height).toBeLessThanOrEqual(SLIDE_DIMENSIONS.HEIGHT)
      expect(constrained.x).toBeGreaterThanOrEqual(0)
      expect(constrained.y).toBeGreaterThanOrEqual(0)
    })

    it('should not modify objects already within bounds', () => {
      const coords: Coordinates = {
        x: 500,
        y: 300,
        width: 400,
        height: 300,
      }
      
      const constrained = constrainToSlide(coords)
      
      expect(constrained).toEqual(coords)
    })

    it('should handle edge cases at slide boundaries', () => {
      const coords: Coordinates = {
        x: 0,
        y: 0,
        width: SLIDE_DIMENSIONS.WIDTH,
        height: SLIDE_DIMENSIONS.HEIGHT,
      }
      
      const constrained = constrainToSlide(coords)
      
      expect(constrained).toEqual(coords)
    })
  })
})