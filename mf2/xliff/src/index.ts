import type { Message } from 'messageformat';

export { mf2xliff } from './mf2xliff.js';
export { parse, stringify } from './xliff.js';
export { xliff2mf } from './xliff2mf.js';
export * from './xliff-spec.js';

export type MessageResourceData = Map<string, Message | MessageResourceData>;

// TODO: Include resource comments
export type MessageFormatInfo = {
  data: MessageResourceData;
  id: string;
  locale: string;
};
