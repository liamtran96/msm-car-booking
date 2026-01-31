# PostgreSQL - Plperl

## 43.1. PL/Perl Functions and Arguments #


**URL:** https://www.postgresql.org/docs/18/plperl-funcs.html

**Contents:**
- 43.1. PL/Perl Functions and Arguments #
  - Note
  - Note
  - Note

To create a function in the PL/Perl language, use the standard CREATE FUNCTION syntax:

The body of the function is ordinary Perl code. In fact, the PL/Perl glue code wraps it inside a Perl subroutine. A PL/Perl function is called in a scalar context, so it can't return a list. You can return non-scalar values (arrays, records, and sets) by returning a reference, as discussed below.

In a PL/Perl procedure, any return value from the Perl code is ignored.

PL/Perl also supports anonymous code blocks called with the DO statement:

An anonymous code block receives no arguments, and whatever value it might return is discarded. Otherwise it behaves just like a function.

The use of named nested subroutines is dangerous in Perl, especially if they refer to lexical variables in the enclosing scope. Because a PL/Perl function is wrapped in a subroutine, any named subroutine you place inside one will be nested. In general, it is far safer to create anonymous subroutines which you call via a coderef. For more information, see the entries for Variable "%s" will not stay shared and Variable "%s" is not available in the perldiag man page, or search the Internet for “perl nested named subroutine”.

The syntax of the CREATE FUNCTION command requires the function body to be written as a string constant. It is usually most convenient to use dollar quoting (see Section 4.1.2.4) for the string constant. If you choose to use escape string syntax E'', you must double any single quote marks (') and backslashes (\) used in the body of the function (see Section 4.1.2.1).

Arguments and results are handled as in any other Perl subroutine: arguments are passed in @_, and a result value is returned with return or as the last expression evaluated in the function.

For example, a function returning the greater of two integer values could be defined as:

Arguments will be converted from the database's encoding to UTF-8 for use inside PL/Perl, and then converted from UTF-8 back to the database encoding upon return.

If an SQL null value is passed to a function, the argument value will appear as “undefined” in Perl. The above function definition will not behave very nicely with null inputs (in fact, it will act as though they are zeroes). We could add STRICT to the function definition to make PostgreSQL do something more reasonable: if a null value is passed, the function will not be called at all, but will just return a null result automatically. Alternatively, we could check for undefined inputs in the function body. For example, suppose that we wanted perl_max with one null and one nonnull argument to return the nonnull argument, rather than a null value:

As shown above, to return an SQL null value from a PL/Perl function, return an undefined value. This can be done whether the function is strict or not.

Anything in a function argument that is not a reference is a string, which is in the standard PostgreSQL external text representation for the relevant data type. In the case of ordinary numeric or text types, Perl will just do the right thing and the programmer will normally not have to worry about it. However, in other cases the argument will need to be converted into a form that is more usable in Perl. For example, the decode_bytea function can be used to convert an argument of type bytea into unescaped binary.

Similarly, values passed back to PostgreSQL must be in the external text representation format. For example, the encode_bytea function can be used to escape binary data for a return value of type bytea.

One case that is particularly important is boolean values. As just stated, the default behavior for bool values is that they are passed to Perl as text, thus either 't' or 'f'. This is problematic, since Perl will not treat 'f' as false! It is possible to improve matters by using a “transform” (see CREATE TRANSFORM). Suitable transforms are provided by the bool_plperl extension. To use it, install the extension:

Then use the TRANSFORM function attribute for a PL/Perl function that takes or returns bool, for example:

When this transform is applied, bool arguments will be seen by Perl as being 1 or empty, thus properly true or false. If the function result is type bool, it will be true or false according to whether Perl would evaluate the returned value as true. Similar transformations are also performed for boolean query arguments and results of SPI queries performed inside the function (Section 43.3.1).

Perl can return PostgreSQL arrays as references to Perl arrays. Here is an example:

Perl passes PostgreSQL arrays as a blessed PostgreSQL::InServer::ARRAY object. This object may be treated as an array reference or a string, allowing for backward compatibility with Perl code written for PostgreSQL versions below 9.1 to run. For example:

Multidimensional arrays are represented as references to lower-dimensional arrays of references in a way common to every Perl programmer.

Composite-type arguments are passed to the function as references to hashes. The keys of the hash are the attribute names of the composite type. Here is an example:

A PL/Perl function can return a composite-type result using the same approach: return a reference to a hash that has the required attributes. For example:

Any columns in the declared result data type that are not present in the hash will be returned as null values.

Similarly, output arguments of procedures can be returned as a hash reference:

PL/Perl functions can also return sets of either scalar or composite types. Usually you'll want to return rows one at a time, both to speed up startup time and to keep from queuing up the entire result set in memory. You can do this with return_next as illustrated below. Note that after the last return_next, you must put either return or (better) return undef.

For small result sets, you can return a reference to an array that contains either scalars, references to arrays, or references to hashes for simple types, array types, and composite types, respectively. Here are some simple examples of returning the entire result set as an array reference:

If you wish to use the strict pragma with your code you have a few options. For temporary global use you can SET plperl.use_strict to true. This will affect subsequent compilations of PL/Perl functions, but not functions already compiled in the current session. For permanent global use you can set plperl.use_strict to true in the postgresql.conf file.

For permanent use in specific functions you can simply put:

at the top of the function body.

The feature pragma is also available to use if your Perl is version 5.10.0 or higher.

**Examples:**

Example 1 (javascript):
```javascript
CREATE FUNCTION funcname (argument-types)
RETURNS return-type
-- function attributes can go here
AS $$
    # PL/Perl function body goes here
$$ LANGUAGE plperl;
```

Example 2 (unknown):
```unknown
argument-types
```

Example 3 (unknown):
```unknown
return-type
```

Example 4 (unknown):
```unknown
DO $$
    # PL/Perl code
$$ LANGUAGE plperl;
```

---


---

## 43.7. PL/Perl Event Triggers #


**URL:** https://www.postgresql.org/docs/18/plperl-event-triggers.html

**Contents:**
- 43.7. PL/Perl Event Triggers #

PL/Perl can be used to write event trigger functions. In an event trigger function, the hash reference $_TD contains information about the current trigger event. $_TD is a global variable, which gets a separate local value for each invocation of the trigger. The fields of the $_TD hash reference are:

The name of the event the trigger is fired for.

The command tag for which the trigger is fired.

The return value of the trigger function is ignored.

Here is an example of an event trigger function, illustrating some of the above:

**Examples:**

Example 1 (php):
```php
$_TD->{event}
```

Example 2 (php):
```php
$_TD->{tag}
```

Example 3 (php):
```php
CREATE OR REPLACE FUNCTION perlsnitch() RETURNS event_trigger AS $$
  elog(NOTICE, "perlsnitch: " . $_TD->{event} . " " . $_TD->{tag} . " ");
$$ LANGUAGE plperl;

CREATE EVENT TRIGGER perl_a_snitch
    ON ddl_command_start
    EXECUTE FUNCTION perlsnitch();
```

---


---

## 43.6. PL/Perl Triggers #


**URL:** https://www.postgresql.org/docs/18/plperl-triggers.html

**Contents:**
- 43.6. PL/Perl Triggers #

PL/Perl can be used to write trigger functions. In a trigger function, the hash reference $_TD contains information about the current trigger event. $_TD is a global variable, which gets a separate local value for each invocation of the trigger. The fields of the $_TD hash reference are:

NEW value of column foo

OLD value of column foo

Name of the trigger being called

Trigger event: INSERT, UPDATE, DELETE, TRUNCATE, or UNKNOWN

When the trigger was called: BEFORE, AFTER, INSTEAD OF, or UNKNOWN

The trigger level: ROW, STATEMENT, or UNKNOWN

OID of the table on which the trigger fired

Name of the table on which the trigger fired

Name of the table on which the trigger fired. This has been deprecated, and could be removed in a future release. Please use $_TD->{table_name} instead.

Name of the schema in which the table on which the trigger fired, is

Number of arguments of the trigger function

Arguments of the trigger function. Does not exist if $_TD->{argc} is 0.

Row-level triggers can return one of the following:

Execute the operation

Don't execute the operation

Indicates that the NEW row was modified by the trigger function

Here is an example of a trigger function, illustrating some of the above:

**Examples:**

Example 1 (php):
```php
$_TD->{new}{foo}
```

Example 2 (php):
```php
$_TD->{old}{foo}
```

Example 3 (php):
```php
$_TD->{name}
```

Example 4 (php):
```php
$_TD->{event}
```

---


---

## 43.5. Trusted and Untrusted PL/Perl #


**URL:** https://www.postgresql.org/docs/18/plperl-trusted.html

**Contents:**
- 43.5. Trusted and Untrusted PL/Perl #
  - Warning
  - Note
  - Note

Normally, PL/Perl is installed as a “trusted” programming language named plperl. In this setup, certain Perl operations are disabled to preserve security. In general, the operations that are restricted are those that interact with the environment. This includes file handle operations, require, and use (for external modules). There is no way to access internals of the database server process or to gain OS-level access with the permissions of the server process, as a C function can do. Thus, any unprivileged database user can be permitted to use this language.

Trusted PL/Perl relies on the Perl Opcode module to preserve security. Perl documents that the module is not effective for the trusted PL/Perl use case. If your security needs are incompatible with the uncertainty in that warning, consider executing REVOKE USAGE ON LANGUAGE plperl FROM PUBLIC.

Here is an example of a function that will not work because file system operations are not allowed for security reasons:

The creation of this function will fail as its use of a forbidden operation will be caught by the validator.

Sometimes it is desirable to write Perl functions that are not restricted. For example, one might want a Perl function that sends mail. To handle these cases, PL/Perl can also be installed as an “untrusted” language (usually called PL/PerlU). In this case the full Perl language is available. When installing the language, the language name plperlu will select the untrusted PL/Perl variant.

The writer of a PL/PerlU function must take care that the function cannot be used to do anything unwanted, since it will be able to do anything that could be done by a user logged in as the database administrator. Note that the database system allows only database superusers to create functions in untrusted languages.

If the above function was created by a superuser using the language plperlu, execution would succeed.

In the same way, anonymous code blocks written in Perl can use restricted operations if the language is specified as plperlu rather than plperl, but the caller must be a superuser.

While PL/Perl functions run in a separate Perl interpreter for each SQL role, all PL/PerlU functions executed in a given session run in a single Perl interpreter (which is not any of the ones used for PL/Perl functions). This allows PL/PerlU functions to share data freely, but no communication can occur between PL/Perl and PL/PerlU functions.

Perl cannot support multiple interpreters within one process unless it was built with the appropriate flags, namely either usemultiplicity or useithreads. (usemultiplicity is preferred unless you actually need to use threads. For more details, see the perlembed man page.) If PL/Perl is used with a copy of Perl that was not built this way, then it is only possible to have one Perl interpreter per session, and so any one session can only execute either PL/PerlU functions, or PL/Perl functions that are all called by the same SQL role.

**Examples:**

Example 1 (sql):
```sql
REVOKE USAGE ON LANGUAGE plperl FROM PUBLIC
```

Example 2 (php):
```php
CREATE FUNCTION badfunc() RETURNS integer AS $$
    my $tmpfile = "/tmp/badfile";
    open my $fh, '>', $tmpfile
        or elog(ERROR, qq{could not open the file "$tmpfile": $!});
    print $fh "Testing writing to a file\n";
    close $fh or elog(ERROR, qq{could not close the file "$tmpfile": $!});
    return 1;
$$ LANGUAGE plperl;
```

Example 3 (unknown):
```unknown
usemultiplicity
```

Example 4 (unknown):
```unknown
useithreads
```

---


---

## Chapter 43. PL/Perl — Perl Procedural Language


**URL:** https://www.postgresql.org/docs/18/plperl.html

**Contents:**
- Chapter 43. PL/Perl — Perl Procedural Language
  - Tip
  - Note

PL/Perl is a loadable procedural language that enables you to write PostgreSQL functions and procedures in the Perl programming language.

The main advantage to using PL/Perl is that this allows use, within stored functions and procedures, of the manyfold “string munging” operators and functions available for Perl. Parsing complex strings might be easier using Perl than it is with the string functions and control structures provided in PL/pgSQL.

To install PL/Perl in a particular database, use CREATE EXTENSION plperl.

If a language is installed into template1, all subsequently created databases will have the language installed automatically.

Users of source packages must specially enable the build of PL/Perl during the installation process. (Refer to Chapter 17 for more information.) Users of binary packages might find PL/Perl in a separate subpackage.

**Examples:**

Example 1 (unknown):
```unknown
CREATE EXTENSION plperl
```

---


---

## 43.4. Global Values in PL/Perl #


**URL:** https://www.postgresql.org/docs/18/plperl-global.html

**Contents:**
- 43.4. Global Values in PL/Perl #

You can use the global hash %_SHARED to store data, including code references, between function calls for the lifetime of the current session.

Here is a simple example for shared data:

Here is a slightly more complicated example using a code reference:

(You could have replaced the above with the one-liner return $_SHARED{myquote}->($_[0]); at the expense of readability.)

For security reasons, PL/Perl executes functions called by any one SQL role in a separate Perl interpreter for that role. This prevents accidental or malicious interference by one user with the behavior of another user's PL/Perl functions. Each such interpreter has its own value of the %_SHARED variable and other global state. Thus, two PL/Perl functions will share the same value of %_SHARED if and only if they are executed by the same SQL role. In an application wherein a single session executes code under multiple SQL roles (via SECURITY DEFINER functions, use of SET ROLE, etc.) you may need to take explicit steps to ensure that PL/Perl functions can share data via %_SHARED. To do that, make sure that functions that should communicate are owned by the same user, and mark them SECURITY DEFINER. You must of course take care that such functions can't be used to do anything unintended.

**Examples:**

Example 1 (sql):
```sql
CREATE OR REPLACE FUNCTION set_var(name text, val text) RETURNS text AS $$
    if ($_SHARED{$_[0]} = $_[1]) {
        return 'ok';
    } else {
        return "cannot set shared variable $_[0] to $_[1]";
    }
$$ LANGUAGE plperl;

CREATE OR REPLACE FUNCTION get_var(name text) RETURNS text AS $$
    return $_SHARED{$_[0]};
$$ LANGUAGE plperl;

SELECT set_var('sample', 'Hello, PL/Perl!  How''s tricks?');
SELECT get_var('sample');
```

Example 2 (php):
```php
CREATE OR REPLACE FUNCTION myfuncs() RETURNS void AS $$
    $_SHARED{myquote} = sub {
        my $arg = shift;
        $arg =~ s/(['\\])/\\$1/g;
        return "'$arg'";
    };
$$ LANGUAGE plperl;

SELECT myfuncs(); /* initializes the function */

/* Set up a function that uses the quote function */

CREATE OR REPLACE FUNCTION use_quote(TEXT) RETURNS text AS $$
    my $text_to_quote = shift;
    my $qfunc = $_SHARED{myquote};
    return &$qfunc($text_to_quote);
$$ LANGUAGE plperl;
```

Example 3 (php):
```php
return $_SHARED{myquote}->($_[0]);
```

Example 4 (unknown):
```unknown
SECURITY DEFINER
```

---


---

