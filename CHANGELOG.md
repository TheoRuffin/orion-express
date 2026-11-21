# Historique

## 3.2.5 — 21 novembre 2026

- Retour réel iPhone : GM_openInTab ouvrait toujours l’app Vinted et le schéma Orion retournait Invalid URL. Ces voies sont retirées, y compris le grant GM_openInTab et le schéma du raccourci dashboard.
- Bouton Vinted : navigation JavaScript location.assign dans l’onglet courant, URL HTTPS et fragment inchangés. Tests de navigation réelle contrôlée sans nouvel onglet ni schéma personnalisé.
- Guide précis App Opener dans la préparation : règle Vinted Never/Jamais, réinitialisation Ask/Demander si nécessaire, sans toucher les données du site.
- Raccourci dashboard : URL HTTPS classique, Orion navigateur par défaut requis.
- Transfert, photos, contrôles des champs, ACK et protections de reprise conservés. Le routage natif de cette nouvelle méthode dans Orion iPhone reste à confirmer.

## 3.2.4 — 21 novembre 2026

- Bouton Vinted natif appelant GM_openInTab (nouveau grant), au lieu d’un clic HTTPS normal. Repli explicite par schéma Orion documenté, sans seconde ouverture automatique.
- Accusé de réception par transfert : formulaire reconnu, tentative terminée, résultat partiel ou erreur ; aucune réussite déduite du handle d’onglet. Relecture lors du retour de visibilité.
- Transfert relu pendant un délai borné si le cache GM du nouvel onglet n’est pas encore à jour ; aucune fiche d’un autre transfert choisie. Sans fragment après connexion, reprise manuelle explicite.
- Marqueur de tentative photo par nonce, compatible avec le marqueur historique ; pas de nouveau transfert photo automatique après rechargement.
- Accès direct dans Orion : titre de page, copie de l’adresse, schéma Orion pour un raccourci iOS, guide d’accueil personnalisé ES/FR. Aucun changement des préférences du téléphone ni nouvelle origine de stockage.
- Tests de navigation/confirmation entre onglets, absence de réponse, reprise sans fragment, encodage et isolation des ACK, accès dashboard et conservation des produits.

## 3.2.3 — 21 novembre 2026

- Catégorie/marque : clic sur la cellule du composant, radio et aria vérifiés conjointement, relecture après recréation du DOM, confirmation active et fermeture effective obligatoires. Une coche native isolée ne suffit plus.
- Catégorie relue après les photos et après le choix du colis. Les correspondances ambiguës restent refusées.
- Colis choisi après l’ajout des photos, contrôle du choix exclusif et de la stabilité du composant, une reprise bornée du même choix en cas de retour à la suggestion.
- Ouverture Vinted dans le même onglet, bouton de copie du lien complet et secours si le presse-papiers est refusé. Aucune garantie de forcer le gestionnaire de liens universels iOS.
- Tests contrôlés de confirmation mobile, DOM renouvelé, défaut Moyen, reset tardif, FR/ES, photos et navigation. Stockage, fichiers originaux et module d’état 3.2.2 inchangés.

## 3.2.2 — 16 novembre 2026

- Correctif ciblé de l’état : correspondances explicites FR/ES, cellule sémantique, radio effectif et confirmation Fait active.
- Vérification de la fermeture réelle du menu et de l’état principal, sans faux succès.
- Liste d’états précis dans la fiche ; Neuf/Nuevo ambigu n’est jamais choisi arbitrairement.
- Conservation des anciennes valeurs tant qu’aucun changement n’est demandé.
- Photos, stockage et autres branches de préremplissage inchangés ; ES/FR et bouton compact conservés.

## 3.2.1 — 16 novembre 2026

- Espagnol par défaut dans le catalogue, les formulaires, confirmations, erreurs et le panneau Orion sur Vinted.
- Drapeaux 🇪🇸 / 🇫🇷 tout en haut, choix mémorisé et partagé entre les deux origines via le stockage GM existant.
- Bascule sans rechargement ni perte de saisie ; contenus des fiches protégés de la traduction.
- Bouton photo localisé, contrôle natif de fichier masqué dans notre interface, dialogues iOS inchangés.
- Tests ES/FR et de conservation des champs et photos ; corrections Vinted de 3.2.0 conservées.

## 3.2.0 — 16 novembre 2026

- Sélection exacte de catégorie avec chemin hiérarchique, radio effectif, confirmation Fait et vérification de la valeur finale.
- Marque et état : lecture des titres imbriqués et contrôle après fermeture, sans substitution arbitraire.
- Prix canonique à point, validation des formats FR/ES et vérification numérique après formatage.
- Colis : clic sur le contrôle accessible puis vérification du radio réellement coché, même masqué.
- Bouton Orion compact replié au démarrage, marges safe-area iOS et panneau développable.
- Tests des états effectifs et des variantes mobile/desktop, stockage et injection photo inchangés.

## 3.1.0 — 16 novembre 2026

- Préremplissage expérimental ciblant le vrai formulaire vinted.es, avec transfert local GM entre origines.
- Tentative des textes, catégorie, marque, état, colis et FileList des photos ; aucune publication ni sauvegarde de brouillon automatique.
- Verrou anti-répétition entre onglets, reprise sans photos, refus des valeurs ambiguës et secours manuel.
- Nouvelles permissions GM et correspondance limitée au formulaire Vinted ; stockage produits inchangé.
- Validation sur formulaires contrôlés, pas de validation iPhone ou de téléversement réel Vinted. Pas d’autorisation officielle obtenue.

## 3.0.0 — 16 novembre 2026

- Bouton Préparer sur Vinted et ouverture du véritable formulaire Espagne.
- Préparation locale reprenable dans une base indépendante ; aucune modification du stockage produits.
- Photos partagées ensemble, ZIP standard et téléchargements individuels.
- Copie de chaque champ, contrôles manuels, invalidation après changement de catégorie et retour à la fiche.
- Aucun remplissage ni upload automatique sur Vinted : absence d’autorisation identifiée pour les outils tiers.
- Audit réel desktop connecté et tests contrôlés séparés. Parcours iPhone V3 non validé.

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
