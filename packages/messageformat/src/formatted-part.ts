import type { Meta } from './data-model';

export type MessageFormatPart = { meta?: Meta; source?: string } & (
  | Intl.DateTimeFormatPart
  | Intl.NumberFormatPart
  | { type: 'literal'; value: string }
  | { type: 'dynamic'; value: unknown; source: string }
  | { type: 'fallback'; value: string; source: string }
  | { type: 'meta'; value: ''; meta: Meta }
);
