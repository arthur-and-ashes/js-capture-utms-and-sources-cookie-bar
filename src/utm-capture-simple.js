/* ============================================================================
 * Capture des UTM — version simple
 *
 * Récupère les paramètres UTM de l'URL (utm_source, utm_medium, utm_campaign),
 * les cumule dans un cookie, puis réinjecte les valeurs dans les champs cachés
 * d'un formulaire (field_source, field_medium, field_campaign).
 *
 * Autonome : aucune dépendance (pas de js-cookie). Pas de bandeau de
 * consentement, pas de Google Analytics — voir utm-capture-with-cookie-bar.js
 * pour la version complète.
 * ========================================================================== */
(function () {
	'use strict';

	// --- Configuration --------------------------------------------------------
	var config = {
		cookieName: 'cookie_utms',
		cookieExpiryDays: 120,
		// Correspondance paramètre d'URL -> clé du cookie -> id du champ de formulaire
		params: [
			{ url: 'utm_source', key: 'source', field: 'field_source' },
			{ url: 'utm_medium', key: 'medium', field: 'field_medium' },
			{ url: 'utm_campaign', key: 'campaign', field: 'field_campaign' }
		]
	};

	// --- Helpers cookies (natifs) ---------------------------------------------
	function setCookie(name, value, days) {
		var expires = '';
		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + days * 864e5); // 864e5 = 24 h en ms
			expires = '; expires=' + date.toUTCString();
		}
		document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
	}

	function getCookie(name) {
		var prefix = name + '=';
		var parts = document.cookie ? document.cookie.split('; ') : [];
		for (var i = 0; i < parts.length; i++) {
			if (parts[i].indexOf(prefix) === 0) {
				return decodeURIComponent(parts[i].substring(prefix.length));
			}
		}
		return null;
	}

	// --- Utilitaires ----------------------------------------------------------
	// Récupère un paramètre de l'URL, ou false s'il est absent.
	function getParameter(name) {
		var params = window.location.search.substring(1).split('&');
		for (var i = 0; i < params.length; i++) {
			var pair = params[i].split('=');
			if (pair[0] === name) {
				return decodeURIComponent(pair[1]);
			}
		}
		return false;
	}

	// Analyse en toute sécurité une valeur de cookie JSON (null si invalide).
	function parseJson(raw) {
		if (raw === null || raw === '') { return null; }
		try {
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}

	// Fusionne la valeur d'un paramètre avec ce qui est déjà stocké dans le cookie.
	// Renvoie undefined quand il n'y a rien à enregistrer pour cette clé.
	function mergeParam(existing, key, value) {
		var current = existing ? existing[key] : undefined;
		if (current !== undefined) {
			// déjà présent parmi les valeurs -> on garde ; sinon on ajoute « -valeur »
			if (value !== false && current.indexOf(value) !== -1) { return current; }
			if (value !== false) { return current + '-' + value; }
			return current; // pas de nouvel UTM -> on garde l'existant
		}
		return value !== false ? value : undefined;
	}

	// Exécute fn dès que le DOM est prêt (ou immédiatement s'il l'est déjà)
	function ready(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	// Renseigne un champ de formulaire s'il existe et si la valeur est définie.
	function setFieldValue(id, value) {
		if (value === undefined) { return; }
		var field = document.getElementById(id);
		if (field) {
			field.setAttribute('value', value);
		}
	}

	// --- 1. Mise à jour du cookie à partir des UTM de l'URL --------------------
	var urlValues = {};
	var hasUtm = false;
	config.params.forEach(function (p) {
		urlValues[p.key] = getParameter(p.url);
		if (urlValues[p.key] !== false) { hasUtm = true; }
	});

	if (hasUtm) {
		var existing = parseJson(getCookie(config.cookieName));
		var data = {};
		config.params.forEach(function (p) {
			var merged = mergeParam(existing, p.key, urlValues[p.key]);
			if (merged !== undefined) { data[p.key] = merged; }
		});
		setCookie(config.cookieName, JSON.stringify(data), config.cookieExpiryDays);
	}

	// --- 2. Réinjection des valeurs du cookie dans les formulaires -------------
	ready(function () {
		var data = parseJson(getCookie(config.cookieName));
		if (!data) { return; }
		config.params.forEach(function (p) {
			setFieldValue(p.field, data[p.key]);
		});
	});
})();
