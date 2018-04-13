declare module "messageformat" {
    type Msg = (params: {}) => string;
    type Formatter = (val: any, lc: string, arg?: string) => string;
    type SrcMessage = string | SrcObject;

    interface SrcObject {
        [key: string]: SrcMessage;
    }
    class MessageFormat {
        constructor(message: { [pluralFuncs: string]: Function });
        constructor(message: string[]);
        constructor(message: string);
        constructor();
        addFormatters: (format: { [name: string]: Formatter }) => MessageFormat;
        disablePluralKeyChecks: () => MessageFormat;
        setBiDiSupport: (enable: boolean) => MessageFormat;
        setStrictNumberSign: (enable: boolean) => MessageFormat;
        compile: (messages: SrcMessage, locale?: string) => Msg;
    }
    export = MessageFormat;
}