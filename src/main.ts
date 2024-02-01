// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App } from 'aws-cdk-lib';
import { DashboardPipelineStack } from './pipeline-stack';
import { projectSettings } from './project-settings';


if (!process.env.AWS_REGION || !process.env.AWS_ACCOUNT) {
  throw new Error(
    'Please set the AWS_REGION and AWS_ACCOUNT environment variables.',
  );
}

if (!process.env.GS_DASHBOARD_INSTANCE) {
  throw new Error('Please set the GS_DASHBOARD_INSTANCE environment variable.');
}

const app = new App();

const environment = {
  account: process.env.AWS_ACCOUNT,
  region: process.env.AWS_REGION,
};
const gsDashboardInstance = process.env.GS_DASHBOARD_INSTANCE;

new DashboardPipelineStack(app, `GSDashboard-Pipeline-${gsDashboardInstance}`, {
  env: environment,
  gsDashboardInstance: gsDashboardInstance,
  codeCommitRepoName: projectSettings.pipeline.codeCommitRepoName,
  repositoryBranchName: projectSettings.pipeline.repositoryBranchName,
});


const out = app.synth();

if (app.node.tryGetContext('@flags/app:dump_app_stack_data')) {
  const appStackData = {
    outdir: app.outdir,
    stacks: out.stacksRecursively.reverse().map((stack) => stack.stackName),
  };
  console.error(JSON.stringify(appStackData));
}
