import * as gh from "@pulumi/github";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createRepo } from "./repo";

export interface ForkArgs {
	sourceOwner: Input<string>;
	sourceRepo: Input<string>;
	repository?: Partial<gh.RepositoryArgs>;
}

export class Fork extends ComponentResource {
	public readonly repo!: gh.Repository;
	public readonly vulnerabilityAlerts?: gh.RepositoryVulnerabilityAlerts;

	constructor(name: string, args: ForkArgs, opts?: ComponentResourceOptions) {
		super("unmango:github:Fork", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo, vulnerabilityAlerts } = createRepo(this, name, {
			overrides: {
				name,
				fork: "true",
				sourceOwner: args.sourceOwner,
				sourceRepo: args.sourceRepo,
				// GitHub defaults for forked repos
				allowMergeCommit: true,
				allowRebaseMerge: true,
				deleteBranchOnMerge: false,
				hasIssues: false,
				hasProjects: true,
				hasWiki: true,
				...args.repository,
			},
			enableVulnerabilityAlerts: false,
		});

		this.repo = repo;
		this.vulnerabilityAlerts = vulnerabilityAlerts;

		this.registerOutputs({ repo, vulnerabilityAlerts });
	}
}
