import { fluentToResourceData } from '@messageformat/fluent';
import { source } from '@messageformat/test-utils';
import { mf2xliff, stringify } from './index';

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
          <unit id="u:msg." name="msg">
            <segment>
              <source>Message</source>
            </segment>
          </unit>
        </group>
        <group id="g:var" name="var">
          <unit id="u:var." name="var">
            <mf:messageformat>
              <mf:variable id="m1" name="num"/>
            </mf:messageformat>
            <segment>
              <source>Foo·
                <ph id="1" mf:ref="m1"/>
              </source>
            </segment>
          </unit>
        </group>
        <group id="g:ref" name="ref">
          <unit id="u:ref." name="ref">
            <mf:messageformat>
              <mf:function id="m2" name="message">
                <mf:literal>msg</mf:literal>
              </mf:function>
            </mf:messageformat>
            <segment>
              <source>This is the·
                <ph id="2" mf:ref="m2"/>
              </source>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <group id="g:select." name="select" mf:select="m3">
            <mf:messageformat>
              <mf:variable id="m3" name="selector"/>
            </mf:messageformat>
            <unit id="u:select..a" name="a">
              <segment>
                <source>A</source>
              </segment>
            </unit>
            <unit id="u:select..*" name="*">
              <segment>
                <source>B</source>
              </segment>
            </unit>
          </group>
        </group>
      </file>
    </xliff>`.replace(/·/g, ' ')
  );
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
          <unit id="u:msg." name="msg">
            <segment>
              <source>Message</source>
              <target>Viesti</target>
            </segment>
          </unit>
        </group>
        <group id="g:var" name="var">
          <unit id="u:var." name="var">
            <mf:messageformat>
              <mf:variable id="m1" name="num"/>
              <mf:variable id="m2" name="num"/>
            </mf:messageformat>
            <segment>
              <source>Foo·
                <ph id="1" mf:ref="m1"/>
              </source>
              <target>Föö·
                <ph id="2" mf:ref="m2"/>
              </target>
            </segment>
          </unit>
        </group>
        <group id="g:select" name="select">
          <group id="g:select." name="select" mf:select="m3">
            <mf:messageformat>
              <mf:variable id="m3" name="selector"/>
            </mf:messageformat>
            <unit id="u:select..a" name="a">
              <segment>
                <source>A</source>
                <target>Ä</target>
              </segment>
            </unit>
            <unit id="u:select..*" name="*">
              <segment>
                <source>B</source>
                <target>B</target>
              </segment>
            </unit>
          </group>
        </group>
      </file>
    </xliff>`.replace(/·/g, ' ')
  );
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
          <group id="g:select." name="select" mf:select="m1 m2">
            <mf:messageformat>
              <mf:variable id="m1" name="gender"/>
              <mf:variable id="m2" name="case"/>
            </mf:messageformat>
            <unit id="u:select..masculine_allative" name="masculine allative">
              <segment>
                <source>his house</source>
                <target>hänen talolle</target>
              </segment>
            </unit>
            <unit id="u:select..masculine_*" name="masculine *">
              <segment>
                <source>his house</source>
                <target>hänen talo</target>
              </segment>
            </unit>
            <unit id="u:select..feminine_allative" name="feminine allative">
              <segment>
                <source>her house</source>
                <target>hänen talolle</target>
              </segment>
            </unit>
            <unit id="u:select..feminine_*" name="feminine *">
              <segment>
                <source>her house</source>
                <target>hänen talo</target>
              </segment>
            </unit>
            <unit id="u:select..*_allative" name="* allative">
              <segment>
                <source>their house</source>
                <target>hänen talolle</target>
              </segment>
            </unit>
            <unit id="u:select..*_*" name="* *">
              <segment>
                <source>their house</source>
                <target>hänen talo</target>
              </segment>
            </unit>
          </group>
        </group>
      </file>
    </xliff>`.replace(/·/g, ' ')
  );
});
