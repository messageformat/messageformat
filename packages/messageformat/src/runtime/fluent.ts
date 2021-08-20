import { datetime, number, plural } from './default';

export const runtime = {
  select: { plural },
  format: { DATETIME: datetime, NUMBER: number }
};
