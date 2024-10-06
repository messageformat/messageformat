// @ts-ignore
import merge from 'lodash.merge';
import React, { Component } from 'react';
import renderer from 'react-test-renderer';

import {
  Message,
  MessageContext,
  MessageObject,
  MessageProvider
} from '@messageformat/react';

const TestConsumer = () => (
  <MessageContext.Consumer>
    {context => JSON.stringify(context)}
  </MessageContext.Consumer>
);

test('Minimal messages; no locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: {} }}>
      <TestConsumer />
    </MessageProvider>
  );
  expect(component.toJSON()).toBe(
    '{"locales":[""],"messages":{"":{"x":{}}},"pathSep":"."}'
  );
});

test('Minimal messages with locale', () => {
  const component = renderer.create(
    <MessageProvider locale="aa" messages={{ x: {} }}>
      <TestConsumer />
    </MessageProvider>
  );
  expect(component.toJSON()).toBe(
    '{"locales":["aa"],"messages":{"aa":{"x":{}}},"pathSep":"."}'
  );
});

describe('pathSep', () => {
  test('Set by string prop', () => {
    const component = renderer.create(
      <MessageProvider pathSep="/" messages={{}}>
        <TestConsumer />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{}},"pathSep":"/"}'
    );
  });

  test('Disabled by false prop', () => {
    const component = renderer.create(
      <MessageProvider pathSep={null} messages={{}}>
        <TestConsumer />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{}},"pathSep":null}'
    );
  });

  test('Allow redefining pathSep', () => {
    const component = renderer.create(
      <MessageProvider messages={{ a: 'A' }} pathSep="/">
        <MessageProvider messages={{ b: 'B' }} pathSep=":">
          <MessageProvider messages={{ c: 'C' }}>
            <TestConsumer />
          </MessageProvider>
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{"a":"A","b":"B","c":"C"}},"pathSep":":"}'
    );
  });
});

test('Changed values', () => {
  class TestState extends Component<{
    locale: string;
    messages: MessageObject;
  }> {
    state: {
      locale: string;
      messages: MessageObject;
    };
    constructor(props) {
      super(props);
      this.state = {
        locale: props.locale,
        messages: props.messages
      };
    }
    render() {
      const { locale, messages } = this.state;
      return (
        <MessageProvider locale={locale} messages={messages}>
          <TestConsumer />
        </MessageProvider>
      );
    }
  }

  const component = renderer.create(
    <TestState locale="aa" messages={{ bb: {}, cc: {} }} />
  );
  expect(component.toJSON()).toBe(
    '{"locales":["aa"],"messages":{"aa":{"bb":{},"cc":{}}},"pathSep":"."}'
  );
  component.root.instance.setState({
    messages: { bb: {} },
    locale: 'dd'
  });
  expect(component.toJSON()).toBe(
    '{"locales":["dd"],"messages":{"dd":{"bb":{}}},"pathSep":"."}'
  );
});

describe('Inheritance', () => {
  test('No locales', () => {
    const component = renderer.create(
      <MessageProvider messages={{ bb: {}, cc: {} }}>
        <MessageProvider messages={{ dd: {} }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{"bb":{},"cc":{},"dd":{}}},"pathSep":"."}'
    );
  });

  test('Different locale', () => {
    const component = renderer.create(
      <MessageProvider locale="aa" messages={{ bb: {}, cc: {} }}>
        <MessageProvider locale="xx" messages={{ dd: {} }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":["xx","aa"],"messages":{"aa":{"bb":{},"cc":{}},"xx":{"dd":{}}},"pathSep":"."}'
    );
  });

  test('Same locale, different keys', () => {
    const component = renderer.create(
      <MessageProvider locale="aa" messages={{ bb: {}, cc: {} }}>
        <MessageProvider locale="aa" messages={{ dd: {} }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":["aa"],"messages":{"aa":{"bb":{},"cc":{},"dd":{}}},"pathSep":"."}'
    );
  });

  test('Same locale, overlapping keys', () => {
    const component = renderer.create(
      <MessageProvider locale="aa" messages={{ bb: {}, cc: {} }}>
        <MessageProvider locale="aa" messages={{ cc: 'CC', dd: {} }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":["aa"],"messages":{"aa":{"bb":{},"cc":"CC","dd":{}}},"pathSep":"."}'
    );
  });

  test('Custom context', () => {
    const onError = jest.fn(path => path.join(','));
    const Inner = () => {
      const ctx = Object.assign({}, React.useContext(MessageContext), {
        onError
      });
      return (
        <MessageProvider context={ctx} messages={{ dd: {} }}>
          <TestConsumer />
          <Message id="not.valid" />
        </MessageProvider>
      );
    };
    const component = renderer.create(
      <MessageProvider messages={{ bb: {}, cc: {} }}>
        <Inner />
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchObject([
      '{"locales":[""],"messages":{"":{"bb":{},"cc":{},"dd":{}}},"pathSep":"."}',
      'not,valid'
    ]);
    expect(onError.mock.calls).toMatchObject([[['not', 'valid'], 'ENOMSG']]);
  });

  test('Forced to default context', () => {
    const component = renderer.create(
      <MessageProvider messages={{ bb: {}, cc: {} }}>
        <MessageProvider context={null} messages={{ dd: {} }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{"dd":{}}},"pathSep":"."}'
    );
  });
});

describe('Deeply overlapping keys', () => {
  test('Overwritten by default', () => {
    const component = renderer.create(
      <MessageProvider messages={{ aa: { bb: 'BB', cc: 'CC' } }}>
        <MessageProvider messages={{ aa: { bb: 'B', dd: 'D' } }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{"aa":{"bb":"B","dd":"D"}}},"pathSep":"."}'
    );
  });

  test('Works with _.merge', () => {
    const component = renderer.create(
      <MessageProvider
        merge={merge as any}
        messages={{ aa: { bb: 'BB', cc: 'CC' } }}
      >
        <MessageProvider messages={{ aa: { bb: 'B', dd: 'D' } }}>
          <TestConsumer />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe(
      '{"locales":[""],"messages":{"":{"aa":{"bb":"B","cc":"CC","dd":"D"}}},"pathSep":"."}'
    );
  });
});
