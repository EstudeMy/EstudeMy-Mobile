(function() {
    if (typeof document !== 'undefined') {
        // Injeta os links da fonte Google Jaro
        var link1 = document.createElement('link');
        link1.rel = 'preconnect';
        link1.href = 'https://fonts.googleapis.com';
        document.head.appendChild(link1);

        var link2 = document.createElement('link');
        link2.rel = 'preconnect';
        link2.href = 'https://fonts.gstatic.com';
        link2.crossOrigin = 'anonymous';
        document.head.appendChild(link2);

        var link3 = document.createElement('link');
        link3.rel = 'stylesheet';
        link3.href = 'https://fonts.googleapis.com/css2?family=Jaro&display=swap';
        document.head.appendChild(link3);

        // Injeta estilos CSS para forçar redimensionamento em tela cheia com aspect ratio
        var style = document.createElement('style');
        style.innerHTML = `
            html, body {
                margin: 0px !important;
                padding: 0px !important;
                border: 0px !important;
                overflow: hidden !important;
                width: 100% !important;
                height: 100% !important;
                background-color: #000000 !important;
            }
            canvas, #canvas {
                width: 100% !important;
                height: 100% !important;
                display: block !important;
            }
        `;
        document.head.appendChild(style);
    }
})();

function obter_dados_fase_js() {
    if (window.gameData) {
        return JSON.stringify(window.gameData);
    }
    if (parent && parent.gameData) {
        return JSON.stringify(parent.gameData);
    }
    return "";
}

function jogar_voltar_js() {
    console.log("[PonteJS] Tentando voltar para a trilha / página anterior...");
    try {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "VOLTAR_PAGINA" }));
            return;
        }
    } catch (e) {}

    try {
        if (window.parent && typeof window.parent.jogar_voltar_js === "function") {
            window.parent.jogar_voltar_js();
            return;
        }
    } catch (e) {}

    try {
        if (typeof window.jogar_voltar_js === "function") {
            window.jogar_voltar_js();
            return;
        }
    } catch (e) {}

    try {
        if (window.parent) {
            window.parent.postMessage({ type: "VOLTAR_PAGINA" }, "*");
        }
    } catch (e) {}

    try {
        if (window.parent && window.parent.history && window.parent.history.length > 1) {
            window.parent.history.back();
            return;
        }
    } catch (e) {}

    try {
        if (window.parent) {
            window.parent.location.href = "/trilha";
        }
    } catch (e) {}
}

function notificar_vitoria_js() {
    console.log("[PonteJS] Vitória! Notificando aplicação...");
    try {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "FIM_FASE", vitoria: true }));
        }
    } catch (e) {}

    try {
        if (window.parent) {
            window.parent.postMessage({ type: "FIM_FASE", vitoria: true }, "*");
        }
    } catch (e) {
        console.error("Erro ao enviar mensagem de vitória:", e);
    }
}

function notificar_derrota_js() {
    console.log("[PonteJS] Derrota! Notificando aplicação...");
    try {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: "FIM_FASE", vitoria: false }));
        }
    } catch (e) {}

    try {
        if (window.parent) {
            window.parent.postMessage({ type: "FIM_FASE", vitoria: false }, "*");
        }
    } catch (e) {
        console.error("Erro ao enviar mensagem de derrota:", e);
    }
}
