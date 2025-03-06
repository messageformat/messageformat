import { type CST, parseCST } from './index.ts';

describe('messages in resources', () => {
  test('text character escapes', () => {
    const src = '\\\t\\ \\n\\r\\t\\x01\\u0002\\U000003';
    const noRes = parseCST(src, { resource: false });
    expect(noRes.errors).toHaveLength(8);
    const msg = parseCST(src, { resource: true });
    expect(msg).toMatchObject<CST.Message>({
      type: 'simple',
      errors: [],
      pattern: {
        start: 0,
        end: src.length,
        body: [
          {
            type: 'text',
            start: 0,
            end: src.length,
            value: '\t \n\r\t\x01\x02\x03'
          }
        ]
      }
    });
  });

  test('quoted literal character escapes', () => {
    const src = '{|\\\t\\ \\n\\r\\t\\x01\\u0002\\U000003|}';
    const noRes = parseCST(src, { resource: false });
    expect(noRes.errors).toHaveLength(8);
    const msg = parseCST(src, { resource: true });
    expect(msg).toMatchObject<CST.Message>({
      type: 'simple',
      errors: [],
      pattern: {
        start: 0,
        end: src.length,
        body: [
          {
            type: 'expression',
            start: 0,
            end: src.length,
            braces: [
              { start: 0, end: 1, value: '{' },
              { start: src.length - 1, end: src.length, value: '}' }
            ],
            arg: {
              type: 'literal',
              quoted: true,
              start: 1,
              end: src.length - 1,
              value: '\t \n\r\t\x01\x02\x03'
            },
            functionRef: undefined,
            attributes: []
          }
        ]
      }
    });
  });

  test('complex pattern with leading .', () => {
    const src = '{{.local}}';
    const msg = parseCST(src, { resource: false });
    expect(msg).toMatchObject<CST.Message>({
      type: 'complex',
      errors: [],
      declarations: [],
      pattern: {
        braces: [
          { start: 0, end: 2, value: '{{' },
          { start: 8, end: 10, value: '}}' }
        ],
        start: 0,
        end: src.length,
        body: [{ type: 'text', start: 2, end: src.length - 2, value: '.local' }]
      }
    });
  });

  test('newlines in text', () => {
    const src = '1\n \t2 \n \\ 3\n\\t';
    const noRes = parseCST(src, { resource: false });
    expect(noRes).toMatchObject({
      type: 'simple',
      errors: [{ type: 'bad-escape' }, { type: 'bad-escape' }],
      pattern: { body: [{ type: 'text', value: '1\n \t2 \n \\ 3\n\\t' }] }
    });
    const msg = parseCST(src, { resource: true });
    expect(msg).toMatchObject({
      type: 'simple',
      errors: [],
      pattern: { body: [{ type: 'text', value: '1\n2 \n 3\n\t' }] }
    });
  });

  test('newlines in quoted literal', () => {
    const src = '{|1\n \t2 \n \\ 3\n\\t|}';
    const noRes = parseCST(src, { resource: false });
    expect(noRes).toMatchObject({
      type: 'simple',
      errors: [{ type: 'bad-escape' }, { type: 'bad-escape' }],
      pattern: {
        body: [
          {
            type: 'expression',
            arg: { type: 'literal', value: '1\n \t2 \n \\ 3\n\\t' }
          }
        ]
      }
    });
    const msg = parseCST(src, { resource: true });
    expect(msg).toMatchObject({
      type: 'simple',
      errors: [],
      pattern: {
        body: [
          {
            type: 'expression',
            arg: { type: 'literal', value: '1\n2 \n 3\n\t' }
          }
        ]
      }
    });
  });
});
