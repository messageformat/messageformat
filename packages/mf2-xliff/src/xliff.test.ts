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
      <file id="f:res" mf:resourceId="res">
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
              <source>Foo <ph id="1" mf:ref="m1"/></source>
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
              <source>This is the <ph id="2" mf:ref="m2"/></source>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <unit id="u:select" name="select" mf:select="m3">
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
  const [res] = xliff2mf(xliff);
  expect(res.target).toBeUndefined();
  expect(res.source).toMatchObject({ id: 'res', locale: 'en' });
  expect(
    Array.from(res.source.data.entries()).map(([key, value]) => [
      key,
      stringifyMessage((value as any).get(''))
    ])
  ).toEqual([
    ['msg', 'Message'],
    ['var', 'Foo {$num}'],
    ['ref', 'This is the {msg :message}'],
    ['select', '.match {$selector :string}\na {{A}}\n* {{B}}']
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
      <file id="f:res" mf:resourceId="res">
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
              <source>Foo <ph id="1" mf:ref="m1"/></source>
              <target>Föö <ph id="2" mf:ref="m2"/></target>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <unit id="u:select" name="select" mf:select="m3">
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
  const [res] = xliff2mf(xliff);
  expect(res.source).toMatchObject({ id: 'res', locale: 'en' });
  expect(
    Array.from(res.source.data.entries()).map(([key, value]) => [
      key,
      stringifyMessage((value as any).get(''))
    ])
  ).toEqual([
    ['msg', 'Message'],
    ['var', 'Foo {$num}'],
    ['select', '.match {$selector :string}\na {{A}}\n* {{B}}']
  ]);
  expect(res.target).toMatchObject({ id: 'res', locale: 'fi' });
  expect(
    Array.from(res.target!.data.entries()).map(([key, value]) => [
      key,
      stringifyMessage((value as any).get(''))
    ])
  ).toEqual([
    ['msg', 'Viesti'],
    ['var', 'Föö {$num}'],
    ['select', '.match {$selector :string}\na {{Ä}}\n* {{B}}']
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
      <file id="f:res" mf:resourceId="res">
        <group id="g:select" name="select">
          <unit id="u:select" name="select" mf:select="m1 m2">
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
  const [res] = xliff2mf(xliff);
  expect(res.source).toMatchObject({ id: 'res', locale: 'en' });
  expect(stringifyMessage((res.source.data.get('select') as any).get(''))).toBe(
    source`
    .match {$gender :string} {$case :string}
    masculine allative {{his house}}
    masculine * {{his house}}
    feminine allative {{her house}}
    feminine * {{her house}}
    * allative {{their house}}
    * * {{their house}}`
  );
  expect(res.target).toMatchObject({ id: 'res', locale: 'fi' });
  expect(
    stringifyMessage((res.target!.data.get('select') as any).get(''))
  ).toBe(
    source`
    .match {$gender :string} {$case :string}
    masculine allative {{hänen talolle}}
    masculine * {{hänen talo}}
    feminine allative {{hänen talolle}}
    feminine * {{hänen talo}}
    * allative {{hänen talolle}}
    * * {{hänen talo}}`
  );
});
