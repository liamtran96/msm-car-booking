# PostgreSQL - Contrib Modules (Part 15)

## F.33. pgstattuple — obtain tuple-level statistics #


**URL:** https://www.postgresql.org/docs/18/pgstattuple.html

**Contents:**
- F.33. pgstattuple — obtain tuple-level statistics #
  - F.33.1. Functions #
  - Note
  - F.33.2. Authors #

The pgstattuple module provides various functions to obtain tuple-level statistics.

Because these functions return detailed page-level information, access is restricted by default. By default, only the role pg_stat_scan_tables has EXECUTE privilege. Superusers of course bypass this restriction. After the extension has been installed, users may issue GRANT commands to change the privileges on the functions to allow others to execute them. However, it might be preferable to add those users to the pg_stat_scan_tables role instead.

pgstattuple returns a relation's physical length, percentage of “dead” tuples, and other info. This may help users to determine whether vacuum is necessary or not. The argument is the target relation's name (optionally schema-qualified) or OID. For example:

The output columns are described in Table F.24.

Table F.24. pgstattuple Output Columns

The table_len will always be greater than the sum of the tuple_len, dead_tuple_len and free_space. The difference is accounted for by fixed page overhead, the per-page table of pointers to tuples, and padding to ensure that tuples are correctly aligned.

pgstattuple acquires only a read lock on the relation. So the results do not reflect an instantaneous snapshot; concurrent updates will affect them.

pgstattuple judges a tuple is “dead” if HeapTupleSatisfiesDirty returns false.

This is the same as pgstattuple(regclass), except that the target relation is specified as TEXT. This function is kept because of backward-compatibility so far, and will be deprecated in some future release.

pgstatindex returns a record showing information about a B-tree index. For example:

The output columns are:

The reported index_size will normally correspond to one more page than is accounted for by internal_pages + leaf_pages + empty_pages + deleted_pages, because it also includes the index's metapage.

As with pgstattuple, the results are accumulated page-by-page, and should not be expected to represent an instantaneous snapshot of the whole index.

This is the same as pgstatindex(regclass), except that the target index is specified as TEXT. This function is kept because of backward-compatibility so far, and will be deprecated in some future release.

pgstatginindex returns a record showing information about a GIN index. For example:

The output columns are:

pgstathashindex returns a record showing information about a HASH index. For example:

The output columns are:

pg_relpages returns the number of pages in the relation.

This is the same as pg_relpages(regclass), except that the target relation is specified as TEXT. This function is kept because of backward-compatibility so far, and will be deprecated in some future release.

pgstattuple_approx is a faster alternative to pgstattuple that returns approximate results. The argument is the target relation's name or OID. For example:

The output columns are described in Table F.25.

Whereas pgstattuple always performs a full-table scan and returns an exact count of live and dead tuples (and their sizes) and free space, pgstattuple_approx tries to avoid the full-table scan and returns exact dead tuple statistics along with an approximation of the number and size of live tuples and free space.

It does this by skipping pages that have only visible tuples according to the visibility map (if a page has the corresponding VM bit set, then it is assumed to contain no dead tuples). For such pages, it derives the free space value from the free space map, and assumes that the rest of the space on the page is taken up by live tuples.

For pages that cannot be skipped, it scans each tuple, recording its presence and size in the appropriate counters, and adding up the free space on the page. At the end, it estimates the total number of live tuples based on the number of pages and tuples scanned (in the same way that VACUUM estimates pg_class.reltuples).

Table F.25. pgstattuple_approx Output Columns

In the above output, the free space figures may not match the pgstattuple output exactly, because the free space map gives us an exact figure, but is not guaranteed to be accurate to the byte.

Tatsuo Ishii, Satoshi Nagayasu and Abhijit Menon-Sen

**Examples:**

Example 1 (unknown):
```unknown
pgstattuple
```

Example 2 (unknown):
```unknown
pg_stat_scan_tables
```

Example 3 (unknown):
```unknown
pg_stat_scan_tables
```

Example 4 (unknown):
```unknown
pgstattuple(regclass) returns record
```

---


---

## F.49. uuid-ossp — a UUID generator #


**URL:** https://www.postgresql.org/docs/18/uuid-ossp.html

**Contents:**
- F.49. uuid-ossp — a UUID generator #
  - F.49.1. uuid-ossp Functions #
  - F.49.2. Building uuid-ossp #
  - F.49.3. Author #

The uuid-ossp module provides functions to generate universally unique identifiers (UUIDs) using one of several standard algorithms. There are also functions to produce certain special UUID constants. This module is only necessary for special requirements beyond what is available in core PostgreSQL. See Section 9.14 for built-in ways to generate UUIDs.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Table F.35 shows the functions available to generate UUIDs. The relevant standards ITU-T Rec. X.667, ISO/IEC 9834-8:2005, and RFC 4122 specify four algorithms for generating UUIDs, identified by the version numbers 1, 3, 4, and 5. (There is no version 2 algorithm.) Each of these algorithms could be suitable for a different set of applications.

Table F.35. Functions for UUID Generation

uuid_generate_v1 () → uuid

Generates a version 1 UUID. This involves the MAC address of the computer and a time stamp. Note that UUIDs of this kind reveal the identity of the computer that created the identifier and the time at which it did so, which might make it unsuitable for certain security-sensitive applications.

uuid_generate_v1mc () → uuid

Generates a version 1 UUID, but uses a random multicast MAC address instead of the real MAC address of the computer.

uuid_generate_v3 ( namespace uuid, name text ) → uuid

Generates a version 3 UUID in the given namespace using the specified input name. The namespace should be one of the special constants produced by the uuid_ns_*() functions shown in Table F.36. (It could be any UUID in theory.) The name is an identifier in the selected namespace.

The name parameter will be MD5-hashed, so the cleartext cannot be derived from the generated UUID. The generation of UUIDs by this method has no random or environment-dependent element and is therefore reproducible.

uuid_generate_v4 () → uuid

Generates a version 4 UUID, which is derived entirely from random numbers.

uuid_generate_v5 ( namespace uuid, name text ) → uuid

Generates a version 5 UUID, which works like a version 3 UUID except that SHA-1 is used as a hashing method. Version 5 should be preferred over version 3 because SHA-1 is thought to be more secure than MD5.

Table F.36. Functions Returning UUID Constants

Returns a “nil” UUID constant, which does not occur as a real UUID.

uuid_ns_dns () → uuid

Returns a constant designating the DNS namespace for UUIDs.

uuid_ns_url () → uuid

Returns a constant designating the URL namespace for UUIDs.

uuid_ns_oid () → uuid

Returns a constant designating the ISO object identifier (OID) namespace for UUIDs. (This pertains to ASN.1 OIDs, which are unrelated to the OIDs used in PostgreSQL.)

uuid_ns_x500 () → uuid

Returns a constant designating the X.500 distinguished name (DN) namespace for UUIDs.

Historically this module depended on the OSSP UUID library, which accounts for the module's name. While the OSSP UUID library can still be found at http://www.ossp.org/pkg/lib/uuid/, it is not well maintained, and is becoming increasingly difficult to port to newer platforms. uuid-ossp can now be built without the OSSP library on some platforms. On FreeBSD and some other BSD-derived platforms, suitable UUID creation functions are included in the core libc library. On Linux, macOS, and some other platforms, suitable functions are provided in the libuuid library, which originally came from the e2fsprogs project (though on modern Linux it is considered part of util-linux-ng). When invoking configure, specify --with-uuid=bsd to use the BSD functions, or --with-uuid=e2fs to use e2fsprogs' libuuid, or --with-uuid=ossp to use the OSSP UUID library. More than one of these libraries might be available on a particular machine, so configure does not automatically choose one.

Peter Eisentraut <peter_e@gmx.net>

**Examples:**

Example 1 (unknown):
```unknown
uuid_generate_v1
```

Example 2 (unknown):
```unknown
uuid_generate_v1mc
```

Example 3 (unknown):
```unknown
uuid_generate_v3
```

Example 4 (unknown):
```unknown
uuid_ns_*()
```

---


---

## F.2. auth_delay — pause on authentication failure #


**URL:** https://www.postgresql.org/docs/18/auth-delay.html

**Contents:**
- F.2. auth_delay — pause on authentication failure #
  - F.2.1. Configuration Parameters #
  - F.2.2. Author #

auth_delay causes the server to pause briefly before reporting authentication failure, to make brute-force attacks on database passwords more difficult. Note that it does nothing to prevent denial-of-service attacks, and may even exacerbate them, since processes that are waiting before reporting authentication failure will still consume connection slots.

In order to function, this module must be loaded via shared_preload_libraries in postgresql.conf.

The number of milliseconds to wait before reporting an authentication failure. The default is 0.

These parameters must be set in postgresql.conf. Typical usage might be:

KaiGai Kohei <kaigai@ak.jp.nec.com>

**Examples:**

Example 1 (unknown):
```unknown
postgresql.conf
```

Example 2 (unknown):
```unknown
auth_delay.milliseconds
```

Example 3 (unknown):
```unknown
postgresql.conf
```

Example 4 (markdown):
```markdown
# postgresql.conf
shared_preload_libraries = 'auth_delay'

auth_delay.milliseconds = '500'
```

---


---

## F.44. tcn — a trigger function to notify listeners of changes to table content #


**URL:** https://www.postgresql.org/docs/18/tcn.html

**Contents:**
- F.44. tcn — a trigger function to notify listeners of changes to table content #

The tcn module provides a trigger function that notifies listeners of changes to any table on which it is attached. It must be used as an AFTER trigger FOR EACH ROW.

This module is considered “trusted”, that is, it can be installed by non-superusers who have CREATE privilege on the current database.

Only one parameter may be supplied to the function in a CREATE TRIGGER statement, and that is optional. If supplied it will be used for the channel name for the notifications. If omitted tcn will be used for the channel name.

The payload of the notifications consists of the table name, a letter to indicate which type of operation was performed, and column name/value pairs for primary key columns. Each part is separated from the next by a comma. For ease of parsing using regular expressions, table and column names are always wrapped in double quotes, and data values are always wrapped in single quotes. Embedded quotes are doubled.

A brief example of using the extension follows.

**Examples:**

Example 1 (unknown):
```unknown
FOR EACH ROW
```

Example 2 (unknown):
```unknown
CREATE TRIGGER
```

Example 3 (sql):
```sql
test=# create table tcndata
test-#   (
test(#     a int not null,
test(#     b date not null,
test(#     c text,
test(#     primary key (a, b)
test(#   );
CREATE TABLE
test=# create trigger tcndata_tcn_trigger
test-#   after insert or update or delete on tcndata
test-#   for each row execute function triggered_change_notification();
CREATE TRIGGER
test=# listen tcn;
LISTEN
test=# insert into tcndata values (1, date '2012-12-22', 'one'),
test-#                            (1, date '2012-12-23', 'another'),
test-#                            (2, date '2012-12-23', 'two');
INSERT 0 3
Asynchronous notification "tcn" with payload ""tcndata",I,"a"='1',"b"='2012-12-22'" received from server process with PID 22770.
Asynchronous notification "tcn" with payload ""tcndata",I,"a"='1',"b"='2012-12-23'" received from server process with PID 22770.
Asynchronous notification "tcn" with payload ""tcndata",I,"a"='2',"b"='2012-12-23'" received from server process with PID 22770.
test=# update tcndata set c = 'uno' where a = 1;
UPDATE 2
Asynchronous notification "tcn" with payload ""tcndata",U,"a"='1',"b"='2012-12-22'" received from server process with PID 22770.
Asynchronous notification "tcn" with payload ""tcndata",U,"a"='1',"b"='2012-12-23'" received from server process with PID 22770.
test=# delete from tcndata where a = 1 and b = date '2012-12-22';
DELETE 1
Asynchronous notification "tcn" with payload ""tcndata",D,"a"='1',"b"='2012-12-22'" received from server process with PID 22770.
```

---


---

