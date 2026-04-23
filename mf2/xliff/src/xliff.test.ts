import { fluentToResourceData } from '@messageformat/fluent';
import { source } from '@messageformat/test-utils/source.js';
import {
  type Model as MF,
  parseMessage,
  stringifyMessage
} from 'messageformat';
import { describe, expect, test } from 'vitest';
import { mf2xliff, stringify, xliff2mf } from './index.ts';

test('source only', () => {
  const data = new Map<string, MF.Message>([
    ['msg', parseMessage('Message')],
    ['var', parseMessage('Foo {$num}')],
    ['ref', parseMessage('This is the {msg :message @attr}')],
    [
      'select',
      parseMessage(
        '.input {$selector :string} .match $selector a {{A}} * {{B}}'
      )
    ],
    [
      'plural',
      parseMessage('.input {$n :integer} .match $n one {{A}} * {{B}}')
    ],
    [
      'ordinal',
      parseMessage(
        '.input {$n :number select=ordinal} .match $n 1 {{First!}} * {{Not first}}'
      )
    ]
  ]);
  const xliff = stringify(mf2xliff({ data, id: 'res', locale: 'en' }));
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:msg" name="msg">
          <segment>
            <source>Message</source>
          </segment>
        </unit>
        <unit id="u:var" name="var">
          <res:resourceData>
            <res:resourceItem id="ph:1">
              <res:source>
                <mf:variable name="num"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment>
            <source xml:space="preserve">Foo <ph id="2" mf:ref="ph:1"/></source>
          </segment>
        </unit>
        <unit id="u:ref" name="ref">
          <res:resourceData>
            <res:resourceItem id="ph:3">
              <res:source>
                <mf:literal>msg</mf:literal>
                <mf:function name="message"/>
                <mf:attribute name="attr"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment>
            <source xml:space="preserve">This is the <ph id="4" mf:ref="ph:3"/></source>
          </segment>
        </unit>
        <unit id="u:select" name="select" canResegment="no" pgs:switch="select:selector">
          <res:resourceData>
            <res:resourceItem id="selector" mf:declaration="input">
              <res:source>
                <mf:variable name="selector"/>
                <mf:function name="string"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:select:a" pgs:case="a">
            <source>A</source>
          </segment>
          <segment id="s:select:other" pgs:case="*:other">
            <source>B</source>
          </segment>
        </unit>
        <unit id="u:plural" name="plural" canResegment="no" pgs:switch="plural:n">
          <res:resourceData>
            <res:resourceItem id="n" mf:declaration="input">
              <res:source>
                <mf:variable name="n"/>
                <mf:function name="integer"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:plural:one" pgs:case="one">
            <source>A</source>
          </segment>
          <segment id="s:plural:other" pgs:case="*:other">
            <source>B</source>
          </segment>
        </unit>
        <unit id="u:ordinal" name="ordinal" canResegment="no" pgs:switch="ordinal:n">
          <res:resourceData>
            <res:resourceItem id="n" mf:declaration="input">
              <res:source>
                <mf:variable name="n"/>
                <mf:function name="number">
                  <mf:option name="select">
                    <mf:literal>ordinal</mf:literal>
                  </mf:option>
                </mf:function>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:ordinal:1" pgs:case="1">
            <source>First!</source>
          </segment>
          <segment id="s:ordinal:other" pgs:case="*:other">
            <source>Not first</source>
          </segment>
        </unit>
      </file>
    </xliff>`
  );

  let file_: any;
  const res = Array.from(xliff2mf(xliff)).map(
    ({ file, key, source, target }) => {
      if (!file_) {
        expect(file).toEqual({ id: 'res', srcLang: 'en', trgLang: undefined });
        file_ = file;
      } else {
        expect(file).toBe(file_);
      }
      expect(target).toBeUndefined();
      return [key, source, stringifyMessage(source)];
    }
  );
  expect(res).toEqual([
    [
      ['msg'],
      { type: 'message', declarations: [], pattern: ['Message'] },
      'Message'
    ],
    [
      ['var'],
      {
        type: 'message',
        declarations: [],
        pattern: [
          'Foo ',
          {
            type: 'expression',
            arg: { type: 'variable', name: 'num' },
            attributes: {}
          }
        ]
      },
      'Foo {$num}'
    ],
    [
      ['ref'],
      {
        type: 'message',
        declarations: [],
        pattern: [
          'This is the ',
          {
            type: 'expression',
            arg: { type: 'literal', value: 'msg' },
            attributes: { attr: true },
            functionRef: { type: 'function', name: 'message' }
          }
        ]
      },
      'This is the {msg :message @attr}'
    ],
    [
      ['select'],
      {
        type: 'select',
        declarations: [
          {
            type: 'input',
            name: 'selector',
            value: {
              type: 'expression',
              arg: { type: 'variable', name: 'selector' },
              attributes: {},
              functionRef: { type: 'function', name: 'string' }
            }
          }
        ],
        selectors: [{ name: 'selector', type: 'variable' }],
        variants: [
          { keys: [{ type: 'literal', value: 'a' }], value: ['A'] },
          { keys: [{ type: '*', value: 'other' }], value: ['B'] }
        ]
      },
      '.input {$selector :string}\n.match $selector\na {{A}}\n* {{B}}'
    ],

    [
      ['plural'],
      {
        type: 'select',
        declarations: [
          {
            type: 'input',
            name: 'n',
            value: {
              type: 'expression',
              arg: { type: 'variable', name: 'n' },
              attributes: {},
              functionRef: { type: 'function', name: 'integer' }
            }
          }
        ],
        selectors: [{ type: 'variable', name: 'n' }],
        variants: [
          { keys: [{ type: 'literal', value: 'one' }], value: ['A'] },
          { keys: [{ type: '*', value: 'other' }], value: ['B'] }
        ]
      },
      '.input {$n :integer}\n.match $n\none {{A}}\n* {{B}}'
    ],
    [
      ['ordinal'],
      {
        type: 'select',
        declarations: [
          {
            type: 'input',
            name: 'n',
            value: {
              type: 'expression',
              arg: { type: 'variable', name: 'n' },
              attributes: {},
              functionRef: {
                type: 'function',
                name: 'number',
                options: { select: { type: 'literal', value: 'ordinal' } }
              }
            }
          }
        ],
        selectors: [{ type: 'variable', name: 'n' }],
        variants: [
          { keys: [{ type: 'literal', value: '1' }], value: ['First!'] },
          { keys: [{ type: '*', value: 'other' }], value: ['Not first'] }
        ]
      },
      '.input {$n :number select=ordinal}\n.match $n\n1 {{First!}}\n* {{Not first}}'
    ]
  ]);
});

test('combine source & target', () => {
  const src = source`
    msg = Message
    -term = Term
      .attr = Private
    var = Foo { $num }
    select = {$selector ->
        [a] A
       *[b] B
    }`;
  const srcRes = fluentToResourceData(src).data;

  const trg = source`
    msg = Viesti
    -term = Termi
      .attr = Yksityinen
    var = Föö { $num }
    select = {$selector ->
        [a] Ä
       *[b] B
    }`;
  const trgRes = fluentToResourceData(trg).data;

  const xliff = stringify(
    mf2xliff(
      { data: srcRes, id: 'res', locale: 'en' },
      { data: trgRes, id: 'res', locale: 'fi' }
    )
  );
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet" trgLang="fi">
      <file id="f:res">
        <group id="g:msg" name="msg">
          <unit id="u:msg" name="msg">
            <segment>
              <source>Message</source>
              <target>Viesti</target>
            </segment>
          </unit>
        </group>
        <group id="g:-term" name="-term">
          <unit id="u:-term" name="-term">
            <segment>
              <source>Term</source>
              <target>Termi</target>
            </segment>
          </unit>
          <unit id="u:-term.attr" name="attr">
            <segment>
              <source>Private</source>
              <target>Yksityinen</target>
            </segment>
          </unit>
        </group>
        <group id="g:var" name="var">
          <unit id="u:var" name="var">
            <res:resourceData>
              <res:resourceItem id="ph:1">
                <res:source>
                  <mf:variable name="num"/>
                </res:source>
                <res:target>
                  <mf:variable name="num"/>
                </res:target>
              </res:resourceItem>
            </res:resourceData>
            <segment>
              <source xml:space="preserve">Foo <ph id="2" mf:ref="ph:1"/></source>
              <target xml:space="preserve">Föö <ph id="3" mf:ref="ph:1"/></target>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <unit id="u:select" name="select" canResegment="no" pgs:switch="select:selector">
            <res:resourceData>
              <res:resourceItem id="selector" mf:declaration="input">
                <res:source>
                  <mf:variable name="selector"/>
                  <mf:function name="string"/>
                </res:source>
                <res:target>
                  <mf:variable name="selector"/>
                  <mf:function name="string"/>
                </res:target>
              </res:resourceItem>
            </res:resourceData>
            <segment id="s:select:a" pgs:case="a">
              <source>A</source>
              <target>Ä</target>
            </segment>
            <segment id="s:select:b" pgs:case="*:b">
              <source>B</source>
              <target>B</target>
            </segment>
          </unit>
        </group>
      </file>
    </xliff>`
  );

  expect(
    Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
      key,
      stringifyMessage(source),
      target && stringifyMessage(target)
    ])
  ).toEqual([
    [['msg'], 'Message', 'Viesti'],
    [['-term'], 'Term', 'Termi'],
    [['-term', 'attr'], 'Private', 'Yksityinen'],
    [['var'], 'Foo {$num}', 'Föö {$num}'],
    [
      ['select'],
      '.input {$selector :string}\n.match $selector\na {{A}}\n* {{B}}',
      '.input {$selector :string}\n.match $selector\na {{Ä}}\n* {{B}}'
    ]
  ]);
});

test('selector mismatch between source & target languages', () => {
  const src = source`
    select = {$gender ->
        [masculine] his house
        [feminine] her house
       *[other] their house
    }`;
  const srcRes = fluentToResourceData(src).data;

  const trg = source`
    select = {$case ->
        [allative] hänen talolle
       *[nominative] hänen talo
    }`;
  const trgRes = fluentToResourceData(trg).data;

  const xliff = stringify(
    mf2xliff(
      { data: srcRes, id: 'res', locale: 'en' },
      { data: trgRes, id: 'res', locale: 'fi' }
    )
  );
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet" trgLang="fi">
      <file id="f:res">
        <group id="g:select" name="select">
          <unit id="u:select" name="select" canResegment="no" pgs:switch="select:gender select:case">
            <res:resourceData>
              <res:resourceItem id="gender" mf:declaration="input">
                <res:source>
                  <mf:variable name="gender"/>
                  <mf:function name="string"/>
                </res:source>
              </res:resourceItem>
              <res:resourceItem id="case" mf:declaration="input">
                <res:target>
                  <mf:variable name="case"/>
                  <mf:function name="string"/>
                </res:target>
              </res:resourceItem>
            </res:resourceData>
            <segment id="s:select:masculine.allative" pgs:case="masculine allative">
              <source>his house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:masculine.nominative" pgs:case="masculine *:nominative">
              <source>his house</source>
              <target>hänen talo</target>
            </segment>
            <segment id="s:select:feminine.allative" pgs:case="feminine allative">
              <source>her house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:feminine.nominative" pgs:case="feminine *:nominative">
              <source>her house</source>
              <target>hänen talo</target>
            </segment>
            <segment id="s:select:other.allative" pgs:case="*:other allative">
              <source>their house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:other.nominative" pgs:case="*:other *:nominative">
              <source>their house</source>
              <target>hänen talo</target>
            </segment>
          </unit>
        </group>
      </file>
    </xliff>`
  );

  expect(
    Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
      key,
      stringifyMessage(source),
      stringifyMessage(target!),
      target
    ])
  ).toEqual([
    [
      ['select'],
      source`
        .input {$gender :string}
        .match $gender
        masculine {{his house}}
        feminine {{her house}}
        * {{their house}}`,
      source`
        .input {$gender :string}
        .input {$case :string}
        .match $case
        allative {{hänen talolle}}
        * {{hänen talo}}`,
      {
        type: 'select',
        declarations: [
          {
            type: 'input',
            name: 'gender',
            value: {
              type: 'expression',
              arg: { type: 'variable', name: 'gender' },
              functionRef: { type: 'function', name: 'string' },
              attributes: {}
            }
          },
          {
            type: 'input',
            name: 'case',
            value: {
              type: 'expression',
              arg: { type: 'variable', name: 'case' },
              functionRef: { type: 'function', name: 'string' },
              attributes: {}
            }
          }
        ],
        selectors: [{ type: 'variable', name: 'case' }],
        variants: [
          {
            keys: [{ type: 'literal', value: 'allative' }],
            value: ['hänen talolle']
          },
          { keys: [{ type: '*', value: 'nominative' }], value: ['hänen talo'] }
        ]
      }
    ]
  ]);
});

describe('Parsing xml:space in parent elements', () => {
  test('<segment xml:space="preserve">', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:key">
          <segment xml:space="preserve">
            <source> Message </source>
          </segment>
        </unit>
      </file>
    </xliff>`;
    expect(
      Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
        key,
        stringifyMessage(source),
        target
      ])
    ).toEqual([[['key'], ' Message ', undefined]]);
  });

  test('<group xml:space="preserve">', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <group id="g:key" xml:space="preserve">
          <unit id="u:key">
            <segment>
              <source> Message </source>
            </segment>
          </unit>
        </group>
      </file>
    </xliff>`;
    expect(
      Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
        key,
        stringifyMessage(source),
        target
      ])
    ).toEqual([[['key'], ' Message ', undefined]]);
  });

  test('<unit xml:space="preserve"> with pattern message', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:key" xml:space="preserve">
          <res:resourceData>
            <res:resourceItem id="ph:1">
              <res:source>
                <mf:literal>msg</mf:literal>
                <mf:function name="message"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment>
            <source> Message <ph id="1" mf:ref="ph:1"/> </source>
          </segment>
        </unit>
      </file>
    </xliff>`;
    expect(
      Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
        key,
        stringifyMessage(source),
        target
      ])
    ).toEqual([[['key'], ' Message {msg :message} ', undefined]]);
  });

  test('<unit xml:space="preserve"> with select message', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:key" canResegment="no" pgs:switch="select:sel" xml:space="preserve">
          <res:resourceData>
            <res:resourceItem id="sel" mf:declaration="input">
              <res:source>
                <mf:variable name="sel"/>
                <mf:function name="string"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:select:a" pgs:case="a">
            <source> A </source>
          </segment>
          <segment id="s:select:other" pgs:case="*:other">
            <source> B </source>
          </segment>
        </unit>
      </file>
    </xliff>`;
    expect(
      Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
        key,
        stringifyMessage(source),
        target
      ])
    ).toEqual([
      [
        ['key'],
        '.input {$sel :string}\n.match $sel\na {{ A }}\n* {{ B }}',
        undefined
      ]
    ]);
  });
});

test('variably available targets', () => {
  const xliff = source`
    <xliff version="2.0" srcLang="en" trgLang="fi" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:one">
          <segment>
            <source>Message</source>
          </segment>
        </unit>
        <unit id="u:two">
          <segment>
            <source>First</source>
          </segment>
          <segment>
            <source>Second</source>
            <target>Toinen</target>
          </segment>
        </unit>
        <unit id="u:three">
          <segment>
            <source>Message</source>
            <target>Viesti</target>
          </segment>
        </unit>
        <unit id="u:four">
          <segment>
            <source></source>
            <target></target>
          </segment>
        </unit>
        <unit id="u:five" canResegment="no" pgs:switch="plural:x">
          <res:resourceData>
            <res:resourceItem id="x" mf:declaration="input">
              <res:source>
                <mf:variable name="x"/>
                <mf:function name="number"/>
              </res:source>
              <res:target>
                <mf:variable name="x"/>
                <mf:function name="number"/>
              </res:target>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:select:0" pgs:case="0">
            <source>A</source>
            <target>Ä</target>
          </segment>
          <segment id="s:select:one" pgs:case="one">
            <source>B</source>
          </segment>
          <segment id="s:select:other" pgs:case="*:other">
            <source>C</source>
            <target>C</target>
          </segment>
        </unit>
      </file>
    </xliff>`;
  expect(
    Array.from(xliff2mf(xliff)).map(({ key, source, target }) => [
      key,
      stringifyMessage(source),
      target && stringifyMessage(target)
    ])
  ).toEqual([
    [['one'], 'Message', undefined],
    [['two'], 'FirstSecond', 'Toinen'],
    [['three'], 'Message', 'Viesti'],
    [['four'], '', ''],
    [
      ['five'],
      source`
        .input {$x :number}
        .match $x
        0 {{A}}
        one {{B}}
        * {{C}}`,
      source`
        .input {$x :number}
        .match $x
        0 {{Ä}}
        * {{C}}`
    ]
  ]);
});
