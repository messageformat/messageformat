export const errorMessages = {
  EBADMSG: 'Message with unexpected object value',
  ENOMSG: 'Message not found'
};

export type ErrorCode = keyof typeof errorMessages;

/** @internal */
export class MessageError extends Error {
  code: ErrorCode;
  path: string[];

  constructor(
    path: string[],
    code: ErrorCode,
    asId: (path: string[]) => string
  ) {
    super(`${errorMessages[code]}: ${asId(path)}`);
    this.code = code;
    this.path = path;
  }
}
