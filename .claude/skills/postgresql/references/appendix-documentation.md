# PostgreSQL - Appendix Documentation

## J.2. Tool Sets #


**URL:** https://www.postgresql.org/docs/18/docguide-toolsets.html

**Contents:**
- J.2. Tool Sets #
  - J.2.1. Installation on Fedora, RHEL, and Derivatives #
  - J.2.2. Installation on FreeBSD #
  - J.2.3. Debian Packages #
  - J.2.4. macOS #
  - J.2.5. Detection by configure #

The following tools are used to process the documentation. Some might be optional, as noted.

This is the definition of DocBook itself. We currently use version 4.5; you cannot use later or earlier versions. You need the XML variant of the DocBook DTD, not the SGML variant.

These contain the processing instructions for converting the DocBook sources to other formats, such as HTML.

The minimum required version is currently 1.77.0, but it is recommended to use the latest available version for best results.

This library and the xmllint tool it contains are used for processing XML. Many developers will already have Libxml2 installed, because it is also used when building the PostgreSQL code. Note, however, that xmllint might need to be installed from a separate subpackage.

xsltproc is an XSLT processor, that is, a program to convert XML to other formats using XSLT stylesheets.

This is a program for converting, among other things, XML to PDF. It is needed only if you want to build the documentation in PDF format.

We have documented experience with several installation methods for the various tools that are needed to process the documentation. These will be described below. There might be some other packaged distributions for these tools. Please report package status to the documentation mailing list, and we will include that information here.

To install the required packages, use:

To install the required packages with pkg, use:

When building the documentation from the doc directory you'll need to use gmake, because the makefile provided is not suitable for FreeBSD's make.

There is a full set of packages of the documentation tools available for Debian GNU/Linux. To install, simply use:

If you use MacPorts, the following will get you set up:

If you use Homebrew, use this:

The Homebrew-supplied programs require the following environment variable to be set. For Intel based machines, use this:

On Apple Silicon based machines, use this:

Without it, xsltproc will throw errors like this:

While it is possible to use the Apple-provided versions of xmllint and xsltproc instead of those from MacPorts or Homebrew, you'll still need to install the DocBook DTD and stylesheets, and set up a catalog file that points to them.

Before you can build the documentation you need to run the configure script, as you would when building the PostgreSQL programs themselves. Check the output near the end of the run; it should look something like this:

If xmllint or xsltproc is not found, you will not be able to build any of the documentation. fop is only needed to build the documentation in PDF format. dbtoepub is only needed to build the documentation in EPUB format.

If necessary, you can tell configure where to find these programs, for example

If you prefer to build PostgreSQL using Meson, instead run meson setup as described in Section 17.4, and then see Section J.4.

**Examples:**

Example 1 (unknown):
```unknown
yum install docbook-dtds docbook-style-xsl libxslt fop
```

Example 2 (unknown):
```unknown
pkg install docbook-xml docbook-xsl libxslt fop
```

Example 3 (unknown):
```unknown
apt-get install docbook-xml docbook-xsl libxml2-utils xsltproc fop
```

Example 4 (unknown):
```unknown
sudo port install docbook-xml docbook-xsl-nons libxslt fop
```

---


---

## Appendix J. Documentation


**URL:** https://www.postgresql.org/docs/18/docguide.html

**Contents:**
- Appendix J. Documentation

PostgreSQL has four primary documentation formats:

Plain text, for pre-installation information

HTML, for on-line browsing and reference

man pages, for quick reference.

Additionally, a number of plain-text README files can be found throughout the PostgreSQL source tree, documenting various implementation issues.

HTML documentation and man pages are part of a standard distribution and are installed by default. PDF format documentation is available separately for download.

---


---

## J.4. Building the Documentation with Meson #


**URL:** https://www.postgresql.org/docs/18/docguide-build-meson.html

**Contents:**
- J.4. Building the Documentation with Meson #

To build the documentation using Meson, change to the build directory before running one of these commands, or add -C build to the command.

To build just the HTML version of the documentation:

For a list of other documentation targets see Section 17.4.4.3. The output appears in the subdirectory build/doc/src/sgml.

**Examples:**

Example 1 (unknown):
```unknown
build$ ninja html
```

Example 2 (unknown):
```unknown
build/doc/src/sgml
```

---


---

## J.1. DocBook #


**URL:** https://www.postgresql.org/docs/18/docguide-docbook.html

**Contents:**
- J.1. DocBook #

The documentation sources are written in DocBook, which is a markup language defined in XML. In what follows, the terms DocBook and XML are both used, but technically they are not interchangeable.

DocBook allows an author to specify the structure and content of a technical document without worrying about presentation details. A document style defines how that content is rendered into one of several final forms. DocBook is maintained by the OASIS group. The official DocBook site has good introductory and reference documentation and a complete O'Reilly book for your online reading pleasure. The FreeBSD Documentation Project also uses DocBook and has some good information, including a number of style guidelines that might be worth considering.

---


---

## J.3. Building the Documentation with Make #


**URL:** https://www.postgresql.org/docs/18/docguide-build.html

**Contents:**
- J.3. Building the Documentation with Make #
  - J.3.1. HTML #
  - J.3.2. Manpages #
  - J.3.3. PDF #
  - J.3.4. Syntax Check #

Once you have everything set up, change to the directory doc/src/sgml and run one of the commands described in the following subsections to build the documentation. (Remember to use GNU make.)

To build the HTML version of the documentation:

This is also the default target. The output appears in the subdirectory html.

To produce HTML documentation with the stylesheet used on postgresql.org instead of the default simple style use:

If the STYLE=website option is used, the generated HTML files include references to stylesheets hosted on postgresql.org and require network access to view.

We use the DocBook XSL stylesheets to convert DocBook refentry pages to *roff output suitable for man pages. To create the man pages, use the command:

To produce a PDF rendition of the documentation using FOP, you can use one of the following commands, depending on the preferred paper format:

For U.S. letter format:

Because the PostgreSQL documentation is fairly big, FOP will require a significant amount of memory. Because of that, on some systems, the build will fail with a memory-related error message. This can usually be fixed by configuring Java heap settings in the configuration file ~/.foprc, for example:

There is a minimum amount of memory that is required, and to some extent more memory appears to make things a bit faster. On systems with very little memory (less than 1 GB), the build will either be very slow due to swapping or will not work at all.

In its default configuration FOP will emit an INFO message for each page. The log level can be changed via ~/.foprc:

Other XSL-FO processors can also be used manually, but the automated build process only supports FOP.

Building the documentation can take very long. But there is a method to just check the correct syntax of the documentation files, which only takes a few seconds:

**Examples:**

Example 1 (unknown):
```unknown
doc/src/sgml
```

Example 2 (unknown):
```unknown
doc/src/sgml$ make html
```

Example 3 (unknown):
```unknown
doc/src/sgml$
```

Example 4 (unknown):
```unknown
doc/src/sgml$ make STYLE=website html
```

---


---

## J.5. Documentation Authoring #


**URL:** https://www.postgresql.org/docs/18/docguide-authoring.html

**Contents:**
- J.5. Documentation Authoring #
  - J.5.1. Emacs #

The documentation sources are most conveniently modified with an editor that has a mode for editing XML, and even more so if it has some awareness of XML schema languages so that it can know about DocBook syntax specifically.

Note that for historical reasons the documentation source files are named with an extension .sgml even though they are now XML files. So you might need to adjust your editor configuration to set the correct mode.

nXML Mode, which ships with Emacs, is the most common mode for editing XML documents with Emacs. It will allow you to use Emacs to insert tags and check markup consistency, and it supports DocBook out of the box. Check the nXML manual for detailed documentation.

src/tools/editors/emacs.samples contains recommended settings for this mode.

**Examples:**

Example 1 (unknown):
```unknown
src/tools/editors/emacs.samples
```

---


---

## J.6. Style Guide #


**URL:** https://www.postgresql.org/docs/18/docguide-style.html

**Contents:**
- J.6. Style Guide #
  - J.6.1. Reference Pages #

Reference pages should follow a standard layout. This allows users to find the desired information more quickly, and it also encourages writers to document all relevant aspects of a command. Consistency is not only desired among PostgreSQL reference pages, but also with reference pages provided by the operating system and other packages. Hence the following guidelines have been developed. They are for the most part consistent with similar guidelines established by various operating systems.

Reference pages that describe executable commands should contain the following sections, in this order. Sections that do not apply can be omitted. Additional top-level sections should only be used in special circumstances; often that information belongs in the “Usage” section.

This section is generated automatically. It contains the command name and a half-sentence summary of its functionality.

This section contains the syntax diagram of the command. The synopsis should normally not list each command-line option; that is done below. Instead, list the major components of the command line, such as where input and output files go.

Several paragraphs explaining what the command does.

A list describing each command-line option. If there are a lot of options, subsections can be used.

If the program uses 0 for success and non-zero for failure, then you do not need to document it. If there is a meaning behind the different non-zero exit codes, list them here.

Describe any sublanguage or run-time interface of the program. If the program is not interactive, this section can usually be omitted. Otherwise, this section is a catch-all for describing run-time features. Use subsections if appropriate.

List all environment variables that the program might use. Try to be complete; even seemingly trivial variables like SHELL might be of interest to the user.

List any files that the program might access implicitly. That is, do not list input and output files that were specified on the command line, but list configuration files, etc.

Explain any unusual output that the program might create. Refrain from listing every possible error message. This is a lot of work and has little use in practice. But if, say, the error messages have a standard format that the user can parse, this would be the place to explain it.

Anything that doesn't fit elsewhere, but in particular bugs, implementation flaws, security considerations, compatibility issues.

If there were some major milestones in the history of the program, they might be listed here. Usually, this section can be omitted.

Author (only used in the contrib section)

Cross-references, listed in the following order: other PostgreSQL command reference pages, PostgreSQL SQL command reference pages, citation of PostgreSQL manuals, other reference pages (e.g., operating system, other packages), other documentation. Items in the same group are listed alphabetically.

Reference pages describing SQL commands should contain the following sections: Name, Synopsis, Description, Parameters, Outputs, Notes, Examples, Compatibility, History, See Also. The Parameters section is like the Options section, but there is more freedom about which clauses of the command can be listed. The Outputs section is only needed if the command returns something other than a default command-completion tag. The Compatibility section should explain to what extent this command conforms to the SQL standard(s), or to which other database system it is compatible. The See Also section of SQL commands should list SQL commands before cross-references to programs.

---


---

