/** Settings for the Golden Signals Dashboards deployment pipeline. */
export interface PipelineSettings {
  /** Name of the CodeCommit repository to set the pipeline up for. */
  codeCommitRepoName: string;

  /** Name of the branch to use. */
  repositoryBranchName: string;
}


/** Settings for the Golden Signals Dashboards deployment pipeline. */
export interface ApplicationSettings {
  /**
   * Prefix string of Dashboard Name to identify dashboards created by Sample App.
   */
  dashboardPrefix: string;

  /**
   * Tag key name to find the resources with specified tagKey
   */
  tagKey: string;

  /**
   * Tag key values to find the resources with specified tagKey:tagValue
   */
  tagValue: string[];

  /**
   * AWS Regions to find the resources from multiple AWS Regions and create multiregion dashboards.
   */
  resourceRegions: string[];
}


/**
 * Settings for Golden Signals Dashboards deployment.
 */
export interface Settings {
  /**
   * Settings for the Applications onboarding to Golden Signals Dashboards deployment pipeline.
   */
  applications: ApplicationSettings[];


  /**
   * Settings for the Golden Signals Dashboards deployment pipeline.
   */
  pipeline: PipelineSettings;
}


