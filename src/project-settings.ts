import { Settings } from './data/settings';
/**
 * Default settings for sample Golden Signlas dashboard deployment.
 * Read src/data/settings.ts for information on each setting.
 */

export const projectSettings:Settings = {
  applications: [
    {
      dashboardPrefix: 'APP1',
      tagKey: 'AutoDashboard',
      tagValue: ['True'],
      resourceRegions: ['us-east-1', 'eu-west-1'],
    },
  ],
  pipeline: {
    codeCommitRepoName: 'DashboardRepo',
    repositoryBranchName: 'main',
  },
};