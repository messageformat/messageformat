import Messages from './messages';
import MessageFormat from '@messageformat/core';
import { getModule } from '~/test/fixtures/get-message-module';
import { MessageModule } from '@messageformat/core/src/compile-module'; // FIXME

const msgSet = {
  en: {
    a: 'A {TYPE} example.',
    b: 'This has {COUNT, plural, one{one user} other{# users}}.',
    c: {
      d: 'We have {P, number, percent} code coverage.'
    }
  },
  fi: {
    b: 'Tällä on {COUNT, plural, one{yksi käyttäjä} other{# käyttäjää}}.',
    e: 'Minä puhun vain suomea.'
  }
};

let msgData: MessageModule<typeof msgSet>;
beforeAll(async () => {
  const mf = new MessageFormat(['en', 'fi']);
  msgData = await getModule(mf, msgSet);
});

let messages: Messages;
beforeEach(() => {
  messages = new Messages(msgData, 'en');
});

it('constructor', () => {
  expect(messages).toBeInstanceOf(Messages);
  expect(messages.locale).toBe('en');
  expect(messages.defaultLocale).toBe('en');
  expect(messages.availableLocales).toMatchObject(['en', 'fi']);
  messages = new Messages(msgData);
  expect(messages.locale).toBe('en');
  messages = new Messages(msgData, 'fi');
  expect(messages.locale).toBe('fi');
  messages = new Messages(msgData, null);
  expect(messages.locale).toBe(null);
});

it('defaultLocale', () => {
  expect(messages.defaultLocale).toBe('en');
  messages.defaultLocale = 'fi-FI';
  expect(messages.defaultLocale).toBe('fi');
  messages._data['sv-SE'] = {};
  messages.defaultLocale = 'sv';
  expect(messages.defaultLocale).toBe('sv-SE');
  messages.defaultLocale = 'foo';
  expect(messages.defaultLocale).toBe(null);
});

it('locale', () => {
  expect(messages.locale).toBe('en');
  messages.locale = 'fi-FI';
  expect(messages.locale).toBe('fi');
  messages._data['sv-SE'] = {};
  messages.locale = 'sv';
  expect(messages.locale).toBe('sv-SE');
  messages.locale = 'foo';
  expect(messages.locale).toBe(null);
});

it('hasMessage', () => {
  expect(messages.hasMessage('a')).toBe(true);
  expect(messages.hasMessage('c')).toBe(false);
  messages.locale = 'fi';
  expect(messages.hasMessage('a')).toBe(false);
  expect(messages.hasMessage('a', 'en')).toBe(true);
  expect(messages.hasMessage('a', null, true)).toBe(true);
});

it('hasObject', () => {
  expect(messages.hasObject('a')).toBe(false);
  expect(messages.hasObject('c')).toBe(true);
  messages.locale = 'fi';
  expect(messages.hasObject('c')).toBe(false);
  expect(messages.hasObject('c', 'en')).toBe(true);
  expect(messages.hasObject('c', null, true)).toBe(true);
});

it('resolveLocale', () => {
  expect(messages.resolveLocale('en')).toBe('en');
  expect(messages.resolveLocale('en-US')).toBe('en');
  expect(messages.resolveLocale('sv')).toBe(null);
  messages._data['sv-SE'] = {};
  expect(messages.resolveLocale('sv')).toBe('sv-SE');
});

it('get/set fallback', () => {
  expect(messages.getFallback()).toMatchObject([]);
  expect(messages.getFallback('fi')).toMatchObject(['en']);
  messages.setFallback('en', ['foo', 'fi']);
  expect(messages.getFallback()).toMatchObject(['foo', 'fi']);
  messages.locale = 'fi';
  expect(messages.getFallback()).toMatchObject(['en']);
  messages.setFallback('fi', []);
  expect(messages.getFallback()).toMatchObject([]);
  messages.setFallback('fi', null);
  expect(messages.getFallback()).toMatchObject(['en']);
  messages.defaultLocale = null;
  expect(messages.getFallback()).toMatchObject([]);
});

it('get message', () => {
  expect(messages.get('b', { COUNT: 3 })).toBe('This has 3 users.');
  expect(messages.get(['c', 'd'], { P: 0.314 })).toBe(
    'We have 31% code coverage.'
  );
  expect(messages.get('e')).toBe('e');
  messages.setFallback('en', ['foo', 'fi']);
  expect(messages.get('e')).toBe('Minä puhun vain suomea.');
  messages.locale = 'fi';
  expect(messages.get('b', { COUNT: 3 })).toBe('Tällä on 3 käyttäjää.');
});

it('get object', () => {
  expect(messages.get('c')).toHaveProperty('d');
  messages.locale = 'fi';
  expect(messages.get('c')).toHaveProperty('d');
  expect((messages.get('c') as any).d({ P: 0.628 })).toBe(
    'We have 63% code coverage.'
  );
  expect(messages.get([])).toHaveProperty('b');
  expect(messages.get([])).toHaveProperty('e');
});

it('addMessages', async () => {
  const mf = new MessageFormat('sv');
  const sv = { e: 'Jag pratar lite svenska.' };
  messages.addMessages(await getModule(mf, sv), 'sv');
  expect(messages.availableLocales).toMatchObject(['en', 'fi', 'sv']);
  await (() => (messages.locale = 'sv'))();
  expect(messages.get('e')).toBe('Jag pratar lite svenska.');
  expect(messages.getFallback()).toMatchObject(['en']);
  expect(messages.get([])).toHaveProperty('e');
  messages.addMessages(() => 'z', null, ['x', 'y']);
  expect(messages.get(['x', 'y'])).toBe('z');
});
