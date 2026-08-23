{
  description = "A Nix flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    systems.url = "github:nix-systems/triplet";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    pulumi2nix = {
      url = "github:UnstoppableMango/pulumi2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    pulumipkgs = {
      url = "github:unmango/pulumipkgs";
      inputs.flake-parts.follows = "flake-parts";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.pulumi2nix.follows = "pulumi2nix";
      inputs.systems.follows = "systems";
      inputs.treefmt-nix.follows = "treefmt-nix";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      imports = [
        inputs.treefmt-nix.flakeModule
        inputs.pulumi2nix.flakeModules.default
      ];

      perSystem =
        {
          config,
          pkgs,
          system,
          ...
        }:
        {
          # Plugin binaries come from unmango/pulumipkgs rather than nixpkgs:
          # a broader, registry-tracking package set built from source. The
          # overlay replaces nixpkgs' `pulumiPackages` scope outright, so
          # anything referenced under it has to exist there.
          _module.args.pkgs = import inputs.nixpkgs {
            inherit system;
            overlays = [ inputs.pulumipkgs.overlays.default ];
          };

          # Source-based, multi-language component provider built directly
          # from components/*.ts via pulumi2nix's componentPackages tree: no
          # compiled binary, schema extracted from source with
          # `pulumi package get-schema`. Schema extraction is still
          # npm-internal (unlike lib.sdkBuilders.yarnNodejs, which added
          # yarn classic support for SDK packaging), so
          # nix/schema/package-lock.json is a nix-build-only lockfile fed
          # to it, separate from this repo's real yarn.lock.
          pulumi.componentPackages.pulumi-components = {
            version = (pkgs.lib.importJSON ./package.json).version;
            src = ./.;
            schemaArgs = {
              languagePlugin = pkgs.pulumiPackages.pulumi-nodejs;
              lockFile = ./nix/schema/package-lock.json;
              npmDepsHash = "sha256-2jNcp02qgOV/d2jtbzVp5ycanGlp1YxSfNAQ7j2agDY=";
              # `pulumi package get-schema` runs the component's own source
              # to serve the GetSchema RPC, which resolves @pulumi/github at
              # module load and tries to fetch its resource plugin over the
              # network - not available inside the build sandbox.
              # providerPlugins seeds the plugin cache before get-schema runs
              # by copying `plugin`'s contents into
              # ~/.pulumi/plugins/resource-github-v<version>/, where pulumi
              # looks for `pulumi-resource-github` at the directory root -
              # hence `/bin` rather than the derivation root.
              providerPlugins = [
                {
                  name = "github";
                  version = "6.15.0";
                  plugin = "${pkgs.pulumiPackages.github}/bin";
                }
              ];
            };
            meta = {
              description = "Reusable Pulumi component resources";
              license = pkgs.lib.licenses.mit;
            };
          };

          packages.default = config.pulumi.packages.pulumi-components;

          devShells.default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              corepack
              gnumake
              nixfmt
              nodejs_24
              shellcheck
              yarn
            ];

            # Node.js bundled NSS certs lack GTS Root R4; registry.yarnpkg.com uses it
            # https://github.com/yarnpkg/yarn/issues/6578
            NODE_EXTRA_CA_CERTS = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";

            COREPACK = pkgs.corepack + "/bin/corepack";
            NIXFMT = pkgs.nixfmt + "/bin/nixfmt";
            NODE = pkgs.nodejs_24 + "/bin/node";
            YARN = pkgs.yarn + "/bin/yarn";
          };

          treefmt = {
            projectRootFile = "flake.nix";
            programs.nixfmt.enable = true;
            programs.prettier = {
              enable = true;
              includes = [
                "*.ts"
                "*.mjs"
                "*.json"
                "*.md"
              ];
              excludes = [
                "*-lock.json"
                "yarn.lock"
              ];
            };
          };
        };
    };
}
