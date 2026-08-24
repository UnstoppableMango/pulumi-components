import * as gitlab from "@pulumi/gitlab";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createGitlabRepo } from "./gitlabRepo";

export interface GitlabForkArgs {
	sourceUrl: Input<string>;
	repository?: Partial<gitlab.ProjectArgs>;
}

// @pulumi/gitlab has no resource for a real GitLab fork (upstream linkage,
// fork network). This imports a one-time copy of sourceUrl via
// gitlab.Project.importUrl instead - it is not a true fork.
export class GitlabFork extends ComponentResource {
	public readonly repo!: gitlab.Project;

	constructor(
		name: string,
		args: GitlabForkArgs,
		opts?: ComponentResourceOptions,
	) {
		super("unmango:gitlab:Fork", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo } = createGitlabRepo(this, name, {
			overrides: {
				name,
				importUrl: args.sourceUrl,
				// GitLab defaults for imported repos
				mergeMethod: "merge",
				removeSourceBranchAfterMerge: false,
				issuesAccessLevel: "disabled",
				wikiAccessLevel: "enabled",
				...args.repository,
			},
		});

		this.repo = repo;

		this.registerOutputs({ repo });
	}
}
