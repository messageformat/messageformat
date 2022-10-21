// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('fs', () => require('memfs').fs);

import { fs } from 'memfs';
import { source } from '@messageformat/test-utils';
import { messageformat } from './index';

const jsonSrc = '{"key":{"inner":"value {foo}"}}';
const code = `
export default {
  key: {
    inner: (d) => "value " + d.foo
  }
}`;

describe('filter', () => {
  test('skip foo.json', () => {
    const res = messageformat().transform(jsonSrc, 'foo.json');
    expect(res).toBeNull();
  });

  test('skip messages/fi.json', () => {
    const res = messageformat().transform(jsonSrc, 'messages/fi.json');
    expect(res).toBeNull();
  });

  test('include: /\\.foo$/', () => {
    const { transform } = messageformat({ include: /\.foo$/ });
    const res = transform(jsonSrc, 'file.foo');
    expect(res).toMatchObject({ code });
  });

  describe('locales: "fi"', () => {
    test('hit messages/fi.json', () => {
      const { transform } = messageformat({ locales: 'fi' });
      const res = transform(jsonSrc, 'messages/fi.json');
      expect(res).toMatchObject({ code });
    });
  });

  describe('locales: ["fi","en"]', () => {
    test('hit messages.json', () => {
      const { transform } = messageformat({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages.json');
      expect(res).toMatchObject({ code });
    });

    test('hit messages/en.json', () => {
      const { transform } = messageformat({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages/en.json');
      expect(res).toMatchObject({ code });
    });

    test('skip messages/sv.json', () => {
      const { transform } = messageformat({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages/sv.json');
      expect(res).toBeNull();
    });

    test('include: /\\.foo$/', () => {
      const { transform } = messageformat({
        include: /\.foo$/,
        locales: ['fi', 'en']
      });
      const res = transform(jsonSrc, 'file.fi.foo');
      expect(res).toMatchObject({ code });
    });
  });
});

describe('load .properties', () => {
  test('utf8', async () => {
    const buffer = Buffer.from('kääk', 'utf8');
    fs.writeFileSync('/foo.properties', buffer);
    const res = await messageformat().load('/foo.properties');
    expect(res).toMatchObject({ code: 'kääk' });
  });

  test('latin1', async () => {
    const buffer = Buffer.from('kääk', 'latin1');
    fs.writeFileSync('/foo.properties', buffer);
    const res = await messageformat().load('/foo.properties');
    expect(res).toMatchObject({ code: 'kääk' });
  });

  test('skip .messages.json', async () => {
    const buffer = Buffer.from('kääk', 'utf8');
    fs.writeFileSync('/foo.messages.json', buffer);
    const res = await messageformat().load('/foo.messages.json');
    expect(res).toBeNull();
  });

  test('throw on error', async () => {
    try {
      await messageformat().load('/nonesuch.properties');
      throw new Error('Should not happen');
    } catch (error: any) {
      expect(error.code).toBe('ENOENT');
    }
  });
});

describe('transform', () => {
  test('.messages.json', () => {
    const res = messageformat().transform(jsonSrc, 'foo.messages.json');
    expect(res).toMatchObject({ code });
  });

  test('.messages.yaml', () => {
    const src = 'key:\n  inner: value {foo}\n';
    const res = messageformat().transform(src, 'foo.messages.yaml');
    expect(res).toMatchObject({ code });
  });

  test('.properties', () => {
    const src = 'key.inner: value {foo}\n';
    const res = messageformat().transform(src, 'foo.properties');
    expect(res).toMatchObject({ code });
  });

  test('select locale from filename', () => {
    const src = 'key: value {foo, plural, one{1} other{#}}\n';
    const { transform } = messageformat({ locales: ['en', 'fi'] });
    const res = transform(src, 'fi.properties');
    expect(res).toMatchObject({
      code: source`
        import { number, plural } from "@messageformat/runtime";
        import { fi } from "@messageformat/runtime/lib/cardinals";
        export default {
          key: (d) => "value " + plural(d.foo, 0, fi, { one: "1", other: number("fi", d.foo, 0) })
        }`
    });
  });
});
