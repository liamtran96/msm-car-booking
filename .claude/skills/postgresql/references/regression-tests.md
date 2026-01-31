# PostgreSQL - Regression Tests

## Chapter 31. Regression Tests


**URL:** https://www.postgresql.org/docs/18/regress.html

**Contents:**
- Chapter 31. Regression Tests

The regression tests are a comprehensive set of tests for the SQL implementation in PostgreSQL. They test standard SQL operations as well as the extended capabilities of PostgreSQL.

---


---

## 31.4. TAP Tests #


**URL:** https://www.postgresql.org/docs/18/regress-tap.html

**Contents:**
- 31.4. TAP Tests #
  - 31.4.1. Environment Variables #

Various tests, particularly the client program tests under src/bin, use the Perl TAP tools and are run using the Perl testing program prove. You can pass command-line options to prove by setting the make variable PROVE_FLAGS, for example:

See the manual page of prove for more information.

The make variable PROVE_TESTS can be used to define a whitespace-separated list of paths relative to the Makefile invoking prove to run the specified subset of tests instead of the default t/*.pl. For example:

The TAP tests require the Perl module IPC::Run. This module is available from CPAN or an operating system package. They also require PostgreSQL to be configured with the option --enable-tap-tests.

Generically speaking, the TAP tests will test the executables in a previously-installed installation tree if you say make installcheck, or will build a new local installation tree from current sources if you say make check. In either case they will initialize a local instance (data directory) and transiently run a server in it. Some of these tests run more than one server. Thus, these tests can be fairly resource-intensive.

It's important to realize that the TAP tests will start test server(s) even when you say make installcheck; this is unlike the traditional non-TAP testing infrastructure, which expects to use an already-running test server in that case. Some PostgreSQL subdirectories contain both traditional-style and TAP-style tests, meaning that make installcheck will produce a mix of results from temporary servers and the already-running test server.

Data directories are named according to the test filename, and will be retained if a test fails. If the environment variable PG_TEST_NOCLEAN is set, data directories will be retained regardless of test status. For example, retaining the data directory regardless of test results when running the pg_dump tests:

This environment variable also prevents the test's temporary directories from being removed.

Many operations in the test suites use a 180-second timeout, which on slow hosts may lead to load-induced timeouts. Setting the environment variable PG_TEST_TIMEOUT_DEFAULT to a higher number will change the default to avoid this.

**Examples:**

Example 1 (unknown):
```unknown
PROVE_FLAGS
```

Example 2 (unknown):
```unknown
make -C src/bin check PROVE_FLAGS='--timer'
```

Example 3 (unknown):
```unknown
PROVE_TESTS
```

Example 4 (unknown):
```unknown
make check PROVE_TESTS='t/001_test1.pl t/003_test3.pl'
```

---


---

## 31.3. Variant Comparison Files #


**URL:** https://www.postgresql.org/docs/18/regress-variant.html

**Contents:**
- 31.3. Variant Comparison Files #

Since some of the tests inherently produce environment-dependent results, we have provided ways to specify alternate “expected” result files. Each regression test can have several comparison files showing possible results on different platforms. There are two independent mechanisms for determining which comparison file is used for each test.

The first mechanism allows comparison files to be selected for specific platforms. There is a mapping file, src/test/regress/resultmap, that defines which comparison file to use for each platform. To eliminate bogus test “failures” for a particular platform, you first choose or make a variant result file, and then add a line to the resultmap file.

Each line in the mapping file is of the form

The test name is just the name of the particular regression test module. The output value indicates which output file to check. For the standard regression tests, this is always out. The value corresponds to the file extension of the output file. The platform pattern is a pattern in the style of the Unix tool expr (that is, a regular expression with an implicit ^ anchor at the start). It is matched against the platform name as printed by config.guess. The comparison file name is the base name of the substitute result comparison file.

For example: some systems lack a working strtof function, for which our workaround causes rounding errors in the float4 regression test. Therefore, we provide a variant comparison file, float4-misrounded-input.out, which includes the results to be expected on these systems. To silence the bogus “failure” message on Cygwin platforms, resultmap includes:

which will trigger on any machine where the output of config.guess matches .*-.*-cygwin.*. Other lines in resultmap select the variant comparison file for other platforms where it's appropriate.

The second selection mechanism for variant comparison files is much more automatic: it simply uses the “best match” among several supplied comparison files. The regression test driver script considers both the standard comparison file for a test, testname.out, and variant files named testname_digit.out (where the digit is any single digit 0-9). If any such file is an exact match, the test is considered to pass; otherwise, the one that generates the shortest diff is used to create the failure report. (If resultmap includes an entry for the particular test, then the base testname is the substitute name given in resultmap.)

For example, for the char test, the comparison file char.out contains results that are expected in the C and POSIX locales, while the file char_1.out contains results sorted as they appear in many other locales.

The best-match mechanism was devised to cope with locale-dependent results, but it can be used in any situation where the test results cannot be predicted easily from the platform name alone. A limitation of this mechanism is that the test driver cannot tell which variant is actually “correct” for the current environment; it will just pick the variant that seems to work best. Therefore it is safest to use this mechanism only for variant results that you are willing to consider equally valid in all contexts.

**Examples:**

Example 1 (unknown):
```unknown
src/test/regress/resultmap
```

Example 2 (unknown):
```unknown
config.guess
```

Example 3 (unknown):
```unknown
float4-misrounded-input.out
```

Example 4 (yaml):
```yaml
float4:out:.*-.*-cygwin.*=float4-misrounded-input.out
```

---


---

## 31.2. Test Evaluation #


**URL:** https://www.postgresql.org/docs/18/regress-evaluation.html

**Contents:**
- 31.2. Test Evaluation #
  - 31.2.1. Error Message Differences #
  - 31.2.2. Locale Differences #
  - 31.2.3. Date and Time Differences #
  - 31.2.4. Floating-Point Differences #
  - 31.2.5. Row Ordering Differences #
  - 31.2.6. Insufficient Stack Depth #
  - 31.2.7. The “random” Test #
  - 31.2.8. Configuration Parameters #

Some properly installed and fully functional PostgreSQL installations can “fail” some of these regression tests due to platform-specific artifacts such as varying floating-point representation and message wording. The tests are currently evaluated using a simple diff comparison against the outputs generated on a reference system, so the results are sensitive to small system differences. When a test is reported as “failed”, always examine the differences between expected and actual results; you might find that the differences are not significant. Nonetheless, we still strive to maintain accurate reference files across all supported platforms, so it can be expected that all tests pass.

The actual outputs of the regression tests are in files in the src/test/regress/results directory. The test script uses diff to compare each output file against the reference outputs stored in the src/test/regress/expected directory. Any differences are saved for your inspection in src/test/regress/regression.diffs. (When running a test suite other than the core tests, these files of course appear in the relevant subdirectory, not src/test/regress.)

If you don't like the diff options that are used by default, set the environment variable PG_REGRESS_DIFF_OPTS, for instance PG_REGRESS_DIFF_OPTS='-c'. (Or you can run diff yourself, if you prefer.)

If for some reason a particular platform generates a “failure” for a given test, but inspection of the output convinces you that the result is valid, you can add a new comparison file to silence the failure report in future test runs. See Section 31.3 for details.

Some of the regression tests involve intentional invalid input values. Error messages can come from either the PostgreSQL code or from the host platform system routines. In the latter case, the messages can vary between platforms, but should reflect similar information. These differences in messages will result in a “failed” regression test that can be validated by inspection.

If you run the tests against a server that was initialized with a collation-order locale other than C, then there might be differences due to sort order and subsequent failures. The regression test suite is set up to handle this problem by providing alternate result files that together are known to handle a large number of locales.

To run the tests in a different locale when using the temporary-installation method, pass the appropriate locale-related environment variables on the make command line, for example:

(The regression test driver unsets LC_ALL, so it does not work to choose the locale using that variable.) To use no locale, either unset all locale-related environment variables (or set them to C) or use the following special invocation:

When running the tests against an existing installation, the locale setup is determined by the existing installation. To change it, initialize the database cluster with a different locale by passing the appropriate options to initdb.

In general, it is advisable to try to run the regression tests in the locale setup that is wanted for production use, as this will exercise the locale- and encoding-related code portions that will actually be used in production. Depending on the operating system environment, you might get failures, but then you will at least know what locale-specific behaviors to expect when running real applications.

Most of the date and time results are dependent on the time zone environment. The reference files are generated for time zone America/Los_Angeles, and there will be apparent failures if the tests are not run with that time zone setting. The regression test driver sets environment variable PGTZ to America/Los_Angeles, which normally ensures proper results.

Some of the tests involve computing 64-bit floating-point numbers (double precision) from table columns. Differences in results involving mathematical functions of double precision columns have been observed. The float8 and geometry tests are particularly prone to small differences across platforms, or even with different compiler optimization settings. Human eyeball comparison is needed to determine the real significance of these differences which are usually 10 places to the right of the decimal point.

Some systems display minus zero as -0, while others just show 0.

Some systems signal errors from pow() and exp() differently from the mechanism expected by the current PostgreSQL code.

You might see differences in which the same rows are output in a different order than what appears in the expected file. In most cases this is not, strictly speaking, a bug. Most of the regression test scripts are not so pedantic as to use an ORDER BY for every single SELECT, and so their result row orderings are not well-defined according to the SQL specification. In practice, since we are looking at the same queries being executed on the same data by the same software, we usually get the same result ordering on all platforms, so the lack of ORDER BY is not a problem. Some queries do exhibit cross-platform ordering differences, however. When testing against an already-installed server, ordering differences can also be caused by non-C locale settings or non-default parameter settings, such as custom values of work_mem or the planner cost parameters.

Therefore, if you see an ordering difference, it's not something to worry about, unless the query does have an ORDER BY that your result is violating. However, please report it anyway, so that we can add an ORDER BY to that particular query to eliminate the bogus “failure” in future releases.

You might wonder why we don't order all the regression test queries explicitly to get rid of this issue once and for all. The reason is that that would make the regression tests less useful, not more, since they'd tend to exercise query plan types that produce ordered results to the exclusion of those that don't.

If the errors test results in a server crash at the select infinite_recurse() command, it means that the platform's limit on process stack size is smaller than the max_stack_depth parameter indicates. This can be fixed by running the server under a higher stack size limit (4MB is recommended with the default value of max_stack_depth). If you are unable to do that, an alternative is to reduce the value of max_stack_depth.

On platforms supporting getrlimit(), the server should automatically choose a safe value of max_stack_depth; so unless you've manually overridden this setting, a failure of this kind is a reportable bug.

The random test script is intended to produce random results. In very rare cases, this causes that regression test to fail. Typing:

should produce only one or a few lines of differences. You need not worry unless the random test fails repeatedly.

When running the tests against an existing installation, some non-default parameter settings could cause the tests to fail. For example, changing parameters such as enable_seqscan or enable_indexscan could cause plan changes that would affect the results of tests that use EXPLAIN.

**Examples:**

Example 1 (unknown):
```unknown
src/test/regress/results
```

Example 2 (unknown):
```unknown
src/test/regress/expected
```

Example 3 (unknown):
```unknown
src/test/regress/regression.diffs
```

Example 4 (unknown):
```unknown
src/test/regress
```

---


---

## 31.5. Test Coverage Examination #


**URL:** https://www.postgresql.org/docs/18/regress-coverage.html

**Contents:**
- 31.5. Test Coverage Examination #
  - 31.5.1. Coverage with Autoconf and Make #
  - 31.5.2. Coverage with Meson #

The PostgreSQL source code can be compiled with coverage testing instrumentation, so that it becomes possible to examine which parts of the code are covered by the regression tests or any other test suite that is run with the code. This is currently supported when compiling with GCC, and it requires the gcov and lcov packages.

A typical workflow looks like this:

Then point your HTML browser to coverage/index.html.

If you don't have lcov or prefer text output over an HTML report, you can run

instead of make coverage-html, which will produce .gcov output files for each source file relevant to the test. (make coverage and make coverage-html will overwrite each other's files, so mixing them might be confusing.)

You can run several different tests before making the coverage report; the execution counts will accumulate. If you want to reset the execution counts between test runs, run:

You can run the make coverage-html or make coverage command in a subdirectory if you want a coverage report for only a portion of the code tree.

Use make distclean to clean up when done.

A typical workflow looks like this:

Then point your HTML browser to ./meson-logs/coveragereport/index.html.

You can run several different tests before making the coverage report; the execution counts will accumulate.

**Examples:**

Example 1 (unknown):
```unknown
./configure --enable-coverage ... OTHER OPTIONS ...
make
make check # or other test suite
make coverage-html
```

Example 2 (unknown):
```unknown
coverage/index.html
```

Example 3 (unknown):
```unknown
make coverage
```

Example 4 (unknown):
```unknown
make coverage-html
```

---


---

