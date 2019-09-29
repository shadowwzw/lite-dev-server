const rp = require('request-promise');
const fs = require('fs');
const client = fs.readFileSync(`${__dirname}/../lib/client.js`, 'UTF-8');
const ava = require('ava');
const liteDevServer = require("../lib/server");
const webSocketPort = 0;
const reloadDelayOnClient = 1000;
const MSG404 = "not found";

const server1 = liteDevServer({
  serverName: "server1",
  folder: __dirname + "/../tests/static",
  watchFolders: [__dirname + "/../tests/static"],
  listen: 0,
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
    {
      path: /\/gavrilov\/project/, host: "localhost", port: "3000", pathRewrite: {
      pattern: /\/gavrilov\/project/,
      replacement: "",
    }
    }
  ]
});

const server2 = liteDevServer({
  serverName: "server2",
  folder: __dirname + "/../tests/static",
  listen: 0,
  page404: null,
  liveReload: false,
  reloadDelay: 200,
  autoInjectClientJS: false,
  historyApiFallback: true,
  reloadDelayOnClient,
  proxy: [
    { path: /\/api/, host: "localhost", port: "8888" },
    { path: /\/api2/, host: "localhost", port: "8888" },
    {
      path: /\/gavrilov\/project/, host: "localhost", port: "3000", pathRewrite: {
      pattern: /\/gavrilov\/project/,
      replacement: "",
    }
    }
  ]
});

[server1, server2].forEach((server, index) => {
  const host = `http://localhost:${server.address().port}/`;
  console.log(host);
  ava(`test1 ${index}`, async t => {
    const result = await rp(host);
    t.true(result.includes("index.html in root"), 'get default html file from root');
  });

  ava(`test2 ${index}`, async t => {
    const result = await rp(`${host}index.html`);
    t.true(result.includes("index.html in root"), 'get index.html file from root');
  });

  ava(`test3 ${index}`, async t => {
    const result = await rp(`${host}root.html`);
    t.true(result.includes("root.html in root"), 'get root.html file from root');
  });

  ava(`test4 ${index}`, async t => {
    const result = await rp(`${host}folder/some.html`);
    t.true(result.includes("some.html in folder"), 'get some.html file from folder');
  });

  if (index === 0) {
    // server1Host
    ava(`test5 ${index}`, async t => {
      const result = await rp(host);
      const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
      t.true(result.includes(clientWithValues), 'get default html file from root (inject js)');
    });

    ava(`test6 ${index}`, async t => {
      try{
        await rp(`${host}folder/`);
        t.fail('get default html file from folder');
      } catch(err){
        t.true(err.statusCode === 404 && err.error === MSG404, 'get default html file from folder');
      }
    });

    ava(`test7 ${index}`, async t => {
      const result = await rp(`${host}folder2/`);
      t.true(result.includes("index.html in folder2"), 'get default page from folder2');
    });

    ava(`test8 ${index}`, async t => {
      t.true(typeof server.close === 'function', 'method for close http server');
    });

    ava(`test9 ${index}`, async t => {
      t.true(server.wss && typeof server.wss.close === 'function', 'method for close webSocket server');
    });

    ava(`test10 ${index}`, async t => {
      t.true(typeof server.closeAllWatchers === 'function', 'method for close all watchers');
    });

    ava(`test11 ${index}`, async t => {
      t.true(server.watchers && !!server.watchers.length, 'array of watchers');
    });
  } else {
    // server2Host
    ava(`test12 ${index}`, async t => {
      const result = await rp(host);
      const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
      t.false(result.includes(clientWithValues), 'get default html file from root (inject js)');
    });

    ava(`test13 ${index}`, async t => {
      const result = await rp(`${host}folder/`);
      t.true(result.includes("index.html in root"), 'check historyApiFallback');
    });
  }

});
