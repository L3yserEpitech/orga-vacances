# Qui est là ? — dispos vacances

Calendrier partagé pour savoir qui est là pendant les vacances.
Chacun choisit son prénom puis clique sur les jours : 1× = présent (vert), 2× = absent (rouge), 3× = effacer.
Chaque case affiche des bulles avec les prénoms de ceux qui viennent ou pas. Le calendrier se rafraîchit tout seul toutes les 4 s.

Stack : Next.js (App Router) + Upstash Redis.

## Modifier les prénoms ou le mois

Tout est dans [`lib/config.ts`](lib/config.ts) : `FRIENDS`, `YEAR`, `MONTH` (janvier = 0), `MONTH_LABEL`.

## Déployer sur Vercel

1. **Import** le repo sur [vercel.com/new](https://vercel.com/new) → Deploy.
2. Dans le projet Vercel : **Storage → Create Database → Upstash (Redis)** → connecte-la au projet.
   Les variables `KV_REST_API_URL` / `KV_REST_API_TOKEN` sont ajoutées automatiquement.
3. **Redeploy** (Deployments → ⋯ → Redeploy) pour que les variables soient prises en compte.

Sans base connectée, le site marche mais rien n'est partagé (un message rouge l'indique en haut à droite).

## En local

```bash
npm install
vercel env pull .env.local   # optionnel : récupère les variables Redis
npm run dev
```

## Bon à savoir

Pas de mot de passe : n'importe qui avec le lien peut cocher pour n'importe quel prénom. Partage le lien seulement dans le groupe.
