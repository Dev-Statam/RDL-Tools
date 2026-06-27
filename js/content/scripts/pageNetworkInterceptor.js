(() => {
    if (window.__rdlToolsInterceptorInstalled) {
        return;
    }
    window.__rdlToolsInterceptorInstalled = true;

    const BRIDGE_SOURCE = 'rdl-tools-page-bridge';
    const ENDPOINTS = {
        activity: '/api/activitesJournee/',
        rest: '/api/roulement-month/'
    };

    const normalizeUrl = (url) => {
        if (typeof url !== 'string') {
            return '';
        }
        return url.toLowerCase();
    };

    const getMessageTypeFromUrl = (url) => {
        const normalizedUrl = normalizeUrl(url);
        if (normalizedUrl.includes(ENDPOINTS.activity.toLowerCase())) {
            return 'activity-json';
        }
        if (normalizedUrl.includes(ENDPOINTS.rest.toLowerCase())) {
            return 'rest-json';
        }
        return null;
    };

    const postPayload = (type, payload) => {
        window.postMessage(
            {
                source: BRIDGE_SOURCE,
                type,
                payload
            },
            window.location.origin
        );
    };

    const capturePayload = (url, payload) => {
        const type = getMessageTypeFromUrl(url);
        if (!type) {
            return;
        }
        if (payload !== null && typeof payload === 'object') {
            postPayload(type, payload);
        }
    };

    const parseTextAsJson = (text) => {
        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    };

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const requestUrl = typeof args[0] === 'string' ? args[0] : args[0].url;
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            capturePayload(requestUrl, parseTextAsJson(text));
        } catch (error) {
            console.error('[RDL Tools] Erreur lors de l\'interception fetch : ', error);
        }
        return response;
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        this._rdlRequestMethod = method;
        this._rdlRequestUrl = url;
        return originalXhrOpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (...args) {
        this.addEventListener('load', () => {
            try {
                if (this._rdlRequestMethod && this._rdlRequestMethod.toUpperCase() !== 'GET') {
                    return;
                }
                capturePayload(this._rdlRequestUrl, parseTextAsJson(this.responseText));
            } catch (error) {
                console.error('[RDL Tools] Erreur lors de l\'interception XHR : ', error);
            }
        });
        return originalXhrSend.apply(this, args);
    };
})();
