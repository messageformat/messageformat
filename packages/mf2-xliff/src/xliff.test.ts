import { fluentToResourceData } from '@messageformat/fluent';
import { source } from '@messageformat/test-utils';
import { mf2xliff, stringify, xliff2mf } from './index';
import { stringifyMessage } from 'messageformat';

test('source only', () => {
  const src = source`
    msg = Message
    var = Foo { $num }
    ref = This is the { msg }
    select = {$selector ->
        [a] A
       *[b] B
    }`;
  const { data } = fluentToResourceData(src);
  const xliff = stringify(mf2xliff({ data, id: 'res', locale: 'en' }));
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <group id="g:msg" name="msg">
          <unit id="u:msg" name="msg">
            <segment>
              <source>Message</source>
            </segment>
          </unit>
        </group>
        <group id="g:var" name="var">
          <unit id="u:var" name="var">
            <res:resourceData>
              <res:resourceItem id="m1">
                <res:source>
                  <mf:variable name="num"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment>
              <source xml:space="preserve">Foo <ph id="1" mf:ref="m1"/></source>
            </segment>
          </unit>
        </group>
        <group id="g:ref" name="ref">
          <unit id="u:ref" name="ref">
            <res:resourceData>
              <res:resourceItem id="m2">
                <res:source>
                  <mf:literal>msg</mf:literal>
                  <mf:function name="message"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment>
              <source xml:space="preserve">This is the <ph id="2" mf:ref="m2"/></source>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <unit id="u:select" name="select" canResegment="no" mf:select="m3">
            <res:resourceData>
              <res:resourceItem id="m3">
                <res:source>
                  <mf:variable name="selector"/>
                  <mf:function name="string"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment id="s:select:a">
              <source>A</source>
            </segment>
            <segment id="s:select:_other">
              <source>B</source>
            </segment>
          </unit>
        </group>
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
      return [
        key,
        stringifyMessage(source),
        target && stringifyMessage(target)
      ];
    }
  );
  expect(res).toEqual([
    [['msg'], 'Message', undefined],
    [['var'], 'Foo {$num}', undefined],
    [['ref'], 'This is the {msg :message}', undefined],
    [['select'], '.match {$selector :string}\na {{A}}\n* {{B}}', undefined]
  ]);
});

test('combine source & target', () => {
  const src = source`
    msg = Message
    var = Foo { $num }
    select = {$selector ->
        [a] A
       *[b] B
    }`;
  const srcRes = fluentToResourceData(src).data;

  const trg = source`
    msg = Viesti
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
        <group id="g:var" name="var">
          <unit id="u:var" name="var">
            <res:resourceData>
              <res:resourceItem id="m1">
                <res:source>
                  <mf:variable name="num"/>
                </res:source>
              </res:resourceItem>
              <res:resourceItem id="m2">
                <res:source>
                  <mf:variable name="num"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment>
              <source xml:space="preserve">Foo <ph id="1" mf:ref="m1"/></source>
              <target xml:space="preserve">Föö <ph id="2" mf:ref="m2"/></target>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <unit id="u:select" name="select" canResegment="no" mf:select="m3">
            <res:resourceData>
              <res:resourceItem id="m3">
                <res:source>
                  <mf:variable name="selector"/>
                  <mf:function name="string"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment id="s:select:a">
              <source>A</source>
              <target>Ä</target>
            </segment>
            <segment id="s:select:_other">
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
    [['var'], 'Foo {$num}', 'Föö {$num}'],
    [
      ['select'],
      '.match {$selector :string}\na {{A}}\n* {{B}}',
      '.match {$selector :string}\na {{Ä}}\n* {{B}}'
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
          <unit id="u:select" name="select" canResegment="no" mf:select="m1 m2">
            <res:resourceData>
              <res:resourceItem id="m1">
                <res:source>
                  <mf:variable name="gender"/>
                  <mf:function name="string"/>
                </res:source>
              </res:resourceItem>
              <res:resourceItem id="m2">
                <res:source>
                  <mf:variable name="case"/>
                  <mf:function name="string"/>
                </res:source>
              </res:resourceItem>
            </res:resourceData>
            <segment id="s:select:masculine.allative">
              <source>his house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:masculine._other">
              <source>his house</source>
              <target>hänen talo</target>
            </segment>
            <segment id="s:select:feminine.allative">
              <source>her house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:feminine._other">
              <source>her house</source>
              <target>hänen talo</target>
            </segment>
            <segment id="s:select:_other.allative">
              <source>their house</source>
              <target>hänen talolle</target>
            </segment>
            <segment id="s:select:_other._other">
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
      target && stringifyMessage(target)
    ])
  ).toEqual([
    [
      ['select'],
      source`
        .match {$gender :string} {$case :string}
        masculine allative {{his house}}
        masculine * {{his house}}
        feminine allative {{her house}}
        feminine * {{her house}}
        * allative {{their house}}
        * * {{their house}}`,
      source`
        .match {$gender :string} {$case :string}
        masculine allative {{hänen talolle}}
        masculine * {{hänen talo}}
        feminine allative {{hänen talolle}}
        feminine * {{hänen talo}}
        * allative {{hänen talolle}}
        * * {{hänen talo}}`
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
        target && stringifyMessage(target)
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
        target && stringifyMessage(target)
      ])
    ).toEqual([[['key'], ' Message ', undefined]]);
  });

  test('<unit xml:space="preserve"> with pattern message', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:key" xml:space="preserve">
          <res:resourceData>
            <res:resourceItem id="m1">
              <res:source>
                <mf:literal>msg</mf:literal>
                <mf:function name="message"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment>
            <source> Message <ph id="1" mf:ref="m1"/> </source>
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
    ).toEqual([[['key'], ' Message {msg :message} ', undefined]]);
  });

  test('<unit xml:space="preserve"> with select message', () => {
    const xliff = source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res">
        <unit id="u:key" canResegment="no" mf:select="m3" xml:space="preserve">
          <res:resourceData>
            <res:resourceItem id="m3">
              <res:source>
                <mf:variable name="sel"/>
                <mf:function name="string"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:select:a">
            <source> A </source>
          </segment>
          <segment id="s:select:_other">
            <source> B </source>
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
      [['key'], '.match {$sel :string}\na {{ A }}\n* {{ B }}', undefined]
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
        <unit id="u:five" canResegment="no" mf:select="m1">
          <res:resourceData>
            <res:resourceItem id="m1">
              <res:source>
                <mf:variable name="x"/>
                <mf:function name="number"/>
              </res:source>
            </res:resourceItem>
          </res:resourceData>
          <segment id="s:select:0">
            <source>A</source>
            <target>Ä</target>
          </segment>
          <segment id="s:select:one">
            <source>B</source>
          </segment>
          <segment id="s:select:_other">
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
        .match {$x :number}
        0 {{A}}
        one {{B}}
        * {{C}}`,
      source`
        .match {$x :number}
        0 {{Ä}}
        * {{C}}`
    ]
  ]);
});
