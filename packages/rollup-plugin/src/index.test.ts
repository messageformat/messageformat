jest.mock('fs', () => require('memfs').fs);

import { source } from 'common-tags';
import { fs } from 'memfs';
import plugin from './index';

const jsonSrc = '{"key":{"inner":"value {foo}"}}';
const code = `
export default {
  key: {
    inner: function(d) { return "value " + d.foo; }
  }
}`;

describe('filter', () => {
  test('skip foo.json', () => {
    const res = plugin().transform(jsonSrc, 'foo.json');
    expect(res).toBeNull();
  });

  test('skip messages/fi.json', () => {
    const res = plugin().transform(jsonSrc, 'messages/fi.json');
    expect(res).toBeNull();
  });

  test('include: /\\.foo$/', () => {
    const { transform } = plugin({ include: /\.foo$/ });
    const res = transform(jsonSrc, 'file.foo');
    expect(res).toMatchObject({ code });
  });

  describe('locales: "fi"', () => {
    test('hit messages/fi.json', () => {
      const { transform } = plugin({ locales: 'fi' });
      const res = transform(jsonSrc, 'messages/fi.json');
      expect(res).toMatchObject({ code });
    });
  });

  describe('locales: ["fi","en"]', () => {
    test('hit messages.json', () => {
      const { transform } = plugin({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages.json');
      expect(res).toMatchObject({ code });
    });

    test('hit messages/en.json', () => {
      const { transform } = plugin({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages/en.json');
      expect(res).toMatchObject({ code });
    });

    test('skip messages/sv.json', () => {
      const { transform } = plugin({ locales: ['fi', 'en'] });
      const res = transform(jsonSrc, 'messages/sv.json');
      expect(res).toBeNull();
    });

    test('include: /\\.foo$/', () => {
      const { transform } = plugin({
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
    const res = await plugin().load('/foo.properties');
    expect(res).toMatchObject({ code: 'kääk' });
  });

  test('latin1', async () => {
    const buffer = Buffer.from('kääk', 'latin1');
    fs.writeFileSync('/foo.properties', buffer);
    const res = await plugin().load('/foo.properties');
    expect(res).toMatchObject({ code: 'kääk' });
  });

  test('skip .messages.json', async () => {
    const buffer = Buffer.from('kääk', 'utf8');
    fs.writeFileSync('/foo.messages.json', buffer);
    const res = await plugin().load('/foo.messages.json');
    expect(res).toBeNull();
  });

  test('throw on error', async () => {
    try {
      await plugin().load('/nonesuch.properties');
      throw new Error('Should not happen')
    } catch (error) {
      expect(error.code).toBe('ENOENT')
    }
  })
});

describe('transform', () => {
  test('.messages.json', () => {
    const res = plugin().transform(jsonSrc, 'foo.messages.json');
    expect(res).toMatchObject({ code });
  });

  test('.messages.yaml', () => {
    const src = 'key:\n  inner: value {foo}\n';
    const res = plugin().transform(src, 'foo.messages.yaml');
    expect(res).toMatchObject({ code });
  });

  test('.properties', () => {
    const src = 'key.inner: value {foo}\n';
    const res = plugin().transform(src, 'foo.properties');
    expect(res).toMatchObject({ code });
  });

  test('select locale from filename', () => {
    const src = 'key: value {foo, plural, one{1} other{#}}\n';
    const { transform } = plugin({ locales: ['en', 'fi'] });
    const res = transform(src, 'fi.properties');
    expect(res).toMatchObject({
      code: source`
        import { number, plural } from 'messageformat-runtime';
        import { fi } from 'messageformat-runtime/lib/cardinals';
        export default {
          key: function(d) { return "value " + plural(d.foo, 0, fi, { one: "1", other: number("fi", d.foo, 0) }); }
        }`
    });
  });
});
