import React from 'react';
import renderer from 'react-test-renderer';

import { MessageProvider, useLocales } from '@messageformat/react';

function ShowLocales() {
  const locales = useLocales();
  return <>{JSON.stringify(locales)}</>;
}

test('Outside provider', () => {
  const component = renderer.create(<ShowLocales />);
  expect(component.toJSON()).toBe('[]');
});

test('No locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }}>
      <ShowLocales />
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('[""]');
});

test('Plain locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }} locale="lc">
      <ShowLocales />
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('["lc"]');
});

test('Emoji locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }} locale="🤪">
      <ShowLocales />
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('["🤪"]');
});

test('Named locale within different named locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }} locale="foo">
      <MessageProvider messages={{ y: 'Y' }} locale="bar">
        <ShowLocales />
      </MessageProvider>
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('["bar","foo"]');
});

test('Named locale within the same named locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }} locale="foo">
      <MessageProvider messages={{ y: 'Y' }} locale="foo">
        <ShowLocales />
      </MessageProvider>
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('["foo"]');
});

test('Undefined locale within named locale', () => {
  const component = renderer.create(
    <MessageProvider messages={{ x: 'X' }} locale="foo">
      <MessageProvider messages={{ y: 'Y' }}>
        <ShowLocales />
      </MessageProvider>
    </MessageProvider>
  );
  expect(component.toJSON()).toBe('["","foo"]');
});
