// Presentation-only localisation. Never visits the Vinted page DOM or rewrites product data.
let orionLanguage='es';
const LANGUAGE_KEY='orion-express-language';
const ES={
"Vinted s’ouvre dans l’app ?":"¿Vinted se abre en la app?","Dans Orion : Réglages → Général → App Opener. Si une règle vinted.es ou www.vinted.es est présente, choisissez Never / Jamais. Si nécessaire, remettez la règle sur Ask / Demander, puis relancez le bouton et choisissez Never. Le balayage de droite à gauche retire uniquement cette règle, sans effacer les fiches.":"En Orion: Ajustes → General → App Opener. Si aparece una regla de vinted.es o www.vinted.es, elige Never / Nunca. Si hace falta, cambia la regla a Ask / Preguntar, pulsa el botón de nuevo y elige Never. Deslizar de derecha a izquierda elimina solo esa regla, sin borrar las fichas.",
"Le bouton charge le formulaire dans cet onglet Orion.":"El botón carga el formulario en esta pestaña de Orion.","Si Orion propose l’app Vinted, choisissez Jamais. Si l’app s’ouvre encore, utilisez Copier le lien pour Orion et collez le lien complet dans la barre d’adresse. Le lien spécial Orion a été retiré car il échouait sur iPhone.":"Si Orion ofrece la app de Vinted, elige Nunca. Si se abre la app de nuevo, usa Copiar enlace para Orion y pega el enlace completo en la barra de direcciones. Se ha retirado el enlace especial de Orion porque fallaba en iPhone.","Aucune confirmation du formulaire. Si l’app s’ouvre, collez le lien complet dans la barre d’adresse d’Orion. Aucun second onglet automatique.":"Sin confirmación del formulario. Si se abre la app, pega el enlace completo en la barra de direcciones de Orion. No se abre otra pestaña automáticamente.",
'Formulaire Orion reconnu. Consultez l’onglet Vinted pour vérifier le résultat.':'Formulario en Orion reconocido. Consulta la pestaña de Vinted para revisar el resultado.',
"Identifiant de transfert invalide.":"Identificador de transferencia no válido.","Destination Orion non reconnue.":"Destino de Orion no reconocido.","Ouverture par extension indisponible. Utilisez Ouvrir avec Orion.":"Apertura por extensión no disponible. Usa Abrir con Orion.","Ouvrir avec Orion":"Abrir con Orion","Le bouton demande un onglet au navigateur par Violentmonkey.":"El botón solicita una pestaña al navegador mediante Violentmonkey.","Si l’app Vinted s’ouvre ou si aucun formulaire ne répond, utilisez Ouvrir avec Orion. Si Orion propose l’app Vinted, choisissez Jamais. Le choix iOS ne peut pas être modifié par ce script.":"Si se abre la app de Vinted o no responde ningún formulario, usa Abrir con Orion. Si Orion ofrece la app de Vinted, elige Nunca. Este script no puede cambiar la preferencia de iOS.","Formulaire Orion reconnu. Préremplissage en cours.":"Formulario en Orion reconocido. Rellenando…","Préremplissage terminé dans l’onglet Vinted. Vérifiez l’annonce.":"Rellenado terminado en la pestaña de Vinted. Revisa el anuncio.","Formulaire reçu : certains champs demandent une vérification dans l’onglet Vinted.":"Formulario recibido: algunos campos requieren revisión en la pestaña de Vinted.","Le formulaire a signalé une erreur. Consultez le bouton Orion dans l’onglet Vinted.":"El formulario ha indicado un error. Consulta el botón Orion en la pestaña de Vinted.","Aucune confirmation du formulaire. Revenez dans Orion et utilisez Ouvrir avec Orion. Aucun second onglet automatique.":"Sin confirmación del formulario. Vuelve a Orion y usa Abrir con Orion. No se abre otra pestaña automáticamente.","Ouverture demandée. En attente du formulaire dans Orion…":"Apertura solicitada. Esperando el formulario en Orion…","Ouverture explicite dans Orion demandée. En attente du formulaire…":"Apertura explícita en Orion solicitada. Esperando el formulario…",

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
