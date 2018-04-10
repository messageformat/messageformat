declare module "messageformat" {
    class MessageFormat {
        constructor(message: { [pluralFuncs: string]: Function });
        constructor(message: string[]);
        constructor(message: string);
        addFormatters: (format: {}) => MessageFormat;
        disablePluralKeyChecks: () => MessageFormat;
        setBiDiSupport: (enable: boolean) => MessageFormat;
        setStrictNumberSign: (enable: boolean) => MessageFormat;
        compile: (messages: string, locale?: string) => Msg;
    }

    type Msg = (params: {}) => string;
    export = MessageFormat;
}