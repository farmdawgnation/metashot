# Changelog

## [1.6.0](https://github.com/farmdawgnation/metashot/compare/v1.5.1...v1.6.0) (2025-08-09)


### Features

* **auth:** add Basic auth (password=AUTH_TOKEN) ([#43](https://github.com/farmdawgnation/metashot/issues/43)) ([1ae3f64](https://github.com/farmdawgnation/metashot/commit/1ae3f64185e8c2a352776280b10bda98edabdf5f))
* improve Metabase chart rendering wait conditions ([#40](https://github.com/farmdawgnation/metashot/issues/40)) ([752028f](https://github.com/farmdawgnation/metashot/commit/752028f65d5f8fe26894b07d75d3fecadebf425e))

## [1.5.1](https://github.com/farmdawgnation/metashot/compare/v1.5.0...v1.5.1) (2025-07-19)


### Bug Fixes

* skip logging for metrics and health checks ([13418a1](https://github.com/farmdawgnation/metashot/commit/13418a13ef0a4d2d265dd047e0b13f3c43123f57))

## [1.5.0](https://github.com/farmdawgnation/metashot/compare/v1.4.0...v1.5.0) (2025-07-19)


### Features

* add Docker containerization with multi-stage build ([b5aa566](https://github.com/farmdawgnation/metashot/commit/b5aa5667abe19d29150ce338b646556480abe42f))
* add GitHub Actions CI/CD workflows ([86a5b98](https://github.com/farmdawgnation/metashot/commit/86a5b98bb5cfe3d891bcc0d05a23eaad38e5a7da))
* add Helm chart for Kubernetes deployment ([988ea72](https://github.com/farmdawgnation/metashot/commit/988ea7216016741a7983f117935f450ac27d64f1))
* add optional Bearer token authentication ([ce5bf55](https://github.com/farmdawgnation/metashot/commit/ce5bf55444fa3230d750b615baa9a48d654f5b8f))
* add structured JSON logging with pino ([e800f39](https://github.com/farmdawgnation/metashot/commit/e800f3975a97c403d0dc7ce7df3fba556ed66cc8))
* add support for Metabase parameters in screenshot API ([12a95b3](https://github.com/farmdawgnation/metashot/commit/12a95b3464051feb79093bed8aa279557fc68375))
* **ci:** configure release-please to auto-update helm chart versions ([0c79035](https://github.com/farmdawgnation/metashot/commit/0c79035ea2e5ad54c659b838e5d14b55c849fdde))
* enhance publish workflows with conditional triggers ([9e65685](https://github.com/farmdawgnation/metashot/commit/9e6568517b849b0f418cd68dedf88651103ff540))
* implement comprehensive observability with Prometheus metrics and OpenTelemetry tracing ([e46736a](https://github.com/farmdawgnation/metashot/commit/e46736ad996fdfd5ebb66e47f85c47f02a9ffba2))
* initial metashot application implementation ([8bcebee](https://github.com/farmdawgnation/metashot/commit/8bcebeeff3edf1c29fbac3309414a707e1b29dab))
* iterate on implementation ([06a73e3](https://github.com/farmdawgnation/metashot/commit/06a73e332b429796baefe75b3b25bc5df30e5e9c))
* report package information from package.json ([c9f3136](https://github.com/farmdawgnation/metashot/commit/c9f3136d85d6f9384b1f847dc8b833d3e0de548c))
* request logging support ([49f25ba](https://github.com/farmdawgnation/metashot/commit/49f25badda58480324652300ec59a2920af3c41b))
* **storage:** configure storage to default to AWS S3 ([#14](https://github.com/farmdawgnation/metashot/issues/14)) ([2e58e96](https://github.com/farmdawgnation/metashot/commit/2e58e964d08dcccc90ece6f5c5e6e700ec7c8e8b))
* update Express from 4.x to 5.1.0 ([#28](https://github.com/farmdawgnation/metashot/issues/28)) ([1bc75d7](https://github.com/farmdawgnation/metashot/commit/1bc75d7d176c067126592d8c2592e2d392191f84))
* update tests for new api changes ([bfd44de](https://github.com/farmdawgnation/metashot/commit/bfd44de4e80d04a7c51a34f786f6949fcbade5dd))
* upgrade to awssdkv3 ([3d626d1](https://github.com/farmdawgnation/metashot/commit/3d626d11613f673b32dd8de4c1691d5ff952bbaf))


### Bug Fixes

* Add missing issues permission to release-please workflow ([#2](https://github.com/farmdawgnation/metashot/issues/2)) ([8bcb9d6](https://github.com/farmdawgnation/metashot/commit/8bcb9d61f763e31150d08931acd0a29d466fd5b2))
* add missing license ([b54c840](https://github.com/farmdawgnation/metashot/commit/b54c840d9bbd2cf887b50414257e358b4cfc2d73))
* attempt at fixing release process ([dbf22a7](https://github.com/farmdawgnation/metashot/commit/dbf22a77e23ae6160d2f417f4945fea999bd9b75))
* bump release manifest version ([8861670](https://github.com/farmdawgnation/metashot/commit/88616703905486ac595b8e4a735f80d64c1de5ef))
* checkout before ci run ([4242409](https://github.com/farmdawgnation/metashot/commit/4242409adee62fad4227e5ae25821bf6605e242f))
* checkout before invoking gh ([656a049](https://github.com/farmdawgnation/metashot/commit/656a04942ab532023886911ccd31f8c49dbd7bfb))
* clean up publish jobs ([e172502](https://github.com/farmdawgnation/metashot/commit/e172502dc9523b35d868409c5a410fecc188804d))
* correct selector for different viz types ([70df513](https://github.com/farmdawgnation/metashot/commit/70df5133a2a5c060c93fcd3877a9da9f8ac7bdd3))
* **dependabot:** githubs own model bullshit me ([78215f4](https://github.com/farmdawgnation/metashot/commit/78215f404f9150764a30bd8f52437806cd79773d))
* handle missing Metabase secret key and Playwright browser installation ([#3](https://github.com/farmdawgnation/metashot/issues/3)) ([89e3f37](https://github.com/farmdawgnation/metashot/commit/89e3f3783372574c8963c419b9508bbb8630eaca))
* **helm:** correct various issues in chart ([0dfeeb2](https://github.com/farmdawgnation/metashot/commit/0dfeeb27a3b35d5acc14ed7f578fac0a96aaeb2e))
* **helm:** fix probe definitions ([224a064](https://github.com/farmdawgnation/metashot/commit/224a06479cf5bdcc69b8bc3238c775a97e8fa06e))
* i think this will fix the release process ([ed5f4ad](https://github.com/farmdawgnation/metashot/commit/ed5f4ade0da7fc2a8984fba17e3af59521aa669a))
* let's try this combination of code for cicd ([5f774a2](https://github.com/farmdawgnation/metashot/commit/5f774a275ffcd2890ef49f50416b77ee4db6e801))
* ordering of publish helm job was wrong ([1398cde](https://github.com/farmdawgnation/metashot/commit/1398cde9e1541bd773265fe29401b2fa96daa290))
* resolve workflow_run trigger issues in publish workflows ([5b9c103](https://github.com/farmdawgnation/metashot/commit/5b9c10333bea8d6e89887876bb67d628661fb5c4))
* roll that back I guess ([350321b](https://github.com/farmdawgnation/metashot/commit/350321b66a13b389a47b064bdab82cb0ba4dd3a8))
* set fetch depth so tags are retrieved ([0457f3d](https://github.com/farmdawgnation/metashot/commit/0457f3de8141ab2b9ec1145bf7fcdfebea0dedf5))
* switching to oci publishing ([a88a522](https://github.com/farmdawgnation/metashot/commit/a88a5224a92bb0ccbb4b65cdfbce8a449313710a))
* try empty component in manifest ([6e398db](https://github.com/farmdawgnation/metashot/commit/6e398db4eb6de0ae74b10ccaebe3abd3f0174644))

## [1.4.0](https://github.com/farmdawgnation/metashot/compare/metashot-v1.3.0...metashot-v1.4.0) (2025-07-18)


### Features

* add structured JSON logging with pino ([e800f39](https://github.com/farmdawgnation/metashot/commit/e800f3975a97c403d0dc7ce7df3fba556ed66cc8))
* add support for Metabase parameters in screenshot API ([12a95b3](https://github.com/farmdawgnation/metashot/commit/12a95b3464051feb79093bed8aa279557fc68375))
* implement comprehensive observability with Prometheus metrics and OpenTelemetry tracing ([e46736a](https://github.com/farmdawgnation/metashot/commit/e46736ad996fdfd5ebb66e47f85c47f02a9ffba2))
* report package information from package.json ([c9f3136](https://github.com/farmdawgnation/metashot/commit/c9f3136d85d6f9384b1f847dc8b833d3e0de548c))
* request logging support ([49f25ba](https://github.com/farmdawgnation/metashot/commit/49f25badda58480324652300ec59a2920af3c41b))
* update Express from 4.x to 5.1.0 ([#28](https://github.com/farmdawgnation/metashot/issues/28)) ([1bc75d7](https://github.com/farmdawgnation/metashot/commit/1bc75d7d176c067126592d8c2592e2d392191f84))
* upgrade to awssdkv3 ([3d626d1](https://github.com/farmdawgnation/metashot/commit/3d626d11613f673b32dd8de4c1691d5ff952bbaf))


### Bug Fixes

* correct selector for different viz types ([70df513](https://github.com/farmdawgnation/metashot/commit/70df5133a2a5c060c93fcd3877a9da9f8ac7bdd3))
* **dependabot:** githubs own model bullshit me ([78215f4](https://github.com/farmdawgnation/metashot/commit/78215f404f9150764a30bd8f52437806cd79773d))

## [1.3.0](https://github.com/farmdawgnation/metashot/compare/metashot-v1.2.2...metashot-v1.3.0) (2025-07-12)


### Features

* add Docker containerization with multi-stage build ([b5aa566](https://github.com/farmdawgnation/metashot/commit/b5aa5667abe19d29150ce338b646556480abe42f))
* add GitHub Actions CI/CD workflows ([86a5b98](https://github.com/farmdawgnation/metashot/commit/86a5b98bb5cfe3d891bcc0d05a23eaad38e5a7da))
* add Helm chart for Kubernetes deployment ([988ea72](https://github.com/farmdawgnation/metashot/commit/988ea7216016741a7983f117935f450ac27d64f1))
* add optional Bearer token authentication ([ce5bf55](https://github.com/farmdawgnation/metashot/commit/ce5bf55444fa3230d750b615baa9a48d654f5b8f))
* **ci:** configure release-please to auto-update helm chart versions ([0c79035](https://github.com/farmdawgnation/metashot/commit/0c79035ea2e5ad54c659b838e5d14b55c849fdde))
* enhance publish workflows with conditional triggers ([9e65685](https://github.com/farmdawgnation/metashot/commit/9e6568517b849b0f418cd68dedf88651103ff540))
* initial metashot application implementation ([8bcebee](https://github.com/farmdawgnation/metashot/commit/8bcebeeff3edf1c29fbac3309414a707e1b29dab))
* iterate on implementation ([06a73e3](https://github.com/farmdawgnation/metashot/commit/06a73e332b429796baefe75b3b25bc5df30e5e9c))
* **storage:** configure storage to default to AWS S3 ([#14](https://github.com/farmdawgnation/metashot/issues/14)) ([2e58e96](https://github.com/farmdawgnation/metashot/commit/2e58e964d08dcccc90ece6f5c5e6e700ec7c8e8b))
* update tests for new api changes ([bfd44de](https://github.com/farmdawgnation/metashot/commit/bfd44de4e80d04a7c51a34f786f6949fcbade5dd))


### Bug Fixes

* Add missing issues permission to release-please workflow ([#2](https://github.com/farmdawgnation/metashot/issues/2)) ([8bcb9d6](https://github.com/farmdawgnation/metashot/commit/8bcb9d61f763e31150d08931acd0a29d466fd5b2))
* add missing license ([b54c840](https://github.com/farmdawgnation/metashot/commit/b54c840d9bbd2cf887b50414257e358b4cfc2d73))
* checkout before ci run ([4242409](https://github.com/farmdawgnation/metashot/commit/4242409adee62fad4227e5ae25821bf6605e242f))
* checkout before invoking gh ([656a049](https://github.com/farmdawgnation/metashot/commit/656a04942ab532023886911ccd31f8c49dbd7bfb))
* clean up publish jobs ([e172502](https://github.com/farmdawgnation/metashot/commit/e172502dc9523b35d868409c5a410fecc188804d))
* handle missing Metabase secret key and Playwright browser installation ([#3](https://github.com/farmdawgnation/metashot/issues/3)) ([89e3f37](https://github.com/farmdawgnation/metashot/commit/89e3f3783372574c8963c419b9508bbb8630eaca))
* **helm:** correct various issues in chart ([0dfeeb2](https://github.com/farmdawgnation/metashot/commit/0dfeeb27a3b35d5acc14ed7f578fac0a96aaeb2e))
* **helm:** fix probe definitions ([224a064](https://github.com/farmdawgnation/metashot/commit/224a06479cf5bdcc69b8bc3238c775a97e8fa06e))
* let's try this combination of code for cicd ([5f774a2](https://github.com/farmdawgnation/metashot/commit/5f774a275ffcd2890ef49f50416b77ee4db6e801))
* ordering of publish helm job was wrong ([1398cde](https://github.com/farmdawgnation/metashot/commit/1398cde9e1541bd773265fe29401b2fa96daa290))
* resolve workflow_run trigger issues in publish workflows ([5b9c103](https://github.com/farmdawgnation/metashot/commit/5b9c10333bea8d6e89887876bb67d628661fb5c4))
* roll that back I guess ([350321b](https://github.com/farmdawgnation/metashot/commit/350321b66a13b389a47b064bdab82cb0ba4dd3a8))
* set fetch depth so tags are retrieved ([0457f3d](https://github.com/farmdawgnation/metashot/commit/0457f3de8141ab2b9ec1145bf7fcdfebea0dedf5))
* switching to oci publishing ([a88a522](https://github.com/farmdawgnation/metashot/commit/a88a5224a92bb0ccbb4b65cdfbce8a449313710a))

## [1.2.2](https://github.com/farmdawgnation/metashot/compare/v1.2.1...v1.2.2) (2025-07-08)


### Bug Fixes

* **helm:** correct various issues in chart ([0dfeeb2](https://github.com/farmdawgnation/metashot/commit/0dfeeb27a3b35d5acc14ed7f578fac0a96aaeb2e))

## [1.2.1](https://github.com/farmdawgnation/metashot/compare/v1.2.0...v1.2.1) (2025-07-08)


### Bug Fixes

* **helm:** fix probe definitions ([224a064](https://github.com/farmdawgnation/metashot/commit/224a06479cf5bdcc69b8bc3238c775a97e8fa06e))

## [1.2.0](https://github.com/farmdawgnation/metashot/compare/v1.1.2...v1.2.0) (2025-07-07)


### Features

* **storage:** configure storage to default to AWS S3 ([#14](https://github.com/farmdawgnation/metashot/issues/14)) ([2e58e96](https://github.com/farmdawgnation/metashot/commit/2e58e964d08dcccc90ece6f5c5e6e700ec7c8e8b))

## [1.1.2](https://github.com/farmdawgnation/metashot/compare/v1.1.1...v1.1.2) (2025-07-07)


### Bug Fixes

* let's try this combination of code for cicd ([5f774a2](https://github.com/farmdawgnation/metashot/commit/5f774a275ffcd2890ef49f50416b77ee4db6e801))
* resolve workflow_run trigger issues in publish workflows ([5b9c103](https://github.com/farmdawgnation/metashot/commit/5b9c10333bea8d6e89887876bb67d628661fb5c4))
* set fetch depth so tags are retrieved ([0457f3d](https://github.com/farmdawgnation/metashot/commit/0457f3de8141ab2b9ec1145bf7fcdfebea0dedf5))

## [1.1.1](https://github.com/farmdawgnation/metashot/compare/v1.1.0...v1.1.1) (2025-07-06)


### Bug Fixes

* add missing license ([b54c840](https://github.com/farmdawgnation/metashot/commit/b54c840d9bbd2cf887b50414257e358b4cfc2d73))
* checkout before ci run ([4242409](https://github.com/farmdawgnation/metashot/commit/4242409adee62fad4227e5ae25821bf6605e242f))
* checkout before invoking gh ([656a049](https://github.com/farmdawgnation/metashot/commit/656a04942ab532023886911ccd31f8c49dbd7bfb))
* clean up publish jobs ([e172502](https://github.com/farmdawgnation/metashot/commit/e172502dc9523b35d868409c5a410fecc188804d))
* ordering of publish helm job was wrong ([1398cde](https://github.com/farmdawgnation/metashot/commit/1398cde9e1541bd773265fe29401b2fa96daa290))
* roll that back I guess ([350321b](https://github.com/farmdawgnation/metashot/commit/350321b66a13b389a47b064bdab82cb0ba4dd3a8))
* switching to oci publishing ([a88a522](https://github.com/farmdawgnation/metashot/commit/a88a5224a92bb0ccbb4b65cdfbce8a449313710a))

## [1.1.0](https://github.com/farmdawgnation/metashot/compare/v1.0.0...v1.1.0) (2025-07-06)


### Features

* enhance publish workflows with conditional triggers ([9e65685](https://github.com/farmdawgnation/metashot/commit/9e6568517b849b0f418cd68dedf88651103ff540))

## 1.0.0 (2025-07-06)


### Features

* add Docker containerization with multi-stage build ([b5aa566](https://github.com/farmdawgnation/metashot/commit/b5aa5667abe19d29150ce338b646556480abe42f))
* add GitHub Actions CI/CD workflows ([86a5b98](https://github.com/farmdawgnation/metashot/commit/86a5b98bb5cfe3d891bcc0d05a23eaad38e5a7da))
* add Helm chart for Kubernetes deployment ([988ea72](https://github.com/farmdawgnation/metashot/commit/988ea7216016741a7983f117935f450ac27d64f1))
* add optional Bearer token authentication ([ce5bf55](https://github.com/farmdawgnation/metashot/commit/ce5bf55444fa3230d750b615baa9a48d654f5b8f))
* initial metashot application implementation ([8bcebee](https://github.com/farmdawgnation/metashot/commit/8bcebeeff3edf1c29fbac3309414a707e1b29dab))
* iterate on implementation ([06a73e3](https://github.com/farmdawgnation/metashot/commit/06a73e332b429796baefe75b3b25bc5df30e5e9c))
* update tests for new api changes ([bfd44de](https://github.com/farmdawgnation/metashot/commit/bfd44de4e80d04a7c51a34f786f6949fcbade5dd))


### Bug Fixes

* Add missing issues permission to release-please workflow ([#2](https://github.com/farmdawgnation/metashot/issues/2)) ([8bcb9d6](https://github.com/farmdawgnation/metashot/commit/8bcb9d61f763e31150d08931acd0a29d466fd5b2))
* handle missing Metabase secret key and Playwright browser installation ([#3](https://github.com/farmdawgnation/metashot/issues/3)) ([89e3f37](https://github.com/farmdawgnation/metashot/commit/89e3f3783372574c8963c419b9508bbb8630eaca))
