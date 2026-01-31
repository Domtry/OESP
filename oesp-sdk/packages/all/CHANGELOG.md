# @oesp/all

## 7.0.0

### Major Changes

- c0eaa7c: fix package dependancy link
- c0eaa7c: fix package dependancy

### Patch Changes

- fix: Move libsodium-wrappers-sumo to peerDependencies to prevent version conflicts

  This change resolves dependency issues when installing @oesp/all in external projects:

  - Moved `libsodium-wrappers-sumo` from `dependencies` to `peerDependencies` in @oesp/crypto-sodium
  - Moved `libsodium-wrappers-sumo` from `dependencies` to `peerDependencies` in @oesp/keystore-node
  - Added `libsodium-wrappers-sumo` as `peerDependencies` in @oesp/all
  - Updated version range to `^0.7.14 || ^0.8.0` for better compatibility

  **Breaking change context:**
  This is marked as a patch because it's technically a fix for dependency resolution. Users will now need to manually install `libsodium-wrappers-sumo` in their projects, but this prevents version conflicts and reduces bundle size.

  **Migration guide:**
  If you're installing `@oesp/all` in your project, make sure to also install:

  ```bash
  npm install @oesp/all libsodium-wrappers-sumo
  ```

- Updated dependencies
- Updated dependencies [c0eaa7c]
- Updated dependencies [c0eaa7c]
  - @oesp/crypto-sodium@7.0.0
  - @oesp/keystore-node@7.0.0
  - @oesp/transport-ble-gatt@7.0.0
  - @oesp/storage-memory@7.0.0
  - @oesp/sync-http@7.0.0
  - @oesp/core@7.0.0

## 7.0.0

### Major Changes

- fix package critical dependancy

### Patch Changes

- Updated dependencies
  - @oesp/transport-ble-gatt@7.0.0
  - @oesp/storage-memory@6.1.0
  - @oesp/crypto-sodium@6.1.0
  - @oesp/keystore-node@6.1.0
  - @oesp/sync-http@6.1.0
  - @oesp/core@6.1.0

## 6.0.0

### Major Changes

- rebuild

### Patch Changes

- Updated dependencies
  - @oesp/transport-ble-gatt@6.0.0
  - @oesp/storage-memory@6.0.0
  - @oesp/crypto-sodium@6.0.0
  - @oesp/keystore-node@6.0.0
  - @oesp/sync-http@6.0.0
  - @oesp/core@6.0.0

## 5.0.0

### Major Changes

- update package.json config

### Patch Changes

- Updated dependencies
  - @oesp/transport-ble-gatt@5.0.0
  - @oesp/storage-memory@5.0.0
  - @oesp/crypto-sodium@5.0.0
  - @oesp/keystore-node@5.0.0
  - @oesp/sync-http@5.0.0
  - @oesp/core@5.0.0

## 4.0.0

### Major Changes

- fix bug

### Patch Changes

- Updated dependencies
  - @oesp/transport-ble-gatt@4.0.0
  - @oesp/storage-memory@4.0.0
  - @oesp/crypto-sodium@4.0.0
  - @oesp/keystore-node@4.0.0
  - @oesp/sync-http@4.0.0
  - @oesp/core@4.0.0

## 6.1.0

### Major Changes

- fix bug

### Patch Changes

- Updated dependencies
  - @oesp/transport-ble-gatt@6.1.0
  - @oesp/storage-memory@6.1.0
  - @oesp/crypto-sodium@6.1.0
  - @oesp/keystore-node@6.1.0
  - @oesp/sync-http@6.1.0
  - @oesp/core@6.1.0

## 2.0.0

### Major Changes

- correction des package

### Patch Changes

- Updated dependencies
  - @oesp/core@2.0.0
  - @oesp/crypto-sodium@2.0.0
  - @oesp/storage-memory@2.0.0
  - @oesp/sync-http@2.0.0
  - @oesp/transport-ble-gatt@2.0.0

## 1.0.0

### Major Changes

- first commit for package

### Patch Changes

- Updated dependencies
  - @oesp/core@1.0.0
  - @oesp/crypto-sodium@1.0.0
  - @oesp/storage-memory@1.0.0
  - @oesp/sync-http@1.0.0
  - @oesp/transport-ble-gatt@1.0.0
