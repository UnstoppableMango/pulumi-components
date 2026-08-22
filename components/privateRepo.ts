import * as gh from "@pulumi/github";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createRepo } from "./repo";

export interface PrivateRepoArgs {
	description: Input<string>;
}

export class PrivateRepo extends ComponentResource {
	public readonly repo!: gh.Repository;
	public readonly vulnerabilityAlerts?: gh.RepositoryVulnerabilityAlerts;

	constructor(
		name: string,
		args: PrivateRepoArgs,
		opts?: ComponentResourceOptions,
	) {
		super("unmango:github:PrivateRepo", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo, vulnerabilityAlerts } = createRepo(this, name, {
			overrides: {
				name,
				description: args.description,
				visibility: "private",
				licenseTemplate: "mit",
			},
		});

		this.repo = repo;
		this.vulnerabilityAlerts = vulnerabilityAlerts;

		this.registerOutputs({ repo, vulnerabilityAlerts });
	}
}
