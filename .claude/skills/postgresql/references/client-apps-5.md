# PostgreSQL - Client Apps (Part 5)

##  (continued)
If parentheses appear after \g, they surround a space-separated list of option=value formatting-option clauses, which are interpreted in the same way as \pset option value commands, but take effect only for the duration of this query. In this list, spaces are not allowed around = signs, but are required between option clauses. If =value is omitted, the named option is changed in the same way as for \pset option with no explicit value.

If a filename or |command argument is given, the query's output is written to the named file or piped to the given shell command, instead of displaying it as usual. The file or command is written to only if the query successfully returns zero or more tuples, not if the query fails or is a non-data-returning SQL command.

If the current query buffer is empty, the most recently sent query is re-executed instead. Except for that behavior, \g without any arguments is essentially equivalent to a semicolon. With arguments, \g provides a “one-shot” alternative to the \o command, and additionally allows one-shot adjustments of the output formatting options normally set by \pset.

When the last argument begins with |, the entire remainder of the line is taken to be the command to execute, and neither variable interpolation nor backquote expansion are performed in it. The rest of the line is simply passed literally to the shell.

Shows the description (that is, the column names and data types) of the result of the current query buffer. The query is not actually executed; however, if it contains some type of syntax error, that error will be reported in the normal way.

If the current query buffer is empty, the most recently sent query is described instead.

Gets the value of the environment variable env_var and assigns it to the psql variable psql_var. If env_var is not defined in the psql process's environment, psql_var is not changed. Example:

Sends the current query buffer to the server, then treats each column of each row of the query's output (if any) as an SQL statement to be executed. For example, to create an index on each column of my_table:

The generated queries are executed in the order in which the rows are returned, and left-to-right within each row if there is more than one column. NULL fields are ignored. The generated queries are sent literally to the server for processing, so they cannot be psql meta-commands nor contain psql variable references. If any individual query fails, execution of the remaining queries continues unless ON_ERROR_STOP is set. Execution of each query is subject to ECHO processing. (Setting ECHO to all or queries is often advisable when using \gexec.) Query logging, single-step mode, timing, and other query execution features apply to each generated query as well.

If the current query buffer is empty, the most recently sent query is re-executed instead.

Sends the current query buffer to the server and stores the query's output into psql variables (see Variables below). The query to be executed must return exactly one row. Each column of the row is stored into a separate variable, named the same as the column. For example:

If you specify a prefix, that string is prepended to the query's column names to create the variable names to use:

If a column result is NULL, the corresponding variable is unset rather than being set.

If the query fails or does not return one row, no variables are changed.

If the current query buffer is empty, the most recently sent query is re-executed instead.

\gx is equivalent to \g, except that it forces expanded output mode for this query, as if expanded=on were included in the list of \pset options. See also \x.

Gives syntax help on the specified SQL command. If command is not specified, then psql will list all the commands for which syntax help is available. If command is an asterisk (*), then syntax help on all SQL commands is shown.

Unlike most other meta-commands, the entire remainder of the line is always taken to be the argument(s) of \help, and neither variable interpolation nor backquote expansion are performed in the arguments.

To simplify typing, commands that consists of several words do not have to be quoted. Thus it is fine to type \help alter table.

Turns on HTML query output format. If the HTML format is already on, it is switched back to the default aligned text format. This command is for compatibility and convenience, but see \pset about setting other output options.

Reads input from the file filename and executes it as though it had been typed on the keyboard.

If filename is - (hyphen), then standard input is read until an EOF indication or \q meta-command. This can be used to intersperse interactive input with input from files. Note that Readline behavior will be used only if it is active at the outermost level.

If you want to see the lines on the screen as they are read you must set the variable ECHO to all.

This group of commands implements nestable conditional blocks. A conditional block must begin with an \if and end with an \endif. In between there may be any number of \elif clauses, which may optionally be followed by a single \else clause. Ordinary queries and other types of backslash commands may (and usually do) appear between the commands forming a conditional block.

The \if and \elif commands read their argument(s) and evaluate them as a Boolean expression. If the expression yields true then processing continues normally; otherwise, lines are skipped until a matching \elif, \else, or \endif is reached. Once an \if or \elif test has succeeded, the arguments of later \elif commands in the same block are not evaluated but are treated as false. Lines following an \else are processed only if no earlier matching \if or \elif succeeded.

The expression argument of an \if or \elif command is subject to variable interpolation and backquote expansion, just like any other backslash command argument. After that it is evaluated like the value of an on/off option variable. So a valid value is any unambiguous case-insensitive match for one of: true, false, 1, 0, on, off, yes, no. For example, t, T, and tR will all be considered to be true.

Expressions that do not properly evaluate to true or false will generate a warning and be treated as false.

Lines being skipped are parsed normally to identify queries and backslash commands, but queries are not sent to the server, and backslash commands other than conditionals (\if, \elif, \else, \endif) are ignored. Conditional commands are checked only for valid nesting. Variable references in skipped lines are not expanded, and backquote expansion is not performed either.

All the backslash commands of a given conditional block must appear in the same source file. If EOF is reached on the main input file or an \include-ed file before all local \if-blocks have been closed, then psql will raise an error.

The \ir command is similar to \i, but resolves relative file names differently. When executing in interactive mode, the two commands behave identically. However, when invoked from a script, \ir interprets file names relative to the directory in which the script is located, rather than the current working directory.

List the databases in the server and show their names, owners, character set encodings, and access privileges. If pattern is specified, only databases whose names match the pattern are listed. If x is appended to the command name, the results are displayed in expanded mode. If + is appended to the command name, database sizes, default tablespaces, and descriptions are also displayed. (Size information is only available for databases that the current user can connect to.)

Reads the large object with OID loid from the database and writes it to filename. Note that this is subtly different from the server function lo_export, which acts with the permissions of the user that the database server runs as and on the server's file system.

Use \lo_list to find out the large object's OID.

Stores the file into a PostgreSQL large object. Optionally, it associates the given comment with the object. Example:

The response indicates that the large object received object ID 152801, which can be used to access the newly-created large object in the future. For the sake of readability, it is recommended to always associate a human-readable comment with every object. Both OIDs and comments can be viewed with the \lo_list command.

Note that this command is subtly different from the server-side lo_import because it acts as the local user on the local file system, rather than the server's user and file system.

Shows a list of all PostgreSQL large objects currently stored in the database, along with any comments provided for them. If x is appended to the command name, the results are displayed in expanded mode. If + is appended to the command name, each large object is listed with its associated permissions, if any.

Deletes the large object with OID loid from the database.

Use \lo_list to find out the large object's OID.

Arranges to save future query results to the file filename or pipe future results to the shell command command. If no argument is specified, the query output is reset to the standard output.

If the argument begins with |, then the entire remainder of the line is taken to be the command to execute, and neither variable interpolation nor backquote expansion are performed in it. The rest of the line is simply passed literally to the shell.

“Query results” includes all tables, command responses, and notices obtained from the database server, as well as output of various backslash commands that query the database (such as \d); but not error messages.

To intersperse text output in between query results, use \qecho.

Print the current query buffer to the standard output. If the current query buffer is empty, the most recently executed query is printed instead.

Creates a prepared statement from the current query buffer, based on the name of a destination prepared-statement object. An empty string denotes the unnamed prepared statement.

This command causes the extended query protocol to be used, unlike normal psql operation, which uses the simple query protocol. A Parse (F) message will be issued by this command so it can be useful to test the extended query protocol from psql. This command affects only the next query executed; all subsequent queries will use the simple query protocol by default.

Changes the password of the specified user (by default, the current user). This command prompts for the new password, encrypts it, and sends it to the server as an ALTER ROLE command. This makes sure that the new password does not appear in cleartext in the command history, the server log, or elsewhere.

Prompts the user to supply text, which is assigned to the variable name. An optional prompt string, text, can be specified. (For multiword prompts, surround the text with single quotes.)

By default, \prompt uses the terminal for input and output. However, if the -f command line switch was used, \prompt uses standard input and standard output.

This command sets options affecting the output of query result tables. option indicates which option is to be set. The semantics of value vary depending on the selected option. For some options, omitting value causes the option to be toggled or unset, as described under the particular option. If no such behavior is mentioned, then omitting value just results in the current setting being displayed.

\pset without any arguments displays the current status of all printing options.

Adjustable printing options are:

The value must be a number. In general, the higher the number the more borders and lines the tables will have, but details depend on the particular format. In HTML format, this will translate directly into the border=... attribute. In most other formats only values 0 (no border), 1 (internal dividing lines), and 2 (table frame) make sense, and values above 2 will be treated the same as border = 2. The latex and latex-longtable formats additionally allow a value of 3 to add dividing lines between data rows.

Sets the target width for the wrapped format, and also the width limit for determining whether output is wide enough to require the pager or switch to the vertical display in expanded auto mode. Zero (the default) causes the target width to be controlled by the environment variable COLUMNS, or the detected screen width if COLUMNS is not set. In addition, if columns is zero then the wrapped format only affects screen output. If columns is nonzero then file and pipe output is wrapped to that width as well.

Specifies the field separator to be used in CSV output format. If the separator character appears in a field's value, that field is output within double quotes, following standard CSV rules. The default is a comma.

If value is specified it must be either on or off, which will enable or disable expanded mode, or auto. If value is omitted the command toggles between the on and off settings. When expanded mode is enabled, query results are displayed in two columns, with the column name on the left and the data on the right. This mode is useful if the data wouldn't fit on the screen in the normal “horizontal” mode. In the auto setting, the expanded mode is used whenever the query output has more than one column and is wider than the screen; otherwise, the regular mode is used. The auto setting is only effective in the aligned and wrapped formats. In other formats, it always behaves as if the expanded mode is off.

Specifies the field separator to be used in unaligned output format. That way one can create, for example, tab-separated output, which other programs might prefer. To set a tab as field separator, type \pset fieldsep '\t'. The default field separator is '|' (a vertical bar).

Sets the field separator to use in unaligned output format to a zero byte.

If value is specified it must be either on or off which will enable or disable display of the table footer (the (n rows) count). If value is omitted the command toggles footer display on or off.

Sets the output format to one of aligned, asciidoc, csv, html, latex, latex-longtable, troff-ms, unaligned, or wrapped. Unique abbreviations are allowed.

aligned format is the standard, human-readable, nicely formatted text output; this is the default.

unaligned format writes all columns of a row on one line, separated by the currently active field separator. This is useful for creating output that might be intended to be read in by other programs, for example, tab-separated or comma-separated format. However, the field separator character is not treated specially if it appears in a column's value; so CSV format may be better suited for such purposes.

csv format writes column values separated by commas, applying the quoting rules described in RFC 4180. This output is compatible with the CSV format of the server's COPY command. A header line with column names is generated unless the tuples_only parameter is on. Titles and footers are not printed. Each row is terminated by the system-dependent end-of-line character, which is typically a single newline (\n) for Unix-like systems or a carriage return and newline sequence (\r\n) for Microsoft Windows. Field separator characters other than comma can be selected with \pset csv_fieldsep.

wrapped format is like aligned but wraps wide data values across lines to make the output fit in the target column width. The target width is determined as described under the columns option. Note that psql will not attempt to wrap column header titles; therefore, wrapped format behaves the same as aligned if the total width needed for column headers exceeds the target.

The asciidoc, html, latex, latex-longtable, and troff-ms formats put out tables that are intended to be included in documents using the respective mark-up language. They are not complete documents! This might not be necessary in HTML, but in LaTeX you must have a complete document wrapper. The latex format uses LaTeX's tabular environment. The latex-longtable format requires the LaTeX longtable and booktabs packages.

Sets the border line drawing style to one of ascii, old-ascii, or unicode. Unique abbreviations are allowed. (That would mean one letter is enough.) The default setting is ascii. This option only affects the aligned and wrapped output formats.

ascii style uses plain ASCII characters. Newlines in data are shown using a + symbol in the right-hand margin. When the wrapped format wraps data from one line to the next without a newline character, a dot (.) is shown in the right-hand margin of the first line, and again in the left-hand margin of the following line.

old-ascii style uses plain ASCII characters, using the formatting style used in PostgreSQL 8.4 and earlier. Newlines in data are shown using a : symbol in place of the left-hand column separator. When the data is wrapped from one line to the next without a newline character, a ; symbol is used in place of the left-hand column separator.

unicode style uses Unicode box-drawing characters. Newlines in data are shown using a carriage return symbol in the right-hand margin. When the data is wrapped from one line to the next without a newline character, an ellipsis symbol is shown in the right-hand margin of the first line, and again in the left-hand margin of the following line.

When the border setting is greater than zero, the linestyle option also determines the characters with which the border lines are drawn. Plain ASCII characters work everywhere, but Unicode characters look nicer on displays that recognize them.

Sets the string to be printed in place of a null value. The default is to print nothing, which can easily be mistaken for an empty string. For example, one might prefer \pset null '(null)'.

If value is specified it must be either on or off which will enable or disable display of a locale-specific character to separate groups of digits to the left of the decimal marker. If value is omitted the command toggles between regular and locale-specific numeric output.

Controls use of a pager program for query and psql help output. When the pager option is off, the pager program is not used. When the pager option is on, the pager is used when appropriate, i.e., when the output is to a terminal and will not fit on the screen. The pager option can also be set to always, which causes the pager to be used for all terminal output regardless of whether it fits on the screen. \pset pager without a value toggles pager use on and off.

If the environment variable PSQL_PAGER or PAGER is set, output to be paged is piped to the specified program. Otherwise a platform-dependent default program (such as more) is used.

When using the \watch command to execute a query repeatedly, the environment variable PSQL_WATCH_PAGER is used to find the pager program instead, on Unix systems. This is configured separately because it may confuse traditional pagers, but can be used to send output to tools that understand psql's output format (such as pspg --stream).

If pager_min_lines is set to a number greater than the page height, the pager program will not be called unless there are at least this many lines of output to show. The default setting is 0.

Specifies the record (line) separator to use in unaligned output format. The default is a newline character.

Sets the record separator to use in unaligned output format to a zero byte.

In HTML format, this specifies attributes to be placed inside the table tag. This could for example be cellpadding or bgcolor. Note that you probably don't want to specify border here, as that is already taken care of by \pset border. If no value is given, the table attributes are unset.

In latex-longtable format, this controls the proportional width of each column containing a left-aligned data type. It is specified as a whitespace-separated list of values, e.g., '0.2 0.2 0.6'. Unspecified output columns use the last specified value.

Sets the table title for any subsequently printed tables. This can be used to give your output descriptive tags. If no value is given, the title is unset.

If value is specified it must be either on or off which will enable or disable tuples-only mode. If value is omitted the command toggles between regular and tuples-only output. Regular output includes extra information such as column headers, titles, and various footers. In tuples-only mode, only actual table data is shown.

Sets the border drawing style for the unicode line style to one of single or double.

Sets the column drawing style for the unicode line style to one of single or double.

Sets the header drawing style for the unicode line style to one of single or double.

Sets the maximum width of the header for expanded output to one of full (the default value), column, page, or an integer value.

full: the expanded header is not truncated, and will be as wide as the widest output line.

column: truncate the header line to the width of the first column.

page: truncate the header line to the terminal width.

integer value: specify the exact maximum width of the header line.

Illustrations of how these different formats look can be seen in Examples, below.

There are various shortcut commands for \pset. See \a, \C, \f, \H, \t, \T, and \x.

Quits the psql program. In a script file, only execution of that script is terminated.

This command is identical to \echo except that the output will be written to the query output channel, as set by \o.

Resets (clears) the query buffer.

Enter "restricted" mode with the provided key. In this mode, the only allowed meta-command is \unrestrict, to exit restricted mode. The key may contain only alphanumeric characters.

This command is primarily intended for use in plain-text dumps generated by pg_dump, pg_dumpall, and pg_restore, but it may be useful elsewhere.

Print psql's command line history to filename. If filename is omitted, the history is written to the standard output (using the pager if appropriate). This command is not available if psql was built without Readline support.

Sets the psql variable name to value, or if more than one value is given, to the concatenation of all of them. If only one argument is given, the variable is set to an empty-string value. To unset a variable, use the \unset command.

\set without any arguments displays the names and values of all currently-set psql variables.

Valid variable names can contain letters, digits, and underscores. See Variables below for details. Variable names are case-sensitive.

Certain variables are special, in that they control psql's behavior or are automatically set to reflect connection state. These variables are documented in Variables, below.

This command is unrelated to the SQL command SET.

Sets the environment variable name to value, or if the value is not supplied, unsets the environment variable. Example:

This command fetches and shows the definition of the named function or procedure, in the form of a CREATE OR REPLACE FUNCTION or CREATE OR REPLACE PROCEDURE command. The definition is printed to the current query output channel, as set by \o.

The target function can be specified by name alone, or by name and arguments, for example foo(integer, text). The argument types must be given if there is more than one function of the same name.

If + is appended to the command name, then the output lines are numbered, with the first line of the function body being line 1.

Unlike most other meta-commands, the entire remainder of the line is always taken to be the argument(s) of \sf, and neither variable interpolation nor backquote expansion are performed in the arguments.

This command fetches and shows the definition of the named view, in the form of a CREATE OR REPLACE VIEW command. The definition is printed to the current query output channel, as set by \o.

If + is appended to the command name, then the output lines are numbered from 1.

Unlike most other meta-commands, the entire remainder of the line is always taken to be the argument(s) of \sv, and neither variable interpolation nor backquote expansion are performed in the arguments.

This group of commands implements pipelining of SQL statements. A pipeline must begin with a \startpipeline and end with an \endpipeline. In between there may be any number of \syncpipeline commands, which sends a sync message without ending the ongoing pipeline and flushing the send buffer. In pipeline mode, statements are sent to the server without waiting for the results of previous statements. See Section 32.5 for more details.

All queries executed while a pipeline is ongoing use the extended query protocol. Queries are appended to the pipeline when ending with a semicolon. The meta-commands \bind, \bind_named, \close_prepared or \parse can be used in an ongoing pipeline. While a pipeline is ongoing, \sendpipeline will append the current query buffer to the pipeline. Other meta-commands like \g, \gx or \gdesc are not allowed in pipeline mode.

\flushrequest appends a flush command to the pipeline, allowing to read results with \getresults without issuing a sync or ending the pipeline. \getresults will automatically push unsent data to the server. \flush can be used to manually push unsent data.

\getresults accepts an optional number_results parameter. If provided, only the first number_results pending results will be read. If not provided or 0, all pending results are read.

When pipeline mode is active, a dedicated prompt variable is available to report the pipeline status. See %P for more details

COPY is not supported while in pipeline mode.

Toggles the display of output column name headings and row count footer. This command is equivalent to \pset tuples_only and is provided for convenience.

Specifies attributes to be placed within the table tag in HTML output format. This command is equivalent to \pset tableattr table_options.

With a parameter, turns displaying of how long each SQL statement takes on or off. Without a parameter, toggles the display between on and off. The display is in milliseconds; intervals longer than 1 second are also shown in minutes:seconds format, with hours and days fields added if needed.

Exit "restricted" mode (i.e., where all other meta-commands are blocked), provided the specified key matches the one given to \restrict when restricted mode was entered.

This command is primarily intended for use in plain-text dumps generated by pg_dump, pg_dumpall, and pg_restore, but it may be useful elsewhere.

Unsets (deletes) the psql variable name.

Most variables that control psql's behavior cannot be unset; instead, an \unset command is interpreted as setting them to their default values. See Variables below.

Writes the current query buffer to the file filename or pipes it to the shell command command. If the current query buffer is empty, the most recently executed query is written instead.

If the argument begins with |, then the entire remainder of the line is taken to be the command to execute, and neither variable interpolation nor backquote expansion are performed in it. The rest of the line is simply passed literally to the shell.

This command is identical to \echo except that the output will be written to psql's standard error channel, rather than standard output.

Repeatedly execute the current query buffer (as \g does) until interrupted, or the query fails, or the execution count limit (if given) is reached, or the query no longer returns the minimum number of rows. Wait the specified number of seconds (default 2) between executions. The default wait can be changed with the variable WATCH_INTERVAL. For backwards compatibility, seconds can be specified with or without an interval= prefix. Each query result is displayed with a header that includes the \pset title string (if any), the time as of query start, and the delay interval.

If the current query buffer is empty, the most recently sent query is re-executed instead.

Sets or toggles expanded table formatting mode. As such it is equivalent to \pset expanded.

Lists tables, views and sequences with their associated access privileges. If a pattern is specified, only tables, views and sequences whose names match the pattern are listed. By default only user-created objects are shown; supply a pattern or the S modifier to include system objects. If x is appended to the command name, the results are displayed in expanded mode.

This is an alias for \dp (“display privileges”).

With no argument, escapes to a sub-shell; psql resumes when the sub-shell exits. With an argument, executes the shell command command.

Unlike most other meta-commands, the entire remainder of the line is always taken to be the argument(s) of \!, and neither variable interpolation nor backquote expansion are performed in the arguments. The rest of the line is simply passed literally to the shell.

Shows help information. The optional topic parameter (defaulting to commands) selects which part of psql is explained: commands describes psql's backslash commands; options describes the command-line options that can be passed to psql; and variables shows help about psql configuration variables.

Backslash-semicolon is not a meta-command in the same way as the preceding commands; rather, it simply causes a semicolon to be added to the query buffer without any further processing.

Normally, psql will dispatch an SQL command to the server as soon as it reaches the command-ending semicolon, even if more input remains on the current line. Thus for example entering

will result in the three SQL commands being individually sent to the server, with each one's results being displayed before continuing to the next command. However, a semicolon entered as \; will not trigger command processing, so that the command before it and the one after are effectively combined and sent to the server in one request. So for example

results in sending the three SQL commands to the server in a single request, when the non-backslashed semicolon is reached. The server executes such a request as a single transaction, unless there are explicit BEGIN/COMMIT commands included in the string to divide it into multiple transactions. (See Section 54.2.2.1 for more details about how the server handles multi-query strings.)

The various \d commands accept a pattern parameter to specify the object name(s) to be displayed. In the simplest case, a pattern is just the exact name of the object. The characters within a pattern are normally folded to lower case, just as in SQL names; for example, \dt FOO will display the table named foo. As in SQL names, placing double quotes around a pattern stops folding to lower case. Should you need to include an actual double quote character in a pattern, write it as a pair of double quotes within a double-quote sequence; again this is in accord with the rules for SQL quoted identifiers. For example, \dt "FOO""BAR" will display the table named FOO"BAR (not foo"bar). Unlike the normal rules for SQL names, you can put double quotes around just part of a pattern, for instance \dt FOO"FOO"BAR will display the table named fooFOObar.

Whenever the pattern parameter is omitted completely, the \d commands display all objects that are visible in the current schema search path — this is equivalent to using * as the pattern. (An object is said to be visible if its containing schema is in the search path and no object of the same kind and name appears earlier in the search path. This is equivalent to the statement that the object can be referenced by name without explicit schema qualification.) To see all objects in the database regardless of visibility, use *.* as the pattern.

Within a pattern, * matches any sequence of characters (including no characters) and ? matches any single character. (This notation is comparable to Unix shell file name patterns.) For example, \dt int* displays tables whose names begin with int. But within double quotes, * and ? lose these special meanings and are just matched literally.

A relation pattern that contains a dot (.) is interpreted as a schema name pattern followed by an object name pattern. For example, \dt foo*.*bar* displays all tables whose table name includes bar that are in schemas whose schema name starts with foo. When no dot appears, then the pattern matches only objects that are visible in the current schema search path. Again, a dot within double quotes loses its special meaning and is matched literally. A relation pattern that contains two dots (.) is interpreted as a database name followed by a schema name pattern followed by an object name pattern. The database name portion will not be treated as a pattern and must match the name of the currently connected database, else an error will be raised.

A schema pattern that contains a dot (.) is interpreted as a database name followed by a schema name pattern. For example, \dn mydb.*foo* displays all schemas whose schema name includes foo. The database name portion will not be treated as a pattern and must match the name of the currently connected database, else an error will be raised.

Advanced users can use regular-expression notations such as character classes, for example [0-9] to match any digit. All regular expression special characters work as specified in Section 9.7.3, except for . which is taken as a separator as mentioned above, * which is translated to the regular-expression notation .*, ? which is translated to ., and $ which is matched literally. You can emulate these pattern characters at need by writing ? for ., (R+|) for R*, or (R|) for R?. $ is not needed as a regular-expression character since the pattern must match the whole name, unlike the usual interpretation of regular expressions (in other words, $ is automatically appended to your pattern). Write * at the beginning and/or end if you don't wish the pattern to be anchored. Note that within double quotes, all regular expression special characters lose their special meanings and are matched literally. Also, the regular expression special characters are matched literally in operator name patterns (i.e., the argument of \do).

psql provides variable substitution features similar to common Unix command shells. Variables are simply name/value pairs, where the value can be any string of any length. The name must consist of letters (including non-Latin letters), digits, and underscores.

To set a variable, use the psql meta-command \set. For example,

sets the variable foo to the value bar. To retrieve the content of the variable, precede the name with a colon, for example:

This works in both regular SQL commands and meta-commands; there is more detail in SQL Interpolation, below.

If you call \set without a second argument, the variable is set to an empty-string value. To unset (i.e., delete) a variable, use the command \unset. To show the values of all variables, call \set without any argument.

The arguments of \set are subject to the same substitution rules as with other commands. Thus you can construct interesting references such as \set :foo 'something' and get “soft links” or “variable variables” of Perl or PHP fame, respectively. Unfortunately (or fortunately?), there is no way to do anything useful with these constructs. On the other hand, \set bar :foo is a perfectly valid way to copy a variable.

A number of these variables are treated specially by psql. They represent certain option settings that can be changed at run time by altering the value of the variable, or in some cases represent changeable state of psql. By convention, all specially treated variables' names consist of all upper-case ASCII letters (and possibly digits and underscores). To ensure maximum compatibility in the future, avoid using such variable names for your own purposes.

Variables that control psql's behavior generally cannot be unset or set to invalid values. An \unset command is allowed but is interpreted as setting the variable to its default value. A \set command without a second argument is interpreted as setting the variable to on, for control variables that accept that value, and is rejected for others. Also, control variables that accept the values on and off will also accept other common spellings of Boolean values, such as true and false.

The specially treated variables are:

When on (the default), each SQL command is automatically committed upon successful completion. To postpone commit in this mode, you must enter a BEGIN or START TRANSACTION SQL command. When off or unset, SQL commands are not committed until you explicitly issue COMMIT or END. The autocommit-off mode works by issuing an implicit BEGIN for you, just before any command that is not already in a transaction block and is not itself a BEGIN or other transaction-control command, nor a command that cannot be executed inside a transaction block (such as VACUUM).

In autocommit-off mode, you must explicitly abandon any failed transaction by entering ABORT or ROLLBACK. Also keep in mind that if you exit the session without committing, your work will be lost.

The autocommit-on mode is PostgreSQL's traditional behavior, but autocommit-off is closer to the SQL spec. If you prefer autocommit-off, you might wish to set it in the system-wide psqlrc file or your ~/.psqlrc file.

Determines which letter case to use when completing an SQL key word. If set to lower or upper, the completed word will be in lower or upper case, respectively. If set to preserve-lower or preserve-upper (the default), the completed word will be in the case of the word already entered, but words being completed without anything entered will be in lower or upper case, respectively.

The name of the database you are currently connected to. This is set every time you connect to a database (including program start-up), but can be changed or unset.

If set to all, all nonempty input lines are printed to standard output as they are read. (This does not apply to lines read interactively.) To select this behavior on program start-up, use the switch -a. If set to queries, psql prints each query to standard output as it is sent to the server. The switch to select this behavior is -e. If set to errors, then only failed queries are displayed on standard error output. The switch for this behavior is -b. If set to none (the default), then no queries are displayed.

When this variable is set to on and a backslash command queries the database, the query is first shown. This feature helps you to study PostgreSQL internals and provide similar functionality in your own programs. (To select this behavior on program start-up, use the switch -E.) If you set this variable to the value noexec, the queries are just shown but are not actually sent to the server and executed. The default value is off.

The current client character set encoding. This is set every time you connect to a database (including program start-up), and when you change the encoding with \encoding, but it can be changed or unset.

true if the last SQL query failed, false if it succeeded. See also SQLSTATE.

If this variable is set to an integer value greater than zero, the results of SELECT queries are fetched and displayed in groups of that many rows, rather than the default behavior of collecting the entire result set before display. Therefore only a limited amount of memory is used, regardless of the size of the result set. Settings of 100 to 1000 are commonly used when enabling this feature. Keep in mind that when using this feature, a query might fail after having already displayed some rows.

Although you can use any output format with this feature, the default aligned format tends to look bad because each group of FETCH_COUNT rows will be formatted separately, leading to varying column widths across the row groups. The other output formats work better.

If this variable is set to true, a table's access method details are not displayed. This is mainly useful for regression tests.

If this variable is set to true, column compression method details are not displayed. This is mainly useful for regression tests.

If this variable is set to ignorespace, lines which begin with a space are not entered into the history list. If set to a value of ignoredups, lines matching the previous history line are not entered. A value of ignoreboth combines the two options. If set to none (the default), all lines read in interactive mode are saved on the history list.

This feature was shamelessly plagiarized from Bash.

The file name that will be used to store the history list. If unset, the file name is taken from the PSQL_HISTORY environment variable. If that is not set either, the default is ~/.psql_history, or %APPDATA%\postgresql\psql_history on Windows. For example, putting:

in ~/.psqlrc will cause psql to maintain a separate history for each database.

This feature was shamelessly plagiarized from Bash.

The maximum number of commands to store in the command history (default 500). If set to a negative value, no limit is applied.

This feature was shamelessly plagiarized from Bash.

The database server host you are currently connected to. This is set every time you connect to a database (including program start-up), but can be changed or unset.

If set to 1 or less, sending an EOF character (usually Control+D) to an interactive session of psql will terminate the application. If set to a larger numeric value, that many consecutive EOF characters must be typed to make an interactive session terminate. If the variable is set to a non-numeric value, it is interpreted as 10. The default is 0.

This feature was shamelessly plagiarized from Bash.

The value of the last affected OID, as returned from an INSERT or \lo_import command. This variable is only guaranteed to be valid until after the result of the next SQL command has been displayed. PostgreSQL servers since version 12 do not support OID system columns anymore, thus LASTOID will always be 0 following INSERT when targeting such servers.

The primary error message and associated SQLSTATE code for the most recent failed query in the current psql session, or an empty string and 00000 if no error has occurred in the current session.

When set to on, if a statement in a transaction block generates an error, the error is ignored and the transaction continues. When set to interactive, such errors are only ignored in interactive sessions, and not when reading script files. When set to off (the default), a statement in a transaction block that generates an error aborts the entire transaction. The error rollback mode works by issuing an implicit SAVEPOINT for you, just before each command that is in a transaction block, and then rolling back to the savepoint if the command fails.

By default, command processing continues after an error. When this variable is set to on, processing will instead stop immediately. In interactive mode, psql will return to the command prompt; otherwise, psql will exit, returning error code 3 to distinguish this case from fatal error conditions, which are reported using error code 1. In either case, any currently running scripts (the top-level script, if any, and any other scripts which it may have in invoked) will be terminated immediately. If the top-level command string contained multiple SQL commands, processing will stop with the current command.

The number of commands queued in an ongoing pipeline.

The number of commands of an ongoing pipeline that were followed by either a \flushrequest or a \syncpipeline, forcing the server to send the results. These results can be retrieved with \getresults.

The number of sync messages queued in an ongoing pipeline.

The database server port to which you are currently connected. This is set every time you connect to a database (including program start-up), but can be changed or unset.

These specify what the prompts psql issues should look like. See Prompting below.

Setting this variable to on is equivalent to the command line option -q. It is probably not too useful in interactive mode.


*(continued...)*
---

