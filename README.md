# lite-dev-server
This is http file server for develpment. This server supports livereload function and proxy function for your api server.

[![Latest Stable Version](https://img.shields.io/npm/v/lite-dev-server.svg)](https://www.npmjs.com/package/lite-dev-server)
[![License](https://img.shields.io/npm/l/lite-dev-server.svg)](https://www.npmjs.com/package/lite-dev-server)

----------

## [Video tutorial](https://youtu.be/x2N2jSCACzM)

## **Installation**

```bash
$ npm install lite-dev-server
```
----------
## **Usage (default port: 3000)**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer( { folder: "public", watchFolders: ["public"]} );
// http://localhost:3000 response: index.html or index.htm from public folder.
```
----------

## **Usage (on 3333 port)**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer( { folder: "public", watchFolders: ["public"], listen: 3333,} ); 
// http://localhost:3333 response: index.html or index.htm from public folder.
```
----------

## **Usage with proxy function for Express api server**

```js
const liteDevServer = require("lite-dev-server");
liteDevServer({
    folder: "public",
    watchFolders: ["public", "src"],
    proxy: [
        { path: "api", host: "localhost", port: "8888" },
        { path: "api2", host: "localhost", port: "8888" }
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
    autoInjectClientJS: true,
    proxy: [
        { path: "api", host: "localhost", port: "8888" },
        { path: "api2", host: "localhost", port: "8888" }
    ]
});
```
####**Arguments**:

* options (Object type):*

  * folder (String) (default value: "public"): Folder for static files.

  * watchFolders (Array of Strings) (default value: ["public"]): Folders for watching (for liveReload).

  * proxy (Array of Objects) (default value: []): Proxy for API (Express, Koa, etc.).
  
  * listen (Integer) (default value: 3000): Port for development server (serve static files).
  
  * webSocketPort (Integer) (default value: 8080): For liveReload.
  
  * page404 (String | Null) (default value: null): Custom page.
  
  * liveReload (Boolean) (default value: true).
  
  * autoInjectClientJS (Boolean) (default value: true): Auto inject javascript in html documents (for liveReload).

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