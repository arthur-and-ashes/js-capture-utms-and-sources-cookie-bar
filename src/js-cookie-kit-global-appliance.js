// JS COOKIE
!function(e){var n=!1;if("function"==typeof define&&define.amd&&(define(e),n=!0),"object"==typeof exports&&(module.exports=e(),n=!0),!n){var o=window.Cookies,t=window.Cookies=e();t.noConflict=function(){return window.Cookies=o,t}}}(function(){function e(){for(var e=0,n={};e<arguments.length;e++){var o=arguments[e];for(var t in o)n[t]=o[t]}return n}function n(o){function t(n,r,i){var c;if("undefined"!=typeof document){if(arguments.length>1){if("number"==typeof(i=e({path:"/"},t.defaults,i)).expires){var a=new Date;a.setMilliseconds(a.getMilliseconds()+864e5*i.expires),i.expires=a}i.expires=i.expires?i.expires.toUTCString():"";try{c=JSON.stringify(r),/^[\{\[]/.test(c)&&(r=c)}catch(e){}r=o.write?o.write(r,n):encodeURIComponent(String(r)).replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,decodeURIComponent),n=(n=(n=encodeURIComponent(String(n))).replace(/%(23|24|26|2B|5E|60|7C)/g,decodeURIComponent)).replace(/[\(\)]/g,escape);var s="";for(var f in i)i[f]&&(s+="; "+f,!0!==i[f]&&(s+="="+i[f]));return document.cookie=n+"="+r+s}n||(c={});for(var p=document.cookie?document.cookie.split("; "):[],d=/(%[0-9A-Z]{2})+/g,u=0;u<p.length;u++){var l=p[u].split("="),C=l.slice(1).join("=");this.json||'"'!==C.charAt(0)||(C=C.slice(1,-1));try{var g=l[0].replace(d,decodeURIComponent);if(C=o.read?o.read(C,g):o(C,g)||C.replace(d,decodeURIComponent),this.json)try{C=JSON.parse(C)}catch(e){}if(n===g){c=C;break}n||(c[g]=C)}catch(e){}}return c}}return t.set=t,t.get=function(e){return t.call(t,e)},t.getJSON=function(){return t.apply({json:!0},[].slice.call(arguments))},t.defaults={},t.remove=function(n,o){t(n,"",e(o,{expires:-1}))},t.withConverter=n,t}return n(function(){})});

/* ============================================================================
 * Bandeau de consentement + Google Analytics + capture des UTM
 * Version modernisée (iso-comportement) — 2026
 *
 * NOTE conformité : le modèle opt-out d'origine est conservé à la demande
 *   (GA et le cookie UTM se chargent par défaut, se coupent au clic « stop »).
 *   Pour un site FR, le RGPD exigerait un modèle opt-in (rien avant consentement).
 * NOTE GA : le suivi utilise Google Analytics 4 — renseigner l'ID de mesure
 *   dans `config.GA4_id` (format G-XXXXXXXXXX). Le loader gtag.js est chargé
 *   puis initialisé (dataLayer + gtag('config', …)) uniquement si consentement.
 * ========================================================================== */
(function () {
	'use strict';

	// --- Configuration --------------------------------------------------------
	var config = {
		policyUrl: 'https://arthur-and-ashes.com/politique-de-confidentialite/',
		domain: 'arthur-and-ashes.com',
		okColor: '#0b0544',
		GA4_id: 'G-XXXXXXXXXX', // ⚠️ à remplacer par ton ID de mesure GA4 (format G-XXXXXXXXXX)
		cookieExpiryDays: 120,
		consentText: 'Cookies acceptés',
		nonConsentText: 'Cookies bloqués'
	};

	// Cookies à supprimer quand l'utilisateur refuse le suivi
	var cookiesToDelete = /(eqy_sessionid|_jsuid|cluid|wisepops|wisepops_props|wisepops_session|wisepops_visits|_gat_getquanty|uetsid|muid|muidb)/;
	var cookiesToDeleteWithDomain = /(_ga|_gat|_git|_gid|uetsid|muid|muidb)/;

	var wantCookie = Cookies.get('cookie_crunch');
	var consented = wantCookie !== 'no';
	var userChoice = consented ? config.consentText : config.nonConsentText;

	// Exécute fn dès que le DOM est prêt (ou immédiatement s'il l'est déjà)
	function ready(fn) {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			fn();
		}
	}

	// --- Google Analytics 4 (chargé et initialisé si consentement) ------------
	if (consented && config.GA4_id) {
		var gaScript = document.createElement('script');
		gaScript.async = true;
		gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.GA4_id;
		(document.head || document.documentElement).appendChild(gaScript);

		window.dataLayer = window.dataLayer || [];
		window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
		gtag('js', new Date());
		gtag('config', config.GA4_id);
	}

	// --- Cookie UTM -----------------------------------------------------------
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

	// Fusionne la valeur d'un paramètre avec ce qui est déjà stocké dans le cookie.
	// Renvoie undefined quand il n'y a rien à enregistrer pour cette clé.
	function mergeParam(existing, key, value) {
		var current = existing ? existing[key] : undefined;
		if (current !== undefined) {
			// déjà présent parmi les valeurs → on garde ; sinon on ajoute « -valeur »
			if (value !== false && current.indexOf(value) !== -1) { return current; }
			if (value !== false) { return current + '-' + value; }
			return current; // pas de nouvel UTM → on garde l'existant
		}
		return value !== false ? value : undefined;
	}

	// Analyse en toute sécurité une valeur de cookie JSON (null si invalide).
	function parseCookieJson(raw) {
		if (raw === undefined || raw === null || raw === '') { return null; }
		try {
			return JSON.parse(raw);
		} catch (e) {
			return null;
		}
	}

	if (consented) {
		var urlSrc = getParameter('utm_source');
		var urlMdm = getParameter('utm_medium');
		var urlCpn = getParameter('utm_campaign');
		var hasUtm = urlSrc !== false || urlMdm !== false || urlCpn !== false;

		if (hasUtm) {
			var existing = parseCookieJson(Cookies.get('cookie_utms'));
			var pepites = {};
			var source = mergeParam(existing, 'source', urlSrc);
			var medium = mergeParam(existing, 'medium', urlMdm);
			var campaign = mergeParam(existing, 'campaign', urlCpn);

			if (source !== undefined) { pepites.source = source; }
			if (medium !== undefined) { pepites.medium = medium; }
			if (campaign !== undefined) { pepites.campaign = campaign; }

			Cookies.set('cookie_utms', pepites, { expires: config.cookieExpiryDays });
		}
	}

	// --- Interface (bandeau + bouton) -----------------------------------------
	ready(function () {
		// Bandeau de consentement
		var bar = document.createElement('div');
		bar.id = 'cookie-bar';
		bar.setAttribute('style', 'display:none;z-index:1000;position:fixed; bottom:0; left:0; width: 100%;  text-align: center; padding: 10px 0; margin:0;  background: rgba(244, 244, 244, 1);  color: #919191;  font: 14px Raleway, sans-serif;');
		bar.innerHTML =
			"<div style='display:inline-block;width:65%;margin:0;'>Ce site web utilise des cookies - " +
			"<a id='cookie-policy' href='" + config.policyUrl + "' style='color: #919191;font-weight:bold;'>Consulter notre politique des cookies !</a> " +
			"Vous pouvez stopper l'utilisation des cookies <span id='stop-cookie' style='text-decoration:underline;cursor:pointer;'>en cliquant ici</span>.</div>" +
			"<div style='width:20%;'><span id='agree' style='position:fixed;bottom:4px;right:2%;color: #FFFFFF;background: " + config.okColor + ";border-radius: 16px; line-height: 30px; padding: 0 10px;margin: 1px 8px 0 0;font-weight: 600;cursor:pointer;'>ok</span></div>";

		// Bouton persistant sous le bandeau
		var check = document.createElement('span');
		check.id = 'checkcookies';
		check.setAttribute('style', 'z-index:1;position:fixed;bottom:4px;right:2%;color: #FFFFFF;background: ' + config.okColor + ';border-radius: 16px; line-height: 30px; padding: 6px 10px;margin: 1px 8px 0 0;font: 14px Raleway, sans-serif; font-weight: 600;cursor:pointer;');
		check.textContent = userChoice;

		document.body.appendChild(bar);
		document.body.appendChild(check);

		// N'afficher le bandeau que si aucun choix n'a encore été fait
		if (!wantCookie) {
			bar.style.display = 'block';
		}

		// Refus : on bloque le suivi et on supprime les cookies concernés
		document.getElementById('stop-cookie').onclick = function () {
			Cookies.set('cookie_crunch', 'no', { expires: config.cookieExpiryDays });

			var all = document.cookie.split(';');
			for (var i = 0; i < all.length; i++) {
				var cookieName = all[i].trim().split('=')[0];

				if (cookiesToDelete.test(cookieName)) {
					document.cookie = cookieName + '=;Max-Age=-99999999;';
				} else if (cookiesToDeleteWithDomain.test(cookieName)) {
					document.cookie = cookieName + '=;Max-Age=-99999999;path=;Domain=' + config.domain + ';';
				}
			}

			bar.style.display = 'none';
			check.textContent = 'cookies bloqués';
		};

		// Accord
		document.getElementById('agree').onclick = function () {
			bar.style.display = 'none';
			Cookies.set('cookie_crunch', 'yes', { expires: config.cookieExpiryDays });
			check.textContent = 'cookies acceptés';
		};

		// Ré-ouverture du bandeau via le bouton persistant
		check.onclick = function () {
			bar.style.display = 'block';
		};

		// --- Réinjection des UTM dans les formulaires -------------------------
		var data = parseCookieJson(Cookies.get('cookie_utms'));
		if (data) {
			// « referal » n'est jamais écrit dans le cookie ; conservé pour compat.
			var referral = data.referal !== undefined ? data.referal.replace(/\./g, '+') : '';

			setFieldValue('field_source', data.source);
			setFieldValue('field_medium', data.medium);
			setFieldValue('field_campaign', data.campaign);
			setFieldValue('field_referal', referral);
		}
	});

	// Renseigne un champ de formulaire s'il existe et si la valeur est définie.
	function setFieldValue(id, value) {
		if (value === undefined) { return; }
		var field = document.getElementById(id);
		if (field) {
			field.setAttribute('value', value);
		}
	}
})();
