// @ts-ignore
import { source } from 'common-tags';
import { compileFluent } from '@messageformat/compiler';
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
  const res = compileFluent(src, { id: 'res', locale: 'en' });
  const xliff = stringify(mf2xliff(res));
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet">
      <file id="f:res" mf:resourceId="res">
        <unit id="u:msg" name="msg">
          <segment>
            <source>Message</source>
          </segment>
        </unit>
        <unit id="u:var" name="var">
          <mf:messageformat>
            <mf:variable id="m1">
              <mf:literal>num</mf:literal>
            </mf:variable>
          </mf:messageformat>
          <segment>
            <source>Foo·
              <ph id="1" mf:ref="m1"/>
            </source>
          </segment>
        </unit>
        <unit id="u:ref" name="ref">
          <mf:messageformat>
            <mf:message id="m2">
              <mf:literal>msg</mf:literal>
            </mf:message>
          </mf:messageformat>
          <segment>
            <source>This is the·
              <ph id="2" mf:ref="m2"/>
            </source>
          </segment>
        </unit>
        <group id="g:select" name="select" mf:select="m3">
          <mf:messageformat>
            <mf:variable default="b" id="m3">
              <mf:literal>selector</mf:literal>
            </mf:variable>
          </mf:messageformat>
          <unit id="u:select.a" name="a">
            <segment>
              <source>A</source>
            </segment>
          </unit>
          <unit id="u:select.b" name="b">
            <segment>
              <source>B</source>
            </segment>
          </unit>
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
  const srcRes = compileFluent(src, { id: 'res', locale: 'en' });

  const trg = source`
    msg = Viesti
    var = Föö { $num }
    select = {$selector ->
        [a] Ä
       *[b] B
    }`;
  const trgRes = compileFluent(trg, { id: 'res', locale: 'fi' });

  const xliff = stringify(mf2xliff(srcRes, trgRes));
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet" trgLang="fi">
      <file id="f:res" mf:resourceId="res">
        <unit id="u:msg" name="msg">
          <segment>
            <source>Message</source>
            <target>Viesti</target>
          </segment>
        </unit>
        <unit id="u:var" name="var">
          <mf:messageformat>
            <mf:variable id="m1">
              <mf:literal>num</mf:literal>
            </mf:variable>
            <mf:variable id="m2">
              <mf:literal>num</mf:literal>
            </mf:variable>
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
        <group id="g:select" name="select" mf:select="m3">
          <mf:messageformat>
            <mf:variable default="b" id="m3">
              <mf:literal>selector</mf:literal>
            </mf:variable>
          </mf:messageformat>
          <unit id="u:select.a" name="a">
            <segment>
              <source>A</source>
              <target>Ä</target>
            </segment>
          </unit>
          <unit id="u:select.b" name="b">
            <segment>
              <source>B</source>
              <target>B</target>
            </segment>
          </unit>
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
  const srcRes = compileFluent(src, { id: 'res', locale: 'en' });

  const trg = source`
    select = {$case ->
        [allative] hänen talolle
       *[nominative] hänen talo
    }`;
  const trgRes = compileFluent(trg, { id: 'res', locale: 'fi' });

  const xliff = stringify(mf2xliff(srcRes, trgRes));
  expect(xliff).toBe(
    source`
    <xliff version="2.0" srcLang="en" xmlns="urn:oasis:names:tc:xliff:document:2.0" xmlns:mf="http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet" trgLang="fi">
      <file id="f:res" mf:resourceId="res">
        <group id="g:select" name="select" mf:select="m1 m2">
          <mf:messageformat>
            <mf:variable default="other" id="m1">
              <mf:literal>gender</mf:literal>
            </mf:variable>
            <mf:variable default="nominative" id="m2">
              <mf:literal>case</mf:literal>
            </mf:variable>
          </mf:messageformat>
          <unit id="u:select.masculine_allative" name="masculine allative">
            <segment>
              <source>his house</source>
              <target>hänen talolle</target>
            </segment>
          </unit>
          <unit id="u:select.masculine_nominative" name="masculine nominative">
            <segment>
              <source>his house</source>
              <target>hänen talo</target>
            </segment>
          </unit>
          <unit id="u:select.feminine_allative" name="feminine allative">
            <segment>
              <source>her house</source>
              <target>hänen talolle</target>
            </segment>
          </unit>
          <unit id="u:select.feminine_nominative" name="feminine nominative">
            <segment>
              <source>her house</source>
              <target>hänen talo</target>
            </segment>
          </unit>
          <unit id="u:select.other_allative" name="other allative">
            <segment>
              <source>their house</source>
              <target>hänen talolle</target>
            </segment>
          </unit>
          <unit id="u:select.other_nominative" name="other nominative">
            <segment>
              <source>their house</source>
              <target>hänen talo</target>
            </segment>
          </unit>
        </group>
      </file>
    </xliff>`.replace(/·/g, ' ')
  );
});
