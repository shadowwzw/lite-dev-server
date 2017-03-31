const path = require("path");
const http = require("http");
const fsp = require("fs-promise");
const fs = require("fs");
const Transform = require("stream").Transform;
const mime = require('mime-types');
const chalk = require('chalk');
const MSG404 = "not found";
const CODE404 = 404;
const INDEX_HTML = "index.html";
const INDEX_HTM = "index.htm";

if (!fs.constants) {
  fs.constants = {
    R_OK: 4,
  }
}

const liteDevServer = ({
                         folder = "public",
                         page404 = null,
                         listen = 3000,
                         liveReload = true,
                         webSocketPort = 8080,
                         watchFolders = ["public"],
                         autoInjectClientJS = true,
                         proxy = [],
                         liveReloadDelay = 0,
                         historyApiFallback = false,
                         reloadDelayOnClient = 100,
                       }) => {
  const clientScript = fs.readFileSync(`${__dirname}/client.js`, 'utf8').replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
  const _transform = function (chunk, enc, cb) {
    if (autoInjectClientJS) {
      const newChunk = (chunk + "").replace(/(<head>)/, `$1 \n<script>${clientScript}</script>`);
      this.push(newChunk);
    } else this.push(chunk);
    cb();
  };
  let wss = null;
  if (liveReload) {
    const EventEmitter = require("events");
    const liveReloadEM = new EventEmitter();
    const ws = require("ws");
    wss = new ws.Server({port: webSocketPort});
    wss.on("connection", connection => {
      console.log("\nlite-dev-server: The WebSocket connection is established successfully");
      const reloadHandler = () => {
        connection.send("reload page");
      };
      liveReloadEM.on("reload", reloadHandler);
      connection.on("close", () => {
        liveReloadEM.removeListener("reload", reloadHandler);
      });
    });
    watchFolders = watchFolders.filter(folder => {
      try {
        fs.accessSync(`${folder}`);
        return true;
      } catch (err) {
        console.log(chalk.red(err + ""));
        return false;
      }
    });
    console.log(chalk.green(`\nwatchFolders ${watchFolders}`));
    watchFolders.forEach(folder => {
      fs.watch(`${folder}`, {recursive: true}, () => {
        setTimeout(function () {
          liveReloadEM.emit("reload");
        }, liveReloadDelay);
      });
    });
  }
  if (page404)
    try {
      fs.accessSync(`${folder}/${page404}`, fs.constants.R_OK);
    } catch (err) {
      console.log(chalk.red(err + ""));
    }

  const server = http.createServer(async (req, res) => {
    const ext = path.extname(req.url);
    console.log(chalk.blue(`<-- ${req.url}`));
    const matchedProxy = proxy.find(item => {
      return req.url.match(item.path) && item.host && item.port;
    });
    if (matchedProxy) {
      let url = req.url;
      const pathRewrite = matchedProxy.pathRewrite;
      if (pathRewrite && (typeof pathRewrite === 'object')) {
        url = url.replace(pathRewrite.pattern, pathRewrite.replacement);
      }
      const options = {
        hostname: matchedProxy.host,
        port: matchedProxy.port,
        path: url,
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
      if (req.url === "/" || (historyApiFallback && !ext)) {
        try {
          await fsp.access(`${folder}/${INDEX_HTML}`, fs.constants.R_OK);
          const stats = await fsp.stat(`${folder}/${INDEX_HTML}`);
          if(!stats.isFile()) throw new Error('this is folder');
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(`${folder}/${INDEX_HTML}`).pipe(injectStream).pipe(res);
        } catch (err) {
          try {
            await fsp.access(`${folder}/${INDEX_HTM}`, fs.constants.R_OK);
            const stats = await fsp.stat(`${folder}/${INDEX_HTM}`);
            if(!stats.isFile()) throw new Error('this is folder');
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(`${folder}/${INDEX_HTM}`).pipe(injectStream).pipe(res);
          } catch (err) {
            console.log(chalk.red(err + ""));
            res.statusCode = CODE404;
            if (page404) fs.createReadStream(`${folder}/${page404}`).pipe(injectStream).pipe(res);
            else res.end(MSG404);
          }
        }
      } else {
        try {
          await fsp.access(`${folder}${req.url}`, fs.constants.R_OK);
          const stats = await fsp.stat(`${folder}${req.url}`);
          if(!stats.isFile()) throw new Error('this is folder');
          if (ext === ".html" || ext === ".htm") {
            res.setHeader('Content-Type', 'text/html');
            fs.createReadStream(`${folder}${req.url}`).pipe(injectStream).pipe(res);
          } else {
            res.setHeader('Content-Type', mime.contentType(ext));
            fs.createReadStream(`${folder}${req.url}`).pipe(res);
          }
        } catch (err) {
          console.log(chalk.red(err + ""));
          res.statusCode = CODE404;
          if (page404) fs.createReadStream(`${folder}/${page404}`).pipe(injectStream).pipe(res);
          else res.end(MSG404);
        }
      }
    }
  });
  server.listen(listen);
  console.log(chalk.green(`lite-dev-server listening on port ${server.address().port}`));
  server.wss = wss;
  return server;
};

module.exports = liteDevServer;
