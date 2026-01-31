# PostgreSQL - Functions (Part 4)

## 9.4. String Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-string.html

**Contents:**
- 9.4. String Functions and Operators #
  - Note
  - 9.4.1. format #

This section describes functions and operators for examining and manipulating string values. Strings in this context include values of the types character, character varying, and text. Except where noted, these functions and operators are declared to accept and return type text. They will interchangeably accept character varying arguments. Values of type character will be converted to text before the function or operator is applied, resulting in stripping any trailing spaces in the character value.

SQL defines some string functions that use key words, rather than commas, to separate arguments. Details are in Table 9.9. PostgreSQL also provides versions of these functions that use the regular function invocation syntax (see Table 9.10).

The string concatenation operator (||) will accept non-string input, so long as at least one input is of string type, as shown in Table 9.9. For other cases, inserting an explicit coercion to text can be used to have non-string input accepted.

Table 9.9. SQL String Functions and Operators

Concatenates the two strings.

'Post' || 'greSQL' → PostgreSQL

text || anynonarray → text

anynonarray || text → text

Converts the non-string input to text, then concatenates the two strings. (The non-string input cannot be of an array type, because that would create ambiguity with the array || operators. If you want to concatenate an array's text equivalent, cast it to text explicitly.)

'Value: ' || 42 → Value: 42

btrim ( string text [, characters text ] ) → text

Removes the longest string containing only characters in characters (a space by default) from the start and end of string.

btrim('xyxtrimyyx', 'xyz') → trim

text IS [NOT] [form] NORMALIZED → boolean

Checks whether the string is in the specified Unicode normalization form. The optional form key word specifies the form: NFC (the default), NFD, NFKC, or NFKD. This expression can only be used when the server encoding is UTF8. Note that checking for normalization using this expression is often faster than normalizing possibly already normalized strings.

U&'\0061\0308bc' IS NFD NORMALIZED → t

bit_length ( text ) → integer

Returns number of bits in the string (8 times the octet_length).

bit_length('jose') → 32

char_length ( text ) → integer

character_length ( text ) → integer

Returns number of characters in the string.

char_length('josé') → 4

lower ( text ) → text

Converts the string to all lower case, according to the rules of the database's locale.

lpad ( string text, length integer [, fill text ] ) → text

Extends the string to length length by prepending the characters fill (a space by default). If the string is already longer than length then it is truncated (on the right).

lpad('hi', 5, 'xy') → xyxhi

ltrim ( string text [, characters text ] ) → text

Removes the longest string containing only characters in characters (a space by default) from the start of string.

ltrim('zzzytest', 'xyz') → test

normalize ( text [, form ] ) → text

Converts the string to the specified Unicode normalization form. The optional form key word specifies the form: NFC (the default), NFD, NFKC, or NFKD. This function can only be used when the server encoding is UTF8.

normalize(U&'\0061\0308bc', NFC) → U&'\00E4bc'

octet_length ( text ) → integer

Returns number of bytes in the string.

octet_length('josé') → 5 (if server encoding is UTF8)

octet_length ( character ) → integer

Returns number of bytes in the string. Since this version of the function accepts type character directly, it will not strip trailing spaces.

octet_length('abc '::character(4)) → 4

overlay ( string text PLACING newsubstring text FROM start integer [ FOR count integer ] ) → text

Replaces the substring of string that starts at the start'th character and extends for count characters with newsubstring. If count is omitted, it defaults to the length of newsubstring.

overlay('Txxxxas' placing 'hom' from 2 for 4) → Thomas

position ( substring text IN string text ) → integer

Returns first starting index of the specified substring within string, or zero if it's not present.

position('om' in 'Thomas') → 3

rpad ( string text, length integer [, fill text ] ) → text

Extends the string to length length by appending the characters fill (a space by default). If the string is already longer than length then it is truncated.

rpad('hi', 5, 'xy') → hixyx

rtrim ( string text [, characters text ] ) → text

Removes the longest string containing only characters in characters (a space by default) from the end of string.

rtrim('testxxzx', 'xyz') → test

substring ( string text [ FROM start integer ] [ FOR count integer ] ) → text

Extracts the substring of string starting at the start'th character if that is specified, and stopping after count characters if that is specified. Provide at least one of start and count.

substring('Thomas' from 2 for 3) → hom

substring('Thomas' from 3) → omas

substring('Thomas' for 2) → Th

substring ( string text FROM pattern text ) → text

Extracts the first substring matching POSIX regular expression; see Section 9.7.3.

substring('Thomas' from '...$') → mas

substring ( string text SIMILAR pattern text ESCAPE escape text ) → text

substring ( string text FROM pattern text FOR escape text ) → text

Extracts the first substring matching SQL regular expression; see Section 9.7.2. The first form has been specified since SQL:2003; the second form was only in SQL:1999 and should be considered obsolete.

substring('Thomas' similar '%#"o_a#"_' escape '#') → oma

trim ( [ LEADING | TRAILING | BOTH ] [ characters text ] FROM string text ) → text

Removes the longest string containing only characters in characters (a space by default) from the start, end, or both ends (BOTH is the default) of string.

trim(both 'xyz' from 'yxTomxx') → Tom

trim ( [ LEADING | TRAILING | BOTH ] [ FROM ] string text [, characters text ] ) → text

This is a non-standard syntax for trim().

trim(both from 'yxTomxx', 'xyz') → Tom

unicode_assigned ( text ) → boolean

Returns true if all characters in the string are assigned Unicode codepoints; false otherwise. This function can only be used when the server encoding is UTF8.

upper ( text ) → text

Converts the string to all upper case, according to the rules of the database's locale.

Additional string manipulation functions and operators are available and are listed in Table 9.10. (Some of these are used internally to implement the SQL-standard string functions listed in Table 9.9.) There are also pattern-matching operators, which are described in Section 9.7, and operators for full-text search, which are described in Chapter 12.

Table 9.10. Other String Functions and Operators

text ^@ text → boolean

Returns true if the first string starts with the second string (equivalent to the starts_with() function).

'alphabet' ^@ 'alph' → t

ascii ( text ) → integer

Returns the numeric code of the first character of the argument. In UTF8 encoding, returns the Unicode code point of the character. In other multibyte encodings, the argument must be an ASCII character.

chr ( integer ) → text

Returns the character with the given code. In UTF8 encoding the argument is treated as a Unicode code point. In other multibyte encodings the argument must designate an ASCII character. chr(0) is disallowed because text data types cannot store that character.

concat ( val1 "any" [, val2 "any" [, ...] ] ) → text

Concatenates the text representations of all the arguments. NULL arguments are ignored.

concat('abcde', 2, NULL, 22) → abcde222

concat_ws ( sep text, val1 "any" [, val2 "any" [, ...] ] ) → text

Concatenates all but the first argument, with separators. The first argument is used as the separator string, and should not be NULL. Other NULL arguments are ignored.

concat_ws(',', 'abcde', 2, NULL, 22) → abcde,2,22

format ( formatstr text [, formatarg "any" [, ...] ] ) → text

Formats arguments according to a format string; see Section 9.4.1. This function is similar to the C function sprintf.

format('Hello %s, %1$s', 'World') → Hello World, World

initcap ( text ) → text

Converts the first letter of each word to upper case and the rest to lower case. Words are sequences of alphanumeric characters separated by non-alphanumeric characters.

initcap('hi THOMAS') → Hi Thomas

casefold ( text ) → text

Performs case folding of the input string according to the collation. Case folding is similar to case conversion, but the purpose of case folding is to facilitate case-insensitive matching of strings, whereas the purpose of case conversion is to convert to a particular cased form. This function can only be used when the server encoding is UTF8.

Ordinarily, case folding simply converts to lowercase, but there may be exceptions depending on the collation. For instance, some characters have more than two lowercase variants, or fold to uppercase.

Case folding may change the length of the string. For instance, in the PG_UNICODE_FAST collation, ß (U+00DF) folds to ss.

casefold can be used for Unicode Default Caseless Matching. It does not always preserve the normalized form of the input string (see normalize).

The libc provider doesn't support case folding, so casefold is identical to lower.

left ( string text, n integer ) → text

Returns first n characters in the string, or when n is negative, returns all but last |n| characters.

left('abcde', 2) → ab

length ( text ) → integer

Returns the number of characters in the string.

Computes the MD5 hash of the argument, with the result written in hexadecimal.

md5('abc') → 900150983cd24fb0​d6963f7d28e17f72

parse_ident ( qualified_identifier text [, strict_mode boolean DEFAULT true ] ) → text[]

Splits qualified_identifier into an array of identifiers, removing any quoting of individual identifiers. By default, extra characters after the last identifier are considered an error; but if the second parameter is false, then such extra characters are ignored. (This behavior is useful for parsing names for objects like functions.) Note that this function does not truncate over-length identifiers. If you want truncation you can cast the result to name[].

parse_ident('"SomeSchema".someTable') → {SomeSchema,sometable}

pg_client_encoding ( ) → name

Returns current client encoding name.

pg_client_encoding() → UTF8

quote_ident ( text ) → text

Returns the given string suitably quoted to be used as an identifier in an SQL statement string. Quotes are added only if necessary (i.e., if the string contains non-identifier characters or would be case-folded). Embedded quotes are properly doubled. See also Example 41.1.

quote_ident('Foo bar') → "Foo bar"

quote_literal ( text ) → text

Returns the given string suitably quoted to be used as a string literal in an SQL statement string. Embedded single-quotes and backslashes are properly doubled. Note that quote_literal returns null on null input; if the argument might be null, quote_nullable is often more suitable. See also Example 41.1.

quote_literal(E'O\'Reilly') → 'O''Reilly'

quote_literal ( anyelement ) → text

Converts the given value to text and then quotes it as a literal. Embedded single-quotes and backslashes are properly doubled.

quote_literal(42.5) → '42.5'

quote_nullable ( text ) → text

Returns the given string suitably quoted to be used as a string literal in an SQL statement string; or, if the argument is null, returns NULL. Embedded single-quotes and backslashes are properly doubled. See also Example 41.1.

quote_nullable(NULL) → NULL

quote_nullable ( anyelement ) → text

Converts the given value to text and then quotes it as a literal; or, if the argument is null, returns NULL. Embedded single-quotes and backslashes are properly doubled.

quote_nullable(42.5) → '42.5'

regexp_count ( string text, pattern text [, start integer [, flags text ] ] ) → integer

Returns the number of times the POSIX regular expression pattern matches in the string; see Section 9.7.3.

regexp_count('123456789012', '\d\d\d', 2) → 3

regexp_instr ( string text, pattern text [, start integer [, N integer [, endoption integer [, flags text [, subexpr integer ] ] ] ] ] ) → integer

Returns the position within string where the N'th match of the POSIX regular expression pattern occurs, or zero if there is no such match; see Section 9.7.3.

regexp_instr('ABCDEF', 'c(.)(..)', 1, 1, 0, 'i') → 3

regexp_instr('ABCDEF', 'c(.)(..)', 1, 1, 0, 'i', 2) → 5

regexp_like ( string text, pattern text [, flags text ] ) → boolean

Checks whether a match of the POSIX regular expression pattern occurs within string; see Section 9.7.3.

regexp_like('Hello World', 'world$', 'i') → t

regexp_match ( string text, pattern text [, flags text ] ) → text[]

Returns substrings within the first match of the POSIX regular expression pattern to the string; see Section 9.7.3.

regexp_match('foobarbequebaz', '(bar)(beque)') → {bar,beque}

regexp_matches ( string text, pattern text [, flags text ] ) → setof text[]

Returns substrings within the first match of the POSIX regular expression pattern to the string, or substrings within all such matches if the g flag is used; see Section 9.7.3.

regexp_matches('foobarbequebaz', 'ba.', 'g') →

regexp_replace ( string text, pattern text, replacement text [, flags text ] ) → text

Replaces the substring that is the first match to the POSIX regular expression pattern, or all such matches if the g flag is used; see Section 9.7.3.

regexp_replace('Thomas', '.[mN]a.', 'M') → ThM

regexp_replace ( string text, pattern text, replacement text, start integer [, N integer [, flags text ] ] ) → text

Replaces the substring that is the N'th match to the POSIX regular expression pattern, or all such matches if N is zero, with the search beginning at the start'th character of string. If N is omitted, it defaults to 1. See Section 9.7.3.

regexp_replace('Thomas', '.', 'X', 3, 2) → ThoXas

regexp_replace(string=>'hello world', pattern=>'l', replacement=>'XX', start=>1, "N"=>2) → helXXo world

regexp_split_to_array ( string text, pattern text [, flags text ] ) → text[]

Splits string using a POSIX regular expression as the delimiter, producing an array of results; see Section 9.7.3.

regexp_split_to_array('hello world', '\s+') → {hello,world}

regexp_split_to_table ( string text, pattern text [, flags text ] ) → setof text

Splits string using a POSIX regular expression as the delimiter, producing a set of results; see Section 9.7.3.

regexp_split_to_table('hello world', '\s+') →

regexp_substr ( string text, pattern text [, start integer [, N integer [, flags text [, subexpr integer ] ] ] ] ) → text

Returns the substring within string that matches the N'th occurrence of the POSIX regular expression pattern, or NULL if there is no such match; see Section 9.7.3.

regexp_substr('ABCDEF', 'c(.)(..)', 1, 1, 'i') → CDEF

regexp_substr('ABCDEF', 'c(.)(..)', 1, 1, 'i', 2) → EF

repeat ( string text, number integer ) → text

Repeats string the specified number of times.

repeat('Pg', 4) → PgPgPgPg

replace ( string text, from text, to text ) → text

Replaces all occurrences in string of substring from with substring to.

replace('abcdefabcdef', 'cd', 'XX') → abXXefabXXef

reverse ( text ) → text

Reverses the order of the characters in the string.

reverse('abcde') → edcba

right ( string text, n integer ) → text

Returns last n characters in the string, or when n is negative, returns all but first |n| characters.

right('abcde', 2) → de

split_part ( string text, delimiter text, n integer ) → text

Splits string at occurrences of delimiter and returns the n'th field (counting from one), or when n is negative, returns the |n|'th-from-last field.

split_part('abc~@~def~@~ghi', '~@~', 2) → def

split_part('abc,def,ghi,jkl', ',', -2) → ghi

starts_with ( string text, prefix text ) → boolean

Returns true if string starts with prefix.

starts_with('alphabet', 'alph') → t

string_to_array ( string text, delimiter text [, null_string text ] ) → text[]

Splits the string at occurrences of delimiter and forms the resulting fields into a text array. If delimiter is NULL, each character in the string will become a separate element in the array. If delimiter is an empty string, then the string is treated as a single field. If null_string is supplied and is not NULL, fields matching that string are replaced by NULL. See also array_to_string.

*(continued...)*
---

