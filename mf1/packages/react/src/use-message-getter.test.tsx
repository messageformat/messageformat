import React from 'react';
import renderer from 'react-test-renderer';

import { MessageProvider, useMessageGetter } from '@messageformat/react';

interface ShowMessageProps {
  rootId?: string | string[];
  baseParams?: any;
  locale?: string | string[];
  msgId?: string | string[];
  msgParams?: any;
}
function ShowMessage({
  rootId,
  baseParams,
  locale,
  msgId,
  msgParams
}: ShowMessageProps) {
  const message = useMessageGetter(rootId, { baseParams, locale });
  return <>{JSON.stringify(message(msgId, msgParams))}</>;
}

const cases = [
  {
    title: 'No locale',
    locale: undefined,
    messages: { x: { y: 'Y' } }
  },
  {
    title: 'Set locale',
    locale: 'lc',
    messages: { x: { y: 'Y' } }
  }
];

for (const { title, locale, messages } of cases) {
  describe(title, () => {
    test('Root and message ids', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage rootId="x" msgId="y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Root array id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage rootId={['x', 'y']} />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Root string path id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage rootId="x.y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Empty root, array message id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage msgId={['x', 'y']} />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Empty root, string path id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage msgId="x.y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Object value', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage msgId="x" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('{"y":"Y"}');
    });

    test('Empty root, custom path separator', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages} pathSep="/">
          <ShowMessage msgId="x/y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });
  });
}

describe('Functional messages', () => {
  const messages = {
    x: { y: args => args.z }
  };

  test('Message parameters', () => {
    const component = renderer.create(
      <MessageProvider messages={messages}>
        <ShowMessage msgId="x.y" msgParams={{ z: 'Z' }} />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"Z"');
  });

  test('Base parameters', () => {
    const component = renderer.create(
      <MessageProvider messages={messages}>
        <ShowMessage msgId="x.y" baseParams={{ z: 'Z' }} />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"Z"');
  });
});

describe('Wrapped provider', () => {
  test('Inherited locale', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'XX' }}>
        <MessageProvider locale="lc" messages={{ x: 'X' }}>
          <ShowMessage rootId="x" />
          <ShowMessage msgId="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchObject(['"X"', '"X"']);
  });

  test('Locale as string', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'XX' }}>
        <MessageProvider locale="lc" messages={{ x: 'X' }}>
          <ShowMessage locale="alt" rootId="x" />
          <ShowMessage locale="alt" msgId="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchObject(['"XX"', '"XX"']);
  });

  test('Locale as array', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'XX' }}>
        <MessageProvider locale="lc" messages={{ x: 'X' }}>
          <ShowMessage locale={['nonesuch', 'alt']} rootId="x" />
          <ShowMessage locale={['nonesuch', 'alt']} msgId="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toMatchObject(['"XX"', '"XX"']);
  });
});

describe('Errors', () => {
  // Silence pointless console errors until this is resolved:
  // https://github.com/facebook/react/pull/17383
  let spy;
  beforeAll(() => {
    spy = jest.spyOn(console, 'error').mockImplementation();
  });
  afterAll(() => {
    spy.mockRestore();
  });

  class Catch extends React.Component {
    static getDerivedStateFromError(error) {
      return { error };
    }

    state: { error: null | Error };
    constructor(props) {
      super(props);
      this.state = { error: null };
    }
    render() {
      const { error } = this.state;
      return error ? error.message : this.props.children;
    }
  }

  test('Message not found', () => {
    const component = renderer.create(
      <Catch>
        <MessageProvider messages={{ x: 'X' }} onError="error">
          <ShowMessage msgId="y" />
        </MessageProvider>
      </Catch>
    );
    expect(component.toJSON()).toBe('Message not found: y');
  });
});
