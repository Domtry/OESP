module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^react-native-libsodium$': '<rootDir>/tests/mocks/react-native-libsodium.ts'
  }
}

