# PostgreSQL - Misc (Part 11)

## Index


**URL:** https://www.postgresql.org/docs/18/bookindex.html

**Contents:**
- Index
  - Symbols
  - A
  - B
  - C
  - D
  - E
  - F
  - G
  - H

Symbols | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R | S | T | U | V | W | X | Y | Z

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-cursor-find.html

**Contents:**
- SPI_cursor_find
- Synopsis
- Description
- Arguments
- Return Value
- Notes

SPI_cursor_find — find an existing cursor by name

SPI_cursor_find finds an existing portal by name. This is primarily useful to resolve a cursor name returned as text by some other function.

pointer to the portal with the specified name, or NULL if none was found

Beware that this function can return a Portal object that does not have cursor-like properties; for example it might not return tuples. If you simply pass the Portal pointer to other SPI functions, they can defend themselves against such cases, but caution is appropriate when directly inspecting the Portal.

**Examples:**

Example 1 (unknown):
```unknown
SPI_cursor_find
```

Example 2 (unknown):
```unknown
const char * name
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-returntuple.html

**Contents:**
- SPI_returntuple
- Synopsis
- Description
- Arguments
- Return Value

SPI_returntuple — prepare to return a tuple as a Datum

SPI_returntuple makes a copy of a row in the upper executor context, returning it in the form of a row type Datum. The returned pointer need only be converted to Datum via PointerGetDatum before returning.

This function can only be used while connected to SPI. Otherwise, it returns NULL and sets SPI_result to SPI_ERROR_UNCONNECTED.

Note that this should be used for functions that are declared to return composite types. It is not used for triggers; use SPI_copytuple for returning a modified row in a trigger.

descriptor for row (pass the same descriptor each time for most effective caching)

HeapTupleHeader pointing to copied row, or NULL on error (see SPI_result for an error indication)

**Examples:**

Example 1 (unknown):
```unknown
SPI_returntuple
```

Example 2 (unknown):
```unknown
PointerGetDatum
```

Example 3 (unknown):
```unknown
SPI_ERROR_UNCONNECTED
```

Example 4 (unknown):
```unknown
SPI_copytuple
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-build-sql-update.html

**Contents:**
- dblink_build_sql_update
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_build_sql_update — builds an UPDATE statement using a local tuple, replacing the primary key field values with alternative supplied values

dblink_build_sql_update can be useful in doing selective replication of a local table to a remote database. It selects a row from the local table based on primary key, and then builds an SQL UPDATE command that will duplicate that row, but with the primary key values replaced by the values in the last argument. (To make an exact copy of the row, just specify the same values for the last two arguments.) The UPDATE command always assigns all fields of the row — the main difference between this and dblink_build_sql_insert is that it's assumed that the target row already exists in the remote table.

Name of a local relation, for example foo or myschema.mytab. Include double quotes if the name is mixed-case or contains special characters, for example "FooBar"; without quotes, the string will be folded to lower case.

Attribute numbers (1-based) of the primary key fields, for example 1 2.

The number of primary key fields.

Values of the primary key fields to be used to look up the local tuple. Each field is represented in text form. An error is thrown if there is no local row with these primary key values.

Values of the primary key fields to be placed in the resulting UPDATE command. Each field is represented in text form.

Returns the requested SQL statement as text.

As of PostgreSQL 9.0, the attribute numbers in primary_key_attnums are interpreted as logical column numbers, corresponding to the column's position in SELECT * FROM relname. Previous versions interpreted the numbers as physical column positions. There is a difference if any column(s) to the left of the indicated column have been dropped during the lifetime of the table.

**Examples:**

Example 1 (unknown):
```unknown
dblink_build_sql_update
```

Example 2 (unknown):
```unknown
dblink_build_sql_insert
```

Example 3 (unknown):
```unknown
myschema.mytab
```

Example 4 (unknown):
```unknown
primary_key_attnums
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/pgtesttiming.html

**Contents:**
- pg_test_timing
- Synopsis
- Description
- Options
- Usage
  - Interpreting Results
  - Measuring Executor Timing Overhead
  - Changing Time Sources
  - Clock Hardware and Timing Accuracy
- See Also

pg_test_timing — measure timing overhead

pg_test_timing [option...]

pg_test_timing is a tool to measure the timing overhead on your system and confirm that the system time never moves backwards. Systems that are slow to collect timing data can give less accurate EXPLAIN ANALYZE results.

pg_test_timing accepts the following command-line options:

Specifies the test duration, in seconds. Longer durations give slightly better accuracy, and are more likely to discover problems with the system clock moving backwards. The default test duration is 3 seconds.

Print the pg_test_timing version and exit.

Show help about pg_test_timing command line arguments, and exit.

Good results will show most (>90%) individual timing calls take less than one microsecond. Average per loop overhead will be even lower, below 100 nanoseconds. This example from an Intel i7-860 system using a TSC clock source shows excellent performance:

Note that different units are used for the per loop time than the histogram. The loop can have resolution within a few nanoseconds (ns), while the individual timing calls can only resolve down to one microsecond (us).

When the query executor is running a statement using EXPLAIN ANALYZE, individual operations are timed as well as showing a summary. The overhead of your system can be checked by counting rows with the psql program:

The i7-860 system measured runs the count query in 9.8 ms while the EXPLAIN ANALYZE version takes 16.6 ms, each processing just over 100,000 rows. That 6.8 ms difference means the timing overhead per row is 68 ns, about twice what pg_test_timing estimated it would be. Even that relatively small amount of overhead is making the fully timed count statement take almost 70% longer. On more substantial queries, the timing overhead would be less problematic.

On some newer Linux systems, it's possible to change the clock source used to collect timing data at any time. A second example shows the slowdown possible from switching to the slower acpi_pm time source, on the same system used for the fast results above:

In this configuration, the sample EXPLAIN ANALYZE above takes 115.9 ms. That's 1061 ns of timing overhead, again a small multiple of what's measured directly by this utility. That much timing overhead means the actual query itself is only taking a tiny fraction of the accounted for time, most of it is being consumed in overhead instead. In this configuration, any EXPLAIN ANALYZE totals involving many timed operations would be inflated significantly by timing overhead.

FreeBSD also allows changing the time source on the fly, and it logs information about the timer selected during boot:

Other systems may only allow setting the time source on boot. On older Linux systems the "clock" kernel setting is the only way to make this sort of change. And even on some more recent ones, the only option you'll see for a clock source is "jiffies". Jiffies are the older Linux software clock implementation, which can have good resolution when it's backed by fast enough timing hardware, as in this example:

Collecting accurate timing information is normally done on computers using hardware clocks with various levels of accuracy. With some hardware the operating systems can pass the system clock time almost directly to programs. A system clock can also be derived from a chip that simply provides timing interrupts, periodic ticks at some known time interval. In either case, operating system kernels provide a clock source that hides these details. But the accuracy of that clock source and how quickly it can return results varies based on the underlying hardware.

Inaccurate time keeping can result in system instability. Test any change to the clock source very carefully. Operating system defaults are sometimes made to favor reliability over best accuracy. And if you are using a virtual machine, look into the recommended time sources compatible with it. Virtual hardware faces additional difficulties when emulating timers, and there are often per operating system settings suggested by vendors.

The Time Stamp Counter (TSC) clock source is the most accurate one available on current generation CPUs. It's the preferred way to track the system time when it's supported by the operating system and the TSC clock is reliable. There are several ways that TSC can fail to provide an accurate timing source, making it unreliable. Older systems can have a TSC clock that varies based on the CPU temperature, making it unusable for timing. Trying to use TSC on some older multicore CPUs can give a reported time that's inconsistent among multiple cores. This can result in the time going backwards, a problem this program checks for. And even the newest systems can fail to provide accurate TSC timing with very aggressive power saving configurations.

Newer operating systems may check for the known TSC problems and switch to a slower, more stable clock source when they are seen. If your system supports TSC time but doesn't default to that, it may be disabled for a good reason. And some operating systems may not detect all the possible problems correctly, or will allow using TSC even in situations where it's known to be inaccurate.

The High Precision Event Timer (HPET) is the preferred timer on systems where it's available and TSC is not accurate. The timer chip itself is programmable to allow up to 100 nanosecond resolution, but you may not see that much accuracy in your system clock.

Advanced Configuration and Power Interface (ACPI) provides a Power Management (PM) Timer, which Linux refers to as the acpi_pm. The clock derived from acpi_pm will at best provide 300 nanosecond resolution.

Timers used on older PC hardware include the 8254 Programmable Interval Timer (PIT), the real-time clock (RTC), the Advanced Programmable Interrupt Controller (APIC) timer, and the Cyclone timer. These timers aim for millisecond resolution.

**Examples:**

Example 1 (unknown):
```unknown
pg_test_timing
```

Example 2 (unknown):
```unknown
EXPLAIN ANALYZE
```

Example 3 (unknown):
```unknown
-d duration
```

Example 4 (unknown):
```unknown
--duration=duration
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-send-query.html

**Contents:**
- dblink_send_query
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_send_query — sends an async query to a remote database

dblink_send_query sends a query to be executed asynchronously, that is, without immediately waiting for the result. There must not be an async query already in progress on the connection.

After successfully dispatching an async query, completion status can be checked with dblink_is_busy, and the results are ultimately collected with dblink_get_result. It is also possible to attempt to cancel an active async query using dblink_cancel_query.

Name of the connection to use.

The SQL statement that you wish to execute in the remote database, for example select * from pg_class.

Returns 1 if the query was successfully dispatched, 0 otherwise.

**Examples:**

Example 1 (unknown):
```unknown
dblink_send_query
```

Example 2 (unknown):
```unknown
dblink_is_busy
```

Example 3 (unknown):
```unknown
dblink_get_result
```

Example 4 (unknown):
```unknown
dblink_cancel_query
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-connect-u.html

**Contents:**
- dblink_connect_u
- Synopsis
- Description

dblink_connect_u — opens a persistent connection to a remote database, insecurely

dblink_connect_u() is identical to dblink_connect(), except that it will allow non-superusers to connect using any authentication method.

If the remote server selects an authentication method that does not involve a password, then impersonation and subsequent escalation of privileges can occur, because the session will appear to have originated from the user as which the local PostgreSQL server runs. Also, even if the remote server does demand a password, it is possible for the password to be supplied from the server environment, such as a ~/.pgpass file belonging to the server's user. This opens not only a risk of impersonation, but the possibility of exposing a password to an untrustworthy remote server. Therefore, dblink_connect_u() is initially installed with all privileges revoked from PUBLIC, making it un-callable except by superusers. In some situations it may be appropriate to grant EXECUTE permission for dblink_connect_u() to specific users who are considered trustworthy, but this should be done with care. It is also recommended that any ~/.pgpass file belonging to the server's user not contain any records specifying a wildcard host name.

For further details see dblink_connect().

**Examples:**

Example 1 (unknown):
```unknown
dblink_connect_u()
```

Example 2 (unknown):
```unknown
dblink_connect()
```

Example 3 (unknown):
```unknown
dblink_connect_u()
```

Example 4 (unknown):
```unknown
dblink_connect_u()
```

---


---

