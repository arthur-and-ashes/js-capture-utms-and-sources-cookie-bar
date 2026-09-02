# js-cookie-kit-global-appliance

Scripts front-end à ajouter sur toutes les pages d'un site pour **capturer les
UTM (source, medium, campaign) et les réinjecter automatiquement dans les champs
de vos formulaires**, et (optionnellement) gérer le consentement cookies +
Google Analytics.

Deux variantes sont fournies dans `src/`, à choisir selon le besoin :

| Fichier | Bandeau de consentement | Google Analytics | Capture UTM | Dépendance |
| ------- | :---------------------: | :--------------: | :---------: | ---------- |
| [`utm-capture-with-cookie-bar.js`](src/utm-capture-with-cookie-bar.js) | ✅ | ✅ (GA4, optionnel) | ✅ | js-cookie (embarqué) |
| [`utm-capture-simple.js`](src/utm-capture-simple.js) | ❌ | ❌ | ✅ | aucune |

## utm-capture-with-cookie-bar.js

Version « tout-en-un » :

1. **Bandeau de consentement cookies** (affiché tant qu'aucun choix n'a été fait).
2. **Chargement de Google Analytics 4** selon le choix de l'utilisateur (optionnel).
3. **Capture des UTM** (`utm_source`, `utm_medium`, `utm_campaign`) dans un cookie,
   puis réinjection dans les champs cachés d'un formulaire (`field_source`,
   `field_medium`, `field_campaign`, `field_referal`).

Inclure le fichier, de préférence avant la fermeture du `</body>` :

```html
<script src="src/utm-capture-with-cookie-bar.js"></script>
```

La bibliothèque `js-cookie` est déjà incluse en tête du fichier — rien d'autre à charger.

## utm-capture-simple.js

Version minimale, **sans bandeau ni Google Analytics** : elle se contente de
récupérer les UTM de l'URL, de les cumuler dans le cookie `cookie_utms`, puis de
réinjecter ces valeurs dans les champs `field_source`, `field_medium` et
`field_campaign`. Autonome, aucune dépendance.

```html
<script src="src/utm-capture-simple.js"></script>
```

## Envoyer les sources dans un formulaire

C'est la fonctionnalité clé : **les deux scripts pré-remplissent automatiquement
des champs de formulaire** avec les UTM stockés dans le cookie. Au chargement de
la page, le script recherche des champs par leur `id` et y écrit la valeur
correspondante. Rien à coder côté formulaire — il suffit d'ajouter des champs
(cachés) portant les `id` attendus.

### IDs reconnus

| `id` du champ    | Contenu injecté         | Disponible dans                    |
| ---------------- | ----------------------- | ---------------------------------- |
| `field_source`   | `utm_source` cumulés    | les deux scripts                   |
| `field_medium`   | `utm_medium` cumulés    | les deux scripts                   |
| `field_campaign` | `utm_campaign` cumulés  | les deux scripts                   |
| `field_referal`  | referral (réservé)      | `utm-capture-with-cookie-bar.js`   |

### Exemple HTML

```html
<form action="/traitement" method="post">
  <!-- vos champs visibles (nom, e-mail, message…) -->

  <!-- remplis automatiquement par le script -->
  <input type="hidden" id="field_source"   name="utm_source">
  <input type="hidden" id="field_medium"   name="utm_medium">
  <input type="hidden" id="field_campaign" name="utm_campaign">

  <button type="submit">Envoyer</button>
</form>
```

L'`id` sert au script à **trouver** le champ ; le `name` est ce que votre
back-end ou votre e-mail **recevra** (mettez ce que vous voulez). Si le cookie
est vide ou le champ absent, le script ne fait rien : aucune erreur, et aucune
valeur `undefined` n'est injectée.

### WordPress / Contact Form 7

Utilisez le shortcode `hidden` avec l'option `id:` pour générer le bon attribut :

```
[hidden field_source id:field_source]
[hidden field_medium id:field_medium]
[hidden field_campaign id:field_campaign]
```

### Personnaliser les IDs (version simple)

Dans `utm-capture-simple.js`, la correspondance paramètre → champ est déclarée
dans la config, modifiable sans toucher au reste du code :

```js
params: [
  { url: 'utm_source',   key: 'source',   field: 'field_source' },
  { url: 'utm_medium',   key: 'medium',   field: 'field_medium' },
  { url: 'utm_campaign', key: 'campaign', field: 'field_campaign' }
]
```

> **Bon à savoir** : l'injection fonctionne pour un formulaire HTML classique,
> Contact Form 7 ou Gravity Forms. Pour un formulaire piloté par React/Vue (état
> contrôlé), écrire l'attribut ne suffit pas à mettre à jour l'état du composant.

### Cookies posés

| Cookie          | Rôle                                              | Durée   |
| --------------- | ------------------------------------------------- | ------- |
| `cookie_crunch` | Mémorise le choix (`yes` / `no`)                  | 120 j   |
| `cookie_utms`   | Stocke les UTM cumulés (JSON)                     | 120 j   |

### Configuration

En haut du script, l'objet `config` regroupe l'URL de la politique de
confidentialité, le domaine, la couleur du bouton, l'ID Google Analytics,
la durée des cookies et les libellés.

## ⚠️ Points d'attention connus

- **Google Analytics 4 (optionnel)** : renseigner l'ID de mesure GA4 dans
  `config.GA4_id` (format `G-XXXXXXXXXX`). **Si la variable est laissée vide,
  GA4 n'est pas chargé du tout** — le reste du kit (bandeau, capture UTM)
  continue de fonctionner. Quand un ID est présent, le loader `gtag.js` est
  chargé puis initialisé (`dataLayer` + `gtag('config', …)`) uniquement en cas
  de consentement.
- **Modèle opt-out** : GA et le cookie UTM sont posés **par défaut** et coupés
  au refus. Pour un site soumis au **RGPD**, un modèle **opt-in** (rien avant
  consentement explicite) serait requis.

## Historique

Script initial écrit il y a plusieurs années, puis modernisé en 2026
(remplacement de `document.write`, correction de bugs logiques, `'use strict'`,
encodage UTF-8) **à comportement identique**.
