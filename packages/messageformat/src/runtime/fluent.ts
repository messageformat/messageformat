import { datetime, number, plural } from './default';
import type { Runtime } from './index';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { DATETIME: datetime, NUMBER: number }
};
