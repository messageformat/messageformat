import type { Model } from 'messageformat';

export { mf2xliff } from './mf2-to-xliff.ts';
export { parse, stringify } from './xliff.ts';
export { xliff2mf } from './xliff-to-mf2.ts';
export * from './xliff-spec.ts';

export type MessageResourceData = Map<
  string,
  Model.Message | MessageResourceData
>;

// TODO: Include resource comments
export type MessageFormatInfo = {
  data: MessageResourceData;
  id: string;
  locale: string;
};
