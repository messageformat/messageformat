import { parseMessage } from '../index.js';
import { MessageParsed } from './data-model.js';

describe('messages in resources', () => {
  test('text character escapes', () => {
    const src = '{\\\t\\ \\n\\r\\t\\x01\\u0002\\U000003}';
    const noRes = parseMessage(src, { resource: false });
    expect(noRes.errors).toHaveLength(8);
    const msg = parseMessage(src, { resource: true });
    expect(msg).toMatchObject<MessageParsed>({
      type: 'message',
      declarations: [],
      errors: [],
      pattern: {
        start: 0,
        end: src.length,
        body: [
          {
            type: 'text',
            start: 1,
            end: src.length - 1,
            value: '\t \n\r\t\x01\x02\x03'
          }
        ]
      }
    });
  });

  test('quoted literal character escapes', () => {
    const src = '{{|\\\t\\ \\n\\r\\t\\x01\\u0002\\U000003|}}';
    const noRes = parseMessage(src, { resource: false });
    expect(noRes.errors).toHaveLength(8);
    const msg = parseMessage(src, { resource: true });
    expect(msg).toMatchObject<MessageParsed>({
      type: 'message',
      declarations: [],
      errors: [],
      pattern: {
        start: 0,
        end: src.length,
        body: [
          {
            type: 'placeholder',
            start: 1,
            end: src.length - 1,
            body: {
              type: 'literal',
              start: 2,
              end: src.length - 2,
              value: '\t \n\r\t\x01\x02\x03'
            }
          }
        ]
      }
    });
  });

  test('newlines in text', () => {
    const src = '{1\n \t2 \n \\ 3\n\\t}';
    const noRes = parseMessage(src, { resource: false });
    expect(noRes).toMatchObject({
      errors: [{ type: 'bad-escape' }, { type: 'bad-escape' }],
      pattern: { body: [{ type: 'text', value: '1\n \t2 \n \\ 3\n\\t' }] }
    });
    const msg = parseMessage(src, { resource: true });
    expect(msg).toMatchObject({
      errors: [],
      pattern: { body: [{ type: 'text', value: '1\n2 \n 3\n\t' }] }
    });
  });

  test('newlines in quoted literal', () => {
    const src = '{{|1\n \t2 \n \\ 3\n\\t|}}';
    const noRes = parseMessage(src, { resource: false });
    expect(noRes).toMatchObject({
      errors: [{ type: 'bad-escape' }, { type: 'bad-escape' }],
      pattern: {
        body: [
          {
            type: 'placeholder',
            body: { type: 'literal', value: '1\n \t2 \n \\ 3\n\\t' }
          }
        ]
      }
    });
    const msg = parseMessage(src, { resource: true });
    expect(msg).toMatchObject({
      errors: [],
      pattern: {
        body: [
          {
            type: 'placeholder',
            body: { type: 'literal', value: '1\n2 \n 3\n\t' }
          }
        ]
      }
    });
  });
});
