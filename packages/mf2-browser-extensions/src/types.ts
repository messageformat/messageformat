/**
 * The key is the name of the message—the same name that you see in `__MSG__name___` or `getMessage("_name_")`.
 *
 * The name is a case-insensitive key that lets you retrieve the localized message text.
 * The name can include the following characters:
 * - A-Z
 * - a-z
 * - 0-9
 * - _ (underscore)
 * - @
 *
 * Note: Don't define names that begin with "@@". Those names are reserved for predefined messages.
 * 
 * Sources:
 * - https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/i18n/Locale-Specific_Message_reference
 * - https://developer.chrome.com/docs/extensions/mv3/i18n-messages/
 */
export type JsonFile = Record<string, JsonMessage>;

export type JsonMessage = {
  /**
   * The translated message, in the form of a string that can contain placeholders.
   * You can use:
   *
   * - $placeholder_name$ (case insensitive) to insert a particular placeholder into your string.
   * - $1, $2, $3, etc. to directly insert values obtained from a `i18n.getMessage()` call into your string.
   *
   * Any number of consecutive dollar signs appearing in strings are replaced by
   * the same number of dollar signs minus one. So, $$ > $, $$$ > $$, etc.
   *
   * When the locale file is read,
   * tokens matching /\$([a-z0-9_@]+)\$/i are replaced with the matching value from the string's "placeholders" object.
   * These substitutions happen prior to processing any /\$\d/ tokens in the message.
   */
  message: string;
  /**
   * A description of the message,
   * intended to give context or details to help the translator make the best possible translation.
   */
  description?: string;
  /**
   * Defines one or more substrings to be used within the message.
   * Here are two reasons you might want to use a placeholder:
   * - To define the text for a part of your message that shouldn't be translated.
   *   Examples: HTML code, trademarked names, formatting specifiers.
   * - To refer to a substitution string passed into `getMessage()`. Example: $1.
   */
  placeholders?: Record<
    string,
    {
      /**
       * The "content" item's value is a string that can refer to substitution strings,
       * which are specified using the `i18n.getMessage` method's substitutions parameter.
       * The value of a "content" item is typically something like "Example.com" or "$1".
       * If you refer to a substitution string that doesn't exist, you get an empty string.
       */
      content: string;
      /**
       * The "example" item (optional, but highly recommended)
       * helps translators by showing how the content appears to the end user.
       * For example, a placeholder for a dollar amount should have an example like "$23.45".
       */
      example?: string;
    }
  >;
};
