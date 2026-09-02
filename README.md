# js-cookie-kit-global-appliance

Petit script « tout-en-un », sans dépendance externe (hormis [js-cookie](https://github.com/js-cookie/js-cookie) embarqué), à ajouter sur toutes les pages d'un site :

1. **Bandeau de consentement cookies** (affiché tant qu'aucun choix n'a été fait).
2. **Chargement de Google Analytics** selon le choix de l'utilisateur.
3. **Capture des UTM** (`utm_source`, `utm_medium`, `utm_campaign`) dans un cookie,
   puis réinjection dans les champs cachés d'un formulaire (`field_source`,
   `field_medium`, `field_campaign`, `field_referal`).

## Utilisation

Inclure le fichier sur toutes les pages, de préférence avant la fermeture du `</body>` :

```html
<script src="src/js-cookie-kit-global-appliance.js"></script>
```

La bibliothèque `js-cookie` est déjà incluse en tête du fichier — rien d'autre à charger.

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

- **Google Analytics 4** : renseigner l'ID de mesure GA4 dans `config.GA4_id`
  (format `G-XXXXXXXXXX`). Tant que le placeholder n'est pas remplacé, aucun
  suivi n'est chargé. Le loader `gtag.js` est chargé puis initialisé
  (`dataLayer` + `gtag('config', …)`) uniquement en cas de consentement.
- **Modèle opt-out** : GA et le cookie UTM sont posés **par défaut** et coupés
  au refus. Pour un site soumis au **RGPD**, un modèle **opt-in** (rien avant
  consentement explicite) serait requis.

## Historique

Script initial écrit il y a plusieurs années, puis modernisé en 2026
(remplacement de `document.write`, correction de bugs logiques, `'use strict'`,
encodage UTF-8) **à comportement identique**.
