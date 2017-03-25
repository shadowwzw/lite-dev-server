const path = require("path");
const http = require("http");
const fs = require("fs");
const Transform = require("stream").Transform;
const MSG404 = "404 page not found!";
const CODE404 = 404;
const INDEX_HTML = "index.html";
const INDEX_HTM = "index.htm";

if (!fs.constants){
  fs.constants = {
    R_OK: 4,
  }
}

const liteDevServer = ({ folder = "public", page404 = null, listen = 3000, liveReload = true, webSocketPort = 8080, watchFolders = ["public"], autoInjectClientJS = true, proxy = [], liveReloadDelay = 0, historyApiFallback = false }) => {
    const clientScript = `!function(){if(WebSocket){var e=location.hostname||"localhost",o=new WebSocket("ws://"+e+":${webSocketPort}");o.onopen=function(){console.log("lite-dev-server - The WebSocket connection is established successfully"),o.onmessage=function(e){"reload page"===e.data&&setTimeout(function(){console.log("lite-dev-server - Change detected! Page will reload!"),location.reload(!0)},100)}},o.onclose=function(){console.log("lite-dev-server - Connection lost! Need reload!"),setInterval(function(){location.reload(!0)},1e3)}}else console.log("lite-dev-server - this browser don't support WebSocket!")}();`;
    const _transform = function(chunk, enc, cb){
        if(autoInjectClientJS){
            const newChunk = (chunk+"").replace(/(<head>)/, `$1 \n<script>${clientScript}</script>`);
            this.push(newChunk);
        } else this.push(chunk);
        cb();
    };
    if(liveReload){
        const EventEmitter = require("events");
        const liveReloadEM = new EventEmitter();
        const ws = require("ws");
        const wss = new ws.Server({ port: webSocketPort });
        wss.on("connection", connection=>{
            console.log("\nlite-dev-server: The WebSocket connection is established successfully");
            const reloadHandler = ()=>{
                connection.send("reload page");
            };
            liveReloadEM.on("reload", reloadHandler);
            connection.on("close", ()=>{
                liveReloadEM.removeListener("reload", reloadHandler);
            });
        });
        watchFolders = watchFolders.filter(folder => {
            try{
                fs.accessSync(`${folder}`);
                return true;
            } catch(err){
                console.log(err+"");
                return false;
            }
        });
        console.log("\nwatchFolders", watchFolders);
        watchFolders.forEach(folder => {
            fs.watch(`${folder}`, {recursive: true}, ()=>{
                setTimeout(function(){
                    liveReloadEM.emit("reload");
                }, liveReloadDelay);
            });
        });
    }
    if(page404)
        try{
            fs.accessSync(`${folder}/${page404}`, fs.constants.R_OK);
        } catch (err){
            console.log(err+"");
        }

    const server = http.createServer((req, res) => {

        const matchedProxy = proxy.find(item => {
            const regExp = new RegExp(`^\/${item.path}(\/.*)?$`);
            return req.url.match(regExp) && item.host && item.port;
        });
        if(matchedProxy){
            const options = {
                hostname: matchedProxy.host,
                port: matchedProxy.port,
                path: req.url,
                method: req.method,
                headers: req.headers,
            };
            const request = http.request(options, _res => {
                res.writeHead(_res.statusCode, _res.headers);
                _res.pipe(res)
            });
            request.end();
        } else {
            const injectStream = new Transform();
            injectStream._transform = _transform;
            if(req.url === "/" || historyApiFallback) {
                fs.access(`${folder}/${INDEX_HTML}`, fs.constants.R_OK, err => {
                    if(err) fs.access(`${folder}/${INDEX_HTM}`, fs.constants.R_OK, err =>{
                        if(err){
                            console.log(err+"");
                            res.statusCode = CODE404;
                            if (page404) fs.createReadStream(`${folder}/${page404}`).pipe(injectStream).pipe(res);
                            else res.end(MSG404);
                        }
                        else fs.createReadStream(`${folder}/${INDEX_HTM}`).pipe(injectStream).pipe(res);
                    });
                    else fs.createReadStream(`${folder}/${INDEX_HTML}`).pipe(injectStream).pipe(res);
                });
            } else {
                fs.access(`${folder}${req.url}`, fs.constants.R_OK, err => {
                    if(err) {
                        console.log(err+"");
                        res.statusCode = CODE404;
                        if (page404) fs.createReadStream(`${folder}/${page404}`).pipe(injectStream).pipe(res);
                        else res.end(MSG404);
                    }
                    else {
                        const ext = path.extname(req.url);
                        if (ext === ".html" || ext === ".htm")
                            fs.createReadStream(`${folder}${req.url}`).pipe(injectStream).pipe(res);
                        else
                            fs.createReadStream(`${folder}${req.url}`).pipe(res);
                    }
                });
            }
        }
    });
    server.listen(listen);
    console.log(`lite-dev-server listening on port ${listen}`);
};

module.exports = liteDevServer;
