# Sendora

Sendora est une plateforme d'emailing simple et moderne, pensée pour les petites entreprises.  
Elle permet d'importer ses contacts, créer des campagnes email et suivre ses statistiques, le tout avec une interface claire et rapide.

## 🚀 Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (auth & base de données)
- **shadcn/ui** (composants UI)
- **pnpm**

## 📁 Structure du projet

- `/app` – pages et logique principale de l’app
- `/components` – composants réutilisables
- `/lib` – fonctions utilitaires
- `/hooks` – hooks personnalisés
- `/public` – assets statiques (logo, images…)
- `middleware.ts` – gestion des redirections (auth, etc.)

## Couleur 

🎨 Couleurs principales de la barre latérale
Fond général : #f4f4fd
Texte : #3d247a
Texte actif : #2d1863
Fond sélectionné +sombre : #e6dbfa
Fond hover : #f1eafd

## Codes couleur Bouton
Violet principal (branding) : #6c43e0
Violet secondaire (hover): #4f32a7


Fond du bouton : #fffeff (Blanc pur)
Texte et icône : #23272f (Gris très foncé, presque noir)
Bordure : #e0e0e0 (Gris très clair et doux)
Et au survol de la souris (hover) :
Fond du bouton : #fafbfc (Gris extrêmement clair, à peine perceptible)
Bordure : #bdbdbd (Gris légèrement plus soutenu)

## Codes couleur du tableau de contacts

| Usage                                 | Couleur      | Code         |
|---------------------------------------|--------------|--------------|
| Fond ligne sélectionnée               | Violet clair | #f4f4fd      |
| Hover sur ligne sélectionnée          | Violet hover | #efeffb      |
| Hover sur ligne non sélectionnée      | Gris (muted) | #f5f5f5*     |

Couleur texte violet souligné, en violet #6c43e0,
hover en violet foncé #4f32a7,
texte en gras (font-semibold),
taille text-sm.
## 🛠 Lancer en local

```bash
pnpm install
pnpm dev

git add .
git commit -m "v10"
git push

Illustration : https://storyset.com

Dans la table Utilisateurs de Supabase

id : identifiant unique de chaque compte.

compte_parent_id :

NULL → compte principal.

UUID d’un autre utilisateur → compte invité, rattaché au parent qui a invité.

## Champs personnalisés pour les contacts

Pour permettre à chaque client d'ajouter des attributs personnalisés à ses contacts, deux tables supplémentaires sont utilisées :

- `contact_custom_fields` : référence les champs personnalisés créés par chaque client (userID, nom du champ, type).
- `contact_custom_values` : stocke la valeur de chaque champ personnalisé pour chaque contact (contact_id, custom_field_id, value).

### Exemple d'utilisation

1. Lorsqu'un client crée un nouveau champ (ex: "ville"), une ligne est ajoutée dans `contact_custom_fields` avec son userID.
2. Lorsqu'un contact a une valeur pour ce champ, une ligne est ajoutée dans `contact_custom_values` (contact_id, custom_field_id, value).
3. Pour afficher le tableau des contacts avec les champs dynamiques, il faut faire une jointure entre `Contacts`, `contact_custom_fields` et `contact_custom_values`.

Ce modèle permet une grande flexibilité et évolutivité pour la gestion des attributs de contacts.

