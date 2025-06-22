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

## 🛠 Lancer en local

```bash
pnpm install
pnpm dev


