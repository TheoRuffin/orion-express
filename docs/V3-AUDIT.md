# Audit historique — périmètre de la version 3.0.0 — 16 novembre 2026

## Dépôt et non-régression

Base auditée : `f731611258cff018ecaaa830318a163138a4582c` (2.0.1), récupérée avec `git pull --ff-only`. Aucun autre projet modifié.

- Stockage : `src/core.js`, `Products`, transactions `products` dans `orion-express-db`. Le fichier reste inchangé en V3. Les règles V1, photos, ventes et sauvegardes V2 sont conservées.
- Photos : Blob/File, data URL et enveloppes usuelles, via `photoURL`. Conversion pour partage en File sans recompression ; vérification des octets et du CRC du ZIP dans les tests.
- Build : concaténation déterministe, sans chargement de code réseau ; ajout de deux modules à la même application. Identité Violentmonkey, origine de stockage, permissions et URL de mise à jour inchangées.
- Préparation : base locale séparée `orion-express-preparations`, un snapshot actif, aucun changement au schéma des produits. Une préparation n’est ni une vente ni une sauvegarde du catalogue. Les exports V2 restent nécessaires.
- Risques : copie des photos dans le workspace consomme du quota ; limite 40 Mo avant création. Quota insuffisant ou image non réutilisable bloque la nouvelle préparation sans toucher aux produits. Une ancienne préparation n’est remplacée qu’après confirmation. Les modifications ultérieures du produit ne mettent pas à jour le snapshot : préparer de nouveau pour les reprendre.

## Sources officielles et décision

[Conditions Vinted Espagne](https://www.vinted.es/terms-and-conditions), consultées le 16 novembre 2026, version annoncée applicable à partir du 5 octobre 2026. Elles limitent l’usage des logiciels tiers à ce que Vinted autorise et encadrent l’usage professionnel. Aucune autorisation de notre outil n’a été obtenue.

En conséquence, pas d’injection sur Vinted, pas de remplissage automatique ou d’événements artificiels, pas de transfert FileList, pas d’API privée ni de bouton de publication contrôlé. Cela évite aussi de prétendre qu’un outil tiers serait autorisé simplement parce qu’il ne publie pas. La V3 livre la solution de repli locale : copier, partager/enregistrer les photos, puis utiliser manuellement le site natif. Ce choix ne garantit pas l’éligibilité d’un compte ou d’une activité commerciale.

Références techniques : [sélecteurs de fichiers](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file), [partage natif](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). La permission de sélectionner un fichier et les cibles du partage restent contrôlées par le navigateur et l’utilisateur. Aucune donnée privée dans une URL ou un serveur de transfert.

## Observation réelle, distincte des tests

Le lien `https://www.vinted.es/items/new` a d’abord redirigé vers la connexion. Après connexion effectuée par l’utilisateur dans Chrome, le formulaire réel a été observé sur **vinted.es**, avec interface en français. L’observation desktop ne valide pas Orion iOS.

| Élément | Observation réelle | Comportement livré |
|---|---|---|
| Photos | input file avec `multiple=true` | partage groupé, ZIP et fichiers individuels, puis sélection manuelle |
| Titre | input texte, id `title` | copie puis collage manuel |
| Description | textarea, id `description` | copie puis collage manuel |
| Prix | input texte, id `price` | valeur à virgule disponible, collage et contrôle manuels |
| Catégorie | bouton/popover `category`, recherche `catalog-search-input`, résultats hiérarchiques | recherche et sélection manuelles, aucun identifiant de catégorie imposé |
| Jeux de société | recherche réelle trouvée ; sélection fait apparaître marque, état et envoi | coches dépendantes remises à zéro lors d’un changement déclaré |
| Marque / état | popovers `brand` / `condition` | sélection manuelle |
| Colis | choix Petit, Moyen, Grand, radios dans `package_size` | sélection manuelle |
| Publication | boutons natifs de brouillon et d’ajout visibles | jamais actionnés par l’assistant |

Aucun titre, prix, description ou photographie n’a été envoyé dans le formulaire réel pendant l’audit. Aucune publication ni sauvegarde de brouillon. Les mécanismes internes de validation, les événements acceptés et l’envoi réel des fichiers n’ont pas été testés ; aucun sélecteur observé n’est utilisé par le code de production. Les tests contrôlés incluent un champ supplémentaire illustratif : ce n’est pas une reproduction exacte de tous les champs actuellement proposés par Vinted.

## Actions et statuts

**Trois actions pour ouvrir le formulaire depuis le catalogue** : choisir la fiche, Préparer sur Vinted, Ouvrir le vrai formulaire. Cela ne remplit pas l’annonce. Il faut ensuite partager/enregistrer les photos, les choisir dans Vinted, copier/coller les textes et sélectionner les valeurs des menus.

Il n’existe pas de nombre total fixe honnête : au minimum un aller-retour copier/coller par champ texte, les dialogues iOS pour les images, puis les recherches et choix natifs. L’objectif d’une annonce entièrement préparée en trois actions n’est pas atteint.

- VALIDÉ par tests : préparation, fichiers groupés, archive standard avec CRC, persistance/reprise, invalidation des contrôles dépendants, non-régression V1/V2, absence de soumission automatique, build et métadonnées.
- VALIDÉ par observation réelle : accès au formulaire desktop Espagne connecté et comportement de la catégorie Jeux de société.
- PARTIEL : transfert texte et images via les actions manuelles de l’utilisateur. Pas de validation d’un parcours complet sur le site réel.
- NON VALIDÉ : partage multiple iOS 18/Orion, sélection multiple depuis Fichiers, presse-papiers et parcours V3 complet sur l’iPhone réel. V2 a été confirmée sur cet appareil par l’utilisateur ; cela ne valide pas V3.
- NON DISPONIBLE dans cette livraison : remplissage direct, envoi automatique des photos et intégration officiellement autorisée. Pas d’affirmation d’impossibilité technique universelle.

## Résultats de la suite locale

34 tests réussis : 22 tests de logique/stockage/archive et 12 parcours mobiles (6 WebKit, 6 Chromium). La suite V2 est conservée. Le ZIP est ouvert avec la bibliothèque standard Python et ses CRC sont contrôlés. Les scénarios de formulaire contrôlé effectuent eux-mêmes les collages et choix manuels ; le code produit ne les automatise pas. Le partage annulé est simulé, pas exercé sur une feuille de partage iOS réelle.
