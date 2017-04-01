const path = require("path");
const http = require("http");
const fs = require("fs");
const Transform = require("stream").Transform;
const chalk = require('chalk');
const MSG404 = "not found";
const CODE404 = 404;
import { giveHtmlFile, giveFile, isDirectory, isFile } from './helpers';

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
                         giveDefaultPage = true,
                         defaultPageFirst = "index.html",
                         defaultPageSecond = "index.htm",
                         serverName = "liteDevServer",
                         pathRewrite = null,
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
    wss = new ws.Server({ port: webSocketPort });
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
      fs.watch(`${folder}`, { recursive: true }, () => {
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
    let url = req.url;
    const ext = path.extname(url);
    console.log(chalk.blue(`<-- ${req.url} ${serverName}`));
    const matchedProxy = proxy.find(item => {
      return req.url.match(item.path) && item.host && item.port;
    });
    if (matchedProxy) {
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
      if (pathRewrite) {
        [].concat(pathRewrite).forEach(i => {
          if (i && i.pattern && i.replacement) {
            url = url.replace(i.pattern, i.replacement);
          }
        })
      }
      const injectStream = new Transform();
      injectStream._transform = _transform;
      if (req.url === "/" || (historyApiFallback && !ext)) {
        try {
          await giveHtmlFile(res, `${folder}/${defaultPageFirst}`, injectStream);
        } catch (err) {
          try {
            await giveHtmlFile(res, `${folder}/${defaultPageSecond}`, injectStream);
          } catch (err) {
            console.log(chalk.red(err + ""));
            res.statusCode = CODE404;
            if (page404) await giveHtmlFile(res, `${folder}/${page404}`, injectStream);
            else res.end(MSG404);
          }
        }
      } else {
        try {
          try {
            await isFile(`${folder}${req.url}`);
            if (ext === ".html" || ext === ".htm") {
              await giveHtmlFile(res, `${folder}${req.url}`, injectStream);
            } else {
              await giveFile(res, `${folder}${req.url}`, ext);
            }
          } catch (err) {
            try {
              if (giveDefaultPage) {
                await isDirectory(`${folder}${req.url}`);
                try {
                  await giveHtmlFile(res, `${folder}${req.url}${defaultPageFirst}`, injectStream);
                } catch (err) {
                  try {
                    await giveHtmlFile(res, `${folder}${req.url}${defaultPageSecond}`, injectStream);
                  } catch (err) {
                    console.log(chalk.red(err + ""));
                    res.statusCode = CODE404;
                    if (page404) await giveHtmlFile(res, `${folder}/${page404}`, injectStream);
                    else res.end(MSG404);
                  }
                }
              } else {
                throw new Error("giveDefaultPage is false");
              }
            } catch (err) {
              console.log(chalk.red(err + ""));
            }
          }
        } catch (err) {
          console.log(chalk.red(err + ""));
          res.statusCode = CODE404;
          if (page404) await giveHtmlFile(res, `${folder}/${page404}`, injectStream);
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
