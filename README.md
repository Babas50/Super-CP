# Super CP

Appli d'apprentissage niveau CP (lecture, maths, découverte, anglais). PWA en HTML/JS, installable sur PC, Mac, iPhone, Android. Aucune donnée envoyée.

## Workflow
1. Une branche par changement : `git switch -c feature/ce-que-je-change`.
2. Commits courts, puis Pull Request vers `main`.
3. À chaque version : changer le nom du cache dans `sw.js` (`super-cp-vN`), sinon les anciens appareils gardent l'ancienne version.
4. Après fusion dans `main`, GitHub Pages republie le site (HTTPS, nécessaire pour l'installation).

Activation unique : Settings > Pages > Source : GitHub Actions.
