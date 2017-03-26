(function () {
    if (WebSocket) {
        const host = location.hostname || "localhost";
        const ws = new WebSocket(`ws://${host}:${webSocketPort}`);
        ws.onopen = function () {
            console.log("lite-dev-server - The WebSocket connection is established successfully");
            ws.onmessage = function (event) {
                if (event.data === "reload page") {
                    setTimeout(function () {
                        console.log("lite-dev-server - Change detected! Page will reload!");
                        location.reload(true);
                    }, reloadDelay);
                }
            }
        };
        ws.onclose = function () {
            console.log("lite-dev-server - Connection lost! Need reload!");
            setInterval(function () {
                location.reload(true);
            }, 1000);
        };
    } else console.log("lite-dev-server - this browser don't support WebSocket!");
})();