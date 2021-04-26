/**
 * XLIFF 2.1 types for TypeScript
 *
 * Includes types for the core spec as well as the following modules:
 *   - Translation Candidates (mtc)
 *   - Glossary (gls)
 *   - Format Style (fs)
 *   - Metadata (mda)
 *   - Resource Data (res)
 *   - Size and Length Restriction (slr)
 *   - Validation (val)
 *
 * For custom extensions, use the `FileOther`, `GroupOther` and `UnitOther`
 * generics to define available elements for the corresponding parent element.
 *
 * http://docs.oasis-open.org/xliff/xliff-core/v2.1/os/xliff-core-v2.1-os.html
 *
 * @module
 */

export type Direction = 'ltr' | 'rtl' | 'auto';
export type Normalization = 'none' | 'nfc' | 'nfd';
export type YesNo = 'yes' | 'no';
export type XmlSpace = 'default' | 'preserve';

export interface Element {
  type: 'element';
  name: string;
  attributes?: { [key: string]: string | number | undefined };
  elements?: (Element | Text)[];
}

export interface Text {
  type: 'text' | 'cdata';
  text: string;
}

export interface XliffDoc<
  FileOther extends Element | never = never,
  GroupOther extends Element | never = never,
  UnitOther extends Element | never = never
> {
  declaration?: {
    attributes?: Record<string, string | number>;
  };
  elements: [Xliff<FileOther, GroupOther, UnitOther>];
  name?: never;
}

export interface Xliff<
  FileOther extends Element | never = never,
  GroupOther extends Element | never = never,
  UnitOther extends Element | never = never
> extends Element {
  name: 'xliff';
  attributes: {
    /**
     * XLIFF Version - is used to specify the Version of the XLIFF Document.
     * This corresponds to the Version number of the XLIFF specification
     * that the XLIFF Document adheres to.
     */
    version: string;

    /**
     * Source language - the BCP-47 code of the language
     * in which the text to be _Translated_ is expressed.
     */
    srcLang: string;

    /**
     * Target language - the BCP-47 code of the language
     * in which the _Translated_ text is expressed.
     */
    trgLang?: string;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: `default`
     */
    'xml:space'?: XmlSpace;
    xmlns?: 'urn:oasis:names:tc:xliff:document:2.0';
    'xmlns:fs'?: 'urn:oasis:names:tc:xliff:fs:2.0';
    'xmlns:gls'?: 'urn:oasis:names:tc:xliff:glossary:2.0';
    'xmlns:mda'?: 'urn:oasis:names:tc:xliff:metadata:2.0';
    'xmlns:mtc'?: 'urn:oasis:names:tc:xliff:matches:2.0';
    'xmlns:res'?: 'urn:oasis:names:tc:xliff:resourcedata:2.0';
    'xmlns:slr'?: 'urn:oasis:names:tc:xliff:sizerestriction:2.0';
    'xmlns:val'?: 'urn:oasis:names:tc:xliff:validation:2.0';
    [key: string]: string | number | undefined;
    //'xmlns:mf'?: 'http://www.unicode.org/ns/2021/messageformat/2.0/not-real-yet';
  };
  elements: File<FileOther, GroupOther, UnitOther>[];
}

export interface File<
  FileOther extends Element | never = never,
  GroupOther extends Element | never = never,
  UnitOther extends Element | never = never
> extends Element {
  name: 'file';
  attributes: {
    id: string;

    /**
     * Can the source text in this scope be reorganized into a different
     * structure of `<segment>` elements within the same parent `<unit>`
     *
     * Default: `yes`
     */
    canResegment?: YesNo;

    /**
     * A pointer to the location of the original document from which the
     * content of this `<file>` element is extracted
     */
    original?: string;

    /**
     * Whether or not the source text in this `<file>` is intended
     * for _Translation_.
     *
     * Default: `yes`
     */
    translate?: YesNo;

    /**
     * Directionality of source content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     *
     * Default: `auto`
     */
    srcDir?: Direction;

    /**
     * Directionality of target content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     *
     * Default: `auto`
     */
    trgDir?: Direction;
    'fs:fs'?: FormatStyle;
    'fs:subFs'?: string;
    'slr:sizeInfo'?: string | number;
    'slr:sizeInfoRef'?: string;
    'slr:sizeRestriction'?: string | number;
    'slr:storageRestriction'?: string | number;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: inherit from parent
     */
    'xml:space'?: XmlSpace;
    [key: string]: string | number | undefined;
  };
  elements: (
    | Skeleton
    | Metadata
    | ResourceData
    | SizeLengthProfiles
    | SizeLengthData
    | Validation
    | FileOther
    | Notes
    | Group<GroupOther, UnitOther>
    | Unit<UnitOther>
  )[];
}

export interface Skeleton extends Element {
  name: 'skeleton';
  attributes?: {
    href?: string;
  };
  elements: [Text] | Element[];
}

export interface Notes extends Element {
  name: 'notes';
  elements: Note[];
}

export interface Note extends Element {
  name: 'note';
  attributes?: {
    id?: string;
    appliesTo?: 'source' | 'target';
    category?: string;

    /**
     * A way to prioritize notes.
     *
     * Please note that 1 is the highest priority that can be interpreted as
     * an alert, e.g. an ITS Localization Note of the type alert. The best
     * practice is to use only one alert per an annotated element, and the
     * full scale of 2-10 can be used for prioritizing notes of lesser
     * importance than the alert.
     *
     * Default: `1`
     */
    priority?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    'fs:fs'?: FormatStyle;
    'fs:subFs'?: string;
    [key: string]: string | number | undefined;
  };
  elements: [Text];
}

export interface Group<
  GroupOther extends Element | never = never,
  UnitOther extends Element | never = never
> extends Element {
  name: 'group';
  attributes: {
    id: string;

    /** Resource name - the original identifier of the resource */
    name?: string;

    /**
     * Can the source text in this scope be reorganized into a different
     * structure of `<segment>` elements within the same parent `<unit>`
     *
     * Default: inherit from parent
     */
    canResegment?: YesNo;

    /**
     * Whether or not the source text in this `<group>` is intended
     * for _Translation_.
     *
     * Default: inherit from parent
     */
    translate?: YesNo;

    /**
     * Directionality of source content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     *
     * Default: inherit from parent
     */
    srcDir?: Direction;

    /**
     * Directionality of target content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     *
     * Default: inherit from parent
     */
    trgDir?: Direction;

    /**
     * Type - indicates the type of an element.
     *
     * A value that is composed of a prefix and a sub-value separated by
     * a `:` character.
     *
     * The prefix is a string uniquely identifying a collection of
     * sub-values for a specific authority. The sub-value is any string
     * value defined by the authority. The prefix `xlf` is reserved.
     */
    type?: string;
    'slr:sizeInfo'?: string | number;
    'slr:sizeInfoRef'?: string;
    'slr:sizeRestriction'?: string | number;
    'slr:storageRestriction'?: string | number;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: inherit from parent
     */
    'xml:space'?: XmlSpace;
    [key: string]: string | number | undefined;
  };
  elements?: (
    | Metadata
    | SizeLengthData
    | Validation
    | GroupOther
    | Notes
    | Group<GroupOther, UnitOther>
    | Unit<UnitOther>
  )[];
}

export interface Unit<UnitOther extends Element | never = never>
  extends Element {
  name: 'unit';
  attributes: {
    id: string;

    /** Resource name - the original identifier of the resource */
    name?: string;

    /**
     * Can the source text in this scope be reorganized into a different
     * structure of `<segment>` elements within the same parent `<unit>`
     */
    canResegment?: YesNo;

    /**
     * Whether or not the source text in this `<unit>` is intended
     * for _Translation_.
     *
     * Default: inherit from parent
     */
    translate?: YesNo;

    /**
     * Directionality of source content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     */
    srcDir?: Direction;

    /**
     * Directionality of target content: `ltr` (Left-To-Right),
     * `rtl` (Right-To-Left), or `auto` (determined heuristically, based on
     * the first strong directional character in scope).
     */
    trgDir?: Direction;

    /**
     * Type - indicates the type of an element.
     *
     * A value that is composed of a prefix and a sub-value separated by
     * a `:` character.
     *
     * The prefix is a string uniquely identifying a collection of
     * sub-values for a specific authority. The sub-value is any string
     * value defined by the authority. The prefix `xlf` is reserved.
     */
    type?: string;
    'fs:fs'?: FormatStyle;
    'fs:subFs'?: string;
    'slr:sizeInfo'?: string | number;
    'slr:sizeInfoRef'?: string;
    'slr:sizeRestriction'?: string | number;
    'slr:storageRestriction'?: string | number;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: inherit from parent
     */
    'xml:space'?: XmlSpace;
    [key: string]: string | number | undefined;
  };
  elements?: (
    | Matches
    | Glossary
    | Metadata
    | ResourceData
    | SizeLengthData
    | Validation
    | UnitOther
    | Notes
    | OriginalData
    | Segment
    | Ignorable
  )[];
}

export interface Segment extends Element {
  name: 'segment';
  attributes?: {
    id?: string;

    /**
     * Can the source text in this scope be reorganized into a different
     * structure of `<segment>` elements within the same parent `<unit>`
     */
    canResegment?: YesNo;

    /**
     * The state of the translation of a segment.
     *
     * - `initial` - indicates the segment is in its initial state.
     * - `translated` - indicates the segment has been translated.
     * - `reviewed` - indicates the segment has been reviewed.
     * - `final` - indicates the segment is finalized and ready to be used.
     *
     * The 4 defined states constitute a simple linear state machine that
     * advances in the above given order. No particular workflow or process
     * is prescribed, except that the three states more advanced than the
     * default initial assume the existence of a _Translation_ within the
     * segment. One can further specify the state of the _Translation_
     * using the subState attribute.
     *
     * Default: `initial`
     */
    state?: 'initial' | 'translated' | 'reviewed' | 'final';

    /**
     * A user-defined status for the segment.
     *
     * The value is composed of a prefix and a sub-value separated by a `:`
     * character. The prefix is a string uniquely identifying a collection
     * of values for a specific authority. The sub-value is any string
     * value defined by an authority.
     *
     * The prefix `xlf` is reserved for this specification. Other prefixes
     * and sub-values MAY be defined by the users.
     */
    subState?: string;
  };
  elements: (Source | Target)[];
}

export interface Ignorable extends Element {
  name: 'ignorable';
  attributes?: { id?: string };
  elements: (Source | Target)[];
}

export interface OriginalData extends Element {
  name: 'originalData';
  elements: Data[];
}

export interface Data extends Element {
  name: 'data';
  attributes: {
    id: string;

    /**
     * Directionality of content: `ltr` (Left-To-Right), `rtl` (Right-To-Left),
     * or `auto` (determined heuristically, based on the first strong
     * directional character in scope).
     *
     * Default: `auto`
     */
    dir?: Direction;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: `preserve`
     */
    'xml:space'?: XmlSpace;
  };
  elements: (Text | CharCode)[];
}

export interface Source extends Element {
  name: 'source';
  attributes?: {
    /**
     * The BCP-47 code of the language of the text in this element
     *
     * Default: inherit from `<xliff srcLang>`
     */
    'xml:lang'?: string;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: inherit from parent
     */
    'xml:space'?: XmlSpace;
  };
  elements: (Text | InlineElement)[];
}

export interface Target extends Element {
  name: 'target';
  attributes?: {
    /** The order in which to compose the target content parts */
    order?: number;

    /**
     * The BCP-47 code of the language of the text in this element
     *
     * Default: inherit from `<xliff trgLang>`
     */
    'xml:lang'?: string;

    /**
     * How white spaces (ASCII spaces, tabs and line-breaks) are to be treated.
     *
     * Default: inherit from parent
     */
    'xml:space'?: XmlSpace;
  };
  elements: (Text | InlineElement)[];
}

export type InlineElement =
  | CharCode
  | Placeholder
  | CodeSpan
  | CodeSpanStart
  | CodeSpanEnd
  | Annotation
  | AnnotationStart
  | AnnotationEnd;

export interface CharCode extends Element {
  name: 'cp';
  attributes: {
    /** The value of a Unicode code point that is invalid in XML */
    hex: string;
  };
  elements: never;
}

export interface CodeAttributes {
  /**
   * Replication editing hint - indicates whether or not the inline code
   * can be copied.
   *
   * Default: `yes`
   */
  canCopy?: YesNo;

  /**
   * Deletion editing hint - indicates whether or not the inline code
   * can be deleted.
   *
   * Default: `yes` */
  canDelete?: YesNo;

  /**
   * Re-ordering editing hint - indicates whether or not the inline code
   * can be re-ordered.
   *
   * - `yes` in case the code can be re-ordered,
   * - `firstNo` when the code is the first element of a sequence that
   *   cannot be re-ordered,
   * - `no` when it is another element of such a sequence.
   *
   * Default: `yes` */
  canReorder?: 'yes' | 'firstNo' | 'no';

  /** The id value of the base code of which this code is a copy */
  copyOf?: string;

  /**
   * The secondary level type of an inline code.
   *
   * The value is composed of a prefix and a sub-value separated by a `:`
   * character. The prefix is a string uniquely identifying a collection
   * of sub-values for a specific authority. The sub-value is any string
   * value defined by the authority.
   *
   * The prefix `xlf` is reserved for this specification, and the
   * following sub-values are defined:
   *   - `xlf:lb` - Line break
   *   - `xlf:pb` - Page break
   *   - `xlf:b` - Bold
   *   - `xlf:i` - Italics
   *   - `xlf:u` - Underlined
   *   - `xlf:var` - Variable
   *
   * Other prefixes and sub-values MAY be defined by the users.
   */
  subType?: string;

  /**
   * Type - indicates the type of an element.
   *
   * - `fmt` - Formatting (e.g. a `<b>` element in HTML)
   * - `ui -` User interface element
   * - `quote` - Inline quotation (as opposed to a block citation)
   * - `link` - Link (e.g. an `<a>` element in HTML)
   * - `image` - Image or graphic
   * - `other` - Type of element not covered by any of the other top-level types.
   *
   * One can further specify the type of a code using the subType attribute.
   */
  type?: 'fmt' | 'ui' | 'quote' | 'link' | 'image' | 'other';

  'fs:fs'?: FormatStyle;
  'fs:subFs'?: string;
  'slr:equivStorage'?: string | number;
  'slr:sizeInfo'?: string | number;
  'slr:sizeInfoRef'?: string;
  [key: string]: string | number | undefined;
}

export interface Placeholder extends Element {
  name: 'ph';
  attributes: CodeAttributes & {
    id: string;

    /**
     * The id value of the `<data>` element that contains the original data
     * for this code
     */
    dataRef?: string;

    /**
     * Alternative user-friendly display representation of the original data
     * of this code
     */
    disp?: string;

    /**
     * Plain text representation of the original data of the inline code that
     * can be used when generating a plain text representation of the content
     */
    equiv?: string;

    /**
     * A space-separated list of id attributes corresponding to the `<unit>`
     * elements that contain the sub-flows for this code.
     */
    subFlows?: string;
  };
  elements: never;
}

export interface CodeSpan extends Element {
  name: 'pc';
  attributes: CodeAttributes & {
    id: string;

    /**
     * Can this spanning code enclose partial spanning codes (i.e. a start
     * code without its corresponding end code, or an end code without its
     * corresponding start code).
     *
     * Default: `no`
     */
    canOverlap?: YesNo;

    /**
     * The id value of the `<data>` element that contains the original data
     * for the end marker of this code
     */
    dataRefEnd?: string;

    /**
     * The id value of the `<data>` element that contains the original data
     * for the start marker of this code
     */
    dataRefStart?: string;

    /**
     * Directionality of content: `ltr` (Left-To-Right), `rtl` (Right-To-Left),
     * or `auto` (determined heuristically, based on the first strong
     * directional character in scope).
     */
    dir?: Direction;

    /**
     * Alternative user-friendly display representation of the original data
     * of the end marker of this code
     */
    dispEnd?: string;

    /**
     * Alternative user-friendly display representation of the original data
     * of the start marker of this code
     */
    dispStart?: string;

    /**
     * Plain text representation of the original data of the end marker of
     * this code that can be used when generating a plain text representation
     * of the content
     */
    equivEnd?: string;

    /**
     * Plain text representation of the original data of the start marker of
     * this code that can be used when generating a plain text representation
     * of the content
     */
    equivStart?: string;

    /**
     * A space-separated list of id attributes corresponding to the `<unit>`
     * elements that contain the sub-flows for the end marker of this code.
     */
    subFlowsEnd?: string;

    /**
     * A space-separated list of id attributes corresponding to the `<unit>`
     * elements that contain the sub-flows for the start marker of this code.
     */
    subFlowsStart?: string;
    'slr:sizeRestriction'?: string | number;
    'slr:storageRestriction'?: string | number;
  };
  elements: (Text | InlineElement)[];
}

export interface CodeSpanStart extends Element {
  name: 'sc';
  attributes: CodeAttributes & {
    id: string;

    /**
     * Can this spanning code enclose partial spanning codes (i.e. a start
     * code without its corresponding end code, or an end code without its
     * corresponding start code).
     *
     * Default: `yes`
     */
    canOverlap?: YesNo;

    /**
     * The id value of the `<data>` element that contains the original data
     * for this code
     */
    dataRef?: string;

    /**
     * Directionality of content: `ltr` (Left-To-Right), `rtl` (Right-To-Left),
     * or `auto` (determined heuristically, based on the first strong
     * directional character in scope).
     */
    dir?: Direction;

    /**
     * Alternative user-friendly display representation of the original data
     * of this code
     */
    disp?: string;

    /**
     * Plain text representation of the original data of the inline code that
     * can be used when generating a plain text representation of the content
     */
    equiv?: string;

    /** Is the corresponding CodeEnd marker in a different `<unit>` */
    isolated?: YesNo;

    /**
     * A space-separated list of id attributes corresponding to the `<unit>`
     * elements that contain the sub-flows for this code.
     */
    subFlows?: string;
    'slr:sizeRestriction'?: string | number;
    'slr:storageRestriction'?: string | number;
  };
  elements: never;
}

export interface CodeSpanEnd extends Element {
  name: 'ec';
  attributes?: CodeAttributes & {
    id?: string;

    /**
     * Can this spanning code enclose partial spanning codes (i.e. a start
     * code without its corresponding end code, or an end code without its
     * corresponding start code).
     *
     * Default: `yes`
     */
    canOverlap?: YesNo;

    /**
     * The id value of the `<data>` element that contains the original data
     * for this code
     */
    dataRef?: string;

    /**
     * Directionality of content: `ltr` (Left-To-Right), `rtl` (Right-To-Left),
     * or `auto` (determined heuristically, based on the first strong
     * directional character in scope).
     */
    dir?: Direction;

    /**
     * Alternative user-friendly display representation of the original data
     * of this code
     */
    disp?: string;

    /**
     * Plain text representation of the original data of the inline code that
     * can be used when generating a plain text representation of the content
     */
    equiv?: string;

    /** Is the corresponding CodeStart marker in a different `<unit>` */
    isolated?: YesNo;

    /** The id value of the corresponding `<sc>` element */
    startRef?: string;

    /**
     * A space-separated list of id attributes corresponding to the `<unit>`
     * elements that contain the sub-flows for this code.
     */
    subFlows?: string;
  };
  elements: never;
}

export interface AnnotationAttributes {
  id: string;

  /**
   * Whether or not the source text in this annotation is intended
   * for _Translation_.
   *
   * Default: inherit from parent
   */
  translate?: YesNo;

  /**
   * Type - indicates the type of an element.
   *
   * One of the following values: `generic`, `comment`, `term`, or a
   * user-defined value that is composed of a prefix and a sub-value
   * separated by a `:` character.
   *
   * The prefix is a string uniquely identifying a collection of
   * sub-values for a specific authority. The sub-value is any string
   * value defined by the authority.
   *
   * Default value: `generic`
   */
  type?: 'generic' | 'comment' | 'term' | string;

  /**
   * Any URI
   *
   * - `type="comment"` - A URI referring to the id value of a `<note>`
   *   element within the same enclosing `<unit>`
   * - `type="term"` - The URI of a resource providing information about
   *   the term
   */
  ref?: string;

  /**
   * A value for the this annotation
   *
   * - `type="comment"` -  the text of the comment
   * - `type="term"` - a definition of the term
   */
  value?: string;
  'fs:fs'?: FormatStyle;
  'fs:subFs'?: string;
  'slr:sizeRestriction'?: string | number;
  'slr:storageRestriction'?: string | number;
  [key: string]: string | number | undefined;
}

export interface Annotation extends Element {
  name: 'mrk';
  attributes: AnnotationAttributes;
  elements: (Text | InlineElement)[];
}

export interface AnnotationStart extends Element {
  name: 'sm';
  attributes: AnnotationAttributes;
  elements: never;
}

export interface AnnotationEnd extends Element {
  name: 'em';
  attributes: {
    /** The id value of the corresponding `<sm>` element */
    startRef: string;
  };
  elements: never;
}

/**
 * Translation Candidates Module
 */

export interface Matches extends Element {
  name: 'mtc:matches';
  elements: Match[];
}

export interface Match extends Element {
  name: 'mtc:match';
  attributes: {
    /**
     * The URI of an external resource providing information about the
     * translation candidate.
     */
    ref: string;
    id?: string;
    matchQuality?: number;
    matchSuitability?: number;
    origin?: string;
    reference?: YesNo;
    similarity?: number;
    subType?: string;
    type?: 'am' | 'mt' | 'icm' | 'idm' | 'tb' | 'tm' | 'other';
    [key: string]: string | number | undefined;
  };
  elements: (Metadata | OriginalData | Source | Target | Element)[];
}

/**
 * Glossary Module
 */

export interface Glossary extends Element {
  name: 'gls:glossary';
  attributes: never;
  elements: GlossEntry[];
}

export interface GlossEntry extends Element {
  name: 'gls:glossEntry';
  attributes?: {
    id?: string;
    ref?: string;
    [key: string]: string | number | undefined;
  };
  elements: (GlossTerm | GlossTranslation | GlossDefinition)[];
}

export interface GlossTerm extends Element {
  name: 'gls:term';
  attributes?: {
    source?: string;
    [key: string]: string | number | undefined;
  };
  elements: [Text];
}

export interface GlossTranslation extends Element {
  name: 'gls:translation';
  attributes?: {
    id?: string;
    ref?: string;
    source?: string;
    [key: string]: string | number | undefined;
  };
  elements: [Text];
}

export interface GlossDefinition extends Element {
  name: 'gls:definition';
  attributes?: {
    source?: string;
    [key: string]: string | number | undefined;
  };
  elements: [Text];
}

/**
 * Format Style Module
 */

export type FormatStyle =
  | 'a'
  | 'b'
  | 'bdo'
  | 'big'
  | 'blockquote'
  | 'body'
  | 'br'
  | 'button'
  | 'caption'
  | 'center'
  | 'cite'
  | 'code'
  | 'col'
  | 'colgroup'
  | 'dd'
  | 'del'
  | 'div'
  | 'dl'
  | 'dt'
  | 'em'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'head'
  | 'hr'
  | 'html'
  | 'i'
  | 'img'
  | 'label'
  | 'legend'
  | 'li'
  | 'ol'
  | 'p'
  | 'pre'
  | 'q'
  | 's'
  | 'samp'
  | 'select'
  | 'small'
  | 'span'
  | 'strike'
  | 'strong'
  | 'sub'
  | 'sup'
  | 'table'
  | 'tbody'
  | 'td'
  | 'tfoot'
  | 'th'
  | 'thead'
  | 'title'
  | 'tr'
  | 'tt'
  | 'u'
  | 'ul';

/**
 * Metadata Module
 */

export interface Metadata extends Element {
  name: 'mda:metadata';
  attributes?: { id?: string };
  elements: MetaGroup[];
}

export interface MetaGroup extends Element {
  name: 'mda:metaGroup';
  attributes?: {
    id?: string;
    appliesTo?: 'source' | 'target' | 'ignorable';
    category?: string;
  };
  elements: (MetaGroup | Meta)[];
}

export interface Meta extends Element {
  name: 'mda:meta';
  attributes: { type: string };
  elements: [Text];
}

/**
 * Resource Data Module
 */

export interface ResourceData extends Element {
  name: 'res:resourceData';
  attributes?: { id?: string };
  elements: (ResourceItemRef | ResourceItem)[];
}

export interface ResourceItemRef extends Element {
  name: 'res:resourceItemRef';
  attributes: {
    ref: string;
    id?: string;
    [key: string]: string | number | undefined;
  };
  elements: never;
}

export interface ResourceItem extends Element {
  name: 'res:resourceItem';
  attributes: {
    context?: YesNo;
    id?: string;
    mimeType?: string;
    [key: string]: string | number | undefined;
  };
  elements: (ResourceSource | ResourceTarget | ResourceReference)[];
}

export interface ResourceSource extends Element {
  name: 'res:source';
  attributes?: {
    href?: string;
    'xml:lang'?: string;
    [key: string]: string | number | undefined;
  };
  elements: never | Element[];
}

export interface ResourceTarget extends Element {
  name: 'res:target';
  attributes?: {
    href?: string;
    'xml:lang'?: string;
    [key: string]: string | number | undefined;
  };
  elements: never | Element[];
}

export interface ResourceReference extends Element {
  name: 'res:reference';
  attributes: {
    href: string;
    'xml:lang'?: string;
    [key: string]: string | number | undefined;
  };
  elements: never;
}

/**
 * Size and Length Restriction Module
 */

export interface SizeLengthProfiles extends Element {
  name: 'slr:profiles';
  attributes?: {
    generalProfile?: string;
    storageProfile?: string;
  };
  elements: (SizeLengthNormalization | Element)[];
}

export interface SizeLengthNormalization extends Element {
  name: 'slr:normalization';
  attributes: {
    general?: Normalization;
    storage?: Normalization;
  };
  elements: never;
}

export interface SizeLengthData extends Element {
  name: 'slr:data';
  attributes: {
    profile: string;
    [key: string]: string | number | undefined;
  };
  elements: Element[];
}

/**
 * Validation Module
 */

export interface Validation extends Element {
  name: 'val:validation';
  elements: ValidationRule[];
}

export interface ValidationRule extends Element {
  name: 'val:rule';
  attributes: {
    isPresent?: string;
    occurs?: number;
    isNotPresent?: string;
    startsWith?: string;
    endsWith?: string;
    existsInSource?: YesNo;
    caseSensitive?: YesNo;
    normalization?: Normalization;
    disabled?: YesNo;
    [key: string]: string | number | undefined;
  };
  elements: never;
}
