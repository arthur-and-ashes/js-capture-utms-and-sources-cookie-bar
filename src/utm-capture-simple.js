/* ============================================================================
 * Capture des sources de trafic — version simple
 *
 * Récupère les UTM de l'URL (utm_source, utm_medium, utm_campaign) ainsi que le
 * domaine du site référent, les cumule dans un cookie, puis réinjecte les
 * valeurs dans les champs cachés d'un formulaire (field_source, field_medium,
 * field_campaign, field_referal).
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
		cookieExpiryDays: 120
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

	// Récupère le domaine du site référent (document.referrer), ou false si le
	// référent est absent ou interne (même domaine que la page courante).
	function getReferrerHost() {
		if (!document.referrer) { return false; }
		var link = document.createElement('a');
		link.href = document.referrer;
		var host = link.hostname;
		if (!host || host === window.location.hostname) { return false; }
		return host;
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

	// Sources capturées : clé stockée dans le cookie, id du champ de formulaire
	// à remplir, et fonction qui récupère la valeur (false si absente).
	var sources = [
		{ key: 'source',   field: 'field_source',   get: function () { return getParameter('utm_source'); } },
		{ key: 'medium',   field: 'field_medium',   get: function () { return getParameter('utm_medium'); } },
		{ key: 'campaign', field: 'field_campaign', get: function () { return getParameter('utm_campaign'); } },
		{ key: 'referal',  field: 'field_referal',  get: getReferrerHost }
	];

	// --- 1. Mise à jour du cookie à partir de l'URL et du site référent --------
	var values = {};
	var hasData = false;
	sources.forEach(function (s) {
		values[s.key] = s.get();
		if (values[s.key] !== false) { hasData = true; }
	});

	if (hasData) {
		var existing = parseJson(getCookie(config.cookieName));
		var data = {};
		sources.forEach(function (s) {
			var merged = mergeParam(existing, s.key, values[s.key]);
			if (merged !== undefined) { data[s.key] = merged; }
		});
		setCookie(config.cookieName, JSON.stringify(data), config.cookieExpiryDays);
	}

	// --- 2. Réinjection des valeurs du cookie dans les formulaires -------------
	ready(function () {
		var data = parseJson(getCookie(config.cookieName));
		if (!data) { return; }
		sources.forEach(function (s) {
			setFieldValue(s.field, data[s.key]);
		});
	});
})();
