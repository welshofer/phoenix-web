export const initializeApp = jest.fn(() => ({
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
}))

export const getApps = jest.fn(() => [])

export const getApp = jest.fn(() => ({
  name: '[DEFAULT]',
  options: {},
  automaticDataCollectionEnabled: false,
}))