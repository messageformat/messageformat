import React from 'react';
import renderer from 'react-test-renderer';

import { MessageProvider, useMessage } from '@messageformat/react';

interface ShowMessageProps {
  id?: string | string[];
  locale?: string | string[];
  params?: any;
}
function ShowMessage({ id, locale, params }: ShowMessageProps) {
  const msg = useMessage(id, params, locale);
  return <>{JSON.stringify(msg) || null}</>;
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
    test('Array id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage id={['x', 'y']} />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('String path id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage id="x.y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('No id', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('{"x":{"y":"Y"}}');
    });

    test('Custom path separator', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages} pathSep="/">
          <ShowMessage id="x/y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"Y"');
    });

    test('Object value', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={messages}>
          <ShowMessage id="x" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('{"y":"Y"}');
    });

    test('Function value: Object', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={{ x: p => p }}>
          <ShowMessage id="x" params={{ p: 'P' }} />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('{"p":"P"}');
    });

    test('Function value: false', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={{ x: p => p }}>
          <ShowMessage id="x" params={false} />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('false');
    });

    test('Function value without params', () => {
      const component = renderer.create(
        <MessageProvider locale={locale} messages={{ x: p => p }}>
          <ShowMessage id="x" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('{}');
    });
  });
}

describe('Wrapped provider', () => {
  test('Inherited locale', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'ALT' }}>
        <MessageProvider locale="lc" messages={{ x: 'LC' }}>
          <ShowMessage id="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"LC"');
  });

  test('Locale as string', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'ALT' }}>
        <MessageProvider locale="lc" messages={{ x: 'LC' }}>
          <ShowMessage locale="alt" id="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"ALT"');
  });

  test('Locale as array', () => {
    const component = renderer.create(
      <MessageProvider locale="alt" messages={{ x: 'ALT' }}>
        <MessageProvider locale="lc" messages={{ x: 'LC' }}>
          <ShowMessage locale={['nonesuch', 'alt']} id="x" />
        </MessageProvider>
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"ALT"');
  });
});

describe('Reporting errors', () => {
  test('onError="silent"', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    try {
      const component = renderer.create(
        <MessageProvider messages={{ x: 'X' }} onError="silent">
          <ShowMessage id="y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"y"');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  test('onError={null}', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    try {
      const component = renderer.create(
        <MessageProvider messages={{ x: 'X' }} onError={null}>
          <ShowMessage id="y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"y"');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  test('onError="warn"', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    try {
      const component = renderer.create(
        <MessageProvider messages={{ x: 'X' }} onError="warn">
          <ShowMessage id="y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"y"');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });

  describe('onError="error"', () => {
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
            <ShowMessage id="y" />
          </MessageProvider>
        </Catch>
      );
      expect(component.toJSON()).toBe('Message not found: y');
    });
  });

  test('onError={() => string}', () => {
    const onError = jest.fn(err => err.path.join('.'));
    const component = renderer.create(
      <MessageProvider messages={{ x: 'X' }} onError={onError}>
        <ShowMessage id="y" />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"y"');
    expect(onError.mock.calls).toMatchObject([
      [{ code: 'ENOMSG', path: ['y'] }]
    ]);
  });

  test('onError={() => null}', () => {
    const onError = jest.fn(() => null);
    const component = renderer.create(
      <MessageProvider messages={{ x: 'X' }} onError={onError}>
        <ShowMessage id="y" />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('null');
    expect(onError.mock.calls).toMatchObject([
      [{ code: 'ENOMSG', path: ['y'] }]
    ]);
  });

  test('debug={() => string} (deprecated)', () => {
    const debug = jest.fn(msg => `[${msg}]`);
    const component = renderer.create(
      <MessageProvider debug={debug} messages={{ x: 'X' }}>
        <ShowMessage id="y" />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('"[Message not found: y]"');
    expect(debug).toHaveBeenCalledWith('Message not found: y');
  });

  test('debug={() => null} (deprecated)', () => {
    const debug = jest.fn(() => null);
    const component = renderer.create(
      <MessageProvider debug={debug} messages={{ x: 'X' }}>
        <ShowMessage id="y" />
      </MessageProvider>
    );
    expect(component.toJSON()).toBe('null');
    expect(debug).toHaveBeenCalledWith('Message not found: y');
  });

  test('non-object messages', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    try {
      const component = renderer.create(
        <MessageProvider messages={42 as any}>
          <ShowMessage id="y" />
        </MessageProvider>
      );
      expect(component.toJSON()).toBe('"y"');
      expect(warn.mock.calls).toMatchObject([['Message not found', ['y']]]);
    } finally {
      warn.mockRestore();
    }
  });

  test('Silently render nothing outside MessageProvider', () => {
    const component = renderer.create(<ShowMessage id="y" />);
    expect(component.toJSON()).toBeNull();
  });
});
