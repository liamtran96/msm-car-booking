# Postgresql - Getting Started

**Pages:** 46

---

## 31.1. Running the Tests #

**URL:** https://www.postgresql.org/docs/18/regress-run.html

**Contents:**
- 31.1. Running the Tests #
  - 31.1.1. Running the Tests Against a Temporary Installation #
  - 31.1.2. Running the Tests Against an Existing Installation #
  - 31.1.3. Additional Test Suites #
  - 31.1.4. Locale and Encoding #
  - 31.1.5. Custom Server Settings #
  - 31.1.6. Extra Tests #

The regression tests can be run against an already installed and running server, or using a temporary installation within the build tree. Furthermore, there is a “parallel” and a “sequential” mode for running the tests. The sequential method runs each test script alone, while the parallel method starts up multiple server processes to run groups of tests in parallel. Parallel testing adds confidence that interprocess communication and locking are working correctly. Some tests may run sequentially even in the “parallel” mode in case this is required by the test.

To run the parallel regression tests after building but before installation, type:

in the top-level directory. (Or you can change to src/test/regress and run the command there.) Tests which are run in parallel are prefixed with “+”, and tests which run sequentially are prefixed with “-”. At the end you should see something like:

or otherwise a note about which tests failed. See Section 31.2 below before assuming that a “failure” represents a serious problem.

Because this test method runs a temporary server, it will not work if you did the build as the root user, since the server will not start as root. Recommended procedure is not to do the build as root, or else to perform testing after completing the installation.

If you have configured PostgreSQL to install into a location where an older PostgreSQL installation already exists, and you perform make check before installing the new version, you might find that the tests fail because the new programs try to use the already-installed shared libraries. (Typical symptoms are complaints about undefined symbols.) If you wish to run the tests before overwriting the old installation, you'll need to build with configure --disable-rpath. It is not recommended that you use this option for the final installation, however.

The parallel regression test starts quite a few processes under your user ID. Presently, the maximum concurrency is twenty parallel test scripts, which means forty processes: there's a server process and a psql process for each test script. So if your system enforces a per-user limit on the number of processes, make sure this limit is at least fifty or so, else you might get random-seeming failures in the parallel test. If you are not in a position to raise the limit, you can cut down the degree of parallelism by setting the MAX_CONNECTIONS parameter. For example:

runs no more than ten tests concurrently.

To run the tests after installation (see Chapter 17), initialize a data directory and start the server as explained in Chapter 18, then type:

or for a parallel test:

The tests will expect to contact the server at the local host and the default port number, unless directed otherwise by PGHOST and PGPORT environment variables. The tests will be run in a database named regression; any existing database by this name will be dropped.

The tests will also transiently create some cluster-wide objects, such as roles, tablespaces, and subscriptions. These objects will have names beginning with regress_. Beware of using installcheck mode with an installation that has any actual global objects named that way.

The make check and make installcheck commands run only the “core” regression tests, which test built-in functionality of the PostgreSQL server. The source distribution contains many additional test suites, most of them having to do with add-on functionality such as optional procedural languages.

To run all test suites applicable to the modules that have been selected to be built, including the core tests, type one of these commands at the top of the build tree:

These commands run the tests using temporary servers or an already-installed server, respectively, just as previously explained for make check and make installcheck. Other considerations are the same as previously explained for each method. Note that make check-world builds a separate instance (temporary data directory) for each tested module, so it requires more time and disk space than make installcheck-world.

On a modern machine with multiple CPU cores and no tight operating-system limits, you can make things go substantially faster with parallelism. The recipe that most PostgreSQL developers actually use for running all tests is something like

with a -j limit near to or a bit more than the number of available cores. Discarding stdout eliminates chatter that's not interesting when you just want to verify success. (In case of failure, the stderr messages are usually enough to determine where to look closer.)

Alternatively, you can run individual test suites by typing make check or make installcheck in the appropriate subdirectory of the build tree. Keep in mind that make installcheck assumes you've installed the relevant module(s), not only the core server.

The additional tests that can be invoked this way include:

Regression tests for optional procedural languages. These are located under src/pl.

Regression tests for contrib modules, located under contrib. Not all contrib modules have tests.

Regression tests for the interface libraries, located in src/interfaces/libpq/test and src/interfaces/ecpg/test.

Tests for core-supported authentication methods, located in src/test/authentication. (See below for additional authentication-related tests.)

Tests stressing behavior of concurrent sessions, located in src/test/isolation.

Tests for crash recovery and physical replication, located in src/test/recovery.

Tests for logical replication, located in src/test/subscription.

Tests of client programs, located under src/bin.

When using installcheck mode, these tests will create and destroy test databases whose names include regression, for example pl_regression or contrib_regression. Beware of using installcheck mode with an installation that has any non-test databases named that way.

Some of these auxiliary test suites use the TAP infrastructure explained in Section 31.4. The TAP-based tests are run only when PostgreSQL was configured with the option --enable-tap-tests. This is recommended for development, but can be omitted if there is no suitable Perl installation.

Some test suites are not run by default, either because they are not secure to run on a multiuser system, because they require special software or because they are resource intensive. You can decide which test suites to run additionally by setting the make or environment variable PG_TEST_EXTRA to a whitespace-separated list, for example:

The following values are currently supported:

Runs the test suite under src/test/kerberos. This requires an MIT Kerberos installation and opens TCP/IP listen sockets.

Runs the test suite under src/test/ldap. This requires an OpenLDAP installation and opens TCP/IP listen sockets.

Runs the test src/interfaces/libpq/t/005_negotiate_encryption.pl. This opens TCP/IP listen sockets. If PG_TEST_EXTRA also includes kerberos, additional tests that require an MIT Kerberos installation are enabled.

Runs the test src/interfaces/libpq/t/004_load_balance_dns.pl. This requires editing the system hosts file and opens TCP/IP listen sockets.

Runs the test suite under src/test/modules/oauth_validator. This opens TCP/IP listen sockets for a test server running HTTPS.

Runs an additional test suite in src/bin/pg_upgrade/t/002_pg_upgrade.pl which cycles the regression database through pg_dump/ pg_restore. Not enabled by default because it is resource intensive.

Runs the test suite under contrib/sepgsql. This requires an SELinux environment that is set up in a specific way; see Section F.40.3.

Runs the test suite under src/test/ssl. This opens TCP/IP listen sockets.

Uses wal_consistency_checking=all while running certain tests under src/test/recovery. Not enabled by default because it is resource intensive.

Runs the test suite under src/test/modules/xid_wraparound. Not enabled by default because it is resource intensive.

Tests for features that are not supported by the current build configuration are not run even if they are mentioned in PG_TEST_EXTRA.

In addition, there are tests in src/test/modules which will be run by make check-world but not by make installcheck-world. This is because they install non-production extensions or have other side-effects that are considered undesirable for a production installation. You can use make install and make installcheck in one of those subdirectories if you wish, but it's not recommended to do so with a non-test server.

By default, tests using a temporary installation use the locale defined in the current environment and the corresponding database encoding as determined by initdb. It can be useful to test different locales by setting the appropriate environment variables, for example:

For implementation reasons, setting LC_ALL does not work for this purpose; all the other locale-related environment variables do work.

When testing against an existing installation, the locale is determined by the existing database cluster and cannot be set separately for the test run.

You can also choose the database encoding explicitly by setting the variable ENCODING, for example:

Setting the database encoding this way typically only makes sense if the locale is C; otherwise the encoding is chosen automatically from the locale, and specifying an encoding that does not match the locale will result in an error.

The database encoding can be set for tests against either a temporary or an existing installation, though in the latter case it must be compatible with the installation's locale.

There are several ways to use custom server settings when running a test suite. This can be useful to enable additional logging, adjust resource limits, or enable extra run-time checks such as debug_discard_caches. But note that not all tests can be expected to pass cleanly with arbitrary settings.

Extra options can be passed to the various initdb commands that are run internally during test setup using the environment variable PG_TEST_INITDB_EXTRA_OPTS. For example, to run a test with checksums enabled and a custom WAL segment size and work_mem setting, use:

For the core regression test suite and other tests driven by pg_regress, custom run-time server settings can also be set in the PGOPTIONS environment variable (for settings that allow this), for example:

(This makes use of functionality provided by libpq; see options for details.)

When running against a temporary installation, custom settings can also be set by supplying a pre-written postgresql.conf:

The core regression test suite contains a few test files that are not run by default, because they might be platform-dependent or take a very long time to run. You can run these or other extra test files by setting the variable EXTRA_TESTS. For example, to run the numeric_big test:

**Examples:**

Example 1 (unknown):
```unknown
src/test/regress
```

Example 2 (markdown):
```markdown
# All 213 tests passed.
```

Example 3 (markdown):
```markdown
# All 213 tests passed.
```

Example 4 (unknown):
```unknown
configure --disable-rpath
```

---

## 17.1. Requirements #

**URL:** https://www.postgresql.org/docs/18/install-requirements.html

**Contents:**
- 17.1. Requirements #

In general, a modern Unix-compatible platform should be able to run PostgreSQL. The platforms that had received specific testing at the time of release are described in Section 17.6 below.

The following software packages are required for building PostgreSQL:

GNU make version 3.81 or newer is required; other make programs or older GNU make versions will not work. (GNU make is sometimes installed under the name gmake.) To test for GNU make enter:

Alternatively, PostgreSQL can be built using Meson. This is the only option for building PostgreSQL on Windows using Visual Studio. For other platforms, using Meson is currently experimental. If you choose to use Meson, then you don't need GNU make, but the other requirements below still apply.

The minimum required version of Meson is 0.54.

You need an ISO/ANSI C compiler (at least C99-compliant). Recent versions of GCC are recommended, but PostgreSQL is known to build using a wide variety of compilers from different vendors.

tar is required to unpack the source distribution, in addition to either gzip or bzip2.

Flex and Bison are required. Other lex and yacc programs cannot be used. Bison needs to be at least version 2.3.

Perl 5.14 or later is needed during the build process and to run some test suites. (This requirement is separate from the requirements for building PL/Perl; see below.)

The GNU Readline library is used by default. It allows psql (the PostgreSQL command line SQL interpreter) to remember each command you type, and allows you to use arrow keys to recall and edit previous commands. This is very helpful and is strongly recommended. If you don't want to use it then you must specify the --without-readline option to configure. As an alternative, you can often use the BSD-licensed libedit library, originally developed on NetBSD. The libedit library is GNU Readline-compatible and is used if libreadline is not found, or if --with-libedit-preferred is used as an option to configure. If you are using a package-based Linux distribution, be aware that you need both the readline and readline-devel packages, if those are separate in your distribution.

The zlib compression library is used by default. If you don't want to use it then you must specify the --without-zlib option to configure. Using this option disables support for compressed archives in pg_dump and pg_restore.

The ICU library is used by default. If you don't want to use it then you must specify the --without-icu option to configure. Using this option disables support for ICU collation features (see Section 23.2).

ICU support requires the ICU4C package to be installed. The minimum required version of ICU4C is currently 4.2.

By default, pkg-config will be used to find the required compilation options. This is supported for ICU4C version 4.6 and later. For older versions, or if pkg-config is not available, the variables ICU_CFLAGS and ICU_LIBS can be specified to configure, like in this example:

(If ICU4C is in the default search path for the compiler, then you still need to specify nonempty strings in order to avoid use of pkg-config, for example, ICU_CFLAGS=' '.)

The following packages are optional. They are not required in the default configuration, but they are needed when certain build options are enabled, as explained below:

To build the server programming language PL/Perl you need a full Perl installation, including the libperl library and the header files. The minimum required version is Perl 5.14. Since PL/Perl will be a shared library, the libperl library must be a shared library also on most platforms. This appears to be the default in recent Perl versions, but it was not in earlier versions, and in any case it is the choice of whomever installed Perl at your site. configure will fail if building PL/Perl is selected but it cannot find a shared libperl. In that case, you will have to rebuild and install Perl manually to be able to build PL/Perl. During the configuration process for Perl, request a shared library.

If you intend to make more than incidental use of PL/Perl, you should ensure that the Perl installation was built with the usemultiplicity option enabled (perl -V will show whether this is the case).

To build the PL/Python server programming language, you need a Python installation with the header files and the sysconfig module. The minimum supported version is Python 3.6.8.

Since PL/Python will be a shared library, the libpython library must be a shared library also on most platforms. This is not the case in a default Python installation built from source, but a shared library is available in many operating system distributions. configure will fail if building PL/Python is selected but it cannot find a shared libpython. That might mean that you either have to install additional packages or rebuild (part of) your Python installation to provide this shared library. When building from source, run Python's configure with the --enable-shared flag.

To build the PL/Tcl procedural language, you of course need a Tcl installation. The minimum required version is Tcl 8.4.

To enable Native Language Support (NLS), that is, the ability to display a program's messages in a language other than English, you need an implementation of the Gettext API. Some operating systems have this built-in (e.g., Linux, NetBSD, Solaris), for other systems you can download an add-on package from https://www.gnu.org/software/gettext/. If you are using the Gettext implementation in the GNU C library, then you will additionally need the GNU Gettext package for some utility programs. For any of the other implementations you will not need it.

You need OpenSSL, if you want to support encrypted client connections. OpenSSL is also required for random number generation on platforms that do not have /dev/urandom (except Windows). The minimum required version is 1.1.1.

Additionally, LibreSSL is supported using the OpenSSL compatibility layer. The minimum required version is 3.4 (from OpenBSD version 7.0).

You need MIT Kerberos (for GSSAPI), OpenLDAP, and/or PAM, if you want to support authentication using those services.

You need Curl to build an optional module which implements the OAuth Device Authorization flow for client applications.

You need LZ4, if you want to support compression of data with that method; see default_toast_compression and wal_compression.

You need Zstandard, if you want to support compression of data with that method; see wal_compression. The minimum required version is 1.4.0.

To build the PostgreSQL documentation, there is a separate set of requirements; see Section J.2.

If you need to get a GNU package, you can find it at your local GNU mirror site (see https://www.gnu.org/prep/ftp for a list) or at ftp://ftp.gnu.org/gnu/.

**Examples:**

Example 1 (unknown):
```unknown
make --version
```

Example 2 (unknown):
```unknown
make --version
```

Example 3 (unknown):
```unknown
--without-readline
```

Example 4 (unknown):
```unknown
libreadline
```

---

## 3.2. Views #

**URL:** https://www.postgresql.org/docs/18/tutorial-views.html

**Contents:**
- 3.2. Views #

Refer back to the queries in Section 2.6. Suppose the combined listing of weather records and city location is of particular interest to your application, but you do not want to type the query each time you need it. You can create a view over the query, which gives a name to the query that you can refer to like an ordinary table:

Making liberal use of views is a key aspect of good SQL database design. Views allow you to encapsulate the details of the structure of your tables, which might change as your application evolves, behind consistent interfaces.

Views can be used in almost any place a real table can be used. Building views upon other views is not uncommon.

**Examples:**

Example 1 (sql):
```sql
CREATE VIEW myview AS
    SELECT name, temp_lo, temp_hi, prcp, date, location
        FROM weather, cities
        WHERE city = name;

SELECT * FROM myview;
```

---

## 3.3. Foreign Keys #

**URL:** https://www.postgresql.org/docs/18/tutorial-fk.html

**Contents:**
- 3.3. Foreign Keys #

Recall the weather and cities tables from Chapter 2. Consider the following problem: You want to make sure that no one can insert rows in the weather table that do not have a matching entry in the cities table. This is called maintaining the referential integrity of your data. In simplistic database systems this would be implemented (if at all) by first looking at the cities table to check if a matching record exists, and then inserting or rejecting the new weather records. This approach has a number of problems and is very inconvenient, so PostgreSQL can do this for you.

The new declaration of the tables would look like this:

Now try inserting an invalid record:

The behavior of foreign keys can be finely tuned to your application. We will not go beyond this simple example in this tutorial, but just refer you to Chapter 5 for more information. Making correct use of foreign keys will definitely improve the quality of your database applications, so you are strongly encouraged to learn about them.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE cities (
        name     varchar(80) primary key,
        location point
);

CREATE TABLE weather (
        city      varchar(80) references cities(name),
        temp_lo   int,
        temp_hi   int,
        prcp      real,
        date      date
);
```

Example 2 (sql):
```sql
INSERT INTO weather VALUES ('Berkeley', 45, 53, 0.0, '1994-11-28');
```

Example 3 (yaml):
```yaml
ERROR:  insert or update on table "weather" violates foreign key constraint "weather_city_fkey"
DETAIL:  Key (city)=(Berkeley) is not present in table "cities".
```

---

## 3.4. Transactions #

**URL:** https://www.postgresql.org/docs/18/tutorial-transactions.html

**Contents:**
- 3.4. Transactions #
  - Note

Transactions are a fundamental concept of all database systems. The essential point of a transaction is that it bundles multiple steps into a single, all-or-nothing operation. The intermediate states between the steps are not visible to other concurrent transactions, and if some failure occurs that prevents the transaction from completing, then none of the steps affect the database at all.

For example, consider a bank database that contains balances for various customer accounts, as well as total deposit balances for branches. Suppose that we want to record a payment of $100.00 from Alice's account to Bob's account. Simplifying outrageously, the SQL commands for this might look like:

The details of these commands are not important here; the important point is that there are several separate updates involved to accomplish this rather simple operation. Our bank's officers will want to be assured that either all these updates happen, or none of them happen. It would certainly not do for a system failure to result in Bob receiving $100.00 that was not debited from Alice. Nor would Alice long remain a happy customer if she was debited without Bob being credited. We need a guarantee that if something goes wrong partway through the operation, none of the steps executed so far will take effect. Grouping the updates into a transaction gives us this guarantee. A transaction is said to be atomic: from the point of view of other transactions, it either happens completely or not at all.

We also want a guarantee that once a transaction is completed and acknowledged by the database system, it has indeed been permanently recorded and won't be lost even if a crash ensues shortly thereafter. For example, if we are recording a cash withdrawal by Bob, we do not want any chance that the debit to his account will disappear in a crash just after he walks out the bank door. A transactional database guarantees that all the updates made by a transaction are logged in permanent storage (i.e., on disk) before the transaction is reported complete.

Another important property of transactional databases is closely related to the notion of atomic updates: when multiple transactions are running concurrently, each one should not be able to see the incomplete changes made by others. For example, if one transaction is busy totalling all the branch balances, it would not do for it to include the debit from Alice's branch but not the credit to Bob's branch, nor vice versa. So transactions must be all-or-nothing not only in terms of their permanent effect on the database, but also in terms of their visibility as they happen. The updates made so far by an open transaction are invisible to other transactions until the transaction completes, whereupon all the updates become visible simultaneously.

In PostgreSQL, a transaction is set up by surrounding the SQL commands of the transaction with BEGIN and COMMIT commands. So our banking transaction would actually look like:

If, partway through the transaction, we decide we do not want to commit (perhaps we just noticed that Alice's balance went negative), we can issue the command ROLLBACK instead of COMMIT, and all our updates so far will be canceled.

PostgreSQL actually treats every SQL statement as being executed within a transaction. If you do not issue a BEGIN command, then each individual statement has an implicit BEGIN and (if successful) COMMIT wrapped around it. A group of statements surrounded by BEGIN and COMMIT is sometimes called a transaction block.

Some client libraries issue BEGIN and COMMIT commands automatically, so that you might get the effect of transaction blocks without asking. Check the documentation for the interface you are using.

It's possible to control the statements in a transaction in a more granular fashion through the use of savepoints. Savepoints allow you to selectively discard parts of the transaction, while committing the rest. After defining a savepoint with SAVEPOINT, you can if needed roll back to the savepoint with ROLLBACK TO. All the transaction's database changes between defining the savepoint and rolling back to it are discarded, but changes earlier than the savepoint are kept.

After rolling back to a savepoint, it continues to be defined, so you can roll back to it several times. Conversely, if you are sure you won't need to roll back to a particular savepoint again, it can be released, so the system can free some resources. Keep in mind that either releasing or rolling back to a savepoint will automatically release all savepoints that were defined after it.

All this is happening within the transaction block, so none of it is visible to other database sessions. When and if you commit the transaction block, the committed actions become visible as a unit to other sessions, while the rolled-back actions never become visible at all.

Remembering the bank database, suppose we debit $100.00 from Alice's account, and credit Bob's account, only to find later that we should have credited Wally's account. We could do it using savepoints like this:

This example is, of course, oversimplified, but there's a lot of control possible in a transaction block through the use of savepoints. Moreover, ROLLBACK TO is the only way to regain control of a transaction block that was put in aborted state by the system due to an error, short of rolling it back completely and starting again.

**Examples:**

Example 1 (sql):
```sql
UPDATE accounts SET balance = balance - 100.00
    WHERE name = 'Alice';
UPDATE branches SET balance = balance - 100.00
    WHERE name = (SELECT branch_name FROM accounts WHERE name = 'Alice');
UPDATE accounts SET balance = balance + 100.00
    WHERE name = 'Bob';
UPDATE branches SET balance = balance + 100.00
    WHERE name = (SELECT branch_name FROM accounts WHERE name = 'Bob');
```

Example 2 (sql):
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100.00
    WHERE name = 'Alice';
-- etc etc
COMMIT;
```

Example 3 (unknown):
```unknown
ROLLBACK TO
```

Example 4 (sql):
```sql
BEGIN;
UPDATE accounts SET balance = balance - 100.00
    WHERE name = 'Alice';
SAVEPOINT my_savepoint;
UPDATE accounts SET balance = balance + 100.00
    WHERE name = 'Bob';
-- oops ... forget that and use Wally's account
ROLLBACK TO my_savepoint;
UPDATE accounts SET balance = balance + 100.00
    WHERE name = 'Wally';
COMMIT;
```

---

## 28.3. Write-Ahead Logging (WAL) #

**URL:** https://www.postgresql.org/docs/18/wal-intro.html

**Contents:**
- 28.3. Write-Ahead Logging (WAL) #
  - Tip

Write-Ahead Logging (WAL) is a standard method for ensuring data integrity. A detailed description can be found in most (if not all) books about transaction processing. Briefly, WAL's central concept is that changes to data files (where tables and indexes reside) must be written only after those changes have been logged, that is, after WAL records describing the changes have been flushed to permanent storage. If we follow this procedure, we do not need to flush data pages to disk on every transaction commit, because we know that in the event of a crash we will be able to recover the database using the log: any changes that have not been applied to the data pages can be redone from the WAL records. (This is roll-forward recovery, also known as REDO.)

Because WAL restores database file contents after a crash, journaled file systems are not necessary for reliable storage of the data files or WAL files. In fact, journaling overhead can reduce performance, especially if journaling causes file system data to be flushed to disk. Fortunately, data flushing during journaling can often be disabled with a file system mount option, e.g., data=writeback on a Linux ext3 file system. Journaled file systems do improve boot speed after a crash.

Using WAL results in a significantly reduced number of disk writes, because only the WAL file needs to be flushed to disk to guarantee that a transaction is committed, rather than every data file changed by the transaction. The WAL file is written sequentially, and so the cost of syncing the WAL is much less than the cost of flushing the data pages. This is especially true for servers handling many small transactions touching different parts of the data store. Furthermore, when the server is processing many small concurrent transactions, one fsync of the WAL file may suffice to commit many transactions.

WAL also makes it possible to support on-line backup and point-in-time recovery, as described in Section 25.3. By archiving the WAL data we can support reverting to any time instant covered by the available WAL data: we simply install a prior physical backup of the database, and replay the WAL just as far as the desired time. What's more, the physical backup doesn't have to be an instantaneous snapshot of the database state — if it is made over some period of time, then replaying the WAL for that period will fix any internal inconsistencies.

**Examples:**

Example 1 (unknown):
```unknown
data=writeback
```

---

## 17.5. Post-Installation Setup #

**URL:** https://www.postgresql.org/docs/18/install-post.html

**Contents:**
- 17.5. Post-Installation Setup #
  - 17.5.1. Shared Libraries #
  - 17.5.2. Environment Variables #

On some systems with shared libraries you need to tell the system how to find the newly installed shared libraries. The systems on which this is not necessary include FreeBSD, Linux, NetBSD, OpenBSD, and Solaris.

The method to set the shared library search path varies between platforms, but the most widely-used method is to set the environment variable LD_LIBRARY_PATH like so: In Bourne shells (sh, ksh, bash, zsh):

Replace /usr/local/pgsql/lib with whatever you set --libdir to in Step 1. You should put these commands into a shell start-up file such as /etc/profile or ~/.bash_profile. Some good information about the caveats associated with this method can be found at http://xahlee.info/UnixResource_dir/_/ldpath.html.

On some systems it might be preferable to set the environment variable LD_RUN_PATH before building.

On Cygwin, put the library directory in the PATH or move the .dll files into the bin directory.

If in doubt, refer to the manual pages of your system (perhaps ld.so or rld). If you later get a message like:

then this step was necessary. Simply take care of it then.

If you are on Linux and you have root access, you can run:

(or equivalent directory) after installation to enable the run-time linker to find the shared libraries faster. Refer to the manual page of ldconfig for more information. On FreeBSD, NetBSD, and OpenBSD the command is:

instead. Other systems are not known to have an equivalent command.

If you installed into /usr/local/pgsql or some other location that is not searched for programs by default, you should add /usr/local/pgsql/bin (or whatever you set --bindir to in Step 1) into your PATH. Strictly speaking, this is not necessary, but it will make the use of PostgreSQL much more convenient.

To do this, add the following to your shell start-up file, such as ~/.bash_profile (or /etc/profile, if you want it to affect all users):

If you are using csh or tcsh, then use this command:

To enable your system to find the man documentation, you need to add lines like the following to a shell start-up file unless you installed into a location that is searched by default:

The environment variables PGHOST and PGPORT specify to client applications the host and port of the database server, overriding the compiled-in defaults. If you are going to run client applications remotely then it is convenient if every user that plans to use the database sets PGHOST. This is not required, however; the settings can be communicated via command line options to most client programs.

**Examples:**

Example 1 (unknown):
```unknown
LD_LIBRARY_PATH
```

Example 2 (unknown):
```unknown
LD_LIBRARY_PATH=/usr/local/pgsql/lib
export LD_LIBRARY_PATH
```

Example 3 (unknown):
```unknown
setenv LD_LIBRARY_PATH /usr/local/pgsql/lib
```

Example 4 (unknown):
```unknown
/usr/local/pgsql/lib
```

---

## 17.2. Getting the Source #

**URL:** https://www.postgresql.org/docs/18/install-getsource.html

**Contents:**
- 17.2. Getting the Source #

The PostgreSQL source code for released versions can be obtained from the download section of our website: https://www.postgresql.org/ftp/source/. Download the postgresql-version.tar.gz or postgresql-version.tar.bz2 file you're interested in, then unpack it:

This will create a directory postgresql-version under the current directory with the PostgreSQL sources. Change into that directory for the rest of the installation procedure.

Alternatively, you can use the Git version control system; see Section I.1 for more information.

**Examples:**

Example 1 (unknown):
```unknown
postgresql-version.tar.gz
```

Example 2 (unknown):
```unknown
postgresql-version.tar.bz2
```

Example 3 (unknown):
```unknown
tar xf postgresql-version.tar.bz2
```

Example 4 (unknown):
```unknown
tar xf postgresql-version.tar.bz2
```

---

## 17.3. Building and Installation with Autoconf and Make #

**URL:** https://www.postgresql.org/docs/18/install-make.html

**Contents:**
- 17.3. Building and Installation with Autoconf and Make #
  - 17.3.1. Short Version #
  - 17.3.2. Installation Procedure #
  - Note
  - 17.3.3. configure Options #
    - 17.3.3.1. Installation Locations #
  - Note
    - 17.3.3.2. PostgreSQL Features #
    - 17.3.3.3. Anti-Features #
    - 17.3.3.4. Build Process Details #

The long version is the rest of this section.

The first step of the installation procedure is to configure the source tree for your system and choose the options you would like. This is done by running the configure script. For a default installation simply enter:

This script will run a number of tests to determine values for various system dependent variables and detect any quirks of your operating system, and finally will create several files in the build tree to record what it found.

You can also run configure in a directory outside the source tree, and then build there, if you want to keep the build directory separate from the original source files. This procedure is called a VPATH build. Here's how:

The default configuration will build the server and utilities, as well as all client applications and interfaces that require only a C compiler. All files will be installed under /usr/local/pgsql by default.

You can customize the build and installation process by supplying one or more command line options to configure. Typically you would customize the install location, or the set of optional features that are built. configure has a large number of options, which are described in Section 17.3.3.

Also, configure responds to certain environment variables, as described in Section 17.3.4. These provide additional ways to customize the configuration.

To start the build, type either of:

(Remember to use GNU make.) The build will take a few minutes depending on your hardware.

If you want to build everything that can be built, including the documentation (HTML and man pages), and the additional modules (contrib), type instead:

If you want to build everything that can be built, including the additional modules (contrib), but without the documentation, type instead:

If you want to invoke the build from another makefile rather than manually, you must unset MAKELEVEL or set it to zero, for instance like this:

Failure to do that can lead to strange error messages, typically about missing header files.

If you want to test the newly built server before you install it, you can run the regression tests at this point. The regression tests are a test suite to verify that PostgreSQL runs on your machine in the way the developers expected it to. Type:

(This won't work as root; do it as an unprivileged user.) See Chapter 31 for detailed information about interpreting the test results. You can repeat this test at any later time by issuing the same command.

If you are upgrading an existing system be sure to read Section 18.6, which has instructions about upgrading a cluster.

To install PostgreSQL enter:

This will install files into the directories that were specified in Step 1. Make sure that you have appropriate permissions to write into that area. Normally you need to do this step as root. Alternatively, you can create the target directories in advance and arrange for appropriate permissions to be granted.

To install the documentation (HTML and man pages), enter:

If you built the world above, type instead:

This also installs the documentation.

If you built the world without the documentation above, type instead:

You can use make install-strip instead of make install to strip the executable files and libraries as they are installed. This will save some space. If you built with debugging support, stripping will effectively remove the debugging support, so it should only be done if debugging is no longer needed. install-strip tries to do a reasonable job saving space, but it does not have perfect knowledge of how to strip every unneeded byte from an executable file, so if you want to save all the disk space you possibly can, you will have to do manual work.

The standard installation provides all the header files needed for client application development as well as for server-side program development, such as custom functions or data types written in C.

Client-only installation: If you want to install only the client applications and interface libraries, then you can use these commands:

src/bin has a few binaries for server-only use, but they are small.

Uninstallation: To undo the installation use the command make uninstall. However, this will not remove any created directories.

Cleaning: After the installation you can free disk space by removing the built files from the source tree with the command make clean. This will preserve the files made by the configure program, so that you can rebuild everything with make later on. To reset the source tree to the state in which it was distributed, use make distclean. If you are going to build for several platforms within the same source tree you must do this and re-configure for each platform. (Alternatively, use a separate build tree for each platform, so that the source tree remains unmodified.)

If you perform a build and then discover that your configure options were wrong, or if you change anything that configure investigates (for example, software upgrades), then it's a good idea to do make distclean before reconfiguring and rebuilding. Without this, your changes in configuration choices might not propagate everywhere they need to.

configure's command line options are explained below. This list is not exhaustive (use ./configure --help to get one that is). The options not covered here are meant for advanced use-cases such as cross-compilation, and are documented in the standard Autoconf documentation.

These options control where make install will put the files. The --prefix option is sufficient for most cases. If you have special needs, you can customize the installation subdirectories with the other options described in this section. Beware however that changing the relative locations of the different subdirectories may render the installation non-relocatable, meaning you won't be able to move it after installation. (The man and doc locations are not affected by this restriction.) For relocatable installs, you might want to use the --disable-rpath option described later.

Install all files under the directory PREFIX instead of /usr/local/pgsql. The actual files will be installed into various subdirectories; no files will ever be installed directly into the PREFIX directory.

You can install architecture-dependent files under a different prefix, EXEC-PREFIX, than what PREFIX was set to. This can be useful to share architecture-independent files between hosts. If you omit this, then EXEC-PREFIX is set equal to PREFIX and both architecture-dependent and independent files will be installed under the same tree, which is probably what you want.

Specifies the directory for executable programs. The default is EXEC-PREFIX/bin, which normally means /usr/local/pgsql/bin.

Sets the directory for various configuration files, PREFIX/etc by default.

Sets the location to install libraries and dynamically loadable modules. The default is EXEC-PREFIX/lib.

Sets the directory for installing C and C++ header files. The default is PREFIX/include.

Sets the root directory for various types of read-only data files. This only sets the default for some of the following options. The default is PREFIX/share.

Sets the directory for read-only data files used by the installed programs. The default is DATAROOTDIR. Note that this has nothing to do with where your database files will be placed.

Sets the directory for installing locale data, in particular message translation catalog files. The default is DATAROOTDIR/locale.

The man pages that come with PostgreSQL will be installed under this directory, in their respective manx subdirectories. The default is DATAROOTDIR/man.

Sets the root directory for installing documentation files, except “man” pages. This only sets the default for the following options. The default value for this option is DATAROOTDIR/doc/postgresql.

The HTML-formatted documentation for PostgreSQL will be installed under this directory. The default is DATAROOTDIR.

Care has been taken to make it possible to install PostgreSQL into shared installation locations (such as /usr/local/include) without interfering with the namespace of the rest of the system. First, the string “/postgresql” is automatically appended to datadir, sysconfdir, and docdir, unless the fully expanded directory name already contains the string “postgres” or “pgsql”. For example, if you choose /usr/local as prefix, the documentation will be installed in /usr/local/doc/postgresql, but if the prefix is /opt/postgres, then it will be in /opt/postgres/doc. The public C header files of the client interfaces are installed into includedir and are namespace-clean. The internal header files and the server header files are installed into private directories under includedir. See the documentation of each interface for information about how to access its header files. Finally, a private subdirectory will also be created, if appropriate, under libdir for dynamically loadable modules.

The options described in this section enable building of various PostgreSQL features that are not built by default. Most of these are non-default only because they require additional software, as described in Section 17.1.

Enables Native Language Support (NLS), that is, the ability to display a program's messages in a language other than English. LANGUAGES is an optional space-separated list of codes of the languages that you want supported, for example --enable-nls='de fr'. (The intersection between your list and the set of actually provided translations will be computed automatically.) If you do not specify a list, then all available translations are installed.

To use this option, you will need an implementation of the Gettext API.

Build the PL/Perl server-side language.

Build the PL/Python server-side language.

Build the PL/Tcl server-side language.

Tcl installs the file tclConfig.sh, which contains configuration information needed to build modules interfacing to Tcl. This file is normally found automatically at a well-known location, but if you want to use a different version of Tcl you can specify the directory in which to look for tclConfig.sh.

Build with support for LLVM based JIT compilation (see Chapter 30). This requires the LLVM library to be installed. The minimum required version of LLVM is currently 14.

llvm-config will be used to find the required compilation options. llvm-config will be searched for in your PATH. If that would not yield the desired program, use LLVM_CONFIG to specify a path to the correct llvm-config. For example

LLVM support requires a compatible clang compiler (specified, if necessary, using the CLANG environment variable), and a working C++ compiler (specified, if necessary, using the CXX environment variable).

Build with LZ4 compression support.

Build with Zstandard compression support.

Build with support for SSL (encrypted) connections. The only LIBRARY supported is openssl, which is used for both OpenSSL and LibreSSL. This requires the OpenSSL package to be installed. configure will check for the required header files and libraries to make sure that your OpenSSL installation is sufficient before proceeding.

Obsolete equivalent of --with-ssl=openssl.

Build with support for GSSAPI authentication. MIT Kerberos is required to be installed for GSSAPI. On many systems, the GSSAPI system (a part of the MIT Kerberos installation) is not installed in a location that is searched by default (e.g., /usr/include, /usr/lib), so you must use the options --with-includes and --with-libraries in addition to this option. configure will check for the required header files and libraries to make sure that your GSSAPI installation is sufficient before proceeding.

Build with LDAP support for authentication and connection parameter lookup (see Section 32.18 and Section 20.10 for more information). On Unix, this requires the OpenLDAP package to be installed. On Windows, the default WinLDAP library is used. configure will check for the required header files and libraries to make sure that your OpenLDAP installation is sufficient before proceeding.

Build with PAM (Pluggable Authentication Modules) support.

Build with BSD Authentication support. (The BSD Authentication framework is currently only available on OpenBSD.)

Build with support for systemd service notifications. This improves integration if the server is started under systemd but has no impact otherwise; see Section 18.3 for more information. libsystemd and the associated header files need to be installed to use this option.

Build with support for Bonjour automatic service discovery. This requires Bonjour support in your operating system. Recommended on macOS.

Build the uuid-ossp module (which provides functions to generate UUIDs), using the specified UUID library. LIBRARY must be one of:

bsd to use the UUID functions found in FreeBSD and some other BSD-derived systems

e2fs to use the UUID library created by the e2fsprogs project; this library is present in most Linux systems and in macOS, and can be obtained for other platforms as well

ossp to use the OSSP UUID library

Obsolete equivalent of --with-uuid=ossp.

Build with libcurl support for OAuth 2.0 client flows. Libcurl version 7.61.0 or later is required for this feature. Building with this will check for the required header files and libraries to make sure that your curl installation is sufficient before proceeding.

Build with libnuma support for basic NUMA support. Only supported on platforms for which the libnuma library is implemented.

Build with liburing, enabling io_uring support for asynchronous I/O.

To detect the required compiler and linker options, PostgreSQL will query pkg-config.

To use a liburing installation that is in an unusual location, you can set pkg-config-related environment variables (see its documentation).

Build with libxml2, enabling SQL/XML support. Libxml2 version 2.6.23 or later is required for this feature.

To detect the required compiler and linker options, PostgreSQL will query pkg-config, if that is installed and knows about libxml2. Otherwise the program xml2-config, which is installed by libxml2, will be used if it is found. Use of pkg-config is preferred, because it can deal with multi-architecture installations better.

To use a libxml2 installation that is in an unusual location, you can set pkg-config-related environment variables (see its documentation), or set the environment variable XML2_CONFIG to point to the xml2-config program belonging to the libxml2 installation, or set the variables XML2_CFLAGS and XML2_LIBS. (If pkg-config is installed, then to override its idea of where libxml2 is you must either set XML2_CONFIG or set both XML2_CFLAGS and XML2_LIBS to nonempty strings.)

Build with libxslt, enabling the xml2 module to perform XSL transformations of XML. --with-libxml must be specified as well.

Build with SElinux support, enabling the sepgsql extension.

The options described in this section allow disabling certain PostgreSQL features that are built by default, but which might need to be turned off if the required software or system features are not available. Using these options is not recommended unless really necessary.

Build without support for the ICU library, disabling the use of ICU collation features (see Section 23.2).

Prevents use of the Readline library (and libedit as well). This option disables command-line editing and history in psql.

Favors the use of the BSD-licensed libedit library rather than GPL-licensed Readline. This option is significant only if you have both libraries installed; the default in that case is to use Readline.

Prevents use of the Zlib library. This disables support for compressed archives in pg_dump and pg_restore.

DIRECTORIES is a colon-separated list of directories that will be added to the list the compiler searches for header files. If you have optional packages (such as GNU Readline) installed in a non-standard location, you have to use this option and probably also the corresponding --with-libraries option.

Example: --with-includes=/opt/gnu/include:/usr/sup/include.

DIRECTORIES is a colon-separated list of directories to search for libraries. You will probably have to use this option (and the corresponding --with-includes option) if you have packages installed in non-standard locations.

Example: --with-libraries=/opt/gnu/lib:/usr/sup/lib.

PostgreSQL includes its own time zone database, which it requires for date and time operations. This time zone database is in fact compatible with the IANA time zone database provided by many operating systems such as FreeBSD, Linux, and Solaris, so it would be redundant to install it again. When this option is used, the system-supplied time zone database in DIRECTORY is used instead of the one included in the PostgreSQL source distribution. DIRECTORY must be specified as an absolute path. /usr/share/zoneinfo is a likely directory on some operating systems. Note that the installation routine will not detect mismatching or erroneous time zone data. If you use this option, you are advised to run the regression tests to verify that the time zone data you have pointed to works correctly with PostgreSQL.

This option is mainly aimed at binary package distributors who know their target operating system well. The main advantage of using this option is that the PostgreSQL package won't need to be upgraded whenever any of the many local daylight-saving time rules change. Another advantage is that PostgreSQL can be cross-compiled more straightforwardly if the time zone database files do not need to be built during the installation.

Append STRING to the PostgreSQL version number. You can use this, for example, to mark binaries built from unreleased Git snapshots or containing custom patches with an extra version string, such as a git describe identifier or a distribution package release number.

Do not mark PostgreSQL's executables to indicate that they should search for shared libraries in the installation's library directory (see --libdir). On most platforms, this marking uses an absolute path to the library directory, so that it will be unhelpful if you relocate the installation later. However, you will then need to provide some other way for the executables to find the shared libraries. Typically this requires configuring the operating system's dynamic linker to search the library directory; see Section 17.5.1 for more detail.

It's fairly common, particularly for test builds, to adjust the default port number with --with-pgport. The other options in this section are recommended only for advanced users.

Set NUMBER as the default port number for server and clients. The default is 5432. The port can always be changed later on, but if you specify it here then both server and clients will have the same default compiled in, which can be very convenient. Usually the only good reason to select a non-default value is if you intend to run multiple PostgreSQL servers on the same machine.

The default name of the Kerberos service principal used by GSSAPI. postgres is the default. There's usually no reason to change this unless you are building for a Windows environment, in which case it must be set to upper case POSTGRES.

Set the segment size, in gigabytes. Large tables are divided into multiple operating-system files, each of size equal to the segment size. This avoids problems with file size limits that exist on many platforms. The default segment size, 1 gigabyte, is safe on all supported platforms. If your operating system has “largefile” support (which most do, nowadays), you can use a larger segment size. This can be helpful to reduce the number of file descriptors consumed when working with very large tables. But be careful not to select a value larger than is supported by your platform and the file systems you intend to use. Other tools you might wish to use, such as tar, could also set limits on the usable file size. It is recommended, though not absolutely required, that this value be a power of 2. Note that changing this value breaks on-disk database compatibility, meaning you cannot use pg_upgrade to upgrade to a build with a different segment size.

Set the block size, in kilobytes. This is the unit of storage and I/O within tables. The default, 8 kilobytes, is suitable for most situations; but other values may be useful in special cases. The value must be a power of 2 between 1 and 32 (kilobytes). Note that changing this value breaks on-disk database compatibility, meaning you cannot use pg_upgrade to upgrade to a build with a different block size.

Set the WAL block size, in kilobytes. This is the unit of storage and I/O within the WAL log. The default, 8 kilobytes, is suitable for most situations; but other values may be useful in special cases. The value must be a power of 2 between 1 and 64 (kilobytes). Note that changing this value breaks on-disk database compatibility, meaning you cannot use pg_upgrade to upgrade to a build with a different WAL block size.

Most of the options in this section are only of interest for developing or debugging PostgreSQL. They are not recommended for production builds, except for --enable-debug, which can be useful to enable detailed bug reports in the unlucky event that you encounter a bug. On platforms supporting DTrace, --enable-dtrace may also be reasonable to use in production.

When building an installation that will be used to develop code inside the server, it is recommended to use at least the options --enable-debug and --enable-cassert.

Compiles all programs and libraries with debugging symbols. This means that you can run the programs in a debugger to analyze problems. This enlarges the size of the installed executables considerably, and on non-GCC compilers it usually also disables compiler optimization, causing slowdowns. However, having the symbols available is extremely helpful for dealing with any problems that might arise. Currently, this option is recommended for production installations only if you use GCC. But you should always have it on if you are doing development work or running a beta version.

Enables assertion checks in the server, which test for many “cannot happen” conditions. This is invaluable for code development purposes, but the tests can slow down the server significantly. Also, having the tests turned on won't necessarily enhance the stability of your server! The assertion checks are not categorized for severity, and so what might be a relatively harmless bug will still lead to server restarts if it triggers an assertion failure. This option is not recommended for production use, but you should have it on for development work or when running a beta version.

Enable tests using the Perl TAP tools. This requires a Perl installation and the Perl module IPC::Run. See Section 31.4 for more information.

Enables automatic dependency tracking. With this option, the makefiles are set up so that all affected object files will be rebuilt when any header file is changed. This is useful if you are doing development work, but is just wasted overhead if you intend only to compile once and install. At present, this option only works with GCC.

If using GCC, all programs and libraries are compiled with code coverage testing instrumentation. When run, they generate files in the build directory with code coverage metrics. See Section 31.5 for more information. This option is for use only with GCC and when doing development work.

If using GCC, all programs and libraries are compiled so they can be profiled. On backend exit, a subdirectory will be created that contains the gmon.out file containing profile data. This option is for use only with GCC and when doing development work.

Compiles PostgreSQL with support for the dynamic tracing tool DTrace. See Section 27.5 for more information.

To point to the dtrace program, the environment variable DTRACE can be set. This will often be necessary because dtrace is typically installed under /usr/sbin, which might not be in your PATH.

Extra command-line options for the dtrace program can be specified in the environment variable DTRACEFLAGS. On Solaris, to include DTrace support in a 64-bit binary, you must specify DTRACEFLAGS="-64". For example, using the GCC compiler:

Using Sun's compiler:

Compiles PostgreSQL with support for injection points in the server. Injection points allow to run user-defined code from within the server in pre-defined code paths. This helps in testing and in the investigation of concurrency scenarios in a controlled fashion. This option is disabled by default. See Section 36.10.14 for more details. This option is intended to be used only by developers for testing.

Specify the relation segment size in blocks. If both --with-segsize and this option are specified, this option wins. This option is only for developers, to test segment related code.

In addition to the ordinary command-line options described above, configure responds to a number of environment variables. You can specify environment variables on the configure command line, for example:

In this usage an environment variable is little different from a command-line option. You can also set such variables beforehand:

This usage can be convenient because many programs' configuration scripts respond to these variables in similar ways.

The most commonly used of these environment variables are CC and CFLAGS. If you prefer a C compiler different from the one configure picks, you can set the variable CC to the program of your choice. By default, configure will pick gcc if available, else the platform's default (usually cc). Similarly, you can override the default compiler flags if needed with the CFLAGS variable.

Here is a list of the significant variables that can be set in this manner:

options to pass to the C compiler

path to clang program used to process source code for inlining when compiling with --with-llvm

options to pass to the C preprocessor

options to pass to the C++ compiler

location of the dtrace program

options to pass to the dtrace program

options to use when linking either executables or shared libraries

additional options for linking executables only

additional options for linking shared libraries only

llvm-config program used to locate the LLVM installation

msgfmt program for native language support

Perl interpreter program. This will be used to determine the dependencies for building PL/Perl. The default is perl.

Python interpreter program. This will be used to determine the dependencies for building PL/Python. If this is not set, the following are probed in this order: python3 python.

Tcl interpreter program. This will be used to determine the dependencies for building PL/Tcl. If this is not set, the following are probed in this order: tclsh tcl tclsh8.6 tclsh86 tclsh8.5 tclsh85 tclsh8.4 tclsh84.

xml2-config program used to locate the libxml2 installation

Sometimes it is useful to add compiler flags after-the-fact to the set that were chosen by configure. An important example is that gcc's -Werror option cannot be included in the CFLAGS passed to configure, because it will break many of configure's built-in tests. To add such flags, include them in the COPT environment variable while running make. The contents of COPT are added to the CFLAGS, CXXFLAGS, and LDFLAGS options set up by configure. For example, you could do

If using GCC, it is best to build with an optimization level of at least -O1, because using no optimization (-O0) disables some important compiler warnings (such as the use of uninitialized variables). However, non-zero optimization levels can complicate debugging because stepping through compiled code will usually not match up one-to-one with source code lines. If you get confused while trying to debug optimized code, recompile the specific files of interest with -O0. An easy way to do this is by passing an option to make: make PROFILE=-O0 file.o.

The COPT and PROFILE environment variables are actually handled identically by the PostgreSQL makefiles. Which to use is a matter of preference, but a common habit among developers is to use PROFILE for one-time flag adjustments, while COPT might be kept set all the time.

**Examples:**

Example 1 (unknown):
```unknown
./configure
```

Example 2 (unknown):
```unknown
./configure
```

Example 3 (unknown):
```unknown
mkdir build_dir
cd build_dir
/path/to/source/tree/configure [options go here]
make
```

Example 4 (unknown):
```unknown
mkdir build_dir
```

---

## 

**URL:** https://www.postgresql.org/docs/18/sql-start-transaction.html

**Contents:**
- START TRANSACTION
- Synopsis
- Description
- Parameters
- Compatibility
- See Also

START TRANSACTION — start a transaction block

This command begins a new transaction block. If the isolation level, read/write mode, or deferrable mode is specified, the new transaction has those characteristics, as if SET TRANSACTION was executed. This is the same as the BEGIN command.

Refer to SET TRANSACTION for information on the meaning of the parameters to this statement.

In the standard, it is not necessary to issue START TRANSACTION to start a transaction block: any SQL command implicitly begins a block. PostgreSQL's behavior can be seen as implicitly issuing a COMMIT after each command that does not follow START TRANSACTION (or BEGIN), and it is therefore often called “autocommit”. Other relational database systems might offer an autocommit feature as a convenience.

The DEFERRABLE transaction_mode is a PostgreSQL language extension.

The SQL standard requires commas between successive transaction_modes, but for historical reasons PostgreSQL allows the commas to be omitted.

See also the compatibility section of SET TRANSACTION.

**Examples:**

Example 1 (unknown):
```unknown
transaction_mode
```

Example 2 (unknown):
```unknown
transaction_mode
```

Example 3 (unknown):
```unknown
SET TRANSACTION
```

Example 4 (unknown):
```unknown
START TRANSACTION
```

---

## 12.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/textsearch-intro.html

**Contents:**
- 12.1. Introduction #
  - 12.1.1. What Is a Document? #
  - Note
  - 12.1.2. Basic Text Matching #
  - 12.1.3. Configurations #

Full Text Searching (or just text search) provides the capability to identify natural-language documents that satisfy a query, and optionally to sort them by relevance to the query. The most common type of search is to find all documents containing given query terms and return them in order of their similarity to the query. Notions of query and similarity are very flexible and depend on the specific application. The simplest search considers query as a set of words and similarity as the frequency of query words in the document.

Textual search operators have existed in databases for years. PostgreSQL has ~, ~*, LIKE, and ILIKE operators for textual data types, but they lack many essential properties required by modern information systems:

There is no linguistic support, even for English. Regular expressions are not sufficient because they cannot easily handle derived words, e.g., satisfies and satisfy. You might miss documents that contain satisfies, although you probably would like to find them when searching for satisfy. It is possible to use OR to search for multiple derived forms, but this is tedious and error-prone (some words can have several thousand derivatives).

They provide no ordering (ranking) of search results, which makes them ineffective when thousands of matching documents are found.

They tend to be slow because there is no index support, so they must process all documents for every search.

Full text indexing allows documents to be preprocessed and an index saved for later rapid searching. Preprocessing includes:

Parsing documents into tokens. It is useful to identify various classes of tokens, e.g., numbers, words, complex words, email addresses, so that they can be processed differently. In principle token classes depend on the specific application, but for most purposes it is adequate to use a predefined set of classes. PostgreSQL uses a parser to perform this step. A standard parser is provided, and custom parsers can be created for specific needs.

Converting tokens into lexemes. A lexeme is a string, just like a token, but it has been normalized so that different forms of the same word are made alike. For example, normalization almost always includes folding upper-case letters to lower-case, and often involves removal of suffixes (such as s or es in English). This allows searches to find variant forms of the same word, without tediously entering all the possible variants. Also, this step typically eliminates stop words, which are words that are so common that they are useless for searching. (In short, then, tokens are raw fragments of the document text, while lexemes are words that are believed useful for indexing and searching.) PostgreSQL uses dictionaries to perform this step. Various standard dictionaries are provided, and custom ones can be created for specific needs.

Storing preprocessed documents optimized for searching. For example, each document can be represented as a sorted array of normalized lexemes. Along with the lexemes it is often desirable to store positional information to use for proximity ranking, so that a document that contains a more “dense” region of query words is assigned a higher rank than one with scattered query words.

Dictionaries allow fine-grained control over how tokens are normalized. With appropriate dictionaries, you can:

Define stop words that should not be indexed.

Map synonyms to a single word using Ispell.

Map phrases to a single word using a thesaurus.

Map different variations of a word to a canonical form using an Ispell dictionary.

Map different variations of a word to a canonical form using Snowball stemmer rules.

A data type tsvector is provided for storing preprocessed documents, along with a type tsquery for representing processed queries (Section 8.11). There are many functions and operators available for these data types (Section 9.13), the most important of which is the match operator @@, which we introduce in Section 12.1.2. Full text searches can be accelerated using indexes (Section 12.9).

A document is the unit of searching in a full text search system; for example, a magazine article or email message. The text search engine must be able to parse documents and store associations of lexemes (key words) with their parent document. Later, these associations are used to search for documents that contain query words.

For searches within PostgreSQL, a document is normally a textual field within a row of a database table, or possibly a combination (concatenation) of such fields, perhaps stored in several tables or obtained dynamically. In other words, a document can be constructed from different parts for indexing and it might not be stored anywhere as a whole. For example:

Actually, in these example queries, coalesce should be used to prevent a single NULL attribute from causing a NULL result for the whole document.

Another possibility is to store the documents as simple text files in the file system. In this case, the database can be used to store the full text index and to execute searches, and some unique identifier can be used to retrieve the document from the file system. However, retrieving files from outside the database requires superuser permissions or special function support, so this is usually less convenient than keeping all the data inside PostgreSQL. Also, keeping everything inside the database allows easy access to document metadata to assist in indexing and display.

For text search purposes, each document must be reduced to the preprocessed tsvector format. Searching and ranking are performed entirely on the tsvector representation of a document — the original text need only be retrieved when the document has been selected for display to a user. We therefore often speak of the tsvector as being the document, but of course it is only a compact representation of the full document.

Full text searching in PostgreSQL is based on the match operator @@, which returns true if a tsvector (document) matches a tsquery (query). It doesn't matter which data type is written first:

As the above example suggests, a tsquery is not just raw text, any more than a tsvector is. A tsquery contains search terms, which must be already-normalized lexemes, and may combine multiple terms using AND, OR, NOT, and FOLLOWED BY operators. (For syntax details see Section 8.11.2.) There are functions to_tsquery, plainto_tsquery, and phraseto_tsquery that are helpful in converting user-written text into a proper tsquery, primarily by normalizing words appearing in the text. Similarly, to_tsvector is used to parse and normalize a document string. So in practice a text search match would look more like this:

Observe that this match would not succeed if written as

since here no normalization of the word rats will occur. The elements of a tsvector are lexemes, which are assumed already normalized, so rats does not match rat.

The @@ operator also supports text input, allowing explicit conversion of a text string to tsvector or tsquery to be skipped in simple cases. The variants available are:

The first two of these we saw already. The form text @@ tsquery is equivalent to to_tsvector(x) @@ y. The form text @@ text is equivalent to to_tsvector(x) @@ plainto_tsquery(y).

Within a tsquery, the & (AND) operator specifies that both its arguments must appear in the document to have a match. Similarly, the | (OR) operator specifies that at least one of its arguments must appear, while the ! (NOT) operator specifies that its argument must not appear in order to have a match. For example, the query fat & ! rat matches documents that contain fat but not rat.

Searching for phrases is possible with the help of the <-> (FOLLOWED BY) tsquery operator, which matches only if its arguments have matches that are adjacent and in the given order. For example:

There is a more general version of the FOLLOWED BY operator having the form <N>, where N is an integer standing for the difference between the positions of the matching lexemes. <1> is the same as <->, while <2> allows exactly one other lexeme to appear between the matches, and so on. The phraseto_tsquery function makes use of this operator to construct a tsquery that can match a multi-word phrase when some of the words are stop words. For example:

A special case that's sometimes useful is that <0> can be used to require that two patterns match the same word.

Parentheses can be used to control nesting of the tsquery operators. Without parentheses, | binds least tightly, then &, then <->, and ! most tightly.

It's worth noticing that the AND/OR/NOT operators mean something subtly different when they are within the arguments of a FOLLOWED BY operator than when they are not, because within FOLLOWED BY the exact position of the match is significant. For example, normally !x matches only documents that do not contain x anywhere. But !x <-> y matches y if it is not immediately after an x; an occurrence of x elsewhere in the document does not prevent a match. Another example is that x & y normally only requires that x and y both appear somewhere in the document, but (x & y) <-> z requires x and y to match at the same place, immediately before a z. Thus this query behaves differently from x <-> z & y <-> z, which will match a document containing two separate sequences x z and y z. (This specific query is useless as written, since x and y could not match at the same place; but with more complex situations such as prefix-match patterns, a query of this form could be useful.)

The above are all simple text search examples. As mentioned before, full text search functionality includes the ability to do many more things: skip indexing certain words (stop words), process synonyms, and use sophisticated parsing, e.g., parse based on more than just white space. This functionality is controlled by text search configurations. PostgreSQL comes with predefined configurations for many languages, and you can easily create your own configurations. (psql's \dF command shows all available configurations.)

During installation an appropriate configuration is selected and default_text_search_config is set accordingly in postgresql.conf. If you are using the same text search configuration for the entire cluster you can use the value in postgresql.conf. To use different configurations throughout the cluster but the same configuration within any one database, use ALTER DATABASE ... SET. Otherwise, you can set default_text_search_config in each session.

Each text search function that depends on a configuration has an optional regconfig argument, so that the configuration to use can be specified explicitly. default_text_search_config is used only when this argument is omitted.

To make it easier to build custom text search configurations, a configuration is built up from simpler database objects. PostgreSQL's text search facility provides four types of configuration-related database objects:

Text search parsers break documents into tokens and classify each token (for example, as words or numbers).

Text search dictionaries convert tokens to normalized form and reject stop words.

Text search templates provide the functions underlying dictionaries. (A dictionary simply specifies a template and a set of parameters for the template.)

Text search configurations select a parser and a set of dictionaries to use to normalize the tokens produced by the parser.

Text search parsers and templates are built from low-level C functions; therefore it requires C programming ability to develop new ones, and superuser privileges to install one into a database. (There are examples of add-on parsers and templates in the contrib/ area of the PostgreSQL distribution.) Since dictionaries and configurations just parameterize and connect together some underlying parsers and templates, no special privilege is needed to create a new dictionary or configuration. Examples of creating custom dictionaries and configurations appear later in this chapter.

**Examples:**

Example 1 (sql):
```sql
SELECT title || ' ' ||  author || ' ' ||  abstract || ' ' || body AS document
FROM messages
WHERE mid = 12;

SELECT m.title || ' ' || m.author || ' ' || m.abstract || ' ' || d.body AS document
FROM messages m, docs d
WHERE m.mid = d.did AND m.mid = 12;
```

Example 2 (sql):
```sql
SELECT 'a fat cat sat on a mat and ate a fat rat'::tsvector @@ 'cat & rat'::tsquery;
 ?column?
----------
 t

SELECT 'fat & cow'::tsquery @@ 'a fat cat sat on a mat and ate a fat rat'::tsvector;
 ?column?
----------
 f
```

Example 3 (unknown):
```unknown
plainto_tsquery
```

Example 4 (unknown):
```unknown
phraseto_tsquery
```

---

## 3.7. Conclusion #

**URL:** https://www.postgresql.org/docs/18/tutorial-conclusion.html

**Contents:**
- 3.7. Conclusion #

PostgreSQL has many features not touched upon in this tutorial introduction, which has been oriented toward newer users of SQL. These features are discussed in more detail in the remainder of this book.

If you feel you need more introductory material, please visit the PostgreSQL web site for links to more resources.

---

## 1. What Is PostgreSQL? #

**URL:** https://www.postgresql.org/docs/18/intro-whatis.html

**Contents:**
- 1. What Is PostgreSQL? #

PostgreSQL is an object-relational database management system (ORDBMS) based on POSTGRES, Version 4.2, developed at the University of California at Berkeley Computer Science Department. POSTGRES pioneered many concepts that only became available in some commercial database systems much later.

PostgreSQL is an open-source descendant of this original Berkeley code. It supports a large part of the SQL standard and offers many modern features:

Also, PostgreSQL can be extended by the user in many ways, for example by adding new

And because of the liberal license, PostgreSQL can be used, modified, and distributed by anyone free of charge for any purpose, be it private, commercial, or academic.

---

## 

**URL:** https://www.postgresql.org/docs/18/spi-spi-start-transaction.html

**Contents:**
- SPI_start_transaction
- Synopsis
- Description

SPI_start_transaction — obsolete function

SPI_start_transaction does nothing, and exists only for code compatibility with earlier PostgreSQL releases. It used to be required after calling SPI_commit or SPI_rollback, but now those functions start a new transaction automatically.

**Examples:**

Example 1 (unknown):
```unknown
SPI_start_transaction
```

Example 2 (unknown):
```unknown
SPI_rollback
```

---

## 2.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/tutorial-sql-intro.html

**Contents:**
- 2.1. Introduction #

This chapter provides an overview of how to use SQL to perform simple operations. This tutorial is only intended to give you an introduction and is in no way a complete tutorial on SQL. Numerous books have been written on SQL, including [melt93] and [date97]. You should be aware that some PostgreSQL language features are extensions to the standard.

In the examples that follow, we assume that you have created a database named mydb, as described in the previous chapter, and have been able to start psql.

Examples in this manual can also be found in the PostgreSQL source distribution in the directory src/tutorial/. (Binary distributions of PostgreSQL might not provide those files.) To use those files, first change to that directory and run make:

This creates the scripts and compiles the C files containing user-defined functions and types. Then, to start the tutorial, do the following:

The \i command reads in commands from the specified file. psql's -s option puts you in single step mode which pauses before sending each statement to the server. The commands used in this section are in the file basics.sql.

**Examples:**

Example 1 (unknown):
```unknown
src/tutorial/
```

Example 2 (unknown):
```unknown
$ cd .../src/tutorial
$ make
```

Example 3 (unknown):
```unknown
cd .../src/tutorial
```

Example 4 (javascript):
```javascript
$ psql -s mydb

...

mydb=> \i basics.sql
```

---

## 17.4. Building and Installation with Meson #

**URL:** https://www.postgresql.org/docs/18/install-meson.html

**Contents:**
- 17.4. Building and Installation with Meson #
  - 17.4.1. Short Version #
  - 17.4.2. Installation Procedure #
  - Note
  - 17.4.3. meson setup Options #
    - 17.4.3.1. Installation Locations #
  - Note
    - 17.4.3.2. PostgreSQL Features #
    - 17.4.3.3. Anti-Features #
    - 17.4.3.4. Build Process Details #

The long version is the rest of this section.

The first step of the installation procedure is to configure the build tree for your system and choose the options you would like. To create and configure the build directory, you can start with the meson setup command.

The setup command takes a builddir and a srcdir argument. If no srcdir is given, Meson will deduce the srcdir based on the current directory and the location of meson.build. The builddir is mandatory.

Running meson setup loads the build configuration file and sets up the build directory. Additionally, you can also pass several build options to Meson. Some commonly used options are mentioned in the subsequent sections. For example:

Setting up the build directory is a one-time step. To reconfigure before a new build, you can simply use the meson configure command

meson configure's commonly used command-line options are explained in Section 17.4.3.

By default, Meson uses the Ninja build tool. To build PostgreSQL from source using Meson, you can simply use the ninja command in the build directory.

Ninja will automatically detect the number of CPUs in your computer and parallelize itself accordingly. You can override the number of parallel processes used with the command line argument -j.

It should be noted that after the initial configure step, ninja is the only command you ever need to type to compile. No matter how you alter your source tree (short of moving it to a completely new location), Meson will detect the changes and regenerate itself accordingly. This is especially handy if you have multiple build directories. Often one of them is used for development (the "debug" build) and others only every now and then (such as a "static analysis" build). Any configuration can be built just by cd'ing to the corresponding directory and running Ninja.

If you'd like to build with a backend other than ninja, you can use configure with the --backend option to select the one you want to use and then build using meson compile. To learn more about these backends and other arguments you can provide to ninja, you can refer to the Meson documentation.

If you want to test the newly built server before you install it, you can run the regression tests at this point. The regression tests are a test suite to verify that PostgreSQL runs on your machine in the way the developers expected it to. Type:

(This won't work as root; do it as an unprivileged user.) See Chapter 31 for detailed information about interpreting the test results. You can repeat this test at any later time by issuing the same command.

To run pg_regress and pg_isolation_regress tests against a running postgres instance, specify --setup running as an argument to meson test.

If you are upgrading an existing system be sure to read Section 18.6, which has instructions about upgrading a cluster.

Once PostgreSQL is built, you can install it by simply running the ninja install command.

This will install files into the directories that were specified in Step 1. Make sure that you have appropriate permissions to write into that area. You might need to do this step as root. Alternatively, you can create the target directories in advance and arrange for appropriate permissions to be granted. The standard installation provides all the header files needed for client application development as well as for server-side program development, such as custom functions or data types written in C.

ninja install should work for most cases, but if you'd like to use more options (such as --quiet to suppress extra output), you could also use meson install instead. You can learn more about meson install and its options in the Meson documentation.

Uninstallation: To undo the installation, you can use the ninja uninstall command.

Cleaning: After the installation, you can free disk space by removing the built files from the source tree with the ninja clean command.

meson setup's command-line options are explained below. This list is not exhaustive (use meson configure --help to get one that is). The options not covered here are meant for advanced use-cases, and are documented in the standard Meson documentation. These arguments can be used with meson setup as well.

These options control where ninja install (or meson install) will put the files. The --prefix option (example Section 17.4.1) is sufficient for most cases. If you have special needs, you can customize the installation subdirectories with the other options described in this section. Beware however that changing the relative locations of the different subdirectories may render the installation non-relocatable, meaning you won't be able to move it after installation. (The man and doc locations are not affected by this restriction.) For relocatable installs, you might want to use the -Drpath=false option described later.

Install all files under the directory PREFIX instead of /usr/local/pgsql (on Unix based systems) or current drive letter:/usr/local/pgsql (on Windows). The actual files will be installed into various subdirectories; no files will ever be installed directly into the PREFIX directory.

Specifies the directory for executable programs. The default is PREFIX/bin.

Sets the directory for various configuration files, PREFIX/etc by default.

Sets the location to install libraries and dynamically loadable modules. The default is PREFIX/lib.

Sets the directory for installing C and C++ header files. The default is PREFIX/include.

Sets the directory for read-only data files used by the installed programs. The default is PREFIX/share. Note that this has nothing to do with where your database files will be placed.

Sets the directory for installing locale data, in particular message translation catalog files. The default is DATADIR/locale.

The man pages that come with PostgreSQL will be installed under this directory, in their respective manx subdirectories. The default is DATADIR/man.

Care has been taken to make it possible to install PostgreSQL into shared installation locations (such as /usr/local/include) without interfering with the namespace of the rest of the system. First, the string “/postgresql” is automatically appended to datadir, sysconfdir, and docdir, unless the fully expanded directory name already contains the string “postgres” or “pgsql”. For example, if you choose /usr/local as prefix, the documentation will be installed in /usr/local/doc/postgresql, but if the prefix is /opt/postgres, then it will be in /opt/postgres/doc. The public C header files of the client interfaces are installed into includedir and are namespace-clean. The internal header files and the server header files are installed into private directories under includedir. See the documentation of each interface for information about how to access its header files. Finally, a private subdirectory will also be created, if appropriate, under libdir for dynamically loadable modules.

The options described in this section enable building of various optional PostgreSQL features. Most of these require additional software, as described in Section 17.1, and will be automatically enabled if the required software is found. You can change this behavior by manually setting these features to enabled to require them or disabled to not build with them.

To specify PostgreSQL-specific options, the name of the option must be prefixed by -D.

Enables or disables Native Language Support (NLS), that is, the ability to display a program's messages in a language other than English. Defaults to auto and will be enabled automatically if an implementation of the Gettext API is found.

Build the PL/Perl server-side language. Defaults to auto.

Build the PL/Python server-side language. Defaults to auto.

Build the PL/Tcl server-side language. Defaults to auto.

Specifies the Tcl version to use when building PL/Tcl.

Build with support for the ICU library, enabling use of ICU collation features (see Section 23.2). Defaults to auto and requires the ICU4C package to be installed. The minimum required version of ICU4C is currently 4.2.

Build with support for LLVM based JIT compilation (see Chapter 30). This requires the LLVM library to be installed. The minimum required version of LLVM is currently 14. Disabled by default.

llvm-config will be used to find the required compilation options. llvm-config, and then llvm-config-$version for all supported versions, will be searched for in your PATH. If that would not yield the desired program, use LLVM_CONFIG to specify a path to the correct llvm-config.

Build with LZ4 compression support. Defaults to auto.

Build with Zstandard compression support. Defaults to auto.

Build with support for SSL (encrypted) connections. The only LIBRARY supported is openssl. This requires the OpenSSL package to be installed. Building with this will check for the required header files and libraries to make sure that your OpenSSL installation is sufficient before proceeding. The default for this option is auto.

Build with support for GSSAPI authentication. MIT Kerberos is required to be installed for GSSAPI. On many systems, the GSSAPI system (a part of the MIT Kerberos installation) is not installed in a location that is searched by default (e.g., /usr/include, /usr/lib). In those cases, PostgreSQL will query pkg-config to detect the required compiler and linker options. Defaults to auto. meson configure will check for the required header files and libraries to make sure that your GSSAPI installation is sufficient before proceeding.

Build with LDAP support for authentication and connection parameter lookup (see Section 32.18 and Section 20.10 for more information). On Unix, this requires the OpenLDAP package to be installed. On Windows, the default WinLDAP library is used. Defaults to auto. meson configure will check for the required header files and libraries to make sure that your OpenLDAP installation is sufficient before proceeding.

Build with PAM (Pluggable Authentication Modules) support. Defaults to auto.

Build with BSD Authentication support. (The BSD Authentication framework is currently only available on OpenBSD.) Defaults to auto.

Build with support for systemd service notifications. This improves integration if the server is started under systemd but has no impact otherwise; see Section 18.3 for more information. Defaults to auto. libsystemd and the associated header files need to be installed to use this option.

Build with support for Bonjour automatic service discovery. Defaults to auto and requires Bonjour support in your operating system. Recommended on macOS.

Build the uuid-ossp module (which provides functions to generate UUIDs), using the specified UUID library. LIBRARY must be one of:

none to not build the uuid module. This is the default.

bsd to use the UUID functions found in FreeBSD, and some other BSD-derived systems

e2fs to use the UUID library created by the e2fsprogs project; this library is present in most Linux systems and in macOS, and can be obtained for other platforms as well

ossp to use the OSSP UUID library

Build with libcurl support for OAuth 2.0 client flows. Libcurl version 7.61.0 or later is required for this feature. Building with this will check for the required header files and libraries to make sure that your Curl installation is sufficient before proceeding. The default for this option is auto.

Build with liburing, enabling io_uring support for asynchronous I/O. Defaults to auto.

To use a liburing installation that is in an unusual location, you can set pkg-config-related environment variables (see its documentation).

Build with libnuma support for basic NUMA support. Only supported on platforms for which the libnuma library is implemented. The default for this option is auto.

Build with libxml2, enabling SQL/XML support. Defaults to auto. Libxml2 version 2.6.23 or later is required for this feature.

To use a libxml2 installation that is in an unusual location, you can set pkg-config-related environment variables (see its documentation).

Build with libxslt, enabling the xml2 module to perform XSL transformations of XML. -Dlibxml must be specified as well. Defaults to auto.

Build with SElinux support, enabling the sepgsql extension. Defaults to auto.

Allows use of the Readline library (and libedit as well). This option defaults to auto and enables command-line editing and history in psql and is strongly recommended.

Setting this to true favors the use of the BSD-licensed libedit library rather than GPL-licensed Readline. This option is significant only if you have both libraries installed; the default is false, that is to use Readline.

Enables use of the Zlib library. It defaults to auto and enables support for compressed archives in pg_dump, pg_restore and pg_basebackup and is recommended.

Setting this option allows you to override the value of all “auto” features (features that are enabled automatically if the required software is found). This can be useful when you want to disable or enable all the “optional” features at once without having to set each of them manually. The default value for this parameter is auto.

The default backend Meson uses is ninja and that should suffice for most use cases. However, if you'd like to fully integrate with Visual Studio, you can set the BACKEND to vs.

This option can be used to pass extra options to the C compiler.

This option can be used to pass extra options to the C linker.

DIRECTORIES is a comma-separated list of directories that will be added to the list the compiler searches for header files. If you have optional packages (such as GNU Readline) installed in a non-standard location, you have to use this option and probably also the corresponding -Dextra_lib_dirs option.

Example: -Dextra_include_dirs=/opt/gnu/include,/usr/sup/include.

DIRECTORIES is a comma-separated list of directories to search for libraries. You will probably have to use this option (and the corresponding -Dextra_include_dirs option) if you have packages installed in non-standard locations.

Example: -Dextra_lib_dirs=/opt/gnu/lib,/usr/sup/lib.

PostgreSQL includes its own time zone database, which it requires for date and time operations. This time zone database is in fact compatible with the IANA time zone database provided by many operating systems such as FreeBSD, Linux, and Solaris, so it would be redundant to install it again. When this option is used, the system-supplied time zone database in DIRECTORY is used instead of the one included in the PostgreSQL source distribution. DIRECTORY must be specified as an absolute path. /usr/share/zoneinfo is a likely directory on some operating systems. Note that the installation routine will not detect mismatching or erroneous time zone data. If you use this option, you are advised to run the regression tests to verify that the time zone data you have pointed to works correctly with PostgreSQL.

This option is mainly aimed at binary package distributors who know their target operating system well. The main advantage of using this option is that the PostgreSQL package won't need to be upgraded whenever any of the many local daylight-saving time rules change. Another advantage is that PostgreSQL can be cross-compiled more straightforwardly if the time zone database files do not need to be built during the installation.

Append STRING to the PostgreSQL version number. You can use this, for example, to mark binaries built from unreleased Git snapshots or containing custom patches with an extra version string, such as a git describe identifier or a distribution package release number.

This option is set to true by default. If set to false, do not mark PostgreSQL's executables to indicate that they should search for shared libraries in the installation's library directory (see --libdir). On most platforms, this marking uses an absolute path to the library directory, so that it will be unhelpful if you relocate the installation later. However, you will then need to provide some other way for the executables to find the shared libraries. Typically this requires configuring the operating system's dynamic linker to search the library directory; see Section 17.5.1 for more detail.

If a program required to build PostgreSQL (with or without optional flags) is stored at a non-standard path, you can specify it manually to meson configure. The complete list of programs for which this is supported can be found by running meson configure. Example:

See Section J.2 for the tools needed for building the documentation.

Enables building the documentation in HTML and man format. It defaults to auto.

Enables building the documentation in PDF format. It defaults to auto.

Controls which CSS stylesheet is used. The default is simple. If set to website, the HTML documentation will reference the stylesheet for postgresql.org.

Set NUMBER as the default port number for server and clients. The default is 5432. The port can always be changed later on, but if you specify it here then both server and clients will have the same default compiled in, which can be very convenient. Usually the only good reason to select a non-default value is if you intend to run multiple PostgreSQL servers on the same machine.

The default name of the Kerberos service principal used by GSSAPI. postgres is the default. There's usually no reason to change this unless you are building for a Windows environment, in which case it must be set to upper case POSTGRES.

Set the segment size, in gigabytes. Large tables are divided into multiple operating-system files, each of size equal to the segment size. This avoids problems with file size limits that exist on many platforms. The default segment size, 1 gigabyte, is safe on all supported platforms. If your operating system has “largefile” support (which most do, nowadays), you can use a larger segment size. This can be helpful to reduce the number of file descriptors consumed when working with very large tables. But be careful not to select a value larger than is supported by your platform and the file systems you intend to use. Other tools you might wish to use, such as tar, could also set limits on the usable file size. It is recommended, though not absolutely required, that this value be a power of 2.

Set the block size, in kilobytes. This is the unit of storage and I/O within tables. The default, 8 kilobytes, is suitable for most situations; but other values may be useful in special cases. The value must be a power of 2 between 1 and 32 (kilobytes).

Set the WAL block size, in kilobytes. This is the unit of storage and I/O within the WAL log. The default, 8 kilobytes, is suitable for most situations; but other values may be useful in special cases. The value must be a power of 2 between 1 and 64 (kilobytes).

Most of the options in this section are only of interest for developing or debugging PostgreSQL. They are not recommended for production builds, except for --debug, which can be useful to enable detailed bug reports in the unlucky event that you encounter a bug. On platforms supporting DTrace, -Ddtrace may also be reasonable to use in production.

When building an installation that will be used to develop code inside the server, it is recommended to use at least the --buildtype=debug and -Dcassert options.

This option can be used to specify the buildtype to use; defaults to debugoptimized. If you'd like finer control on the debug symbols and optimization levels than what this option provides, you can refer to the --debug and --optimization flags.

The following build types are generally used: plain, debug, debugoptimized and release. More information about them can be found in the Meson documentation.

Compiles all programs and libraries with debugging symbols. This means that you can run the programs in a debugger to analyze problems. This enlarges the size of the installed executables considerably, and on non-GCC compilers it usually also disables compiler optimization, causing slowdowns. However, having the symbols available is extremely helpful for dealing with any problems that might arise. Currently, this option is recommended for production installations only if you use GCC. But you should always have it on if you are doing development work or running a beta version.

Specify the optimization level. LEVEL can be set to any of {0,g,1,2,3,s}.

Setting this option asks the compiler to treat warnings as errors. This can be useful for code development.

Enables assertion checks in the server, which test for many “cannot happen” conditions. This is invaluable for code development purposes, but the tests slow down the server significantly. Also, having the tests turned on won't necessarily enhance the stability of your server! The assertion checks are not categorized for severity, and so what might be a relatively harmless bug will still lead to server restarts if it triggers an assertion failure. This option is not recommended for production use, but you should have it on for development work or when running a beta version.

Enable tests using the Perl TAP tools. Defaults to auto and requires a Perl installation and the Perl module IPC::Run. See Section 31.4 for more information.

Enable additional test suites, which are not run by default because they are not secure to run on a multiuser system, require special software to run, or are resource intensive. The argument is a whitespace-separated list of tests to enable. See Section 31.1.3 for details. If the PG_TEST_EXTRA environment variable is set when the tests are run, it overrides this setup-time option.

If using GCC, all programs and libraries are compiled with code coverage testing instrumentation. When run, they generate files in the build directory with code coverage metrics. See Section 31.5 for more information. This option is for use only with GCC and when doing development work.

Enabling this compiles PostgreSQL with support for the dynamic tracing tool DTrace. See Section 27.5 for more information.

To point to the dtrace program, the DTRACE option can be set. This will often be necessary because dtrace is typically installed under /usr/sbin, which might not be in your PATH.

Compiles PostgreSQL with support for injection points in the server. Injection points allow to run user-defined code from within the server in pre-defined code paths. This helps in testing and in the investigation of concurrency scenarios in a controlled fashion. This option is disabled by default. See Section 36.10.14 for more details. This option is intended to be used only by developers for testing.

Specify the relation segment size in blocks. If both -Dsegsize and this option are specified, this option wins. This option is only for developers, to test segment related code.

Individual build targets can be built using ninja target. When no target is specified, everything except documentation is built. Individual build products can be built using the path/filename as target.

Build everything other than documentation

Build backend and related modules

Build frontend binaries

Build contrib modules

Build procedural languages

Rewrite catalog data files into standard format

Expand all data files to include defaults

Update unicode data to new version

Build documentation in multi-page HTML format

Build documentation in man page format

Build documentation in multi-page HTML and man page format

Build documentation in PDF format, with A4 pages

Build documentation in PDF format, with US letter pages

Build documentation in single-page HTML format

Build documentation in all supported formats

Install postgres, excluding documentation

Install documentation in multi-page HTML and man page formats

Install documentation in multi-page HTML format

Install documentation in man page format

Like "install", but installed files are not displayed

Install postgres, including multi-page HTML and man page documentation

Remove installed files

Remove all build products

Run all enabled tests (including contrib)

Build everything, including documentation

List important targets

**Examples:**

Example 1 (unknown):
```unknown
meson setup
```

Example 2 (unknown):
```unknown
meson setup
```

Example 3 (unknown):
```unknown
meson setup build
```

Example 4 (unknown):
```unknown
meson setup build
```

---

## 2.6. Joins Between Tables #

**URL:** https://www.postgresql.org/docs/18/tutorial-join.html

**Contents:**
- 2.6. Joins Between Tables #

Thus far, our queries have only accessed one table at a time. Queries can access multiple tables at once, or access the same table in such a way that multiple rows of the table are being processed at the same time. Queries that access multiple tables (or multiple instances of the same table) at one time are called join queries. They combine rows from one table with rows from a second table, with an expression specifying which rows are to be paired. For example, to return all the weather records together with the location of the associated city, the database needs to compare the city column of each row of the weather table with the name column of all rows in the cities table, and select the pairs of rows where these values match.[4] This would be accomplished by the following query:

Observe two things about the result set:

There is no result row for the city of Hayward. This is because there is no matching entry in the cities table for Hayward, so the join ignores the unmatched rows in the weather table. We will see shortly how this can be fixed.

There are two columns containing the city name. This is correct because the lists of columns from the weather and cities tables are concatenated. In practice this is undesirable, though, so you will probably want to list the output columns explicitly rather than using *:

Since the columns all had different names, the parser automatically found which table they belong to. If there were duplicate column names in the two tables you'd need to qualify the column names to show which one you meant, as in:

It is widely considered good style to qualify all column names in a join query, so that the query won't fail if a duplicate column name is later added to one of the tables.

Join queries of the kind seen thus far can also be written in this form:

This syntax pre-dates the JOIN/ON syntax, which was introduced in SQL-92. The tables are simply listed in the FROM clause, and the comparison expression is added to the WHERE clause. The results from this older implicit syntax and the newer explicit JOIN/ON syntax are identical. But for a reader of the query, the explicit syntax makes its meaning easier to understand: The join condition is introduced by its own key word whereas previously the condition was mixed into the WHERE clause together with other conditions.

Now we will figure out how we can get the Hayward records back in. What we want the query to do is to scan the weather table and for each row to find the matching cities row(s). If no matching row is found we want some “empty values” to be substituted for the cities table's columns. This kind of query is called an outer join. (The joins we have seen so far are inner joins.) The command looks like this:

This query is called a left outer join because the table mentioned on the left of the join operator will have each of its rows in the output at least once, whereas the table on the right will only have those rows output that match some row of the left table. When outputting a left-table row for which there is no right-table match, empty (null) values are substituted for the right-table columns.

Exercise: There are also right outer joins and full outer joins. Try to find out what those do.

We can also join a table against itself. This is called a self join. As an example, suppose we wish to find all the weather records that are in the temperature range of other weather records. So we need to compare the temp_lo and temp_hi columns of each weather row to the temp_lo and temp_hi columns of all other weather rows. We can do this with the following query:

Here we have relabeled the weather table as w1 and w2 to be able to distinguish the left and right side of the join. You can also use these kinds of aliases in other queries to save some typing, e.g.:

You will encounter this style of abbreviating quite frequently.

[4] This is only a conceptual model. The join is usually performed in a more efficient manner than actually comparing each possible pair of rows, but this is invisible to the user.

**Examples:**

Example 1 (sql):
```sql
SELECT * FROM weather JOIN cities ON city = name;
```

Example 2 (yaml):
```yaml
city      | temp_lo | temp_hi | prcp |    date    |     name      | location
---------------+---------+---------+------+------------+---------------+-----------
 San Francisco |      46 |      50 | 0.25 | 1994-11-27 | San Francisco | (-194,53)
 San Francisco |      43 |      57 |    0 | 1994-11-29 | San Francisco | (-194,53)
(2 rows)
```

Example 3 (sql):
```sql
SELECT city, temp_lo, temp_hi, prcp, date, location
    FROM weather JOIN cities ON city = name;
```

Example 4 (sql):
```sql
SELECT weather.city, weather.temp_lo, weather.temp_hi,
       weather.prcp, weather.date, cities.location
    FROM weather JOIN cities ON weather.city = cities.name;
```

---

## 40.1. Installing Procedural Languages #

**URL:** https://www.postgresql.org/docs/18/xplang-install.html

**Contents:**
- 40.1. Installing Procedural Languages #

A procedural language must be “installed” into each database where it is to be used. But procedural languages installed in the database template1 are automatically available in all subsequently created databases, since their entries in template1 will be copied by CREATE DATABASE. So the database administrator can decide which languages are available in which databases and can make some languages available by default if desired.

For the languages supplied with the standard distribution, it is only necessary to execute CREATE EXTENSION language_name to install the language into the current database. The manual procedure described below is only recommended for installing languages that have not been packaged as extensions.

Manual Procedural Language Installation

A procedural language is installed in a database in five steps, which must be carried out by a database superuser. In most cases the required SQL commands should be packaged as the installation script of an “extension”, so that CREATE EXTENSION can be used to execute them.

The shared object for the language handler must be compiled and installed into an appropriate library directory. This works in the same way as building and installing modules with regular user-defined C functions does; see Section 36.10.5. Often, the language handler will depend on an external library that provides the actual programming language engine; if so, that must be installed as well.

The handler must be declared with the command

The special return type of language_handler tells the database system that this function does not return one of the defined SQL data types and is not directly usable in SQL statements.

Optionally, the language handler can provide an “inline” handler function that executes anonymous code blocks (DO commands) written in this language. If an inline handler function is provided by the language, declare it with a command like

Optionally, the language handler can provide a “validator” function that checks a function definition for correctness without actually executing it. The validator function is called by CREATE FUNCTION if it exists. If a validator function is provided by the language, declare it with a command like

Finally, the PL must be declared with the command

The optional key word TRUSTED specifies that the language does not grant access to data that the user would not otherwise have. Trusted languages are designed for ordinary database users (those without superuser privilege) and allows them to safely create functions and procedures. Since PL functions are executed inside the database server, the TRUSTED flag should only be given for languages that do not allow access to database server internals or the file system. The languages PL/pgSQL, PL/Tcl, and PL/Perl are considered trusted; the languages PL/TclU, PL/PerlU, and PL/PythonU are designed to provide unlimited functionality and should not be marked trusted.

Example 40.1 shows how the manual installation procedure would work with the language PL/Perl.

Example 40.1. Manual Installation of PL/Perl

The following command tells the database server where to find the shared object for the PL/Perl language's call handler function:

PL/Perl has an inline handler function and a validator function, so we declare those too:

then defines that the previously declared functions should be invoked for functions and procedures where the language attribute is plperl.

In a default PostgreSQL installation, the handler for the PL/pgSQL language is built and installed into the “library” directory; furthermore, the PL/pgSQL language itself is installed in all databases. If Tcl support is configured in, the handlers for PL/Tcl and PL/TclU are built and installed in the library directory, but the language itself is not installed in any database by default. Likewise, the PL/Perl and PL/PerlU handlers are built and installed if Perl support is configured, and the PL/PythonU handler is installed if Python support is configured, but these languages are not installed by default.

**Examples:**

Example 1 (unknown):
```unknown
CREATE DATABASE
```

Example 2 (unknown):
```unknown
CREATE EXTENSION
```

Example 3 (unknown):
```unknown
language_name
```

Example 4 (unknown):
```unknown
CREATE EXTENSION
```

---

## 17.7. Platform-Specific Notes #

**URL:** https://www.postgresql.org/docs/18/installation-platform-notes.html

**Contents:**
- 17.7. Platform-Specific Notes #
  - 17.7.1. Cygwin #
  - 17.7.2. macOS #
  - 17.7.3. MinGW #
    - 17.7.3.1. Collecting Crash Dumps #
  - 17.7.4. Solaris #
    - 17.7.4.1. Required Tools #
    - 17.7.4.2. configure Complains About a Failed Test Program #
    - 17.7.4.3. Compiling for Optimal Performance #
    - 17.7.4.4. Using DTrace for Tracing PostgreSQL #

This section documents additional platform-specific issues regarding the installation and setup of PostgreSQL. Be sure to read the installation instructions, and in particular Section 17.1 as well. Also, check Chapter 31 regarding the interpretation of regression test results.

Platforms that are not covered here have no known platform-specific installation issues.

PostgreSQL can be built using Cygwin, a Linux-like environment for Windows, but that method is inferior to the native Windows build and running a server under Cygwin is no longer recommended.

When building from source, proceed according to the Unix-style installation procedure (i.e., ./configure; make; etc.), noting the following Cygwin-specific differences:

Set your path to use the Cygwin bin directory before the Windows utilities. This will help prevent problems with compilation.

The adduser command is not supported; use the appropriate user management application on Windows. Otherwise, skip this step.

The su command is not supported; use ssh to simulate su on Windows. Otherwise, skip this step.

OpenSSL is not supported.

Start cygserver for shared memory support. To do this, enter the command /usr/sbin/cygserver &. This program needs to be running anytime you start the PostgreSQL server or initialize a database cluster (initdb). The default cygserver configuration may need to be changed (e.g., increase SEMMNS) to prevent PostgreSQL from failing due to a lack of system resources.

Building might fail on some systems where a locale other than C is in use. To fix this, set the locale to C by doing export LANG=C.utf8 before building, and then setting it back to the previous setting after you have installed PostgreSQL.

The parallel regression tests (make check) can generate spurious regression test failures due to overflowing the listen() backlog queue which causes connection refused errors or hangs. You can limit the number of connections using the make variable MAX_CONNECTIONS thus:

(On some systems you can have up to about 10 simultaneous connections.)

It is possible to install cygserver and the PostgreSQL server as Windows NT services. For information on how to do this, please refer to the README document included with the PostgreSQL binary package on Cygwin. It is installed in the directory /usr/share/doc/Cygwin.

To build PostgreSQL from source on macOS, you will need to install Apple's command line developer tools, which can be done by issuing

(note that this will pop up a GUI dialog window for confirmation). You may or may not wish to also install Xcode.

On recent macOS releases, it's necessary to embed the “sysroot” path in the include switches used to find some system header files. This results in the outputs of the configure script varying depending on which SDK version was used during configure. That shouldn't pose any problem in simple scenarios, but if you are trying to do something like building an extension on a different machine than the server code was built on, you may need to force use of a different sysroot path. To do that, set PG_SYSROOT, for example

To find out the appropriate path on your machine, run

Note that building an extension using a different sysroot version than was used to build the core server is not really recommended; in the worst case it could result in hard-to-debug ABI inconsistencies.

You can also select a non-default sysroot path when configuring, by specifying PG_SYSROOT to configure:

This would primarily be useful to cross-compile for some other macOS version. There is no guarantee that the resulting executables will run on the current host.

To suppress the -isysroot options altogether, use

(any nonexistent pathname will work). This might be useful if you wish to build with a non-Apple compiler, but beware that that case is not tested or supported by the PostgreSQL developers.

macOS's “System Integrity Protection” (SIP) feature breaks make check, because it prevents passing the needed setting of DYLD_LIBRARY_PATH down to the executables being tested. You can work around that by doing make install before make check. Most PostgreSQL developers just turn off SIP, though.

PostgreSQL for Windows can be built using MinGW, a Unix-like build environment for Windows. It is recommended to use the MSYS2 environment for this and also to install any prerequisite packages.

If PostgreSQL on Windows crashes, it has the ability to generate minidumps that can be used to track down the cause for the crash, similar to core dumps on Unix. These dumps can be read using the Windows Debugger Tools or using Visual Studio. To enable the generation of dumps on Windows, create a subdirectory named crashdumps inside the cluster data directory. The dumps will then be written into this directory with a unique name based on the identifier of the crashing process and the current time of the crash.

PostgreSQL is well-supported on Solaris. The more up to date your operating system, the fewer issues you will experience.

You can build with either GCC or Sun's compiler suite. For better code optimization, Sun's compiler is strongly recommended on the SPARC architecture. If you are using Sun's compiler, be careful not to select /usr/ucb/cc; use /opt/SUNWspro/bin/cc.

You can download Sun Studio from https://www.oracle.com/technetwork/server-storage/solarisstudio/downloads/. Many GNU tools are integrated into Solaris 10, or they are present on the Solaris companion CD. If you need packages for older versions of Solaris, you can find these tools at http://www.sunfreeware.com. If you prefer sources, look at https://www.gnu.org/prep/ftp.

If configure complains about a failed test program, this is probably a case of the run-time linker being unable to find some library, probably libz, libreadline or some other non-standard library such as libssl. To point it to the right location, set the LDFLAGS environment variable on the configure command line, e.g.,

See the ld man page for more information.

On the SPARC architecture, Sun Studio is strongly recommended for compilation. Try using the -xO5 optimization flag to generate significantly faster binaries. Do not use any flags that modify behavior of floating-point operations and errno processing (e.g., -fast).

If you do not have a reason to use 64-bit binaries on SPARC, prefer the 32-bit version. The 64-bit operations are slower and 64-bit binaries are slower than the 32-bit variants. On the other hand, 32-bit code on the AMD64 CPU family is not native, so 32-bit code is significantly slower on that CPU family.

Yes, using DTrace is possible. See Section 27.5 for further information.

If you see the linking of the postgres executable abort with an error message like:

your DTrace installation is too old to handle probes in static functions. You need Solaris 10u4 or newer to use DTrace.

It is recommended that most users download the binary distribution for Windows, available as a graphical installer package from the PostgreSQL website at https://www.postgresql.org/download/. Building from source is only intended for people developing PostgreSQL or extensions.

PostgreSQL for Windows with Visual Studio can be built using Meson, as described in Section 17.4. The native Windows port requires a 32 or 64-bit version of Windows 10 or later.

Native builds of psql don't support command line editing. The Cygwin build does support command line editing, so it should be used where psql is needed for interactive use on Windows.

PostgreSQL can be built using the Visual C++ compiler suite from Microsoft. These compilers can be either from Visual Studio, Visual Studio Express or some versions of the Microsoft Windows SDK. If you do not already have a Visual Studio environment set up, the easiest ways are to use the compilers from Visual Studio 2022 or those in the Windows SDK 10, which are both free downloads from Microsoft.

Both 32-bit and 64-bit builds are possible with the Microsoft Compiler suite. 32-bit PostgreSQL builds are possible with Visual Studio 2015 to Visual Studio 2022, as well as standalone Windows SDK releases 10 and above. 64-bit PostgreSQL builds are supported with Microsoft Windows SDK version 10 and above or Visual Studio 2015 and above.

If your build environment doesn't ship with a supported version of the Microsoft Windows SDK it is recommended that you upgrade to the latest version (currently version 10), available for download from https://www.microsoft.com/download.

You must always include the Windows Headers and Libraries part of the SDK. If you install a Windows SDK including the Visual C++ Compilers, you don't need Visual Studio to build. Note that as of Version 8.0a the Windows SDK no longer ships with a complete command-line build environment.

The following additional products are required to build PostgreSQL on Windows.

Strawberry Perl is required to run the build generation scripts. MinGW or Cygwin Perl will not work. It must also be present in the PATH. Binaries can be downloaded from https://strawberryperl.com.

Binaries for Bison and Flex can be downloaded from https://github.com/lexxmark/winflexbison.

The following additional products are not required to get started, but are required to build the complete package.

Required for building PL/Tcl. Binaries can be downloaded from https://www.magicsplat.com/tcl-installer/index.html.

Diff is required to run the regression tests, and can be downloaded from http://gnuwin32.sourceforge.net.

Gettext is required to build with NLS support, and can be downloaded from http://gnuwin32.sourceforge.net. Note that binaries, dependencies and developer files are all needed.

Required for GSSAPI authentication support. MIT Kerberos can be downloaded from https://web.mit.edu/Kerberos/dist/index.html.

Required for XML support. Binaries can be downloaded from https://zlatkovic.com/pub/libxml or source from http://xmlsoft.org. Note that libxml2 requires iconv, which is available from the same download location.

Required for supporting LZ4 compression. Binaries and source can be downloaded from https://github.com/lz4/lz4/releases.

Required for supporting Zstandard compression. Binaries and source can be downloaded from https://github.com/facebook/zstd/releases.

Required for SSL support. Binaries can be downloaded from https://slproweb.com/products/Win32OpenSSL.html or source from https://www.openssl.org.

Required for UUID-OSSP support (contrib only). Source can be downloaded from http://www.ossp.org/pkg/lib/uuid/.

Required for building PL/Python. Binaries can be downloaded from https://www.python.org.

Required for compression support in pg_dump and pg_restore. Binaries can be downloaded from https://www.zlib.net.

PostgreSQL will only build for the x64 architecture on 64-bit Windows.

Mixing 32- and 64-bit versions in the same build tree is not supported. The build system will automatically detect if it's running in a 32- or 64-bit environment, and build PostgreSQL accordingly. For this reason, it is important to start the correct command prompt before building.

To use a server-side third party library such as Python or OpenSSL, this library must also be 64-bit. There is no support for loading a 32-bit library in a 64-bit server. Several of the third party libraries that PostgreSQL supports may only be available in 32-bit versions, in which case they cannot be used with 64-bit PostgreSQL.

If PostgreSQL on Windows crashes, it has the ability to generate minidumps that can be used to track down the cause for the crash, similar to core dumps on Unix. These dumps can be read using the Windows Debugger Tools or using Visual Studio. To enable the generation of dumps on Windows, create a subdirectory named crashdumps inside the cluster data directory. The dumps will then be written into this directory with a unique name based on the identifier of the crashing process and the current time of the crash.

**Examples:**

Example 1 (unknown):
```unknown
./configure; make
```

Example 2 (unknown):
```unknown
/usr/sbin/cygserver &
```

Example 3 (unknown):
```unknown
export LANG=C.utf8
```

Example 4 (unknown):
```unknown
MAX_CONNECTIONS
```

---

## Chapter 17. Installation from Source Code

**URL:** https://www.postgresql.org/docs/18/installation.html

**Contents:**
- Chapter 17. Installation from Source Code

This chapter describes the installation of PostgreSQL using the source code distribution. If you are installing a pre-packaged distribution, such as an RPM or Debian package, ignore this chapter and see Chapter 16 instead.

**Examples:**

Example 1 (unknown):
```unknown
meson setup
```

---

## Chapter 18. Server Setup and Operation

**URL:** https://www.postgresql.org/docs/18/runtime.html

**Contents:**
- Chapter 18. Server Setup and Operation

This chapter discusses how to set up and run the database server, and its interactions with the operating system.

The directions in this chapter assume that you are working with plain PostgreSQL without any additional infrastructure, for example a copy that you built from source according to the directions in the preceding chapters. If you are working with a pre-packaged or vendor-supplied version of PostgreSQL, it is likely that the packager has made special provisions for installing and starting the database server according to your system's conventions. Consult the package-level documentation for details.

---

## 2.5. Querying a Table #

**URL:** https://www.postgresql.org/docs/18/tutorial-select.html

**Contents:**
- 2.5. Querying a Table #

To retrieve data from a table, the table is queried. An SQL SELECT statement is used to do this. The statement is divided into a select list (the part that lists the columns to be returned), a table list (the part that lists the tables from which to retrieve the data), and an optional qualification (the part that specifies any restrictions). For example, to retrieve all the rows of table weather, type:

Here * is a shorthand for “all columns”. [2] So the same result would be had with:

The output should be:

You can write expressions, not just simple column references, in the select list. For example, you can do:

Notice how the AS clause is used to relabel the output column. (The AS clause is optional.)

A query can be “qualified” by adding a WHERE clause that specifies which rows are wanted. The WHERE clause contains a Boolean (truth value) expression, and only rows for which the Boolean expression is true are returned. The usual Boolean operators (AND, OR, and NOT) are allowed in the qualification. For example, the following retrieves the weather of San Francisco on rainy days:

You can request that the results of a query be returned in sorted order:

In this example, the sort order isn't fully specified, and so you might get the San Francisco rows in either order. But you'd always get the results shown above if you do:

You can request that duplicate rows be removed from the result of a query:

Here again, the result row ordering might vary. You can ensure consistent results by using DISTINCT and ORDER BY together: [3]

[2] While SELECT * is useful for off-the-cuff queries, it is widely considered bad style in production code, since adding a column to the table would change the results.

[3] In some database systems, including older versions of PostgreSQL, the implementation of DISTINCT automatically orders the rows and so ORDER BY is unnecessary. But this is not required by the SQL standard, and current PostgreSQL does not guarantee that DISTINCT causes the rows to be ordered.

**Examples:**

Example 1 (sql):
```sql
SELECT * FROM weather;
```

Example 2 (sql):
```sql
SELECT city, temp_lo, temp_hi, prcp, date FROM weather;
```

Example 3 (yaml):
```yaml
city      | temp_lo | temp_hi | prcp |    date
---------------+---------+---------+------+------------
 San Francisco |      46 |      50 | 0.25 | 1994-11-27
 San Francisco |      43 |      57 |    0 | 1994-11-29
 Hayward       |      37 |      54 |      | 1994-11-29
(3 rows)
```

Example 4 (sql):
```sql
SELECT city, (temp_hi+temp_lo)/2 AS temp_avg, date FROM weather;
```

---

## 1.3. Creating a Database #

**URL:** https://www.postgresql.org/docs/18/tutorial-createdb.html

**Contents:**
- 1.3. Creating a Database #

The first test to see whether you can access the database server is to try to create a database. A running PostgreSQL server can manage many databases. Typically, a separate database is used for each project or for each user.

Possibly, your site administrator has already created a database for your use. In that case you can omit this step and skip ahead to the next section.

To create a new database from the command line, in this example named mydb, you use the following command:

If this produces no response then this step was successful and you can skip over the remainder of this section.

If you see a message similar to:

then PostgreSQL was not installed properly. Either it was not installed at all or your shell's search path was not set to include it. Try calling the command with an absolute path instead:

The path at your site might be different. Contact your site administrator or check the installation instructions to correct the situation.

Another response could be this:

This means that the server was not started, or it is not listening where createdb expects to contact it. Again, check the installation instructions or consult the administrator.

Another response could be this:

where your own login name is mentioned. This will happen if the administrator has not created a PostgreSQL user account for you. (PostgreSQL user accounts are distinct from operating system user accounts.) If you are the administrator, see Chapter 21 for help creating accounts. You will need to become the operating system user under which PostgreSQL was installed (usually postgres) to create the first user account. It could also be that you were assigned a PostgreSQL user name that is different from your operating system user name; in that case you need to use the -U switch or set the PGUSER environment variable to specify your PostgreSQL user name.

If you have a user account but it does not have the privileges required to create a database, you will see the following:

Not every user has authorization to create new databases. If PostgreSQL refuses to create databases for you then the site administrator needs to grant you permission to create databases. Consult your site administrator if this occurs. If you installed PostgreSQL yourself then you should log in for the purposes of this tutorial under the user account that you started the server as. [1]

You can also create databases with other names. PostgreSQL allows you to create any number of databases at a given site. Database names must have an alphabetic first character and are limited to 63 bytes in length. A convenient choice is to create a database with the same name as your current user name. Many tools assume that database name as the default, so it can save you some typing. To create that database, simply type:

If you do not want to use your database anymore you can remove it. For example, if you are the owner (creator) of the database mydb, you can destroy it using the following command:

(For this command, the database name does not default to the user account name. You always need to specify it.) This action physically removes all files associated with the database and cannot be undone, so this should only be done with a great deal of forethought.

More about createdb and dropdb can be found in createdb and dropdb respectively.

[1] As an explanation for why this works: PostgreSQL user names are separate from operating system user accounts. When you connect to a database, you can choose what PostgreSQL user name to connect as; if you don't, it will default to the same name as your current operating system account. As it happens, there will always be a PostgreSQL user account that has the same name as the operating system user that started the server, and it also happens that that user always has permission to create databases. Instead of logging in as that user you can also specify the -U option everywhere to select a PostgreSQL user name to connect as.

**Examples:**

Example 1 (unknown):
```unknown
$ createdb mydb
```

Example 2 (unknown):
```unknown
createdb mydb
```

Example 3 (yaml):
```yaml
createdb: command not found
```

Example 4 (unknown):
```unknown
$ /usr/local/pgsql/bin/createdb mydb
```

---

## 

**URL:** https://www.postgresql.org/docs/18/pgwaldump.html

**Contents:**
- pg_waldump
- Synopsis
- Description
- Options
- Environment
- Notes
- See Also

pg_waldump — display a human-readable rendering of the write-ahead log of a PostgreSQL database cluster

pg_waldump [option...] [startseg [endseg]]

pg_waldump displays the write-ahead log (WAL) and is mainly useful for debugging or educational purposes.

This utility can only be run by the user who installed the server, because it requires read-only access to the data directory.

The following command-line options control the location and format of the output:

Start reading at the specified WAL segment file. This implicitly determines the path in which files will be searched for, and the timeline to use.

Stop after reading the specified WAL segment file.

Output detailed information about backup blocks.

Only display records that modify the given block. The relation must also be provided with --relation or -R.

Stop reading at the specified WAL location, instead of reading to the end of the log stream.

After reaching the end of valid WAL, keep polling once per second for new WAL to appear.

Only display records that modify blocks in the given fork. The valid values are main for the main fork, fsm for the free space map, vm for the visibility map, and init for the init fork.

Display the specified number of records, then stop.

Specifies a directory to search for WAL segment files or a directory with a pg_wal subdirectory that contains such files. The default is to search in the current directory, the pg_wal subdirectory of the current directory, and the pg_wal subdirectory of PGDATA.

Do not print any output, except for errors. This option can be useful when you want to know whether a range of WAL records can be successfully parsed but don't care about the record contents.

Only display records generated by the specified resource manager. You can specify the option multiple times to select multiple resource managers. If list is passed as name, print a list of valid resource manager names, and exit.

Extensions may define custom resource managers, but pg_waldump does not load the extension module and therefore does not recognize custom resource managers by name. Instead, you can specify the custom resource managers as custom### where ### is the three-digit resource manager ID. Names of this form will always be considered valid.

Only display records that modify blocks in the given relation. The relation is specified with tablespace OID, database OID, and relfilenode separated by slashes, for example 1234/12345/12345. This is the same format used for relations in the program's output.

WAL location at which to start reading. The default is to start reading the first valid WAL record found in the earliest file found.

Timeline from which to read WAL records. The default is to use the value in startseg, if that is specified; otherwise, the default is 1. The value can be specified in decimal or hexadecimal, for example 17 or 0x11.

Print the pg_waldump version and exit.

Only display records that include full page images.

Only display records marked with the given transaction ID.

Display summary statistics (number and size of records and full-page images) instead of individual records. Optionally generate statistics per-record instead of per-rmgr.

If pg_waldump is terminated by signal SIGINT (Control+C), the summary of the statistics computed is displayed up to the termination point. This operation is not supported on Windows.

Save full page images found in the WAL records to the save_path directory. The images saved are subject to the same filtering and limiting criteria as the records displayed.

The full page images are saved with the following file name format: TIMELINE-LSN.RELTABLESPACE.DATOID.RELNODE.BLKNO_FORK The file names are composed of the following parts:

Show help about pg_waldump command line arguments, and exit.

Data directory; see also the -p option.

Specifies whether to use color in diagnostic messages. Possible values are always, auto and never.

Can give wrong results when the server is running.

Only the specified timeline is displayed (or the default, if none is specified). Records in other timelines are ignored.

pg_waldump cannot read WAL files with suffix .partial. If those files need to be read, .partial suffix needs to be removed from the file name.

**Examples:**

Example 1 (unknown):
```unknown
--bkp-details
```

Example 2 (unknown):
```unknown
--block=block
```

Example 3 (unknown):
```unknown
--fork=fork
```

Example 4 (unknown):
```unknown
--limit=limit
```

---

## 3.6. Inheritance #

**URL:** https://www.postgresql.org/docs/18/tutorial-inheritance.html

**Contents:**
- 3.6. Inheritance #
  - Note

Inheritance is a concept from object-oriented databases. It opens up interesting new possibilities of database design.

Let's create two tables: A table cities and a table capitals. Naturally, capitals are also cities, so you want some way to show the capitals implicitly when you list all cities. If you're really clever you might invent some scheme like this:

This works OK as far as querying goes, but it gets ugly when you need to update several rows, for one thing.

A better solution is this:

In this case, a row of capitals inherits all columns (name, population, and elevation) from its parent, cities. The type of the column name is text, a native PostgreSQL type for variable length character strings. The capitals table has an additional column, state, which shows its state abbreviation. In PostgreSQL, a table can inherit from zero or more other tables.

For example, the following query finds the names of all cities, including state capitals, that are located at an elevation over 500 feet:

On the other hand, the following query finds all the cities that are not state capitals and are situated at an elevation over 500 feet:

Here the ONLY before cities indicates that the query should be run over only the cities table, and not tables below cities in the inheritance hierarchy. Many of the commands that we have already discussed — SELECT, UPDATE, and DELETE — support this ONLY notation.

Although inheritance is frequently useful, it has not been integrated with unique constraints or foreign keys, which limits its usefulness. See Section 5.11 for more detail.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE capitals (
  name       text,
  population real,
  elevation  int,    -- (in ft)
  state      char(2)
);

CREATE TABLE non_capitals (
  name       text,
  population real,
  elevation  int     -- (in ft)
);

CREATE VIEW cities AS
  SELECT name, population, elevation FROM capitals
    UNION
  SELECT name, population, elevation FROM non_capitals;
```

Example 2 (sql):
```sql
CREATE TABLE cities (
  name       text,
  population real,
  elevation  int     -- (in ft)
);

CREATE TABLE capitals (
  state      char(2) UNIQUE NOT NULL
) INHERITS (cities);
```

Example 3 (sql):
```sql
SELECT name, elevation
  FROM cities
  WHERE elevation > 500;
```

Example 4 (yaml):
```yaml
name    | elevation
-----------+-----------
 Las Vegas |      2174
 Mariposa  |      1953
 Madison   |       845
(3 rows)
```

---

## 33.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/lo-intro.html

**Contents:**
- 33.1. Introduction #

All large objects are stored in a single system table named pg_largeobject. Each large object also has an entry in the system table pg_largeobject_metadata. Large objects can be created, modified, and deleted using a read/write API that is similar to standard operations on files.

PostgreSQL also supports a storage system called “TOAST”, which automatically stores values larger than a single database page into a secondary storage area per table. This makes the large object facility partially obsolete. One remaining advantage of the large object facility is that it allows values up to 4 TB in size, whereas TOASTed fields can be at most 1 GB. Also, reading and updating portions of a large object can be done efficiently, while most operations on a TOASTed field will read or write the whole value as a unit.

**Examples:**

Example 1 (unknown):
```unknown
pg_largeobject
```

Example 2 (unknown):
```unknown
pg_largeobject_metadata
```

---

## 61.2. Genetic Algorithms #

**URL:** https://www.postgresql.org/docs/18/geqo-intro2.html

**Contents:**
- 61.2. Genetic Algorithms #

The genetic algorithm (GA) is a heuristic optimization method which operates through randomized search. The set of possible solutions for the optimization problem is considered as a population of individuals. The degree of adaptation of an individual to its environment is specified by its fitness.

The coordinates of an individual in the search space are represented by chromosomes, in essence a set of character strings. A gene is a subsection of a chromosome which encodes the value of a single parameter being optimized. Typical encodings for a gene could be binary or integer.

Through simulation of the evolutionary operations recombination, mutation, and selection new generations of search points are found that show a higher average fitness than their ancestors. Figure 61.1 illustrates these steps.

Figure 61.1. Structure of a Genetic Algorithm

According to the comp.ai.genetic FAQ it cannot be stressed too strongly that a GA is not a pure random search for a solution to a problem. A GA uses stochastic processes, but the result is distinctly non-random (better than random).

---

## 11.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/indexes-intro.html

**Contents:**
- 11.1. Introduction #

Suppose we have a table similar to this:

and the application issues many queries of the form:

With no advance preparation, the system would have to scan the entire test1 table, row by row, to find all matching entries. If there are many rows in test1 and only a few rows (perhaps zero or one) that would be returned by such a query, this is clearly an inefficient method. But if the system has been instructed to maintain an index on the id column, it can use a more efficient method for locating matching rows. For instance, it might only have to walk a few levels deep into a search tree.

A similar approach is used in most non-fiction books: terms and concepts that are frequently looked up by readers are collected in an alphabetic index at the end of the book. The interested reader can scan the index relatively quickly and flip to the appropriate page(s), rather than having to read the entire book to find the material of interest. Just as it is the task of the author to anticipate the items that readers are likely to look up, it is the task of the database programmer to foresee which indexes will be useful.

The following command can be used to create an index on the id column, as discussed:

The name test1_id_index can be chosen freely, but you should pick something that enables you to remember later what the index was for.

To remove an index, use the DROP INDEX command. Indexes can be added to and removed from tables at any time.

Once an index is created, no further intervention is required: the system will update the index when the table is modified, and it will use the index in queries when it thinks doing so would be more efficient than a sequential table scan. But you might have to run the ANALYZE command regularly to update statistics to allow the query planner to make educated decisions. See Chapter 14 for information about how to find out whether an index is used and when and why the planner might choose not to use an index.

Indexes can also benefit UPDATE and DELETE commands with search conditions. Indexes can moreover be used in join searches. Thus, an index defined on a column that is part of a join condition can also significantly speed up queries with joins.

In general, PostgreSQL indexes can be used to optimize queries that contain one or more WHERE or JOIN clauses of the form

Here, the indexed-column is whatever column or expression the index has been defined on. The indexable-operator is an operator that is a member of the index's operator class for the indexed column. (More details about that appear below.) And the comparison-value can be any expression that is not volatile and does not reference the index's table.

In some cases the query planner can extract an indexable clause of this form from another SQL construct. A simple example is that if the original clause was

then it can be flipped around into indexable form if the original operator has a commutator operator that is a member of the index's operator class.

Creating an index on a large table can take a long time. By default, PostgreSQL allows reads (SELECT statements) to occur on the table in parallel with index creation, but writes (INSERT, UPDATE, DELETE) are blocked until the index build is finished. In production environments this is often unacceptable. It is possible to allow writes to occur in parallel with index creation, but there are several caveats to be aware of — for more information see Building Indexes Concurrently.

After an index is created, the system has to keep it synchronized with the table. This adds overhead to data manipulation operations. Indexes can also prevent the creation of heap-only tuples. Therefore indexes that are seldom or never used in queries should be removed.

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE test1 (
    id integer,
    content varchar
);
```

Example 2 (sql):
```sql
SELECT content FROM test1 WHERE id = constant;
```

Example 3 (unknown):
```unknown
CREATE INDEX test1_id_index ON test1 (id);
```

Example 4 (unknown):
```unknown
test1_id_index
```

---

## 2.8. Updates #

**URL:** https://www.postgresql.org/docs/18/tutorial-update.html

**Contents:**
- 2.8. Updates #

You can update existing rows using the UPDATE command. Suppose you discover the temperature readings are all off by 2 degrees after November 28. You can correct the data as follows:

Look at the new state of the data:

**Examples:**

Example 1 (sql):
```sql
UPDATE weather
    SET temp_hi = temp_hi - 2,  temp_lo = temp_lo - 2
    WHERE date > '1994-11-28';
```

Example 2 (sql):
```sql
SELECT * FROM weather;

     city      | temp_lo | temp_hi | prcp |    date
---------------+---------+---------+------+------------
 San Francisco |      46 |      50 | 0.25 | 1994-11-27
 San Francisco |      41 |      55 |    0 | 1994-11-29
 Hayward       |      35 |      52 |      | 1994-11-29
(3 rows)
```

---

## 2.9. Deletions #

**URL:** https://www.postgresql.org/docs/18/tutorial-delete.html

**Contents:**
- 2.9. Deletions #

Rows can be removed from a table using the DELETE command. Suppose you are no longer interested in the weather of Hayward. Then you can do the following to delete those rows from the table:

All weather records belonging to Hayward are removed.

One should be wary of statements of the form

Without a qualification, DELETE will remove all rows from the given table, leaving it empty. The system will not request confirmation before doing this!

**Examples:**

Example 1 (sql):
```sql
DELETE FROM weather WHERE city = 'Hayward';
```

Example 2 (sql):
```sql
SELECT * FROM weather;
```

Example 3 (yaml):
```yaml
city      | temp_lo | temp_hi | prcp |    date
---------------+---------+---------+------+------------
 San Francisco |      46 |      50 | 0.25 | 1994-11-27
 San Francisco |      41 |      55 |    0 | 1994-11-29
(2 rows)
```

---

## Chapter 16. Installation from Binaries

**URL:** https://www.postgresql.org/docs/18/install-binaries.html

**Contents:**
- Chapter 16. Installation from Binaries

PostgreSQL is available in the form of binary packages for most common operating systems today. When available, this is the recommended way to install PostgreSQL for users of the system. Building from source (see Chapter 17) is only recommended for people developing PostgreSQL or extensions.

For an updated list of platforms providing binary packages, please visit the download section on the PostgreSQL website at https://www.postgresql.org/download/ and follow the instructions for the specific platform.

---

## 18.3. Starting the Database Server #

**URL:** https://www.postgresql.org/docs/18/server-start.html

**Contents:**
- 18.3. Starting the Database Server #
  - 18.3.1. Server Start-up Failures #
  - 18.3.2. Client Connection Problems #

Before anyone can access the database, you must start the database server. The database server program is called postgres.

If you are using a pre-packaged version of PostgreSQL, it almost certainly includes provisions for running the server as a background task according to the conventions of your operating system. Using the package's infrastructure to start the server will be much less work than figuring out how to do this yourself. Consult the package-level documentation for details.

The bare-bones way to start the server manually is just to invoke postgres directly, specifying the location of the data directory with the -D option, for example:

which will leave the server running in the foreground. This must be done while logged into the PostgreSQL user account. Without -D, the server will try to use the data directory named by the environment variable PGDATA. If that variable is not provided either, it will fail.

Normally it is better to start postgres in the background. For this, use the usual Unix shell syntax:

It is important to store the server's stdout and stderr output somewhere, as shown above. It will help for auditing purposes and to diagnose problems. (See Section 24.3 for a more thorough discussion of log file handling.)

The postgres program also takes a number of other command-line options. For more information, see the postgres reference page and Chapter 19 below.

This shell syntax can get tedious quickly. Therefore the wrapper program pg_ctl is provided to simplify some tasks. For example:

will start the server in the background and put the output into the named log file. The -D option has the same meaning here as for postgres. pg_ctl is also capable of stopping the server.

Normally, you will want to start the database server when the computer boots. Autostart scripts are operating-system-specific. There are a few example scripts distributed with PostgreSQL in the contrib/start-scripts directory. Installing one will require root privileges.

Different systems have different conventions for starting up daemons at boot time. Many systems have a file /etc/rc.local or /etc/rc.d/rc.local. Others use init.d or rc.d directories. Whatever you do, the server must be run by the PostgreSQL user account and not by root or any other user. Therefore you probably should form your commands using su postgres -c '...'. For example:

Here are a few more operating-system-specific suggestions. (In each case be sure to use the proper installation directory and user name where we show generic values.)

For FreeBSD, look at the file contrib/start-scripts/freebsd in the PostgreSQL source distribution.

On OpenBSD, add the following lines to the file /etc/rc.local:

On Linux systems either add

to /etc/rc.d/rc.local or /etc/rc.local or look at the file contrib/start-scripts/linux in the PostgreSQL source distribution.

When using systemd, you can use the following service unit file (e.g., at /etc/systemd/system/postgresql.service):

Using Type=notify requires that the server binary was built with configure --with-systemd.

Consider carefully the timeout setting. systemd has a default timeout of 90 seconds as of this writing and will kill a process that does not report readiness within that time. But a PostgreSQL server that might have to perform crash recovery at startup could take much longer to become ready. The suggested value of infinity disables the timeout logic.

On NetBSD, use either the FreeBSD or Linux start scripts, depending on preference.

On Solaris, create a file called /etc/init.d/postgresql that contains the following line:

Then, create a symbolic link to it in /etc/rc3.d as S99postgresql.

While the server is running, its PID is stored in the file postmaster.pid in the data directory. This is used to prevent multiple server instances from running in the same data directory and can also be used for shutting down the server.

There are several common reasons the server might fail to start. Check the server's log file, or start it by hand (without redirecting standard output or standard error) and see what error messages appear. Below we explain some of the most common error messages in more detail.

This usually means just what it suggests: you tried to start another server on the same port where one is already running. However, if the kernel error message is not Address already in use or some variant of that, there might be a different problem. For example, trying to start a server on a reserved port number might draw something like:

probably means your kernel's limit on the size of shared memory is smaller than the work area PostgreSQL is trying to create (4011376640 bytes in this example). This is only likely to happen if you have set shared_memory_type to sysv. In that case, you can try starting the server with a smaller-than-normal number of buffers (shared_buffers), or reconfigure your kernel to increase the allowed shared memory size. You might also see this message when trying to start multiple servers on the same machine, if their total space requested exceeds the kernel limit.

does not mean you've run out of disk space. It means your kernel's limit on the number of System V semaphores is smaller than the number PostgreSQL wants to create. As above, you might be able to work around the problem by starting the server with a reduced number of allowed connections (max_connections), but you'll eventually want to increase the kernel limit.

Details about configuring System V IPC facilities are given in Section 18.4.1.

Although the error conditions possible on the client side are quite varied and application-dependent, a few of them might be directly related to how the server was started. Conditions other than those shown below should be documented with the respective client application.

This is the generic “I couldn't find a server to talk to” failure. It looks like the above when TCP/IP communication is attempted. A common mistake is to forget to configure listen_addresses so that the server accepts remote TCP connections.

Alternatively, you might get this when attempting Unix-domain socket communication to a local server:

If the server is indeed running, check that the client's idea of the socket path (here /tmp) agrees with the server's unix_socket_directories setting.

A connection failure message always shows the server address or socket path name, which is useful in verifying that the client is trying to connect to the right place. If there is in fact no server listening there, the kernel error message will typically be either Connection refused or No such file or directory, as illustrated. (It is important to realize that Connection refused in this context does not mean that the server got your connection request and rejected it. That case will produce a different message, as shown in Section 20.16.) Other error messages such as Connection timed out might indicate more fundamental problems, like lack of network connectivity, or a firewall blocking the connection.

**Examples:**

Example 1 (unknown):
```unknown
$ postgres -D /usr/local/pgsql/data
```

Example 2 (unknown):
```unknown
postgres -D /usr/local/pgsql/data
```

Example 3 (unknown):
```unknown
$ postgres -D /usr/local/pgsql/data >logfile 2>&1 &
```

Example 4 (unknown):
```unknown
postgres -D /usr/local/pgsql/data >logfile 2>&1 &
```

---

## 3.5. Window Functions #

**URL:** https://www.postgresql.org/docs/18/tutorial-window.html

**Contents:**
- 3.5. Window Functions #

A window function performs a calculation across a set of table rows that are somehow related to the current row. This is comparable to the type of calculation that can be done with an aggregate function. However, window functions do not cause rows to become grouped into a single output row like non-window aggregate calls would. Instead, the rows retain their separate identities. Behind the scenes, the window function is able to access more than just the current row of the query result.

Here is an example that shows how to compare each employee's salary with the average salary in his or her department:

The first three output columns come directly from the table empsalary, and there is one output row for each row in the table. The fourth column represents an average taken across all the table rows that have the same depname value as the current row. (This actually is the same function as the non-window avg aggregate, but the OVER clause causes it to be treated as a window function and computed across the window frame.)

A window function call always contains an OVER clause directly following the window function's name and argument(s). This is what syntactically distinguishes it from a normal function or non-window aggregate. The OVER clause determines exactly how the rows of the query are split up for processing by the window function. The PARTITION BY clause within OVER divides the rows into groups, or partitions, that share the same values of the PARTITION BY expression(s). For each row, the window function is computed across the rows that fall into the same partition as the current row.

You can also control the order in which rows are processed by window functions using ORDER BY within OVER. (The window ORDER BY does not even have to match the order in which the rows are output.) Here is an example:

As shown here, the row_number window function assigns sequential numbers to the rows within each partition, in the order defined by the ORDER BY clause (with tied rows numbered in an unspecified order). row_number needs no explicit parameter, because its behavior is entirely determined by the OVER clause.

The rows considered by a window function are those of the “virtual table” produced by the query's FROM clause as filtered by its WHERE, GROUP BY, and HAVING clauses if any. For example, a row removed because it does not meet the WHERE condition is not seen by any window function. A query can contain multiple window functions that slice up the data in different ways using different OVER clauses, but they all act on the same collection of rows defined by this virtual table.

We already saw that ORDER BY can be omitted if the ordering of rows is not important. It is also possible to omit PARTITION BY, in which case there is a single partition containing all rows.

There is another important concept associated with window functions: for each row, there is a set of rows within its partition called its window frame. Some window functions act only on the rows of the window frame, rather than of the whole partition. By default, if ORDER BY is supplied then the frame consists of all rows from the start of the partition up through the current row, plus any following rows that are equal to the current row according to the ORDER BY clause. When ORDER BY is omitted the default frame consists of all rows in the partition. [5] Here is an example using sum:

Above, since there is no ORDER BY in the OVER clause, the window frame is the same as the partition, which for lack of PARTITION BY is the whole table; in other words each sum is taken over the whole table and so we get the same result for each output row. But if we add an ORDER BY clause, we get very different results:

Here the sum is taken from the first (lowest) salary up through the current one, including any duplicates of the current one (notice the results for the duplicated salaries).

Window functions are permitted only in the SELECT list and the ORDER BY clause of the query. They are forbidden elsewhere, such as in GROUP BY, HAVING and WHERE clauses. This is because they logically execute after the processing of those clauses. Also, window functions execute after non-window aggregate functions. This means it is valid to include an aggregate function call in the arguments of a window function, but not vice versa.

If there is a need to filter or group rows after the window calculations are performed, you can use a sub-select. For example:

The above query only shows the rows from the inner query having row_number less than 3 (that is, the first two rows for each department).

When a query involves multiple window functions, it is possible to write out each one with a separate OVER clause, but this is duplicative and error-prone if the same windowing behavior is wanted for several functions. Instead, each windowing behavior can be named in a WINDOW clause and then referenced in OVER. For example:

More details about window functions can be found in Section 4.2.8, Section 9.22, Section 7.2.5, and the SELECT reference page.

[5] There are options to define the window frame in other ways, but this tutorial does not cover them. See Section 4.2.8 for details.

**Examples:**

Example 1 (sql):
```sql
SELECT depname, empno, salary, avg(salary) OVER (PARTITION BY depname) FROM empsalary;
```

Example 2 (yaml):
```yaml
depname  | empno | salary |          avg
-----------+-------+--------+-----------------------
 develop   |    11 |   5200 | 5020.0000000000000000
 develop   |     7 |   4200 | 5020.0000000000000000
 develop   |     9 |   4500 | 5020.0000000000000000
 develop   |     8 |   6000 | 5020.0000000000000000
 develop   |    10 |   5200 | 5020.0000000000000000
 personnel |     5 |   3500 | 3700.0000000000000000
 personnel |     2 |   3900 | 3700.0000000000000000
 sales     |     3 |   4800 | 4866.6666666666666667
 sales     |     1 |   5000 | 4866.6666666666666667
 sales     |     4 |   4800 | 4866.6666666666666667
(10 rows)
```

Example 3 (unknown):
```unknown
PARTITION BY
```

Example 4 (unknown):
```unknown
PARTITION BY
```

---

## 2.2. Concepts #

**URL:** https://www.postgresql.org/docs/18/tutorial-concepts.html

**Contents:**
- 2.2. Concepts #

PostgreSQL is a relational database management system (RDBMS). That means it is a system for managing data stored in relations. Relation is essentially a mathematical term for table. The notion of storing data in tables is so commonplace today that it might seem inherently obvious, but there are a number of other ways of organizing databases. Files and directories on Unix-like operating systems form an example of a hierarchical database. A more modern development is the object-oriented database.

Each table is a named collection of rows. Each row of a given table has the same set of named columns, and each column is of a specific data type. Whereas columns have a fixed order in each row, it is important to remember that SQL does not guarantee the order of the rows within the table in any way (although they can be explicitly sorted for display).

Tables are grouped into databases, and a collection of databases managed by a single PostgreSQL server instance constitutes a database cluster.

---

## 61.3. Genetic Query Optimization (GEQO) in PostgreSQL #

**URL:** https://www.postgresql.org/docs/18/geqo-pg-intro.html

**Contents:**
- 61.3. Genetic Query Optimization (GEQO) in PostgreSQL #
  - 61.3.1. Generating Possible Plans with GEQO #
  - 61.3.2. Future Implementation Tasks for PostgreSQL GEQO #

The GEQO module approaches the query optimization problem as though it were the well-known traveling salesman problem (TSP). Possible query plans are encoded as integer strings. Each string represents the join order from one relation of the query to the next. For example, the join tree

is encoded by the integer string '4-1-3-2', which means, first join relation '4' and '1', then '3', and then '2', where 1, 2, 3, 4 are relation IDs within the PostgreSQL optimizer.

Specific characteristics of the GEQO implementation in PostgreSQL are:

Usage of a steady state GA (replacement of the least fit individuals in a population, not whole-generational replacement) allows fast convergence towards improved query plans. This is essential for query handling with reasonable time;

Usage of edge recombination crossover which is especially suited to keep edge losses low for the solution of the TSP by means of a GA;

Mutation as genetic operator is deprecated so that no repair mechanisms are needed to generate legal TSP tours.

Parts of the GEQO module are adapted from D. Whitley's Genitor algorithm.

The GEQO module allows the PostgreSQL query optimizer to support large join queries effectively through non-exhaustive search.

The GEQO planning process uses the standard planner code to generate plans for scans of individual relations. Then join plans are developed using the genetic approach. As shown above, each candidate join plan is represented by a sequence in which to join the base relations. In the initial stage, the GEQO code simply generates some possible join sequences at random. For each join sequence considered, the standard planner code is invoked to estimate the cost of performing the query using that join sequence. (For each step of the join sequence, all three possible join strategies are considered; and all the initially-determined relation scan plans are available. The estimated cost is the cheapest of these possibilities.) Join sequences with lower estimated cost are considered “more fit” than those with higher cost. The genetic algorithm discards the least fit candidates. Then new candidates are generated by combining genes of more-fit candidates — that is, by using randomly-chosen portions of known low-cost join sequences to create new sequences for consideration. This process is repeated until a preset number of join sequences have been considered; then the best one found at any time during the search is used to generate the finished plan.

This process is inherently nondeterministic, because of the randomized choices made during both the initial population selection and subsequent “mutation” of the best candidates. To avoid surprising changes of the selected plan, each run of the GEQO algorithm restarts its random number generator with the current geqo_seed parameter setting. As long as geqo_seed and the other GEQO parameters are kept fixed, the same plan will be generated for a given query (and other planner inputs such as statistics). To experiment with different search paths, try changing geqo_seed.

Work is still needed to improve the genetic algorithm parameter settings. In file src/backend/optimizer/geqo/geqo_main.c, routines gimme_pool_size and gimme_number_generations, we have to find a compromise for the parameter settings to satisfy two competing demands:

Optimality of the query plan

In the current implementation, the fitness of each candidate join sequence is estimated by running the standard planner's join selection and cost estimation code from scratch. To the extent that different candidates use similar sub-sequences of joins, a great deal of work will be repeated. This could be made significantly faster by retaining cost estimates for sub-joins. The problem is to avoid expending unreasonable amounts of memory on retaining that state.

At a more basic level, it is not clear that solving query optimization with a GA algorithm designed for TSP is appropriate. In the TSP case, the cost associated with any substring (partial tour) is independent of the rest of the tour, but this is certainly not true for query optimization. Thus it is questionable whether edge recombination crossover is the most effective mutation procedure.

**Examples:**

Example 1 (unknown):
```unknown
src/backend/optimizer/geqo/geqo_main.c
```

Example 2 (unknown):
```unknown
gimme_pool_size
```

Example 3 (unknown):
```unknown
gimme_number_generations
```

---

## 2.3. Creating a New Table #

**URL:** https://www.postgresql.org/docs/18/tutorial-table.html

**Contents:**
- 2.3. Creating a New Table #

You can create a new table by specifying the table name, along with all column names and their types:

You can enter this into psql with the line breaks. psql will recognize that the command is not terminated until the semicolon.

White space (i.e., spaces, tabs, and newlines) can be used freely in SQL commands. That means you can type the command aligned differently than above, or even all on one line. Two dashes (“--”) introduce comments. Whatever follows them is ignored up to the end of the line. SQL is case-insensitive about key words and identifiers, except when identifiers are double-quoted to preserve the case (not done above).

varchar(80) specifies a data type that can store arbitrary character strings up to 80 characters in length. int is the normal integer type. real is a type for storing single precision floating-point numbers. date should be self-explanatory. (Yes, the column of type date is also named date. This might be convenient or confusing — you choose.)

PostgreSQL supports the standard SQL types int, smallint, real, double precision, char(N), varchar(N), date, time, timestamp, and interval, as well as other types of general utility and a rich set of geometric types. PostgreSQL can be customized with an arbitrary number of user-defined data types. Consequently, type names are not key words in the syntax, except where required to support special cases in the SQL standard.

The second example will store cities and their associated geographical location:

The point type is an example of a PostgreSQL-specific data type.

Finally, it should be mentioned that if you don't need a table any longer or want to recreate it differently you can remove it using the following command:

**Examples:**

Example 1 (sql):
```sql
CREATE TABLE weather (
    city            varchar(80),
    temp_lo         int,           -- low temperature
    temp_hi         int,           -- high temperature
    prcp            real,          -- precipitation
    date            date
);
```

Example 2 (unknown):
```unknown
varchar(80)
```

Example 3 (unknown):
```unknown
double precision
```

Example 4 (sql):
```sql
CREATE TABLE cities (
    name            varchar(80),
    location        point
);
```

---

## Part I. Tutorial

**URL:** https://www.postgresql.org/docs/18/tutorial.html

**Contents:**
- Part I. Tutorial

Welcome to the PostgreSQL Tutorial. The tutorial is intended to give an introduction to PostgreSQL, relational database concepts, and the SQL language. We assume some general knowledge about how to use computers and no particular Unix or programming experience is required. This tutorial is intended to provide hands-on experience with important aspects of the PostgreSQL system. It makes no attempt to be a comprehensive treatment of the topics it covers.

After you have successfully completed this tutorial you will want to read the Part II section to gain a better understanding of the SQL language, or Part IV for information about developing applications with PostgreSQL. Those who provision and manage their own PostgreSQL installation should also read Part III.

---

## 2.4. Populating a Table With Rows #

**URL:** https://www.postgresql.org/docs/18/tutorial-populate.html

**Contents:**
- 2.4. Populating a Table With Rows #

The INSERT statement is used to populate a table with rows:

Note that all data types use rather obvious input formats. Constants that are not simple numeric values usually must be surrounded by single quotes ('), as in the example. The date type is actually quite flexible in what it accepts, but for this tutorial we will stick to the unambiguous format shown here.

The point type requires a coordinate pair as input, as shown here:

The syntax used so far requires you to remember the order of the columns. An alternative syntax allows you to list the columns explicitly:

You can list the columns in a different order if you wish or even omit some columns, e.g., if the precipitation is unknown:

Many developers consider explicitly listing the columns better style than relying on the order implicitly.

Please enter all the commands shown above so you have some data to work with in the following sections.

You could also have used COPY to load large amounts of data from flat-text files. This is usually faster because the COPY command is optimized for this application while allowing less flexibility than INSERT. An example would be:

where the file name for the source file must be available on the machine running the backend process, not the client, since the backend process reads the file directly. The data inserted above into the weather table could also be inserted from a file containing (values are separated by a tab character):

You can read more about the COPY command in COPY.

**Examples:**

Example 1 (sql):
```sql
INSERT INTO weather VALUES ('San Francisco', 46, 50, 0.25, '1994-11-27');
```

Example 2 (sql):
```sql
INSERT INTO cities VALUES ('San Francisco', '(-194.0, 53.0)');
```

Example 3 (sql):
```sql
INSERT INTO weather (city, temp_lo, temp_hi, prcp, date)
    VALUES ('San Francisco', 43, 57, 0.0, '1994-11-29');
```

Example 4 (sql):
```sql
INSERT INTO weather (date, city, temp_hi, temp_lo)
    VALUES ('1994-11-29', 'Hayward', 54, 37);
```

---

## 20.1. The pg_hba.conf File #

**URL:** https://www.postgresql.org/docs/18/auth-pg-hba-conf.html

**Contents:**
- 20.1. The pg_hba.conf File #
  - Note
  - Note
  - Note
  - Warning
  - Tip

Client authentication is controlled by a configuration file, which traditionally is named pg_hba.conf and is stored in the database cluster's data directory. (HBA stands for host-based authentication.) A default pg_hba.conf file is installed when the data directory is initialized by initdb. It is possible to place the authentication configuration file elsewhere, however; see the hba_file configuration parameter.

The pg_hba.conf file is read on start-up and when the main server process receives a SIGHUP signal. If you edit the file on an active system, you will need to signal the postmaster (using pg_ctl reload, calling the SQL function pg_reload_conf(), or using kill -HUP) to make it re-read the file.

The preceding statement is not true on Microsoft Windows: there, any changes in the pg_hba.conf file are immediately applied by subsequent new connections.

The system view pg_hba_file_rules can be helpful for pre-testing changes to the pg_hba.conf file, or for diagnosing problems if loading of the file did not have the desired effects. Rows in the view with non-null error fields indicate problems in the corresponding lines of the file.

The general format of the pg_hba.conf file is a set of records, one per line. Blank lines are ignored, as is any text after the # comment character. A record can be continued onto the next line by ending the line with a backslash. (Backslashes are not special except at the end of a line.) A record is made up of a number of fields which are separated by spaces and/or tabs. Fields can contain white space if the field value is double-quoted. Quoting one of the keywords in a database, user, or address field (e.g., all or replication) makes the word lose its special meaning, and just match a database, user, or host with that name. Backslash line continuation applies even within quoted text or comments.

Each authentication record specifies a connection type, a client IP address range (if relevant for the connection type), a database name, a user name, and the authentication method to be used for connections matching these parameters. The first record with a matching connection type, client address, requested database, and user name is used to perform authentication. There is no “fall-through” or “backup”: if one record is chosen and the authentication fails, subsequent records are not considered. If no record matches, access is denied.

Each record can be an include directive or an authentication record. Include directives specify files that can be included, that contain additional records. The records will be inserted in place of the include directives. Include directives only contain two fields: include, include_if_exists or include_dir directive and the file or directory to be included. The file or directory can be a relative or absolute path, and can be double-quoted. For the include_dir form, all files not starting with a . and ending with .conf will be included. Multiple files within an include directory are processed in file name order (according to C locale rules, i.e., numbers before letters, and uppercase letters before lowercase ones).

A record can have several formats:

The meaning of the fields is as follows:

This record matches connection attempts using Unix-domain sockets. Without a record of this type, Unix-domain socket connections are disallowed.

This record matches connection attempts made using TCP/IP. host records match SSL or non-SSL connection attempts as well as GSSAPI encrypted or non-GSSAPI encrypted connection attempts.

Remote TCP/IP connections will not be possible unless the server is started with an appropriate value for the listen_addresses configuration parameter, since the default behavior is to listen for TCP/IP connections only on the local loopback address localhost.

This record matches connection attempts made using TCP/IP, but only when the connection is made with SSL encryption.

To make use of this option the server must be built with SSL support. Furthermore, SSL must be enabled by setting the ssl configuration parameter (see Section 18.9 for more information). Otherwise, the hostssl record is ignored except for logging a warning that it cannot match any connections.

This record type has the opposite behavior of hostssl; it only matches connection attempts made over TCP/IP that do not use SSL.

This record matches connection attempts made using TCP/IP, but only when the connection is made with GSSAPI encryption.

To make use of this option the server must be built with GSSAPI support. Otherwise, the hostgssenc record is ignored except for logging a warning that it cannot match any connections.

This record type has the opposite behavior of hostgssenc; it only matches connection attempts made over TCP/IP that do not use GSSAPI encryption.

Specifies which database name(s) this record matches. The value all specifies that it matches all databases. The value sameuser specifies that the record matches if the requested database has the same name as the requested user. The value samerole specifies that the requested user must be a member of the role with the same name as the requested database. (samegroup is an obsolete but still accepted spelling of samerole.) Superusers are not considered to be members of a role for the purposes of samerole unless they are explicitly members of the role, directly or indirectly, and not just by virtue of being a superuser. The value replication specifies that the record matches if a physical replication connection is requested, however, it doesn't match with logical replication connections. Note that physical replication connections do not specify any particular database whereas logical replication connections do specify it. Otherwise, this is the name of a specific PostgreSQL database or a regular expression. Multiple database names and/or regular expressions can be supplied by separating them with commas.

If the database name starts with a slash (/), the remainder of the name is treated as a regular expression. (See Section 9.7.3.1 for details of PostgreSQL's regular expression syntax.)

A separate file containing database names and/or regular expressions can be specified by preceding the file name with @.

Specifies which database user name(s) this record matches. The value all specifies that it matches all users. Otherwise, this is either the name of a specific database user, a regular expression (when starting with a slash (/), or a group name preceded by +. (Recall that there is no real distinction between users and groups in PostgreSQL; a + mark really means “match any of the roles that are directly or indirectly members of this role”, while a name without a + mark matches only that specific role.) For this purpose, a superuser is only considered to be a member of a role if they are explicitly a member of the role, directly or indirectly, and not just by virtue of being a superuser. Multiple user names and/or regular expressions can be supplied by separating them with commas.

If the user name starts with a slash (/), the remainder of the name is treated as a regular expression. (See Section 9.7.3.1 for details of PostgreSQL's regular expression syntax.)

A separate file containing user names and/or regular expressions can be specified by preceding the file name with @.

Specifies the client machine address(es) that this record matches. This field can contain either a host name, an IP address range, or one of the special key words mentioned below.

An IP address range is specified using standard numeric notation for the range's starting address, then a slash (/) and a CIDR mask length. The mask length indicates the number of high-order bits of the client IP address that must match. Bits to the right of this should be zero in the given IP address. There must not be any white space between the IP address, the /, and the CIDR mask length.

Typical examples of an IPv4 address range specified this way are 172.20.143.89/32 for a single host, or 172.20.143.0/24 for a small network, or 10.6.0.0/16 for a larger one. An IPv6 address range might look like ::1/128 for a single host (in this case the IPv6 loopback address) or fe80::7a31:c1ff:0000:0000/96 for a small network. 0.0.0.0/0 represents all IPv4 addresses, and ::0/0 represents all IPv6 addresses. To specify a single host, use a mask length of 32 for IPv4 or 128 for IPv6. In a network address, do not omit trailing zeroes.

An entry given in IPv4 format will match only IPv4 connections, and an entry given in IPv6 format will match only IPv6 connections, even if the represented address is in the IPv4-in-IPv6 range.

You can also write all to match any IP address, samehost to match any of the server's own IP addresses, or samenet to match any address in any subnet that the server is directly connected to.

If a host name is specified (anything that is not an IP address range or a special key word is treated as a host name), that name is compared with the result of a reverse name resolution of the client's IP address (e.g., reverse DNS lookup, if DNS is used). Host name comparisons are case insensitive. If there is a match, then a forward name resolution (e.g., forward DNS lookup) is performed on the host name to check whether any of the addresses it resolves to are equal to the client's IP address. If both directions match, then the entry is considered to match. (The host name that is used in pg_hba.conf should be the one that address-to-name resolution of the client's IP address returns, otherwise the line won't be matched. Some host name databases allow associating an IP address with multiple host names, but the operating system will only return one host name when asked to resolve an IP address.)

A host name specification that starts with a dot (.) matches a suffix of the actual host name. So .example.com would match foo.example.com (but not just example.com).

When host names are specified in pg_hba.conf, you should make sure that name resolution is reasonably fast. It can be of advantage to set up a local name resolution cache such as nscd. Also, you may wish to enable the configuration parameter log_hostname to see the client's host name instead of the IP address in the log.

These fields do not apply to local records.

Users sometimes wonder why host names are handled in this seemingly complicated way, with two name resolutions including a reverse lookup of the client's IP address. This complicates use of the feature in case the client's reverse DNS entry is not set up or yields some undesirable host name. It is done primarily for efficiency: this way, a connection attempt requires at most two resolver lookups, one reverse and one forward. If there is a resolver problem with some address, it becomes only that client's problem. A hypothetical alternative implementation that only did forward lookups would have to resolve every host name mentioned in pg_hba.conf during every connection attempt. That could be quite slow if many names are listed. And if there is a resolver problem with one of the host names, it becomes everyone's problem.

Also, a reverse lookup is necessary to implement the suffix matching feature, because the actual client host name needs to be known in order to match it against the pattern.

Note that this behavior is consistent with other popular implementations of host name-based access control, such as the Apache HTTP Server and TCP Wrappers.

These two fields can be used as an alternative to the IP-address/mask-length notation. Instead of specifying the mask length, the actual mask is specified in a separate column. For example, 255.0.0.0 represents an IPv4 CIDR mask length of 8, and 255.255.255.255 represents a CIDR mask length of 32.

These fields do not apply to local records.

Specifies the authentication method to use when a connection matches this record. The possible choices are summarized here; details are in Section 20.3. All the options are lower case and treated case sensitively, so even acronyms like ldap must be specified as lower case.

Allow the connection unconditionally. This method allows anyone that can connect to the PostgreSQL database server to login as any PostgreSQL user they wish, without the need for a password or any other authentication. See Section 20.4 for details.

Reject the connection unconditionally. This is useful for “filtering out” certain hosts from a group, for example a reject line could block a specific host from connecting, while a later line allows the remaining hosts in a specific network to connect.

Perform SCRAM-SHA-256 authentication to verify the user's password. See Section 20.5 for details.

Perform SCRAM-SHA-256 or MD5 authentication to verify the user's password. See Section 20.5 for details.

Support for MD5-encrypted passwords is deprecated and will be removed in a future release of PostgreSQL. Refer to Section 20.5 for details about migrating to another password type.

Require the client to supply an unencrypted password for authentication. Since the password is sent in clear text over the network, this should not be used on untrusted networks. See Section 20.5 for details.

Use GSSAPI to authenticate the user. This is only available for TCP/IP connections. See Section 20.6 for details. It can be used in conjunction with GSSAPI encryption.

Use SSPI to authenticate the user. This is only available on Windows. See Section 20.7 for details.

Obtain the operating system user name of the client by contacting the ident server on the client and check if it matches the requested database user name. Ident authentication can only be used on TCP/IP connections. When specified for local connections, peer authentication will be used instead. See Section 20.8 for details.

Obtain the client's operating system user name from the operating system and check if it matches the requested database user name. This is only available for local connections. See Section 20.9 for details.

Authenticate using an LDAP server. See Section 20.10 for details.

Authenticate using a RADIUS server. See Section 20.11 for details.

Authenticate using SSL client certificates. See Section 20.12 for details.

Authenticate using the Pluggable Authentication Modules (PAM) service provided by the operating system. See Section 20.13 for details.

Authenticate using the BSD Authentication service provided by the operating system. See Section 20.14 for details.

Authorize and optionally authenticate using a third-party OAuth 2.0 identity provider. See Section 20.15 for details.

After the auth-method field, there can be field(s) of the form name=value that specify options for the authentication method. Details about which options are available for which authentication methods appear below.

In addition to the method-specific options listed below, there is a method-independent authentication option clientcert, which can be specified in any hostssl record. This option can be set to verify-ca or verify-full. Both options require the client to present a valid (trusted) SSL certificate, while verify-full additionally enforces that the cn (Common Name) in the certificate matches the username or an applicable mapping. This behavior is similar to the cert authentication method (see Section 20.12) but enables pairing the verification of client certificates with any authentication method that supports hostssl entries.

On any record using client certificate authentication (i.e. one using the cert authentication method or one using the clientcert option), you can specify which part of the client certificate credentials to match using the clientname option. This option can have one of two values. If you specify clientname=CN, which is the default, the username is matched against the certificate's Common Name (CN). If instead you specify clientname=DN the username is matched against the entire Distinguished Name (DN) of the certificate. This option is probably best used in conjunction with a username map. The comparison is done with the DN in RFC 2253 format. To see the DN of a client certificate in this format, do

Care needs to be taken when using this option, especially when using regular expression matching against the DN.

This line will be replaced by the contents of the given file.

This line will be replaced by the content of the given file if the file exists. Otherwise, a message is logged to indicate that the file has been skipped.

This line will be replaced by the contents of all the files found in the directory, if they don't start with a . and end with .conf, processed in file name order (according to C locale rules, i.e., numbers before letters, and uppercase letters before lowercase ones).

Files included by @ constructs are read as lists of names, which can be separated by either whitespace or commas. Comments are introduced by #, just as in pg_hba.conf, and nested @ constructs are allowed. Unless the file name following @ is an absolute path, it is taken to be relative to the directory containing the referencing file.

Since the pg_hba.conf records are examined sequentially for each connection attempt, the order of the records is significant. Typically, earlier records will have tight connection match parameters and weaker authentication methods, while later records will have looser match parameters and stronger authentication methods. For example, one might wish to use trust authentication for local TCP/IP connections but require a password for remote TCP/IP connections. In this case a record specifying trust authentication for connections from 127.0.0.1 would appear before a record specifying password authentication for a wider range of allowed client IP addresses.

To connect to a particular database, a user must not only pass the pg_hba.conf checks, but must have the CONNECT privilege for the database. If you wish to restrict which users can connect to which databases, it's usually easier to control this by granting/revoking CONNECT privilege than to put the rules in pg_hba.conf entries.

Some examples of pg_hba.conf entries are shown in Example 20.1. See the next section for details on the different authentication methods.

Example 20.1. Example pg_hba.conf Entries

**Examples:**

Example 1 (unknown):
```unknown
pg_hba.conf
```

Example 2 (unknown):
```unknown
pg_hba.conf
```

Example 3 (unknown):
```unknown
pg_hba.conf
```

Example 4 (unknown):
```unknown
pg_hba.conf
```

---

## 1.4. Accessing a Database #

**URL:** https://www.postgresql.org/docs/18/tutorial-accessdb.html

**Contents:**
- 1.4. Accessing a Database #

Once you have created a database, you can access it by:

Running the PostgreSQL interactive terminal program, called psql, which allows you to interactively enter, edit, and execute SQL commands.

Using an existing graphical frontend tool like pgAdmin or an office suite with ODBC or JDBC support to create and manipulate a database. These possibilities are not covered in this tutorial.

Writing a custom application, using one of the several available language bindings. These possibilities are discussed further in Part IV.

You probably want to start up psql to try the examples in this tutorial. It can be activated for the mydb database by typing the command:

If you do not supply the database name then it will default to your user account name. You already discovered this scheme in the previous section using createdb.

In psql, you will be greeted with the following message:

The last line could also be:

That would mean you are a database superuser, which is most likely the case if you installed the PostgreSQL instance yourself. Being a superuser means that you are not subject to access controls. For the purposes of this tutorial that is not important.

If you encounter problems starting psql then go back to the previous section. The diagnostics of createdb and psql are similar, and if the former worked the latter should work as well.

The last line printed out by psql is the prompt, and it indicates that psql is listening to you and that you can type SQL queries into a work space maintained by psql. Try out these commands:

The psql program has a number of internal commands that are not SQL commands. They begin with the backslash character, “\”. For example, you can get help on the syntax of various PostgreSQL SQL commands by typing:

To get out of psql, type:

and psql will quit and return you to your command shell. (For more internal commands, type \? at the psql prompt.) The full capabilities of psql are documented in psql. In this tutorial we will not use these features explicitly, but you can use them yourself when it is helpful.

**Examples:**

Example 1 (unknown):
```unknown
$ psql mydb
```

Example 2 (javascript):
```javascript
psql (18.1)
Type "help" for help.

mydb=>
```

Example 3 (sql):
```sql
mydb=> SELECT version();
                                         version
-------------------------------------------------------------------​-----------------------
 PostgreSQL 18.1 on x86_64-pc-linux-gnu, compiled by gcc (Debian 4.9.2-10) 4.9.2, 64-bit
(1 row)

mydb=> SELECT current_date;
    date
------------
 2016-01-07
(1 row)

mydb=> SELECT 2 + 2;
 ?column?
----------
        4
(1 row)
```

Example 4 (sql):
```sql
SELECT version();
```

---

## 13.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/mvcc-intro.html

**Contents:**
- 13.1. Introduction #

PostgreSQL provides a rich set of tools for developers to manage concurrent access to data. Internally, data consistency is maintained by using a multiversion model (Multiversion Concurrency Control, MVCC). This means that each SQL statement sees a snapshot of data (a database version) as it was some time ago, regardless of the current state of the underlying data. This prevents statements from viewing inconsistent data produced by concurrent transactions performing updates on the same data rows, providing transaction isolation for each database session. MVCC, by eschewing the locking methodologies of traditional database systems, minimizes lock contention in order to allow for reasonable performance in multiuser environments.

The main advantage of using the MVCC model of concurrency control rather than locking is that in MVCC locks acquired for querying (reading) data do not conflict with locks acquired for writing data, and so reading never blocks writing and writing never blocks reading. PostgreSQL maintains this guarantee even when providing the strictest level of transaction isolation through the use of an innovative Serializable Snapshot Isolation (SSI) level.

Table- and row-level locking facilities are also available in PostgreSQL for applications which don't generally need full transaction isolation and prefer to explicitly manage particular points of conflict. However, proper use of MVCC will generally provide better performance than locks. In addition, application-defined advisory locks provide a mechanism for acquiring locks that are not tied to a single transaction.

---

## 1.1. Installation #

**URL:** https://www.postgresql.org/docs/18/tutorial-install.html

**Contents:**
- 1.1. Installation #

Before you can use PostgreSQL you need to install it, of course. It is possible that PostgreSQL is already installed at your site, either because it was included in your operating system distribution or because the system administrator already installed it. If that is the case, you should obtain information from the operating system documentation or your system administrator about how to access PostgreSQL.

If you are not sure whether PostgreSQL is already available or whether you can use it for your experimentation then you can install it yourself. Doing so is not hard and it can be a good exercise. PostgreSQL can be installed by any unprivileged user; no superuser (root) access is required.

If you are installing PostgreSQL yourself, then refer to Chapter 17 for instructions on installation, and return to this guide when the installation is complete. Be sure to follow closely the section about setting up the appropriate environment variables.

If your site administrator has not set things up in the default way, you might have some more work to do. For example, if the database server machine is a remote machine, you will need to set the PGHOST environment variable to the name of the database server machine. The environment variable PGPORT might also have to be set. The bottom line is this: if you try to start an application program and it complains that it cannot connect to the database, you should consult your site administrator or, if that is you, the documentation to make sure that your environment is properly set up. If you did not understand the preceding paragraph then read the next section.

---

## 61.1. Query Handling as a Complex Optimization Problem #

**URL:** https://www.postgresql.org/docs/18/geqo-intro.html

**Contents:**
- 61.1. Query Handling as a Complex Optimization Problem #

Among all relational operators the most difficult one to process and optimize is the join. The number of possible query plans grows exponentially with the number of joins in the query. Further optimization effort is caused by the support of a variety of join methods (e.g., nested loop, hash join, merge join in PostgreSQL) to process individual joins and a diversity of indexes (e.g., B-tree, hash, GiST and GIN in PostgreSQL) as access paths for relations.

The normal PostgreSQL query optimizer performs a near-exhaustive search over the space of alternative strategies. This algorithm, first introduced in IBM's System R database, produces a near-optimal join order, but can take an enormous amount of time and memory space when the number of joins in the query grows large. This makes the ordinary PostgreSQL query optimizer inappropriate for queries that join a large number of tables.

The Institute of Automatic Control at the University of Mining and Technology, in Freiberg, Germany, encountered some problems when it wanted to use PostgreSQL as the backend for a decision support knowledge based system for the maintenance of an electrical power grid. The DBMS needed to handle large join queries for the inference machine of the knowledge based system. The number of joins in these queries made using the normal query optimizer infeasible.

In the following we describe the implementation of a genetic algorithm to solve the join ordering problem in a manner that is efficient for queries involving large numbers of joins.

---

## 2.7. Aggregate Functions #

**URL:** https://www.postgresql.org/docs/18/tutorial-agg.html

**Contents:**
- 2.7. Aggregate Functions #

Like most other relational database products, PostgreSQL supports aggregate functions. An aggregate function computes a single result from multiple input rows. For example, there are aggregates to compute the count, sum, avg (average), max (maximum) and min (minimum) over a set of rows.

As an example, we can find the highest low-temperature reading anywhere with:

If we wanted to know what city (or cities) that reading occurred in, we might try:

but this will not work since the aggregate max cannot be used in the WHERE clause. (This restriction exists because the WHERE clause determines which rows will be included in the aggregate calculation; so obviously it has to be evaluated before aggregate functions are computed.) However, as is often the case the query can be restated to accomplish the desired result, here by using a subquery:

This is OK because the subquery is an independent computation that computes its own aggregate separately from what is happening in the outer query.

Aggregates are also very useful in combination with GROUP BY clauses. For example, we can get the number of readings and the maximum low temperature observed in each city with:

which gives us one output row per city. Each aggregate result is computed over the table rows matching that city. We can filter these grouped rows using HAVING:

which gives us the same results for only the cities that have all temp_lo values below 40. Finally, if we only care about cities whose names begin with “S”, we might do:

The LIKE operator does pattern matching and is explained in Section 9.7.

It is important to understand the interaction between aggregates and SQL's WHERE and HAVING clauses. The fundamental difference between WHERE and HAVING is this: WHERE selects input rows before groups and aggregates are computed (thus, it controls which rows go into the aggregate computation), whereas HAVING selects group rows after groups and aggregates are computed. Thus, the WHERE clause must not contain aggregate functions; it makes no sense to try to use an aggregate to determine which rows will be inputs to the aggregates. On the other hand, the HAVING clause always contains aggregate functions. (Strictly speaking, you are allowed to write a HAVING clause that doesn't use aggregates, but it's seldom useful. The same condition could be used more efficiently at the WHERE stage.)

In the previous example, we can apply the city name restriction in WHERE, since it needs no aggregate. This is more efficient than adding the restriction to HAVING, because we avoid doing the grouping and aggregate calculations for all rows that fail the WHERE check.

Another way to select the rows that go into an aggregate computation is to use FILTER, which is a per-aggregate option:

FILTER is much like WHERE, except that it removes rows only from the input of the particular aggregate function that it is attached to. Here, the count aggregate counts only rows with temp_lo below 45; but the max aggregate is still applied to all rows, so it still finds the reading of 46.

**Examples:**

Example 1 (sql):
```sql
SELECT max(temp_lo) FROM weather;
```

Example 2 (yaml):
```yaml
max
-----
  46
(1 row)
```

Example 3 (sql):
```sql
SELECT city FROM weather WHERE temp_lo = max(temp_lo);     -- WRONG
```

Example 4 (sql):
```sql
SELECT city FROM weather
    WHERE temp_lo = (SELECT max(temp_lo) FROM weather);
```

---

## 3.1. Introduction #

**URL:** https://www.postgresql.org/docs/18/tutorial-advanced-intro.html

**Contents:**
- 3.1. Introduction #

In the previous chapter we have covered the basics of using SQL to store and access your data in PostgreSQL. We will now discuss some more advanced features of SQL that simplify management and prevent loss or corruption of your data. Finally, we will look at some PostgreSQL extensions.

This chapter will on occasion refer to examples found in Chapter 2 to change or improve them, so it will be useful to have read that chapter. Some examples from this chapter can also be found in advanced.sql in the tutorial directory. This file also contains some sample data to load, which is not repeated here. (Refer to Section 2.1 for how to use the file.)

**Examples:**

Example 1 (unknown):
```unknown
advanced.sql
```

---

## 1.2. Architectural Fundamentals #

**URL:** https://www.postgresql.org/docs/18/tutorial-arch.html

**Contents:**
- 1.2. Architectural Fundamentals #

Before we proceed, you should understand the basic PostgreSQL system architecture. Understanding how the parts of PostgreSQL interact will make this chapter somewhat clearer.

In database jargon, PostgreSQL uses a client/server model. A PostgreSQL session consists of the following cooperating processes (programs):

A server process, which manages the database files, accepts connections to the database from client applications, and performs database actions on behalf of the clients. The database server program is called postgres.

The user's client (frontend) application that wants to perform database operations. Client applications can be very diverse in nature: a client could be a text-oriented tool, a graphical application, a web server that accesses the database to display web pages, or a specialized database maintenance tool. Some client applications are supplied with the PostgreSQL distribution; most are developed by users.

As is typical of client/server applications, the client and the server can be on different hosts. In that case they communicate over a TCP/IP network connection. You should keep this in mind, because the files that can be accessed on a client machine might not be accessible (or might only be accessible using a different file name) on the database server machine.

The PostgreSQL server can handle multiple concurrent connections from clients. To achieve this it starts (“forks”) a new process for each connection. From that point on, the client and the new server process communicate without intervention by the original postgres process. Thus, the supervisor server process is always running, waiting for client connections, whereas client and associated server processes come and go. (All of this is of course invisible to the user. We only mention it here for completeness.)

---
