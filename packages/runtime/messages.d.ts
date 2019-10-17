declare module 'messageformat-runtime/messages' {
  class Messages {
    public availableLocales: string[];

    public locale: string | null;

    public defaultLocale: string | null;

    constructor(locales: MessageData, defaultLocale: string);

    public addMessages(data: object, lc?: string, keypath?: string[]): Messages;

    public resolveLocale(lc: string): string | null;

    public getFallback(lc?: string): string[];

    public setFallback(lc: string, fallback: string[] | null): Messages;

    public hasMessage(
      key: string | string[],
      lc?: string,
      fallback?: boolean
    ): boolean;

    public hasObject(
      key: string | string[],
      lc?: string,
      fallback?: boolean
    ): boolean;

    public get(
      key: string | string[],
      props?: object,
      lc?: string
    ): string | object;
  }

  export interface MessageData {
    [locale: string]: {
      [key: string]: string;
    };
  }

  export default Messages;
}
