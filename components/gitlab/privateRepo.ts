import * as gitlab from "@pulumi/gitlab";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createRepo } from "./repo";

export interface GitlabPrivateRepoArgs {
	description: Input<string>;
}

export class GitlabPrivateRepo extends ComponentResource {
	public readonly repo!: gitlab.Project;

	constructor(
		name: string,
		args: GitlabPrivateRepoArgs,
		opts?: ComponentResourceOptions,
	) {
		super("unmango:gitlab:PrivateRepo", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo } = createRepo(this, name, {
			overrides: {
				name,
				description: args.description,
				visibilityLevel: "private",
			},
		});

		this.repo = repo;

		this.registerOutputs({ repo });
	}
}
