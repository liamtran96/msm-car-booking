# PostgreSQL - Data Types (Part 4)

## 8.13. XML Type #


**URL:** https://www.postgresql.org/docs/18/datatype-xml.html

**Contents:**
- 8.13. XML Type #
  - 8.13.1. Creating XML Values #
  - 8.13.2. Encoding Handling #
  - Caution
  - 8.13.3. Accessing XML Values #

The xml data type can be used to store XML data. Its advantage over storing XML data in a text field is that it checks the input values for well-formedness, and there are support functions to perform type-safe operations on it; see Section 9.15. Use of this data type requires the installation to have been built with configure --with-libxml.

The xml type can store well-formed “documents”, as defined by the XML standard, as well as “content” fragments, which are defined by reference to the more permissive “document node” of the XQuery and XPath data model. Roughly, this means that content fragments can have more than one top-level element or character node. The expression xmlvalue IS DOCUMENT can be used to evaluate whether a particular xml value is a full document or only a content fragment.

Limits and compatibility notes for the xml data type can be found in Section D.3.

To produce a value of type xml from character data, use the function xmlparse:

While this is the only way to convert character strings into XML values according to the SQL standard, the PostgreSQL-specific syntaxes:

The xml type does not validate input values against a document type declaration (DTD), even when the input value specifies a DTD. There is also currently no built-in support for validating against other XML schema languages such as XML Schema.

The inverse operation, producing a character string value from xml, uses the function xmlserialize:

type can be character, character varying, or text (or an alias for one of those). Again, according to the SQL standard, this is the only way to convert between type xml and character types, but PostgreSQL also allows you to simply cast the value.

The INDENT option causes the result to be pretty-printed, while NO INDENT (which is the default) just emits the original input string. Casting to a character type likewise produces the original string.

When a character string value is cast to or from type xml without going through XMLPARSE or XMLSERIALIZE, respectively, the choice of DOCUMENT versus CONTENT is determined by the “XML option” session configuration parameter, which can be set using the standard command:

or the more PostgreSQL-like syntax

The default is CONTENT, so all forms of XML data are allowed.

Care must be taken when dealing with multiple character encodings on the client, server, and in the XML data passed through them. When using the text mode to pass queries to the server and query results to the client (which is the normal mode), PostgreSQL converts all character data passed between the client and the server and vice versa to the character encoding of the respective end; see Section 23.3. This includes string representations of XML values, such as in the above examples. This would ordinarily mean that encoding declarations contained in XML data can become invalid as the character data is converted to other encodings while traveling between client and server, because the embedded encoding declaration is not changed. To cope with this behavior, encoding declarations contained in character strings presented for input to the xml type are ignored, and content is assumed to be in the current server encoding. Consequently, for correct processing, character strings of XML data must be sent from the client in the current client encoding. It is the responsibility of the client to either convert documents to the current client encoding before sending them to the server, or to adjust the client encoding appropriately. On output, values of type xml will not have an encoding declaration, and clients should assume all data is in the current client encoding.

When using binary mode to pass query parameters to the server and query results back to the client, no encoding conversion is performed, so the situation is different. In this case, an encoding declaration in the XML data will be observed, and if it is absent, the data will be assumed to be in UTF-8 (as required by the XML standard; note that PostgreSQL does not support UTF-16). On output, data will have an encoding declaration specifying the client encoding, unless the client encoding is UTF-8, in which case it will be omitted.

Needless to say, processing XML data with PostgreSQL will be less error-prone and more efficient if the XML data encoding, client encoding, and server encoding are the same. Since XML data is internally processed in UTF-8, computations will be most efficient if the server encoding is also UTF-8.

Some XML-related functions may not work at all on non-ASCII data when the server encoding is not UTF-8. This is known to be an issue for xmltable() and xpath() in particular.

The xml data type is unusual in that it does not provide any comparison operators. This is because there is no well-defined and universally useful comparison algorithm for XML data. One consequence of this is that you cannot retrieve rows by comparing an xml column against a search value. XML values should therefore typically be accompanied by a separate key field such as an ID. An alternative solution for comparing XML values is to convert them to character strings first, but note that character string comparison has little to do with a useful XML comparison method.

Since there are no comparison operators for the xml data type, it is not possible to create an index directly on a column of this type. If speedy searches in XML data are desired, possible workarounds include casting the expression to a character string type and indexing that, or indexing an XPath expression. Of course, the actual query would have to be adjusted to search by the indexed expression.

The text-search functionality in PostgreSQL can also be used to speed up full-document searches of XML data. The necessary preprocessing support is, however, not yet available in the PostgreSQL distribution.

**Examples:**

Example 1 (unknown):
```unknown
configure --with-libxml
```

Example 2 (unknown):
```unknown
xmlvalue IS DOCUMENT
```

Example 3 (xml):
```xml
XMLPARSE (DOCUMENT '<?xml version="1.0"?><book><title>Manual</title><chapter>...</chapter></book>')
XMLPARSE (CONTENT 'abc<foo>bar</foo><bar>foo</bar>')
```

Example 4 (typescript):
```typescript
xml '<foo>bar</foo>'
'<foo>bar</foo>'::xml
```

---


---

## 8.11. Text Search Types #


**URL:** https://www.postgresql.org/docs/18/datatype-textsearch.html

**Contents:**
- 8.11. Text Search Types #
  - 8.11.1. tsvector #
  - 8.11.2. tsquery #

PostgreSQL provides two data types that are designed to support full text search, which is the activity of searching through a collection of natural-language documents to locate those that best match a query. The tsvector type represents a document in a form optimized for text search; the tsquery type similarly represents a text query. Chapter 12 provides a detailed explanation of this facility, and Section 9.13 summarizes the related functions and operators.

A tsvector value is a sorted list of distinct lexemes, which are words that have been normalized to merge different variants of the same word (see Chapter 12 for details). Sorting and duplicate-elimination are done automatically during input, as shown in this example:

To represent lexemes containing whitespace or punctuation, surround them with quotes:

(We use dollar-quoted string literals in this example and the next one to avoid the confusion of having to double quote marks within the literals.) Embedded quotes and backslashes must be doubled:

Optionally, integer positions can be attached to lexemes:

A position normally indicates the source word's location in the document. Positional information can be used for proximity ranking. Position values can range from 1 to 16383; larger numbers are silently set to 16383. Duplicate positions for the same lexeme are discarded.

Lexemes that have positions can further be labeled with a weight, which can be A, B, C, or D. D is the default and hence is not shown on output:

Weights are typically used to reflect document structure, for example by marking title words differently from body words. Text search ranking functions can assign different priorities to the different weight markers.

It is important to understand that the tsvector type itself does not perform any word normalization; it assumes the words it is given are normalized appropriately for the application. For example,

For most English-text-searching applications the above words would be considered non-normalized, but tsvector doesn't care. Raw document text should usually be passed through to_tsvector to normalize the words appropriately for searching:

Again, see Chapter 12 for more detail.

A tsquery value stores lexemes that are to be searched for, and can combine them using the Boolean operators & (AND), | (OR), and ! (NOT), as well as the phrase search operator <-> (FOLLOWED BY). There is also a variant <N> of the FOLLOWED BY operator, where N is an integer constant that specifies the distance between the two lexemes being searched for. <-> is equivalent to <1>.

Parentheses can be used to enforce grouping of these operators. In the absence of parentheses, ! (NOT) binds most tightly, <-> (FOLLOWED BY) next most tightly, then & (AND), with | (OR) binding the least tightly.

Here are some examples:

Optionally, lexemes in a tsquery can be labeled with one or more weight letters, which restricts them to match only tsvector lexemes with one of those weights:

Also, lexemes in a tsquery can be labeled with * to specify prefix matching:

This query will match any word in a tsvector that begins with “super”.

Quoting rules for lexemes are the same as described previously for lexemes in tsvector; and, as with tsvector, any required normalization of words must be done before converting to the tsquery type. The to_tsquery function is convenient for performing such normalization:

Note that to_tsquery will process prefixes in the same way as other words, which means this comparison returns true:

because postgres gets stemmed to postgr:

which will match the stemmed form of postgraduate.

**Examples:**

Example 1 (sql):
```sql
SELECT 'a fat cat sat on a mat and ate a fat rat'::tsvector;
                      tsvector
----------------------------------------------------
 'a' 'and' 'ate' 'cat' 'fat' 'mat' 'on' 'rat' 'sat'
```

Example 2 (sql):
```sql
SELECT $$the lexeme '    ' contains spaces$$::tsvector;
                 tsvector
-------------------------------------------
 '    ' 'contains' 'lexeme' 'spaces' 'the'
```

Example 3 (sql):
```sql
SELECT $$the lexeme 'Joe''s' contains a quote$$::tsvector;
                    tsvector
------------------------------------------------
 'Joe''s' 'a' 'contains' 'lexeme' 'quote' 'the'
```

Example 4 (sql):
```sql
SELECT 'a:1 fat:2 cat:3 sat:4 on:5 a:6 mat:7 and:8 ate:9 a:10 fat:11 rat:12'::tsvector;
                                  tsvector
-------------------------------------------------------------------​------------
 'a':1,6,10 'and':8 'ate':9 'cat':3 'fat':2,11 'mat':7 'on':5 'rat':12 'sat':4
```

---


---

## 8.8. Geometric Types #


**URL:** https://www.postgresql.org/docs/18/datatype-geometric.html

**Contents:**
- 8.8. Geometric Types #
  - 8.8.1. Points #
  - 8.8.2. Lines #
  - 8.8.3. Line Segments #
  - 8.8.4. Boxes #
  - 8.8.5. Paths #
  - 8.8.6. Polygons #
  - 8.8.7. Circles #

Geometric data types represent two-dimensional spatial objects. Table 8.20 shows the geometric types available in PostgreSQL.

Table 8.20. Geometric Types

In all these types, the individual coordinates are stored as double precision (float8) numbers.

A rich set of functions and operators is available to perform various geometric operations such as scaling, translation, rotation, and determining intersections. They are explained in Section 9.11.

Points are the fundamental two-dimensional building block for geometric types. Values of type point are specified using either of the following syntaxes:

where x and y are the respective coordinates, as floating-point numbers.

Points are output using the first syntax.

Lines are represented by the linear equation Ax + By + C = 0, where A and B are not both zero. Values of type line are input and output in the following form:

Alternatively, any of the following forms can be used for input:

where (x1,y1) and (x2,y2) are two different points on the line.

Line segments are represented by pairs of points that are the endpoints of the segment. Values of type lseg are specified using any of the following syntaxes:

where (x1,y1) and (x2,y2) are the end points of the line segment.

Line segments are output using the first syntax.

Boxes are represented by pairs of points that are opposite corners of the box. Values of type box are specified using any of the following syntaxes:

where (x1,y1) and (x2,y2) are any two opposite corners of the box.

Boxes are output using the second syntax.

Any two opposite corners can be supplied on input, but the values will be reordered as needed to store the upper right and lower left corners, in that order.

Paths are represented by lists of connected points. Paths can be open, where the first and last points in the list are considered not connected, or closed, where the first and last points are considered connected.

Values of type path are specified using any of the following syntaxes:

where the points are the end points of the line segments comprising the path. Square brackets ([]) indicate an open path, while parentheses (()) indicate a closed path. When the outermost parentheses are omitted, as in the third through fifth syntaxes, a closed path is assumed.

Paths are output using the first or second syntax, as appropriate.

Polygons are represented by lists of points (the vertices of the polygon). Polygons are very similar to closed paths; the essential semantic difference is that a polygon is considered to include the area within it, while a path is not.

An important implementation difference between polygons and paths is that the stored representation of a polygon includes its smallest bounding box. This speeds up certain search operations, although computing the bounding box adds overhead while constructing new polygons.

Values of type polygon are specified using any of the following syntaxes:

where the points are the end points of the line segments comprising the boundary of the polygon.

Polygons are output using the first syntax.

Circles are represented by a center point and radius. Values of type circle are specified using any of the following syntaxes:

where (x,y) is the center point and r is the radius of the circle.

Circles are output using the first syntax.

**Examples:**

Example 1 (unknown):
```unknown
double precision
```

---


---

## 8.21. Pseudo-Types #


**URL:** https://www.postgresql.org/docs/18/datatype-pseudo.html

**Contents:**
- 8.21. Pseudo-Types #

The PostgreSQL type system contains a number of special-purpose entries that are collectively called pseudo-types. A pseudo-type cannot be used as a column data type, but it can be used to declare a function's argument or result type. Each of the available pseudo-types is useful in situations where a function's behavior does not correspond to simply taking or returning a value of a specific SQL data type. Table 8.27 lists the existing pseudo-types.

Table 8.27. Pseudo-Types

Functions coded in C (whether built-in or dynamically loaded) can be declared to accept or return any of these pseudo-types. It is up to the function author to ensure that the function will behave safely when a pseudo-type is used as an argument type.

Functions coded in procedural languages can use pseudo-types only as allowed by their implementation languages. At present most procedural languages forbid use of a pseudo-type as an argument type, and allow only void and record as a result type (plus trigger or event_trigger when the function is used as a trigger or event trigger). Some also support polymorphic functions using the polymorphic pseudo-types, which are shown above and discussed in detail in Section 36.2.5.

The internal pseudo-type is used to declare functions that are meant only to be called internally by the database system, and not by direct invocation in an SQL query. If a function has at least one internal-type argument then it cannot be called from SQL. To preserve the type safety of this restriction it is important to follow this coding rule: do not create any function that is declared to return internal unless it has at least one internal argument.

**Examples:**

Example 1 (unknown):
```unknown
anynonarray
```

Example 2 (unknown):
```unknown
anymultirange
```

Example 3 (unknown):
```unknown
anycompatible
```

Example 4 (unknown):
```unknown
anycompatiblearray
```

---


---

