declare namespace messageformat {
    type Msg = (params: {}) => string;
    type Formatter = (val: any, lc: string, arg?: string) => string;
    type SrcMessage = string | SrcObject;

    interface SrcObject {
        [key: string]: SrcMessage;
    }

    class MessageFormat extends messageformat {}
}

declare class messageformat {
    constructor(message: { [pluralFuncs: string]: Function });
    constructor(message: string[]);
    constructor(message: string);
    constructor();
    addFormatters: (format: { [name: string]: messageformat.Formatter }) => messageformat;
    disablePluralKeyChecks: () => messageformat;
    setBiDiSupport: (enable: boolean) => messageformat;
    setStrictNumberSign: (enable: boolean) => messageformat;
    compile: (messages: messageformat.SrcMessage, locale?: string) => messageformat.Msg;
}

export = messageformat;
