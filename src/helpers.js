const fs = require("fs");
const fsp = require("fs-promise");
const mime = require('mime-types');

export const giveHtmlFile = async (res, path, injectStream) => {
  await fsp.access(path, fs.constants.R_OK);
  const stats = await fsp.stat(path);
  if(!stats.isFile()) throw new Error('this is folder');
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(path).pipe(injectStream).pipe(res);
};

export const giveFile = async (res, path, ext) => {
  await fsp.access(path, fs.constants.R_OK);
  const stats = await fsp.stat(path);
  if(!stats.isFile()) throw new Error('this is folder');
  res.setHeader('Content-Type', mime.contentType(ext));
  fs.createReadStream(path).pipe(res);
};
