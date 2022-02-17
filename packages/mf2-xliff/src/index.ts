export { mf2xliff } from './mf2xliff';
export { parse, stringify } from './xliff';
export { xliff2mf } from './xliff2mf';
export * from './xliff-spec';

import type { MessageGroup } from 'messageformat';

export type MessageFormatInfo = {
  data: MessageGroup;
  id: string;
  locale: string;
};
