export const getFirestore = jest.fn(() => ({
  app: {},
  type: 'firestore',
}))

export const collection = jest.fn((db, path) => ({
  id: path,
  path,
  parent: null,
}))

export const doc = jest.fn((collectionRef, id) => ({
  id: id || 'mock-doc-id',
  path: `${collectionRef.path}/${id || 'mock-doc-id'}`,
  parent: collectionRef,
}))

export const getDoc = jest.fn(() =>
  Promise.resolve({
    exists: jest.fn(() => true),
    data: jest.fn(() => ({
      id: 'mock-doc-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    id: 'mock-doc-id',
    ref: {},
  })
)

export const getDocs = jest.fn(() =>
  Promise.resolve({
    empty: false,
    size: 1,
    docs: [
      {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          id: 'mock-doc-1',
          createdAt: new Date(),
        })),
        id: 'mock-doc-1',
        ref: {},
      },
    ],
    forEach: jest.fn((callback) => {
      callback({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          id: 'mock-doc-1',
          createdAt: new Date(),
        })),
        id: 'mock-doc-1',
        ref: {},
      })
    }),
  })
)

export const setDoc = jest.fn(() => Promise.resolve())
export const updateDoc = jest.fn(() => Promise.resolve())
export const deleteDoc = jest.fn(() => Promise.resolve())
export const addDoc = jest.fn(() =>
  Promise.resolve({
    id: 'new-doc-id',
    path: 'collection/new-doc-id',
  })
)

export const query = jest.fn((...args) => ({
  type: 'query',
  constraints: args.slice(1),
}))

export const where = jest.fn((field, op, value) => ({
  type: 'where',
  field,
  op,
  value,
}))

export const orderBy = jest.fn((field, direction = 'asc') => ({
  type: 'orderBy',
  field,
  direction,
}))

export const limit = jest.fn((n) => ({
  type: 'limit',
  value: n,
}))

export const onSnapshot = jest.fn((ref, callback) => {
  // Immediately call the callback with mock data
  callback({
    empty: false,
    size: 1,
    docs: [
      {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          id: 'mock-doc-1',
          createdAt: new Date(),
        })),
        id: 'mock-doc-1',
        ref: {},
      },
    ],
    forEach: jest.fn(),
  })
  // Return unsubscribe function
  return jest.fn()
})

export const serverTimestamp = jest.fn(() => new Date())

export const Timestamp = {
  now: jest.fn(() => ({
    seconds: Date.now() / 1000,
    nanoseconds: 0,
    toDate: jest.fn(() => new Date()),
  })),
  fromDate: jest.fn((date) => ({
    seconds: date.getTime() / 1000,
    nanoseconds: 0,
    toDate: jest.fn(() => date),
  })),
}