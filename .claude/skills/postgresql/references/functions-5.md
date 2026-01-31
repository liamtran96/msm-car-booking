# PostgreSQL - Functions (Part 5)

## 9.4. String Functions and Operators # (continued)

string_to_array('xx~~yy~~zz', '~~', 'yy') → {xx,NULL,zz}

string_to_table ( string text, delimiter text [, null_string text ] ) → setof text

Splits the string at occurrences of delimiter and returns the resulting fields as a set of text rows. If delimiter is NULL, each character in the string will become a separate row of the result. If delimiter is an empty string, then the string is treated as a single field. If null_string is supplied and is not NULL, fields matching that string are replaced by NULL.

string_to_table('xx~^~yy~^~zz', '~^~', 'yy') →

strpos ( string text, substring text ) → integer

Returns first starting index of the specified substring within string, or zero if it's not present. (Same as position(substring in string), but note the reversed argument order.)

strpos('high', 'ig') → 2

substr ( string text, start integer [, count integer ] ) → text

Extracts the substring of string starting at the start'th character, and extending for count characters if that is specified. (Same as substring(string from start for count).)

substr('alphabet', 3) → phabet

substr('alphabet', 3, 2) → ph

to_ascii ( string text ) → text

to_ascii ( string text, encoding name ) → text

to_ascii ( string text, encoding integer ) → text

Converts string to ASCII from another encoding, which may be identified by name or number. If encoding is omitted the database encoding is assumed (which in practice is the only useful case). The conversion consists primarily of dropping accents. Conversion is only supported from LATIN1, LATIN2, LATIN9, and WIN1250 encodings. (See the unaccent module for another, more flexible solution.)

to_ascii('Karél') → Karel

to_bin ( integer ) → text

to_bin ( bigint ) → text

Converts the number to its equivalent two's complement binary representation.

to_bin(2147483647) → 1111111111111111111111111111111

to_bin(-1234) → 11111111111111111111101100101110

to_hex ( integer ) → text

to_hex ( bigint ) → text

Converts the number to its equivalent two's complement hexadecimal representation.

to_hex(2147483647) → 7fffffff

to_hex(-1234) → fffffb2e

to_oct ( integer ) → text

to_oct ( bigint ) → text

Converts the number to its equivalent two's complement octal representation.

to_oct(2147483647) → 17777777777

to_oct(-1234) → 37777775456

translate ( string text, from text, to text ) → text

Replaces each character in string that matches a character in the from set with the corresponding character in the to set. If from is longer than to, occurrences of the extra characters in from are deleted.

translate('12345', '143', 'ax') → a2x5

unistr ( text ) → text

Evaluate escaped Unicode characters in the argument. Unicode characters can be specified as \XXXX (4 hexadecimal digits), \+XXXXXX (6 hexadecimal digits), \uXXXX (4 hexadecimal digits), or \UXXXXXXXX (8 hexadecimal digits). To specify a backslash, write two backslashes. All other characters are taken literally.

If the server encoding is not UTF-8, the Unicode code point identified by one of these escape sequences is converted to the actual server encoding; an error is reported if that's not possible.

This function provides a (non-standard) alternative to string constants with Unicode escapes (see Section 4.1.2.3).

unistr('d\0061t\+000061') → data

unistr('d\u0061t\U00000061') → data

The concat, concat_ws and format functions are variadic, so it is possible to pass the values to be concatenated or formatted as an array marked with the VARIADIC keyword (see Section 36.5.6). The array's elements are treated as if they were separate ordinary arguments to the function. If the variadic array argument is NULL, concat and concat_ws return NULL, but format treats a NULL as a zero-element array.

See also the aggregate function string_agg in Section 9.21, and the functions for converting between strings and the bytea type in Table 9.13.

The function format produces output formatted according to a format string, in a style similar to the C function sprintf.

formatstr is a format string that specifies how the result should be formatted. Text in the format string is copied directly to the result, except where format specifiers are used. Format specifiers act as placeholders in the string, defining how subsequent function arguments should be formatted and inserted into the result. Each formatarg argument is converted to text according to the usual output rules for its data type, and then formatted and inserted into the result string according to the format specifier(s).

Format specifiers are introduced by a % character and have the form

where the component fields are:

A string of the form n$ where n is the index of the argument to print. Index 1 means the first argument after formatstr. If the position is omitted, the default is to use the next argument in sequence.

Additional options controlling how the format specifier's output is formatted. Currently the only supported flag is a minus sign (-) which will cause the format specifier's output to be left-justified. This has no effect unless the width field is also specified.

Specifies the minimum number of characters to use to display the format specifier's output. The output is padded on the left or right (depending on the - flag) with spaces as needed to fill the width. A too-small width does not cause truncation of the output, but is simply ignored. The width may be specified using any of the following: a positive integer; an asterisk (*) to use the next function argument as the width; or a string of the form *n$ to use the nth function argument as the width.

If the width comes from a function argument, that argument is consumed before the argument that is used for the format specifier's value. If the width argument is negative, the result is left aligned (as if the - flag had been specified) within a field of length abs(width).

The type of format conversion to use to produce the format specifier's output. The following types are supported:

s formats the argument value as a simple string. A null value is treated as an empty string.

I treats the argument value as an SQL identifier, double-quoting it if necessary. It is an error for the value to be null (equivalent to quote_ident).

L quotes the argument value as an SQL literal. A null value is displayed as the string NULL, without quotes (equivalent to quote_nullable).

In addition to the format specifiers described above, the special sequence %% may be used to output a literal % character.

Here are some examples of the basic format conversions:

Here are examples using width fields and the - flag:

These examples show use of position fields:

Unlike the standard C function sprintf, PostgreSQL's format function allows format specifiers with and without position fields to be mixed in the same format string. A format specifier without a position field always uses the next argument after the last argument consumed. In addition, the format function does not require all function arguments to be used in the format string. For example:

The %I and %L format specifiers are particularly useful for safely constructing dynamic SQL statements. See Example 41.1.

**Examples:**

Example 1 (unknown):
```unknown
character varying
```

Example 2 (unknown):
```unknown
character varying
```

Example 3 (unknown):
```unknown
'Post' || 'greSQL'
```

Example 4 (unknown):
```unknown
anynonarray
```

---


---

