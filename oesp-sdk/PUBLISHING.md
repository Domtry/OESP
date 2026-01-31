# Guide de Publication - OESP TypeScript SDK

Ce guide explique comment publier correctement les packages `@oesp/*` sur npm en utilisant **Changesets**.

---

## 🔧 Prérequis

1. **Authentification npm** :
```bash
npm login
# Vérifier que vous êtes bien connecté
npm whoami
```

2. **Droits de publication** :
Assurez-vous d'avoir les droits de publication sur l'organisation `@oesp`.

3. **Changesets installé** :
```bash
cd oesp-sdk
pnpm install  # Déjà installé via devDependencies
```

---

## 📝 Workflow de Publication

### Étape 1 : Créer un Changeset

Après avoir fait des modifications, créez un changeset pour documenter les changements :

```bash
cd oesp-sdk
pnpm changeset
```

Vous serez invité à :
1. **Sélectionner les packages modifiés** (Space pour sélectionner, Enter pour valider)
2. **Choisir le type de version** :
   - `major` : Breaking changes (incompatibilité rétroactive)
   - `minor` : Nouvelles fonctionnalités (rétrocompatible)
   - `patch` : Corrections de bugs
3. **Écrire un résumé des changements**

Cela créera un fichier dans `.changeset/` avec un nom aléatoire.

### Étape 2 : Appliquer les Versions

Quand vous êtes prêt à publier, exécutez :

```bash
pnpm version-packages
```

**Ce que fait cette commande :**
- ✅ Met à jour les versions dans tous les `package.json`
- ✅ **Remplace automatiquement `workspace:*` par les vraies versions** (ex: `^6.1.0`)
- ✅ Génère les CHANGELOG.md
- ✅ Supprime les fichiers de changeset consommés
- ✅ Met à jour les dépendances internes

### Étape 3 : Vérifier les Changements

```bash
# Vérifier les versions mises à jour
git diff

# Vérifier que workspace:* a bien été remplacé
grep -r "workspace:" packages/*/package.json
# Si cette commande retourne des résultats, c'est un problème !
```

### Étape 4 : Builder les Packages

```bash
pnpm build
```

Cela compile tous les packages dans leurs dossiers `dist/`.

### Étape 5 : Publier sur npm

```bash
pnpm release
```

**Ce que fait cette commande :**
- ✅ Rebuild tous les packages (`pnpm -r --sort build`)
- ✅ Publie tous les nouveaux packages sur npm (`pnpm changeset publish`)

**Alternative manuelle :**
```bash
pnpm -r --sort build
pnpm changeset publish
```

### Étape 6 : Commit et Push

```bash
git add .
git commit -m "chore: release packages"
git push
git push --tags  # Publier les tags de version
```

---

## 🚨 Problèmes Courants et Solutions

### ❌ Erreur : `workspace:*` présent dans les packages publiés

**Cause :** `pnpm version-packages` n'a pas été exécuté avant `pnpm changeset publish`.

**Solution :**
```bash
# 1. Annuler la publication (si possible)
npm unpublish @oesp/all@<version> --force

# 2. Corriger localement
pnpm version-packages

# 3. Republier
pnpm build
pnpm changeset publish
```

### ❌ Erreur : `libsodium-wrappers-sumo` non trouvé

**Cause :** L'utilisateur n'a pas installé la peerDependency.

**Solution (pour les utilisateurs finaux) :**
```bash
npm install @oesp/all libsodium-wrappers-sumo
# ou
pnpm add @oesp/all libsodium-wrappers-sumo
```

**Documentation à ajouter au README :**
```markdown
## Installation

npm install @oesp/all libsodium-wrappers-sumo

Note: `libsodium-wrappers-sumo` is a peer dependency required for cryptographic operations.
```

### ❌ Erreur : Version conflicts

**Cause :** Versions incohérentes entre les packages.

**Solution :**
```bash
# Nettoyer et réinstaller
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### ❌ Erreur : Authentication required

**Cause :** Pas connecté à npm ou pas de droits.

**Solution :**
```bash
npm login
npm whoami
# Contacter l'admin de l'organisation @oesp si nécessaire
```

---

## 🔍 Vérifications Avant Publication

### Checklist

- [ ] Tous les tests passent : `pnpm test`
- [ ] Le build fonctionne : `pnpm build`
- [ ] Les changesets sont créés : `ls .changeset/*.md`
- [ ] Versions mises à jour : `pnpm version-packages`
- [ ] Aucun `workspace:*` : `grep -r "workspace:" packages/*/package.json` (doit être vide)
- [ ] Git est propre ou prêt à commit
- [ ] Authentifié npm : `npm whoami`

---

## 📦 Structure de Publication

Quand `pnpm changeset publish` est exécuté, voici ce qui est publié pour chaque package :

```
@oesp/all@6.2.0/
├── dist/
│   ├── index.js        # ESM
│   ├── index.cjs       # CommonJS
│   └── index.d.ts      # Types TypeScript
├── package.json        # Avec vraies versions (pas workspace:*)
└── README.md
```

**Ce qui n'est PAS publié :**
- `src/` (code source)
- `node_modules/`
- `tsconfig.json`
- Fichiers de dev

---

## 🎯 Workflow Complet (Exemple)

```bash
# 1. Développer une fonctionnalité
# ... faire vos modifications ...

# 2. Créer un changeset
cd oesp-sdk
pnpm changeset
# Sélectionner "@oesp/core" et "@oesp/all"
# Choisir "minor"
# Écrire: "feat: add new DID format validation"

# 3. Commit le changeset
git add .changeset/
git commit -m "feat: add DID format validation"
git push

# 4. Quand prêt à publier (ex: sur main)
pnpm version-packages
# Vérifier les changements
git diff

# 5. Commit les versions
git add .
git commit -m "chore: version packages"

# 6. Builder et publier
pnpm build
pnpm release

# 7. Push les tags
git push
git push --tags
```

---

## 🔄 Workflow CI/CD (Recommandé)

Pour automatiser, créez un workflow GitHub Actions :

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📚 Ressources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Semantic Versioning](https://semver.org/)

---

## 🆘 Support

En cas de problème lors de la publication :

1. Vérifier les logs d'erreur
2. Consulter ce guide
3. Vérifier la configuration dans `.changeset/config.json`
4. Demander de l'aide sur le canal de développement

---

**Dernière mise à jour :** 31 janvier 2026
