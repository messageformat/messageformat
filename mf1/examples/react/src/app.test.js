import '@testing-library/jest-dom/extend-expect';
import { render } from '@testing-library/react';
import React from 'react';
import { MessageProvider } from '@messageformat/react';

import { App } from './app';

const messages = {
  locales: { en: 'English', fi: 'Finnish' },
  'select-locale': 'Select language',
  'error-title': 'Error messages',
  errors: {
    'only-english': () => 'only English',
    'equal-to': () => 'equal to',
    'wrong-length': () => 'wrong length'
  }
};

test('smoke test', () => {
  const { getByText } = render(
    <MessageProvider messages={messages}>
      <App />
    </MessageProvider>
  );
  const sel = getByText(/Select language/);
  expect(sel).toBeInTheDocument();
});
