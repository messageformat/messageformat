declare namespace MessageFormat {
    type Msg = (params: {}) => string;
    type Formatter = (val: any, lc: string, arg?: string) => string;
    type SrcMessage = string | SrcObject;

    interface SrcObject {
        [key: string]: SrcMessage;
    }

    class MessageFormat extends messageformat {}
}

declare class MessageFormat {
    constructor(message: { [pluralFuncs: string]: Function });
    constructor(message: string[]);
    constructor(message: string);
    constructor();
    addFormatters: (format: { [name: string]: MessageFormat.Formatter }) => this;
    disablePluralKeyChecks: () => this;
    setBiDiSupport: (enable: boolean) => this;
    setStrictNumberSign: (enable: boolean) => this;
    compile: (messages: MessageFormat.SrcMessage, locale?: string) => MessageFormat.Msg;
}

export = MessageFormat;
