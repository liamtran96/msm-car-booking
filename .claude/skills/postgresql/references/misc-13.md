# PostgreSQL - Misc (Part 13)

## 4. Further Information #


**URL:** https://www.postgresql.org/docs/18/resources.html

**Contents:**
- 4. Further Information #

Besides the documentation, that is, this book, there are other resources about PostgreSQL:

The PostgreSQL wiki contains the project's FAQ (Frequently Asked Questions) list, TODO list, and detailed information about many more topics.

The PostgreSQL web site carries details on the latest release and other information to make your work or play with PostgreSQL more productive.

The mailing lists are a good place to have your questions answered, to share experiences with other users, and to contact the developers. Consult the PostgreSQL web site for details.

PostgreSQL is an open-source project. As such, it depends on the user community for ongoing support. As you begin to use PostgreSQL, you will rely on others for help, either through the documentation or through the mailing lists. Consider contributing your knowledge back. Read the mailing lists and answer questions. If you learn something which is not in the documentation, write it up and contribute it. If you add features to the code, contribute them.

---


---

## 


**URL:** https://www.postgresql.org/docs/18/spi-spi-getnspname.html

**Contents:**
- SPI_getnspname
- Synopsis
- Description
- Arguments
- Return Value

SPI_getnspname — return the namespace of the specified relation

SPI_getnspname returns a copy of the name of the namespace that the specified Relation belongs to. This is equivalent to the relation's schema. You should pfree the return value of this function when you are finished with it.

The name of the specified relation's namespace.

**Examples:**

Example 1 (unknown):
```unknown
SPI_getnspname
```

Example 2 (unknown):
```unknown
Relation rel
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-exec.html

**Contents:**
- dblink_exec
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_exec — executes a command in a remote database

dblink_exec executes a command (that is, any SQL statement that doesn't return rows) in a remote database.

When two text arguments are given, the first one is first looked up as a persistent connection's name; if found, the command is executed on that connection. If not found, the first argument is treated as a connection info string as for dblink_connect, and the indicated connection is made just for the duration of this command.

Name of the connection to use; omit this parameter to use the unnamed connection.

A connection info string, as previously described for dblink_connect.

The SQL command that you wish to execute in the remote database, for example insert into foo values(0, 'a', '{"a0","b0","c0"}').

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function's return value is set to ERROR.

Returns status, either the command's status string or ERROR.

**Examples:**

Example 1 (unknown):
```unknown
dblink_exec
```

Example 2 (unknown):
```unknown
dblink_connect
```

Example 3 (unknown):
```unknown
dblink_connect
```

Example 4 (sql):
```sql
insert into foo values(0, 'a', '{"a0","b0","c0"}')
```

---


---

## 5. Bug Reporting Guidelines #


**URL:** https://www.postgresql.org/docs/18/bug-reporting.html

**Contents:**
- 5. Bug Reporting Guidelines #
  - 5.1. Identifying Bugs #
  - 5.2. What to Report #
  - Note
  - Note
  - 5.3. Where to Report Bugs #
  - Note

When you find a bug in PostgreSQL we want to hear about it. Your bug reports play an important part in making PostgreSQL more reliable because even the utmost care cannot guarantee that every part of PostgreSQL will work on every platform under every circumstance.

The following suggestions are intended to assist you in forming bug reports that can be handled in an effective fashion. No one is required to follow them but doing so tends to be to everyone's advantage.

We cannot promise to fix every bug right away. If the bug is obvious, critical, or affects a lot of users, chances are good that someone will look into it. It could also happen that we tell you to update to a newer version to see if the bug happens there. Or we might decide that the bug cannot be fixed before some major rewrite we might be planning is done. Or perhaps it is simply too hard and there are more important things on the agenda. If you need help immediately, consider obtaining a commercial support contract.

Before you report a bug, please read and re-read the documentation to verify that you can really do whatever it is you are trying. If it is not clear from the documentation whether you can do something or not, please report that too; it is a bug in the documentation. If it turns out that a program does something different from what the documentation says, that is a bug. That might include, but is not limited to, the following circumstances:

A program terminates with a fatal signal or an operating system error message that would point to a problem in the program. (A counterexample might be a “disk full” message, since you have to fix that yourself.)

A program produces the wrong output for any given input.

A program refuses to accept valid input (as defined in the documentation).

A program accepts invalid input without a notice or error message. But keep in mind that your idea of invalid input might be our idea of an extension or compatibility with traditional practice.

PostgreSQL fails to compile, build, or install according to the instructions on supported platforms.

Here “program” refers to any executable, not only the backend process.

Being slow or resource-hogging is not necessarily a bug. Read the documentation or ask on one of the mailing lists for help in tuning your applications. Failing to comply to the SQL standard is not necessarily a bug either, unless compliance for the specific feature is explicitly claimed.

Before you continue, check on the TODO list and in the FAQ to see if your bug is already known. If you cannot decode the information on the TODO list, report your problem. The least we can do is make the TODO list clearer.

The most important thing to remember about bug reporting is to state all the facts and only facts. Do not speculate what you think went wrong, what “it seemed to do”, or which part of the program has a fault. If you are not familiar with the implementation you would probably guess wrong and not help us a bit. And even if you are, educated explanations are a great supplement to but no substitute for facts. If we are going to fix the bug we still have to see it happen for ourselves first. Reporting the bare facts is relatively straightforward (you can probably copy and paste them from the screen) but all too often important details are left out because someone thought it does not matter or the report would be understood anyway.

The following items should be contained in every bug report:

The exact sequence of steps from program start-up necessary to reproduce the problem. This should be self-contained; it is not enough to send in a bare SELECT statement without the preceding CREATE TABLE and INSERT statements, if the output should depend on the data in the tables. We do not have the time to reverse-engineer your database schema, and if we are supposed to make up our own data we would probably miss the problem.

The best format for a test case for SQL-related problems is a file that can be run through the psql frontend that shows the problem. (Be sure to not have anything in your ~/.psqlrc start-up file.) An easy way to create this file is to use pg_dump to dump out the table declarations and data needed to set the scene, then add the problem query. You are encouraged to minimize the size of your example, but this is not absolutely necessary. If the bug is reproducible, we will find it either way.

If your application uses some other client interface, such as PHP, then please try to isolate the offending queries. We will probably not set up a web server to reproduce your problem. In any case remember to provide the exact input files; do not guess that the problem happens for “large files” or “midsize databases”, etc. since this information is too inexact to be of use.

The output you got. Please do not say that it “didn't work” or “crashed”. If there is an error message, show it, even if you do not understand it. If the program terminates with an operating system error, say which. If nothing at all happens, say so. Even if the result of your test case is a program crash or otherwise obvious it might not happen on our platform. The easiest thing is to copy the output from the terminal, if possible.

If you are reporting an error message, please obtain the most verbose form of the message. In psql, say \set VERBOSITY verbose beforehand. If you are extracting the message from the server log, set the run-time parameter log_error_verbosity to verbose so that all details are logged.

In case of fatal errors, the error message reported by the client might not contain all the information available. Please also look at the log output of the database server. If you do not keep your server's log output, this would be a good time to start doing so.

The output you expected is very important to state. If you just write “This command gives me that output.” or “This is not what I expected.”, we might run it ourselves, scan the output, and think it looks OK and is exactly what we expected. We should not have to spend the time to decode the exact semantics behind your commands. Especially refrain from merely saying that “This is not what SQL says/Oracle does.” Digging out the correct behavior from SQL is not a fun undertaking, nor do we all know how all the other relational databases out there behave. (If your problem is a program crash, you can obviously omit this item.)

Any command line options and other start-up options, including any relevant environment variables or configuration files that you changed from the default. Again, please provide exact information. If you are using a prepackaged distribution that starts the database server at boot time, you should try to find out how that is done.

Anything you did at all differently from the installation instructions.

The PostgreSQL version. You can run the command SELECT version(); to find out the version of the server you are connected to. Most executable programs also support a --version option; at least postgres --version and psql --version should work. If the function or the options do not exist then your version is more than old enough to warrant an upgrade. If you run a prepackaged version, such as RPMs, say so, including any subversion the package might have. If you are talking about a Git snapshot, mention that, including the commit hash.

If your version is older than 18.1 we will almost certainly tell you to upgrade. There are many bug fixes and improvements in each new release, so it is quite possible that a bug you have encountered in an older release of PostgreSQL has already been fixed. We can only provide limited support for sites using older releases of PostgreSQL; if you require more than we can provide, consider acquiring a commercial support contract.

Platform information. This includes the kernel name and version, C library, processor, memory information, and so on. In most cases it is sufficient to report the vendor and version, but do not assume everyone knows what exactly “Debian” contains or that everyone runs on x86_64. If you have installation problems then information about the toolchain on your machine (compiler, make, and so on) is also necessary.

Do not be afraid if your bug report becomes rather lengthy. That is a fact of life. It is better to report everything the first time than us having to squeeze the facts out of you. On the other hand, if your input files are huge, it is fair to ask first whether somebody is interested in looking into it. Here is an article that outlines some more tips on reporting bugs.

Do not spend all your time to figure out which changes in the input make the problem go away. This will probably not help solving it. If it turns out that the bug cannot be fixed right away, you will still have time to find and share your work-around. Also, once again, do not waste your time guessing why the bug exists. We will find that out soon enough.

When writing a bug report, please avoid confusing terminology. The software package in total is called “PostgreSQL”, sometimes “Postgres” for short. If you are specifically talking about the backend process, mention that, do not just say “PostgreSQL crashes”. A crash of a single backend process is quite different from crash of the parent “postgres” process; please don't say “the server crashed” when you mean a single backend process went down, nor vice versa. Also, client programs such as the interactive frontend “psql” are completely separate from the backend. Please try to be specific about whether the problem is on the client or server side.

In general, send bug reports to the bug report mailing list at <pgsql-bugs@lists.postgresql.org>. You are requested to use a descriptive subject for your email message, perhaps parts of the error message.

Another method is to fill in the bug report web-form available at the project's web site. Entering a bug report this way causes it to be mailed to the <pgsql-bugs@lists.postgresql.org> mailing list.

If your bug report has security implications and you'd prefer that it not become immediately visible in public archives, don't send it to pgsql-bugs. Security issues can be reported privately to <security@postgresql.org>.

Do not send bug reports to any of the user mailing lists, such as <pgsql-sql@lists.postgresql.org> or <pgsql-general@lists.postgresql.org>. These mailing lists are for answering user questions, and their subscribers normally do not wish to receive bug reports. More importantly, they are unlikely to fix them.

Also, please do not send reports to the developers' mailing list <pgsql-hackers@lists.postgresql.org>. This list is for discussing the development of PostgreSQL, and it would be nice if we could keep the bug reports separate. We might choose to take up a discussion about your bug report on pgsql-hackers, if the problem needs more review.

If you have a problem with the documentation, the best place to report it is the documentation mailing list <pgsql-docs@lists.postgresql.org>. Please be specific about what part of the documentation you are unhappy with.

If your bug is a portability problem on a non-supported platform, send mail to <pgsql-hackers@lists.postgresql.org>, so we (and you) can work on porting PostgreSQL to your platform.

Due to the unfortunate amount of spam going around, all of the above lists will be moderated unless you are subscribed. That means there will be some delay before the email is delivered. If you wish to subscribe to the lists, please visit https://lists.postgresql.org/ for instructions.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE
```

Example 2 (unknown):
```unknown
\set VERBOSITY verbose
```

Example 3 (sql):
```sql
SELECT version();
```

Example 4 (unknown):
```unknown
postgres --version
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/vacuumlo.html

**Contents:**
- vacuumlo
- Synopsis
- Description
- Options
- Environment
- Notes
- Author

vacuumlo — remove orphaned large objects from a PostgreSQL database

vacuumlo [option...] dbname...

vacuumlo is a simple utility program that will remove any “orphaned” large objects from a PostgreSQL database. An orphaned large object (LO) is considered to be any LO whose OID does not appear in any oid or lo data column of the database.

If you use this, you may also be interested in the lo_manage trigger in the lo module. lo_manage is useful to try to avoid creating orphaned LOs in the first place.

All databases named on the command line are processed.

vacuumlo accepts the following command-line arguments:

Remove no more than limit large objects per transaction (default 1000). Since the server acquires a lock per LO removed, removing too many LOs in one transaction risks exceeding max_locks_per_transaction. Set the limit to zero if you want all removals done in a single transaction.

Don't remove anything, just show what would be done.

Write a lot of progress messages.

Print the vacuumlo version and exit.

Show help about vacuumlo command line arguments, and exit.

vacuumlo also accepts the following command-line arguments for connection parameters:

Database server's host.

Database server's port.

User name to connect as.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force vacuumlo to prompt for a password before connecting to a database.

This option is never essential, since vacuumlo will automatically prompt for a password if the server demands password authentication. However, vacuumlo will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

Default connection parameters.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

vacuumlo works by the following method: First, vacuumlo builds a temporary table which contains all of the OIDs of the large objects in the selected database. It then scans through all columns in the database that are of type oid or lo, and removes matching entries from the temporary table. (Note: Only types with these names are considered; in particular, domains over them are not considered.) The remaining entries in the temporary table identify orphaned LOs. These are removed.

Peter Mount <peter@retep.org.uk>

**Examples:**

Example 1 (unknown):
```unknown
--limit=limit
```

Example 2 (unknown):
```unknown
--host=host
```

Example 3 (unknown):
```unknown
--port=port
```

Example 4 (unknown):
```unknown
-U username
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-get-notify.html

**Contents:**
- dblink_get_notify
- Synopsis
- Description
- Arguments
- Return Value
- Examples

dblink_get_notify — retrieve async notifications on a connection

dblink_get_notify retrieves notifications on either the unnamed connection, or on a named connection if specified. To receive notifications via dblink, LISTEN must first be issued, using dblink_exec. For details see LISTEN and NOTIFY.

The name of a named connection to get notifications on.

Returns setof (notify_name text, be_pid int, extra text), or an empty set if none.

**Examples:**

Example 1 (unknown):
```unknown
dblink_get_notify
```

Example 2 (unknown):
```unknown
dblink_exec
```

Example 3 (unknown):
```unknown
setof (notify_name text, be_pid int, extra text)
```

Example 4 (sql):
```sql
SELECT dblink_exec('LISTEN virtual');
 dblink_exec
-------------
 LISTEN
(1 row)

SELECT * FROM dblink_get_notify();
 notify_name | be_pid | extra
-------------+--------+-------
(0 rows)

NOTIFY virtual;
NOTIFY

SELECT * FROM dblink_get_notify();
 notify_name | be_pid | extra
-------------+--------+-------
 virtual     |   1229 |
(1 row)
```

---


---

