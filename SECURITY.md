# Security Policy

Metashot has a small surface area, but I take security seriously. This
tool is expected to interfece with BI platforms used by private
organizations ans we want that to be safe.

## Versioning policy

I follow semantic versioning for this application. Breaking changes will
result in incrementing the major version number. Breaking include:

- Backward incompatible changes to the API surface
- Backward incompatible changes to the behavior of the API

This will not include:

- Backward incompatible changes to deployment configuration (e.g. renaming
environment variables).


## Supported Versions

Given the nacent status of this project, only the most recent (major, minor)
version of this project will receive security fixes. I reserve the right to
revisit that if this project becomes more popular and I start seeing higher
friction for folks just moving up to latest.

## Reporting a Vulnerability

If you believe you have discovered a vulnerability in metashot, please
report it using GitHub's built in vulnerability disclosure feature which
can be found at https://github.com/farmdawgnation/metashot/security
