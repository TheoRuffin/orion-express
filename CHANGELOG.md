# Historique

## 2.0.1 — 16 novembre 2026

- Profil de test mobile dans un chemin ASCII pour permettre le lancement de WebKit GTK en CI Linux.
- Nettoyage du profil dans un bloc finally. Aucun changement du schéma de données.
- Version incrémentée et métadonnées régénérées pour le canal de mise à jour.

## 2.0.0 — 16 novembre 2026

- Première livraison V2 : catalogue local, fiches multiples et aperçu en français.
- Création, édition, duplication, suppression confirmée, recherche et copie rapide.
- Photos multiples conservées lors d’une édition texte, remplacement individuel et téléchargement manuel.
- Stock initial, stock restant et historique des ventes avec transactions atomiques.
- Migration V1 sans réécriture à l’ouverture ; original conservé au premier enregistrement.
- Export avec photos, vérification SHA-256 et import atomique sous de nouveaux identifiants.
- Gestion des quotas, édition concurrente et erreurs de schéma.
- Build reproductible, métadonnées de mise à jour GitHub et CI.
- Tests unitaires et parcours mobiles WebKit/Chromium ; aucun test Orion iPhone réel.
