import type { Model } from 'messageformat';

export { mf2xliff } from './mf2xliff.ts';
export { parse, stringify } from './xliff.ts';
export { xliff2mf } from './xliff2mf.ts';
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
