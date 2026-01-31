# PostgreSQL - Misc (Part 5)

##  (continued)
int ( number ) → integer

least ( number [, ... ] ) → double if any argument is double, else integer

Selects the smallest value among the arguments.

least(5, 4, 3, 2.1) → 2.1

ln ( number ) → double

ln(2.718281828459045) → 1.0

mod ( integer, integer ) → integer

permute ( i, size [, seed ] ) → integer

Permuted value of i, in the range [0, size). This is the new position of i (modulo size) in a pseudorandom permutation of the integers 0...size-1, parameterized by seed, see below.

permute(0, 4) → an integer between 0 and 3

Approximate value of π

pi() → 3.14159265358979323846

pow ( x, y ) → double

power ( x, y ) → double

x raised to the power of y

pow(2.0, 10) → 1024.0

random ( lb, ub ) → integer

Computes a uniformly-distributed random integer in [lb, ub].

random(1, 10) → an integer between 1 and 10

random_exponential ( lb, ub, parameter ) → integer

Computes an exponentially-distributed random integer in [lb, ub], see below.

random_exponential(1, 10, 3.0) → an integer between 1 and 10

random_gaussian ( lb, ub, parameter ) → integer

Computes a Gaussian-distributed random integer in [lb, ub], see below.

random_gaussian(1, 10, 2.5) → an integer between 1 and 10

random_zipfian ( lb, ub, parameter ) → integer

Computes a Zipfian-distributed random integer in [lb, ub], see below.

random_zipfian(1, 10, 1.5) → an integer between 1 and 10

sqrt ( number ) → double

sqrt(2.0) → 1.414213562

The random function generates values using a uniform distribution, that is all the values are drawn within the specified range with equal probability. The random_exponential, random_gaussian and random_zipfian functions require an additional double parameter which determines the precise shape of the distribution.

For an exponential distribution, parameter controls the distribution by truncating a quickly-decreasing exponential distribution at parameter, and then projecting onto integers between the bounds. To be precise, with

f(x) = exp(-parameter * (x - min) / (max - min + 1)) / (1 - exp(-parameter))

Then value i between min and max inclusive is drawn with probability: f(i) - f(i + 1).

Intuitively, the larger the parameter, the more frequently values close to min are accessed, and the less frequently values close to max are accessed. The closer to 0 parameter is, the flatter (more uniform) the access distribution. A crude approximation of the distribution is that the most frequent 1% values in the range, close to min, are drawn parameter% of the time. The parameter value must be strictly positive.

For a Gaussian distribution, the interval is mapped onto a standard normal distribution (the classical bell-shaped Gaussian curve) truncated at -parameter on the left and +parameter on the right. Values in the middle of the interval are more likely to be drawn. To be precise, if PHI(x) is the cumulative distribution function of the standard normal distribution, with mean mu defined as (max + min) / 2.0, with

f(x) = PHI(2.0 * parameter * (x - mu) / (max - min + 1)) / (2.0 * PHI(parameter) - 1)

then value i between min and max inclusive is drawn with probability: f(i + 0.5) - f(i - 0.5). Intuitively, the larger the parameter, the more frequently values close to the middle of the interval are drawn, and the less frequently values close to the min and max bounds. About 67% of values are drawn from the middle 1.0 / parameter, that is a relative 0.5 / parameter around the mean, and 95% in the middle 2.0 / parameter, that is a relative 1.0 / parameter around the mean; for instance, if parameter is 4.0, 67% of values are drawn from the middle quarter (1.0 / 4.0) of the interval (i.e., from 3.0 / 8.0 to 5.0 / 8.0) and 95% from the middle half (2.0 / 4.0) of the interval (second and third quartiles). The minimum allowed parameter value is 2.0.

random_zipfian generates a bounded Zipfian distribution. parameter defines how skewed the distribution is. The larger the parameter, the more frequently values closer to the beginning of the interval are drawn. The distribution is such that, assuming the range starts from 1, the ratio of the probability of drawing k versus drawing k+1 is ((k+1)/k)**parameter. For example, random_zipfian(1, ..., 2.5) produces the value 1 about (2/1)**2.5 = 5.66 times more frequently than 2, which itself is produced (3/2)**2.5 = 2.76 times more frequently than 3, and so on.

pgbench's implementation is based on "Non-Uniform Random Variate Generation", Luc Devroye, p. 550-551, Springer 1986. Due to limitations of that algorithm, the parameter value is restricted to the range [1.001, 1000].

When designing a benchmark which selects rows non-uniformly, be aware that the rows chosen may be correlated with other data such as IDs from a sequence or the physical row ordering, which may skew performance measurements.

To avoid this, you may wish to use the permute function, or some other additional step with similar effect, to shuffle the selected rows and remove such correlations.

Hash functions hash, hash_murmur2 and hash_fnv1a accept an input value and an optional seed parameter. In case the seed isn't provided the value of :default_seed is used, which is initialized randomly unless set by the command-line -D option.

permute accepts an input value, a size, and an optional seed parameter. It generates a pseudorandom permutation of integers in the range [0, size), and returns the index of the input value in the permuted values. The permutation chosen is parameterized by the seed, which defaults to :default_seed, if not specified. Unlike the hash functions, permute ensures that there are no collisions or holes in the output values. Input values outside the interval are interpreted modulo the size. The function raises an error if the size is not positive. permute can be used to scatter the distribution of non-uniform random functions such as random_zipfian or random_exponential so that values drawn more often are not trivially correlated. For instance, the following pgbench script simulates a possible real world workload typical for social media and blogging platforms where a few accounts generate excessive load:

In some cases several distinct distributions are needed which don't correlate with each other and this is when the optional seed parameter comes in handy:

A similar behavior can also be approximated with hash:

However, since hash generates collisions, some values will not be reachable and others will be more frequent than expected from the original distribution.

As an example, the full definition of the built-in TPC-B-like transaction is:

This script allows each iteration of the transaction to reference different, randomly-chosen rows. (This example also shows why it's important for each client session to have its own variables — otherwise they'd not be independently touching different rows.)

With the -l option (but without the --aggregate-interval option), pgbench writes information about each transaction to a log file. The log file will be named prefix.nnn, where prefix defaults to pgbench_log, and nnn is the PID of the pgbench process. The prefix can be changed by using the --log-prefix option. If the -j option is 2 or higher, so that there are multiple worker threads, each will have its own log file. The first worker will use the same name for its log file as in the standard single worker case. The additional log files for the other workers will be named prefix.nnn.mmm, where mmm is a sequential number for each worker starting with 1.

Each line in a log file describes one transaction. It contains the following space-separated fields:

identifies the client session that ran the transaction

counts how many transactions have been run by that session

transaction's elapsed time, in microseconds

identifies the script file that was used for the transaction (useful when multiple scripts are specified with -f or -b)

transaction's completion time, as a Unix-epoch time stamp

fractional-second part of transaction's completion time, in microseconds

transaction start delay, that is the difference between the transaction's scheduled start time and the time it actually started, in microseconds (present only if --rate is specified)

count of retries after serialization or deadlock errors during the transaction (present only if --max-tries is not equal to one)

When both --rate and --latency-limit are used, the time for a skipped transaction will be reported as skipped. If the transaction ends with a failure, its time will be reported as failed. If you use the --failures-detailed option, the time of the failed transaction will be reported as serialization or deadlock depending on the type of failure (see Failures and Serialization/Deadlock Retries for more information).

Here is a snippet of a log file generated in a single-client run:

Another example with --rate=100 and --latency-limit=5 (note the additional schedule_lag column):

In this example, transaction 82 was late, because its latency (6.173 ms) was over the 5 ms limit. The next two transactions were skipped, because they were already late before they were even started.

The following example shows a snippet of a log file with failures and retries, with the maximum number of tries set to 10 (note the additional retries column):

If the --failures-detailed option is used, the type of failure is reported in the time like this:

When running a long test on hardware that can handle a lot of transactions, the log files can become very large. The --sampling-rate option can be used to log only a random sample of transactions.

With the --aggregate-interval option, a different format is used for the log files. Each log line describes one aggregation interval. It contains the following space-separated fields:

start time of the interval, as a Unix-epoch time stamp

number of transactions within the interval

sum of transaction latencies

sum of squares of transaction latencies

minimum transaction latency

maximum transaction latency

sum of transaction start delays (zero unless --rate is specified)

sum of squares of transaction start delays (zero unless --rate is specified)

minimum transaction start delay (zero unless --rate is specified)

maximum transaction start delay (zero unless --rate is specified)

number of transactions skipped because they would have started too late (zero unless --rate and --latency-limit are specified)

number of retried transactions (zero unless --max-tries is not equal to one)

number of retries after serialization or deadlock errors (zero unless --max-tries is not equal to one)

number of transactions that got a serialization error and were not retried afterwards (zero unless --failures-detailed is specified)

number of transactions that got a deadlock error and were not retried afterwards (zero unless --failures-detailed is specified)

Here is some example output generated with this option:

Notice that while the plain (unaggregated) log format shows which script was used for each transaction, the aggregated format does not. Therefore if you need per-script data, you need to aggregate the data on your own.

With the -r option, pgbench collects the following statistics for each statement:

latency — elapsed transaction time for each statement. pgbench reports an average value of all successful runs of the statement.

The number of failures in this statement. See Failures and Serialization/Deadlock Retries for more information.

The number of retries after a serialization or a deadlock error in this statement. See Failures and Serialization/Deadlock Retries for more information.

The report displays retry statistics only if the --max-tries option is not equal to 1.

All values are computed for each statement executed by every client and are reported after the benchmark has finished.

For the default script, the output will look similar to this:

Another example of output for the default script using serializable default transaction isolation level (PGOPTIONS='-c default_transaction_isolation=serializable' pgbench ...):

If multiple script files are specified, all statistics are reported separately for each script file.

Note that collecting the additional timing information needed for per-statement latency computation adds some overhead. This will slow average execution speed and lower the computed TPS. The amount of slowdown varies significantly depending on platform and hardware. Comparing average TPS values with and without latency reporting enabled is a good way to measure if the timing overhead is significant.

When executing pgbench, there are three main types of errors:

Errors of the main program. They are the most serious and always result in an immediate exit from pgbench with the corresponding error message. They include:

errors at the beginning of pgbench (e.g. an invalid option value);

errors in the initialization mode (e.g. the query to create tables for built-in scripts fails);

errors before starting threads (e.g. could not connect to the database server, syntax error in the meta command, thread creation failure);

internal pgbench errors (which are supposed to never occur...).

Errors when the thread manages its clients (e.g. the client could not start a connection to the database server / the socket for connecting the client to the database server has become invalid). In such cases all clients of this thread stop while other threads continue to work. However, --exit-on-abort is specified, all of the threads stop immediately in this case.

Direct client errors. They lead to immediate exit from pgbench with the corresponding error message in the case of an internal pgbench error (which are supposed to never occur...) or when --exit-on-abort is specified. Otherwise in the worst case they only lead to the abortion of the failed client while other clients continue their run (but some client errors are handled without an abortion of the client and reported separately, see below). Later in this section it is assumed that the discussed errors are only the direct client errors and they are not internal pgbench errors.

A client's run is aborted in case of a serious error; for example, the connection with the database server was lost or the end of script was reached without completing the last transaction. In addition, if execution of an SQL or meta command fails for reasons other than serialization or deadlock errors, the client is aborted. Otherwise, if an SQL command fails with serialization or deadlock errors, the client is not aborted. In such cases, the current transaction is rolled back, which also includes setting the client variables as they were before the run of this transaction (it is assumed that one transaction script contains only one transaction; see What Is the "Transaction" Actually Performed in pgbench? for more information). Transactions with serialization or deadlock errors are repeated after rollbacks until they complete successfully or reach the maximum number of tries (specified by the --max-tries option) / the maximum time of retries (specified by the --latency-limit option) / the end of benchmark (specified by the --time option). If the last trial run fails, this transaction will be reported as failed but the client is not aborted and continues to work.

Without specifying the --max-tries option, a transaction will never be retried after a serialization or deadlock error because its default value is 1. Use an unlimited number of tries (--max-tries=0) and the --latency-limit option to limit only the maximum time of tries. You can also use the --time option to limit the benchmark duration under an unlimited number of tries.

Be careful when repeating scripts that contain multiple transactions: the script is always retried completely, so successful transactions can be performed several times.

Be careful when repeating transactions with shell commands. Unlike the results of SQL commands, the results of shell commands are not rolled back, except for the variable value of the \setshell command.

The latency of a successful transaction includes the entire time of transaction execution with rollbacks and retries. The latency is measured only for successful transactions and commands but not for failed transactions or commands.

The main report contains the number of failed transactions. If the --max-tries option is not equal to 1, the main report also contains statistics related to retries: the total number of retried transactions and total number of retries. The per-script report inherits all these fields from the main report. The per-statement report displays retry statistics only if the --max-tries option is not equal to 1.

If you want to group failures by basic types in per-transaction and aggregation logs, as well as in the main and per-script reports, use the --failures-detailed option. If you also want to distinguish all errors and failures (errors without retrying) by type including which limit for retries was exceeded and how much it was exceeded by for the serialization/deadlock failures, use the --verbose-errors option.

You may specify the Table Access Method for the pgbench tables. The environment variable PGOPTIONS specifies database configuration options that are passed to PostgreSQL via the command line (See Section 19.1.4). For example, a hypothetical default Table Access Method for the tables that pgbench creates called wuzza can be specified with:

It is very easy to use pgbench to produce completely meaningless numbers. Here are some guidelines to help you get useful results.

In the first place, never believe any test that runs for only a few seconds. Use the -t or -T option to make the run last at least a few minutes, so as to average out noise. In some cases you could need hours to get numbers that are reproducible. It's a good idea to try the test run a few times, to find out if your numbers are reproducible or not.

For the default TPC-B-like test scenario, the initialization scale factor (-s) should be at least as large as the largest number of clients you intend to test (-c); else you'll mostly be measuring update contention. There are only -s rows in the pgbench_branches table, and every transaction wants to update one of them, so -c values in excess of -s will undoubtedly result in lots of transactions blocked waiting for other transactions.

The default test scenario is also quite sensitive to how long it's been since the tables were initialized: accumulation of dead rows and dead space in the tables changes the results. To understand the results you must keep track of the total number of updates and when vacuuming happens. If autovacuum is enabled it can result in unpredictable changes in measured performance.

A limitation of pgbench is that it can itself become the bottleneck when trying to test a large number of client sessions. This can be alleviated by running pgbench on a different machine from the database server, although low network latency will be essential. It might even be useful to run several pgbench instances concurrently, on several client machines, against the same database server.

If untrusted users have access to a database that has not adopted a secure schema usage pattern, do not run pgbench in that database. pgbench uses unqualified names and does not manipulate the search path.

**Examples:**

Example 1 (json):
```json
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 10
query mode: simple
number of clients: 10
number of threads: 1
maximum number of tries: 1
number of transactions per client: 1000
number of transactions actually processed: 10000/10000
number of failed transactions: 0 (0.000%)
latency average = 11.013 ms
latency stddev = 7.351 ms
initial connection time = 45.758 ms
tps = 896.967014 (without initial connection time)
```

Example 2 (unknown):
```unknown
pgbench -i [ other-options ] dbname
```

Example 3 (unknown):
```unknown
other-options
```

Example 4 (unknown):
```unknown
pgbench_accounts
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-close.html

**Contents:**
- dblink_close
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_close — closes a cursor in a remote database

dblink_close closes a cursor previously opened with dblink_open.

Name of the connection to use; omit this parameter to use the unnamed connection.

The name of the cursor to close.

If true (the default when omitted) then an error thrown on the remote side of the connection causes an error to also be thrown locally. If false, the remote error is locally reported as a NOTICE, and the function's return value is set to ERROR.

Returns status, either OK or ERROR.

If dblink_open started an explicit transaction block, and this is the last remaining open cursor in this connection, dblink_close will issue the matching COMMIT.

**Examples:**

Example 1 (unknown):
```unknown
dblink_close
```

Example 2 (unknown):
```unknown
dblink_open
```

Example 3 (unknown):
```unknown
fail_on_error
```

Example 4 (unknown):
```unknown
dblink_open
```

---


---

## 


**URL:** https://www.postgresql.org/docs/18/contrib-dblink-connect.html

**Contents:**
- dblink_connect
- Synopsis
- Description
- Arguments
- Return Value
- Notes
- Examples

dblink_connect — opens a persistent connection to a remote database

dblink_connect() establishes a connection to a remote PostgreSQL database. The server and database to be contacted are identified through a standard libpq connection string. Optionally, a name can be assigned to the connection. Multiple named connections can be open at once, but only one unnamed connection is permitted at a time. The connection will persist until closed or until the database session is ended.

The connection string may also be the name of an existing foreign server. It is recommended to use the foreign-data wrapper dblink_fdw when defining the foreign server. See the example below, as well as CREATE SERVER and CREATE USER MAPPING.

The name to use for this connection; if omitted, an unnamed connection is opened, replacing any existing unnamed connection.

libpq-style connection info string, for example hostaddr=127.0.0.1 port=5432 dbname=mydb user=postgres password=mypasswd options=-csearch_path=. For details see Section 32.1.1. Alternatively, the name of a foreign server.

Returns status, which is always OK (since any error causes the function to throw an error instead of returning).

If untrusted users have access to a database that has not adopted a secure schema usage pattern, begin each session by removing publicly-writable schemas from search_path. One could, for example, add options=-csearch_path= to connstr. This consideration is not specific to dblink; it applies to every interface for executing arbitrary SQL commands.

The foreign-data wrapper dblink_fdw has an additional Boolean option use_scram_passthrough that controls whether dblink will use the SCRAM pass-through authentication to connect to the remote database. With SCRAM pass-through authentication, dblink uses SCRAM-hashed secrets instead of plain-text user passwords to connect to the remote server. This avoids storing plain-text user passwords in PostgreSQL system catalogs. See the documentation of the equivalent use_scram_passthrough option of postgres_fdw for further details and restrictions.

Only superusers may use dblink_connect to create connections that use neither password authentication, SCRAM pass-through, nor GSSAPI-authentication. If non-superusers need this capability, use dblink_connect_u instead.

It is unwise to choose connection names that contain equal signs, as this opens a risk of confusion with connection info strings in other dblink functions.

**Examples:**

Example 1 (unknown):
```unknown
dblink_connect()
```

Example 2 (unknown):
```unknown
hostaddr=127.0.0.1 port=5432 dbname=mydb user=postgres password=mypasswd options=-csearch_path=
```

Example 3 (unknown):
```unknown
search_path
```

Example 4 (unknown):
```unknown
options=-csearch_path=
```

---


---

