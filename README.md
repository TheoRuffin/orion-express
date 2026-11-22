# Orion Express V3.2.7

Gestion locale de fiches produits dans **Orion sur iPhone**, distribuée sous forme de userscript Violentmonkey. Version **3.2.7**, espagnol par défaut avec sélecteur français, sans serveur applicatif, sans compte supplémentaire et sans dépendance distante au lancement.

[Installer le userscript](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js) · [Code source](https://github.com/TheoRuffin/orion-express) · [Versions](https://github.com/TheoRuffin/orion-express/releases)

## 3.2.7 — Comprobación y recuperación automáticas

[Actualizar el mismo userscript a 3.2.7](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.7/orion-express.user.js). Recarga el catálogo y prepara una transferencia nueva. **El recorrido y los botones siguen siendo los mismos.**

- Comprueba título, descripción, precio, categoría, marca, estado y paquete contra la ficha, incluidos los errores de validación de Vinted. Relee los elementos actuales cuando el formulario se reconstruye.
- Corrige automáticamente los valores perdidos o cambiados por el formulario: hasta dos correcciones adicionales por campo, durante una sesión de 60 segundos. Recomprueba la estabilidad después de corregir; no recarga la página ni vuelve a enviar las fotos.
- Si empiezas a modificar el formulario, las correcciones se detienen y el panel sigue mostrando las diferencias. Una interrupción de conexión o visibilidad permite retomar dentro del tiempo restante. Un cambio de transferencia o navegación detiene la sesión antigua.
- Las fotos mantienen su orden y sus archivos originales. La lista de archivos se compara con la transferencia, pero **no demuestra que Vinted haya aceptado las miniaturas**: esa parte queda por comprobar, sin éxito completo inventado ni segundo envío automático.

No hay garantía del 100 % frente a cambios o rechazos del sitio. Un valor ambiguo, un campo adicional no modelado o una validación que sigue fallando permanece señalado. **La ejecución de esta versión en Orion iPhone real sigue pendiente de validación.** [Límites y pruebas](docs/V3.2.7.md).

## 3.2.6 — Opciones guardadas y valores reales de Vinted

[Instalar 3.2.6](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.6/orion-express.user.js), recargar el catálogo y preparar una transferencia nueva. La navegación en la misma pestaña de 3.2.5 se conserva.

- Se relee la ficha guardada al pulsar Preparar, para evitar transferir una copia antigua de la vista previa. Se muestran categoría, estado y paquete antes de abrir Vinted.
- Los menús ocultos se ignoran; la confirmación Fait/Listo se busca dentro del diálogo móvil completo. Se admite retomar un diálogo ya abierto que oculta el formulario.
- Las fotos se transmiten primero y se esperan los indicadores de carga visibles antes de completar las características. Se vuelve a comprobar el estado antes del paquete, que respeta la ficha guardada.
- El panel compacto Orion muestra **Ficha guardada / Valor en Vinted / Comprobación**. Si Vinted cambia después un valor, el control se actualiza; no conserva un éxito antiguo. Este seguimiento es de lectura y no vuelve a tocar el formulario automáticamente.
- Tamaño del paquete preciso en Editar: Pequeño, Mediano o Grande; una antigua cadena desconocida no se convierte por defecto. «Neuf/Nuevo» ambiguo sigue requiriendo un estado preciso.

Una categoría que no se confirma impide completar sus campos dependientes; el panel lo hace visible. No se elige otra categoría ni otro estado para aparentar éxito. Para una ruta de categoría completa, la prueba de selección se pierde si se vuelve a abrir manualmente el menú y debe confirmarse de nuevo. **La nueva versión debe probarse en Orion iPhone real.** [Detalles y validaciones](docs/V3.2.6.md).

## 3.2.5 — Navegación en la misma pestaña

[Instalar 3.2.5](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.5/orion-express.user.js). Se retiran las dos vías que fallaron en un iPhone real: GM_openInTab y el enlace orion:// que daba Invalid URL. El botón ahora navega con JavaScript en **la pestaña actual**, conservando el identificador y las fotos del producto. No abre otra ventana ni usa un esquema especial.

Si Orion sigue abriendo la app: **Ajustes → General → App Opener**, regla vinted.es / www.vinted.es → **Never / Nunca**. Si es necesario, volver a Ask/Preguntar, pulsar de nuevo el botón y elegir Never. No borrar los datos del sitio. El panel incluye esta ayuda. La navegación JavaScript tiene respaldo documental para Safari; el comportamiento específico de Orion sigue necesitando una prueba en ese iPhone.

El atajo del dashboard usa ahora **https://example.com/**. Configura Orion como navegador predeterminado de iOS para abrirlo allí. Se elimina el esquema que fallaba también del acceso directo. [Pruebas y fuentes](docs/V3.2.5.md).

## 3.2.4 — Abrir en Orion y acceso directo al panel

**Actualización:** instala la [versión 3.2.4](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.4/orion-express.user.js) en el mismo userscript y acepta el permiso **GM_openInTab**. Recarga el catálogo y prepara una transferencia nueva. El botón principal solicita una pestaña mediante Violentmonkey; ya no es un enlace HTTPS normal. El catálogo confirma la recepción del formulario antes de indicar el resultado. Si no hay respuesta, ofrece **Abrir con Orion**, un enlace con el esquema oficial del navegador que conserva el identificador del producto. No abre otra pestaña automáticamente.

**Panel al abrir Orion:** pulsa **Acceso directo en Orion** en el catálogo. Puedes configurar una vez la página de inicio y las nuevas pestañas, o crear una pequeña acción en Atajos para tener una **icono Orion Express** que abre directamente este panel en Orion. El título de la página es ahora Orion Express. El origen de los datos se conserva: no hay migración ni una PWA separada. El modo de inicio **New Tab cierra las pestañas anteriores**: usa el atajo si quieres conservarlas.

Estos cambios no configuran a distancia los ajustes de un iPhone. La apertura mediante la extensión y el esquema Orion **necesitan confirmación en los dos teléfonos reales**, incluido el comportamiento de enlaces de Vinted. [Detalle, fuentes y pruebas](docs/V3.2.4.md).

## 3.2.3 — Categoría, paquete y apertura en Orion

Selección de categoría por su opción exacta y ruta cuando se indica: el componente y el radio deben estar seleccionados antes de pulsar **Fait / Listo / Hecho** activo. Se vuelve a leer el DOM si el componente se reconstruye y se exige el cierre del menú y el valor final. Una categoría ambigua no se elige al azar.

El paquete se selecciona **después de las fotos**, respetando el tamaño guardado. Se comprueban el radio, la ausencia de otro paquete marcado y el estado del componente durante un intervalo; se permite un único reintento si Vinted vuelve al tamaño sugerido. Se vuelve a verificar la categoría al final.

El enlace de preparación se abre ahora **en la misma pestaña**. Si iOS abre la app Vinted, pulsa **Copiar enlace para Orion** y pégalo completo en la barra de direcciones de Orion. Si el portapapeles no está permitido, aparece el enlace seleccionable. iOS decide la apertura de enlaces universales: el userscript no puede forzar su preferencia. Si Orion pregunta por la app, elige **Nunca / Never**.

Instala la [versión 3.2.3](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.3/orion-express.user.js) y prepara una transferencia nueva en un formulario vacío. El catálogo, las fotos originales y el selector 🇪🇸 / 🇫🇷 se conservan. **La corrección debe confirmarse en Orion iPhone real.** [Pruebas y límites](docs/V3.2.3.md).

## 3.2.2 — Estado preciso / État précis

Elige un estado preciso en la ficha: **Nuevo con etiquetas**, **Nuevo sin etiquetas** o **Muy bueno** (también se conservan los demás estados reconocidos). « Neuf » / « Nuevo » sin más información es ambiguo y no se convierte automáticamente. El selector de Vinted debe quedar realmente marcado, el botón Fait/Listo/Hecho debe estar activo y el campo principal debe mostrar el estado correcto tras cerrar el menú. Un menú abierto no cuenta como éxito. [Detalle del correctif et des validations](docs/V3.2.2.md).

Après sauvegarde, installez la [version 3.2.2](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.2/orion-express.user.js), ouvrez la fiche dans le catalogue, choisissez l’état précis dans **Estado** et enregistrez. Préparez un nouveau transfert vers un formulaire vide. Les anciennes valeurs restent conservées tant qu’aucun choix explicite n’est fait. Les autres champs déjà confirmés sur iPhone ne sont pas modifiés ; **le correctif d’état 3.2.2 reste à confirmer sur cet appareil**.

## Idioma de la aplicación / Langue de l’application

**Español por defecto.** Usa **🇪🇸 Español / 🇫🇷 Français** en la parte superior para cambiar de idioma. En el panel de Vinted, pulsa el botón compacto **Orion** para ver el selector en la parte superior del panel. La preferencia se guarda y se comparte mediante el almacenamiento local de Violentmonkey. Cambiar de idioma conserva la edición en curso y no traduce los títulos, descripciones ni valores de tus fichas. Tampoco cambia el idioma del sitio Vinted ni los diálogos nativos de iOS.

La version **3.2.1** regroupe les corrections Vinted de 3.2.0 et l’interface en espagnol : catalogue, édition, préparation, confirmations, erreurs et panneau Vinted. Le français reste accessible immédiatement par le drapeau, sans rechargement. Aucune migration des produits et aucune traduction de leur contenu. [Détails](docs/V3.2.1.md).

## V3.2 : catégorie, prix, marque, état et colis

La V3.2 corrige les champs signalés sur l’iPhone : sélection effective du radio et confirmation **Fait**, libellés exacts et chemins hiérarchiques, marque/état vérifiés après fermeture, prix canonique contrôlé après formatage et choix du colis vérifié. Le panneau démarre replié en petit bouton **Orion**, dépliable au toucher et placé au-dessus de la zone de sécurité iOS. [Détails et limites](docs/V3.2.md).

Les photos, le titre et la description de V3.1 ont été confirmés fonctionnels par l’utilisateur sur son iPhone ; leur transfert et le stockage des fiches ne sont pas modifiés. **Les corrections V3.2 restent à confirmer sur cet iPhone.** Le format de prix a aussi été essayé sur le vrai formulaire Chrome, sans publier : `10.00` devient `10,00 €`.

Mise à jour : exportez une sauvegarde, installez la [version 3.2.6](https://raw.githubusercontent.com/TheoRuffin/orion-express/v3.2.6/orion-express.user.js) dans Orion avec Violentmonkey puis rechargez le catalogue. Préparez un **nouveau transfert** depuis la fiche et ouvrez un **formulaire vide** pour tester. Aucune désinstallation, aucun effacement des données. Vérifiez que catégorie, marque, état et colis sont renseignés dans la fiche ; une valeur manquante ou ambiguë reste signalée comme manuelle. Pour un intitulé de catégorie ambigu, précisez son chemin exact avec `>` dans la fiche.

## V3.1 : préremplissage expérimental sur vinted.es

À la demande de l’utilisateur, cette version ajoute un test de préremplissage par le DOM. **Aucune autorisation officielle de Vinted n’a été obtenue.** Le test sans publication ne constitue pas une telle autorisation ; les restrictions des [conditions Vinted](https://www.vinted.es/terms-and-conditions) restent applicables. Il ne s’agit pas d’une intégration partenaire.

### Sur l’iPhone

1. Exportez votre catalogue vers Fichiers, puis recherchez les mises à jour dans Violentmonkey. Acceptez les nouvelles permissions du même script : stockage GM et exécution uniquement sur `https://www.vinted.es/items/new*`. Version attendue **3.2.7**. Rechargez example.com sans effacer ses données.
2. Sélectionnez une fiche complète puis **Préparer sur Vinted**. Appuyez sur **Ouvrir Vinted et préremplir (test)**. Le formulaire doit être vide ; connectez-vous si nécessaire. Si le catalogue paraît vide après la mise à jour, ne supprimez ni ne réimportez rien : vérifiez l’origine/profil et revenez à la version 3.0.0 pour diagnostiquer. Après connexion, si le fragment du lien a disparu, le panneau permet de lancer **Préremplir une seule fois** manuellement.
3. Le module tente automatiquement les champs reconnus et les photos lorsque le lien contient le bon identifiant de transfert. Contrôlez les valeurs et surtout **les miniatures natives Vinted**, leur nombre et leur ordre. Une FileList remplie ne prouve pas l’acceptation des images par Vinted. Aucune action n’est effectuée sur Publier/Ajouter ou Sauvegarder le brouillon.

Trois actions depuis le catalogue ouvrent et lancent la tentative (hors connexion, installation et contrôles). Si un champ affiche **Manuel**, le composant ou la valeur n’a pas été reconnu : sélectionnez-le dans Vinted. Les champs supplémentaires de catégorie ne sont pas devinés : leur modèle n’existe pas dans les fiches V1/V2. Après changement de catégorie, relisez les champs dépendants. Les valeurs de texte déjà différentes sont conservées ; le colis demandé peut remplacer la suggestion par défaut.

Les photos sont transmises en fichiers, sans recompression, dans leur ordre d’origine. Un formulaire contenant déjà du titre ou de la description ne reçoit pas de photos automatiquement, pour éviter les doublons. Une seule tentative photo est autorisée par transfert, y compris après interruption ou rechargement ; un verrou navigateur sérialise les tentatives entre onglets. Un transfert déjà tenté peut reprendre **les textes et choix sans photos**. Pour une nouvelle tentative photo après échec, revenez au catalogue et préparez de nouveau, sur un formulaire vide. Aucun résultat n’est déclaré « publié » ou « accepté par Vinted ».

### Stockage, reprise et secours

La base produits et le code `src/core.js` restent inchangés. Le pont est une copie JSON vérifiée dans le stockage **local de l’extension Violentmonkey**, qui traverse les origines sans accès direct à IndexedDB Vinted. Aucun serveur de transfert ni URL contenant les photos. Le script ne configure aucun service de synchronisation : désactivez toute synchronisation cloud de l’extension avant le test si vous en utilisez une. Le transfert est valide 24 heures, reste stocké jusqu’à remplacement/effacement, et peut être effacé depuis le panneau Vinted. Limite 40 Mo au format sérialisé. Le stock ne diminue pas ; aucune vente n’est enregistrée.

Si le pont, le verrou ou l’injection iOS échoue, utilisez **Utiliser la préparation manuelle** : partage de toutes les photos, ZIP, fichiers individuels, copie de chaque valeur et contrôles reprenables. Le catalogue conserve aussi **Reprendre ma préparation Vinted** pour ce mode de secours. Un ZIP doit être décompressé dans Fichiers avant de choisir ses images dans Vinted. Aucun nombre de gestes iOS exact n’est validé pour ce secours : il dépend des cibles de partage et des dialogues natifs ; il ne se réduit pas à trois gestes.

### Validation et limites

- **VALIDÉ sur formulaire contrôlé WebKit et Chromium** : pont entre origines avec stockage GM simulé, valeurs exactes, setters/événements natifs, catégorie dynamique, fichiers dans le même ordre et mêmes octets, verrou anti-répétition, reprise sans double photo, conservation des valeurs modifiées, aucune soumission.
- **OBSERVÉ sur le vrai Vinted Espagne** lors de V3 : ids titre/description/prix, popovers catégorie/marque/état et colis. L’adaptateur cible ces éléments et refuse les correspondances absentes ou ambiguës.
- **NON VALIDÉ** : exécution effective du userscript dans Violentmonkey/Orion iOS 18, extension GM réelle, acceptation du téléversement par Vinted, toutes les marques/conditions/langues et tous les attributs de catégorie. Les tests contrôlés ne prouvent pas ces comportements.
- **PARTIEL** : attributs supplémentaires, menus non reconnus et photos refusées requièrent le secours manuel. Aucun brouillon distant n’est sauvegardé : il s’agit d’un formulaire prérempli non publié, qui peut être perdu si le site est fermé.

Les versions V1/V2/V3 restent compatibles ; avant mise à jour, la sauvegarde hors navigateur reste obligatoire. [Audit historique V3](docs/V3-AUDIT.md) et [limites V3.1](docs/V3.1.md).

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

Le catalogue s’exécute localement. Sur le formulaire Vinted, les événements de sélection des photos peuvent déclencher le téléversement natif vers Vinted. Le chargement initial de la page example.com et l’installation/les mises à jour demandent un accès au réseau. Cette version n’est pas une PWA installable avec un lancement hors connexion garanti. Le stockage est celui de l’origine example.com, accessible aux scripts autorisés de cette origine : ce n’est pas un coffre chiffré.

## Mises à jour

Identité stable : `@name Orion Express`, `@namespace https://github.com/TheoRuffin/orion-express`. Ne changez pas ces valeurs pour publier une mise à jour.

- `@updateURL` : [orion-express.meta.js](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.meta.js).
- `@downloadURL` : [orion-express.user.js](https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js).
- La vérification automatique doit être activée dans Violentmonkey. Une mise à jour n’est pas immédiate : elle dépend de l’intervalle configuré, du cache GitHub et de la possibilité pour Orion iOS de réveiller l’extension. **Aucun délai fixe n’est garanti.** Ouvrez Orion/Violentmonkey et lancez une vérification manuelle si nécessaire, puis rechargez example.com.
- Chaque livraison augmente la version de `package.json`, exécute le build et publie ensemble le script et ses métadonnées. Les mises à jour ne vident jamais IndexedDB. Exportez avant d’installer une nouvelle version.
- Aucun `@require`, `eval`, code téléchargé à l’exécution ou service payant. Le script complet est versionné dans Git. Pour un audit, consultez les tags et l’historique des commits.

Les URL et leurs octets sont vérifiés après publication. Cela vérifie la disponibilité du canal GitHub, pas le comportement du planificateur Violentmonkey sur un iPhone.

## Vinted

Orion Express prépare des annonces : textes copiables, aperçu et photos à joindre manuellement. Le mode V3.1 injecte un module expérimental limité au formulaire de création sur vinted.es ; aucune API privée. Pas de robot de publication, de contournement ou d’évitement de détection. Le module clique uniquement sur des choix identifiés de catégorie, marque, état et colis. La préparation d’une fiche ne valide pas l’éligibilité de la vente ou du compte particulier pour du stock commercial. Aucune autorisation officielle de ce test n’a été obtenue et aucune API Vinted privée n’est utilisée.

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
