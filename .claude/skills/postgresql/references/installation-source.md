# PostgreSQL - Installation Source

## 17.6. Supported Platforms #


**URL:** https://www.postgresql.org/docs/18/supported-platforms.html

**Contents:**
- 17.6. Supported Platforms #

A platform (that is, a CPU architecture and operating system combination) is considered supported by the PostgreSQL development community if the code contains provisions to work on that platform and it has recently been verified to build and pass its regression tests on that platform. Currently, most testing of platform compatibility is done automatically by test machines in the PostgreSQL Build Farm. If you are interested in using PostgreSQL on a platform that is not represented in the build farm, but on which the code works or can be made to work, you are strongly encouraged to set up a build farm member machine so that continued compatibility can be assured.

In general, PostgreSQL can be expected to work on these CPU architectures: x86, PowerPC, S/390, SPARC, ARM, MIPS, and RISC-V, including big-endian, little-endian, 32-bit, and 64-bit variants where applicable.

PostgreSQL can be expected to work on current versions of these operating systems: Linux, Windows, FreeBSD, OpenBSD, NetBSD, DragonFlyBSD, macOS, Solaris, and illumos. Other Unix-like systems may also work but are not currently being tested. In most cases, all CPU architectures supported by a given operating system will work. Look in Section 17.7 below to see if there is information specific to your operating system, particularly if using an older system.

If you have installation problems on a platform that is known to be supported according to recent build farm results, please report it to <pgsql-bugs@lists.postgresql.org>. If you are interested in porting PostgreSQL to a new platform, <pgsql-hackers@lists.postgresql.org> is the appropriate place to discuss that.

Historical versions of PostgreSQL or POSTGRES also ran on CPU architectures including Alpha, Itanium, M32R, M68K, M88K, NS32K, PA-RISC, SuperH, and VAX, and operating systems including 4.3BSD, AIX, BEOS, BSD/OS, DG/UX, Dynix, HP-UX, IRIX, NeXTSTEP, QNX, SCO, SINIX, Sprite, SunOS, Tru64 UNIX, and ULTRIX.

**Examples:**

Example 1 (python):
```python
<pgsql-bugs@lists.postgresql.org>
```

Example 2 (python):
```python
<pgsql-hackers@lists.postgresql.org>
```

---


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


---

