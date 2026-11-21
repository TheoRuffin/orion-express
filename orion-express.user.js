// ==UserScript==
// @name Orion Express
// @namespace https://github.com/TheoRuffin/orion-express
// @version 3.2.3
// @description Catálogo local y rellenado experimental en Vinted España, sin publicar.
// @description:fr Catalogue local et préremplissage expérimental Vinted Espagne, sans publication.
// @match https://example.com/*
// @run-at document-end
// @noframes
// @match https://www.vinted.es/items/new*
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @inject-into auto
// @updateURL https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.meta.js
// @downloadURL https://raw.githubusercontent.com/TheoRuffin/orion-express/main/orion-express.user.js
// @homepageURL https://github.com/TheoRuffin/orion-express
// @supportURL https://github.com/TheoRuffin/orion-express/issues
// ==/UserScript==

(async () => {
'use strict';
// Presentation-only localisation. Never visits the Vinted page DOM or rewrites product data.
let orionLanguage='es';
const LANGUAGE_KEY='orion-express-language';
const ES={
'Copier le lien pour Orion':'Copiar enlace para Orion',
'Lien à coller dans Orion':'Enlace para pegar en Orion',
'Lien copié. Collez-le dans la barre d’adresse d’Orion.':'Enlace copiado. Pégalo en la barra de direcciones de Orion.',
'Appuyez longuement sur le lien sélectionné, puis Copier. Collez-le dans la barre d’adresse d’Orion.':'Mantén pulsado el enlace seleccionado y elige Copiar. Pégalo en la barra de direcciones de Orion.',
'Ouverture dans cet onglet. Si iOS ouvre l’app Vinted, copiez le lien ci-dessous et collez-le dans la barre d’adresse d’Orion. Si Orion propose l’app, choisissez Jamais. Un script ne peut pas imposer ce choix à iOS.':'Se abre en esta pestaña. Si iOS abre la app de Vinted, copia el enlace de abajo y pégalo en la barra de direcciones de Orion. Si Orion ofrece abrir la app, elige Nunca. Un script no puede imponer esta elección a iOS.',
'Le colis demandé ne reste pas sélectionné. Vérifiez le format dans Vinted.':'El paquete solicitado no permanece seleccionado. Comprueba el tamaño en Vinted.',
'Choisir un état précis':'Elegir un estado preciso',
'Neuf avec étiquette':'Nuevo con etiquetas','Neuf sans étiquette':'Nuevo sin etiquetas','Très bon état':'Muy bueno','Bon état':'Bueno','Satisfaisant':'Satisfactorio',
'État ambigu : choisissez Neuf avec étiquette ou Neuf sans étiquette dans la fiche produit.':'Estado ambiguo: elige Nuevo con etiquetas o Nuevo sin etiquetas en la ficha del producto.',
'État absent ou non reconnu : choisissez un état précis dans la fiche produit.':'Estado ausente o no reconocido: elige un estado preciso en la ficha del producto.',
'État non coché : confirmation annulée.':'Estado no seleccionado: confirmación cancelada.',

'VOTRE ATELIER DE VENTE · V3':'TU TALLER DE VENTAS · V3',
'Local · example.com · aucune synchronisation':'Local · example.com · sin sincronización',
'Les données du navigateur ne sont pas une sauvegarde. Exportez vers Fichiers régulièrement.':'Los datos del navegador no son una copia de seguridad. Exporta a Archivos con frecuencia.',
'Préparation manuelle des annonces : aucune connexion ni publication sur Vinted.':'Preparación manual de anuncios: sin conexión ni publicación en Vinted.',
'LE CATALOGUE':'EL CATÁLOGO','Prêt pour la prochaine vente.':'Todo listo para la próxima venta.',
'fiches':'fichas','en stock':'en stock','＋ Nouveau produit':'＋ Nuevo producto','Nouveau produit':'Nuevo producto',
'Exporter la sauvegarde':'Exportar copia de seguridad','Restaurer une sauvegarde':'Restaurar copia de seguridad',
'Reprendre ma préparation Vinted':'Continuar mi preparación de Vinted','Retrouver une fiche':'Buscar una ficha','Titre, marque, catégorie…':'Título, marca, categoría…',
'Une seule origine, vos données retrouvées':'Un único origen para tus datos',
'Ouvrez toujours https://example.com. Désactivez V1 avant d’utiliser V2. Une sauvegarde contient vos photos : conservez-la dans Fichiers, jamais dans le dépôt public.':'Abre siempre https://example.com. Desactiva V1 antes de usar V2. La copia contiene tus fotos: guárdala en Archivos, nunca en el repositorio público.',
'Aucun résultat':'Sin resultados','Votre premier produit vous attend':'Tu primer producto te espera',
'Créez une fiche ou retrouvez votre catalogue avec une sauvegarde.':'Crea una ficha o recupera tu catálogo con una copia de seguridad.',
'Créer « Jeu de cartes » à 10 €':'Crear « Juego de cartas » por 10 €','À classer':'Sin categoría','Sans titre':'Sin título',
'← Catalogue':'← Catálogo','Modifier la fiche':'Editar ficha','Titre':'Título','Description':'Descripción','Prix (€)':'Precio (€)','Prix':'Precio','Catégorie':'Categoría','Marque':'Marca','État':'Estado','Format du colis':'Tamaño del paquete','Stock initial':'Stock inicial','Stock restant':'Stock restante','Colis':'Paquete','Photos ·':'Fotos ·','Photos':'Fotos',
'＋ Ajouter des photos':'＋ Añadir fotos','Enregistrer la fiche':'Guardar ficha',
'Jusqu’à 15 Mo par photo. HEIC peut être conservé sans être affichable sur tous les navigateurs. Remplacer agit seulement sur la photo choisie.':'Hasta 15 MB por foto. HEIC se conserva, aunque algunos navegadores no lo muestran. Reemplazar solo cambia la foto elegida.',
'Remplacer':'Reemplazar','Retirer':'Quitar','APERÇU DE L’ANNONCE':'VISTA PREVIA DEL ANUNCIO','Aucune description':'Sin descripción',
'Préparer sur Vinted':'Preparar en Vinted','Modifier':'Editar','Dupliquer':'Duplicar','Copier l’annonce':'Copiar anuncio','Copier le titre':'Copiar título','Copier la description':'Copiar descripción','Texte à copier':'Texto para copiar',
'Photos à joindre manuellement':'Fotos para adjuntar manualmente','Enregistrer une vente':'Registrar una venta','Quantité':'Cantidad','Prix unitaire (€)':'Precio unitario (€)','Confirmer la vente':'Confirmar venta','Historique des ventes':'Historial de ventas','Aucune vente enregistrée.':'No hay ventas registradas.','Supprimer cette fiche':'Eliminar esta ficha',
'Réduire l’application':'Minimizar la aplicación','Réduire':'Reducir','Ouvrir Orion':'Abrir Orion','Réduire Orion':'Reducir Orion',
'Quitter sans enregistrer les modifications ?':'¿Salir sin guardar los cambios?',
'Supprimer définitivement cette fiche et ses photos ? Exportez une sauvegarde avant de continuer.':'¿Eliminar definitivamente esta ficha y sus fotos? Exporta una copia de seguridad antes de continuar.',
'Copié dans le presse-papiers.':'Copiado al portapapeles.',
'Appuyez longuement sur le texte sélectionné, puis Copier.':'Mantén pulsado el texto seleccionado y elige Copiar.',
'Fiche enregistrée sur cet appareil.':'Ficha guardada en este dispositivo.','Fiche introuvable.':'Ficha no encontrada.','Fiche supprimée.':'Ficha eliminada.','Vente enregistrée, stock mis à jour.':'Venta registrada; stock actualizado.',
'Copie créée, historique des ventes réinitialisé.':'Copia creada; historial de ventas reiniciado.',
'Catalogue chargé. Avant la première modification V1, exportez une sauvegarde.':'Catálogo cargado. Antes de modificar una ficha V1, exporta una copia de seguridad.',
'Choisissez une image.':'Elige una imagen.','Ajoutez un titre.':'Añade un título.',
'Image supérieure à 15 Mo. Réduisez-la avant ajout.':'La imagen supera los 15 MB. Reduce su tamaño antes de añadirla.',
'Sauvegarde supérieure à 100 Mo.':'La copia de seguridad supera los 100 MB.',
'Vérification de sauvegarde échouée.':'No se ha podido verificar la copia de seguridad.',
'Sauvegarde vérifiée. Enregistrez-la dans Fichiers puis testez sa restauration.':'Copia verificada. Guárdala en Archivos y comprueba su restauración.',
'Télécharger à nouveau la sauvegarde':'Volver a descargar la copia','Partager / Enregistrer dans Fichiers':'Compartir / Guardar en Archivos',
'Transfert prêt':'Transferencia preparada','← Retour à la fiche':'← Volver a la ficha','← Retour à la fiche produit':'← Volver a la ficha del producto','Retour au catalogue':'Volver al catálogo',
'Produit et photos enregistrés dans le stockage de Violentmonkey ; transfert valable 24 heures. Aucun serveur de transfert.':'Producto y fotos guardados en el almacenamiento de Violentmonkey; transferencia válida durante 24 horas. Sin servidor de transferencia.',
'Ouvrir Vinted et préremplir (test) ↗':'Abrir Vinted y rellenar (prueba) ↗',
'Expérimental : contrôlez tous les champs et les images. Le script ne publie ni ne sauvegarde de brouillon. Les valeurs supplémentaires inconnues restent manuelles.':'Experimental: revisa todos los campos y las imágenes. El script no publica ni guarda borradores. Los campos adicionales desconocidos se completan manualmente.',
'Utiliser la préparation manuelle':'Usar preparación manual','Orion Express · préremplissage expérimental':'Orion Express · rellenado experimental',
'Chargement du transfert local…':'Cargando la transferencia local…','Préremplir une seule fois':'Rellenar una sola vez','Réessayer les textes et choix (sans photos)':'Reintentar textos y opciones (sin fotos)','Effacer le transfert local':'Borrar transferencia local',
'Aucune publication ni sauvegarde de brouillon automatique. La présence dans un champ ne confirme pas sa validation par Vinted. Vérifiez les photos et les champs dépendants après chaque changement de catégorie.':'Sin publicación ni guardado automático de borradores. Un valor presente no confirma su validación por Vinted. Revisa las fotos y los campos dependientes después de cambiar de categoría.',
'Tentative terminée. Vérifiez chaque champ et chaque miniature native Vinted. Rien n’a été publié.':'Intento terminado. Revisa cada campo y cada miniatura de Vinted. No se ha publicado nada.',
'Ce lien correspond à un autre transfert. Préparez de nouveau la fiche.':'Este enlace corresponde a otra transferencia. Prepara de nuevo la ficha.',
'Ouvrez le formulaire de création Vinted.':'Abre el formulario de creación de Vinted.','Connexion indisponible. Aucun transfert lancé.':'Sin conexión. No se ha iniciado ninguna transferencia.',
'Verrou de sécurité indisponible dans ce navigateur. Utilisez la préparation manuelle.':'El bloqueo de seguridad no está disponible en este navegador. Usa la preparación manual.',
'Transfert extension indisponible : préparation manuelle ouverte.':'Transferencia de la extensión no disponible: preparación manual abierta.',
'Transfert local effacé. Catalogue conservé.':'Transferencia local borrada. Catálogo conservado.',
'ASSISTANT VINTED ESPAGNE · PARCOURS MANUEL':'ASISTENTE VINTED ESPAÑA · PROCESO MANUAL',
'Informations préparées ici. Aucun champ n’est rempli sur Vinted. Copiez puis collez dans le site, et cochez seulement après vérification.':'Información preparada aquí. Ningún campo se rellena en Vinted. Copia y pega en el sitio y marca las casillas solo después de comprobarlo.',
'Ouvrir le vrai formulaire Vinted ↗':'Abrir el formulario real de Vinted ↗',
'La connexion peut être nécessaire. Revenez à cet onglet après une interruption : la préparation est enregistrée sur cet appareil.':'Puede ser necesario iniciar sesión. Vuelve a esta pestaña tras una interrupción: la preparación se guarda en este dispositivo.',
'Partager les photos ensemble':'Compartir todas las fotos','Télécharger toutes les photos (ZIP)':'Descargar todas las fotos (ZIP)',
'Dans le partage iOS, enregistrez les images dans Photos ou Fichiers si proposé. Sinon, téléchargez le ZIP, ouvrez-le dans Fichiers pour l’extraire, puis sélectionnez les images ensemble dans le sélecteur de Vinted. Le fichier annonce.txt contient aussi les textes. Aucun envoi automatique.':'En el menú de compartir de iOS, guarda las imágenes en Fotos o Archivos si aparece esa opción. Si no, descarga el ZIP, extráelo en Archivos y selecciona sus imágenes juntas en Vinted. annonce.txt también contiene los textos. Sin envío automático.',
'J’ai ajouté et vérifié les photos dans Vinted':'He añadido y comprobado las fotos en Vinted',
'2 · Copier, coller, vérifier':'2 · Copiar, pegar y comprobar','3 · Catégorie et vérification finale':'3 · Categoría y revisión final',
'Choisissez la catégorie dans la recherche hiérarchique de Vinted. Pour « Jeux de société », renseignez aussi les champs supplémentaires affichés. La marque, l’état et le colis restent à sélectionner dans leurs listes.':'Elige la categoría en la búsqueda jerárquica de Vinted. Para «Juegos de mesa», completa también los campos adicionales que aparezcan. Selecciona marca, estado y paquete en sus listas.',
'J’ai changé de catégorie : revérifier les choix':'He cambiado de categoría: revisar las opciones',
'J’ai vérifié les champs supplémentaires, la marque, l’état et le colis après le choix de catégorie':'He comprobado los campos adicionales, la marca, el estado y el paquete tras elegir la categoría',
'J’ai comparé toutes les informations et les photos avec l’annonce Vinted':'He comparado toda la información y las fotos con el anuncio de Vinted',
'Ces coches sont vos confirmations manuelles, pas une détection du formulaire. Publication exclusivement depuis le bouton natif Vinted. Aucune vente ni diminution du stock n’est enregistrée par cet assistant.':'Estas casillas son confirmaciones manuales, no una detección del formulario. Solo se publica desde el botón de Vinted. Este asistente no registra ventas ni reduce el stock.',
'Effacer uniquement cette préparation':'Borrar solo esta preparación','Vérifié dans Vinted':'Comprobado en Vinted','À choisir manuellement dans Vinted':'Elegir manualmente en Vinted',
'Catégorie, champs supplémentaires, marque, état et colis à revérifier.':'Revisa la categoría, los campos adicionales, la marca, el estado y el paquete.',
'Préparation locale enregistrée. Collage, choix et ajout des photos manuels dans Vinted.':'Preparación local guardada. Pega el texto, elige las opciones y añade las fotos manualmente en Vinted.',
'Vérification enregistrée sur cet appareil.':'Comprobación guardada en este dispositivo.',
'Partage multiple indisponible ici. Utilisez le ZIP ou les liens photo individuels.':'Compartir varios archivos no está disponible aquí. Usa el ZIP o los enlaces individuales.',
'Partage fermé. Vérifiez que les images sont enregistrées avant de les sélectionner dans Vinted.':'Menú de compartir cerrado. Comprueba que las imágenes estén guardadas antes de elegirlas en Vinted.',
'Partage annulé. Les photos restent disponibles ici.':'Se ha cancelado el uso compartido. Las fotos siguen disponibles aquí.',
'Effacer la préparation locale ? Les produits et les photos du catalogue restent conservés.':'¿Borrar la preparación local? Se conservarán los productos y las fotos del catálogo.',
'Préparation effacée, catalogue conservé.':'Preparación borrada; catálogo conservado.',
'Remplacer la préparation en cours ? Les fiches du catalogue et leurs photos seront conservées.':'¿Reemplazar la preparación actual? Se conservarán las fichas y sus fotos.',
'Aucune préparation en cours. Ouvrez une fiche puis Préparer sur Vinted.':'No hay ninguna preparación. Abre una ficha y pulsa Preparar en Vinted.',
'Préparation non reconnue. Le catalogue est conservé.':'Preparación no reconocida. Se conserva el catálogo.',
'Photos supérieures à 40 Mo : réduisez leur taille dans une copie de la fiche avant de préparer. Les originaux sont conservés.':'Las fotos superan los 40 MB: reduce su tamaño en una copia de la ficha antes de prepararla. Se conservan los originales.',
'Stockage Violentmonkey inaccessible. Vérifiez les autorisations du script.':'Almacenamiento de Violentmonkey inaccesible. Comprueba los permisos del script.',
'vérifiez tous les champs supplémentaires de la catégorie':'revisa todos los campos adicionales de la categoría',
'Champs supplémentaires':'Campos adicionales','À vérifier dans Vinted':'Por comprobar en Vinted',
'Prix invalide.':'Precio no válido.','Stock initial invalide.':'Stock inicial no válido.','Stock insuffisant.':'Stock insuficiente.','Vente invalide.':'Venta no válida.','Fiche invalide.':'Ficha no válida.','Identifiant invalide.':'Identificador no válido.','Photos ou ventes invalides.':'Fotos o ventas no válidas.',
'Opération impossible. Les données existantes sont conservées.':'No se puede completar la operación. Se conservan los datos existentes.',
'Stockage plein : aucune modification enregistrée. Exportez une sauvegarde et libérez de l’espace.':'Almacenamiento lleno: no se ha guardado ningún cambio. Exporta una copia y libera espacio.',
'Stockage inaccessible. Utilisez un onglet normal et autorisez le stockage du site.':'Almacenamiento inaccesible. Usa una pestaña normal y permite el almacenamiento del sitio.',
'Format photo V1 non affichable. Original conservé ; exportez avant de le remplacer.':'Formato de foto V1 no compatible. Se conserva el original; exporta una copia antes de reemplazarlo.',
'Transaction annulée.':'Transacción cancelada.','Photo corrompue.':'Foto dañada.','Sauvegarde non reconnue ou intégrité invalide.':'Copia no reconocida o integridad no válida.','Liste de fiches invalide.':'Lista de fichas no válida.',
'Clé V1 non reconnue : aucune donnée modifiée.':'Clave V1 no reconocida: no se han modificado los datos.',
'Clés V1 non reconnues : aucune donnée modifiée.':'Claves V1 no reconocidas: no se han modificado los datos.',
'Schéma V1 non reconnu : aucune donnée modifiée.':'Esquema V1 no reconocido: no se han modificado los datos.',
'Sauvegarde supérieure à 100 Mo : export annulé.':'La copia supera los 100 MB: exportación cancelada.',
'Champ réservé dans la sauvegarde.':'Campo reservado en la copia de seguridad.',
'Champ interdit.':'Campo no permitido.',
'Manuel : vérifiez tous les champs supplémentaires de la catégorie':'Manual: revisa todos los campos adicionales de la categoría',
'Fermez les autres onglets example.com puis réessayez.':'Cierra las otras pestañas de example.com e inténtalo de nuevo.',
'Cette fiche a changé dans un autre onglet. Vos modifications ne sont pas enregistrées ; copiez votre texte puis rouvrez la fiche.':'Esta ficha ha cambiado en otra pestaña. Los cambios no se han guardado; copia tu texto y vuelve a abrir la ficha.',
'Ajoutez un titre, une description, un prix positif, au moins une photo et du stock avant de préparer.':'Añade un título, una descripción, un precio positivo, al menos una foto y stock antes de preparar.',
'Fermez les autres onglets Orion Express puis réessayez.':'Cierra las otras pestañas de Orion Express e inténtalo de nuevo.',
'Préparation non enregistrée.':'Preparación no guardada.','Étape inconnue.':'Paso desconocido.',
'Transfert supérieur à 40 Mo. Utilisez le partage manuel des photos.':'La transferencia supera los 40 MB. Comparte las fotos manualmente.',
'Transfert local non confirmé. Réessayez ou utilisez la préparation manuelle.':'Transferencia local no confirmada. Reinténtalo o usa la preparación manual.',
'Aucun produit transmis. Revenez à Orion Express et préparez une fiche.':'No se ha transferido ningún producto. Vuelve a Orion Express y prepara una ficha.',
'Transfert expiré : préparez de nouveau la fiche dans Orion Express.':'Transferencia caducada: prepara de nuevo la ficha en Orion Express.','Transfert invalide.':'Transferencia no válida.',
'Champ absent ou non modifiable.':'Campo ausente o no editable.','Type de champ non pris en charge.':'Tipo de campo no compatible.',
'Sélecteur photo absent ou incompatible.':'Selector de fotos ausente o incompatible.',
'Des photos sont déjà présentes. Aucun remplacement automatique.':'Ya hay fotos. No se reemplazan automáticamente.',
'Le navigateur refuse le transfert des photos.':'El navegador rechaza la transferencia de fotos.',
'Composant Vinted non reconnu ou trop lent. Choisissez cette valeur manuellement.':'Componente de Vinted no reconocido o demasiado lento. Elige este valor manualmente.',
'Prix invalide : utilisez par exemple 10, 10.00, 10,00 ou 10 €.':'Precio no válido: usa, por ejemplo, 10, 10.00, 10,00 o 10 €.',
'Le prix contient déjà une autre valeur ; aucun écrasement.':'El precio ya contiene otro valor; no se sobrescribe.',
'Prix non conservé après formatage.':'El precio no se ha conservado después del formato.',
'Valeur manquante dans la fiche.':'Falta este valor en la ficha.',
'Option non sélectionnée : confirmation annulée.':'Opción no seleccionada: confirmación cancelada.',
'Format du colis non reconnu ou manquant dans la fiche.':'Tamaño del paquete no reconocido o ausente en la ficha.',
'Choix du colis non accessible.':'La opción de paquete no está accesible.',
'Ce champ contient déjà une autre valeur ; aucun écrasement.':'Este campo ya contiene otro valor; no se sobrescribe.',
'Valeur non conservée par le formulaire.':'El formulario no ha conservado el valor.',
'Choisissez et confirmez la catégorie avant ce champ.':'Elige y confirma la categoría antes de este campo.',
'Le formulaire contenait déjà du texte : ajout automatique de photos désactivé pour éviter les doublons.':'El formulario ya contenía texto: se desactiva la adición automática de fotos para evitar duplicados.',
'Sélecteur photo absent ou ambigu.':'Selector de fotos ausente o ambiguo.',
'Fichiers transmis au sélecteur ; téléversement à vérifier':'Archivos enviados al selector; hay que comprobar la subida',
'Ce transfert a déjà été tenté. Reprenez les textes sans photos ou préparez de nouveau la fiche.':'Esta transferencia ya se ha intentado. Reintenta los textos sin fotos o prepara de nuevo la ficha.'
};
function translateOrion(source) {
  if(orionLanguage==='fr')return /^(Titre|Description|Prix|Catégorie|Marque|État|Colis) \/ /.test(String(source).trim())?String(source).split(' / ')[0]:source;
  const text=String(source),trim=text.trim();
  const render=body=>text.slice(0,text.indexOf(trim))+body+text.slice(text.indexOf(trim)+trim.length);
  if(Object.hasOwn(ES,trim))return render(ES[trim]);
  // Labels in the manual assistant were bilingual before localisation.
  const labels={'Titre / Título':'Título','Description / Descripción':'Descripción','Prix / Precio':'Precio','Catégorie / Categoría':'Categoría','Marque / Marca':'Marca','État / Estado':'Estado','Colis / Tamaño del paquete':'Tamaño del paquete'};
  if(labels[trim])return render(labels[trim]);
  const patterns=[
    [/^État actuel à préciser : (.*)$/s,(_,v)=>`Estado actual por precisar: ${v}`],
    [/^État vérifié : (.*)$/s,(_,v)=>`Estado verificado: ${v}`],
    [/^Enregistrer la photo (\d+)$/s,(_,n)=>`Guardar foto ${n}`],
    [/^1 · Vos (\d+) photo\(s\)$/s,(_,n)=>`1 · Tus ${n} foto(s)`],
    [/^(\d+) en stock$/s,(_,n)=>`${n} en stock`],
    [/^Copier (titre|description|prix|catégorie|marque|état|colis)$/s,(_,k)=>`Copiar ${{titre:'título',description:'descripción',prix:'precio',catégorie:'categoría',marque:'marca',état:'estado',colis:'paquete'}[k]}`],
    [/^Prêt : (.*), (\d+) photo\(s\)\. Lancez le test lorsque le formulaire est chargé\.$/s,(_,title,n)=>`Listo: ${title}, ${n} foto(s). Inicia la prueba cuando se cargue el formulario.`],
    [/^Préparé localement : (\d+)\/7 valeurs et (\d+) photo\(s\)\. Vérifié par vous dans Vinted : (\d+)\/(\d+)\.$/s,(_,n,p,c,total)=>`Preparado localmente: ${n}/7 valores y ${p} foto(s). Comprobado por ti en Vinted: ${c}/${total}.`],
    [/^(\d+) fiche\(s\) exportée\(s\), intégrité et lecture vérifiées\.$/s,(_,n)=>`${n} ficha(s) exportada(s), integridad y lectura verificadas.`],
    [/^(\d+) fiche\(s\) restaurée\(s\)\. Originaux conservés\.$/s,(_,n)=>`${n} ficha(s) restaurada(s). Originales conservados.`],
    [/^Sauvegarde vérifiée : (\d+) fiche\(s\), (\d+) photo\(s\)\. Restaurer comme nouvelles fiches \? Les fiches actuelles seront conservées\. Des doublons sont possibles\.$/s,(_,n,p)=>`Copia verificada: ${n} ficha(s), ${p} foto(s). ¿Restaurar como fichas nuevas? Se conservarán las actuales. Puede haber duplicados.`],
    [/^Photo (\d+) non réutilisable\. Original conservé ; remplacez-la dans la fiche\.$/s,(_,n)=>`La foto ${n} no se puede reutilizar. Se conserva el original; reemplázala en la ficha.`],
    [/^Photo (\d+) vide\.$/s,(_,n)=>`La foto ${n} está vacía.`],
    [/^Champ (.*) introuvable ou ambigu\. Formulaire modifié ou non chargé\.$/s,(_,k)=>`Campo ${k} ausente o ambiguo. El formulario ha cambiado o no se ha cargado.`],
    [/^Sélecteur (.*) absent ou ambigu\.$/s,(_,k)=>`Selector ${k} ausente o ambiguo.`],
    [/^Prix vérifié : (.*)$/s,(_,v)=>`Precio verificado: ${v}`],
    [/^Sélection vérifiée : (.*)$/s,(_,v)=>`Selección verificada: ${v}`],
    [/^Colis vérifié : (.*)$/s,(_,v)=>`Paquete verificado: ${v}`],
    [/^Manuel : (.*)$/s,(_,v)=>`Manual: ${translateOrion(v)}`],
    [/^(category|brand|condition) : (.*)$/s,(_,k,v)=>`${{category:'Categoría',brand:'Marca',condition:'Estado'}[k]}: ${translateOrion(v)}`],
    [/^(.*?) : (Manuel : .*|À vérifier dans Vinted|Prix vérifié : .*|Sélection vérifiée : .*|Colis vérifié : .*|État vérifié : .*)$/s,(_,k,v)=>`${translateOrion(k)}: ${translateOrion(v)}`],
    [/^Photo (\d+)(.*)$/s,(_,n,end)=>`Foto ${n}${end}`]
  ];
  for(const [regex,fn]of patterns)if(regex.test(trim))return render(trim.replace(regex,fn));
  return source;
}
async function initialiseOrionLanguage(){
  let local,shared;
  try{const value=localStorage.getItem(LANGUAGE_KEY);if(value==='fr'||value==='es'){orionLanguage=value;return;}if(value)local=JSON.parse(value);}catch{}
  try{if(typeof GM_getValue==='function'){const value=await GM_getValue(LANGUAGE_KEY,'');if(value)shared=JSON.parse(value);}}catch{}
  const pref=[local,shared].filter(p=>p && ['fr','es'].includes(p.lang)).sort((a,b)=>(b.at||0)-(a.at||0))[0];
  orionLanguage=pref?.lang || 'es';
}
const localisationRoots=[];
function attachOrionLanguage(root,container){
  const originals=new WeakMap(),attributes=new WeakMap();
  const skip=node=>node.parentElement?.closest('style,script,input,textarea,[data-orion-user],[data-orion-languages]');
  function paint(){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(skip(node))continue;
      const last=originals.get(node);const source=last && node.data===last.rendered?last.source:node.data;
      const rendered=translateOrion(source);originals.set(node,{source,rendered});if(node.data!==rendered)node.data=rendered;
    }
    for(const el of root.querySelectorAll('[aria-label],[placeholder],[alt]')){
      if(el.closest('[data-orion-user],[data-orion-languages]'))continue;
      let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
      for(const key of ['aria-label','placeholder','alt'])if(el.hasAttribute(key)){
        const current=el.getAttribute(key),last=saved[key],source=last && current===last.rendered?last.source:current,rendered=translateOrion(source);
        saved[key]={source,rendered};if(rendered!==current)el.setAttribute(key,rendered);
      }
    }
    root.host.lang=orionLanguage;
    for(const button of nav.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.lang===orionLanguage));
  }
  const nav=document.createElement('nav');nav.dataset.orionLanguages='';nav.setAttribute('aria-label','Idioma / Langue');nav.style.cssText='display:flex;gap:6px;justify-content:flex-end;padding:4px 0 10px;position:relative;z-index:2';
  for(const [lang,label]of [['es','🇪🇸 Español'],['fr','🇫🇷 Français']]){const button=document.createElement('button');button.type='button';button.dataset.lang=lang;button.textContent=label;button.setAttribute('aria-label',lang==='es'?'Español':'Français');button.style.cssText='font:14px -apple-system,sans-serif;padding:8px;min-height:44px;border:1px solid #087b67;border-radius:10px;color:#087b67;background:white;cursor:pointer';button.onclick=async()=>{orionLanguage=lang;const pref=JSON.stringify({lang,at:Date.now()});try{localStorage.setItem(LANGUAGE_KEY,pref);}catch{}try{if(typeof GM_setValue==='function')await GM_setValue(LANGUAGE_KEY,pref);}catch{}for(const update of localisationRoots)update();};nav.append(button);}
  container.prepend(nav);localisationRoots.push(paint);new MutationObserver(paint).observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','alt']});paint();
}
function orionConfirm(message){return window.confirm(translateOrion(message));}
function listingForOrion(p){return [p.title,p.description,...[['Prix','price'],['Catégorie','category'],['Marque','brand'],['État','condition'],['Colis','shipping']].map(([label,key])=>`${translateOrion(label)} : ${key==='price'?p.price.toFixed(2)+' €':p[key]}`)].join('\n\n');}

await initialiseOrionLanguage();
// No network access. Existing records are normalized in memory, never rewritten on open.
const DB_NAME = 'orion-express-db';
const MAX_BACKUP = 100 * 1024 * 1024;
const uid = () => crypto.randomUUID();
const clone = value => structuredClone(value);
function remaining(p) { return p.initialStock - p.sales.reduce((n, s) => n + s.quantity, 0); }
function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Fiche invalide.');
  const p = { ...clone(raw), schemaVersion: 2 };
  for (const key of ['title','description','category','brand','condition','shipping']) p[key] = String(raw[key] ?? '');
  p.price = Number(String(raw.price ?? 0).replace(',', '.').replace(/\s*€$/, ''));
  p.photos = raw.photos === undefined ? [] : clone(raw.photos);
  p.initialStock = raw.initialStock === undefined ? 1 : raw.initialStock;
  p.sales = raw.sales === undefined ? [] : clone(raw.sales);
  validate(p);
  return p;
}
function validate(p) {
  if (!(typeof p.id === 'string' && p.id.length || typeof p.id === 'number' && Number.isFinite(p.id))) throw new Error('Identifiant invalide.');
  if (!Number.isFinite(p.price) || p.price < 0) throw new Error('Prix invalide.');
  if (!Number.isSafeInteger(p.initialStock) || p.initialStock < 0) throw new Error('Stock initial invalide.');
  if (!Array.isArray(p.photos) || !Array.isArray(p.sales)) throw new Error('Photos ou ventes invalides.');
  for (const s of p.sales) {
    if (!s || !Number.isSafeInteger(s.quantity) || s.quantity <= 0 || !Number.isFinite(s.unitPrice) || s.unitPrice < 0 || !Number.isFinite(Date.parse(s.date))) throw new Error('Vente invalide.');
  }
  if (remaining(p) < 0) throw new Error('Stock insuffisant.');
  return p;
}
function errorMessage(e) {
  if (e?.name === 'QuotaExceededError') return 'Stockage plein : aucune modification enregistrée. Exportez une sauvegarde et libérez de l’espace.';
  if (e?.name === 'SecurityError') return 'Stockage inaccessible. Utilisez un onglet normal et autorisez le stockage du site.';
  return e?.message || 'Opération impossible. Les données existantes sont conservées.';
}
function openDB(factory = indexedDB) {
  return new Promise((resolve, reject) => {
    // No hard-coded version: retain the original version and object store.
    const req = factory.open(DB_NAME);
    let blocked = false;
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('products')) req.result.createObjectStore('products', { keyPath: 'id' });
    };
    req.onblocked = () => { blocked = true; reject(new Error('Fermez les autres onglets example.com puis réessayez.')); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      if (!db.objectStoreNames.contains('products')) { db.close(); reject(new Error('Schéma V1 non reconnu : aucune donnée modifiée.')); return; }
      const store = db.transaction('products').objectStore('products');
      if (store.keyPath !== 'id' && store.keyPath !== null) { db.close(); reject(new Error('Clé V1 non reconnue : aucune donnée modifiée.')); return; }
      resolve(db);
    };
  });
}
class Products {
  constructor(db) { this.db = db; }
  transaction(mode, run) {
    return new Promise((resolve, reject) => {
      let result, failure;
      const tx = this.db.transaction('products', mode);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => {}; // onabort is authoritative: requests may succeed before commit fails.
      tx.onabort = () => reject(failure || tx.error || new Error('Transaction annulée.'));
      const store = tx.objectStore('products');
      const fail = e => { failure = e; tx.abort(); };
      try { run(store, v => { result = v; }, fail); } catch (e) { fail(e); }
    });
  }
  allRaw() { return this.transaction('readonly', (s, done, fail) => {
    const records = s.getAll();
    s.getAllKeys().onsuccess = e => {
      const rows = records.result;
      if (rows.some((p,i) => p.id !== e.target.result[i])) { fail(new Error('Clés V1 non reconnues : aucune donnée modifiée.')); return; }
      done(rows);
    };
  }); }
  async all() { return (await this.allRaw()).map(normalize); }
  get(id) { return this.transaction('readonly', (s, done, fail) => { s.get(id).onsuccess = e => { try { done(e.target.result === undefined ? undefined : normalize(e.target.result)); } catch (err) { fail(err); } }; }); }
  mutate(id, change) {
    return this.transaction('readwrite', (s, done, fail) => {
      s.get(id).onsuccess = e => {
        try {
          const old = e.target.result;
          const next = normalize(change(old === undefined ? undefined : normalize(old)));
          if (old && old.schemaVersion !== 2) next.legacyV1 = clone(old);
          next.updatedAt = new Date(Math.max(Date.now(), (Date.parse(old?.updatedAt) || 0) + 1)).toISOString();
          if (s.keyPath === null) s.put(next, id); else s.put(next);
          done(next);
        } catch (err) { fail(err); }
      };
    });
  }
  create(fields = {}) {
    const id = uid();
    return this.mutate(id, () => ({ ...fields, id, initialStock: fields.initialStock ?? 1, sales: fields.sales ?? [], photos: fields.photos ?? [] }));
  }
  update(id, patch, expected = null) { return this.mutate(id, old => {
    if (!old) throw new Error('Fiche introuvable.');
    if (expected !== null && old.updatedAt !== expected.updatedAt) throw new Error('Cette fiche a changé dans un autre onglet. Vos modifications ne sont pas enregistrées ; copiez votre texte puis rouvrez la fiche.');
    return { ...old, ...patch, id };
  }); }
  async duplicate(id) {
    const old = await this.get(id);
    if (!old) throw new Error('Fiche introuvable.');
    const { legacyV1, ...fields } = old;
    return this.create({ ...fields, title: old.title + ' (copie)', sales: [], initialStock: old.initialStock });
  }
  sell(id, quantity, unitPrice) {
    return this.mutate(id, old => {
      if (!old) throw new Error('Fiche introuvable.');
      return { ...old, sales: [...old.sales, { id: uid(), date: new Date().toISOString(), quantity, unitPrice }] };
    });
  }
  remove(id) { return this.transaction('readwrite', (s) => { s.delete(id); }); }
  importCopies(records) {
    // Prevalidate all records before opening the single atomic transaction; never overwrite a key.
    const copies = records.map(raw => normalize({ ...raw, id: uid(), importedFrom: raw.id }));
    return this.transaction('readwrite', (s, done) => {
      for (const p of copies) { if (s.keyPath === null) s.add(p, p.id); else s.add(p); }
      done(copies.length);
    });
  }
}
function blobData(blob) {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r.readAsDataURL(blob); });
}
async function photoURL(photo) {
  if (photo instanceof Blob) return blobData(photo);
  if (typeof photo === 'string' && /^data:image\/(png|jpeg|jpg|webp|gif|avif|heic|heif);base64,/i.test(photo)) return photo;
  if (photo && typeof photo === 'object') {
    for (const key of ['dataUrl','dataURL','data','blob','url','src']) if (photo[key] !== undefined) return photoURL(photo[key]);
  }
  // Never fetch a remote photo or use an ephemeral blob URL as a durable backup.
  throw new Error('Format photo V1 non affichable. Original conservé ; exportez avant de le remplacer.');
}
async function pack(value) {
  if (value instanceof Blob) return { __orionBlob: 1, type: value.type, name: value.name ?? null, data: await blobData(value) };
  if (Array.isArray(value)) return Promise.all(value.map(pack));
  if (value && typeof value === 'object') {
    if (Object.hasOwn(value, '__orionBlob')) throw new Error('Champ réservé dans la sauvegarde.');
    const out = Object.create(null);
    for (const [k, v] of Object.entries(value)) out[k] = await pack(v);
    return out;
  }
  return value;
}
function unpack(value) {
  if (value && typeof value === 'object' && value.__orionBlob === 1) {
    if (typeof value.data !== 'string' || !/^data:[^,]*;base64,/.test(value.data)) throw new Error('Photo corrompue.');
    const bytes = Uint8Array.from(atob(value.data.split(',')[1]), c => c.charCodeAt(0));
    return value.name === null ? new Blob([bytes], { type: value.type }) : new File([bytes], value.name, { type: value.type });
  }
  if (Array.isArray(value)) return value.map(unpack);
  if (value && typeof value === 'object') {
    const out = Object.create(null);
    for (const [k,v] of Object.entries(value)) {
      if (['__proto__','constructor','prototype'].includes(k)) throw new Error('Champ interdit.');
      out[k] = unpack(v);
    }
    return out;
  }
  return value;
}
async function digest(text) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2,'0')).join('');
}
async function exportBackup(records) {
  const payload = JSON.stringify(await pack(records));
  const text = JSON.stringify({ format: 'orion-express', version: 2, createdAt: new Date().toISOString(), sha256: await digest(payload), payload });
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo : export annulé.');
  return text;
}
async function readBackup(text) {
  if (new Blob([text]).size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
  const b = JSON.parse(text);
  if (b.format !== 'orion-express' || b.version !== 2 || typeof b.payload !== 'string' || await digest(b.payload) !== b.sha256) throw new Error('Sauvegarde non reconnue ou intégrité invalide.');
  const records = unpack(JSON.parse(b.payload));
  if (!Array.isArray(records)) throw new Error('Liste de fiches invalide.');
  records.forEach(normalize);
  return records;
}
const listing = p => [p.title, p.description, `Prix : ${p.price.toFixed(2)} €`, `Catégorie : ${p.category}`, `Marque : ${p.brand}`, `État : ${p.condition}`, `Colis : ${p.shipping}`].join('\n\n');

// Independent local workspace: never opens or modifies the product database.
const VINTED_NEW = 'https://www.vinted.es/items/new';
const PREP_FIELDS = [['title','Titre / Título'],['description','Description / Descripción'],['price','Prix / Precio'],['category','Catégorie / Categoría'],['brand','Marque / Marca'],['condition','État / Estado'],['shipping','Colis / Tamaño del paquete']];
function prepareProduct(raw) {
  const p = normalize(raw);
  if (!p.title.trim() || !p.description.trim() || p.price <= 0 || !p.photos.length || remaining(p) < 1) throw new Error('Ajoutez un titre, une description, un prix positif, au moins une photo et du stock avant de préparer.');
  const fields = Object.fromEntries(PREP_FIELDS.map(([key]) => [key,key === 'price' ? p.price.toFixed(2).replace('.',',') : p[key]]));
  return {id:'active', version:1, sourceId:p.id, createdAt:new Date().toISOString(), fields, photos:structuredClone(p.photos), checked:{}, categoryChecked:false};
}
function checkPreparation(p, key, checked) {
  if (![...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'].includes(key)) throw new Error('Étape inconnue.');
  const next = structuredClone(p); next.checked[key] = checked;
  if (key === 'category') { next.checked.dynamic=false; next.checked.brand=false; next.checked.condition=false; next.checked.shipping=false; next.checked.review=false; }
  if (key !== 'review') next.checked.review=false;
  return next;
}
function prepStore() {
  return new Promise((resolve,reject) => {
    const q=indexedDB.open('orion-express-preparations',1);
    q.onupgradeneeded=()=>q.result.createObjectStore('workspace',{keyPath:'id'});
    q.onerror=()=>reject(q.error); q.onblocked=()=>reject(new Error('Fermez les autres onglets Orion Express puis réessayez.'));
    q.onsuccess=()=>{ const db=q.result; db.onversionchange=()=>db.close(); resolve({
      run(mode,op) { return new Promise((yes,no)=>{let value;const tx=db.transaction('workspace',mode);tx.oncomplete=()=>yes(value);tx.onabort=()=>no(tx.error || new Error('Préparation non enregistrée.'));tx.onerror=()=>{}; const req=op(tx.objectStore('workspace')); if(req) req.onsuccess=()=>{value=req.result;};}); },
      async get(){return this.run('readonly',s=>s.get('active'));},
      async put(p){await this.run('readwrite',s=>s.put(p));},
      async clear(){await this.run('readwrite',s=>s.delete('active'));},
      close(){db.close();}
    });};
  });
}
async function preparedFiles(p) {
  const files=[];
  for(let i=0;i<p.photos.length;i++) {
    const url=await photoURL(p.photos[i]);
    const match=/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(url);
    if(!match) throw new Error(`Photo ${i+1} non réutilisable. Original conservé ; remplacez-la dans la fiche.`);
    const bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));
    if(!bytes.length) throw new Error(`Photo ${i+1} vide.`);
    const type=match[1].toLowerCase(); const ext=type.split('/')[1].replace('jpeg','jpg');
    files.push(new File([bytes],`orion-photo-${String(i+1).padStart(2,'0')}.${ext}`,{type}));
  }
  return files;
}
// ZIP STORE with CRC32, UTF-8 names, no dependency and no remote service.
async function photoArchive(files, fields) {
  const text=PREP_FIELDS.map(([k,label])=>`${label} :\n${fields[k] || 'À choisir dans Vinted'}`).join('\n\n');
  const all=[...files,new File([text],'annonce.txt',{type:'text/plain'})], chunks=[],central=[];
  let offset=0;
  for(const f of all) {
    const data=new Uint8Array(await f.arrayBuffer()),name=new TextEncoder().encode(f.name);
    let crc=0xffffffff;
    for(const byte of data){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crc=(crc^0xffffffff)>>>0;
    const header=new Uint8Array(30+name.length), h=new DataView(header.buffer);
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);header.set(name,30);
    const entry=new Uint8Array(46+name.length),c=new DataView(entry.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);
    chunks.push(header,data);central.push(entry);offset+=header.length+data.length;
  }
  const size=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,all.length,true);e.setUint16(10,all.length,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
  return new File([...chunks,...central,end],'orion-vinted-photos.zip',{type:'application/zip'});
}

// Experimental, user-triggered DOM adapter. Never submits or saves a listing.
const TRANSFER_KEY='orion-express-transfer-3.1';
const hasBridge=()=>typeof GM_getValue==='function' && typeof GM_setValue==='function';
async function stageTransfer(product) {
  const p=normalize(product); prepareProduct(p); // same completeness and stock validation
  const snapshot={...p,legacyV1:undefined};
  const backup=await exportBackup([snapshot]);
  if(new Blob([backup]).size>40*1024*1024)throw new Error('Transfert supérieur à 40 Mo. Utilisez le partage manuel des photos.');
  const transfer={version:1,nonce:uid(),createdAt:Date.now(),backup};
  await GM_setValue(TRANSFER_KEY,JSON.stringify(transfer));
  const saved=await GM_getValue(TRANSFER_KEY,'');
  if(saved!==JSON.stringify(transfer))throw new Error('Transfert local non confirmé. Réessayez ou utilisez la préparation manuelle.');
  return transfer;
}
async function readTransfer() {
  const raw=await GM_getValue(TRANSFER_KEY,'');if(!raw)throw new Error('Aucun produit transmis. Revenez à Orion Express et préparez une fiche.');
  const t=JSON.parse(raw);
  if(t.version!==1 || !t.nonce || Date.now()-t.createdAt>24*60*60*1000)throw new Error('Transfert expiré : préparez de nouveau la fiche dans Orion Express.');
  const products=await readBackup(t.backup);if(products.length!==1)throw new Error('Transfert invalide.');
  return {transfer:t,product:normalize(products[0])};
}
function setNativeValue(input,value) {
  if(!input || input.disabled || input.readOnly)throw new Error('Champ absent ou non modifiable.');
  const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(!setter)throw new Error('Type de champ non pris en charge.');
  setter.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();
}
function transferFiles(input,files) {
  if(!input || input.type!=='file' || input.disabled || (!input.multiple && files.length>1))throw new Error('Sélecteur photo absent ou incompatible.');
  if(input.files.length)throw new Error('Des photos sont déjà présentes. Aucun remplacement automatique.');
  const dt=new DataTransfer();for(const file of files)dt.items.add(file);
  input.files=dt.files;
  if(input.files.length!==files.length)throw new Error('Le navigateur refuse le transfert des photos.');
  input.dispatchEvent(new Event('change',{bubbles:true}));input.dispatchEvent(new Event('input',{bubbles:true}));
}
const visible=e=>!!e && !!(e.getClientRects().length) && !e.disabled;
function uniqueField(doc,id,tag='INPUT') {
  const list=[...doc.querySelectorAll(`[id="${id}"]`)].filter(e=>e.tagName===tag && visible(e));
  if(list.length!==1)throw new Error(`Champ ${id} introuvable ou ambigu. Formulaire modifié ou non chargé.`);
  return list[0];
}
async function waitFor(find,ms=2500) {
  const end=Date.now()+ms;while(Date.now()<end){const result=find();if(result)return result;await new Promise(r=>setTimeout(r,100));}throw new Error('Composant Vinted non reconnu ou trop lent. Choisissez cette valeur manuellement.');
}
const fold=s=>String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
function parseVintedPrice(raw) {
  if(typeof raw==='number') {if(!Number.isFinite(raw)||raw<0||!Number.isSafeInteger(Math.round(raw*100))||Math.abs(raw*100-Math.round(raw*100))>0.000001)throw new Error('Prix invalide.');return raw;}
  if(typeof raw!=='string')throw new Error('Prix invalide.');
  const text=raw.trim().replace(/\s*€$/,'').trim();
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(text))throw new Error('Prix invalide : utilisez par exemple 10, 10.00, 10,00 ou 10 €.');
  return parseVintedPrice(Number(text.replace(',','.')));
}
async function setVintedPrice(doc,raw) {
  const amount=parseVintedPrice(raw); // validate before touching the DOM
  const el=await waitFor(()=>{try{return uniqueField(doc,'price');}catch{return null;}},4500);
  const previous=el.value;
  const existing=(()=>{try{return parseVintedPrice(previous);}catch{return null;}})();
  if(existing!==null && existing!==0 && existing!==amount)throw new Error('Le prix contient déjà une autre valeur ; aucun écrasement.');
  el.focus();setNativeValue(el,amount.toFixed(2));
  await waitFor(()=>{try{return parseVintedPrice(el.value)===amount;}catch{return false;}},4500);
  // Allow a delayed formatting/controlled-state update, then check again.
  await new Promise(r=>setTimeout(r,250));
  if(parseVintedPrice(el.value)!==amount)throw new Error('Prix non conservé après formatage.');
  return `Prix vérifié : ${amount.toFixed(2)} €`;
}
const isVintedSelected=e=>{
  if(!e)return false;
  const native=e.matches('input[type=radio]')?e:e.querySelector('input[type=radio]');
  if(e.hasAttribute('aria-checked'))return e.getAttribute('aria-checked')==='true' && (!native || native.checked);
  return native?.checked===true || e.getAttribute('aria-selected')==='true';
};
async function waitForStable(find,stableMs=700,ms=4500){
  let since=0;
  return waitFor(()=>{if(!find()){since=0;return false;}if(!since)since=Date.now();return Date.now()-since>=stableMs;},ms);
}
const selectedText=e=>e?.querySelector('[data-testid$="--value"]')?.textContent ?? (e?.matches('input,select')?e.value:e?.textContent) ?? '';
function parts(value){return String(value).split(/\s*(?:>|›)\s*/).map(v=>v.trim()).filter(Boolean);}
function optionInfo(el,target) {
  const leaves=[...el.querySelectorAll('div,span,label')].filter(n=>fold(n.textContent)===fold(target));
  const matches=fold(el.textContent)===fold(target) || leaves.length>0 || fold(el.getAttribute('aria-label'))===fold(target);
  if(!matches)return null;
  const title=el.querySelector('[data-testid$="--title"],[class*="Cell__title"]')?.textContent || target;
  if(fold(title)!==fold(target))return null;
  const body=el.querySelector('[class*="Cell__body"],[data-orion-path]')?.textContent || String(el.textContent).trim().slice(String(title).trim().length).trim();
  return {el,title:String(title).trim(),path:parts(body)};
}
function popupFor(doc,trigger,option) {
  const owned=doc.getElementById(trigger.getAttribute('aria-controls') || '');
  return owned || option?.closest('[role=dialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]') || [...doc.querySelectorAll('[role=dialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]')].filter(visible).at(-1);
}
async function selectVintedChoice(doc,id,value) {
  if(id==='condition')return selectVintedCondition(doc,value);
  const path=parts(value);if(!path.length)throw new Error('Valeur manquante dans la fiche.');const target=path.at(-1);
  const trigger=await waitFor(()=>{const list=[...doc.querySelectorAll(`[id="${id}"]`)].filter(visible);return list.length===1?list[0]:null;},4500);
  const searchId=id==='category'?'catalog-search-input':`${id}-search-input`;
  const menuVisible=()=>visible(doc.getElementById(searchId)) || visible(popupFor(doc,trigger));
  if(fold(selectedText(trigger))===fold(target) && path.length===1 && trigger.getAttribute('aria-expanded')!=='true' && !menuVisible())return `Sélection vérifiée : ${target}`;
  if(trigger.getAttribute('aria-expanded')!=='true' && !menuVisible())trigger.click();
  try {
    const search=await waitFor(()=>{
      const exact=doc.getElementById(searchId);
      if(visible(exact))return exact;
      const popup=popupFor(doc,trigger);return popup && [...popup.querySelectorAll('input')].find(e=>visible(e) && /search/i.test(e.id+e.getAttribute('placeholder')));
    },id==='condition'?500:1800).catch(()=>null);
    if(search)setNativeValue(search,target);
    let chosen;
    const findChoice=()=>{
      const scope=popupFor(doc,trigger) || doc;
      const nodes=[...scope.querySelectorAll('[role=option],[role=radio]')].filter(visible);
      const matches=nodes.map(el=>optionInfo(el,target)).filter(Boolean).filter(info=>id!=='category' || path.length===1 || fold(info.path.join(' > '))===fold(path.slice(0,-1).join(' > ')));
      return matches.length===1?matches[0]:null;
    };
    chosen=await waitFor(findChoice,4500);
    const menuRoot=popupFor(doc,trigger,chosen.el);
    const closed=()=>doc.getElementById(id)?.getAttribute('aria-expanded')!=='true' && fold(selectedText(doc.getElementById(id)))===fold(target) && !findChoice() && (!menuRoot || !menuRoot.isConnected || !visible(menuRoot)) && (!search || !visible(doc.getElementById(search.id)));
    // Selection belongs to the live component. A nested native checked flag alone is not enough.
    if(!isVintedSelected(chosen.el))chosen.el.click();
    try{await waitFor(()=>isVintedSelected(findChoice()?.el)||closed(),500);}catch{
      const cell=findChoice()?.el;
      const radio=cell?.matches('input[type=radio]')?cell:cell?.querySelector('input[type=radio]');
      if(radio && !radio.disabled)radio.click(); // only the same exact option, once
    }
    await waitFor(()=>isVintedSelected(findChoice()?.el)||closed(),3500);
    // Only exact confirmation labels; never Add/Publish/Save draft.
    const confirm=await waitFor(()=>{
      if(closed())return {closed:true};
      if(!isVintedSelected(findChoice()?.el))return null;
      const scope=popupFor(doc,trigger,findChoice()?.el) || doc;
      const buttons=[...scope.querySelectorAll('button')].filter(e=>visible(e) && e.getAttribute('aria-disabled')!=='true' && ['fait','listo','hecho','done'].includes(fold(e.textContent)));
      if(buttons.length===1)return {button:buttons[0]};return null;
    },4500);
    if(confirm.button){if(!isVintedSelected(findChoice()?.el))throw new Error('Option non sélectionnée : confirmation annulée.');confirm.button.click();}
    await waitForStable(closed,300);
    return `Sélection vérifiée : ${chosen.title}${id==='category' && chosen.path.length?' ('+chosen.path.join(' > ')+')':''}`;
  }catch(e){throw new Error(`${id} : ${errorMessage(e)}`);}
}
function vintedShippingSize(value){
  const aliases={petit:1,pequeno:1,small:1,moyen:2,mediano:2,medium:2,grand:3,grande:3,large:3};const size=aliases[fold(value)];
  if(!size)throw new Error('Format du colis non reconnu ou manquant dans la fiche.');
  return size;
}
function shippingSelected(doc,size){
  const radio=doc.getElementById(`package_type_selector_${size}`),cell=doc.getElementById(`package-size-${size}`);
  if(!radio || !cell || !visible(cell) || !radio.checked)return false;
  if([...doc.querySelectorAll('input[id^="package_type_selector_"]:checked')].some(e=>e!==radio))return false;
  if(cell.hasAttribute('aria-checked') && cell.getAttribute('aria-checked')!=='true')return false;
  // The real Vinted selected cell becomes role=presentation; unselected cells remain role=button.
  const cells=[...doc.querySelectorAll('[id^="package-size-"]')];
  if(cells.some(e=>e.getAttribute('role')==='presentation') && cell.getAttribute('role')!=='presentation')return false;
  return true;
}
async function selectVintedShipping(doc,value) {
  const size=vintedShippingSize(value);
  await waitFor(()=>{const cell=doc.getElementById(`package-size-${size}`);return visible(cell) && doc.getElementById(`package_type_selector_${size}`);},6000);
  for(let attempt=0;attempt<2;attempt++){
    if(!shippingSelected(doc,size)) {
      const cell=doc.getElementById(`package-size-${size}`),radio=doc.getElementById(`package_type_selector_${size}`);
      const label=[...cell.querySelectorAll('label')].find(l=>l.htmlFor===radio.id) || [...doc.querySelectorAll('label')].find(l=>l.htmlFor===radio.id);
      const control=[cell,label,radio].find(visible);if(!control)throw new Error('Choix du colis non accessible.');control.click();
      try{await waitFor(()=>shippingSelected(doc,size),600);}catch{const liveRadio=doc.getElementById(`package_type_selector_${size}`);if(liveRadio && !liveRadio.disabled)liveRadio.click();}
    }
    try{await waitForStable(()=>shippingSelected(doc,size),900,2200);return `Colis vérifié : ${value}`;}catch{if(attempt===1)throw new Error('Le colis demandé ne reste pas sélectionné. Vérifiez le format dans Vinted.');}
  }
}
async function applyVintedProduct(doc,product,report,{photos=true}={}) {
  const hadContent=['title','description'].some(id=>String(doc.getElementById(id)?.value || '').trim());
  const results={};const attempt=async(key,fn)=>{try{const message=await fn();results[key]=message || 'À vérifier dans Vinted';}catch(e){results[key]='Manuel : '+errorMessage(e);}report({...results});};
  // Text first: no submit, no buttons selected by generic text such as "Ajouter".
  for(const key of ['title','description'])await attempt(key,async()=>{
    const el=uniqueField(doc,key,key==='description'?'TEXTAREA':'INPUT');
    const value=product[key];
    if(el.value && el.value!==String(value) && !(key==='price' && Number(el.value.replace('€','').replace(',','.').trim())===0))throw new Error('Ce champ contient déjà une autre valeur ; aucun écrasement.');
    setNativeValue(el,value);if(el.value!==String(value))throw new Error('Valeur non conservée par le formulaire.');
  });
  await attempt('price',()=>setVintedPrice(doc,product.price));
  await attempt('category',()=>selectVintedChoice(doc,'category',product.category));
  for(const key of ['brand','condition'])await attempt(key,()=>{if(results.category?.startsWith('Manuel'))throw new Error('Choisissez et confirmez la catégorie avant ce champ.');return selectVintedChoice(doc,key,product[key]);});
  if(photos)await attempt('photos',async()=>{
    if(hadContent)throw new Error('Le formulaire contenait déjà du texte : ajout automatique de photos désactivé pour éviter les doublons.');
    const inputs=[...doc.querySelectorAll('input[type=file]')].filter(e=>!e.disabled && e.multiple);
    if(inputs.length!==1)throw new Error('Sélecteur photo absent ou ambigu.');
    const files=await preparedFiles({photos:product.photos});transferFiles(inputs[0],files);
    results.photos='Fichiers transmis au sélecteur ; téléversement à vérifier';
  });
  // Photos/category loading can rebuild parcel controls. Select the requested parcel last.
  const verifyCategory=async()=>{
    const target=parts(product.category).at(-1);
    await waitForStable(()=>{const trigger=doc.getElementById('category');return trigger && fold(selectedText(trigger))===fold(target) && trigger.getAttribute('aria-expanded')!=='true' && !visible(doc.getElementById('catalog-search-input'));},400);
    return results.category;
  };
  if(!results.category?.startsWith('Manuel'))await attempt('category',verifyCategory);
  await attempt('shipping',()=>{if(results.category?.startsWith('Manuel'))throw new Error('Choisissez et confirmez la catégorie avant ce champ.');return selectVintedShipping(doc,product.shipping);});
  if(!results.category?.startsWith('Manuel'))await attempt('category',verifyCategory);
  // Additional category attributes have no mapping in V1/V2: never guess them.
  results.dynamic='Manuel : vérifiez tous les champs supplémentaires de la catégorie';report({...results});return results;
}

// Explicit semantic mapping only. The product schema remains a string.
const ORION_CONDITIONS=[
 {key:'new_with_tags',fr:'Neuf avec étiquette',es:'Nuevo con etiquetas',aliases:['Neuf avec étiquettes','Nuevo con etiqueta','New with tags']},
 {key:'new_without_tags',fr:'Neuf sans étiquette',es:'Nuevo sin etiquetas',aliases:['Neuf sans étiquettes','Nuevo sin etiqueta','New without tags']},
 {key:'very_good',fr:'Très bon état',es:'Muy bueno',aliases:['Muy buen estado','Very good']},
 {key:'good',fr:'Bon état',es:'Bueno',aliases:['Buen estado','Good']},
 {key:'fair',fr:'Satisfaisant',es:'Satisfactorio',aliases:['Aceptable','Fair']}
];
const conditionKey=value=>String(value??'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
function resolveOrionCondition(value){
 const text=conditionKey(value);
 if(['neuf','nuevo','new'].includes(text))throw new Error('État ambigu : choisissez Neuf avec étiquette ou Neuf sans étiquette dans la fiche produit.');
 const match=ORION_CONDITIONS.find(c=>[c.key,c.fr,c.es,...c.aliases].some(v=>conditionKey(v)===text));
 if(!match)throw new Error('État absent ou non reconnu : choisissez un état précis dans la fiche produit.');return match;
}
function conditionEditorChoices(current=''){
 let known;try{known=resolveOrionCondition(current);}catch{}
 return [
 {value:'',label:'Choisir un état précis',selected:!current},
 ...(current&&!known?[{value:String(current),label:`État actuel à préciser : ${current}`,selected:true}]:[]),
 ...ORION_CONDITIONS.map(c=>({value:known?.key===c.key?String(current):c.fr,label:c.fr,selected:known?.key===c.key}))
 ];
}
function conditionOfCell(cell){
 const explicit=cell.querySelector('[data-testid$="--title"],[class*="Cell__title"]');
 const title=explicit?.textContent || cell.getAttribute('aria-label') || cell.textContent;
 // A description appended to a condition is not an alias. Inspect exact nested labels.
 const candidates=explicit?[title]:[title,...[...cell.querySelectorAll('span,div,label')].map(e=>e.textContent)];
 const matches=new Map();for(const label of candidates){try{const c=resolveOrionCondition(label);matches.set(c.key,c);}catch{}}
 return matches.size===1?[...matches.values()][0]:null;
}
const conditionSelected=cell=>{
 if(!cell)return false;
 // aria-checked on the component is authoritative; native checked alone may be a DOM-only change.
 if(cell.hasAttribute('aria-checked')){const input=cell.querySelector('input[type=radio]');return cell.getAttribute('aria-checked')==='true' && (!input || input.checked);}
 return cell.matches('input[type=radio]')?cell.checked:!!cell.querySelector('input[type=radio]:checked');
};
async function selectVintedCondition(doc,value){
 const desired=resolveOrionCondition(value); // Reject "Neuf" before opening the menu.
 const trigger=await waitFor(()=>{const list=[...doc.querySelectorAll('[id="condition"]')].filter(visible);return list.length===1?list[0]:null;},4500);
 const currentMatches=()=>{try{return resolveOrionCondition(selectedText(doc.getElementById('condition'))).key===desired.key;}catch{return false;}};
 const menuAlreadyVisible=()=>{const scope=popupFor(doc,trigger);return scope && visible(scope) && [...scope.querySelectorAll('[role=radio],[role=option]')].some(cell=>visible(cell)&&conditionOfCell(cell));};
 if(currentMatches() && trigger.getAttribute('aria-expanded')!=='true' && !menuAlreadyVisible())return `État vérifié : ${selectedText(trigger)}`;
 if(trigger.getAttribute('aria-expanded')!=='true')trigger.click();
 let chosen;
 const findCell=()=>{
   const scope=popupFor(doc,trigger) || doc;
   const matches=[...scope.querySelectorAll('[role=radio],[role=option]')].filter(visible).filter(cell=>conditionOfCell(cell)?.key===desired.key);
   return matches.length===1?matches[0]:null;
 };
 chosen=await waitFor(findCell,4500);
 const menuRoot=popupFor(doc,trigger,chosen);
 // Click the actual semantic cell, not a nested radio whose DOM checked state can bypass the component.
 chosen.click();
 const closed=()=>currentMatches() && doc.getElementById('condition')?.getAttribute('aria-expanded')!=='true' && (!findCell()) && (!menuRoot || !menuRoot.isConnected || !visible(menuRoot));
 // Some mobile variants bind only the native radio's change handler. Retry that same precise option once.
 try{await waitFor(()=>conditionSelected(findCell()) || closed(),500);}catch{const cell=findCell();const input=cell?.matches('input[type=radio]')?cell:cell?.querySelector('input[type=radio]');if(input && !input.disabled)input.click();}
 await waitFor(()=>conditionSelected(findCell()) || closed(),3500);
 const action=await waitFor(()=>{
   if(closed())return {closed:true};
   const cell=findCell();if(!conditionSelected(cell))return null;
   const scope=popupFor(doc,trigger,cell) || doc;
   const buttons=[...scope.querySelectorAll('button')].filter(b=>visible(b) && b.getAttribute('aria-disabled')!=='true' && ['fait','listo','hecho','done'].includes(fold(b.textContent)));
   return buttons.length===1?{button:buttons[0]}:null;
 },4500);
 if(action.button){
   if(!conditionSelected(findCell()))throw new Error('État non coché : confirmation annulée.');
   action.button.click();
 }
 await waitFor(closed,4500);
 return `État vérifié : ${selectedText(doc.getElementById('condition'))}`;
}

const APP_CSS = ":host{all:initial;font:16px -apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#172b35}*{box-sizing:border-box}.shell{height:100%;overflow:auto;background:#f6f5ef;padding:24px max(20px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(20px,env(safe-area-inset-left));-webkit-overflow-scrolling:touch}header,header>div,.toolbar,.stats,.card,dl>div{display:flex;align-items:center}header{justify-content:space-between;max-width:900px;margin:auto}header>div{display:block}small{font-size:10px;letter-spacing:.14em;font-weight:700;color:#55716f}h1{font-size:28px;letter-spacing:-1px;margin:5px 0 12px}h1 em{font-family:Georgia,serif;font-weight:400;color:#087b67}h2{font-size:30px;line-height:1.12;letter-spacing:-.8px;margin:14px 0 22px}h3{font-size:18px;margin:10px 0}p{line-height:1.6}button,a,input,textarea{font:inherit}button,a{touch-action:manipulation}button{min-height:46px;padding:11px 16px;border:1px solid #cbd7cf;background:#fff;color:#172b35;border-radius:12px;font-weight:600;cursor:pointer}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #dc9a2b;outline-offset:3px}.primary{background:#087b67;border-color:#087b67;color:white}.origin{font-size:11px;max-width:900px;margin:8px auto 14px;color:#55716f}.hero{padding:28px;border-radius:22px;background:#e4ede4;margin-bottom:18px}.stats{gap:24px;margin-bottom:24px;font-size:13px}.stats b{display:block;font-size:27px}.toolbar{gap:8px;flex-wrap:wrap;margin:16px 0}.toolbar button{flex:1}.search{margin:24px 0 16px}label{display:block;font-weight:600;font-size:13px;margin:18px 0 8px}input,textarea{display:block;width:100%;margin-top:8px;padding:14px;border:1px solid #bdcbc3;border-radius:12px;background:white;color:#172b35;font-size:16px}textarea{resize:vertical}main,footer,#status{max-width:900px;margin:auto}.cards{display:grid;gap:12px}.card{width:100%;text-align:left;gap:16px;padding:14px}.card>div:nth-child(2){flex:1;min-width:0;overflow-wrap:anywhere}.card h3{font-size:18px;margin:5px 0}.card span{font-weight:400;font-size:13px}.thumb{width:64px;height:76px;flex-shrink:0;border-radius:10px;background:#eeeade;overflow:hidden;display:grid;place-items:center;font-size:30px}.thumb .photo,.thumb img{width:100%;height:76px;object-fit:cover}.thumb p{font-size:10px}.photo{border-radius:12px;overflow:hidden;background:#eeeade;min-width:0}.photo img{width:100%;height:180px;object-fit:contain;display:block}.photo button{font-size:12px;padding:8px;min-height:44px}.photo p{padding:12px;font-size:12px}.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}.hint,footer,.tip{font-size:12px;color:#55716f}.tip{border-top:1px solid #cbd7cf;margin-top:30px;padding-top:20px}.tip b{font-size:14px}.empty{padding:30px 18px;text-align:center;border:1px dashed #bdcbc3;border-radius:18px}.file{background:#e4ede4;border-radius:12px;padding:14px}.file input{font-size:13px;padding:8px}.save{position:sticky;bottom:8px;width:100%;margin-top:18px;box-shadow:0 5px 20px #172b3522}.price{font-size:28px;color:#087b67;font-weight:700}.description{white-space:pre-wrap;overflow-wrap:anywhere}dl>div{justify-content:space-between;border-bottom:1px solid #dce3dc;padding:12px 0;gap:12px}dt{font-size:13px;color:#55716f}dd{margin:0;overflow-wrap:anywhere;text-align:right}.danger{color:#a33030;border-color:#debcbc;margin:24px 0}.sales{padding-left:20px;line-height:1.8;font-size:13px}a{color:#087b67;display:inline-block;min-height:44px;padding:12px 0;overflow-wrap:anywhere}#status{font-size:13px;line-height:1.5;padding:10px 0;color:#087b67}#status.error{color:#a33030}footer{padding:28px 0 10px;line-height:1.7}article{padding-top:20px}#sale{display:flex;gap:10px;flex-wrap:wrap;align-items:end}#sale label{flex:1;min-width:100px}#sale button{margin-bottom:8px}@media(min-width:700px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{padding:40px}.hero h2{max-width:420px;font-size:44px}.photos{grid-template-columns:repeat(3,minmax(0,1fr))}form:not(#sale){max-width:650px}header{padding-top:12px}}@media(prefers-reduced-motion:no-preference){button{transition:background .15s}button:hover{filter:brightness(.97)}}\n\n.shell.mini{padding:6px 10px}.mini header small{display:none}.mini h1{font-size:18px;margin:0}.mini header{padding:0}.mini #minimize{min-height:44px}\n.prep-field{padding:16px 0;border-bottom:1px solid #cbd7cf}.check{display:flex;align-items:center;gap:12px;font-size:14px;line-height:1.5}.check input{width:24px;height:24px;flex-shrink:0;margin:0}.vinted-link{padding:14px 18px;border-radius:12px;text-decoration:none}#prep-summary{background:#e4ede4;padding:14px;border-radius:12px}#photo-zip{display:block}#resume-prep{margin-bottom:12px}\n\n.shell.mini>[data-orion-languages]{display:none!important}\n[hidden]{display:none!important}\n\n#product-condition{display:block;width:100%;margin:8px 0 18px;padding:14px;border:1px solid #bdcbc3;border-radius:12px;background:white;color:#172b35;font:16px -apple-system,sans-serif}\n";
async function launchVintedTest(product) {
  if(!hasBridge()){await startPreparation(product);status('Transfert extension indisponible : préparation manuelle ouverte.');return;}
  const t=await stageTransfer(product);
  const link=`https://www.vinted.es/items/new#orion=${encodeURIComponent(t.nonce)}`;
  main.innerHTML=`<button id="test-back">← Retour à la fiche</button><h2>Transfert prêt</h2><p>Produit et photos enregistrés dans le stockage de Violentmonkey ; transfert valable 24 heures. Aucun serveur de transfert.</p><a class="primary vinted-link" href="${link}" target="_self" rel="noreferrer">Ouvrir Vinted et préremplir (test) ↗</a><p>Ouverture dans cet onglet. Si iOS ouvre l’app Vinted, copiez le lien ci-dessous et collez-le dans la barre d’adresse d’Orion. Si Orion propose l’app, choisissez Jamais. Un script ne peut pas imposer ce choix à iOS.</p><button id="copy-vinted-link">Copier le lien pour Orion</button><textarea id="vinted-link-fallback" readonly hidden aria-label="Lien à coller dans Orion" rows="3"></textarea><p id="vinted-link-status" role="status"></p><p>Expérimental : contrôlez tous les champs et les images. Le script ne publie ni ne sauvegarde de brouillon. Les valeurs supplémentaires inconnues restent manuelles.</p><button id="manual-prep">Utiliser la préparation manuelle</button>`;
  bind('#copy-vinted-link',async()=>{
    const message=main.querySelector('#vinted-link-status');
    try{await navigator.clipboard.writeText(link);message.textContent='Lien copié. Collez-le dans la barre d’adresse d’Orion.';}
    catch{const field=main.querySelector('#vinted-link-fallback');field.value=link;field.hidden=false;field.focus();field.select();message.textContent='Appuyez longuement sur le lien sélectionné, puis Copier. Collez-le dans la barre d’adresse d’Orion.';}
  });
  bind('#test-back',()=>preview(product.id));bind('#manual-prep',()=>startPreparation(product));
}
async function initVintedAssistant(){
  const host=document.createElement('div');host.id='orion-vinted-test';host.style.cssText='position:fixed;right:calc(env(safe-area-inset-right, 0px) + 8px);bottom:calc(env(safe-area-inset-bottom, 0px) + 8px);z-index:2147483646;max-width:calc(100vw - 16px);width:auto';
  const root=host.attachShadow({mode:'open'});root.innerHTML=`<style>:host{font:15px -apple-system,sans-serif;color:#172b35}*{box-sizing:border-box}section{width:min(360px,calc(100vw - 16px));padding:14px;background:#f6f5ef;border:2px solid #087b67;border-radius:14px;max-height:55vh;overflow:auto}button,a{font:inherit;display:inline-block;padding:12px;min-height:44px;margin:4px;border-radius:9px;border:1px solid #087b67;background:white;color:#087b67}p,li{line-height:1.4}ul{padding-left:18px}textarea{width:100%;font-size:16px}#toggle{position:sticky;top:0;z-index:1}section.folded [data-orion-languages]{display:none!important}section.folded{width:auto;padding:0;border:0;background:transparent}section.folded #toggle{margin:0;padding:8px 12px;min-height:44px;border-radius:22px;background:#087b67;color:white}</style><section class="folded"><button id="toggle" aria-label="Ouvrir Orion" aria-expanded="false">Orion</button><div id="body" hidden><b>Orion Express · préremplissage expérimental</b><p id="status" role="status">Chargement du transfert local…</p><button id="fill" disabled>Préremplir une seule fois</button><button id="retry" disabled>Réessayer les textes et choix (sans photos)</button><ul id="result"></ul><p>Aucune publication ni sauvegarde de brouillon automatique. La présence dans un champ ne confirme pas sa validation par Vinted. Vérifiez les photos et les champs dépendants après chaque changement de catégorie.</p><a href="https://example.com/" target="_blank" rel="noopener">Retour au catalogue</a><button id="clear">Effacer le transfert local</button></div></section>`;document.body.append(host);
  attachOrionLanguage(root,root.querySelector('section'));
  const $=s=>root.querySelector(s);let busy=false,used=false,needsAttention=false,product,transfer;
  $('#toggle').onclick=()=>{const body=$('#body');body.hidden=!body.hidden;$('#toggle').textContent=body.hidden?(needsAttention?'Orion !':'Orion'):'Réduire';$('#toggle').setAttribute('aria-label',body.hidden?'Ouvrir Orion':'Réduire Orion');$('#toggle').setAttribute('aria-expanded',String(!body.hidden));root.querySelector('section').classList.toggle('folded',body.hidden);};
  const run=async(fn)=>{if(busy)return;busy=true;$('#fill').disabled=true;$('#retry').disabled=true;try{await fn();}catch(e){needsAttention=true;$('#status').textContent=errorMessage(e);if($('#body').hidden)$('#toggle').textContent='Orion !';}finally{busy=false;$('#fill').disabled=used||!product;$('#retry').disabled=!used||!product;}};
  const perform=async(photos)=>{
    if(location.pathname!=='/items/new')throw new Error('Ouvrez le formulaire de création Vinted.');
    if(!navigator.onLine)throw new Error('Connexion indisponible. Aucun transfert lancé.');
    uniqueField(document,'title');uniqueField(document,'description','TEXTAREA');
    if(photos){const lock=await GM_getValue(TRANSFER_KEY+'-used','');if(lock===transfer.nonce){used=true;throw new Error('Ce transfert a déjà été tenté. Reprenez les textes sans photos ou préparez de nouveau la fiche.');}await GM_setValue(TRANSFER_KEY+'-used',transfer.nonce);used=true;}
    const draw=results=>{needsAttention=Object.entries(results).some(([key,value])=>key!=='dynamic' && value.startsWith('Manuel'));if($('#body').hidden)$('#toggle').textContent=needsAttention?'Orion !':'Orion';$('#result').replaceChildren();for(const [k,v]of Object.entries(results)){const li=document.createElement('li');li.textContent=`${Object.fromEntries(PREP_FIELDS)[k] || ({photos:'Photos',dynamic:'Champs supplémentaires'})[k] || k} : ${v}`;$('#result').append(li);}};
    await applyVintedProduct(document,product,draw,{photos});$('#status').textContent='Tentative terminée. Vérifiez chaque champ et chaque miniature native Vinted. Rien n’a été publié.';
  };
  const fill=async photos=>{if(!navigator.locks?.request)throw new Error('Verrou de sécurité indisponible dans ce navigateur. Utilisez la préparation manuelle.');return navigator.locks.request('orion-express-fill',()=>perform(photos));};
  $('#fill').onclick=()=>run(()=>fill(true));$('#retry').onclick=()=>run(()=>fill(false));
  $('#clear').onclick=()=>run(async()=>{await GM_deleteValue(TRANSFER_KEY);product=null;$('#status').textContent='Transfert local effacé. Catalogue conservé.';});
  await run(async()=>{if(!hasBridge())throw new Error('Stockage Violentmonkey inaccessible. Vérifiez les autorisations du script.');({transfer,product}=await readTransfer());const expected=new URLSearchParams(location.hash.slice(1)).get('orion');if(expected && expected!==transfer.nonce)throw new Error('Ce lien correspond à un autre transfert. Préparez de nouveau la fiche.');$('#status').textContent=`Prêt : ${product.title}, ${product.photos.length} photo(s). Lancez le test lorsque le formulaire est chargé.`;if(expected){await waitFor(()=>visible(document.getElementById('title')),12000);await fill(true);}});
}

if(location.hostname === 'www.vinted.es'){void initVintedAssistant();return;}
if (document.getElementById('orion-express-v2')) return;
const host = document.createElement('div');
host.id = 'orion-express-v2';
host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35';
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>${APP_CSS}</style><div class="shell"><header><div><small>VOTRE ATELIER DE VENTE · V3</small><h1>Orion <em>Express</em></h1></div><button id="minimize" aria-label="Réduire l’application">−</button></header><div class="origin">Local · example.com · aucune synchronisation</div><div id="status" role="status" aria-live="polite"></div><main></main><footer>Les données du navigateur ne sont pas une sauvegarde. Exportez vers Fichiers régulièrement.<br>Préparation manuelle des annonces : aucune connexion ni publication sur Vinted.</footer></div>`;
document.body.append(host);
attachOrionLanguage(root,root.querySelector('.shell'));
const $ = s => root.querySelector(s);
const main = $('main');
let repo, products = [], selected, dirty = false, backupURL, busy = false;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
function status(message, bad = false) { $('#status').textContent = message; $('#status').className = bad ? 'error' : ''; }
async function safe(action) { if (busy) return; busy = true; main.inert = true; main.setAttribute('aria-busy','true'); try { await action(); } catch(e) { status(errorMessage(e), true); } finally { busy = false; main.inert = false; main.removeAttribute('aria-busy'); } }
function leave() { return !dirty || orionConfirm('Quitter sans enregistrer les modifications ?'); }
window.addEventListener('beforeunload', e => { if (dirty || busy) { e.preventDefault(); e.returnValue = ''; } });
$('#minimize').onclick = () => {
  const minimized = host.style.height === '58px';
  host.style.cssText = minimized ? 'position:fixed;inset:0;z-index:2147483647;background:#f6f5ef;color:#172b35' : 'position:fixed;right:8px;bottom:8px;inset:auto 8px 8px auto;height:58px;width:220px;z-index:2147483647;background:#f6f5ef;border-radius:18px;overflow:hidden';
  $('.shell').classList.toggle('mini', !minimized);
  $('#minimize').textContent = minimized ? '−' : '+';
};
async function load() { products = await repo.all(); }
function bind(id, fn) { $(id).onclick = () => safe(fn); }
async function renderPhotos(container, photos, editable = false, changed = () => {}) {
  container.replaceChildren();
  for (let i = 0; i < photos.length; i++) {
    const tile = document.createElement('div'); tile.className = 'photo';
    const img = document.createElement('img'); img.alt = `Photo ${i + 1}`; tile.append(img); container.append(tile);
    try { img.src = await photoURL(photos[i]); } catch(e) { img.remove(); const note = document.createElement('p'); note.textContent = errorMessage(e); tile.append(note); }
    if (editable) {
      const replacement = document.createElement('input'); replacement.type = 'file'; replacement.accept = 'image/*'; replacement.hidden = true;
      const replace = document.createElement('button'); replace.type = 'button'; replace.textContent = 'Remplacer';
      replace.onclick = () => replacement.click();
      replacement.onchange = () => safe(async () => { if (!replacement.files[0]) return; const file = replacement.files[0]; checkFile(file); photos[i] = file; changed(); await renderPhotos(container, photos, true, changed); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Retirer';
      remove.onclick = () => { photos.splice(i,1); changed(); void renderPhotos(container, photos, true, changed); };
      tile.append(replace, remove, replacement);
    }
  }
}
function checkFile(f) { if (!f.type.startsWith('image/')) throw new Error('Choisissez une image.'); if (f.size > 15 * 1024 * 1024) throw new Error('Image supérieure à 15 Mo. Réduisez-la avant ajout.'); }
async function home() {
  dirty = false; selected = undefined; await load();
  main.innerHTML = `<section class="hero"><small>LE CATALOGUE</small><h2>Prêt pour la prochaine vente.</h2><div class="stats"><span><b>${products.length}</b> fiches</span><span><b>${products.reduce((n,p) => n + remaining(p),0)}</b> en stock</span></div><button class="primary" id="new">＋ Nouveau produit</button></section><div class="toolbar"><button id="export">Exporter la sauvegarde</button><button id="import">Restaurer une sauvegarde</button></div><button id="resume-prep">Reprendre ma préparation Vinted</button><div id="download"></div><label class="search">Retrouver une fiche<input id="search" type="search" placeholder="Titre, marque, catégorie…"></label><div class="cards"></div><input hidden type="file" accept="application/json,.json" id="backup"><section class="tip"><b>Une seule origine, vos données retrouvées</b><p>Ouvrez toujours https://example.com. Désactivez V1 avant d’utiliser V2. Une sauvegarde contient vos photos : conservez-la dans Fichiers, jamais dans le dépôt public.</p></section>`;
  bind('#new', async () => edit());
  bind('#resume-prep', async () => showPreparation());
  const cards = $('.cards');
  const draw = () => {
    cards.replaceChildren(); const query = $('#search').value.toLocaleLowerCase('fr');
    const matches = products.filter(p => [p.title,p.brand,p.category,p.description].join(' ').toLocaleLowerCase('fr').includes(query));
    if (!matches.length) cards.innerHTML = `<div class="empty"><h3>${products.length ? 'Aucun résultat' : 'Votre premier produit vous attend'}</h3><p>Créez une fiche ou retrouvez votre catalogue avec une sauvegarde.</p>${products.length ? '' : '<button id="starter">Créer « Jeu de cartes » à 10 €</button>'}</div>`;
    if ($('#starter')) bind('#starter', async () => edit({ title:orionLanguage==='es'?'Juego de cartas':'Jeu de cartes', price:10, initialStock:1, photos:[], sales:[] }));
    for (const p of matches) {
      const card = document.createElement('button'); card.className = 'card';
      card.innerHTML = `<div class="thumb"></div><div><small ${p.category?'data-orion-user':''}>${esc(p.category || 'À classer')}</small><h3 ${p.title?'data-orion-user':''}>${esc(p.title || 'Sans titre')}</h3><span>${money(p.price)} · ${remaining(p)} en stock</span></div><span aria-hidden="true">↗</span>`;
      card.onclick = () => safe(async () => preview(p.id)); cards.append(card);
      if (p.photos.length) void renderPhotos(card.querySelector('.thumb'), [p.photos[0]]);
      else card.querySelector('.thumb').textContent = '✧';
    }
  };
  $('#search').oninput = draw; draw();
  bind('#export', async () => {
    const records = await repo.allRaw(); const text = await exportBackup(records);
    const verified = await readBackup(text);
    if (verified.length !== records.length) throw new Error('Vérification de sauvegarde échouée.');
    if (backupURL) URL.revokeObjectURL(backupURL);
    const blob = new Blob([text], {type:'application/json'}); backupURL = URL.createObjectURL(blob);
    const filename = `orion-express-${new Date().toISOString().slice(0,10)}.backup.json`;
    $('#download').innerHTML = '<p>Sauvegarde vérifiée. Enregistrez-la dans Fichiers puis testez sa restauration.</p>';
    const a = document.createElement('a'); a.href = backupURL; a.download = filename; a.textContent = 'Télécharger à nouveau la sauvegarde'; $('#download').append(a); a.click();
    if (navigator.canShare && navigator.canShare({files:[new File([blob],filename,{type:'application/json'})]})) {
      const share = document.createElement('button'); share.textContent = 'Partager / Enregistrer dans Fichiers'; share.onclick = () => safe(async () => { await navigator.share({files:[new File([blob],filename,{type:'application/json'})]}); }); $('#download').append(share);
    }
    status(`${records.length} fiche(s) exportée(s), intégrité et lecture vérifiées.`);
  });
  bind('#import', async () => $('#backup').click());
  $('#backup').onchange = () => safe(async () => {
    const file = $('#backup').files[0]; if (!file) return;
    if (file.size > MAX_BACKUP) throw new Error('Sauvegarde supérieure à 100 Mo.');
    const records = await readBackup(await file.text());
    const photos = records.reduce((n,p) => n + p.photos.length,0);
    if (!orionConfirm(`Sauvegarde vérifiée : ${records.length} fiche(s), ${photos} photo(s). Restaurer comme nouvelles fiches ? Les fiches actuelles seront conservées. Des doublons sont possibles.`)) return;
    const count = await repo.importCopies(records); await home(); status(`${count} fiche(s) restaurée(s). Originaux conservés.`);
  });
}
async function edit(draft) {
  const p = draft ?? { title:'', price:0, initialStock:1, photos:[], sales:[] };
  const photos = structuredClone(p.photos); selected = p.id;
  const fields = [['title','Titre','text'],['price','Prix (€)','number'],['category','Catégorie','text'],['brand','Marque','text'],['condition','État','text'],['shipping','Format du colis','text'],['initialStock','Stock initial','number']];
  main.innerHTML = `<button id="back">← Catalogue</button><h2>${p.id ? 'Modifier la fiche' : 'Nouveau produit'}</h2><form>${fields.map(([key,label,type]) => key==='condition' ? `<label for="product-condition">${label}</label><select id="product-condition" name="condition">${conditionEditorChoices(p.condition).map(o=>`<option value="${esc(o.value)}" ${o.selected?'selected':''}>${esc(o.label)}</option>`).join('')}</select>` : `<label>${label}<input name="${key}" type="${type}" value="${esc(p[key] ?? '')}" ${type === 'number' ? `min="0" step="${key === 'price' ? '0.01' : '1'}" required inputmode="${key === 'price' ? 'decimal' : 'numeric'}"` : ''} ${key === 'title' ? 'required maxlength="200"' : ''}></label>`).join('')}<label for="description">Description</label><textarea id="description" name="description" rows="6">${esc(p.description)}</textarea><h3>Photos · <span id="photo-count">${photos.length}</span></h3><div class="photos"></div><button id="add-photos" type="button">＋ Ajouter des photos</button><input id="photos" type="file" accept="image/*" multiple hidden><p class="hint">Jusqu’à 15 Mo par photo. HEIC peut être conservé sans être affichable sur tous les navigateurs. Remplacer agit seulement sur la photo choisie.</p><button class="primary save" type="submit">Enregistrer la fiche</button></form>`;
  const changed = () => { dirty = true; $('#photo-count').textContent = photos.length; };
  await renderPhotos($('.photos'), photos, true, changed);
  $('form').oninput = () => { dirty = true; };
  $('#add-photos').onclick = () => $('#photos').click();
  $('#photos').onchange = () => safe(async () => { const files = Array.from($('#photos').files); files.forEach(checkFile); photos.push(...files); changed(); await renderPhotos($('.photos'),photos,true,changed); $('#photos').value = ''; });
  bind('#back', async () => { if (leave()) await home(); });
  $('form').onsubmit = e => { e.preventDefault(); void safe(async () => {
    const data = new FormData($('form')); const patch = {photos};
    for (const [key,,type] of fields) patch[key] = type === 'number' ? Number(String(data.get(key)).replace(',','.')) : String(data.get(key)).trim();
    patch.description = String(data.get('description'));
    if (!patch.title) throw new Error('Ajoutez un titre.');
    const saved = selected === undefined ? await repo.create(patch) : await repo.update(selected,patch,{updatedAt:p.updatedAt});
    dirty = false; await preview(saved.id); status('Fiche enregistrée sur cet appareil.');
  }); };
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); status('Copié dans le presse-papiers.'); }
  catch { const box = $('#copy-fallback'); box.hidden = false; box.value = text; box.focus(); box.select(); status('Appuyez longuement sur le texte sélectionné, puis Copier.'); }
}
async function preview(id) {
  const p = await repo.get(id); if (!p) throw new Error('Fiche introuvable.');
  selected = id;
  main.innerHTML = `<button id="back">← Catalogue</button><article><small>APERÇU DE L’ANNONCE</small><h2 data-orion-user>${esc(p.title)}</h2><div class="price">${money(p.price)}</div><div class="photos"></div><p class="description" ${p.description?'data-orion-user':''}>${esc(p.description || 'Aucune description')}</p><dl>${[['Catégorie',p.category],['Marque',p.brand],['État',p.condition],['Colis',p.shipping],['Stock initial',p.initialStock],['Stock restant',remaining(p)]].map(([k,v])=>`<div><dt>${k}</dt><dd data-orion-user>${esc(v)}</dd></div>`).join('')}</dl><button id="prepare-vinted" class="primary">Préparer sur Vinted</button><div class="toolbar"><button id="edit">Modifier</button><button id="duplicate">Dupliquer</button><button id="copy">Copier l’annonce</button><button id="copy-title">Copier le titre</button><button id="copy-description">Copier la description</button></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="8"></textarea><h3>Photos à joindre manuellement</h3><div id="photo-downloads" class="toolbar"></div><h3>Enregistrer une vente</h3><form id="sale"><label>Quantité<input name="quantity" type="number" value="1" min="1" max="${remaining(p)}" step="1" required inputmode="numeric"></label><label>Prix unitaire (€)<input name="unitPrice" type="number" value="${p.price}" min="0" step="0.01" required inputmode="decimal"></label><button type="submit" ${remaining(p) === 0 ? 'disabled' : ''}>Confirmer la vente</button></form><h3>Historique des ventes</h3><ul class="sales">${p.sales.length ? p.sales.map(s=>`<li>${esc(new Date(s.date).toLocaleString('fr-FR'))} · ${s.quantity} × ${money(s.unitPrice)}</li>`).join('') : '<li>Aucune vente enregistrée.</li>'}</ul><button class="danger" id="delete">Supprimer cette fiche</button></article>`;
  await renderPhotos($('.photos'),p.photos);
  for (let i=0; i<p.photos.length; i++) {
    try { const a = document.createElement('a'); a.href = await photoURL(p.photos[i]); a.download = `photo-${i+1}`; a.textContent = `Photo ${i+1} ↗`; $('#photo-downloads').append(a); } catch { /* original retained */ }
  }
  bind('#prepare-vinted', async () => launchVintedTest(p));
  bind('#back', home); bind('#edit',async () => edit(p)); bind('#duplicate', async () => { const d = await repo.duplicate(id); await preview(d.id); status('Copie créée, historique des ventes réinitialisé.'); });
  bind('#copy',async () => copy(listingForOrion(p))); bind('#copy-title',async () => copy(p.title)); bind('#copy-description',async () => copy(p.description));
  bind('#delete', async () => { if (orionConfirm('Supprimer définitivement cette fiche et ses photos ? Exportez une sauvegarde avant de continuer.')) { await repo.remove(id); await home(); status('Fiche supprimée.'); } });
  $('#sale').onsubmit = e => { e.preventDefault(); void safe(async () => { const data = new FormData($('#sale')); await repo.sell(id,Number(data.get('quantity')),Number(data.get('unitPrice'))); await preview(id); status('Vente enregistrée, stock mis à jour.'); }); };
}
void safe(async () => { repo = new Products(await openDB()); await home(); status('Catalogue chargé. Avant la première modification V1, exportez une sauvegarde.'); });

let preparationDB, preparationURLs=[];
async function workspace() { if(!preparationDB) preparationDB=await prepStore(); return preparationDB; }
async function startPreparation(product) {
  const next=prepareProduct(product);
  const files=await preparedFiles(next);
  if(files.reduce((n,f)=>n+f.size,0)>40*1024*1024) throw new Error('Photos supérieures à 40 Mo : réduisez leur taille dans une copie de la fiche avant de préparer. Les originaux sont conservés.');
  const store=await workspace(), previous=await store.get();
  if(previous && !orionConfirm('Remplacer la préparation en cours ? Les fiches du catalogue et leurs photos seront conservées.')) return;
  await store.put(next); await showPreparation();
}
async function showPreparation() {
  const store=await workspace(); let p=await store.get();
  if(!p) {status('Aucune préparation en cours. Ouvrez une fiche puis Préparer sur Vinted.');return;}
  if(p.version!==1) throw new Error('Préparation non reconnue. Le catalogue est conservé.');
  for(const url of preparationURLs) URL.revokeObjectURL(url); preparationURLs=[];
  const files=await preparedFiles(p), archive=await photoArchive(files,p.fields);
  const url=URL.createObjectURL(archive);preparationURLs.push(url);
  main.innerHTML=`<button id="prep-back">← Retour à la fiche produit</button><section class="tip"><small>ASSISTANT VINTED ESPAGNE · PARCOURS MANUEL</small><h2 data-orion-user>${esc(p.fields.title)}</h2><p>Informations préparées ici. Aucun champ n’est rempli sur Vinted. Copiez puis collez dans le site, et cochez seulement après vérification.</p><a class="primary vinted-link" href="${VINTED_NEW}" target="_blank" rel="noopener noreferrer">Ouvrir le vrai formulaire Vinted ↗</a><p>La connexion peut être nécessaire. Revenez à cet onglet après une interruption : la préparation est enregistrée sur cet appareil.</p></section><h3>1 · Vos ${files.length} photo(s)</h3><button id="share-photos">Partager les photos ensemble</button><a id="photo-zip" download="orion-vinted-photos.zip" href="${url}">Télécharger toutes les photos (ZIP)</a><p class="hint">Dans le partage iOS, enregistrez les images dans Photos ou Fichiers si proposé. Sinon, téléchargez le ZIP, ouvrez-le dans Fichiers pour l’extraire, puis sélectionnez les images ensemble dans le sélecteur de Vinted. Le fichier annonce.txt contient aussi les textes. Aucun envoi automatique.</p><div id="prep-photos" class="photos"></div><label class="check"><input type="checkbox" data-check="photos" ${p.checked.photos?'checked':''}> J’ai ajouté et vérifié les photos dans Vinted</label><h3>2 · Copier, coller, vérifier</h3><div id="prep-fields"></div><textarea id="copy-fallback" hidden aria-label="Texte à copier" rows="6"></textarea><h3>3 · Catégorie et vérification finale</h3><p>Choisissez la catégorie dans la recherche hiérarchique de Vinted. Pour « Jeux de société », renseignez aussi les champs supplémentaires affichés. La marque, l’état et le colis restent à sélectionner dans leurs listes.</p><button id="category-changed">J’ai changé de catégorie : revérifier les choix</button><label class="check"><input type="checkbox" data-check="dynamic" ${p.checked.dynamic?'checked':''}> J’ai vérifié les champs supplémentaires, la marque, l’état et le colis après le choix de catégorie</label><label class="check"><input type="checkbox" data-check="review" ${p.checked.review?'checked':''}> J’ai comparé toutes les informations et les photos avec l’annonce Vinted</label><p id="prep-summary" role="status"></p><p class="hint">Ces coches sont vos confirmations manuelles, pas une détection du formulaire. Publication exclusivement depuis le bouton natif Vinted. Aucune vente ni diminution du stock n’est enregistrée par cet assistant.</p><button id="clear-prep">Effacer uniquement cette préparation</button>`;
  const rows=$('#prep-fields');
  for(const [key,label] of PREP_FIELDS) {
    const row=document.createElement('section');row.className='prep-field';
    row.innerHTML=`<h3>${label}</h3><p class="description" ${p.fields[key]?'data-orion-user':''}>${esc(p.fields[key] || 'À choisir manuellement dans Vinted')}</p><button type="button" data-copy="${key}" ${p.fields[key]?'':'disabled'}>Copier ${label.split(' / ')[0].toLowerCase()}</button><label class="check"><input type="checkbox" data-check="${key}" ${p.checked[key]?'checked':''}> Vérifié dans Vinted</label>`;rows.append(row);
    row.querySelector('button').onclick=()=>safe(async()=>copy(p.fields[key]));
  }
  const summary=()=>{
    const keys=[...PREP_FIELDS.map(([k])=>k),'photos','dynamic','review'];
    $('#prep-summary').textContent=`Préparé localement : ${PREP_FIELDS.filter(([k])=>p.fields[k]).length}/7 valeurs et ${files.length} photo(s). Vérifié par vous dans Vinted : ${keys.filter(k=>p.checked[k]).length}/${keys.length}.`;
  };summary();
  for(const box of root.querySelectorAll('[data-check]')) box.onchange=()=>safe(async()=>{
    const before=p,next=checkPreparation(p,box.dataset.check,box.checked);
    try {await store.put(next);p=next;} catch(e){box.checked=!!before.checked[box.dataset.check];throw e;}
    for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Vérification enregistrée sur cet appareil.');
  });
  $('#category-changed').onclick=()=>safe(async()=>{const next=checkPreparation(p,'category',false);await store.put(next);p=next;for(const b of root.querySelectorAll('[data-check]'))b.checked=!!p.checked[b.dataset.check];summary();status('Catégorie, champs supplémentaires, marque, état et colis à revérifier.');});
  $('#share-photos').onclick=()=>safe(async()=>{
    if(!navigator.canShare?.({files}) || !navigator.share) {status('Partage multiple indisponible ici. Utilisez le ZIP ou les liens photo individuels.');return;}
    try {await navigator.share({files});status('Partage fermé. Vérifiez que les images sont enregistrées avant de les sélectionner dans Vinted.');}
    catch(e){if(e.name==='AbortError'){status('Partage annulé. Les photos restent disponibles ici.');return;}throw e;}
  });
  await renderPhotos($('#prep-photos'),files);
  files.forEach((f,i)=>{const a=document.createElement('a'),u=URL.createObjectURL(f);preparationURLs.push(u);a.href=u;a.download=f.name;a.textContent=`Enregistrer la photo ${i+1}`;$('#prep-photos').append(a);});
  bind('#prep-back',async()=>preview(p.sourceId));
  bind('#clear-prep',async()=>{if(orionConfirm('Effacer la préparation locale ? Les produits et les photos du catalogue restent conservés.')){await store.clear();await home();status('Préparation effacée, catalogue conservé.');}});
  status('Préparation locale enregistrée. Collage, choix et ajout des photos manuels dans Vinted.');
}

})();
