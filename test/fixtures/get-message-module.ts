import * as fs from 'fs';
import { file } from 'tmp-promise';
import { promisify } from 'util';
import compileModule, {
  MessageModule
} from '@messageformat/core/src/compile-module';
import { StringStructure } from '@messageformat/core/src/compiler';
import MessageFormat from '@messageformat/core';

const write = promisify(fs.write);

export async function getModule<T extends StringStructure>(
  mf: MessageFormat,
  messages: T
) {
  const src = compileModule(mf, messages);
  const { cleanup, fd, path } = await file({
    dir: __dirname,
    tmpdir: __dirname,
    postfix: '.mjs'
  });
  await write(fd, src, 0, 'utf8');
  try {
    const mod = await import(path);
    return mod.default as MessageModule<T>;
  } finally {
    cleanup();
  }
}
