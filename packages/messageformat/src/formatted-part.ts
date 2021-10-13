import type { Meta } from './data-model';

export type MessageFormatPart =
  | (Intl.DateTimeFormatPart & { source?: string })
  | (Intl.NumberFormatPart & { source?: string })
  | { type: 'literal'; value: string; source?: string }
  | { type: 'dynamic'; value: unknown; source: string }
  | { type: 'fallback'; value: string; source: string }
  | { type: 'meta'; value: ''; meta: Meta; source?: string };
