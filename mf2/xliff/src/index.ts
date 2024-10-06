import type { Message } from 'messageformat';

export { mf2xliff } from './mf2xliff';
export { parse, stringify } from './xliff';
export { xliff2mf } from './xliff2mf';
export * from './xliff-spec';

export type MessageResourceData = Map<string, Message | MessageResourceData>;

// TODO: Include resource comments
export type MessageFormatInfo = {
  data: MessageResourceData;
  id: string;
  locale: string;
};
