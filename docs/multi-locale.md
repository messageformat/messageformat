---
title: Supporting Multiple Locales
parent: Usage
nav_order: 4
---

# Supporting Multiple Locales

Built-in support for multiple languages or locales is inherent to messageformat at all levels.
For the best results, you may want to separate the messages for each locale to its own file or use the locales' identifiers (such as `'de'` for German) as top-level keys in your message files.

When using either our [Webpack loader](https://www.npmjs.com/package/@messageformat/loader) or [Rollup plugin](https://www.npmjs.com/package/rollup-plugin-messageformat) to import messages into your JavaScript runtime, the locale used within a message file may be determined from its filename or path; if it includes a locale identifier, that is used for the messages.
Examples: `en/foo-messages.yaml`, `component_de.properties`.
Within a hierarchical message file or bundle, using a locale identifier as a key sets the locale for each message under that key.

Note the "known locale" limit in the above; for both tools you'll need to include an array like `['en', 'de']` in its configuration for the locale value.
This is required as the set of supported locales includes literally hundreds of two- and three-letter identifiers, which would otherwise be accidentally matched with.

Setting the messages' locale or locales correctly is important, as it's used to control plural category selection as well as e.g. number and date formatting.

## Dynamic Message Loading

For larger applications and/or wider ranges of supported languages, it can be useful for front-end applications to avoid loading all languages' messages.
To achieve this with messageformat, it's important to realise that the message sources are compiled to ES modules during your application build.
This allows for them to be configured to be dynamically loaded, just as may be done by your bundler for all other modules.

Depending on your use case, it may make sense to always bundle in a "default" language's messages, if you can expect most of your users to use it.
Alternatively, you may want to use e.g. [`<link rel="preload">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content) to load an appropriate language's messages even before your JavaScript starts to execute.

To support this sort of use, both [`@messageformat/runtime/messages`](api/runtime.messages.md) and [`@messageformat/react`](api/react.md) support messages being loaded after initialisation.
Here's an example using the latter:

```yaml
# messages.en.yaml
locales:
  en: English
  fi: Finnish
select-locale: Select language

app:
  title: App title
  body: >
    Some content here
```

```yaml
# messages.fi.yaml
locales:
  en: englanti
  fi: suomi
select-locale: Valitse kieli

app:
  title: Sovellusotsikko
  body: >
    Jotain sisältöä tähän
```

<!-- prettier-ignore -->
```jsx
// app.js
import React, { useEffect, useState } from 'react'
import {
  MessageProvider,
  useLocales,
  useMessage,
  useMessageGetter
} from '@messageformat/react'

const DEFAULT_LOCALE = 'en'

const SelectLocale = ({ setLocale }) => {
  const locales = useLocales()
  const localeName = useMessageGetter('locales')
  return (
    <label>
      {useMessage('select-locale')}
      <select value={locales[0]} onChange={ev => setLocale(ev.target.value)}>
        <option value="en">{localeName('en')}</option>
        <option value="fi">{localeName('fi')}</option>
      </select>
    </label>
  )
}

const App = ({ setLocale }) => (
  <>
    <SelectLocale setLocale={setLocale} />
    <hr />
    <h3>{useMessage('app.title')}</h3>
    <p>{useMessage('app.body')}</p>
  </>
)

export default function Wrapper() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState({});

  // In a real app, you may want to indicate message loading somehow
  useEffect(() => {
    if (messages[locale]) return;
    const get = locale === 'en' ? () => import('./messages.en.yaml')
              : locale === 'fi' ? () => import('./messages.fi.yaml')
              : () => Promise.reject(`Unsupported locale ${locale}`)
    get()
      .then(module => {
        const next = Object.assign({}, messages)
        next[locale] = module.default
        setMessages(next)
      })
      .catch(error => {
        console.error(error)
        setLocale(DEFAULT_LOCALE)
      })
  }, [locale, messages])

  return (
    <MessageProvider
      locale={locale}
      messages={messages[locale]}
      onError="warn"
    >
      <App setLocale={setLocale} />
    </MessageProvider>
  )
}
```
