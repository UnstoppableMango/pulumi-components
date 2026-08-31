import * as gh from "@pulumi/github";
import { ComponentResource } from "@pulumi/pulumi";
import type { CustomResourceOptions } from "@pulumi/pulumi";

export interface RepoArgs {
	overrides: Partial<gh.RepositoryArgs>;
	enableVulnerabilityAlerts?: boolean;

	// repoOptions are passed to the repository resource itself, on top of
	// its parent. It is how a caller adopts a repository that already
	// exists outside a component: moving one under a component changes its
	// URN, which reads as delete-and-create without an alias saying
	// otherwise.
	repoOptions?: CustomResourceOptions;
}

export interface RepoResult {
	repo: gh.Repository;
	vulnerabilityAlerts?: gh.RepositoryVulnerabilityAlerts;
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
	const repo = new gh.Repository(
		name,
		{
			// I think this isn't allowed for private repos
			allowAutoMerge: false,
			allowMergeCommit: false,
			allowRebaseMerge: false,
			allowSquashMerge: true,
			deleteBranchOnMerge: true,
			hasDiscussions: false,
			hasIssues: true,
			hasProjects: false,
			hasWiki: false,
			squashMergeCommitMessage: "COMMIT_MESSAGES",
			squashMergeCommitTitle: "COMMIT_OR_PR_TITLE",
			...args.overrides,
		},
		{ parent, ...args.repoOptions },
	);

	let vulnerabilityAlerts: gh.RepositoryVulnerabilityAlerts | undefined;
	if (args.enableVulnerabilityAlerts !== false) {
		vulnerabilityAlerts = new gh.RepositoryVulnerabilityAlerts(
			name,
			{
				repository: repo.name,
			},
			{ parent },
		);
	}

	return { repo, vulnerabilityAlerts };
}
