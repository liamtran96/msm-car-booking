# PostgreSQL - Client Apps (Part 6)

##  (continued)
The number of rows returned or affected by the last SQL query, or 0 if the query failed or did not report a row count.

The server's version number as a string, for example 9.6.2, 10.1 or 11beta1, and in numeric form, for example 90602 or 100001. These are set every time you connect to a database (including program start-up), but can be changed or unset.

The service name, if applicable.

true if the last shell command failed, false if it succeeded. This applies to shell commands invoked via the \!, \g, \o, \w, and \copy meta-commands, as well as backquote (`) expansion. Note that for \o, this variable is updated when the output pipe is closed by the next \o command. See also SHELL_EXIT_CODE.

The exit status returned by the last shell command. 0–127 represent program exit codes, 128–255 indicate termination by a signal, and -1 indicates failure to launch a program or to collect its exit status. This applies to shell commands invoked via the \!, \g, \o, \w, and \copy meta-commands, as well as backquote (`) expansion. Note that for \o, this variable is updated when the output pipe is closed by the next \o command. See also SHELL_ERROR.

When this variable is set to off, only the last result of a combined query (\;) is shown instead of all of them. The default is on. The off behavior is for compatibility with older versions of psql.

This variable can be set to the values never, errors, or always to control whether CONTEXT fields are displayed in messages from the server. The default is errors (meaning that context will be shown in error messages, but not in notice or warning messages). This setting has no effect when VERBOSITY is set to terse or sqlstate. (See also \errverbose, for use when you want a verbose version of the error you just got.)

Setting this variable to on is equivalent to the command line option -S.

Setting this variable to on is equivalent to the command line option -s.

The error code (see Appendix A) associated with the last SQL query's failure, or 00000 if it succeeded.

The database user you are currently connected as. This is set every time you connect to a database (including program start-up), but can be changed or unset.

This variable can be set to the values default, verbose, terse, or sqlstate to control the verbosity of error reports. (See also \errverbose, for use when you want a verbose version of the error you just got.)

These variables are set at program start-up to reflect psql's version, respectively as a verbose string, a short string (e.g., 9.6.2, 10.1, or 11beta1), and a number (e.g., 90602 or 100001). They can be changed or unset.

This variable sets the default interval, in seconds, which \watch waits between executing the query. The default is 2 seconds. Specifying an interval in the command overrides this variable.

A key feature of psql variables is that you can substitute (“interpolate”) them into regular SQL statements, as well as the arguments of meta-commands. Furthermore, psql provides facilities for ensuring that variable values used as SQL literals and identifiers are properly quoted. The syntax for interpolating a value without any quoting is to prepend the variable name with a colon (:). For example,

would query the table my_table. Note that this may be unsafe: the value of the variable is copied literally, so it can contain unbalanced quotes, or even backslash commands. You must make sure that it makes sense where you put it.

When a value is to be used as an SQL literal or identifier, it is safest to arrange for it to be quoted. To quote the value of a variable as an SQL literal, write a colon followed by the variable name in single quotes. To quote the value as an SQL identifier, write a colon followed by the variable name in double quotes. These constructs deal correctly with quotes and other special characters embedded within the variable value. The previous example would be more safely written this way:

Variable interpolation will not be performed within quoted SQL literals and identifiers. Therefore, a construction such as ':foo' doesn't work to produce a quoted literal from a variable's value (and it would be unsafe if it did work, since it wouldn't correctly handle quotes embedded in the value).

One example use of this mechanism is to copy the contents of a file into a table column. First load the file into a variable and then interpolate the variable's value as a quoted string:

(Note that this still won't work if my_file.txt contains NUL bytes. psql does not support embedded NUL bytes in variable values.)

Since colons can legally appear in SQL commands, an apparent attempt at interpolation (that is, :name, :'name', or :"name") is not replaced unless the named variable is currently set. In any case, you can escape a colon with a backslash to protect it from substitution.

The :{?name} special syntax returns TRUE or FALSE depending on whether the variable exists or not, and is thus always substituted, unless the colon is backslash-escaped.

The colon syntax for variables is standard SQL for embedded query languages, such as ECPG. The colon syntaxes for array slices and type casts are PostgreSQL extensions, which can sometimes conflict with the standard usage. The colon-quote syntax for escaping a variable's value as an SQL literal or identifier is a psql extension.

The prompts psql issues can be customized to your preference. The three variables PROMPT1, PROMPT2, and PROMPT3 contain strings and special escape sequences that describe the appearance of the prompt. Prompt 1 is the normal prompt that is issued when psql requests a new command. Prompt 2 is issued when more input is expected during command entry, for example because the command was not terminated with a semicolon or a quote was not closed. Prompt 3 is issued when you are running an SQL COPY FROM STDIN command and you need to type in a row value on the terminal.

The value of the selected prompt variable is printed literally, except where a percent sign (%) is encountered. Depending on the next character, certain other text is substituted instead. Defined substitutions are:

The full host name (with domain name) of the database server, or [local] if the connection is over a Unix domain socket, or [local:/dir/name], if the Unix domain socket is not at the compiled in default location.

The host name of the database server, truncated at the first dot, or [local] if the connection is over a Unix domain socket.

The port number at which the database server is listening.

The database session user name. (The expansion of this value might change during a database session as the result of the command SET SESSION AUTHORIZATION.)

The name of the service.

The name of the current database.

Like %/, but the output is ~ (tilde) if the database is your default database.

If the session user is a database superuser, then a #, otherwise a >. (The expansion of this value might change during a database session as the result of the command SET SESSION AUTHORIZATION.)

The process ID of the backend currently connected to.

Pipeline status: off when not in a pipeline, on when in an ongoing pipeline or abort when in an aborted pipeline.

In prompt 1 normally =, but @ if the session is in an inactive branch of a conditional block, or ^ if in single-line mode, or ! if the session is disconnected from the database (which can happen if \connect fails). In prompt 2 %R is replaced by a character that depends on why psql expects more input: - if the command simply wasn't terminated yet, but * if there is an unfinished /* ... */ comment, a single quote if there is an unfinished quoted string, a double quote if there is an unfinished quoted identifier, a dollar sign if there is an unfinished dollar-quoted string, or ( if there is an unmatched left parenthesis. In prompt 3 %R doesn't produce anything.

Transaction status: an empty string when not in a transaction block, or * when in a transaction block, or ! when in a failed transaction block, or ? when the transaction state is indeterminate (for example, because there is no connection).

The line number inside the current statement, starting from 1.

The character with the indicated octal code is substituted.

The value of the psql variable name. See Variables, above, for details.

The output of command, similar to ordinary “back-tick” substitution.

Prompts can contain terminal control characters which, for example, change the color, background, or style of the prompt text, or change the title of the terminal window. In order for the line editing features of Readline to work properly, these non-printing control characters must be designated as invisible by surrounding them with %[ and %]. Multiple pairs of these can occur within the prompt. For example:

results in a boldfaced (1;) yellow-on-black (33;40) prompt on VT100-compatible, color-capable terminals.

Whitespace of the same width as the most recent output of PROMPT1. This can be used as a PROMPT2 setting, so that multi-line statements are aligned with the first line, but there is no visible secondary prompt.

To insert a percent sign into your prompt, write %%. The default prompts are '%/%R%x%# ' for prompts 1 and 2, and '>> ' for prompt 3.

This feature was shamelessly plagiarized from tcsh.

psql uses the Readline or libedit library, if available, for convenient line editing and retrieval. The command history is automatically saved when psql exits and is reloaded when psql starts up. Type up-arrow or control-P to retrieve previous lines.

You can also use tab completion to fill in partially-typed keywords and SQL object names in many (by no means all) contexts. For example, at the start of a command, typing ins and pressing TAB will fill in insert into . Then, typing a few characters of a table or schema name and pressing TAB will fill in the unfinished name, or offer a menu of possible completions when there's more than one. (Depending on the library in use, you may need to press TAB more than once to get a menu.)

Tab completion for SQL object names requires sending queries to the server to find possible matches. In some contexts this can interfere with other operations. For example, after BEGIN it will be too late to issue SET TRANSACTION ISOLATION LEVEL if a tab-completion query is issued in between. If you do not want tab completion at all, you can turn it off permanently by putting this in a file named .inputrc in your home directory:

(This is not a psql but a Readline feature. Read its documentation for further details.)

The -n (--no-readline) command line option can also be useful to disable use of Readline for a single run of psql. This prevents tab completion, use or recording of command line history, and editing of multi-line commands. It is particularly useful when you need to copy-and-paste text that contains TAB characters.

If \pset columns is zero, controls the width for the wrapped format and width for determining if wide output requires the pager or should be switched to the vertical format in expanded auto mode.

Default connection parameters (see Section 32.15).

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

Editor used by the \e, \ef, and \ev commands. These variables are examined in the order listed; the first that is set is used. If none of them is set, the default is to use vi on Unix systems or notepad.exe on Windows systems.

When \e, \ef, or \ev is used with a line number argument, this variable specifies the command-line argument used to pass the starting line number to the user's editor. For editors such as Emacs or vi, this is a plus sign. Include a trailing space in the value of the variable if there needs to be space between the option name and the line number. Examples:

The default is + on Unix systems (corresponding to the default editor vi, and useful for many other common editors); but there is no default on Windows systems.

Alternative location for the command history file. Tilde (~) expansion is performed.

If a query's results do not fit on the screen, they are piped through this command. Typical values are more or less. Use of the pager can be disabled by setting PSQL_PAGER or PAGER to an empty string, or by adjusting the pager-related options of the \pset command. These variables are examined in the order listed; the first that is set is used. If neither of them is set, the default is to use more on most platforms, but less on Cygwin.

When a query is executed repeatedly with the \watch command, a pager is not used by default. This behavior can be changed by setting PSQL_WATCH_PAGER to a pager command, on Unix systems. The pspg pager (not part of PostgreSQL but available in many open source software distributions) can display the output of \watch if started with the option --stream.

Alternative location of the user's .psqlrc file. Tilde (~) expansion is performed.

Command executed by the \! command.

Directory for storing temporary files. The default is /tmp.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

Unless it is passed an -X option, psql attempts to read and execute commands from the system-wide startup file (psqlrc) and then the user's personal startup file (~/.psqlrc), after connecting to the database but before accepting normal commands. These files can be used to set up the client and/or the server to taste, typically with \set and SET commands.

The system-wide startup file is named psqlrc. By default it is sought in the installation's “system configuration” directory, which is most reliably identified by running pg_config --sysconfdir. Typically this directory will be ../etc/ relative to the directory containing the PostgreSQL executables. The directory to look in can be set explicitly via the PGSYSCONFDIR environment variable.

The user's personal startup file is named .psqlrc and is sought in the invoking user's home directory. On Windows the personal startup file is instead named %APPDATA%\postgresql\psqlrc.conf. In either case, this default file path can be overridden by setting the PSQLRC environment variable.

Both the system-wide startup file and the user's personal startup file can be made psql-version-specific by appending a dash and the PostgreSQL major or minor release identifier to the file name, for example ~/.psqlrc-18 or ~/.psqlrc-18.1. The most specific version-matching file will be read in preference to a non-version-specific file. These version suffixes are added after determining the file path as explained above.

The command-line history is stored in the file ~/.psql_history, or %APPDATA%\postgresql\psql_history on Windows.

The location of the history file can be set explicitly via the HISTFILE psql variable or the PSQL_HISTORY environment variable.

psql works best with servers of the same or an older major version. Backslash commands are particularly likely to fail if the server is of a newer version than psql itself. However, backslash commands of the \d family should work with servers of versions back to 9.2, though not necessarily with servers newer than psql itself. The general functionality of running SQL commands and displaying query results should also work with servers of a newer major version, but this cannot be guaranteed in all cases.

If you want to use psql to connect to several servers of different major versions, it is recommended that you use the newest version of psql. Alternatively, you can keep around a copy of psql from each major version and be sure to use the version that matches the respective server. But in practice, this additional complication should not be necessary.

Before PostgreSQL 9.6, the -c option implied -X (--no-psqlrc); this is no longer the case.

Before PostgreSQL 8.4, psql allowed the first argument of a single-letter backslash command to start directly after the command, without intervening whitespace. Now, some whitespace is required.

psql is built as a “console application”. Since the Windows console windows use a different encoding than the rest of the system, you must take special care when using 8-bit characters within psql. If psql detects a problematic console code page, it will warn you at startup. To change the console code page, two things are necessary:

Set the code page by entering cmd.exe /c chcp 1252. (1252 is a code page that is appropriate for German; replace it with your value.) If you are using Cygwin, you can put this command in /etc/profile.

Set the console font to Lucida Console, because the raster font does not work with the ANSI code page.

The first example shows how to spread a command over several lines of input. Notice the changing prompt:

Now look at the table definition again:

Now we change the prompt to something more interesting:

Let's assume you have filled the table with data and want to take a look at it:

You can display tables in different ways by using the \pset command:

Alternatively, use the short commands:

Also, these output format options can be set for just one query by using \g:

Here is an example of using the \df command to find only functions with names matching int*pl and whose second argument is of type bigint:

Here, the + option is used to display additional information about one of these functions, and x is used to display the results in expanded mode:

When suitable, query results can be shown in a crosstab representation with the \crosstabview command:

This second example shows a multiplication table with rows sorted in reverse numerical order and columns with an independent, ascending numerical order.

**Examples:**

Example 1 (unknown):
```unknown
\pset format unaligned
```

Example 2 (unknown):
```unknown
--echo-errors
```

Example 3 (unknown):
```unknown
--command=command
```

Example 4 (sql):
```sql
psql -c '\x' -c 'SELECT * FROM foo;'
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-createdb.html

**Contents:**
- createdb
- Synopsis
- Description
- Options
- Environment
- Diagnostics
- Examples
- See Also

createdb — create a new PostgreSQL database

createdb [connection-option...] [option...] [dbname [description]]

createdb creates a new PostgreSQL database.

Normally, the database user who executes this command becomes the owner of the new database. However, a different owner can be specified via the -O option, if the executing user has appropriate privileges.

createdb is a wrapper around the SQL command CREATE DATABASE. There is no effective difference between creating databases via this utility and via other methods for accessing the server.

createdb accepts the following command-line arguments:

Specifies the name of the database to be created. The name must be unique among all PostgreSQL databases in this cluster. The default is to create a database with the same name as the current system user.

Specifies a comment to be associated with the newly created database.

Specifies the default tablespace for the database. (This name is processed as a double-quoted identifier.)

Echo the commands that createdb generates and sends to the server.

Specifies the character encoding scheme to be used in this database. The character sets supported by the PostgreSQL server are described in Section 23.3.1.

Specifies the locale to be used in this database. This is equivalent to specifying --lc-collate, --lc-ctype, and --icu-locale to the same value. Some locales are only valid for ICU and must be set with --icu-locale.

Specifies the LC_COLLATE setting to be used in this database.

Specifies the LC_CTYPE setting to be used in this database.

Specifies the locale name when the builtin provider is used. Locale support is described in Section 23.1.

Specifies the ICU locale ID to be used in this database, if the ICU locale provider is selected.

Specifies additional collation rules to customize the behavior of the default collation of this database. This is supported for ICU only.

Specifies the locale provider for the database's default collation.

Specifies the database user who will own the new database. (This name is processed as a double-quoted identifier.)

Specifies the database creation strategy. See CREATE DATABASE STRATEGY for more details.

Specifies the template database from which to build this database. (This name is processed as a double-quoted identifier.)

Print the createdb version and exit.

Show help about createdb command line arguments, and exit.

The options -D, -l, -E, -O, and -T correspond to options of the underlying SQL command CREATE DATABASE; see there for more information about them.

createdb also accepts the following command-line arguments for connection parameters:

Specifies the host name of the machine on which the server is running. If the value begins with a slash, it is used as the directory for the Unix domain socket.

Specifies the TCP port or the local Unix domain socket file extension on which the server is listening for connections.

User name to connect as.

Never issue a password prompt. If the server requires password authentication and a password is not available by other means such as a .pgpass file, the connection attempt will fail. This option can be useful in batch jobs and scripts where no user is present to enter a password.

Force createdb to prompt for a password before connecting to a database.

This option is never essential, since createdb will automatically prompt for a password if the server demands password authentication. However, createdb will waste a connection attempt finding out that the server wants a password. In some cases it is worth typing -W to avoid the extra connection attempt.

Specifies the name of the database to connect to when creating the new database. If not specified, the postgres database will be used; if that does not exist (or if it is the name of the new database being created), template1 will be used. This can be a connection string. If so, connection string parameters will override any conflicting command line options.

If set, the name of the database to create, unless overridden on the command line.

Default connection parameters. PGUSER also determines the name of the database to create, if it is not specified on the command line or by PGDATABASE.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

This utility, like most other PostgreSQL utilities, also uses the environment variables supported by libpq (see Section 32.15).

In case of difficulty, see CREATE DATABASE and psql for discussions of potential problems and error messages. The database server must be running at the targeted host. Also, any default connection settings and environment variables used by the libpq front-end library will apply.

To create the database demo using the default database server:

To create the database demo using the server on host eden, port 5000, using the template0 template database, here is the command-line command and the underlying SQL command:

**Examples:**

Example 1 (unknown):
```unknown
connection-option
```

Example 2 (unknown):
```unknown
description
```

Example 3 (unknown):
```unknown
CREATE DATABASE
```

Example 4 (unknown):
```unknown
description
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/app-pgcontroldata.html

**Contents:**
- pg_controldata
- Synopsis
- Description
- Environment

pg_controldata — display control information of a PostgreSQL database cluster

pg_controldata [option] [[ -D | --pgdata ]datadir]

pg_controldata prints information initialized during initdb, such as the catalog version. It also shows information about write-ahead logging and checkpoint processing. This information is cluster-wide, and not specific to any one database.

This utility can only be run by the user who initialized the cluster because it requires read access to the data directory. You can specify the data directory on the command line, or use the environment variable PGDATA. This utility supports the options -V and --version, which print the pg_controldata version and exit. It also supports options -? and --help, which output the supported arguments.

Default data directory location

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

**Examples:**

Example 1 (unknown):
```unknown
pg_controldata
```

Example 2 (unknown):
```unknown
pg_controldata
```

---


---

