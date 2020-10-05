import React, { Component } from 'react';
import renderer from 'react-test-renderer';

import {
  getMessage,
  getMessageGetter,
  Message,
  MessageContext,
  MessageProvider,
  useLocales,
  useMessage,
  useMessageGetter
} from '@messageformat/react';

// actually precompiled with messageformat-cli
import en from './__fixtures__/messages_en';
import fi from './__fixtures__/messages_fi';

describe('README', () => {
  test('Example 1', () => {
    const messages = {
      message: 'Your message is important',
      answers: {
        sixByNine: ({ base }) => (6 * 9).toString(base),
        universe: 42
      }
    };

    function Equality() {
      const getAnswer = useMessageGetter('answers');
      const foo = getAnswer('sixByNine', { base: 13 });
      const bar = getAnswer('universe');
      return (
        <>
          {foo} and {bar} are equal
        </>
      );
    }

    const Example = () => (
      <MessageProvider messages={messages}>
        <ul>
          <li>
            <Message id="message" />
          </li>
          <li>
            <Equality />
          </li>
        </ul>
      </MessageProvider>
    );

    const component = renderer.create(
      <MessageProvider messages={messages}>
        <Example />
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('Example 2', () => {
    const component = renderer.create(
      <MessageProvider
        locale="en"
        messages={{ foo: 'FOO', qux: 'QUX' }}
        onError="silent"
      >
        <MessageProvider locale="fi" messages={{ foo: 'FÖÖ', bar: 'BÄR' }}>
          <Message id="foo" />
          <Message id="foo" locale="en" />
          <Message id="bar" />
          <Message id="bar" locale="en" />
          <Message id="qux" />
          <Message id="quux">xyzzy</Message>
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('Example 3', () => {
    const ComponentErrors = () => (
      <ul>
        <li>
          <Message id="errors.wrong_length" length={42} />
        </li>
        <li>
          <Message id="errors.equal_to" count={13} />
        </li>
      </ul>
    );

    function HookErrors() {
      const getErrorMsg = useMessageGetter('errors');
      return (
        <ul>
          <li>{getErrorMsg('wrong_length', { length: 42 })}</li>
          <li>{getErrorMsg('equal_to', { count: 13 })}</li>
        </ul>
      );
    }

    const component = renderer.create(
      <MessageProvider locale="en" messages={en}>
        <MessageProvider locale="fi" messages={fi}>
          <ComponentErrors />
          <HookErrors />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchSnapshot();
  });
});

describe('API', () => {
  beforeAll(() => {
    const SUPPORTS_LIST_FORMAT =
      'ListFormat' in Intl &&
      Intl.ListFormat.supportedLocalesOf(['en', 'fi']).length === 2;
    if (!SUPPORTS_LIST_FORMAT) {
      delete Intl.ListFormat; // https://github.com/wessberg/intl-list-format/issues/1
      return import('intl-list-format').then(() =>
        Promise.all([
          import('intl-list-format/locale-data/en'),
          import('intl-list-format/locale-data/fi')
        ])
      );
    }
  });

  test('MessageContext Example', () => {
    const messages = {
      example: { key: 'Your message here' },
      other: { key: 'Another message' }
    };

    class Example extends Component {
      render() {
        const message = getMessage(this.context, 'example.key');
        const otherMsg = getMessageGetter(this.context, 'other');
        return (
          <span>
            {message} | {otherMsg('key')}
          </span>
        );
      }
    }
    Example.contextType = MessageContext;

    const App = () => (
      <MessageProvider messages={messages}>
        <Example />
      </MessageProvider>
    );

    const component = renderer.create(<App />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('MessageProvider Example', () => {
    const messages = { example: { key: 'Your message here' } };
    const extended = { other: { key: 'Another message' } };

    const Example = () => (
      <span>
        <Message id={['example', 'key']} />
        {' | '}
        <Message id="other/key" />
      </span>
    );

    const App = () => (
      <MessageProvider messages={messages} pathSep="/">
        <MessageProvider messages={extended}>
          <Example />
        </MessageProvider>
      </MessageProvider>
    );

    const component = renderer.create(<App />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('Message Example', () => {
    const messages = { example: { key: ({ thing }) => `Your ${thing} here` } };

    const Example = () => (
      <span>
        <Message id="example.key" thing="message" />
      </span>
    );

    const App = () => (
      <MessageProvider messages={messages}>
        <Example />
      </MessageProvider>
    );

    const component = renderer.create(<App />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('useMessage Example', () => {
    const en = { example: { key: 'Your message here' } };
    const fi = { example: { key: 'Lisää viestisi tähän' } };

    function Example() {
      const locales = useLocales();
      const lfOpt = { style: 'long', type: 'conjunction' };
      const lf = new Intl.ListFormat(locales, lfOpt);
      const lcMsg = lf.format(locales.map(lc => JSON.stringify(lc)));
      const keyMsg = useMessage('example.key');
      return (
        <article>
          <h1>{lcMsg}</h1>
          <p>{keyMsg}</p>
        </article>
      );
    }

    const App = () => (
      <MessageProvider locale="en" messages={en}>
        <MessageProvider locale="fi" messages={fi}>
          <Example />
        </MessageProvider>
      </MessageProvider>
    );

    const component = renderer.create(<App />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  test('useMessageGetter Example', () => {
    const messages = {
      example: {
        funMsg: ({ thing }) => `Your ${thing} here`,
        thing: 'message'
      }
    };

    function Example() {
      const getMsg = useMessageGetter('example');
      const thing = getMsg('thing');
      return getMsg('funMsg', { thing });
    }

    const App = () => (
      <MessageProvider messages={messages}>
        <Example />
      </MessageProvider>
    );

    const component = renderer.create(<App />);
    expect(component.toJSON()).toMatchSnapshot();
  });
});
