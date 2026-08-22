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
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem =
        { pkgs, ... }:
        let
          # `pulumi package get-schema` runs the component's own source to
          # serve the GetSchema RPC, which resolves @pulumi/github at
          # module load and tries to fetch its resource plugin over the
          # network - not available inside the build sandbox. Pre-fetch it
          # as a fixed-output derivation (network allowed there) and drop
          # it into the plugin cache dir ourselves instead.
          pulumiResourceGithubPlugin = pkgs.runCommand "pulumi-resource-github-6.15.0" { } ''
            mkdir -p $out
            tar -xzf ${
              pkgs.fetchurl {
                url = "https://get.pulumi.com/releases/plugins/pulumi-resource-github-v6.15.0-linux-amd64.tar.gz";
                sha256 = "0zzfkgis3kda2yvx1asx9nz3dr5f708761pcl1kyapkwmcrrijaj";
              }
            } -C $out
            chmod +x $out/pulumi-resource-github
          '';
        in
        {
          # Source-based, multi-language component provider built directly
          # from components/*.ts via pulumi2nix's mkComponentPackage: no
          # compiled binary, schema extracted from source with
          # `pulumi package get-schema`. Schema extraction is still
          # npm-internal (unlike lib.sdkBuilders.yarnNodejs, which added
          # yarn classic support for SDK packaging), so
          # nix/schema/package-lock.json is a nix-build-only lockfile fed
          # to it, separate from this repo's real yarn.lock.
          packages.provider = inputs.pulumi2nix.lib.mkComponentPackage { inherit pkgs; } {
            pname = "pulumi-components";
            version = (pkgs.lib.importJSON ./package.json).version;
            src = ./.;
            schema = {
              languagePlugin = pkgs.pulumiPackages.pulumi-nodejs;
              lockFile = ./nix/schema/package-lock.json;
              npmDepsHash = "sha256-2jNcp02qgOV/d2jtbzVp5ycanGlp1YxSfNAQ7j2agDY=";
              # mk-component-schema.nix's own postPatch copies lockFile in
              # read-only (as it comes from the nix store); `pulumi package
              # get-schema` runs `npm install` internally, which needs to
              # rewrite package-lock.json and fails with EACCES otherwise.
              # Its buildPhase also sets HOME=$TMPDIR before invoking
              # get-schema, so pre-seeding the plugin cache there (already
              # exported for the whole build, not just that phase) makes it
              # visible when get-schema looks for pulumi-resource-github.
              postPatch = ''
                cp ${./nix/schema/package-lock.json} package-lock.json
                chmod +w package-lock.json

                mkdir -p $TMPDIR/.pulumi/plugins/resource-github-v6.15.0
                cp ${pulumiResourceGithubPlugin}/pulumi-resource-github \
                  $TMPDIR/.pulumi/plugins/resource-github-v6.15.0/pulumi-resource-github
                chmod +x $TMPDIR/.pulumi/plugins/resource-github-v6.15.0/pulumi-resource-github
              '';
            };
            meta = {
              description = "Reusable Pulumi component resources";
              license = pkgs.lib.licenses.mit;
            };
          };

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
