import * as gitlab from "@pulumi/gitlab";
import { ComponentResource } from "@pulumi/pulumi";
import type { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { createGitlabRepo } from "./gitlabRepo";

export interface GitlabPublicRepoTemplateArgs {
	projectId: Input<number>;
}

export interface GitlabPublicRepoArgs {
	archived?: Input<boolean>;
	description: Input<string>;
	template?: GitlabPublicRepoTemplateArgs;
	topics?: Input<Input<string>[]>;
}

export class GitlabPublicRepo extends ComponentResource {
	public readonly repo!: gitlab.Project;
	public readonly branchProtection!: gitlab.BranchProtection;
	public readonly pushRules!: gitlab.ProjectPushRules;

	constructor(
		name: string,
		args: GitlabPublicRepoArgs,
		opts?: ComponentResourceOptions,
	) {
		super("unmango:gitlab:PublicRepo", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo } = createGitlabRepo(this, name, {
			overrides: {
				name,
				description: args.description,
				visibilityLevel: "public",
				topics: args.topics,
				archived: args.archived,
				useCustomTemplate: args.template ? true : undefined,
				templateProjectId: args.template?.projectId,
			},
		});

		this.repo = repo;

		const branchProtection = new gitlab.BranchProtection(
			name,
			{
				project: repo.id,
				branch: repo.defaultBranch,
				codeOwnerApprovalRequired: true,
				allowForcePush: false,
			},
			{ parent: this },
		);

		const pushRules = new gitlab.ProjectPushRules(
			name,
			{
				project: repo.id,
				rejectUnsignedCommits: true,
			},
			{ parent: this },
		);

		this.branchProtection = branchProtection;
		this.pushRules = pushRules;

		this.registerOutputs({ repo, branchProtection, pushRules });
	}
}
