import { isMessage, Message, MessageGroup, Resource } from './data-model';

/**
 * Provides the minimum required runtime interface for accessing resources.
 * This base class is applied automatically for Resource values, but an
 * implementation may extend this to provide its own `getId()` and
 * `getMessage(path)`.
 */
export class ResourceReader {
  static from(src: Resource | ResourceReader) {
    return src instanceof ResourceReader ? src : new ResourceReader(src);
  }

  #data: Resource;

  constructor(data: Resource) {
    this.#data = data;
  }

  getId(): string {
    return this.#data.id;
  }

  getMessage(path: string[]): Message | undefined {
    if (path.length === 0) return undefined;
    let msg: MessageGroup | Message | undefined = this.#data.entries[path[0]];
    for (let i = 1; i < path.length; ++i) {
      if (!msg || isMessage(msg)) return undefined;
      msg = msg.entries[path[i]];
    }
    return isMessage(msg) ? msg : undefined;
  }
}
