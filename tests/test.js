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
  watchFolders: [__dirname + "/../tests/static"],
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

const server1Host = `http://localhost:${server1.address().port}/`;
const server2Host = `http://localhost:${server2.address().port}/`;

console.log(server1Host);
console.log(server2Host);

[server1Host, server2Host].forEach((host) => {
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

// server1Host

ava(async t => {
  const result = await rp(server1Host);
  const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
  t.true(result.includes(clientWithValues), 'get default html file from root (inject js)');
});

ava(async t => {
  try{
    await rp(`${server1Host}folder/`);
    t.fail('get default html file from folder');
  } catch(err){
    t.true(err.statusCode === 404 && err.error === MSG404, 'get default html file from folder');
  }
});

ava(async t => {
  const result = await rp(`${server1Host}folder2/`);
  t.true(result.includes("index.html in folder2"), 'get default page from folder2');
});

// server2Host

ava(async t => {
  const result = await rp(server2Host);
  const clientWithValues = client.replace(/webSocketPort/g, webSocketPort).replace(/reloadDelay/g, reloadDelayOnClient);
  t.false(result.includes(clientWithValues), 'get default html file from root (inject js)');
});

ava(async t => {
  const result = await rp(`${server2Host}folder/`);
  t.true(result.includes("index.html in root"), 'check historyApiFallback');
});