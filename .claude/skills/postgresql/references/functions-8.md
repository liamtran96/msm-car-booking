# PostgreSQL - Functions (Part 8)

## 9.9. Date/Time Functions and Operators #


**URL:** https://www.postgresql.org/docs/18/functions-datetime.html

**Contents:**
- 9.9. Date/Time Functions and Operators #
  - 9.9.1. EXTRACT, date_part #
  - Note
  - 9.9.2. date_trunc #
  - 9.9.3. date_bin #
  - 9.9.4. AT TIME ZONE and AT LOCAL #
  - 9.9.5. Current Date/Time #
  - Note
  - Tip
  - 9.9.6. Delaying Execution #

Table 9.33 shows the available functions for date/time value processing, with details appearing in the following subsections. Table 9.32 illustrates the behaviors of the basic arithmetic operators (+, *, etc.). For formatting functions, refer to Section 9.8. You should be familiar with the background information on date/time data types from Section 8.5.

In addition, the usual comparison operators shown in Table 9.1 are available for the date/time types. Dates and timestamps (with or without time zone) are all comparable, while times (with or without time zone) and intervals can only be compared to other values of the same data type. When comparing a timestamp without time zone to a timestamp with time zone, the former value is assumed to be given in the time zone specified by the TimeZone configuration parameter, and is rotated to UTC for comparison to the latter value (which is already in UTC internally). Similarly, a date value is assumed to represent midnight in the TimeZone zone when comparing it to a timestamp.

All the functions and operators described below that take time or timestamp inputs actually come in two variants: one that takes time with time zone or timestamp with time zone, and one that takes time without time zone or timestamp without time zone. For brevity, these variants are not shown separately. Also, the + and * operators come in commutative pairs (for example both date + integer and integer + date); we show only one of each such pair.

Table 9.32. Date/Time Operators

date + integer → date

Add a number of days to a date

date '2001-09-28' + 7 → 2001-10-05

date + interval → timestamp

Add an interval to a date

date '2001-09-28' + interval '1 hour' → 2001-09-28 01:00:00

date + time → timestamp

Add a time-of-day to a date

date '2001-09-28' + time '03:00' → 2001-09-28 03:00:00

interval + interval → interval

interval '1 day' + interval '1 hour' → 1 day 01:00:00

timestamp + interval → timestamp

Add an interval to a timestamp

timestamp '2001-09-28 01:00' + interval '23 hours' → 2001-09-29 00:00:00

time + interval → time

Add an interval to a time

time '01:00' + interval '3 hours' → 04:00:00

- interval → interval

- interval '23 hours' → -23:00:00

date - date → integer

Subtract dates, producing the number of days elapsed

date '2001-10-01' - date '2001-09-28' → 3

date - integer → date

Subtract a number of days from a date

date '2001-10-01' - 7 → 2001-09-24

date - interval → timestamp

Subtract an interval from a date

date '2001-09-28' - interval '1 hour' → 2001-09-27 23:00:00

time - time → interval

time '05:00' - time '03:00' → 02:00:00

time - interval → time

Subtract an interval from a time

time '05:00' - interval '2 hours' → 03:00:00

timestamp - interval → timestamp

Subtract an interval from a timestamp

timestamp '2001-09-28 23:00' - interval '23 hours' → 2001-09-28 00:00:00

interval - interval → interval

interval '1 day' - interval '1 hour' → 1 day -01:00:00

timestamp - timestamp → interval

Subtract timestamps (converting 24-hour intervals into days, similarly to justify_hours())

timestamp '2001-09-29 03:00' - timestamp '2001-07-27 12:00' → 63 days 15:00:00

interval * double precision → interval

Multiply an interval by a scalar

interval '1 second' * 900 → 00:15:00

interval '1 day' * 21 → 21 days

interval '1 hour' * 3.5 → 03:30:00

interval / double precision → interval

Divide an interval by a scalar

interval '1 hour' / 1.5 → 00:40:00

Table 9.33. Date/Time Functions

age ( timestamp, timestamp ) → interval

Subtract arguments, producing a “symbolic” result that uses years and months, rather than just days

age(timestamp '2001-04-10', timestamp '1957-06-13') → 43 years 9 mons 27 days

age ( timestamp ) → interval

Subtract argument from current_date (at midnight)

age(timestamp '1957-06-13') → 62 years 6 mons 10 days

clock_timestamp ( ) → timestamp with time zone

Current date and time (changes during statement execution); see Section 9.9.5

clock_timestamp() → 2019-12-23 14:39:53.662522-05

Current date; see Section 9.9.5

current_date → 2019-12-23

current_time → time with time zone

Current time of day; see Section 9.9.5

current_time → 14:39:53.662522-05

current_time ( integer ) → time with time zone

Current time of day, with limited precision; see Section 9.9.5

current_time(2) → 14:39:53.66-05

current_timestamp → timestamp with time zone

Current date and time (start of current transaction); see Section 9.9.5

current_timestamp → 2019-12-23 14:39:53.662522-05

current_timestamp ( integer ) → timestamp with time zone

Current date and time (start of current transaction), with limited precision; see Section 9.9.5

current_timestamp(0) → 2019-12-23 14:39:53-05

date_add ( timestamp with time zone, interval [, text ] ) → timestamp with time zone

Add an interval to a timestamp with time zone, computing times of day and daylight-savings adjustments according to the time zone named by the third argument, or the current TimeZone setting if that is omitted. The form with two arguments is equivalent to the timestamp with time zone + interval operator.

date_add('2021-10-31 00:00:00+02'::timestamptz, '1 day'::interval, 'Europe/Warsaw') → 2021-10-31 23:00:00+00

date_bin ( interval, timestamp, timestamp ) → timestamp

Bin input into specified interval aligned with specified origin; see Section 9.9.3

date_bin('15 minutes', timestamp '2001-02-16 20:38:40', timestamp '2001-02-16 20:05:00') → 2001-02-16 20:35:00

date_part ( text, timestamp ) → double precision

Get timestamp subfield (equivalent to extract); see Section 9.9.1

date_part('hour', timestamp '2001-02-16 20:38:40') → 20

date_part ( text, interval ) → double precision

Get interval subfield (equivalent to extract); see Section 9.9.1

date_part('month', interval '2 years 3 months') → 3

date_subtract ( timestamp with time zone, interval [, text ] ) → timestamp with time zone

Subtract an interval from a timestamp with time zone, computing times of day and daylight-savings adjustments according to the time zone named by the third argument, or the current TimeZone setting if that is omitted. The form with two arguments is equivalent to the timestamp with time zone - interval operator.

date_subtract('2021-11-01 00:00:00+01'::timestamptz, '1 day'::interval, 'Europe/Warsaw') → 2021-10-30 22:00:00+00

date_trunc ( text, timestamp ) → timestamp

Truncate to specified precision; see Section 9.9.2

date_trunc('hour', timestamp '2001-02-16 20:38:40') → 2001-02-16 20:00:00

date_trunc ( text, timestamp with time zone, text ) → timestamp with time zone

Truncate to specified precision in the specified time zone; see Section 9.9.2

date_trunc('day', timestamptz '2001-02-16 20:38:40+00', 'Australia/Sydney') → 2001-02-16 13:00:00+00

date_trunc ( text, interval ) → interval

Truncate to specified precision; see Section 9.9.2

date_trunc('hour', interval '2 days 3 hours 40 minutes') → 2 days 03:00:00

extract ( field from timestamp ) → numeric

Get timestamp subfield; see Section 9.9.1

extract(hour from timestamp '2001-02-16 20:38:40') → 20

extract ( field from interval ) → numeric

Get interval subfield; see Section 9.9.1

extract(month from interval '2 years 3 months') → 3

isfinite ( date ) → boolean

Test for finite date (not +/-infinity)

isfinite(date '2001-02-16') → true

isfinite ( timestamp ) → boolean

Test for finite timestamp (not +/-infinity)

isfinite(timestamp 'infinity') → false

isfinite ( interval ) → boolean

Test for finite interval (not +/-infinity)

isfinite(interval '4 hours') → true

justify_days ( interval ) → interval

Adjust interval, converting 30-day time periods to months

justify_days(interval '1 year 65 days') → 1 year 2 mons 5 days

justify_hours ( interval ) → interval

Adjust interval, converting 24-hour time periods to days

justify_hours(interval '50 hours 10 minutes') → 2 days 02:10:00

justify_interval ( interval ) → interval

Adjust interval using justify_days and justify_hours, with additional sign adjustments

justify_interval(interval '1 mon -1 hour') → 29 days 23:00:00

Current time of day; see Section 9.9.5

localtime → 14:39:53.662522

localtime ( integer ) → time

Current time of day, with limited precision; see Section 9.9.5

localtime(0) → 14:39:53

localtimestamp → timestamp

Current date and time (start of current transaction); see Section 9.9.5

localtimestamp → 2019-12-23 14:39:53.662522

localtimestamp ( integer ) → timestamp

Current date and time (start of current transaction), with limited precision; see Section 9.9.5

localtimestamp(2) → 2019-12-23 14:39:53.66

make_date ( year int, month int, day int ) → date

Create date from year, month and day fields (negative years signify BC)

make_date(2013, 7, 15) → 2013-07-15

make_interval ( [ years int [, months int [, weeks int [, days int [, hours int [, mins int [, secs double precision ]]]]]]] ) → interval

Create interval from years, months, weeks, days, hours, minutes and seconds fields, each of which can default to zero

make_interval(days => 10) → 10 days

make_time ( hour int, min int, sec double precision ) → time

Create time from hour, minute and seconds fields

make_time(8, 15, 23.5) → 08:15:23.5

make_timestamp ( year int, month int, day int, hour int, min int, sec double precision ) → timestamp

Create timestamp from year, month, day, hour, minute and seconds fields (negative years signify BC)

make_timestamp(2013, 7, 15, 8, 15, 23.5) → 2013-07-15 08:15:23.5

make_timestamptz ( year int, month int, day int, hour int, min int, sec double precision [, timezone text ] ) → timestamp with time zone

Create timestamp with time zone from year, month, day, hour, minute and seconds fields (negative years signify BC). If timezone is not specified, the current time zone is used; the examples assume the session time zone is Europe/London

make_timestamptz(2013, 7, 15, 8, 15, 23.5) → 2013-07-15 08:15:23.5+01

make_timestamptz(2013, 7, 15, 8, 15, 23.5, 'America/New_York') → 2013-07-15 13:15:23.5+01

now ( ) → timestamp with time zone

Current date and time (start of current transaction); see Section 9.9.5

now() → 2019-12-23 14:39:53.662522-05

statement_timestamp ( ) → timestamp with time zone

Current date and time (start of current statement); see Section 9.9.5

statement_timestamp() → 2019-12-23 14:39:53.662522-05

Current date and time (like clock_timestamp, but as a text string); see Section 9.9.5

timeofday() → Mon Dec 23 14:39:53.662522 2019 EST

transaction_timestamp ( ) → timestamp with time zone

Current date and time (start of current transaction); see Section 9.9.5

transaction_timestamp() → 2019-12-23 14:39:53.662522-05

to_timestamp ( double precision ) → timestamp with time zone

Convert Unix epoch (seconds since 1970-01-01 00:00:00+00) to timestamp with time zone

to_timestamp(1284352323) → 2010-09-13 04:32:03+00

In addition to these functions, the SQL OVERLAPS operator is supported:

This expression yields true when two time periods (defined by their endpoints) overlap, false when they do not overlap. The endpoints can be specified as pairs of dates, times, or time stamps; or as a date, time, or time stamp followed by an interval. When a pair of values is provided, either the start or the end can be written first; OVERLAPS automatically takes the earlier value of the pair as the start. Each time period is considered to represent the half-open interval start <= time < end, unless start and end are equal in which case it represents that single time instant. This means for instance that two time periods with only an endpoint in common do not overlap.

When adding an interval value to (or subtracting an interval value from) a timestamp or timestamp with time zone value, the months, days, and microseconds fields of the interval value are handled in turn. First, a nonzero months field advances or decrements the date of the timestamp by the indicated number of months, keeping the day of month the same unless it would be past the end of the new month, in which case the last day of that month is used. (For example, March 31 plus 1 month becomes April 30, but March 31 plus 2 months becomes May 31.) Then the days field advances or decrements the date of the timestamp by the indicated number of days. In both these steps the local time of day is kept the same. Finally, if there is a nonzero microseconds field, it is added or subtracted literally. When doing arithmetic on a timestamp with time zone value in a time zone that recognizes DST, this means that adding or subtracting (say) interval '1 day' does not necessarily have the same result as adding or subtracting interval '24 hours'. For example, with the session time zone set to America/Denver:

This happens because an hour was skipped due to a change in daylight saving time at 2005-04-03 02:00:00 in time zone America/Denver.

Note there can be ambiguity in the months field returned by age because different months have different numbers of days. PostgreSQL's approach uses the month from the earlier of the two dates when calculating partial months. For example, age('2004-06-01', '2004-04-30') uses April to yield 1 mon 1 day, while using May would yield 1 mon 2 days because May has 31 days, while April has only 30.

Subtraction of dates and timestamps can also be complex. One conceptually simple way to perform subtraction is to convert each value to a number of seconds using EXTRACT(EPOCH FROM ...), then subtract the results; this produces the number of seconds between the two values. This will adjust for the number of days in each month, timezone changes, and daylight saving time adjustments. Subtraction of date or timestamp values with the “-” operator returns the number of days (24-hours) and hours/minutes/seconds between the values, making the same adjustments. The age function returns years, months, days, and hours/minutes/seconds, performing field-by-field subtraction and then adjusting for negative field values. The following queries illustrate the differences in these approaches. The sample results were produced with timezone = 'US/Eastern'; there is a daylight saving time change between the two dates used:

The extract function retrieves subfields such as year or hour from date/time values. source must be a value expression of type timestamp, date, time, or interval. (Timestamps and times can be with or without time zone.) field is an identifier or string that selects what field to extract from the source value. Not all fields are valid for every input data type; for example, fields smaller than a day cannot be extracted from a date, while fields of a day or more cannot be extracted from a time. The extract function returns values of type numeric.

The following are valid field names:

The century; for interval values, the year field divided by 100

The day of the month (1–31); for interval values, the number of days

The year field divided by 10

The day of the week as Sunday (0) to Saturday (6)

Note that extract's day of the week numbering differs from that of the to_char(..., 'D') function.


*(continued...)*
---

