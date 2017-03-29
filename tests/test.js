const rp = require('request-promise');
const fs = require('fs');
const client = fs.readFileSync(`${__dirname}/../lib/client.js`, 'UTF-8');
const ava = require('ava');
const liteDevServer = require("../lib/server");
const webSocketPort = 8080;
const reloadDelayOnClient = 1000;
const localhost3000 = "http://localhost:3000/";
const localhost3001 = "http://localhost:3001/";
liteDevServer({
    folder: __dirname + "/../tests/static",
    watchFolders: [__dirname + "/../tests/static"],
    listen: 3000,
    webSocketPort,
    page404: null,
    liveReload: true,
    reloadDelay: 200,
    autoInjectClientJS: true,
    historyApiFallback: false,
    reloadDelayOnClient,
    proxy: [
        { path: /\/api/, host: "localhost", port: "8888" },
        { path: /\/api2/, host: "localhost", port: "8888" },
        { path: /\/gavrilov\/project/, host: "localhost", port: "3000", pathRewrite: {
            pattern: /\/gavrilov\/project/,
            replacement: "",
        }}
    ]
});

liteDevServer({
    folder: __dirname + "/../tests/static",
    watchFolders: [__dirname + "/../tests/static"],
    listen: 3001,
    page404: null,
    liveReload: false,
    reloadDelay: 200,
    autoInjectClientJS: false,
    historyApiFallback: true,
    reloadDelayOnClient,
    proxy: [
        { path: /\/api/, host: "localhost", port: "8888" },
        { path: /\/api2/, host: "localhost", port: "8888" },
        { path: /\/gavrilov\/project/, host: "localhost", port: "3000", pathRewrite: {
            pattern: /\/gavrilov\/project/,
            replacement: "",
        }}
    ]
});

// (async () => {
//     const result = await rp("http://localhost:3000");
//     console.log(result);
// })();
//
// console.log(client);
[localhost3000, localhost3001].forEach((host)=>{
    ava(async t => {
        const result = await rp(host);
        t.true(result.includes("index.html in root"), 'get default html file from root');
    });

    ava(async t => {
        const result = await rp(`${host}index.html`);
        t.true(result.includes("index.html in root"), 'get index.html file from root');
    });

    ava(async t => {
        const result = await rp(`${host}root.html`);
        t.true(result.includes("root.html in root"), 'get root.html file from root');
    });

    ava(async t => {
        const result = await rp(`${host}folder/some.html`);
        t.true(result.includes("some.html in folder"), 'get some.html file from folder');
    });
});

// on 3000 port

ava(async t => {
    const result = await rp(localhost3000);
    const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
    t.true(result.includes(clientWithValues), 'get default html file from root (inject js)');
});

// on 3001 port

ava(async t => {
    const result = await rp(localhost3001);
    const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
    t.false(result.includes(clientWithValues), 'get default html file from root (inject js)');
});