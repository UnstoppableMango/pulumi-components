import * as gitlab from "@pulumi/gitlab";
import { ComponentResource } from "@pulumi/pulumi";

export interface RepoArgs {
	overrides: Partial<gitlab.ProjectArgs>;
}

export interface RepoResult {
	repo: gitlab.Project;
}

// Shared by Fork/PublicRepo/PrivateRepo, each of which must extend
// ComponentResource directly (not an intermediate base class) so
// `pulumi package get-schema`'s analyzer can discover them - see
// https://github.com/UnstoppableMango/pulumi2nix/issues/8.
export function createRepo(
	parent: ComponentResource,
	name: string,
	args: RepoArgs,
): RepoResult {
	const repo = new gitlab.Project(
		name,
		{
			squashOption: "always",
			removeSourceBranchAfterMerge: true,
			issuesAccessLevel: "enabled",
			wikiAccessLevel: "disabled",
			...args.overrides,
		},
		{ parent },
	);

	return { repo };
}
