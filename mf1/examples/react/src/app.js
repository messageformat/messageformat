import React from 'react';
import { Message, useLocales, useMessageGetter } from '@messageformat/react';

// This example use both the Message component & useMessageGetter APIs. In
// actual use, your code will probably look nicer if you don't mix them quite
// as much.

const SelectLocale = ({ setLocale }) => {
  const locales = useLocales();
  const localeName = useMessageGetter('locales');
  return (
    <label>
      <Message id="select-locale" />
      {': '}
      <select value={locales[0]} onChange={ev => setLocale(ev.target.value)}>
        <option value="en">{localeName('en')}</option>
        <option value="fi">{localeName('fi')}</option>
      </select>
    </label>
  );
};

export function App({ setLocale }) {
  const errorMsg = useMessageGetter('errors');
  return (
    <>
      <SelectLocale setLocale={setLocale} />
      <hr />
      <h3>
        <Message id="error-title" />
      </h3>
      <ul>
        <li>{errorMsg('equal-to', { count: 13 })}</li>
        <li>{errorMsg('wrong-length', { length: 42 })}</li>
        <li>{errorMsg('only-english')}</li>
        <li>
          <Message id="does.not.exist" />
        </li>
        <li>
          <Message id="errors.only-finnish">This is a fallback message</Message>
        </li>
      </ul>
    </>
  );
}
