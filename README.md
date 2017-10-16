# lite-dev-server
This is http file server for develpment. This server supports livereload function and proxy function for your api server.

[![Latest Stable Version](https://img.shields.io/npm/v/lite-dev-server.svg)](https://www.npmjs.com/package/lite-dev-server)
[![License](https://img.shields.io/npm/l/lite-dev-server.svg)](https://www.npmjs.com/package/lite-dev-server)

----------

## [Video tutorial](https://youtu.be/x2N2jSCACzM)

Perhaps you may be interested: [webpack-with-lite-dev-server-babel-koa-react](https://github.com/shadowwzw/webpack-with-lite-dev-server-babel-koa-react)

## **Installation**

```bash
$ npm install lite-dev-server --save-dev
```
or
```bash
$ yarn add lite-dev-server -D
```
----------
## **Usage (default port: 3000)**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer( { folder: "public", watchFolders: ["public"]} );
// http://localhost:3000 response: index.html or index.htm from public folder.
```
----------

Attention: If the html document does not contain a head tag, then liveReload will not work.

## **Usage (on 3333 port)**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer( { folder: "public", watchFolders: ["public"], listen: 3333,} ); 
// http://localhost:3333 response: index.html or index.htm from public folder.
```
----------

## **Usage (random port)**
<p>If you want to OS set random port you can set listen option on 0.</p>
<a href="https://nodejs.org/dist/latest-v6.x/docs/api/http.html#http_server_listen_port_hostname_backlog_callback">More you can find here</a>

```js
const liteDevServer = require("lite-dev-server");
const server = liteDevServer( { folder: "public", watchFolders: ["public"], listen: 0,} ); 
console.log(server.address().port) // your port
```
----------

## **Close server**

```js
const liteDevServer = require("lite-dev-server");
const server = liteDevServer( { folder: "public", watchFolders: ["public"]} );

server.close(); // Close http server
server.wss.close(); // Close websocket server
server.watchers[0].close(); // Close watcher
server.closeAllWatchers(); // Close all watchers
```
----------

## **Usage with proxy function for Express api server**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer({
    folder: "public",
    watchFolders: ["public", "src"],
    proxy: [
        { path: /\/api/, host: "localhost", port: "8888" },
        { path: /\/api2/, host: "localhost", port: "8888" }
    ]
});
// http://localhost:3000 response: index.html or index.htm from public folder.
// http://localhost:3000/api/1 response: "Hello World!!" from express
// http://localhost:3000/api2/person/1 response: "person1" from express

const express = require('express');
const app = express();

app.get('/api/1', function (req, res) {
    res.send('Hello World!!')
});

app.get('/api2/person/1', function (req, res) {
    res.send('person1')
});
app.listen(8888);
```
----------

## **Api**

### **create liteDevServer**
```js
const liteDevServer = require("lite-dev-server");
liteDevServer({
    folder: "public",
    watchFolders: ["public", "src"],
    listen: 3000,
    webSocketPort: 8080,
    page404: null,
    liveReload: true,
    reloadDelay: 200,
    autoInjectClientJS: true,
    historyApiFallback: false,
    reloadDelayOnClient: 1000,
    giveDefaultPage: true,
    defaultPageFirst: "index.html",
    defaultPageSecond: "index.htm",
    serverName: "liteDevServer",
    pathRewrite: {
      pattern: /\/.+\/(\.*)/g,
      replacement: "/$1",
    },
    proxy: [
        { path: /\/api/, host: "localhost", port: "8888" },
        { path: /\/api2/, host: "localhost", port: "8888" },
        { path: /\/gavrilov\/project/, host: "localhost", port: "3000", pathRewrite: {
            pattern: /\/gavrilov\/project/,
            replacement: "",
        }}
    ]
});
```
#### **Arguments**:

* options (Object type):*

  * folder (String) (default value: "public"): Folder for static files.

  * watchFolders (Array of Strings) (default value: ["public"]): Folders for watching (for liveReload).

  * proxy (Array of Objects) (default value: []): Proxy for API (Express, Koa, etc.).
  
  * listen (Integer) (default value: 3000): Port for development server (serve static files).
  
  * webSocketPort (Integer) (default value: 8080): For liveReload.
  
  * page404 (String | Null) (default value: null): Custom page.
  
  * liveReload (Boolean) (default value: true).
  
  * reloadDelayOnClient (Integer) (default value: 100): reload delay for liveReload (on client) (in milliseconds).
  
  * liveReloadDelay (Integer) (default value: 0): Delay before the page is reloaded (on server) (in milliseconds).
  
  * autoInjectClientJS (Boolean) (default value: true): Auto inject javascript in html documents (for liveReload).
  
  * historyApiFallback (Boolean) (default value: false): If you are using the HTML5 history API you probably need to serve your index.html in place of 404 responses, which can be done by setting historyApiFallback: true.

  * giveDefaultPage (Boolean) (default value: true)

  * defaultPageFirst (String) (default value: "index.html")

  * defaultPageSecond (String) (default value: "index.htm")
  
  * serverName (String) (default value: "liteDevServer")
  
  * pathRewrite (Object | Array of Objects | Null) (default value: null)

## **License**

MIT License

Copyright (c) 2017 Gavrilov Ruslan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.