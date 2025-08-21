export const getStorage = jest.fn(() => ({
  app: {},
  maxUploadRetryTime: 120000,
  maxOperationRetryTime: 120000,
}))

export const ref = jest.fn((storage, path) => ({
  bucket: 'test-bucket',
  fullPath: path,
  name: path.split('/').pop(),
  parent: null,
  root: storage,
  storage,
  toString: () => `gs://test-bucket/${path}`,
}))

export const uploadBytes = jest.fn(() =>
  Promise.resolve({
    metadata: {
      bucket: 'test-bucket',
      fullPath: 'test/path/file.jpg',
      name: 'file.jpg',
      size: 1024,
      contentType: 'image/jpeg',
      timeCreated: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    ref: {
      bucket: 'test-bucket',
      fullPath: 'test/path/file.jpg',
      name: 'file.jpg',
    },
    state: 'success',
  })
)

export const getDownloadURL = jest.fn(() =>
  Promise.resolve('https://firebasestorage.googleapis.com/test-download-url')
)

export const deleteObject = jest.fn(() => Promise.resolve())

export const listAll = jest.fn(() =>
  Promise.resolve({
    items: [
      {
        bucket: 'test-bucket',
        fullPath: 'test/file1.jpg',
        name: 'file1.jpg',
      },
      {
        bucket: 'test-bucket',
        fullPath: 'test/file2.jpg',
        name: 'file2.jpg',
      },
    ],
    prefixes: [],
  })
)