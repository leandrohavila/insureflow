export const SPLASH_STORAGE_KEY = "portal_splash_seen";
export const SPLASH_VISIBLE_MS = 1500;
export const SPLASH_SEEN_ATTRIBUTE = "data-portal-splash";

export const splashBootScript = `try{if(sessionStorage.getItem("${SPLASH_STORAGE_KEY}")==="true")document.documentElement.setAttribute("${SPLASH_SEEN_ATTRIBUTE}","seen")}catch(e){document.documentElement.setAttribute("${SPLASH_SEEN_ATTRIBUTE}","seen")}`;
