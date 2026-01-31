# PostgreSQL - Authentication

## 20.8. Ident Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-ident.html

**Contents:**
- 20.8. Ident Authentication #
  - Note

The ident authentication method works by obtaining the client's operating system user name from an ident server and using it as the allowed database user name (with an optional user name mapping). This is only supported on TCP/IP connections.

When ident is specified for a local (non-TCP/IP) connection, peer authentication (see Section 20.9) will be used instead.

The following configuration options are supported for ident:

Allows for mapping between system and database user names. See Section 20.2 for details.

The “Identification Protocol” is described in RFC 1413. Virtually every Unix-like operating system ships with an ident server that listens on TCP port 113 by default. The basic functionality of an ident server is to answer questions like “What user initiated the connection that goes out of your port X and connects to my port Y?”. Since PostgreSQL knows both X and Y when a physical connection is established, it can interrogate the ident server on the host of the connecting client and can theoretically determine the operating system user for any given connection.

The drawback of this procedure is that it depends on the integrity of the client: if the client machine is untrusted or compromised, an attacker could run just about any program on port 113 and return any user name they choose. This authentication method is therefore only appropriate for closed networks where each client machine is under tight control and where the database and system administrators operate in close contact. In other words, you must trust the machine running the ident server. Heed the warning:

The Identification Protocol is not intended as an authorization or access control protocol.

Some ident servers have a nonstandard option that causes the returned user name to be encrypted, using a key that only the originating machine's administrator knows. This option must not be used when using the ident server with PostgreSQL, since PostgreSQL does not have any way to decrypt the returned string to determine the actual user name.

---


---

## 20.11. RADIUS Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-radius.html

**Contents:**
- 20.11. RADIUS Authentication #
  - Note

This authentication method operates similarly to password except that it uses RADIUS as the password verification method. RADIUS is used only to validate the user name/password pairs. Therefore the user must already exist in the database before RADIUS can be used for authentication.

When using RADIUS authentication, an Access Request message will be sent to the configured RADIUS server. This request will be of type Authenticate Only, and include parameters for user name, password (encrypted) and NAS Identifier. The request will be encrypted using a secret shared with the server. The RADIUS server will respond to this request with either Access Accept or Access Reject. There is no support for RADIUS accounting.

Multiple RADIUS servers can be specified, in which case they will be tried sequentially. If a negative response is received from a server, the authentication will fail. If no response is received, the next server in the list will be tried. To specify multiple servers, separate the server names with commas and surround the list with double quotes. If multiple servers are specified, the other RADIUS options can also be given as comma-separated lists, to provide individual values for each server. They can also be specified as a single value, in which case that value will apply to all servers.

The following configuration options are supported for RADIUS:

The DNS names or IP addresses of the RADIUS servers to connect to. This parameter is required.

The shared secrets used when talking securely to the RADIUS servers. This must have exactly the same value on the PostgreSQL and RADIUS servers. It is recommended that this be a string of at least 16 characters. This parameter is required.

The encryption vector used will only be cryptographically strong if PostgreSQL is built with support for OpenSSL. In other cases, the transmission to the RADIUS server should only be considered obfuscated, not secured, and external security measures should be applied if necessary.

The port numbers to connect to on the RADIUS servers. If no port is specified, the default RADIUS port (1812) will be used.

The strings to be used as NAS Identifier in the RADIUS requests. This parameter can be used, for example, to identify which database cluster the user is attempting to connect to, which can be useful for policy matching on the RADIUS server. If no identifier is specified, the default postgresql will be used.

If it is necessary to have a comma or whitespace in a RADIUS parameter value, that can be done by putting double quotes around the value, but it is tedious because two layers of double-quoting are now required. An example of putting whitespace into RADIUS secret strings is:

**Examples:**

Example 1 (unknown):
```unknown
Authenticate Only
```

Example 2 (unknown):
```unknown
NAS Identifier
```

Example 3 (unknown):
```unknown
Access Accept
```

Example 4 (unknown):
```unknown
Access Reject
```

---


---

## 20.10. LDAP Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-ldap.html

**Contents:**
- 20.10. LDAP Authentication #
  - Tip

This authentication method operates similarly to password except that it uses LDAP as the password verification method. LDAP is used only to validate the user name/password pairs. Therefore the user must already exist in the database before LDAP can be used for authentication.

LDAP authentication can operate in two modes. In the first mode, which we will call the simple bind mode, the server will bind to the distinguished name constructed as prefix username suffix. Typically, the prefix parameter is used to specify cn=, or DOMAIN\ in an Active Directory environment. suffix is used to specify the remaining part of the DN in a non-Active Directory environment.

In the second mode, which we will call the search+bind mode, the server first binds to the LDAP directory with a fixed user name and password, specified with ldapbinddn and ldapbindpasswd, and performs a search for the user trying to log in to the database. If no user and password is configured, an anonymous bind will be attempted to the directory. The search will be performed over the subtree at ldapbasedn, and will try to do an exact match of the attribute specified in ldapsearchattribute. Once the user has been found in this search, the server re-binds to the directory as this user, using the password specified by the client, to verify that the login is correct. This mode is the same as that used by LDAP authentication schemes in other software, such as Apache mod_authnz_ldap and pam_ldap. This method allows for significantly more flexibility in where the user objects are located in the directory, but will cause two additional requests to the LDAP server to be made.

The following configuration options are used in both modes:

Names or IP addresses of LDAP servers to connect to. Multiple servers may be specified, separated by spaces.

Port number on LDAP server to connect to. If no port is specified, the LDAP library's default port setting will be used.

Set to ldaps to use LDAPS. This is a non-standard way of using LDAP over SSL, supported by some LDAP server implementations. See also the ldaptls option for an alternative.

Set to 1 to make the connection between PostgreSQL and the LDAP server use TLS encryption. This uses the StartTLS operation per RFC 4513. See also the ldapscheme option for an alternative.

Note that using ldapscheme or ldaptls only encrypts the traffic between the PostgreSQL server and the LDAP server. The connection between the PostgreSQL server and the PostgreSQL client will still be unencrypted unless SSL is used there as well.

The following options are used in simple bind mode only:

String to prepend to the user name when forming the DN to bind as, when doing simple bind authentication.

String to append to the user name when forming the DN to bind as, when doing simple bind authentication.

The following options are used in search+bind mode only:

Root DN to begin the search for the user in, when doing search+bind authentication.

DN of user to bind to the directory with to perform the search when doing search+bind authentication.

Password for user to bind to the directory with to perform the search when doing search+bind authentication.

Attribute to match against the user name in the search when doing search+bind authentication. If no attribute is specified, the uid attribute will be used.

The search filter to use when doing search+bind authentication. Occurrences of $username will be replaced with the user name. This allows for more flexible search filters than ldapsearchattribute.

The following option may be used as an alternative way to write some of the above LDAP options in a more compact and standard form:

An RFC 4516 LDAP URL. The format is

scope must be one of base, one, sub, typically the last. (The default is base, which is normally not useful in this application.) attribute can nominate a single attribute, in which case it is used as a value for ldapsearchattribute. If attribute is empty then filter can be used as a value for ldapsearchfilter.

The URL scheme ldaps chooses the LDAPS method for making LDAP connections over SSL, equivalent to using ldapscheme=ldaps. To use encrypted LDAP connections using the StartTLS operation, use the normal URL scheme ldap and specify the ldaptls option in addition to ldapurl.

For non-anonymous binds, ldapbinddn and ldapbindpasswd must be specified as separate options.

LDAP URLs are currently only supported with OpenLDAP, not on Windows.

It is an error to mix configuration options for simple bind with options for search+bind. To use ldapurl in simple bind mode, the URL must not contain a basedn or query elements.

When using search+bind mode, the search can be performed using a single attribute specified with ldapsearchattribute, or using a custom search filter specified with ldapsearchfilter. Specifying ldapsearchattribute=foo is equivalent to specifying ldapsearchfilter="(foo=$username)". If neither option is specified the default is ldapsearchattribute=uid.

If PostgreSQL was compiled with OpenLDAP as the LDAP client library, the ldapserver setting may be omitted. In that case, a list of host names and ports is looked up via RFC 2782 DNS SRV records. The name _ldap._tcp.DOMAIN is looked up, where DOMAIN is extracted from ldapbasedn.

Here is an example for a simple-bind LDAP configuration:

When a connection to the database server as database user someuser is requested, PostgreSQL will attempt to bind to the LDAP server using the DN cn=someuser, dc=example, dc=net and the password provided by the client. If that connection succeeds, the database access is granted.

Here is a different simple-bind configuration, which uses the LDAPS scheme and a custom port number, written as a URL:

This is slightly more compact than specifying ldapserver, ldapscheme, and ldapport separately.

Here is an example for a search+bind configuration:

When a connection to the database server as database user someuser is requested, PostgreSQL will attempt to bind anonymously (since ldapbinddn was not specified) to the LDAP server, perform a search for (uid=someuser) under the specified base DN. If an entry is found, it will then attempt to bind using that found information and the password supplied by the client. If that second bind succeeds, the database access is granted.

Here is the same search+bind configuration written as a URL:

Some other software that supports authentication against LDAP uses the same URL format, so it will be easier to share the configuration.

Here is an example for a search+bind configuration that uses ldapsearchfilter instead of ldapsearchattribute to allow authentication by user ID or email address:

Here is an example for a search+bind configuration that uses DNS SRV discovery to find the host name(s) and port(s) for the LDAP service for the domain name example.net:

Since LDAP often uses commas and spaces to separate the different parts of a DN, it is often necessary to use double-quoted parameter values when configuring LDAP options, as shown in the examples.

**Examples:**

Example 1 (unknown):
```unknown
ldapbindpasswd
```

Example 2 (unknown):
```unknown
ldapsearchattribute
```

Example 3 (unknown):
```unknown
mod_authnz_ldap
```

Example 4 (unknown):
```unknown
ldapbindpasswd
```

---


---

## 20.4. Trust Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-trust.html

**Contents:**
- 20.4. Trust Authentication #

When trust authentication is specified, PostgreSQL assumes that anyone who can connect to the server is authorized to access the database with whatever database user name they specify (even superuser names). Of course, restrictions made in the database and user columns still apply. This method should only be used when there is adequate operating-system-level protection on connections to the server.

trust authentication is appropriate and very convenient for local connections on a single-user workstation. It is usually not appropriate by itself on a multiuser machine. However, you might be able to use trust even on a multiuser machine, if you restrict access to the server's Unix-domain socket file using file-system permissions. To do this, set the unix_socket_permissions (and possibly unix_socket_group) configuration parameters as described in Section 19.3. Or you could set the unix_socket_directories configuration parameter to place the socket file in a suitably restricted directory.

Setting file-system permissions only helps for Unix-socket connections. Local TCP/IP connections are not restricted by file-system permissions. Therefore, if you want to use file-system permissions for local security, remove the host ... 127.0.0.1 ... line from pg_hba.conf, or change it to a non-trust authentication method.

trust authentication is only suitable for TCP/IP connections if you trust every user on every machine that is allowed to connect to the server by the pg_hba.conf lines that specify trust. It is seldom reasonable to use trust for any TCP/IP connections other than those from localhost (127.0.0.1).

**Examples:**

Example 1 (unknown):
```unknown
unix_socket_permissions
```

Example 2 (unknown):
```unknown
unix_socket_group
```

Example 3 (unknown):
```unknown
unix_socket_directories
```

Example 4 (unknown):
```unknown
host ... 127.0.0.1 ...
```

---


---

## 20.14. BSD Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-bsd.html

**Contents:**
- 20.14. BSD Authentication #
  - Note

This authentication method operates similarly to password except that it uses BSD Authentication to verify the password. BSD Authentication is used only to validate user name/password pairs. Therefore the user's role must already exist in the database before BSD Authentication can be used for authentication. The BSD Authentication framework is currently only available on OpenBSD.

BSD Authentication in PostgreSQL uses the auth-postgresql login type and authenticates with the postgresql login class if that's defined in login.conf. By default that login class does not exist, and PostgreSQL will use the default login class.

To use BSD Authentication, the PostgreSQL user account (that is, the operating system user running the server) must first be added to the auth group. The auth group exists by default on OpenBSD systems.

**Examples:**

Example 1 (unknown):
```unknown
auth-postgresql
```

---


---

## 20.6. GSSAPI Authentication #


**URL:** https://www.postgresql.org/docs/18/gssapi-auth.html

**Contents:**
- 20.6. GSSAPI Authentication #

GSSAPI is an industry-standard protocol for secure authentication defined in RFC 2743. PostgreSQL supports GSSAPI for authentication, communications encryption, or both. GSSAPI provides automatic authentication (single sign-on) for systems that support it. The authentication itself is secure. If GSSAPI encryption or SSL encryption is used, the data sent along the database connection will be encrypted; otherwise, it will not.

GSSAPI support has to be enabled when PostgreSQL is built; see Chapter 17 for more information.

When GSSAPI uses Kerberos, it uses a standard service principal (authentication identity) name in the format servicename/hostname@realm. The principal name used by a particular installation is not encoded in the PostgreSQL server in any way; rather it is specified in the keytab file that the server reads to determine its identity. If multiple principals are listed in the keytab file, the server will accept any one of them. The server's realm name is the preferred realm specified in the Kerberos configuration file(s) accessible to the server.

When connecting, the client must know the principal name of the server it intends to connect to. The servicename part of the principal is ordinarily postgres, but another value can be selected via libpq's krbsrvname connection parameter. The hostname part is the fully qualified host name that libpq is told to connect to. The realm name is the preferred realm specified in the Kerberos configuration file(s) accessible to the client.

The client will also have a principal name for its own identity (and it must have a valid ticket for this principal). To use GSSAPI for authentication, the client principal must be associated with a PostgreSQL database user name. The pg_ident.conf configuration file can be used to map principals to user names; for example, pgusername@realm could be mapped to just pgusername. Alternatively, you can use the full username@realm principal as the role name in PostgreSQL without any mapping.

PostgreSQL also supports mapping client principals to user names by just stripping the realm from the principal. This method is supported for backwards compatibility and is strongly discouraged as it is then impossible to distinguish different users with the same user name but coming from different realms. To enable this, set include_realm to 0. For simple single-realm installations, doing that combined with setting the krb_realm parameter (which checks that the principal's realm matches exactly what is in the krb_realm parameter) is still secure; but this is a less capable approach compared to specifying an explicit mapping in pg_ident.conf.

The location of the server's keytab file is specified by the krb_server_keyfile configuration parameter. For security reasons, it is recommended to use a separate keytab just for the PostgreSQL server rather than allowing the server to read the system keytab file. Make sure that your server keytab file is readable (and preferably only readable, not writable) by the PostgreSQL server account. (See also Section 18.1.)

The keytab file is generated using the Kerberos software; see the Kerberos documentation for details. The following example shows doing this using the kadmin tool of MIT Kerberos:

The following authentication options are supported for the GSSAPI authentication method:

If set to 0, the realm name from the authenticated user principal is stripped off before being passed through the user name mapping (Section 20.2). This is discouraged and is primarily available for backwards compatibility, as it is not secure in multi-realm environments unless krb_realm is also used. It is recommended to leave include_realm set to the default (1) and to provide an explicit mapping in pg_ident.conf to convert principal names to PostgreSQL user names.

Allows mapping from client principals to database user names. See Section 20.2 for details. For a GSSAPI/Kerberos principal, such as username@EXAMPLE.COM (or, less commonly, username/hostbased@EXAMPLE.COM), the user name used for mapping is username@EXAMPLE.COM (or username/hostbased@EXAMPLE.COM, respectively), unless include_realm has been set to 0, in which case username (or username/hostbased) is what is seen as the system user name when mapping.

Sets the realm to match user principal names against. If this parameter is set, only users of that realm will be accepted. If it is not set, users of any realm can connect, subject to whatever user name mapping is done.

In addition to these settings, which can be different for different pg_hba.conf entries, there is the server-wide krb_caseins_users configuration parameter. If that is set to true, client principals are matched to user map entries case-insensitively. krb_realm, if set, is also matched case-insensitively.

**Examples:**

Example 1 (python):
```python
servicename/hostname@realm
```

Example 2 (unknown):
```unknown
servicename
```

Example 3 (unknown):
```unknown
servicename
```

Example 4 (unknown):
```unknown
pg_ident.conf
```

---


---

## 20.16. Authentication Problems #


**URL:** https://www.postgresql.org/docs/18/client-authentication-problems.html

**Contents:**
- 20.16. Authentication Problems #
  - Tip

Authentication failures and related problems generally manifest themselves through error messages like the following:

This is what you are most likely to get if you succeed in contacting the server, but it does not want to talk to you. As the message suggests, the server refused the connection request because it found no matching entry in its pg_hba.conf configuration file.

Messages like this indicate that you contacted the server, and it is willing to talk to you, but not until you pass the authorization method specified in the pg_hba.conf file. Check the password you are providing, or check your Kerberos or ident software if the complaint mentions one of those authentication types.

The indicated database user name was not found.

The database you are trying to connect to does not exist. Note that if you do not specify a database name, it defaults to the database user name.

The server log might contain more information about an authentication failure than is reported to the client. If you are confused about the reason for a failure, check the server log.

**Examples:**

Example 1 (yaml):
```yaml
FATAL:  no pg_hba.conf entry for host "123.123.123.123", user "andym", database "testdb"
```

Example 2 (unknown):
```unknown
pg_hba.conf
```

Example 3 (yaml):
```yaml
FATAL:  password authentication failed for user "andym"
```

Example 4 (unknown):
```unknown
pg_hba.conf
```

---


---

