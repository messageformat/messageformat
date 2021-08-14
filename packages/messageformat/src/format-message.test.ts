// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';

import { MessageFormat, Runtime } from './index';

describe('Function returns primitive value', () => {
  test('string', () => {
    const src = source`
      msg = { STRINGIFY($var) }
    `;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: { STRINGIFY: (_lc, _opt, arg) => String(arg.valueOf()) },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: '42' }
    ]);
    expect(mf.format('msg', { var: 42 })).toBe('42');
  });

  test('number', () => {
    const src = `msg = { NUMERIC($var) }\n`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime<number> = {
      format: { NUMERIC: (_lc, _opt, arg) => Number(arg.valueOf()) },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: '42' })).toMatchObject([
      { type: 'dynamic', value: 42 }
    ]);
    expect(mf.format('msg', { var: '42' })).toBe('42');
  });
});

describe('Function returns Formatted value', () => {
  test('with meta value', () => {
    const src = `msg = { STRINGIFY($var) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: {
        STRINGIFY: (_lc, _opt, arg) =>
          Object.assign(arg, {
            value: String(arg.valueOf()),
            meta: { foo: 'FOO' }
          })
      },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: '42', meta: { foo: 'FOO' } }
    ]);
  });

  test('literal is made dynamic', () => {
    const src = `msg = { STRINGIFY(42) }`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: {
        STRINGIFY(_lc, _opt, arg) {
          expect(arg.type).toBe('literal');
          return Object.assign(arg, {
            value: String(arg.valueOf()),
            meta: { foo: 'FOO' }
          });
        }
      },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg')).toMatchObject([
      { type: 'dynamic', value: '42', meta: { foo: 'FOO' } }
    ]);
  });

  test('with function composition', () => {
    const src = `msg = { OUT(IN($var)) }\n`;
    const res = compileFluent(src, { id: 'res', locale: 'en' });
    const runtime: Runtime = {
      format: {
        IN: (_lc, _opt, arg) => Object.assign(arg, { meta: { foo: 'FOO' } }),
        OUT: (_lc, _opt, arg) =>
          Object.assign(arg, { meta: Object.assign({ bar: 'BAR' }, arg.meta) })
      },
      select: {}
    };
    const mf = new MessageFormat('en', runtime, res);
    expect(mf.formatToParts('msg', { var: 42 })).toMatchObject([
      { type: 'dynamic', value: 42, meta: { foo: 'FOO', bar: 'BAR' } }
    ]);
  });
});
