import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { MessageProvider } from '@messageformat/react';

import { App } from './app';

function Wrapper() {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState({});

  // Only fetch messages when locale changes
  useEffect(() => {
    if (messages[locale]) return;

    /**
     * For the first load, the page HTML includes a <link rel="preload"> that'll
     * start the file load before we get to this point for the first time.
     *
     * See https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
     */
    import(/* webpackChunkName: "[request]" */ `./messages.${locale}.yaml`)
      .then(module => {
        // Create a new object for the updated state
        const next = Object.assign({}, messages, { [locale]: module.default });
        setMessages(next);
      })
      .catch(error => {
        console.error(error);
        setLocale('en');
      });
  }, [locale]);

  // Note that setLocale could also be passed through using a separate Context
  return (
    <MessageProvider
      locale={locale}
      messages={messages[locale]}
      onError={messages[locale] ? 'warn' : 'silent'}
    >
      <App setLocale={setLocale} />
    </MessageProvider>
  );
}

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<Wrapper />, root);
