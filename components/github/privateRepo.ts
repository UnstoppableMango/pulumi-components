import * as gh from "@pulumi/github";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createRepo } from "./repo";

const defaultCodeRabbitConfig = `# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
reviews:
  auto_review:
    enabled: false
`;

export interface PrivateRepoArgs {
	description: Input<string>;
	// Contents of .coderabbit.yaml. Defaults to disabling automatic reviews.
	codeRabbitConfig?: Input<string>;
}

export class PrivateRepo extends ComponentResource {
	public readonly repo!: gh.Repository;
	public readonly vulnerabilityAlerts?: gh.RepositoryVulnerabilityAlerts;
	public readonly codeRabbitConfig!: gh.RepositoryFile;

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

		const codeRabbitConfig = new gh.RepositoryFile(
			`${name}-coderabbit`,
			{
				repository: repo.name,
				file: ".coderabbit.yaml",
				content: args.codeRabbitConfig ?? defaultCodeRabbitConfig,
				commitMessage: "chore: configure CodeRabbit",
				overwriteOnCreate: true,
			},
			{ parent: this },
		);

		this.repo = repo;
		this.vulnerabilityAlerts = vulnerabilityAlerts;
		this.codeRabbitConfig = codeRabbitConfig;

		this.registerOutputs({ repo, vulnerabilityAlerts, codeRabbitConfig });
	}
}
