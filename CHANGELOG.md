# Changelog

## [0.2.0](https://github.com/UnstoppableMango/pulumi-components/compare/v0.1.3...v0.2.0) (2026-10-07)


### ⚠ BREAKING CHANGES

* **github:** callers that omitted requiredChecks to require nothing must now pass requiredChecks: [].

### Features

* **github:** require a `required` gate check by default ([#45](https://github.com/UnstoppableMango/pulumi-components/issues/45)) ([bf988df](https://github.com/UnstoppableMango/pulumi-components/commit/bf988dfbc7ddca935ca7f050f4cbcc491319ed75))

## [0.1.3](https://github.com/UnstoppableMango/pulumi-components/compare/v0.1.2...v0.1.3) (2026-10-06)


### Features

* **github:** disable CodeRabbit auto reviews on private repos ([#43](https://github.com/UnstoppableMango/pulumi-components/issues/43)) ([7976ea8](https://github.com/UnstoppableMango/pulumi-components/commit/7976ea8579bcc3e529770bda7ec37a33aaba7db7))

## [0.1.2](https://github.com/UnstoppableMango/pulumi-components/compare/v0.1.1...v0.1.2) (2026-09-28)


### Bug Fixes

* **renovate:** reference release-please preset by name ([#32](https://github.com/UnstoppableMango/pulumi-components/issues/32)) ([2fcf732](https://github.com/UnstoppableMango/pulumi-components/commit/2fcf73287eb757012a574ca0cbb4092a25feda8c)), closes [#31](https://github.com/UnstoppableMango/pulumi-components/issues/31)

## [0.1.1](https://github.com/UnstoppableMango/pulumi-components/compare/v0.1.0...v0.1.1) (2026-09-26)


### Features

* expose an archive option ([#9](https://github.com/UnstoppableMango/pulumi-components/issues/9)) ([7ede360](https://github.com/UnstoppableMango/pulumi-components/commit/7ede3603c08838e01c0ee6de9fb4011fff6a89f2))
* **github:** let PublicRepo adopt a repository it did not create ([#15](https://github.com/UnstoppableMango/pulumi-components/issues/15)) ([9420312](https://github.com/UnstoppableMango/pulumi-components/commit/9420312ed470bfe150c8bd8d717de287165b5964))
* gitlab resource variants + release workflow ([#11](https://github.com/UnstoppableMango/pulumi-components/issues/11)) ([ec51683](https://github.com/UnstoppableMango/pulumi-components/commit/ec51683a05f4129576d915389327b0f1740412f3))
* simpler provider packages ([#14](https://github.com/UnstoppableMango/pulumi-components/issues/14)) ([ba25072](https://github.com/UnstoppableMango/pulumi-components/commit/ba2507209818e2808665715d710a1d25ba9ef1f2))


### Bug Fixes

* exclude CHANGELOG.md from prettier formatting ([#13](https://github.com/UnstoppableMango/pulumi-components/issues/13)) ([acc345c](https://github.com/UnstoppableMango/pulumi-components/commit/acc345c9f8125b59efe51692d4a8a69b9f3435d5))
