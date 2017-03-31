const fs = require("fs");
const fsp = require("fs-promise");
const mime = require('mime-types');

export const isFile = async path => {
  const stats = await fsp.stat(path);
  if(!stats.isFile()) return new Promise.reject(Error('this is not file'));
};

export const isDirectory = async path => {
  const stats = await fsp.stat(path);
  if(!stats.isDirectory()) return new Promise.reject(new Error('this is not directory'));
};

export const giveHtmlFile = async (res, path, injectStream) => {
  await fsp.access(path, fs.constants.R_OK);
  await isFile(path);
  res.setHeader('Content-Type', 'text/html');
  fs.createReadStream(path).pipe(injectStream).pipe(res);
};

export const giveFile = async (res, path, ext) => {
  await fsp.access(path, fs.constants.R_OK);
  await isFile(path);
  res.setHeader('Content-Type', mime.contentType(ext));
  fs.createReadStream(path).pipe(res);
};
