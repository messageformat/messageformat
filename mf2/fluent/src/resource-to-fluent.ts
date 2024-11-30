import * as Fluent from '@fluent/syntax';
import type { Message } from 'messageformat';
import type { FluentMessageResourceData } from './index.js';
import type { FunctionMap } from './message-to-fluent.js';
import { messageToFluent } from './message-to-fluent.js';

/**
 * Convert a Map of {@link messageformat#Message} data objects into a
 * {@link https://projectfluent.org/fluent.js/syntax/classes/resource.html | Fluent.Resource}.
 *
 * @beta
 * @param template - If set, defines the resource-level comments, message order,
 *   and the default variant identifiers for messages.
 * @param functionMap - A mapping of MessageFormat 2 → Fluent function names.
 *   The special value {@link FluentMessageRef} maps to Fluent message/term references.
 */
export function resourceToFluent(
  resource: FluentMessageResourceData,
  template?: Fluent.Resource,
  functionMap?: FunctionMap
): Fluent.Resource {
  const body: Fluent.Entry[] = [];
  let res: Map<string, Map<string, Message> | null>;
  if (template) {
    res = new Map(resource); // Should not modify argument
    for (const entry of template.body) {
      switch (entry.type) {
        case 'Message':
        case 'Term': {
          const msgId = (entry.type === 'Term' ? '-' : '') + entry.id.name;
          const group = res.get(msgId);
          if (group) {
            body.push(messageGroupToFluent(msgId, group, entry, functionMap));
            res.set(msgId, null);
          }
          break;
        }
        default:
          body.push(entry.clone());
      }
    }
  } else {
    res = resource;
  }

  let prevId: string | undefined;
  for (const [msgId, group] of res) {
    if (group) {
      const entry = messageGroupToFluent(msgId, group, null, functionMap);
      const prevIndex = body.findIndex(
        entry =>
          (entry.type === 'Message' || entry.type === 'Term') &&
          entry.id.name === prevId
      );
      if (prevIndex !== -1) body.splice(prevIndex + 1, 0, entry);
      else body.push(entry);
    }
    prevId = msgId.replace(/^-/, '');
  }

  return new Fluent.Resource(body);
}

function messageGroupToFluent(
  msgId: string,
  messages: Map<string, Message>,
  template: Fluent.Message | Fluent.Term | null,
  functionMap: FunctionMap | undefined
): Fluent.Message | Fluent.Term {
  let comment: string | undefined;
  let value: Fluent.Pattern | undefined;
  const attributes: Fluent.Attribute[] = [];
  for (const [attrId, msg] of messages) {
    const defaultKey = findDefaultKey(template, attrId);
    const pattern = messageToFluent(msg, defaultKey, functionMap);
    if (!attrId) {
      comment = msg.comment;
      value = pattern;
    } else {
      const id = new Fluent.Identifier(attrId);
      attributes.push(new Fluent.Attribute(id, pattern));
      if (msg.comment) {
        throw new Error(
          `Comments are not supported on Fluent attributes: ${msgId}.${attrId}`
        );
      }
    }
  }

  const fc = comment ? new Fluent.Comment(comment) : null;
  if (msgId[0] === '-') {
    const id = new Fluent.Identifier(msgId.substring(1));
    if (!value) throw new Error(`Value required for Fluent term ${msgId}`);
    return new Fluent.Term(id, value, attributes, fc);
  } else {
    const id = new Fluent.Identifier(msgId);
    return new Fluent.Message(id, value, attributes, fc);
  }
}

function findDefaultKey(
  template: Fluent.Message | Fluent.Term | null,
  attrId: string | null
) {
  if (template) {
    const tmpl = attrId
      ? template.attributes.find(attr => attr.id.name === attrId)
      : template.value;
    if (tmpl) {
      let dk: Fluent.Identifier | Fluent.NumberLiteral | undefined;
      class Finder extends Fluent.Visitor {
        visitVariant(variant: Fluent.Variant) {
          if (variant.default) dk = variant.key;
        }
      }
      new Finder().visit(tmpl);
      if (dk instanceof Fluent.Identifier) return dk.name;
      if (dk instanceof Fluent.NumberLiteral) return dk.value;
    }
  }
  return undefined;
}
