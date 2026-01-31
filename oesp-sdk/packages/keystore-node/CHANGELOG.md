# @oesp/keystore-node

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

- Updated dependencies [c0eaa7c]
- Updated dependencies [c0eaa7c]
  - @oesp/core@7.0.0

## 6.1.0

### Major Changes

- fix package critical dependancy

### Patch Changes

- Updated dependencies
  - @oesp/core@6.1.0

## 6.0.0

### Major Changes

- rebuild

### Patch Changes

- Updated dependencies
  - @oesp/core@6.0.0

## 5.0.0

### Major Changes

- update package.json config

### Patch Changes

- Updated dependencies
  - @oesp/core@5.0.0

## 4.0.0

### Major Changes

- fix bug

### Patch Changes

- Updated dependencies
  - @oesp/core@4.0.0

## 6.1.0

### Major Changes

- fix bug

### Patch Changes

- Updated dependencies
  - @oesp/core@6.1.0

## 2.0.0

### Major Changes

- correction des package

### Patch Changes

- Updated dependencies
  - @oesp/core@2.0.0

## 1.0.0

### Major Changes

- first commit for package

### Patch Changes

- Updated dependencies
  - @oesp/core@1.0.0
