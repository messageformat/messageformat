declare namespace MessageFormat {
  type Msg = { (params: {}): string; toString(global?: string): string };
  type Formatter = (val: any, lc: string, arg?: string) => string;
  type SrcMessage = string | SrcObject;

  interface SrcObject {
    [key: string]: SrcMessage;
  }
}

declare class MessageFormat {
  constructor(
    message?: { [pluralFuncs: string]: Function } | string[] | string
  );
  addFormatters: (format: { [name: string]: MessageFormat.Formatter }) => this;
  disablePluralKeyChecks: () => this;
  setBiDiSupport: (enable: boolean) => this;
  setStrictNumberSign: (enable: boolean) => this;
  compile: (
    messages: MessageFormat.SrcMessage,
    locale?: string
  ) => MessageFormat.Msg;
}

export = MessageFormat;
