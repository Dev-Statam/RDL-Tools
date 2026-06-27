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
