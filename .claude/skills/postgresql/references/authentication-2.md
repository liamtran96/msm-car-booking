# PostgreSQL - Authentication (Part 2)

## 20.3. Authentication Methods #


**URL:** https://www.postgresql.org/docs/18/auth-methods.html

**Contents:**
- 20.3. Authentication Methods #

PostgreSQL provides various methods for authenticating users:

Trust authentication, which simply trusts that users are who they say they are.

Password authentication, which requires that users send a password.

GSSAPI authentication, which relies on a GSSAPI-compatible security library. Typically this is used to access an authentication server such as a Kerberos or Microsoft Active Directory server.

SSPI authentication, which uses a Windows-specific protocol similar to GSSAPI.

Ident authentication, which relies on an “Identification Protocol” (RFC 1413) service on the client's machine. (On local Unix-socket connections, this is treated as peer authentication.)

Peer authentication, which relies on operating system facilities to identify the process at the other end of a local connection. This is not supported for remote connections.

LDAP authentication, which relies on an LDAP authentication server.

RADIUS authentication, which relies on a RADIUS authentication server.

Certificate authentication, which requires an SSL connection and authenticates users by checking the SSL certificate they send.

PAM authentication, which relies on a PAM (Pluggable Authentication Modules) library.

BSD authentication, which relies on the BSD Authentication framework (currently available only on OpenBSD).

OAuth authorization/authentication, which relies on an external OAuth 2.0 identity provider.

Peer authentication is usually recommendable for local connections, though trust authentication might be sufficient in some circumstances. Password authentication is the easiest choice for remote connections. All the other options require some kind of external security infrastructure (usually an authentication server or a certificate authority for issuing SSL certificates), or are platform-specific.

The following sections describe each of these authentication methods in more detail.

---


---

## 20.2. User Name Maps #


**URL:** https://www.postgresql.org/docs/18/auth-username-maps.html

**Contents:**
- 20.2. User Name Maps #
  - Tip

When using an external authentication system such as Ident or GSSAPI, the name of the operating system user that initiated the connection might not be the same as the database user (role) that is to be used. In this case, a user name map can be applied to map the operating system user name to a database user. To use user name mapping, specify map=map-name in the options field in pg_hba.conf. This option is supported for all authentication methods that receive external user names. Since different mappings might be needed for different connections, the name of the map to be used is specified in the map-name parameter in pg_hba.conf to indicate which map to use for each individual connection.

User name maps are defined in the ident map file, which by default is named pg_ident.conf and is stored in the cluster's data directory. (It is possible to place the map file elsewhere, however; see the ident_file configuration parameter.) The ident map file contains lines of the general forms:

Comments, whitespace and line continuations are handled in the same way as in pg_hba.conf. The map-name is an arbitrary name that will be used to refer to this mapping in pg_hba.conf. The other two fields specify an operating system user name and a matching database user name. The same map-name can be used repeatedly to specify multiple user-mappings within a single map.

As for pg_hba.conf, the lines in this file can be include directives, following the same rules.

The pg_ident.conf file is read on start-up and when the main server process receives a SIGHUP signal. If you edit the file on an active system, you will need to signal the postmaster (using pg_ctl reload, calling the SQL function pg_reload_conf(), or using kill -HUP) to make it re-read the file.

The system view pg_ident_file_mappings can be helpful for pre-testing changes to the pg_ident.conf file, or for diagnosing problems if loading of the file did not have the desired effects. Rows in the view with non-null error fields indicate problems in the corresponding lines of the file.

There is no restriction regarding how many database users a given operating system user can correspond to, nor vice versa. Thus, entries in a map should be thought of as meaning “this operating system user is allowed to connect as this database user”, rather than implying that they are equivalent. The connection will be allowed if there is any map entry that pairs the user name obtained from the external authentication system with the database user name that the user has requested to connect as. The value all can be used as the database-username to specify that if the system-username matches, then this user is allowed to log in as any of the existing database users. Quoting all makes the keyword lose its special meaning.

If the database-username begins with a + character, then the operating system user can login as any user belonging to that role, similarly to how user names beginning with + are treated in pg_hba.conf. Thus, a + mark means “match any of the roles that are directly or indirectly members of this role”, while a name without a + mark matches only that specific role. Quoting a username starting with a + makes the + lose its special meaning.

If the system-username field starts with a slash (/), the remainder of the field is treated as a regular expression. (See Section 9.7.3.1 for details of PostgreSQL's regular expression syntax.) The regular expression can include a single capture, or parenthesized subexpression. The portion of the system user name that matched the capture can then be referenced in the database-username field as \1 (backslash-one). This allows the mapping of multiple user names in a single line, which is particularly useful for simple syntax substitutions. For example, these entries

will remove the domain part for users with system user names that end with @mydomain.com, and allow any user whose system name ends with @otherdomain.com to log in as guest. Quoting a database-username containing \1 does not make \1 lose its special meaning.

If the database-username field starts with a slash (/), the remainder of the field is treated as a regular expression. When the database-username field is a regular expression, it is not possible to use \1 within it to refer to a capture from the system-username field.

Keep in mind that by default, a regular expression can match just part of a string. It's usually wise to use ^ and $, as shown in the above example, to force the match to be to the entire system user name.

A pg_ident.conf file that could be used in conjunction with the pg_hba.conf file in Example 20.1 is shown in Example 20.2. In this example, anyone logged in to a machine on the 192.168 network that does not have the operating system user name bryanh, ann, or robert would not be granted access. Unix user robert would only be allowed access when he tries to connect as PostgreSQL user bob, not as robert or anyone else. ann would only be allowed to connect as ann. User bryanh would be allowed to connect as either bryanh or as guest1.

Example 20.2. An Example pg_ident.conf File

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
pg_ident.conf
```

Example 4 (unknown):
```unknown
system-username
```

---


---

## 20.13. PAM Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-pam.html

**Contents:**
- 20.13. PAM Authentication #
  - Note

This authentication method operates similarly to password except that it uses PAM (Pluggable Authentication Modules) as the authentication mechanism. The default PAM service name is postgresql. PAM is used only to validate user name/password pairs and optionally the connected remote host name or IP address. Therefore the user must already exist in the database before PAM can be used for authentication. For more information about PAM, please read the Linux-PAM Page.

The following configuration options are supported for PAM:

Determines whether the remote IP address or the host name is provided to PAM modules through the PAM_RHOST item. By default, the IP address is used. Set this option to 1 to use the resolved host name instead. Host name resolution can lead to login delays. (Most PAM configurations don't use this information, so it is only necessary to consider this setting if a PAM configuration was specifically created to make use of it.)

If PAM is set up to read /etc/shadow, authentication will fail because the PostgreSQL server is started by a non-root user. However, this is not an issue when PAM is configured to use LDAP or other authentication methods.

**Examples:**

Example 1 (unknown):
```unknown
pam_use_hostname
```

Example 2 (unknown):
```unknown
/etc/shadow
```

---


---

## 20.7. SSPI Authentication #


**URL:** https://www.postgresql.org/docs/18/sspi-auth.html

**Contents:**
- 20.7. SSPI Authentication #

SSPI is a Windows technology for secure authentication with single sign-on. PostgreSQL will use SSPI in negotiate mode, which will use Kerberos when possible and automatically fall back to NTLM in other cases. SSPI and GSSAPI interoperate as clients and servers, e.g., an SSPI client can authenticate to an GSSAPI server. It is recommended to use SSPI on Windows clients and servers and GSSAPI on non-Windows platforms.

When using Kerberos authentication, SSPI works the same way GSSAPI does; see Section 20.6 for details.

The following configuration options are supported for SSPI:

If set to 0, the realm name from the authenticated user principal is stripped off before being passed through the user name mapping (Section 20.2). This is discouraged and is primarily available for backwards compatibility, as it is not secure in multi-realm environments unless krb_realm is also used. It is recommended to leave include_realm set to the default (1) and to provide an explicit mapping in pg_ident.conf to convert principal names to PostgreSQL user names.

If set to 1, the domain's SAM-compatible name (also known as the NetBIOS name) is used for the include_realm option. This is the default. If set to 0, the true realm name from the Kerberos user principal name is used.

Do not disable this option unless your server runs under a domain account (this includes virtual service accounts on a domain member system) and all clients authenticating through SSPI are also using domain accounts, or authentication will fail.

If this option is enabled along with compat_realm, the user name from the Kerberos UPN is used for authentication. If it is disabled (the default), the SAM-compatible user name is used. By default, these two names are identical for new user accounts.

Note that libpq uses the SAM-compatible name if no explicit user name is specified. If you use libpq or a driver based on it, you should leave this option disabled or explicitly specify user name in the connection string.

Allows for mapping between system and database user names. See Section 20.2 for details. For an SSPI/Kerberos principal, such as username@EXAMPLE.COM (or, less commonly, username/hostbased@EXAMPLE.COM), the user name used for mapping is username@EXAMPLE.COM (or username/hostbased@EXAMPLE.COM, respectively), unless include_realm has been set to 0, in which case username (or username/hostbased) is what is seen as the system user name when mapping.

Sets the realm to match user principal names against. If this parameter is set, only users of that realm will be accepted. If it is not set, users of any realm can connect, subject to whatever user name mapping is done.

**Examples:**

Example 1 (unknown):
```unknown
include_realm
```

Example 2 (unknown):
```unknown
include_realm
```

Example 3 (unknown):
```unknown
pg_ident.conf
```

Example 4 (unknown):
```unknown
compat_realm
```

---


---

## Chapter 20. Client Authentication


**URL:** https://www.postgresql.org/docs/18/client-authentication.html

**Contents:**
- Chapter 20. Client Authentication
  - Note

When a client application connects to the database server, it specifies which PostgreSQL database user name it wants to connect as, much the same way one logs into a Unix computer as a particular user. Within the SQL environment the active database user name determines access privileges to database objects — see Chapter 21 for more information. Therefore, it is essential to restrict which database users can connect.

As explained in Chapter 21, PostgreSQL actually does privilege management in terms of “roles”. In this chapter, we consistently use database user to mean “role with the LOGIN privilege”.

Authentication is the process by which the database server establishes the identity of the client, and by extension determines whether the client application (or the user who runs the client application) is permitted to connect with the database user name that was requested.

PostgreSQL offers a number of different client authentication methods. The method used to authenticate a particular client connection can be selected on the basis of (client) host address, database, and user.

PostgreSQL database user names are logically separate from user names of the operating system in which the server runs. If all the users of a particular server also have accounts on the server's machine, it makes sense to assign database user names that match their operating system user names. However, a server that accepts remote connections might have many database users who have no local operating system account, and in such cases there need be no connection between database user names and OS user names.

**Examples:**

Example 1 (unknown):
```unknown
pg_hba.conf
```

Example 2 (unknown):
```unknown
pg_hba.conf
```

---


---

## 20.5. Password Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-password.html

**Contents:**
- 20.5. Password Authentication #
  - Warning

There are several password-based authentication methods. These methods operate similarly but differ in how the users' passwords are stored on the server and how the password provided by a client is sent across the connection.

The method scram-sha-256 performs SCRAM-SHA-256 authentication, as described in RFC 7677. It is a challenge-response scheme that prevents password sniffing on untrusted connections and supports storing passwords on the server in a cryptographically hashed form that is thought to be secure.

This is the most secure of the currently provided methods, but it is not supported by older client libraries.

The method md5 uses a custom less secure challenge-response mechanism. It prevents password sniffing and avoids storing passwords on the server in plain text but provides no protection if an attacker manages to steal the password hash from the server. Also, the MD5 hash algorithm is nowadays no longer considered secure against determined attacks.

To ease transition from the md5 method to the newer SCRAM method, if md5 is specified as a method in pg_hba.conf but the user's password on the server is encrypted for SCRAM (see below), then SCRAM-based authentication will automatically be chosen instead.

Support for MD5-encrypted passwords is deprecated and will be removed in a future release of PostgreSQL. Refer to the text below for details about migrating to another password type.

The method password sends the password in clear-text and is therefore vulnerable to password “sniffing” attacks. It should always be avoided if possible. If the connection is protected by SSL encryption then password can be used safely, though. (Though SSL certificate authentication might be a better choice if one is depending on using SSL).

PostgreSQL database passwords are separate from operating system user passwords. The password for each database user is stored in the pg_authid system catalog. Passwords can be managed with the SQL commands CREATE ROLE and ALTER ROLE, e.g., CREATE ROLE foo WITH LOGIN PASSWORD 'secret', or the psql command \password. If no password has been set up for a user, the stored password is null and password authentication will always fail for that user.

The availability of the different password-based authentication methods depends on how a user's password on the server is encrypted (or hashed, more accurately). This is controlled by the configuration parameter password_encryption at the time the password is set. If a password was encrypted using the scram-sha-256 setting, then it can be used for the authentication methods scram-sha-256 and password (but password transmission will be in plain text in the latter case). The authentication method specification md5 will automatically switch to using the scram-sha-256 method in this case, as explained above, so it will also work. If a password was encrypted using the md5 setting, then it can be used only for the md5 and password authentication method specifications (again, with the password transmitted in plain text in the latter case). (Previous PostgreSQL releases supported storing the password on the server in plain text. This is no longer possible.) To check the currently stored password hashes, see the system catalog pg_authid.

To upgrade an existing installation from md5 to scram-sha-256, after having ensured that all client libraries in use are new enough to support SCRAM, set password_encryption = 'scram-sha-256' in postgresql.conf, make all users set new passwords, and change the authentication method specifications in pg_hba.conf to scram-sha-256.

**Examples:**

Example 1 (unknown):
```unknown
scram-sha-256
```

Example 2 (unknown):
```unknown
scram-sha-256
```

Example 3 (unknown):
```unknown
pg_hba.conf
```

Example 4 (unknown):
```unknown
CREATE ROLE foo WITH LOGIN PASSWORD 'secret'
```

---


---

## 20.9. Peer Authentication #


**URL:** https://www.postgresql.org/docs/18/auth-peer.html

**Contents:**
- 20.9. Peer Authentication #

The peer authentication method works by obtaining the client's operating system user name from the kernel and using it as the allowed database user name (with optional user name mapping). This method is only supported on local connections.

The following configuration options are supported for peer:

Allows for mapping between system and database user names. See Section 20.2 for details.

Peer authentication is only available on operating systems providing the getpeereid() function, the SO_PEERCRED socket parameter, or similar mechanisms. Currently that includes Linux, most flavors of BSD including macOS, and Solaris.

**Examples:**

Example 1 (unknown):
```unknown
getpeereid()
```

Example 2 (unknown):
```unknown
SO_PEERCRED
```

---


---

