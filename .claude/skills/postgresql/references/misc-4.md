# PostgreSQL - Misc (Part 4)

## 


**URL:** https://www.postgresql.org/docs/18/pgbench.html

**Contents:**
- pgbench
- Synopsis
- Description
  - Caution
- Options
  - Initialization Options
  - Benchmarking Options
  - Common Options
- Exit Status
- Environment

pgbench — run a benchmark test on PostgreSQL

pgbench -i [option...] [dbname]

pgbench [option...] [dbname]

pgbench is a simple program for running benchmark tests on PostgreSQL. It runs the same sequence of SQL commands over and over, possibly in multiple concurrent database sessions, and then calculates the average transaction rate (transactions per second). By default, pgbench tests a scenario that is loosely based on TPC-B, involving five SELECT, UPDATE, and INSERT commands per transaction. However, it is easy to test other cases by writing your own transaction script files.

Typical output from pgbench looks like:

The first seven lines report some of the most important parameter settings. The sixth line reports the maximum number of tries for transactions with serialization or deadlock errors (see Failures and Serialization/Deadlock Retries for more information). The eighth line reports the number of transactions completed and intended (the latter being just the product of number of clients and number of transactions per client); these will be equal unless the run failed before completion or some SQL command(s) failed. (In -T mode, only the actual number of transactions is printed.) The next line reports the number of failed transactions due to serialization or deadlock errors (see Failures and Serialization/Deadlock Retries for more information). The last line reports the number of transactions per second.

The default TPC-B-like transaction test requires specific tables to be set up beforehand. pgbench should be invoked with the -i (initialize) option to create and populate these tables. (When you are testing a custom script, you don't need this step, but will instead need to do whatever setup your test needs.) Initialization looks like:

where dbname is the name of the already-created database to test in. (You may also need -h, -p, and/or -U options to specify how to connect to the database server.)

pgbench -i creates four tables pgbench_accounts, pgbench_branches, pgbench_history, and pgbench_tellers, destroying any existing tables of these names. Be very careful to use another database if you have tables having these names!

At the default “scale factor” of 1, the tables initially contain this many rows:

You can (and, for most purposes, probably should) increase the number of rows by using the -s (scale factor) option. The -F (fillfactor) option might also be used at this point.

Once you have done the necessary setup, you can run your benchmark with a command that doesn't include -i, that is

In nearly all cases, you'll need some options to make a useful test. The most important options are -c (number of clients), -t (number of transactions), -T (time limit), and -f (specify a custom script file). See below for a full list.

The following is divided into three subsections. Different options are used during database initialization and while running benchmarks, but some options are useful in both cases.

pgbench accepts the following command-line initialization arguments:

Specifies the name of the database to test in. If this is not specified, the environment variable PGDATABASE is used. If that is not set, the user name specified for the connection is used.

Required to invoke initialization mode.

Perform just a selected set of the normal initialization steps. init_steps specifies the initialization steps to be performed, using one character per step. Each step is invoked in the specified order. The default is dtgvp. The available steps are:

Drop any existing pgbench tables.

Create the tables used by the standard pgbench scenario, namely pgbench_accounts, pgbench_branches, pgbench_history, and pgbench_tellers.

Generate data and load it into the standard tables, replacing any data already present.

With g (client-side data generation), data is generated in pgbench client and then sent to the server. This uses the client/server bandwidth extensively through a COPY. pgbench uses the FREEZE option to load data into ordinary (non-partition) tables with version 14 or later of PostgreSQL to speed up subsequent VACUUM. Using g causes logging to print one message every 100,000 rows while generating data for all tables.

With G (server-side data generation), only small queries are sent from the pgbench client and then data is actually generated in the server. No significant bandwidth is required for this variant, but the server will do more work. Using G causes logging not to print any progress message while generating data.

The default initialization behavior uses client-side data generation (equivalent to g).

Invoke VACUUM on the standard tables.

Create primary key indexes on the standard tables.

Create foreign key constraints between the standard tables. (Note that this step is not performed by default.)

Create the pgbench_accounts, pgbench_tellers and pgbench_branches tables with the given fillfactor. Default is 100.

Perform no vacuuming during initialization. (This option suppresses the v initialization step, even if it was specified in -I.)

Switch logging to quiet mode, producing only one progress message per 5 seconds. The default logging prints one message each 100,000 rows, which often outputs many lines per second (especially on good hardware).

This setting has no effect if G is specified in -I.

Multiply the number of rows generated by the scale factor. For example, -s 100 will create 10,000,000 rows in the pgbench_accounts table. Default is 1. When the scale is 20,000 or larger, the columns used to hold account identifiers (aid columns) will switch to using larger integers (bigint), in order to be big enough to hold the range of account identifiers.

Create foreign key constraints between the standard tables. (This option adds the f step to the initialization step sequence, if it is not already present.)

Create indexes in the specified tablespace, rather than the default tablespace.

Create a partitioned pgbench_accounts table with NAME method. Expected values are range or hash. This option requires that --partitions is set to non-zero. If unspecified, default is range.

Create a partitioned pgbench_accounts table with NUM partitions of nearly equal size for the scaled number of accounts. Default is 0, meaning no partitioning.

Create tables in the specified tablespace, rather than the default tablespace.

Create all tables as unlogged tables, rather than permanent tables.

pgbench accepts the following command-line benchmarking arguments:

Add the specified built-in script to the list of scripts to be executed. Available built-in scripts are: tpcb-like, simple-update and select-only. Unambiguous prefixes of built-in names are accepted. With the special name list, show the list of built-in scripts and exit immediately.

Optionally, write an integer weight after @ to adjust the probability of selecting this script versus other ones. The default weight is 1. See below for details.

Number of clients simulated, that is, number of concurrent database sessions. Default is 1.

Establish a new connection for each transaction, rather than doing it just once per client session. This is useful to measure the connection overhead.

Define a variable for use by a custom script (see below). Multiple -D options are allowed.

Add a transaction script read from filename to the list of scripts to be executed.

Optionally, write an integer weight after @ to adjust the probability of selecting this script versus other ones. The default weight is 1. (To use a script file name that includes an @ character, append a weight so that there is no ambiguity, for example filen@me@1.) See below for details.

Number of worker threads within pgbench. Using more than one thread can be helpful on multi-CPU machines. Clients are distributed as evenly as possible among available threads. Default is 1.

Write information about each transaction to a log file. See below for details.

Transactions that last more than limit milliseconds are counted and reported separately, as late.

When throttling is used (--rate=...), transactions that lag behind schedule by more than limit ms, and thus have no hope of meeting the latency limit, are not sent to the server at all. They are counted and reported separately as skipped.

When the --max-tries option is used, a transaction which fails due to a serialization anomaly or from a deadlock will not be retried if the total time of all its tries is greater than limit ms. To limit only the time of tries and not their number, use --max-tries=0. By default, the option --max-tries is set to 1 and transactions with serialization/deadlock errors are not retried. See Failures and Serialization/Deadlock Retries for more information about retrying such transactions.

Protocol to use for submitting queries to the server:

simple: use simple query protocol.

extended: use extended query protocol.

prepared: use extended query protocol with prepared statements.

In the prepared mode, pgbench reuses the parse analysis result starting from the second query iteration, so pgbench runs faster than in other modes.

The default is simple query protocol. (See Chapter 54 for more information.)

Perform no vacuuming before running the test. This option is necessary if you are running a custom test scenario that does not include the standard tables pgbench_accounts, pgbench_branches, pgbench_history, and pgbench_tellers.

Run built-in simple-update script. Shorthand for -b simple-update.

Show progress report every sec seconds. The report includes the time since the beginning of the run, the TPS since the last report, and the transaction latency average, standard deviation, and the number of failed transactions since the last report. Under throttling (-R), the latency is computed with respect to the transaction scheduled start time, not the actual transaction beginning time, thus it also includes the average schedule lag time. When --max-tries is used to enable transaction retries after serialization/deadlock errors, the report includes the number of retried transactions and the sum of all retries.

Report the following statistics for each command after the benchmark finishes: the average per-statement latency (execution time from the perspective of the client), the number of failures, and the number of retries after serialization or deadlock errors in this command. The report displays retry statistics only if the --max-tries option is not equal to 1.

Execute transactions targeting the specified rate instead of running as fast as possible (the default). The rate is given in transactions per second. If the targeted rate is above the maximum possible rate, the rate limit won't impact the results.

The rate is targeted by starting transactions along a Poisson-distributed schedule time line. The expected start time schedule moves forward based on when the client first started, not when the previous transaction ended. That approach means that when transactions go past their original scheduled end time, it is possible for later ones to catch up again.

When throttling is active, the transaction latency reported at the end of the run is calculated from the scheduled start times, so it includes the time each transaction had to wait for the previous transaction to finish. The wait time is called the schedule lag time, and its average and maximum are also reported separately. The transaction latency with respect to the actual transaction start time, i.e., the time spent executing the transaction in the database, can be computed by subtracting the schedule lag time from the reported latency.

If --latency-limit is used together with --rate, a transaction can lag behind so much that it is already over the latency limit when the previous transaction ends, because the latency is calculated from the scheduled start time. Such transactions are not sent to the server, but are skipped altogether and counted separately.

A high schedule lag time is an indication that the system cannot process transactions at the specified rate, with the chosen number of clients and threads. When the average transaction execution time is longer than the scheduled interval between each transaction, each successive transaction will fall further behind, and the schedule lag time will keep increasing the longer the test run is. When that happens, you will have to reduce the specified transaction rate.

Report the specified scale factor in pgbench's output. With the built-in tests, this is not necessary; the correct scale factor will be detected by counting the number of rows in the pgbench_branches table. However, when testing only custom benchmarks (-f option), the scale factor will be reported as 1 unless this option is used.

Run built-in select-only script. Shorthand for -b select-only.

Number of transactions each client runs. Default is 10.

Run the test for this many seconds, rather than a fixed number of transactions per client. -t and -T are mutually exclusive.

Vacuum all four standard tables before running the test. With neither -n nor -v, pgbench will vacuum the pgbench_tellers and pgbench_branches tables, and will truncate pgbench_history.

Length of aggregation interval (in seconds). May be used only with -l option. With this option, the log contains per-interval summary data, as described below.

Exit immediately when any client is aborted due to some error. Without this option, even when a client is aborted, other clients could continue their run as specified by -t or -T option, and pgbench will print an incomplete results in this case.

Note that serialization failures or deadlock failures do not abort the client, so they are not affected by this option. See Failures and Serialization/Deadlock Retries for more information.

Report failures in per-transaction and aggregation logs, as well as in the main and per-script reports, grouped by the following types:

serialization failures;

See Failures and Serialization/Deadlock Retries for more information.

Set the filename prefix for the log files created by --log. The default is pgbench_log.

Enable retries for transactions with serialization/deadlock errors and set the maximum number of these tries. This option can be combined with the --latency-limit option which limits the total time of all transaction tries; moreover, you cannot use an unlimited number of tries (--max-tries=0) without --latency-limit or --time. The default value is 1 and transactions with serialization/deadlock errors are not retried. See Failures and Serialization/Deadlock Retries for more information about retrying such transactions.

When showing progress (option -P), use a timestamp (Unix epoch) instead of the number of seconds since the beginning of the run. The unit is in seconds, with millisecond precision after the dot. This helps compare logs generated by various tools.

Set random generator seed. Seeds the system random number generator, which then produces a sequence of initial generator states, one for each thread. Values for seed may be: time (the default, the seed is based on the current time), rand (use a strong random source, failing if none is available), or an unsigned decimal integer value. The random generator is invoked explicitly from a pgbench script (random... functions) or implicitly (for instance option --rate uses it to schedule transactions). When explicitly set, the value used for seeding is shown on the terminal. Any value allowed for seed may also be provided through the environment variable PGBENCH_RANDOM_SEED. To ensure that the provided seed impacts all possible uses, put this option first or use the environment variable.

Setting the seed explicitly allows to reproduce a pgbench run exactly, as far as random numbers are concerned. As the random state is managed per thread, this means the exact same pgbench run for an identical invocation if there is one client per thread and there are no external or data dependencies. From a statistical viewpoint reproducing runs exactly is a bad idea because it can hide the performance variability or improve performance unduly, e.g., by hitting the same pages as a previous run. However, it may also be of great help for debugging, for instance re-running a tricky case which leads to an error. Use wisely.

Sampling rate, used when writing data into the log, to reduce the amount of log generated. If this option is given, only the specified fraction of transactions are logged. 1.0 means all transactions will be logged, 0.05 means only 5% of the transactions will be logged.

Remember to take the sampling rate into account when processing the log file. For example, when computing TPS values, you need to multiply the numbers accordingly (e.g., with 0.01 sample rate, you'll only get 1/100 of the actual TPS).

Show the actual code of builtin script scriptname on stderr, and exit immediately.

Print messages about all errors and failures (errors without retrying) including which limit for retries was exceeded and how far it was exceeded for the serialization/deadlock failures. (Note that in this case the output can be significantly increased.) See Failures and Serialization/Deadlock Retries for more information.

pgbench also accepts the following common command-line arguments for connection parameters and other common settings:

Print debugging output.

The database server's host name

The database server's port number

The user name to connect as

Print the pgbench version and exit.

Show help about pgbench command line arguments, and exit.

A successful run will exit with status 0. Exit status 1 indicates static problems such as invalid command-line options or internal errors which are supposed to never occur. Early errors that occur when starting benchmark such as initial connection failures also exit with status 1. Errors during the run such as database errors or problems in the script will result in exit status 2. In the latter case, pgbench will print partial results if --exit-on-abort option is not specified.

Default connection parameters.

This utility, like most other PostgreSQL utilities, uses the environment variables supported by libpq (see Section 32.15).

The environment variable PG_COLOR specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

pgbench executes test scripts chosen randomly from a specified list. The scripts may include built-in scripts specified with -b and user-provided scripts specified with -f. Each script may be given a relative weight specified after an @ so as to change its selection probability. The default weight is 1. Scripts with a weight of 0 are ignored.

The default built-in transaction script (also invoked with -b tpcb-like) issues seven commands per transaction over randomly chosen aid, tid, bid and delta. The scenario is inspired by the TPC-B benchmark, but is not actually TPC-B, hence the name.

UPDATE pgbench_accounts SET abalance = abalance + :delta WHERE aid = :aid;

SELECT abalance FROM pgbench_accounts WHERE aid = :aid;

UPDATE pgbench_tellers SET tbalance = tbalance + :delta WHERE tid = :tid;

UPDATE pgbench_branches SET bbalance = bbalance + :delta WHERE bid = :bid;

INSERT INTO pgbench_history (tid, bid, aid, delta, mtime) VALUES (:tid, :bid, :aid, :delta, CURRENT_TIMESTAMP);

If you select the simple-update built-in (also -N), steps 4 and 5 aren't included in the transaction. This will avoid update contention on these tables, but it makes the test case even less like TPC-B.

If you select the select-only built-in (also -S), only the SELECT is issued.

pgbench has support for running custom benchmark scenarios by replacing the default transaction script (described above) with a transaction script read from a file (-f option). In this case a “transaction” counts as one execution of a script file.

A script file contains one or more SQL commands terminated by semicolons. Empty lines and lines beginning with -- are ignored. Script files can also contain “meta commands”, which are interpreted by pgbench itself, as described below.

Before PostgreSQL 9.6, SQL commands in script files were terminated by newlines, and so they could not be continued across lines. Now a semicolon is required to separate consecutive SQL commands (though an SQL command does not need one if it is followed by a meta command). If you need to create a script file that works with both old and new versions of pgbench, be sure to write each SQL command on a single line ending with a semicolon.

It is assumed that pgbench scripts do not contain incomplete blocks of SQL transactions. If at runtime the client reaches the end of the script without completing the last transaction block, it will be aborted.

There is a simple variable-substitution facility for script files. Variable names must consist of letters (including non-Latin letters), digits, and underscores, with the first character not being a digit. Variables can be set by the command-line -D option, explained above, or by the meta commands explained below. In addition to any variables preset by -D command-line options, there are a few variables that are preset automatically, listed in Table 301. A value specified for these variables using -D takes precedence over the automatic presets. Once set, a variable's value can be inserted into an SQL command by writing :variablename. When running more than one client session, each session has its own set of variables. pgbench supports up to 255 variable uses in one statement.

Table 301. pgbench Automatic Variables

Script file meta commands begin with a backslash (\) and normally extend to the end of the line, although they can be continued to additional lines by writing backslash-return. Arguments to a meta command are separated by white space. These meta commands are supported:

These commands may be used to end SQL queries, taking the place of the terminating semicolon (;).

When the \gset command is used, the preceding SQL query is expected to return one row, the columns of which are stored into variables named after column names, and prefixed with prefix if provided.

When the \aset command is used, all combined SQL queries (separated by \;) have their columns stored into variables named after column names, and prefixed with prefix if provided. If a query returns no row, no assignment is made and the variable can be tested for existence to detect this. If a query returns more than one row, the last value is kept.

\gset and \aset cannot be used in pipeline mode, since the query results are not yet available by the time the commands would need them.

The following example puts the final account balance from the first query into variable abalance, and fills variables p_two and p_three with integers from the third query. The result of the second query is discarded. The result of the two last combined queries are stored in variables four and five.

This group of commands implements nestable conditional blocks, similarly to psql's \if expression. Conditional expressions are identical to those with \set, with non-zero values interpreted as true.

Sets variable varname to a value calculated from expression. The expression may contain the NULL constant, Boolean constants TRUE and FALSE, integer constants such as 5432, double constants such as 3.14159, references to variables :variablename, operators with their usual SQL precedence and associativity, function calls, SQL CASE generic conditional expressions and parentheses.

Functions and most operators return NULL on NULL input.

For conditional purposes, non zero numerical values are TRUE, zero numerical values and NULL are FALSE.

Too large or small integer and double constants, as well as integer arithmetic operators (+, -, * and /) raise errors on overflows.

When no final ELSE clause is provided to a CASE, the default value is NULL.

Causes script execution to sleep for the specified duration in microseconds (us), milliseconds (ms) or seconds (s). If the unit is omitted then seconds are the default. number can be either an integer constant or a :variablename reference to a variable having an integer value.

Sets variable varname to the result of the shell command command with the given argument(s). The command must return an integer value through its standard output.

command and each argument can be either a text constant or a :variablename reference to a variable. If you want to use an argument starting with a colon, write an additional colon at the beginning of argument.

Same as \setshell, but the result of the command is discarded.

This group of commands implements pipelining of SQL statements. A pipeline must begin with a \startpipeline and end with an \endpipeline. In between there may be any number of \syncpipeline commands, which sends a sync message without ending the ongoing pipeline and flushing the send buffer. In pipeline mode, statements are sent to the server without waiting for the results of previous statements. See Section 32.5 for more details. Pipeline mode requires the use of extended query protocol.

The arithmetic, bitwise, comparison and logical operators listed in Table 302 are built into pgbench and may be used in expressions appearing in \set. The operators are listed in increasing precedence order. Except as noted, operators taking two numeric inputs will produce a double value if either input is double, otherwise they produce an integer result.

Table 302. pgbench Operators

boolean OR boolean → boolean

boolean AND boolean → boolean

NOT boolean → boolean

boolean IS [NOT] (NULL|TRUE|FALSE) → boolean

value ISNULL|NOTNULL → boolean

number = number → boolean

number <> number → boolean

number != number → boolean

number < number → boolean

number <= number → boolean

Less than or equal to

number > number → boolean

number >= number → boolean

Greater than or equal to

integer | integer → integer

integer # integer → integer

integer & integer → integer

integer << integer → integer

integer >> integer → integer

number + number → number

number - number → number

number * number → number

number / number → number

Division (truncates the result towards zero if both inputs are integers)

integer % integer → integer

The functions listed in Table 303 are built into pgbench and may be used in expressions appearing in \set.

Table 303. pgbench Functions

abs ( number ) → same type as input

debug ( number ) → same type as input

Prints the argument to stderr, and returns the argument.

debug(5432.1) → 5432.1

double ( number ) → double

double(5432) → 5432.0

exp ( number ) → double

Exponential (e raised to the given power)

exp(1.0) → 2.718281828459045

greatest ( number [, ... ] ) → double if any argument is double, else integer

Selects the largest value among the arguments.

greatest(5, 4, 3, 2) → 5

hash ( value [, seed ] ) → integer

This is an alias for hash_murmur2.

hash(10, 5432) → -5817877081768721676

hash_fnv1a ( value [, seed ] ) → integer

Computes FNV-1a hash.

hash_fnv1a(10, 5432) → -7793829335365542153

hash_murmur2 ( value [, seed ] ) → integer

Computes MurmurHash2 hash.

hash_murmur2(10, 5432) → -5817877081768721676


*(continued...)*
---

