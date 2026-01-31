# PostgreSQL - Installation Source (Part 4)

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


---

