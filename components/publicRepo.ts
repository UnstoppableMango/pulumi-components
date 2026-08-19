import * as gh from "@pulumi/github";
import {
	RepositoryRulesetRules,
	RepositoryRulesetRulesRequiredStatusChecks,
	RepositoryTemplate,
} from "@pulumi/github/types/input";
import { ComponentResourceOptions, Input } from "@pulumi/pulumi";
import { Repo } from "./repo";

export interface PublicRepoArgs {
	description: Input<string>;
	pages?: Omit<gh.RepositoryPagesArgs, "repository">;
	requiredChecks?: RepositoryRulesetRulesRequiredStatusChecks["requiredChecks"];
	template?: RepositoryTemplate;
	topics?: Input<Input<string>[]>;
}

export class PublicRepo extends Repo {
	public readonly mainRuleset!: gh.RepositoryRuleset;
	public readonly pages?: gh.RepositoryPages;

	constructor(
		name: string,
		args: PublicRepoArgs,
		opts?: ComponentResourceOptions,
	) {
		super(
			"unmango:github:PublicRepo",
			name,
			{
				overrides: {
					name,
					description: args.description,
					visibility: "public",
					allowAutoMerge: true,
					licenseTemplate: "mit",
					template: args.template,
					topics: args.topics,
				},
			},
			opts,
		);

		if (opts?.urn) return; // Refreshing

		const repo = this.repo;
		const vulnerabilityAlerts = this.vulnerabilityAlerts;

		const mainRuleset = new gh.RepositoryRuleset(
			name,
			{
				name: "main",
				repository: repo.name,
				enforcement: "active",
				target: "branch",
				conditions: {
					refName: {
						includes: ["~DEFAULT_BRANCH"],
						excludes: [],
					},
				},
				rules: {
					deletion: true,
					pullRequest: {
						dismissStaleReviewsOnPush: true,
						allowedMergeMethods: ["squash"],
					},
					nonFastForward: true,
					requiredLinearHistory: true,
					requiredSignatures: true,
					requiredStatusChecks: getRequiredStatusChecks(args.requiredChecks),
				},
			},
			{ parent: this },
		);

		this.mainRuleset = mainRuleset;

		if (args.pages) {
			this.pages = new gh.RepositoryPages(
				name,
				{
					...args.pages,
					repository: repo.name,
				},
				{ parent: this },
			);
		}

		this.registerOutputs({
			repo,
			mainRuleset,
			vulnerabilityAlerts,
			pages: this.pages,
		});
	}
}

function getRequiredStatusChecks(
	checks: PublicRepoArgs["requiredChecks"],
): RepositoryRulesetRules["requiredStatusChecks"] {
	if (!checks) return;
	return { requiredChecks: checks };
}
