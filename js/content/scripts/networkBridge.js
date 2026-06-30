/**
 * Module de communication entre le content script et le script page injecté.
 * 
 * Responsabilités :
 * - Injection du script pageNetworkInterceptor.js dans la page (page script)
 * - Validation des messages reçus depuis la page pour éviter les injections malveillantes
 * - Bridge de communication window.postMessage entre content et page scripts
 * 
 * Méthodes publiques :
 * - init() : Initialise le bridge en injectant le script interceptor dans la page
 * - isFromBridge(event) : Valide qu'un message provient du bridge (filtre de sécurité)
 */
const networkBridge = {
    source: 'rdl-tools-page-bridge',
    init() {
        const extensionApi = typeof browser !== 'undefined' ? browser : chrome;
        const interceptorScript = document.createElement('script');
        interceptorScript.src = extensionApi.runtime.getURL('js/content/scripts/pageNetworkInterceptor.js');
        interceptorScript.type = 'text/javascript';
        interceptorScript.onload = () => interceptorScript.remove();
        (document.head || document.documentElement).appendChild(interceptorScript);
    },
    isFromBridge(event) {
        return event.source === window && event.data && event.data.source === networkBridge.source;
    }
};

networkBridge.init();
