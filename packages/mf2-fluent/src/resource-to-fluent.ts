import * as Fluent from '@fluent/syntax';
import { Message } from 'messageformat';
import {
  FunctionMap,
  messageToFluent,
  valueToMessageRef
} from './message-to-fluent';

type MessageGroup = Map<string | null, Message>;

export function resourceToFluent(
  resource: Map<string, Message>,
  template?: Fluent.Resource,
  functionMap?: FunctionMap
): Fluent.Resource {
  const grouped = new Map<string, MessageGroup | null>();
  for (const [id, msg] of resource) {
    const { msgId, msgAttr } = valueToMessageRef(id);
    let group = grouped.get(msgId);
    if (!group) {
      group = new Map();
      grouped.set(msgId, group);
    }
    group.set(msgAttr, msg);
  }

  const body: Fluent.Entry[] = [];
  if (template) {
    for (const entry of template.body) {
      switch (entry.type) {
        case 'Message':
        case 'Term': {
          const msgId = (entry.type === 'Term' ? '-' : '') + entry.id.name;
          const group = grouped.get(msgId);
          if (group) {
            body.push(messageGroupToFluent(msgId, group, entry, functionMap));
            grouped.set(msgId, null);
          }
          break;
        }
        default:
          body.push(entry.clone());
      }
    }
  }

  let prevId: string | undefined;
  for (const [msgId, group] of grouped) {
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
  messages: MessageGroup,
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
