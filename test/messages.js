if (typeof require !== 'undefined') {
  var expect = require('expect.js');
  var Messages = require('../packages/messageformat/messages');
  var MessageFormat = require('../packages/messageformat');
}

describe('Messages', () => {
  let msgData, messages;

  before(() => {
    const mf = new MessageFormat(['en', 'fi']);
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
    msgData = mf.compile(msgSet);
  })

  beforeEach(() => {
    messages = new Messages(msgData, 'en');
  })

  it('constructor', () => {
    expect(messages).to.be.a(Messages);
    expect(messages.locale).to.eql('en');
    expect(messages.defaultLocale).to.eql('en');
    expect(messages.availableLocales).to.eql(['en', 'fi']);
    messages = new Messages(msgData);
    expect(messages.locale).to.eql('en');
    messages = new Messages(msgData, 'fi');
    expect(messages.locale).to.eql('fi');
    messages = new Messages(msgData, null);
    expect(messages.locale).to.eql(null);
  });

  it('defaultLocale', () => {
    expect(messages.defaultLocale).to.be('en');
    messages.defaultLocale = 'fi-FI';
    expect(messages.defaultLocale).to.be('fi');
    messages._data['sv-SE'] = {}
    messages.defaultLocale = 'sv';
    expect(messages.defaultLocale).to.be('sv-SE');
    messages.defaultLocale = 'foo';
    expect(messages.defaultLocale).to.be(null);
  });

  it('locale', () => {
    expect(messages.locale).to.be('en');
    messages.locale = 'fi-FI';
    expect(messages.locale).to.be('fi');
    messages._data['sv-SE'] = {}
    messages.locale = 'sv';
    expect(messages.locale).to.be('sv-SE');
    messages.locale = 'foo';
    expect(messages.locale).to.be(null);
  });

  it('hasMessage', () => {
    expect(messages.hasMessage('a')).to.be(true);
    expect(messages.hasMessage('c')).to.be(false);
    messages.locale = 'fi';
    expect(messages.hasMessage('a')).to.be(false);
    expect(messages.hasMessage('a', 'en')).to.be(true);
    expect(messages.hasMessage('a', null, true)).to.be(true);
  });

  it('hasObject', () => {
    expect(messages.hasObject('a')).to.be(false);
    expect(messages.hasObject('c')).to.be(true);
    messages.locale = 'fi';
    expect(messages.hasObject('c')).to.be(false);
    expect(messages.hasObject('c', 'en')).to.be(true);
    expect(messages.hasObject('c', null, true)).to.be(true);
  });

  it('resolveLocale', () => {
    expect(messages.resolveLocale('en')).to.be('en');
    expect(messages.resolveLocale('en-US')).to.be('en');
    expect(messages.resolveLocale('sv')).to.be(null);
    messages._data['sv-SE'] = {}
    expect(messages.resolveLocale('sv')).to.be('sv-SE');
  })

  it('get/set fallback', () => {
    expect(messages.getFallback()).to.eql([]);
    expect(messages.getFallback('fi')).to.eql(['en']);
    messages.setFallback('en', ['foo', 'fi']);
    expect(messages.getFallback()).to.eql(['foo', 'fi']);
    messages.locale = 'fi';
    expect(messages.getFallback()).to.eql(['en']);
    messages.setFallback('fi', []);
    expect(messages.getFallback()).to.eql([]);
    messages.setFallback('fi', null);
    expect(messages.getFallback()).to.eql(['en']);
    messages.defaultLocale = null;
    expect(messages.getFallback()).to.eql([]);
  });

  it('get message', () => {
    expect(messages.get('b', { COUNT: 3 })).to.eql('This has 3 users.');
    expect(messages.get(['c', 'd'], { P: 0.314 })).to.eql('We have 31% code coverage.');
    expect(messages.get('e')).to.eql('e');
    messages.setFallback('en', ['foo', 'fi']);
    expect(messages.get('e')).to.eql('Minä puhun vain suomea.');
    messages.locale = 'fi';
    expect(messages.get('b', { COUNT: 3 })).to.eql('Tällä on 3 käyttäjää.');
  });

  it('get object', () => {
    expect(messages.get('c')).to.have.property('d')
    messages.locale = 'fi';
    expect(messages.get('c')).to.have.property('d')
    expect(messages.get('c').d({ P: 0.628 })).to.eql('We have 63% code coverage.');
    expect(messages.get([])).to.only.have.keys(['b', 'e']);
  });

  it('addMessages', () => {
    const mf = new MessageFormat('sv');
    const sv = { e: 'Jag pratar lite svenska.' }
    messages.addMessages(mf.compile(sv), 'sv');
    expect(messages.availableLocales).to.eql(['en', 'fi', 'sv']);
    messages.locale = 'sv'
    expect(messages.get('e')).to.eql('Jag pratar lite svenska.');
    expect(messages.getFallback()).to.eql(['en']);
    expect(messages.get([])).to.only.have.key('e');
    messages.addMessages(() => 'z', null, ['x', 'y'])
    expect(messages.get(['x', 'y'])).to.eql('z');
  });
});
