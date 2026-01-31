# PostgreSQL - Ecpg (Part 9)

## 34.6. pgtypes Library #


**URL:** https://www.postgresql.org/docs/18/ecpg-pgtypes.html

**Contents:**
- 34.6. pgtypes Library #
  - 34.6.1. Character Strings #
  - 34.6.2. The numeric Type #
  - 34.6.3. The date Type #
  - 34.6.4. The timestamp Type #
  - 34.6.5. The interval Type #
  - 34.6.6. The decimal Type #
  - 34.6.7. errno Values of pgtypeslib #
  - 34.6.8. Special Constants of pgtypeslib #

The pgtypes library maps PostgreSQL database types to C equivalents that can be used in C programs. It also offers functions to do basic calculations with those types within C, i.e., without the help of the PostgreSQL server. See the following example:

Some functions such as PGTYPESnumeric_to_asc return a pointer to a freshly allocated character string. These results should be freed with PGTYPESchar_free instead of free. (This is important only on Windows, where memory allocation and release sometimes need to be done by the same library.)

The numeric type offers to do calculations with arbitrary precision. See Section 8.1 for the equivalent type in the PostgreSQL server. Because of the arbitrary precision this variable needs to be able to expand and shrink dynamically. That's why you can only create numeric variables on the heap, by means of the PGTYPESnumeric_new and PGTYPESnumeric_free functions. The decimal type, which is similar but limited in precision, can be created on the stack as well as on the heap.

The following functions can be used to work with the numeric type:

Request a pointer to a newly allocated numeric variable.

Free a numeric type, release all of its memory.

Parse a numeric type from its string notation.

Valid formats are for example: -2, .794, +3.44, 592.49E07 or -32.84e-4. If the value could be parsed successfully, a valid pointer is returned, else the NULL pointer. At the moment ECPG always parses the complete string and so it currently does not support to store the address of the first invalid character in *endptr. You can safely set endptr to NULL.

Returns a pointer to a string allocated by malloc that contains the string representation of the numeric type num.

The numeric value will be printed with dscale decimal digits, with rounding applied if necessary. The result must be freed with PGTYPESchar_free().

Add two numeric variables into a third one.

The function adds the variables var1 and var2 into the result variable result. The function returns 0 on success and -1 in case of error.

Subtract two numeric variables and return the result in a third one.

The function subtracts the variable var2 from the variable var1. The result of the operation is stored in the variable result. The function returns 0 on success and -1 in case of error.

Multiply two numeric variables and return the result in a third one.

The function multiplies the variables var1 and var2. The result of the operation is stored in the variable result. The function returns 0 on success and -1 in case of error.

Divide two numeric variables and return the result in a third one.

The function divides the variables var1 by var2. The result of the operation is stored in the variable result. The function returns 0 on success and -1 in case of error.

Compare two numeric variables.

This function compares two numeric variables. In case of error, INT_MAX is returned. On success, the function returns one of three possible results:

1, if var1 is bigger than var2

-1, if var1 is smaller than var2

0, if var1 and var2 are equal

Convert an int variable to a numeric variable.

This function accepts a variable of type signed int and stores it in the numeric variable var. Upon success, 0 is returned and -1 in case of a failure.

Convert a long int variable to a numeric variable.

This function accepts a variable of type signed long int and stores it in the numeric variable var. Upon success, 0 is returned and -1 in case of a failure.

Copy over one numeric variable into another one.

This function copies over the value of the variable that src points to into the variable that dst points to. It returns 0 on success and -1 if an error occurs.

Convert a variable of type double to a numeric.

This function accepts a variable of type double and stores the result in the variable that dst points to. It returns 0 on success and -1 if an error occurs.

Convert a variable of type numeric to double.

The function converts the numeric value from the variable that nv points to into the double variable that dp points to. It returns 0 on success and -1 if an error occurs, including overflow. On overflow, the global variable errno will be set to PGTYPES_NUM_OVERFLOW additionally.

Convert a variable of type numeric to int.

The function converts the numeric value from the variable that nv points to into the integer variable that ip points to. It returns 0 on success and -1 if an error occurs, including overflow. On overflow, the global variable errno will be set to PGTYPES_NUM_OVERFLOW additionally.

Convert a variable of type numeric to long.

The function converts the numeric value from the variable that nv points to into the long integer variable that lp points to. It returns 0 on success and -1 if an error occurs, including overflow and underflow. On overflow, the global variable errno will be set to PGTYPES_NUM_OVERFLOW and on underflow errno will be set to PGTYPES_NUM_UNDERFLOW.

Convert a variable of type numeric to decimal.

The function converts the numeric value from the variable that src points to into the decimal variable that dst points to. It returns 0 on success and -1 if an error occurs, including overflow. On overflow, the global variable errno will be set to PGTYPES_NUM_OVERFLOW additionally.

Convert a variable of type decimal to numeric.

The function converts the decimal value from the variable that src points to into the numeric variable that dst points to. It returns 0 on success and -1 if an error occurs. Since the decimal type is implemented as a limited version of the numeric type, overflow cannot occur with this conversion.

The date type in C enables your programs to deal with data of the SQL type date. See Section 8.5 for the equivalent type in the PostgreSQL server.

The following functions can be used to work with the date type:

Extract the date part from a timestamp.

The function receives a timestamp as its only argument and returns the extracted date part from this timestamp.

Parse a date from its textual representation.

The function receives a C char* string str and a pointer to a C char* string endptr. At the moment ECPG always parses the complete string and so it currently does not support to store the address of the first invalid character in *endptr. You can safely set endptr to NULL.

Note that the function always assumes MDY-formatted dates and there is currently no variable to change that within ECPG.

Table 34.2 shows the allowed input formats.

Table 34.2. Valid Input Formats for PGTYPESdate_from_asc

Return the textual representation of a date variable.

The function receives the date dDate as its only parameter. It will output the date in the form 1999-01-18, i.e., in the YYYY-MM-DD format. The result must be freed with PGTYPESchar_free().

Extract the values for the day, the month and the year from a variable of type date.

The function receives the date d and a pointer to an array of 3 integer values mdy. The variable name indicates the sequential order: mdy[0] will be set to contain the number of the month, mdy[1] will be set to the value of the day and mdy[2] will contain the year.

Create a date value from an array of 3 integers that specify the day, the month and the year of the date.

The function receives the array of the 3 integers (mdy) as its first argument and as its second argument a pointer to a variable of type date that should hold the result of the operation.

Return a number representing the day of the week for a date value.

The function receives the date variable d as its only argument and returns an integer that indicates the day of the week for this date.

Get the current date.

The function receives a pointer to a date variable (d) that it sets to the current date.

Convert a variable of type date to its textual representation using a format mask.

The function receives the date to convert (dDate), the format mask (fmtstring) and the string that will hold the textual representation of the date (outbuf).

On success, 0 is returned and a negative value if an error occurred.

The following literals are the field specifiers you can use:

dd - The number of the day of the month.

mm - The number of the month of the year.

yy - The number of the year as a two digit number.

yyyy - The number of the year as a four digit number.

ddd - The name of the day (abbreviated).

mmm - The name of the month (abbreviated).

All other characters are copied 1:1 to the output string.

Table 34.3 indicates a few possible formats. This will give you an idea of how to use this function. All output lines are based on the same date: November 23, 1959.

Table 34.3. Valid Input Formats for PGTYPESdate_fmt_asc

Use a format mask to convert a C char* string to a value of type date.

The function receives a pointer to the date value that should hold the result of the operation (d), the format mask to use for parsing the date (fmt) and the C char* string containing the textual representation of the date (str). The textual representation is expected to match the format mask. However you do not need to have a 1:1 mapping of the string to the format mask. The function only analyzes the sequential order and looks for the literals yy or yyyy that indicate the position of the year, mm to indicate the position of the month and dd to indicate the position of the day.

Table 34.4 indicates a few possible formats. This will give you an idea of how to use this function.

Table 34.4. Valid Input Formats for rdefmtdate

The timestamp type in C enables your programs to deal with data of the SQL type timestamp. See Section 8.5 for the equivalent type in the PostgreSQL server.

The following functions can be used to work with the timestamp type:

Parse a timestamp from its textual representation into a timestamp variable.

The function receives the string to parse (str) and a pointer to a C char* (endptr). At the moment ECPG always parses the complete string and so it currently does not support to store the address of the first invalid character in *endptr. You can safely set endptr to NULL.

The function returns the parsed timestamp on success. On error, PGTYPESInvalidTimestamp is returned and errno is set to PGTYPES_TS_BAD_TIMESTAMP. See PGTYPESInvalidTimestamp for important notes on this value.

In general, the input string can contain any combination of an allowed date specification, a whitespace character and an allowed time specification. Note that time zones are not supported by ECPG. It can parse them but does not apply any calculation as the PostgreSQL server does for example. Timezone specifiers are silently discarded.

Table 34.5 contains a few examples for input strings.

Table 34.5. Valid Input Formats for PGTYPEStimestamp_from_asc

Converts a date to a C char* string.

The function receives the timestamp tstamp as its only argument and returns an allocated string that contains the textual representation of the timestamp. The result must be freed with PGTYPESchar_free().

Retrieve the current timestamp.

The function retrieves the current timestamp and saves it into the timestamp variable that ts points to.

Convert a timestamp variable to a C char* using a format mask.

The function receives a pointer to the timestamp to convert as its first argument (ts), a pointer to the output buffer (output), the maximal length that has been allocated for the output buffer (str_len) and the format mask to use for the conversion (fmtstr).

Upon success, the function returns 0 and a negative value if an error occurred.

You can use the following format specifiers for the format mask. The format specifiers are the same ones that are used in the strftime function in libc. Any non-format specifier will be copied into the output buffer.

%A - is replaced by national representation of the full weekday name.

%a - is replaced by national representation of the abbreviated weekday name.

%B - is replaced by national representation of the full month name.

%b - is replaced by national representation of the abbreviated month name.

%C - is replaced by (year / 100) as decimal number; single digits are preceded by a zero.

%c - is replaced by national representation of time and date.

%D - is equivalent to %m/%d/%y.

%d - is replaced by the day of the month as a decimal number (01–31).

%E* %O* - POSIX locale extensions. The sequences %Ec %EC %Ex %EX %Ey %EY %Od %Oe %OH %OI %Om %OM %OS %Ou %OU %OV %Ow %OW %Oy are supposed to provide alternative representations.

Additionally %OB implemented to represent alternative months names (used standalone, without day mentioned).

%e - is replaced by the day of month as a decimal number (1–31); single digits are preceded by a blank.

%F - is equivalent to %Y-%m-%d.

%G - is replaced by a year as a decimal number with century. This year is the one that contains the greater part of the week (Monday as the first day of the week).

%g - is replaced by the same year as in %G, but as a decimal number without century (00–99).

%H - is replaced by the hour (24-hour clock) as a decimal number (00–23).

%I - is replaced by the hour (12-hour clock) as a decimal number (01–12).

%j - is replaced by the day of the year as a decimal number (001–366).

%k - is replaced by the hour (24-hour clock) as a decimal number (0–23); single digits are preceded by a blank.

%l - is replaced by the hour (12-hour clock) as a decimal number (1–12); single digits are preceded by a blank.

%M - is replaced by the minute as a decimal number (00–59).

%m - is replaced by the month as a decimal number (01–12).

%n - is replaced by a newline.

%O* - the same as %E*.

%p - is replaced by national representation of either “ante meridiem” or “post meridiem” as appropriate.

%R - is equivalent to %H:%M.

%r - is equivalent to %I:%M:%S %p.

%S - is replaced by the second as a decimal number (00–60).

%s - is replaced by the number of seconds since the Epoch, UTC.

%T - is equivalent to %H:%M:%S

%t - is replaced by a tab.

%U - is replaced by the week number of the year (Sunday as the first day of the week) as a decimal number (00–53).

%u - is replaced by the weekday (Monday as the first day of the week) as a decimal number (1–7).

%V - is replaced by the week number of the year (Monday as the first day of the week) as a decimal number (01–53). If the week containing January 1 has four or more days in the new year, then it is week 1; otherwise it is the last week of the previous year, and the next week is week 1.

%v - is equivalent to %e-%b-%Y.

%W - is replaced by the week number of the year (Monday as the first day of the week) as a decimal number (00–53).

%w - is replaced by the weekday (Sunday as the first day of the week) as a decimal number (0–6).

%X - is replaced by national representation of the time.

%x - is replaced by national representation of the date.

%Y - is replaced by the year with century as a decimal number.

%y - is replaced by the year without century as a decimal number (00–99).

%Z - is replaced by the time zone name.

%z - is replaced by the time zone offset from UTC; a leading plus sign stands for east of UTC, a minus sign for west of UTC, hours and minutes follow with two digits each and no delimiter between them (common form for RFC 822 date headers).

%+ - is replaced by national representation of the date and time.

%-* - GNU libc extension. Do not do any padding when performing numerical outputs.

$_* - GNU libc extension. Explicitly specify space for padding.

%0* - GNU libc extension. Explicitly specify zero for padding.

%% - is replaced by %.

Subtract one timestamp from another one and save the result in a variable of type interval.

The function will subtract the timestamp variable that ts2 points to from the timestamp variable that ts1 points to and will store the result in the interval variable that iv points to.

Upon success, the function returns 0 and a negative value if an error occurred.

Parse a timestamp value from its textual representation using a formatting mask.

The function receives the textual representation of a timestamp in the variable str as well as the formatting mask to use in the variable fmt. The result will be stored in the variable that d points to.

If the formatting mask fmt is NULL, the function will fall back to the default formatting mask which is %Y-%m-%d %H:%M:%S.

This is the reverse function to PGTYPEStimestamp_fmt_asc. See the documentation there in order to find out about the possible formatting mask entries.

Add an interval variable to a timestamp variable.

The function receives a pointer to a timestamp variable tin and a pointer to an interval variable span. It adds the interval to the timestamp and saves the resulting timestamp in the variable that tout points to.

Upon success, the function returns 0 and a negative value if an error occurred.

Subtract an interval variable from a timestamp variable.

The function subtracts the interval variable that span points to from the timestamp variable that tin points to and saves the result into the variable that tout points to.

Upon success, the function returns 0 and a negative value if an error occurred.

The interval type in C enables your programs to deal with data of the SQL type interval. See Section 8.5 for the equivalent type in the PostgreSQL server.

The following functions can be used to work with the interval type:

Return a pointer to a newly allocated interval variable.

Release the memory of a previously allocated interval variable.

Parse an interval from its textual representation.

The function parses the input string str and returns a pointer to an allocated interval variable. At the moment ECPG always parses the complete string and so it currently does not support to store the address of the first invalid character in *endptr. You can safely set endptr to NULL.

Convert a variable of type interval to its textual representation.

The function converts the interval variable that span points to into a C char*. The output looks like this example: @ 1 day 12 hours 59 mins 10 secs. The result must be freed with PGTYPESchar_free().

Copy a variable of type interval.

The function copies the interval variable that intvlsrc points to into the variable that intvldest points to. Note that you need to allocate the memory for the destination variable before.

The decimal type is similar to the numeric type. However it is limited to a maximum precision of 30 significant digits. In contrast to the numeric type which can be created on the heap only, the decimal type can be created either on the stack or on the heap (by means of the functions PGTYPESdecimal_new and PGTYPESdecimal_free). There are a lot of other functions that deal with the decimal type in the Informix compatibility mode described in Section 34.15.

The following functions can be used to work with the decimal type and are not only contained in the libcompat library.

Request a pointer to a newly allocated decimal variable.

Free a decimal type, release all of its memory.

An argument should contain a numeric variable (or point to a numeric variable) but in fact its in-memory representation was invalid.

An overflow occurred. Since the numeric type can deal with almost arbitrary precision, converting a numeric variable into other types might cause overflow.

An underflow occurred. Since the numeric type can deal with almost arbitrary precision, converting a numeric variable into other types might cause underflow.

A division by zero has been attempted.

An invalid date string was passed to the PGTYPESdate_from_asc function.

Invalid arguments were passed to the PGTYPESdate_defmt_asc function.

An invalid token in the input string was found by the PGTYPESdate_defmt_asc function.

An invalid interval string was passed to the PGTYPESinterval_from_asc function, or an invalid interval value was passed to the PGTYPESinterval_to_asc function.

There was a mismatch in the day/month/year assignment in the PGTYPESdate_defmt_asc function.

An invalid day of the month value was found by the PGTYPESdate_defmt_asc function.

An invalid month value was found by the PGTYPESdate_defmt_asc function.

An invalid timestamp string pass passed to the PGTYPEStimestamp_from_asc function, or an invalid timestamp value was passed to the PGTYPEStimestamp_to_asc function.

An infinite timestamp value was encountered in a context that cannot handle it.

*(continued...)*
---

