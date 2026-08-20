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
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import inputs.systems;
      imports = [ inputs.treefmt-nix.flakeModule ];

      perSystem =
        { pkgs, ... }:
        {
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
