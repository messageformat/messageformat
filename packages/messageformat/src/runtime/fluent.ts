import type { Runtime } from '../data-model';
import { datetime, number, plural } from './default';

export const runtime: Runtime<string> = {
  select: { plural },
  format: { DATETIME: datetime, NUMBER: number }
};
