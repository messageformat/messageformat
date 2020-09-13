import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { MessageProvider } from '@messageformat/react';

import { App } from './app';

function Wrapper() {
  const [locale, setLocale] = useState('en');
  const [messages, setMessages] = useState({});

  // Only fetch messages when locale changes
  useEffect(() => {
    // In production, you may want a more comprehensive check than this
    if (messages[locale]) return;

    // See https://webpack.js.org/api/module-methods/#dynamic-expressions-in-import
    import(/* webpackChunkName: "[request]" */ `./messages.${locale}.yaml`)
      .then(module => {
        // Create a new object for the updated state
        const next = Object.assign({}, messages);
        next[locale] = module.default;
        setMessages(next);
      })
      .catch(error => {
        console.error(error);
        if (locale !== 'en') setLocale('en');
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
