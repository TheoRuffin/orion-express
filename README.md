# Orion Express V2

Gestion locale de fiches produits dans **Orion sur iPhone**, distribuée sous forme de userscript Violentmonkey. Version **2.0.1**, interface française, sans serveur applicatif, sans compte supplémentaire et sans dépendance distante au lancement.

[Installer le userscript](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js) · [Code source](https://github.com/TheoRuffin/orion-express) · [Versions](https://github.com/TheoRuffin/orion-express/releases)

## Installation unique sur iPhone

1. Dans le même profil Orion qui contient vos fiches V1, ouvrez Violentmonkey. **Désactivez V1 sans le supprimer**, pour empêcher deux scripts d’écrire simultanément. Ne videz ni les données du site ni le profil. Si V1 propose déjà un export, enregistrez-le aussi avant cette étape.
2. Ouvrez le [lien d’installation](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js) dans Orion et choisissez **Installer** dans l’écran Violentmonkey. Si Orion affiche le code ou télécharge le fichier, ouvrez le tableau de bord Violentmonkey, utilisez **Installer depuis une URL** (le libellé peut varier) et collez cette même URL. Autorisez l’extension à fonctionner sur `https://example.com` si Orion le demande.
3. Ouvrez **https://example.com/** dans un onglet normal, puis rechargez. L’atelier Orion Express doit apparaître. Gardez cette adresse en favori : `http://example.com`, `www.example.com` et un autre profil ont un stockage différent.
4. **Avant la première modification**, appuyez sur **Exporter la sauvegarde**, puis enregistrez le fichier dans **Fichiers**. Un lien permet de retélécharger le fichier ; un bouton de partage est proposé si le navigateur le permet. Le message « exportée » ne confirme pas que vous l’avez effectivement enregistré dans Fichiers : vérifiez sa présence.
5. Ouvrez une fiche V1 et vérifiez ses photos. Pour démarrer un catalogue vide, utilisez **Créer « Jeu de cartes » à 10 €**. Ajustez ensuite l’état, le colis et le stock réel.

Cette procédure est préparée pour Violentmonkey BETA 2.29.1. **Aucun test sur un vrai iPhone ou sur Orion iOS n’a été effectué ici.** Les tests d’interface utilisent WebKit et Chromium avec un écran iPhone simulé, sans l’extension Violentmonkey. Les autorisations de l’extension et le téléchargement iOS restent à vérifier sur l’appareil.

## Fonctions opérationnelles

- Plusieurs produits : créer, modifier, dupliquer, rechercher et supprimer avec confirmation.
- Titre, description, prix, catégorie, marque, état, format du colis ; aperçu et copie de l’annonce, du titre ou de la description. Copie manuelle proposée si l’API presse-papiers refuse l’accès.
- Plusieurs photos, ajout, retrait et **remplacement individuel**. Modifier du texte conserve les photos. Une duplication copie les photos, reprend le stock initial et réinitialise l’historique des ventes.
- Stock initial, stock restant calculé et historique horodaté des ventes (quantité et prix unitaire). Les transactions empêchent les surventes concurrentes. Le stock initial ne peut pas devenir inférieur aux ventes enregistrées. Pas d’annulation de vente dans cette version.
- Export JSON avec photos incorporées, SHA-256 et relecture avant téléchargement ; import avec contrôle d’intégrité, aperçu des quantités et confirmation. L’import crée de nouvelles fiches, avec de nouveaux identifiants : **aucun écrasement**, des doublons sont possibles. L’import est atomique, y compris en cas de quota insuffisant.
- Interface tactile, saisie à 16 px, mise en page iPhone, bouton de réduction, historique et messages d’erreur français.
- Liens pour enregistrer les photos et les joindre manuellement à une annonce. Le comportement « télécharger/enregistrer une photo » dépend du navigateur iOS.

## Données V1 et migration

Base **`orion-express-db`**, magasin **`products`**, origine **`https://example.com`**. Aucun changement de version IndexedDB et aucune suppression de magasin. Le magasin est créé uniquement pour une base absente. Les clés `id` numériques ou textuelles sont prises en charge, y compris dans un magasin à clés externes si les clés correspondent au champ `id`. Un schéma inconnu est refusé sans réécriture.

Les fiches V1 sont adaptées **en mémoire** : stock initial de 1 par défaut et historique vide. À leur première modification explicite, les nouveaux champs V2 sont ajoutés et l’objet original est conservé dans `legacyV1`. Les champs inconnus sont conservés. `legacyV1` est inclus dans l’export ; il n’existe pas de bouton de retour V1. Une suppression explicite de fiche supprime aussi son original : exportez avant suppression.

Le code source V1 réel n’était pas fourni. La compatibilité a été testée avec des fiches de référence correspondant au schéma annoncé. Photos prises en charge : `Blob`, `File`, chaîne `data:image/...;base64,...` et enveloppes courantes (`dataUrl`, `dataURL`, `blob`, `data`, `url`, `src`). Un format inconnu reste stocké et son aperçu signale le problème. Les URL distantes et `blob:` ne sont jamais téléchargées automatiquement ; elles ne constituent pas une photo incorporée durable. Dans ce cas, conservez vos originaux et adaptez le format avant de compter sur la sauvegarde pour récupérer les images. HEIC/HEIF reste conservé, mais l’affichage dépend du navigateur.

L’application n’enregistre aucune fiche au simple chargement. Une erreur de lecture ou de migration ne supprime pas les données existantes. Si un autre onglet modifie une fiche ouverte dans l’éditeur, l’enregistrement est refusé : copiez votre texte, retournez au catalogue et rouvrez la fiche.

### Vérifier une restauration

1. Exportez et conservez le fichier hors du navigateur, idéalement dans deux emplacements.
2. Choisissez **Restaurer une sauvegarde** et sélectionnez ce fichier. Vérifiez le nombre de fiches et de photos annoncé.
3. Confirmez : les fiches restaurées sont ajoutées à côté des originales. Comparez les textes, photos et ventes d’au moins une fiche. Supprimez ensuite seulement les copies de vérification souhaitées.
4. Sur un autre appareil/profil/origine, importez explicitement ce fichier : IndexedDB ne traverse pas ces frontières.

Le format d’export V2 est documenté dans `src/core.js`. Un export V1 arbitraire n’est pas importé sans validation ; la migration V1 proposée lit la base existante sur la même origine. SHA-256 détecte une altération accidentelle ; il ne chiffre ni n’authentifie la sauvegarde. Elle contient vos fiches et photos privées : ne la publiez pas sur GitHub.

## Limites de stockage et disponibilité

Une nouvelle image est limitée à **15 Mo** ; une sauvegarde à **100 Mo**. Pas de compression ni réduction silencieuse de qualité. Le format base64 augmente la taille des sauvegardes. L’export et l’import chargent le fichier en mémoire : une grande sauvegarde peut dépasser la mémoire disponible sur un iPhone. Les quotas et l’éviction du stockage dépendent du navigateur. Les erreurs de quota annulent les écritures concernées.

**Le stockage du navigateur n’est pas une sauvegarde.** Effacer les données, changer de profil, la navigation privée, désinstaller l’extension ou une éviction du navigateur peut rendre les données inaccessibles. Exportez après chaque session importante.

Le userscript s’exécute localement une fois injecté, sans requête réseau applicative. Le chargement initial de la page example.com et l’installation/les mises à jour demandent un accès au réseau. Cette version n’est pas une PWA installable avec un lancement hors connexion garanti. Le stockage est celui de l’origine example.com, accessible aux scripts autorisés de cette origine : ce n’est pas un coffre chiffré.

## Mises à jour

Identité stable : `@name Orion Express`, `@namespace https://github.com/TheoRuffin/orion-express`. Ne changez pas ces valeurs pour publier une mise à jour.

- `@updateURL` : [orion-express.meta.js](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.meta.js).
- `@downloadURL` : [orion-express.user.js](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js).
- La vérification automatique doit être activée dans Violentmonkey. Une mise à jour n’est pas immédiate : elle dépend de l’intervalle configuré, du cache GitHub et de la possibilité pour Orion iOS de réveiller l’extension. **Aucun délai fixe n’est garanti.** Ouvrez Orion/Violentmonkey et lancez une vérification manuelle si nécessaire, puis rechargez example.com.
- Chaque livraison augmente la version de `package.json`, exécute le build et publie ensemble le script et ses métadonnées. Les mises à jour ne vident jamais IndexedDB. Exportez avant d’installer une nouvelle version.
- Aucun `@require`, `eval`, code téléchargé à l’exécution ou service payant. Le script complet est versionné dans Git. Pour un audit, consultez les tags et l’historique des commits.

Les URL et leurs octets sont vérifiés après publication. Cela vérifie la disponibilité du canal GitHub, pas le comportement du planificateur Violentmonkey sur un iPhone.

## Vinted

Orion Express prépare des annonces : textes copiables, aperçu et photos à joindre manuellement. Il ne se connecte pas à Vinted et n’y injecte aucun script. Pas de robot de publication, de contournement, de clic automatisé ni d’évitement de détection. La préparation d’une fiche ne valide pas l’éligibilité de la vente ou du compte particulier pour du stock commercial. Aucune intégration future ne sera activée sans méthode autorisée ; aucune API Vinted autorisée n’a été identifiée ou utilisée pour cette livraison.

## Développement et tests

Node.js 22+, puis :

```sh
npm ci --ignore-scripts
npx playwright install chromium webkit
npm run check
```

Le runtime du userscript n’a aucune dépendance npm. Les deux dépendances verrouillées sont exclusivement destinées aux tests. Le build concatène les sources dans une IIFE et génère des métadonnées stables, sans horodatage. `npm test` vérifie aussi la syntaxe du script et le build identique octet pour octet.

Les tests couvrent CRUD, réouverture IndexedDB, photos, migration V1, export/import, intégrité, quotas simulés, import atomique, stock concurrent, édition obsolète, métadonnées et reproductibilité. Les tests mobiles exécutent les parcours complets sur WebKit et Chromium avec un profil temporaire **sur disque**, pour prendre en charge les Blob IndexedDB ; le profil éphémère WebKit de cet environnement refuse ces écritures. Les profils sont supprimés après les tests. Tous les produits et photos des tests sont synthétiques.

La CI exécute la même suite à chaque push et vérifie que les fichiers générés correspondent aux sources. Elle ne remplace pas les essais sur Orion iPhone. Le stockage plein réel, les limites mémoire de l’appareil, le partage iOS, les autorisations d’extension et les mises à jour automatiques sur l’appareil ne sont pas validés par cette suite.

Documentation de référence : [métadonnées Violentmonkey](https://violentmonkey.github.io/api/metadata-block/) et [transactions et stockage IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB). La documentation Violentmonkey actuelle peut décrire des fonctionnalités plus récentes que la BETA 2.29.1 ; le script utilise les métadonnées classiques et les API Web, sans API GM récente.
