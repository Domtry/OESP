# Guide de Contribution OESP

Merci de votre intérêt pour OESP (Offline Exchange Secure Protocol) ! Nous accueillons avec plaisir les contributions de la communauté pour améliorer ce protocole de communication sécurisé.

Ce document fournit des instructions pour contribuer au projet.

## Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer ?](#comment-contribuer-)
  - [Signaler des Bogues](#signaler-des-bogues)
  - [Proposer des Fonctionnalités](#proposer-des-fonctionnalités)
  - [Soumettre des Pull Requests (PR)](#soumettre-des-pull-requests-pr)
- [Configuration du Développement](#configuration-du-développement)
  - [SDK TypeScript (`oesp-ts`)](#sdk-typescript-oesp-ts)
  - [SDK Python (`oesp_sdk_python`)](#sdk-python-oesp_sdk_python)
  - [Serveur de Synchronisation (`oesp_sync_server`)](#serveur-de-synchronisation-oesp_sync_server)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Messages de Commit](#messages-de-commit)

## Code de Conduite

En participant à ce projet, vous vous engagez à maintenir un environnement respectueux et inclusif pour tous. Soyez courtois, professionnel et constructif dans vos échanges.

## Comment Contribuer ?

### Signaler des Bogues

Si vous trouvez un bogue, veuillez ouvrir une **Issue** sur GitHub en fournissant :
- Une description claire du problème.
- Les étapes pour reproduire le bogue.
- Le comportement attendu vs le comportement observé.
- Votre environnement (OS, version de Python/Node.js).

### Proposer des Fonctionnalités

Les suggestions d'amélioration sont les bienvenues. Ouvrez une **Issue** pour discuter de votre idée avant de commencer l'implémentation.

### Soumettre des Pull Requests (PR)

1. Forkez le repository.
2. Créez une branche pour votre fonctionnalité ou correction (`git checkout -b feat/ma-fonctionnalite`).
3. Effectuez vos changements.
4. Assurez-vous que les tests passent.
5. Commitez vos changements selon les conventions (voir [Messages de Commit](#messages-de-commit)).
6. Poussez votre branche et ouvrez une Pull Request.

## Configuration du Développement

Le projet est un monorepo contenant plusieurs sous-projets.

### SDK TypeScript (`oesp-ts`)

Le SDK TypeScript utilise des workspaces npm.

```bash
cd oesp-ts
npm install
npm run build
npm test
```

### SDK Python (`oesp_sdk_python`)

Le SDK Python peut être configuré avec `uv` (recommandé) ou `pip`.

```bash
cd oesp_sdk_python
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

### Serveur de Synchronisation (`oesp_sync_server`)

Le serveur de synchronisation utilise FastAPI et Docker.

```bash
cd oesp_sync_server
docker-compose up --build
```

## Standards de Code

- **TypeScript** : Nous utilisons Prettier pour le formatage et ESLint pour le linting. Assurez-vous de lancer `npm run lint` avant de soumettre.
- **Python** : Nous suivons la PEP 8. Utilisez `black` pour le formatage et `isort` pour l'organisation des imports.
- **Documentation** : Mettez à jour les fichiers README correspondants si vous modifiez des APIs publiques.

## Tests

Chaque modification doit être accompagnée de tests unitaires ou d'intégration.
- Pour TypeScript : `npm test`
- Pour Python : `pytest`

## Messages de Commit

Nous encourageons l'utilisation de [Conventional Commits](https://www.conventionalcommits.org/) :
- `feat:` : Nouvelle fonctionnalité.
- `fix:` : Correction de bogue.
- `docs:` : Changements dans la documentation.
- `style:` : Formatage, point-virgule manquant, etc. (pas de changement de code).
- `refactor:` : Refactorisation du code.
- `test:` : Ajout ou modification de tests.
- `chore:` : Tâches de maintenance.

---

Merci encore pour vos contributions ! Ensemble, nous rendons les échanges offline plus sûrs.
