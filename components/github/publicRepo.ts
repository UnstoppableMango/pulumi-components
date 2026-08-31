import * as gh from "@pulumi/github";
import type {
	RepositoryPagesSource,
	RepositoryRulesetRules,
	RepositoryRulesetRulesRequiredStatusChecks,
	RepositoryRulesetRulesRequiredStatusChecksRequiredCheck,
	RepositoryTemplate,
} from "@pulumi/github/types/input";
import { ComponentResource } from "@pulumi/pulumi";
import type {
	ComponentResourceOptions,
	CustomResourceOptions,
	Input,
} from "@pulumi/pulumi";
import { createRepo } from "./repo";

export interface PublicRepoPagesArgs {
	buildType?: Input<string>;
	cname?: Input<string>;
	httpsEnforced?: Input<boolean>;
	public?: Input<boolean>;
	source?: RepositoryPagesSource;
}

export interface PublicRepoArgs {
	archived?: Input<boolean>;
	description: Input<string>;
	pages?: PublicRepoPagesArgs;
	requiredChecks?: Input<
		Input<RepositoryRulesetRulesRequiredStatusChecksRequiredCheck>[]
	>;
	template?: RepositoryTemplate;
	topics?: Input<Input<string>[]>;

	// overrides are merged over the repository settings this component
	// chooses, for a repository that needs something the component does not
	// model. Setting a field to undefined unsets it, which is how a
	// repository that is not MIT licensed drops the license template.
	overrides?: Partial<gh.RepositoryArgs>;

	// rules are merged over the rules of the main ruleset. A key given here
	// replaces that rule outright rather than merging into it, so overriding
	// pullRequest means restating all of it.
	rules?: Partial<RepositoryRulesetRules>;

	// repoOptions and rulesetOptions reach the underlying resources. They
	// exist for adopting a repository or a ruleset that already exists:
	// an alias for one whose URN is moving under this component, or an
	// import for a ruleset created outside Pulumi.
	repoOptions?: CustomResourceOptions;
	rulesetOptions?: CustomResourceOptions;
}

export class PublicRepo extends ComponentResource {
	public readonly repo!: gh.Repository;
	public readonly vulnerabilityAlerts?: gh.RepositoryVulnerabilityAlerts;
	public readonly mainRuleset!: gh.RepositoryRuleset;
	public readonly pages?: gh.RepositoryPages;

	constructor(
		name: string,
		args: PublicRepoArgs,
		opts?: ComponentResourceOptions,
	) {
		super("unmango:github:PublicRepo", name, args, opts);
		if (opts?.urn) return; // Refreshing

		const { repo, vulnerabilityAlerts } = createRepo(this, name, {
			overrides: {
				name,
				description: args.description,
				visibility: "public",
				allowAutoMerge: true,
				licenseTemplate: "mit",
				template: args.template,
				topics: args.topics,
				archived: args.archived,
				...args.overrides,
			},
			repoOptions: args.repoOptions,
		});

		this.repo = repo;
		this.vulnerabilityAlerts = vulnerabilityAlerts;

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
					...args.rules,
				},
			},
			{ parent: this, ...args.rulesetOptions },
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
): RepositoryRulesetRulesRequiredStatusChecks | undefined {
	if (!checks) return;
	return { requiredChecks: checks };
}
