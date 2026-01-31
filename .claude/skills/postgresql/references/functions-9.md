# PostgreSQL - Functions (Part 9)

## 9.9. Date/Time Functions and Operators # (continued)
The day of the year (1–365/366)

For timestamp with time zone values, the number of seconds since 1970-01-01 00:00:00 UTC (negative for timestamps before that); for date and timestamp values, the nominal number of seconds since 1970-01-01 00:00:00, without regard to timezone or daylight-savings rules; for interval values, the total number of seconds in the interval

You can convert an epoch value back to a timestamp with time zone with to_timestamp:

Beware that applying to_timestamp to an epoch extracted from a date or timestamp value could produce a misleading result: the result will effectively assume that the original value had been given in UTC, which might not be the case.

The hour field (0–23 in timestamps, unrestricted in intervals)

The day of the week as Monday (1) to Sunday (7)

This is identical to dow except for Sunday. This matches the ISO 8601 day of the week numbering.

The ISO 8601 week-numbering year that the date falls in

Each ISO 8601 week-numbering year begins with the Monday of the week containing the 4th of January, so in early January or late December the ISO year may be different from the Gregorian year. See the week field for more information.

The Julian Date corresponding to the date or timestamp. Timestamps that are not local midnight result in a fractional value. See Section B.7 for more information.

The seconds field, including fractional parts, multiplied by 1 000 000; note that this includes full seconds

The millennium; for interval values, the year field divided by 1000

Years in the 1900s are in the second millennium. The third millennium started January 1, 2001.

The seconds field, including fractional parts, multiplied by 1000. Note that this includes full seconds.

The minutes field (0–59)

The number of the month within the year (1–12); for interval values, the number of months modulo 12 (0–11)

The quarter of the year (1–4) that the date is in; for interval values, the month field divided by 3 plus 1

The seconds field, including any fractional seconds

The time zone offset from UTC, measured in seconds. Positive values correspond to time zones east of UTC, negative values to zones west of UTC. (Technically, PostgreSQL does not use UTC because leap seconds are not handled.)

The hour component of the time zone offset

The minute component of the time zone offset

The number of the ISO 8601 week-numbering week of the year. By definition, ISO weeks start on Mondays and the first week of a year contains January 4 of that year. In other words, the first Thursday of a year is in week 1 of that year.

In the ISO week-numbering system, it is possible for early-January dates to be part of the 52nd or 53rd week of the previous year, and for late-December dates to be part of the first week of the next year. For example, 2005-01-01 is part of the 53rd week of year 2004, and 2006-01-01 is part of the 52nd week of year 2005, while 2012-12-31 is part of the first week of 2013. It's recommended to use the isoyear field together with week to get consistent results.

For interval values, the week field is simply the number of integral days divided by 7.

The year field. Keep in mind there is no 0 AD, so subtracting BC years from AD years should be done with care.

When processing an interval value, the extract function produces field values that match the interpretation used by the interval output function. This can produce surprising results if one starts with a non-normalized interval representation, for example:

When the input value is +/-Infinity, extract returns +/-Infinity for monotonically-increasing fields (epoch, julian, year, isoyear, decade, century, and millennium for timestamp inputs; epoch, hour, day, year, decade, century, and millennium for interval inputs). For other fields, NULL is returned. PostgreSQL versions before 9.6 returned zero for all cases of infinite input.

The extract function is primarily intended for computational processing. For formatting date/time values for display, see Section 9.8.

The date_part function is modeled on the traditional Ingres equivalent to the SQL-standard function extract:

Note that here the field parameter needs to be a string value, not a name. The valid field names for date_part are the same as for extract. For historical reasons, the date_part function returns values of type double precision. This can result in a loss of precision in certain uses. Using extract is recommended instead.

The function date_trunc is conceptually similar to the trunc function for numbers.

source is a value expression of type timestamp, timestamp with time zone, or interval. (Values of type date and time are cast automatically to timestamp or interval, respectively.) field selects to which precision to truncate the input value. The return value is likewise of type timestamp, timestamp with time zone, or interval, and it has all fields that are less significant than the selected one set to zero (or one, for day and month).

Valid values for field are:

When the input value is of type timestamp with time zone, the truncation is performed with respect to a particular time zone; for example, truncation to day produces a value that is midnight in that zone. By default, truncation is done with respect to the current TimeZone setting, but the optional time_zone argument can be provided to specify a different time zone. The time zone name can be specified in any of the ways described in Section 8.5.3.

A time zone cannot be specified when processing timestamp without time zone or interval inputs. These are always taken at face value.

Examples (assuming the local time zone is America/New_York):

The function date_bin “bins” the input timestamp into the specified interval (the stride) aligned with a specified origin.

source is a value expression of type timestamp or timestamp with time zone. (Values of type date are cast automatically to timestamp.) stride is a value expression of type interval. The return value is likewise of type timestamp or timestamp with time zone, and it marks the beginning of the bin into which the source is placed.

In the case of full units (1 minute, 1 hour, etc.), it gives the same result as the analogous date_trunc call, but the difference is that date_bin can truncate to an arbitrary interval.

The stride interval must be greater than zero and cannot contain units of month or larger.

The AT TIME ZONE operator converts time stamp without time zone to/from time stamp with time zone, and time with time zone values to different time zones. Table 9.34 shows its variants.

Table 9.34. AT TIME ZONE and AT LOCAL Variants

timestamp without time zone AT TIME ZONE zone → timestamp with time zone

Converts given time stamp without time zone to time stamp with time zone, assuming the given value is in the named time zone.

timestamp '2001-02-16 20:38:40' at time zone 'America/Denver' → 2001-02-17 03:38:40+00

timestamp without time zone AT LOCAL → timestamp with time zone

Converts given time stamp without time zone to time stamp with the session's TimeZone value as time zone.

timestamp '2001-02-16 20:38:40' at local → 2001-02-17 03:38:40+00

timestamp with time zone AT TIME ZONE zone → timestamp without time zone

Converts given time stamp with time zone to time stamp without time zone, as the time would appear in that zone.

timestamp with time zone '2001-02-16 20:38:40-05' at time zone 'America/Denver' → 2001-02-16 18:38:40

timestamp with time zone AT LOCAL → timestamp without time zone

Converts given time stamp with time zone to time stamp without time zone, as the time would appear with the session's TimeZone value as time zone.

timestamp with time zone '2001-02-16 20:38:40-05' at local → 2001-02-16 18:38:40

time with time zone AT TIME ZONE zone → time with time zone

Converts given time with time zone to a new time zone. Since no date is supplied, this uses the currently active UTC offset for the named destination zone.

time with time zone '05:34:17-05' at time zone 'UTC' → 10:34:17+00

time with time zone AT LOCAL → time with time zone

Converts given time with time zone to a new time zone. Since no date is supplied, this uses the currently active UTC offset for the session's TimeZone value.

Assuming the session's TimeZone is set to UTC:

time with time zone '05:34:17-05' at local → 10:34:17+00

In these expressions, the desired time zone zone can be specified either as a text value (e.g., 'America/Los_Angeles') or as an interval (e.g., INTERVAL '-08:00'). In the text case, a time zone name can be specified in any of the ways described in Section 8.5.3. The interval case is only useful for zones that have fixed offsets from UTC, so it is not very common in practice.

The syntax AT LOCAL may be used as shorthand for AT TIME ZONE local, where local is the session's TimeZone value.

Examples (assuming the current TimeZone setting is America/Los_Angeles):

The first example adds a time zone to a value that lacks it, and displays the value using the current TimeZone setting. The second example shifts the time stamp with time zone value to the specified time zone, and returns the value without a time zone. This allows storage and display of values different from the current TimeZone setting. The third example converts Tokyo time to Chicago time. The fourth example shifts the time stamp with time zone value to the time zone currently specified by the TimeZone setting and returns the value without a time zone. The fifth example demonstrates that the sign in a POSIX-style time zone specification has the opposite meaning of the sign in an ISO-8601 datetime literal, as described in Section 8.5.3 and Appendix B.

The sixth example is a cautionary tale. Due to the fact that there is no date associated with the input value, the conversion is made using the current date of the session. Therefore, this static example may show a wrong result depending on the time of the year it is viewed because 'America/Los_Angeles' observes Daylight Savings Time.

The function timezone(zone, timestamp) is equivalent to the SQL-conforming construct timestamp AT TIME ZONE zone.

The function timezone(zone, time) is equivalent to the SQL-conforming construct time AT TIME ZONE zone.

The function timezone(timestamp) is equivalent to the SQL-conforming construct timestamp AT LOCAL.

The function timezone(time) is equivalent to the SQL-conforming construct time AT LOCAL.

PostgreSQL provides a number of functions that return values related to the current date and time. These SQL-standard functions all return values based on the start time of the current transaction:

CURRENT_TIME and CURRENT_TIMESTAMP deliver values with time zone; LOCALTIME and LOCALTIMESTAMP deliver values without time zone.

CURRENT_TIME, CURRENT_TIMESTAMP, LOCALTIME, and LOCALTIMESTAMP can optionally take a precision parameter, which causes the result to be rounded to that many fractional digits in the seconds field. Without a precision parameter, the result is given to the full available precision.

Since these functions return the start time of the current transaction, their values do not change during the transaction. This is considered a feature: the intent is to allow a single transaction to have a consistent notion of the “current” time, so that multiple modifications within the same transaction bear the same time stamp.

Other database systems might advance these values more frequently.

PostgreSQL also provides functions that return the start time of the current statement, as well as the actual current time at the instant the function is called. The complete list of non-SQL-standard time functions is:

transaction_timestamp() is equivalent to CURRENT_TIMESTAMP, but is named to clearly reflect what it returns. statement_timestamp() returns the start time of the current statement (more specifically, the time of receipt of the latest command message from the client). statement_timestamp() and transaction_timestamp() return the same value during the first statement of a transaction, but might differ during subsequent statements. clock_timestamp() returns the actual current time, and therefore its value changes even within a single SQL statement. timeofday() is a historical PostgreSQL function. Like clock_timestamp(), it returns the actual current time, but as a formatted text string rather than a timestamp with time zone value. now() is a traditional PostgreSQL equivalent to transaction_timestamp().

All the date/time data types also accept the special literal value now to specify the current date and time (again, interpreted as the transaction start time). Thus, the following three all return the same result:

Do not use the third form when specifying a value to be evaluated later, for example in a DEFAULT clause for a table column. The system will convert now to a timestamp as soon as the constant is parsed, so that when the default value is needed, the time of the table creation would be used! The first two forms will not be evaluated until the default value is used, because they are function calls. Thus they will give the desired behavior of defaulting to the time of row insertion. (See also Section 8.5.1.4.)

The following functions are available to delay execution of the server process:

pg_sleep makes the current session's process sleep until the given number of seconds have elapsed. Fractional-second delays can be specified. pg_sleep_for is a convenience function to allow the sleep time to be specified as an interval. pg_sleep_until is a convenience function for when a specific wake-up time is desired. For example:

The effective resolution of the sleep interval is platform-specific; 0.01 seconds is a common value. The sleep delay will be at least as long as specified. It might be longer depending on factors such as server load. In particular, pg_sleep_until is not guaranteed to wake up exactly at the specified time, but it will not wake up any earlier.

Make sure that your session does not hold more locks than necessary when calling pg_sleep or its variants. Otherwise other sessions might have to wait for your sleeping process, slowing down the entire system.

**Examples:**

Example 1 (unknown):
```unknown
AT TIME ZONE
```

Example 2 (unknown):
```unknown
time with time zone
```

Example 3 (unknown):
```unknown
timestamp with time zone
```

Example 4 (unknown):
```unknown
time without time zone
```

---


---

## 9.2. Comparison Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-comparison.html

**Contents:**
- 9.2. Comparison Functions and Operators #
  - Note
  - Note
  - Tip

The usual comparison operators are available, as shown in Table 9.1.

Table 9.1. Comparison Operators

<> is the standard SQL notation for “not equal”. != is an alias, which is converted to <> at a very early stage of parsing. Hence, it is not possible to implement != and <> operators that do different things.

These comparison operators are available for all built-in data types that have a natural ordering, including numeric, string, and date/time types. In addition, arrays, composite types, and ranges can be compared if their component data types are comparable.

It is usually possible to compare values of related data types as well; for example integer > bigint will work. Some cases of this sort are implemented directly by “cross-type” comparison operators, but if no such operator is available, the parser will coerce the less-general type to the more-general type and apply the latter's comparison operator.

As shown above, all comparison operators are binary operators that return values of type boolean. Thus, expressions like 1 < 2 < 3 are not valid (because there is no < operator to compare a Boolean value with 3). Use the BETWEEN predicates shown below to perform range tests.

There are also some comparison predicates, as shown in Table 9.2. These behave much like operators, but have special syntax mandated by the SQL standard.

Table 9.2. Comparison Predicates

datatype BETWEEN datatype AND datatype → boolean

Between (inclusive of the range endpoints).

2 BETWEEN 1 AND 3 → t

2 BETWEEN 3 AND 1 → f

datatype NOT BETWEEN datatype AND datatype → boolean

Not between (the negation of BETWEEN).

2 NOT BETWEEN 1 AND 3 → f

datatype BETWEEN SYMMETRIC datatype AND datatype → boolean

Between, after sorting the two endpoint values.

2 BETWEEN SYMMETRIC 3 AND 1 → t

datatype NOT BETWEEN SYMMETRIC datatype AND datatype → boolean

Not between, after sorting the two endpoint values.

2 NOT BETWEEN SYMMETRIC 3 AND 1 → f

datatype IS DISTINCT FROM datatype → boolean

Not equal, treating null as a comparable value.

1 IS DISTINCT FROM NULL → t (rather than NULL)

NULL IS DISTINCT FROM NULL → f (rather than NULL)

datatype IS NOT DISTINCT FROM datatype → boolean

Equal, treating null as a comparable value.

1 IS NOT DISTINCT FROM NULL → f (rather than NULL)

NULL IS NOT DISTINCT FROM NULL → t (rather than NULL)

datatype IS NULL → boolean

Test whether value is null.

datatype IS NOT NULL → boolean

Test whether value is not null.

'null' IS NOT NULL → t

datatype ISNULL → boolean

Test whether value is null (nonstandard syntax).

datatype NOTNULL → boolean

Test whether value is not null (nonstandard syntax).

boolean IS TRUE → boolean

Test whether boolean expression yields true.

NULL::boolean IS TRUE → f (rather than NULL)

boolean IS NOT TRUE → boolean

Test whether boolean expression yields false or unknown.

NULL::boolean IS NOT TRUE → t (rather than NULL)

boolean IS FALSE → boolean

Test whether boolean expression yields false.

NULL::boolean IS FALSE → f (rather than NULL)

boolean IS NOT FALSE → boolean

Test whether boolean expression yields true or unknown.

true IS NOT FALSE → t

NULL::boolean IS NOT FALSE → t (rather than NULL)

boolean IS UNKNOWN → boolean

Test whether boolean expression yields unknown.

NULL::boolean IS UNKNOWN → t (rather than NULL)

boolean IS NOT UNKNOWN → boolean

Test whether boolean expression yields true or false.

true IS NOT UNKNOWN → t

NULL::boolean IS NOT UNKNOWN → f (rather than NULL)

The BETWEEN predicate simplifies range tests:

Notice that BETWEEN treats the endpoint values as included in the range. BETWEEN SYMMETRIC is like BETWEEN except there is no requirement that the argument to the left of AND be less than or equal to the argument on the right. If it is not, those two arguments are automatically swapped, so that a nonempty range is always implied.

The various variants of BETWEEN are implemented in terms of the ordinary comparison operators, and therefore will work for any data type(s) that can be compared.

The use of AND in the BETWEEN syntax creates an ambiguity with the use of AND as a logical operator. To resolve this, only a limited set of expression types are allowed as the second argument of a BETWEEN clause. If you need to write a more complex sub-expression in BETWEEN, write parentheses around the sub-expression.

Ordinary comparison operators yield null (signifying “unknown”), not true or false, when either input is null. For example, 7 = NULL yields null, as does 7 <> NULL. When this behavior is not suitable, use the IS [ NOT ] DISTINCT FROM predicates:

For non-null inputs, IS DISTINCT FROM is the same as the <> operator. However, if both inputs are null it returns false, and if only one input is null it returns true. Similarly, IS NOT DISTINCT FROM is identical to = for non-null inputs, but it returns true when both inputs are null, and false when only one input is null. Thus, these predicates effectively act as though null were a normal data value, rather than “unknown”.

To check whether a value is or is not null, use the predicates:

or the equivalent, but nonstandard, predicates:

Do not write expression = NULL because NULL is not “equal to” NULL. (The null value represents an unknown value, and it is not known whether two unknown values are equal.)

Some applications might expect that expression = NULL returns true if expression evaluates to the null value. It is highly recommended that these applications be modified to comply with the SQL standard. However, if that cannot be done the transform_null_equals configuration variable is available. If it is enabled, PostgreSQL will convert x = NULL clauses to x IS NULL.

If the expression is row-valued, then IS NULL is true when the row expression itself is null or when all the row's fields are null, while IS NOT NULL is true when the row expression itself is non-null and all the row's fields are non-null. Because of this behavior, IS NULL and IS NOT NULL do not always return inverse results for row-valued expressions; in particular, a row-valued expression that contains both null and non-null fields will return false for both tests. For example:

In some cases, it may be preferable to write row IS DISTINCT FROM NULL or row IS NOT DISTINCT FROM NULL, which will simply check whether the overall row value is null without any additional tests on the row fields.

Boolean values can also be tested using the predicates

These will always return true or false, never a null value, even when the operand is null. A null input is treated as the logical value “unknown”. Notice that IS UNKNOWN and IS NOT UNKNOWN are effectively the same as IS NULL and IS NOT NULL, respectively, except that the input expression must be of Boolean type.

Some comparison-related functions are also available, as shown in Table 9.3.

Table 9.3. Comparison Functions

num_nonnulls ( VARIADIC "any" ) → integer

Returns the number of non-null arguments.

num_nonnulls(1, NULL, 2) → 2

num_nulls ( VARIADIC "any" ) → integer

Returns the number of null arguments.

num_nulls(1, NULL, 2) → 1

**Examples:**

Example 1 (unknown):
```unknown
2 BETWEEN 1 AND 3
```

Example 2 (unknown):
```unknown
2 BETWEEN 3 AND 1
```

Example 3 (unknown):
```unknown
NOT BETWEEN
```

Example 4 (unknown):
```unknown
2 NOT BETWEEN 1 AND 3
```

---


---

