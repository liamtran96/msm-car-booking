# PostgreSQL - Pltcl

## 42.2. PL/Tcl Functions and Arguments #


**URL:** https://www.postgresql.org/docs/18/pltcl-functions.html

**Contents:**
- 42.2. PL/Tcl Functions and Arguments #
  - Tip

To create a function in the PL/Tcl language, use the standard CREATE FUNCTION syntax:

PL/TclU is the same, except that the language has to be specified as pltclu.

The body of the function is simply a piece of Tcl script. When the function is called, the argument values are passed to the Tcl script as variables named 1 ... n. The result is returned from the Tcl code in the usual way, with a return statement. In a procedure, the return value from the Tcl code is ignored.

For example, a function returning the greater of two integer values could be defined as:

Note the clause STRICT, which saves us from having to think about null input values: if a null value is passed, the function will not be called at all, but will just return a null result automatically.

In a nonstrict function, if the actual value of an argument is null, the corresponding $n variable will be set to an empty string. To detect whether a particular argument is null, use the function argisnull. For example, suppose that we wanted tcl_max with one null and one nonnull argument to return the nonnull argument, rather than null:

As shown above, to return a null value from a PL/Tcl function, execute return_null. This can be done whether the function is strict or not.

Composite-type arguments are passed to the function as Tcl arrays. The element names of the array are the attribute names of the composite type. If an attribute in the passed row has the null value, it will not appear in the array. Here is an example:

PL/Tcl functions can return composite-type results, too. To do this, the Tcl code must return a list of column name/value pairs matching the expected result type. Any column names omitted from the list are returned as nulls, and an error is raised if there are unexpected column names. Here is an example:

Output arguments of procedures are returned in the same way, for example:

The result list can be made from an array representation of the desired tuple with the array get Tcl command. For example:

PL/Tcl functions can return sets. To do this, the Tcl code should call return_next once per row to be returned, passing either the appropriate value when returning a scalar type, or a list of column name/value pairs when returning a composite type. Here is an example returning a scalar type:

and here is one returning a composite type:

**Examples:**

Example 1 (javascript):
```javascript
CREATE FUNCTION funcname (argument-types) RETURNS return-type AS $$
    # PL/Tcl function body
$$ LANGUAGE pltcl;
```

Example 2 (unknown):
```unknown
argument-types
```

Example 3 (unknown):
```unknown
return-type
```

Example 4 (javascript):
```javascript
CREATE FUNCTION tcl_max(integer, integer) RETURNS integer AS $$
    if {$1 > $2} {return $1}
    return $2
$$ LANGUAGE pltcl STRICT;
```

---


---

## 42.12. Tcl Procedure Names #


**URL:** https://www.postgresql.org/docs/18/pltcl-procnames.html

**Contents:**
- 42.12. Tcl Procedure Names #

In PostgreSQL, the same function name can be used for different function definitions if the functions are placed in different schemas, or if the number of arguments or their types differ. Tcl, however, requires all procedure names to be distinct. PL/Tcl deals with this by including the argument type names in the internal Tcl procedure name, and then appending the function's object ID (OID) to the internal Tcl procedure name if necessary to make it different from the names of all previously-loaded functions in the same Tcl interpreter. Thus, PostgreSQL functions with the same name and different argument types will be different Tcl procedures, too. This is not normally a concern for a PL/Tcl programmer, but it might be visible when debugging.

For this reason among others, a PL/Tcl function cannot call another one directly (that is, within Tcl). If you need to do that, you must go through SQL, using spi_exec or a related command.

---


---

## 42.3. Data Values in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-data.html

**Contents:**
- 42.3. Data Values in PL/Tcl #

The argument values supplied to a PL/Tcl function's code are simply the input arguments converted to text form (just as if they had been displayed by a SELECT statement). Conversely, the return and return_next commands will accept any string that is acceptable input format for the function's declared result type, or for the specified column of a composite result type.

**Examples:**

Example 1 (unknown):
```unknown
return_next
```

---


---

## 42.4. Global Data in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-global.html

**Contents:**
- 42.4. Global Data in PL/Tcl #

Sometimes it is useful to have some global data that is held between two calls to a function or is shared between different functions. This is easily done in PL/Tcl, but there are some restrictions that must be understood.

For security reasons, PL/Tcl executes functions called by any one SQL role in a separate Tcl interpreter for that role. This prevents accidental or malicious interference by one user with the behavior of another user's PL/Tcl functions. Each such interpreter will have its own values for any “global” Tcl variables. Thus, two PL/Tcl functions will share the same global variables if and only if they are executed by the same SQL role. In an application wherein a single session executes code under multiple SQL roles (via SECURITY DEFINER functions, use of SET ROLE, etc.) you may need to take explicit steps to ensure that PL/Tcl functions can share data. To do that, make sure that functions that should communicate are owned by the same user, and mark them SECURITY DEFINER. You must of course take care that such functions can't be used to do anything unintended.

All PL/TclU functions used in a session execute in the same Tcl interpreter, which of course is distinct from the interpreter(s) used for PL/Tcl functions. So global data is automatically shared between PL/TclU functions. This is not considered a security risk because all PL/TclU functions execute at the same trust level, namely that of a database superuser.

To help protect PL/Tcl functions from unintentionally interfering with each other, a global array is made available to each function via the upvar command. The global name of this variable is the function's internal name, and the local name is GD. It is recommended that GD be used for persistent private data of a function. Use regular Tcl global variables only for values that you specifically intend to be shared among multiple functions. (Note that the GD arrays are only global within a particular interpreter, so they do not bypass the security restrictions mentioned above.)

An example of using GD appears in the spi_execp example below.

**Examples:**

Example 1 (unknown):
```unknown
SECURITY DEFINER
```

Example 2 (unknown):
```unknown
SECURITY DEFINER
```

---


---

## 42.8. Error Handling in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-error-handling.html

**Contents:**
- 42.8. Error Handling in PL/Tcl #

Tcl code within or called from a PL/Tcl function can raise an error, either by executing some invalid operation or by generating an error using the Tcl error command or PL/Tcl's elog command. Such errors can be caught within Tcl using the Tcl catch command. If an error is not caught but is allowed to propagate out to the top level of execution of the PL/Tcl function, it is reported as an SQL error in the function's calling query.

Conversely, SQL errors that occur within PL/Tcl's spi_exec, spi_prepare, and spi_execp commands are reported as Tcl errors, so they are catchable by Tcl's catch command. (Each of these PL/Tcl commands runs its SQL operation in a subtransaction, which is rolled back on error, so that any partially-completed operation is automatically cleaned up.) Again, if an error propagates out to the top level without being caught, it turns back into an SQL error.

Tcl provides an errorCode variable that can represent additional information about an error in a form that is easy for Tcl programs to interpret. The contents are in Tcl list format, and the first word identifies the subsystem or library reporting the error; beyond that the contents are left to the individual subsystem or library. For database errors reported by PL/Tcl commands, the first word is POSTGRES, the second word is the PostgreSQL version number, and additional words are field name/value pairs providing detailed information about the error. Fields SQLSTATE, condition, and message are always supplied (the first two represent the error code and condition name as shown in Appendix A). Fields that may be present include detail, hint, context, schema, table, column, datatype, constraint, statement, cursor_position, filename, lineno, and funcname.

A convenient way to work with PL/Tcl's errorCode information is to load it into an array, so that the field names become array subscripts. Code for doing that might look like

(The double colons explicitly specify that errorCode is a global variable.)

**Examples:**

Example 1 (unknown):
```unknown
spi_prepare
```

Example 2 (unknown):
```unknown
cursor_position
```

Example 3 (julia):
```julia
if {[catch { spi_exec $sql_command }]} {
    if {[lindex $::errorCode 0] == "POSTGRES"} {
        array set errorArray $::errorCode
        if {$errorArray(condition) == "undefined_table"} {
            # deal with missing table
        } else {
            # deal with some other type of SQL error
        }
    }
}
```

---


---

## Chapter 42. PL/Tcl — Tcl Procedural Language


**URL:** https://www.postgresql.org/docs/18/pltcl.html

**Contents:**
- Chapter 42. PL/Tcl — Tcl Procedural Language

PL/Tcl is a loadable procedural language for the PostgreSQL database system that enables the Tcl language to be used to write PostgreSQL functions and procedures.

---


---

## 42.10. Transaction Management #


**URL:** https://www.postgresql.org/docs/18/pltcl-transactions.html

**Contents:**
- 42.10. Transaction Management #

In a procedure called from the top level or an anonymous code block (DO command) called from the top level it is possible to control transactions. To commit the current transaction, call the commit command. To roll back the current transaction, call the rollback command. (Note that it is not possible to run the SQL commands COMMIT or ROLLBACK via spi_exec or similar. It has to be done using these functions.) After a transaction is ended, a new transaction is automatically started, so there is no separate command for that.

Transactions cannot be ended when an explicit subtransaction is active.

**Examples:**

Example 1 (sql):
```sql
CREATE PROCEDURE transaction_test1()
LANGUAGE pltcl
AS $$
for {set i 0} {$i < 10} {incr i} {
    spi_exec "INSERT INTO test1 (a) VALUES ($i)"
    if {$i % 2 == 0} {
        commit
    } else {
        rollback
    }
}
$$;

CALL transaction_test1();
```

---


---

## 42.7. Event Trigger Functions in PL/Tcl #


**URL:** https://www.postgresql.org/docs/18/pltcl-event-trigger.html

**Contents:**
- 42.7. Event Trigger Functions in PL/Tcl #

Event trigger functions can be written in PL/Tcl. PostgreSQL requires that a function that is to be called as an event trigger must be declared as a function with no arguments and a return type of event_trigger.

The information from the trigger manager is passed to the function body in the following variables:

The name of the event the trigger is fired for.

The command tag for which the trigger is fired.

The return value of the trigger function is ignored.

Here's a little example event trigger function that simply raises a NOTICE message each time a supported command is executed:

**Examples:**

Example 1 (unknown):
```unknown
event_trigger
```

Example 2 (javascript):
```javascript
CREATE OR REPLACE FUNCTION tclsnitch() RETURNS event_trigger AS $$
  elog NOTICE "tclsnitch: $TG_event $TG_tag"
$$ LANGUAGE pltcl;

CREATE EVENT TRIGGER tcl_a_snitch ON ddl_command_start EXECUTE FUNCTION tclsnitch();
```

---


---

## 42.1. Overview #


**URL:** https://www.postgresql.org/docs/18/pltcl-overview.html

**Contents:**
- 42.1. Overview #

PL/Tcl offers most of the capabilities a function writer has in the C language, with a few restrictions, and with the addition of the powerful string processing libraries that are available for Tcl.

One compelling good restriction is that everything is executed from within the safety of the context of a Tcl interpreter. In addition to the limited command set of safe Tcl, only a few commands are available to access the database via SPI and to raise messages via elog(). PL/Tcl provides no way to access internals of the database server or to gain OS-level access under the permissions of the PostgreSQL server process, as a C function can do. Thus, unprivileged database users can be trusted to use this language; it does not give them unlimited authority.

The other notable implementation restriction is that Tcl functions cannot be used to create input/output functions for new data types.

Sometimes it is desirable to write Tcl functions that are not restricted to safe Tcl. For example, one might want a Tcl function that sends email. To handle these cases, there is a variant of PL/Tcl called PL/TclU (for untrusted Tcl). This is exactly the same language except that a full Tcl interpreter is used. If PL/TclU is used, it must be installed as an untrusted procedural language so that only database superusers can create functions in it. The writer of a PL/TclU function must take care that the function cannot be used to do anything unwanted, since it will be able to do anything that could be done by a user logged in as the database administrator.

The shared object code for the PL/Tcl and PL/TclU call handlers is automatically built and installed in the PostgreSQL library directory if Tcl support is specified in the configuration step of the installation procedure. To install PL/Tcl and/or PL/TclU in a particular database, use the CREATE EXTENSION command, for example CREATE EXTENSION pltcl or CREATE EXTENSION pltclu.

**Examples:**

Example 1 (unknown):
```unknown
CREATE EXTENSION
```

Example 2 (unknown):
```unknown
CREATE EXTENSION pltcl
```

Example 3 (unknown):
```unknown
CREATE EXTENSION pltclu
```

---


---

