# PostgreSQL - Functions (Part 27)

## 9.8. Data Type Formatting Functions #


**URL:** https://www.postgresql.org/docs/18/functions-formatting.html

**Contents:**
- 9.8. Data Type Formatting Functions #
  - Tip
  - Tip
  - Caution

The PostgreSQL formatting functions provide a powerful set of tools for converting various data types (date/time, integer, floating point, numeric) to formatted strings and for converting from formatted strings to specific data types. Table 9.26 lists them. These functions all follow a common calling convention: the first argument is the value to be formatted and the second argument is a template that defines the output or input format.

Table 9.26. Formatting Functions

to_char ( timestamp, text ) → text

to_char ( timestamp with time zone, text ) → text

Converts time stamp to string according to the given format.

to_char(timestamp '2002-04-20 17:31:12.66', 'HH12:MI:SS') → 05:31:12

to_char ( interval, text ) → text

Converts interval to string according to the given format.

to_char(interval '15h 2m 12s', 'HH24:MI:SS') → 15:02:12

to_char ( numeric_type, text ) → text

Converts number to string according to the given format; available for integer, bigint, numeric, real, double precision.

to_char(125, '999') → 125

to_char(125.8::real, '999D9') → 125.8

to_char(-125.8, '999D99S') → 125.80-

to_date ( text, text ) → date

Converts string to date according to the given format.

to_date('05 Dec 2000', 'DD Mon YYYY') → 2000-12-05

to_number ( text, text ) → numeric

Converts string to numeric according to the given format.

to_number('12,454.8-', '99G999D9S') → -12454.8

to_timestamp ( text, text ) → timestamp with time zone

Converts string to time stamp according to the given format. (See also to_timestamp(double precision) in Table 9.33.)

to_timestamp('05 Dec 2000', 'DD Mon YYYY') → 2000-12-05 00:00:00-05

to_timestamp and to_date exist to handle input formats that cannot be converted by simple casting. For most standard date/time formats, simply casting the source string to the required data type works, and is much easier. Similarly, to_number is unnecessary for standard numeric representations.

In a to_char output template string, there are certain patterns that are recognized and replaced with appropriately-formatted data based on the given value. Any text that is not a template pattern is simply copied verbatim. Similarly, in an input template string (for the other functions), template patterns identify the values to be supplied by the input data string. If there are characters in the template string that are not template patterns, the corresponding characters in the input data string are simply skipped over (whether or not they are equal to the template string characters).

Table 9.27 shows the template patterns available for formatting date and time values.

Table 9.27. Template Patterns for Date/Time Formatting

Modifiers can be applied to any template pattern to alter its behavior. For example, FMMonth is the Month pattern with the FM modifier. Table 9.28 shows the modifier patterns for date/time formatting.

Table 9.28. Template Pattern Modifiers for Date/Time Formatting

Usage notes for date/time formatting:

FM suppresses leading zeroes and trailing blanks that would otherwise be added to make the output of a pattern be fixed-width. In PostgreSQL, FM modifies only the next specification, while in Oracle FM affects all subsequent specifications, and repeated FM modifiers toggle fill mode on and off.

TM suppresses trailing blanks whether or not FM is specified.

to_timestamp and to_date ignore letter case in the input; so for example MON, Mon, and mon all accept the same strings. When using the TM modifier, case-folding is done according to the rules of the function's input collation (see Section 23.2).

to_timestamp and to_date skip multiple blank spaces at the beginning of the input string and around date and time values unless the FX option is used. For example, to_timestamp(' 2000 JUN', 'YYYY MON') and to_timestamp('2000 - JUN', 'YYYY-MON') work, but to_timestamp('2000 JUN', 'FXYYYY MON') returns an error because to_timestamp expects only a single space. FX must be specified as the first item in the template.

A separator (a space or non-letter/non-digit character) in the template string of to_timestamp and to_date matches any single separator in the input string or is skipped, unless the FX option is used. For example, to_timestamp('2000JUN', 'YYYY///MON') and to_timestamp('2000/JUN', 'YYYY MON') work, but to_timestamp('2000//JUN', 'YYYY/MON') returns an error because the number of separators in the input string exceeds the number of separators in the template.

If FX is specified, a separator in the template string matches exactly one character in the input string. But note that the input string character is not required to be the same as the separator from the template string. For example, to_timestamp('2000/JUN', 'FXYYYY MON') works, but to_timestamp('2000/JUN', 'FXYYYY MON') returns an error because the second space in the template string consumes the letter J from the input string.

A TZH template pattern can match a signed number. Without the FX option, minus signs may be ambiguous, and could be interpreted as a separator. This ambiguity is resolved as follows: If the number of separators before TZH in the template string is less than the number of separators before the minus sign in the input string, the minus sign is interpreted as part of TZH. Otherwise, the minus sign is considered to be a separator between values. For example, to_timestamp('2000 -10', 'YYYY TZH') matches -10 to TZH, but to_timestamp('2000 -10', 'YYYY TZH') matches 10 to TZH.

Ordinary text is allowed in to_char templates and will be output literally. You can put a substring in double quotes to force it to be interpreted as literal text even if it contains template patterns. For example, in '"Hello Year "YYYY', the YYYY will be replaced by the year data, but the single Y in Year will not be. In to_date, to_number, and to_timestamp, literal text and double-quoted strings result in skipping the number of characters contained in the string; for example "XX" skips two input characters (whether or not they are XX).

Prior to PostgreSQL 12, it was possible to skip arbitrary text in the input string using non-letter or non-digit characters. For example, to_timestamp('2000y6m1d', 'yyyy-MM-DD') used to work. Now you can only use letter characters for this purpose. For example, to_timestamp('2000y6m1d', 'yyyytMMtDDt') and to_timestamp('2000y6m1d', 'yyyy"y"MM"m"DD"d"') skip y, m, and d.

If you want to have a double quote in the output you must precede it with a backslash, for example '\"YYYY Month\"'. Backslashes are not otherwise special outside of double-quoted strings. Within a double-quoted string, a backslash causes the next character to be taken literally, whatever it is (but this has no special effect unless the next character is a double quote or another backslash).

In to_timestamp and to_date, if the year format specification is less than four digits, e.g., YYY, and the supplied year is less than four digits, the year will be adjusted to be nearest to the year 2020, e.g., 95 becomes 1995.

In to_timestamp and to_date, negative years are treated as signifying BC. If you write both a negative year and an explicit BC field, you get AD again. An input of year zero is treated as 1 BC.

In to_timestamp and to_date, the YYYY conversion has a restriction when processing years with more than 4 digits. You must use some non-digit character or template after YYYY, otherwise the year is always interpreted as 4 digits. For example (with the year 20000): to_date('200001130', 'YYYYMMDD') will be interpreted as a 4-digit year; instead use a non-digit separator after the year, like to_date('20000-1130', 'YYYY-MMDD') or to_date('20000Nov30', 'YYYYMonDD').

In to_timestamp and to_date, the CC (century) field is accepted but ignored if there is a YYY, YYYY or Y,YYY field. If CC is used with YY or Y then the result is computed as that year in the specified century. If the century is specified but the year is not, the first year of the century is assumed.

In to_timestamp and to_date, weekday names or numbers (DAY, D, and related field types) are accepted but are ignored for purposes of computing the result. The same is true for quarter (Q) fields.

In to_timestamp and to_date, an ISO 8601 week-numbering date (as distinct from a Gregorian date) can be specified in one of two ways:

Year, week number, and weekday: for example to_date('2006-42-4', 'IYYY-IW-ID') returns the date 2006-10-19. If you omit the weekday it is assumed to be 1 (Monday).

Year and day of year: for example to_date('2006-291', 'IYYY-IDDD') also returns 2006-10-19.

Attempting to enter a date using a mixture of ISO 8601 week-numbering fields and Gregorian date fields is nonsensical, and will cause an error. In the context of an ISO 8601 week-numbering year, the concept of a “month” or “day of month” has no meaning. In the context of a Gregorian year, the ISO week has no meaning.

While to_date will reject a mixture of Gregorian and ISO week-numbering date fields, to_char will not, since output format specifications like YYYY-MM-DD (IYYY-IDDD) can be useful. But avoid writing something like IYYY-MM-DD; that would yield surprising results near the start of the year. (See Section 9.9.1 for more information.)

In to_timestamp, millisecond (MS) or microsecond (US) fields are used as the seconds digits after the decimal point. For example to_timestamp('12.3', 'SS.MS') is not 3 milliseconds, but 300, because the conversion treats it as 12 + 0.3 seconds. So, for the format SS.MS, the input values 12.3, 12.30, and 12.300 specify the same number of milliseconds. To get three milliseconds, one must write 12.003, which the conversion treats as 12 + 0.003 = 12.003 seconds.

Here is a more complex example: to_timestamp('15:12:02.020.001230', 'HH24:MI:SS.MS.US') is 15 hours, 12 minutes, and 2 seconds + 20 milliseconds + 1230 microseconds = 2.021230 seconds.

to_char(..., 'ID')'s day of the week numbering matches the extract(isodow from ...) function, but to_char(..., 'D')'s does not match extract(dow from ...)'s day numbering.

to_char(interval) formats HH and HH12 as shown on a 12-hour clock, for example zero hours and 36 hours both output as 12, while HH24 outputs the full hour value, which can exceed 23 in an interval value.

Table 9.29 shows the template patterns available for formatting numeric values.

Table 9.29. Template Patterns for Numeric Formatting

Usage notes for numeric formatting:

0 specifies a digit position that will always be printed, even if it contains a leading/trailing zero. 9 also specifies a digit position, but if it is a leading zero then it will be replaced by a space, while if it is a trailing zero and fill mode is specified then it will be deleted. (For to_number(), these two pattern characters are equivalent.)

If the format provides fewer fractional digits than the number being formatted, to_char() will round the number to the specified number of fractional digits.

The pattern characters S, L, D, and G represent the sign, currency symbol, decimal point, and thousands separator characters defined by the current locale (see lc_monetary and lc_numeric). The pattern characters period and comma represent those exact characters, with the meanings of decimal point and thousands separator, regardless of locale.

If no explicit provision is made for a sign in to_char()'s pattern, one column will be reserved for the sign, and it will be anchored to (appear just left of) the number. If S appears just left of some 9's, it will likewise be anchored to the number.

A sign formatted using SG, PL, or MI is not anchored to the number; for example, to_char(-12, 'MI9999') produces '- 12' but to_char(-12, 'S9999') produces ' -12'. (The Oracle implementation does not allow the use of MI before 9, but rather requires that 9 precede MI.)

TH does not convert values less than zero and does not convert fractional numbers.

PL, SG, and TH are PostgreSQL extensions.

In to_number, if non-data template patterns such as L or TH are used, the corresponding number of input characters are skipped, whether or not they match the template pattern, unless they are data characters (that is, digits, sign, decimal point, or comma). For example, TH would skip two non-data characters.

V with to_char multiplies the input values by 10^n, where n is the number of digits following V. V with to_number divides in a similar manner. The V can be thought of as marking the position of an implicit decimal point in the input or output string. to_char and to_number do not support the use of V combined with a decimal point (e.g., 99.9V99 is not allowed).

EEEE (scientific notation) cannot be used in combination with any of the other formatting patterns or modifiers other than digit and decimal point patterns, and must be at the end of the format string (e.g., 9.99EEEE is a valid pattern).

In to_number(), the RN pattern converts Roman numerals (in standard form) to numbers. Input is case-insensitive, so RN and rn are equivalent. RN cannot be used in combination with any other formatting patterns or modifiers except FM, which is applicable only in to_char() and is ignored in to_number().

Certain modifiers can be applied to any template pattern to alter its behavior. For example, FM99.99 is the 99.99 pattern with the FM modifier. Table 9.30 shows the modifier patterns for numeric formatting.

Table 9.30. Template Pattern Modifiers for Numeric Formatting

Table 9.31 shows some examples of the use of the to_char function.

Table 9.31. to_char Examples

**Examples:**

Example 1 (unknown):
```unknown
timestamp with time zone
```

Example 2 (json):
```json
to_char(timestamp '2002-04-20 17:31:12.66', 'HH12:MI:SS')
```

Example 3 (unknown):
```unknown
to_char(interval '15h 2m 12s', 'HH24:MI:SS')
```

Example 4 (unknown):
```unknown
numeric_type
```

---


---

## 9.22. Window Functions #


**URL:** https://www.postgresql.org/docs/18/functions-window.html

**Contents:**
- 9.22. Window Functions #
  - Note

Window functions provide the ability to perform calculations across sets of rows that are related to the current query row. See Section 3.5 for an introduction to this feature, and Section 4.2.8 for syntax details.

The built-in window functions are listed in Table 9.67. Note that these functions must be invoked using window function syntax, i.e., an OVER clause is required.

In addition to these functions, any built-in or user-defined ordinary aggregate (i.e., not ordered-set or hypothetical-set aggregates) can be used as a window function; see Section 9.21 for a list of the built-in aggregates. Aggregate functions act as window functions only when an OVER clause follows the call; otherwise they act as plain aggregates and return a single row for the entire set.

Table 9.67. General-Purpose Window Functions

row_number () → bigint

Returns the number of the current row within its partition, counting from 1.

Returns the rank of the current row, with gaps; that is, the row_number of the first row in its peer group.

dense_rank () → bigint

Returns the rank of the current row, without gaps; this function effectively counts peer groups.

percent_rank () → double precision

Returns the relative rank of the current row, that is (rank - 1) / (total partition rows - 1). The value thus ranges from 0 to 1 inclusive.

cume_dist () → double precision

Returns the cumulative distribution, that is (number of partition rows preceding or peers with current row) / (total partition rows). The value thus ranges from 1/N to 1.

ntile ( num_buckets integer ) → integer

Returns an integer ranging from 1 to the argument value, dividing the partition as equally as possible.

lag ( value anycompatible [, offset integer [, default anycompatible ]] ) → anycompatible

Returns value evaluated at the row that is offset rows before the current row within the partition; if there is no such row, instead returns default (which must be of a type compatible with value). Both offset and default are evaluated with respect to the current row. If omitted, offset defaults to 1 and default to NULL.

lead ( value anycompatible [, offset integer [, default anycompatible ]] ) → anycompatible

Returns value evaluated at the row that is offset rows after the current row within the partition; if there is no such row, instead returns default (which must be of a type compatible with value). Both offset and default are evaluated with respect to the current row. If omitted, offset defaults to 1 and default to NULL.

first_value ( value anyelement ) → anyelement

Returns value evaluated at the row that is the first row of the window frame.

last_value ( value anyelement ) → anyelement

Returns value evaluated at the row that is the last row of the window frame.

nth_value ( value anyelement, n integer ) → anyelement

Returns value evaluated at the row that is the n'th row of the window frame (counting from 1); returns NULL if there is no such row.

All of the functions listed in Table 9.67 depend on the sort ordering specified by the ORDER BY clause of the associated window definition. Rows that are not distinct when considering only the ORDER BY columns are said to be peers. The four ranking functions (including cume_dist) are defined so that they give the same answer for all rows of a peer group.

Note that first_value, last_value, and nth_value consider only the rows within the “window frame”, which by default contains the rows from the start of the partition through the last peer of the current row. This is likely to give unhelpful results for last_value and sometimes also nth_value. You can redefine the frame by adding a suitable frame specification (RANGE, ROWS or GROUPS) to the OVER clause. See Section 4.2.8 for more information about frame specifications.

When an aggregate function is used as a window function, it aggregates over the rows within the current row's window frame. An aggregate used with ORDER BY and the default window frame definition produces a “running sum” type of behavior, which may or may not be what's wanted. To obtain aggregation over the whole partition, omit ORDER BY or use ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING. Other frame specifications can be used to obtain other effects.

The SQL standard defines a RESPECT NULLS or IGNORE NULLS option for lead, lag, first_value, last_value, and nth_value. This is not implemented in PostgreSQL: the behavior is always the same as the standard's default, namely RESPECT NULLS. Likewise, the standard's FROM FIRST or FROM LAST option for nth_value is not implemented: only the default FROM FIRST behavior is supported. (You can achieve the result of FROM LAST by reversing the ORDER BY ordering.)

**Examples:**

Example 1 (unknown):
```unknown
percent_rank
```

Example 2 (unknown):
```unknown
double precision
```

Example 3 (unknown):
```unknown
double precision
```

Example 4 (unknown):
```unknown
num_buckets
```

---


---

## 9.24. Subquery Expressions #


**URL:** https://www.postgresql.org/docs/18/functions-subquery.html

**Contents:**
- 9.24. Subquery Expressions #
  - 9.24.1. EXISTS #
  - 9.24.2. IN #
  - 9.24.3. NOT IN #
  - 9.24.4. ANY/SOME #
  - 9.24.5. ALL #
  - 9.24.6. Single-Row Comparison #

This section describes the SQL-compliant subquery expressions available in PostgreSQL. All of the expression forms documented in this section return Boolean (true/false) results.

The argument of EXISTS is an arbitrary SELECT statement, or subquery. The subquery is evaluated to determine whether it returns any rows. If it returns at least one row, the result of EXISTS is “true”; if the subquery returns no rows, the result of EXISTS is “false”.

The subquery can refer to variables from the surrounding query, which will act as constants during any one evaluation of the subquery.

The subquery will generally only be executed long enough to determine whether at least one row is returned, not all the way to completion. It is unwise to write a subquery that has side effects (such as calling sequence functions); whether the side effects occur might be unpredictable.

Since the result depends only on whether any rows are returned, and not on the contents of those rows, the output list of the subquery is normally unimportant. A common coding convention is to write all EXISTS tests in the form EXISTS(SELECT 1 WHERE ...). There are exceptions to this rule however, such as subqueries that use INTERSECT.

This simple example is like an inner join on col2, but it produces at most one output row for each tab1 row, even if there are several matching tab2 rows:

The right-hand side is a parenthesized subquery, which must return exactly one column. The left-hand expression is evaluated and compared to each row of the subquery result. The result of IN is “true” if any equal subquery row is found. The result is “false” if no equal row is found (including the case where the subquery returns no rows).

Note that if the left-hand expression yields null, or if there are no equal right-hand values and at least one right-hand row yields null, the result of the IN construct will be null, not false. This is in accordance with SQL's normal rules for Boolean combinations of null values.

As with EXISTS, it's unwise to assume that the subquery will be evaluated completely.

The left-hand side of this form of IN is a row constructor, as described in Section 4.2.13. The right-hand side is a parenthesized subquery, which must return exactly as many columns as there are expressions in the left-hand row. The left-hand expressions are evaluated and compared row-wise to each row of the subquery result. The result of IN is “true” if any equal subquery row is found. The result is “false” if no equal row is found (including the case where the subquery returns no rows).

As usual, null values in the rows are combined per the normal rules of SQL Boolean expressions. Two rows are considered equal if all their corresponding members are non-null and equal; the rows are unequal if any corresponding members are non-null and unequal; otherwise the result of that row comparison is unknown (null). If all the per-row results are either unequal or null, with at least one null, then the result of IN is null.

The right-hand side is a parenthesized subquery, which must return exactly one column. The left-hand expression is evaluated and compared to each row of the subquery result. The result of NOT IN is “true” if only unequal subquery rows are found (including the case where the subquery returns no rows). The result is “false” if any equal row is found.

Note that if the left-hand expression yields null, or if there are no equal right-hand values and at least one right-hand row yields null, the result of the NOT IN construct will be null, not true. This is in accordance with SQL's normal rules for Boolean combinations of null values.

As with EXISTS, it's unwise to assume that the subquery will be evaluated completely.

The left-hand side of this form of NOT IN is a row constructor, as described in Section 4.2.13. The right-hand side is a parenthesized subquery, which must return exactly as many columns as there are expressions in the left-hand row. The left-hand expressions are evaluated and compared row-wise to each row of the subquery result. The result of NOT IN is “true” if only unequal subquery rows are found (including the case where the subquery returns no rows). The result is “false” if any equal row is found.

As usual, null values in the rows are combined per the normal rules of SQL Boolean expressions. Two rows are considered equal if all their corresponding members are non-null and equal; the rows are unequal if any corresponding members are non-null and unequal; otherwise the result of that row comparison is unknown (null). If all the per-row results are either unequal or null, with at least one null, then the result of NOT IN is null.

The right-hand side is a parenthesized subquery, which must return exactly one column. The left-hand expression is evaluated and compared to each row of the subquery result using the given operator, which must yield a Boolean result. The result of ANY is “true” if any true result is obtained. The result is “false” if no true result is found (including the case where the subquery returns no rows).

SOME is a synonym for ANY. IN is equivalent to = ANY.

Note that if there are no successes and at least one right-hand row yields null for the operator's result, the result of the ANY construct will be null, not false. This is in accordance with SQL's normal rules for Boolean combinations of null values.

As with EXISTS, it's unwise to assume that the subquery will be evaluated completely.

The left-hand side of this form of ANY is a row constructor, as described in Section 4.2.13. The right-hand side is a parenthesized subquery, which must return exactly as many columns as there are expressions in the left-hand row. The left-hand expressions are evaluated and compared row-wise to each row of the subquery result, using the given operator. The result of ANY is “true” if the comparison returns true for any subquery row. The result is “false” if the comparison returns false for every subquery row (including the case where the subquery returns no rows). The result is NULL if no comparison with a subquery row returns true, and at least one comparison returns NULL.

See Section 9.25.5 for details about the meaning of a row constructor comparison.

The right-hand side is a parenthesized subquery, which must return exactly one column. The left-hand expression is evaluated and compared to each row of the subquery result using the given operator, which must yield a Boolean result. The result of ALL is “true” if all rows yield true (including the case where the subquery returns no rows). The result is “false” if any false result is found. The result is NULL if no comparison with a subquery row returns false, and at least one comparison returns NULL.

NOT IN is equivalent to <> ALL.

As with EXISTS, it's unwise to assume that the subquery will be evaluated completely.

The left-hand side of this form of ALL is a row constructor, as described in Section 4.2.13. The right-hand side is a parenthesized subquery, which must return exactly as many columns as there are expressions in the left-hand row. The left-hand expressions are evaluated and compared row-wise to each row of the subquery result, using the given operator. The result of ALL is “true” if the comparison returns true for all subquery rows (including the case where the subquery returns no rows). The result is “false” if the comparison returns false for any subquery row. The result is NULL if no comparison with a subquery row returns false, and at least one comparison returns NULL.

See Section 9.25.5 for details about the meaning of a row constructor comparison.

The left-hand side is a row constructor, as described in Section 4.2.13. The right-hand side is a parenthesized subquery, which must return exactly as many columns as there are expressions in the left-hand row. Furthermore, the subquery cannot return more than one row. (If it returns zero rows, the result is taken to be null.) The left-hand side is evaluated and compared row-wise to the single subquery result row.

See Section 9.25.5 for details about the meaning of a row constructor comparison.

**Examples:**

Example 1 (sql):
```sql
EXISTS(SELECT 1 WHERE ...)
```

Example 2 (sql):
```sql
SELECT col1
FROM tab1
WHERE EXISTS (SELECT 1 FROM tab2 WHERE col2 = tab1.col2);
```

Example 3 (unknown):
```unknown
row_constructor
```

Example 4 (unknown):
```unknown
row_constructor
```

---


---

