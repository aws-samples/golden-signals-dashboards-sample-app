// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, pipelines, CfnOutput } from 'aws-cdk-lib';
import { LinuxBuildImage } from 'aws-cdk-lib/aws-codebuild';
import { Repository } from 'aws-cdk-lib/aws-codecommit';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { DashboardingApp } from './dashboard-stack';

interface DashboardPipelineStackProps extends StackProps {
  readonly gsDashboardInstance: string;
  readonly codeCommitRepoName: string;
  readonly repositoryBranchName: string;
}

export class DashboardPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: DashboardPipelineStackProps) {
    super(scope, id, props);

    const repository = Repository.fromRepositoryName(this, 'Repository', props.codeCommitRepoName);
    const source = pipelines.CodePipelineSource.codeCommit(repository, props.repositoryBranchName);

    const synthStep = new pipelines.ShellStep('Synth', {
      input: source,
      commands: ['npm ci', 'npx projen', 'sh findResources.sh', 'npx projen synth'],
      env: {
        AWS_REGION: this.region,
        AWS_ACCOUNT: this.account,
        GS_DASHBOARD_INSTANCE: props.gsDashboardInstance,
      },
    });

    const deploymentPipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      synth: synthStep,
      codeBuildDefaults: {
        buildEnvironment: {
          buildImage: LinuxBuildImage.STANDARD_6_0,
        },
        rolePolicy: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'tag:getResources',
              'tag:getTagKeys',
              'tag:getTagValues',
              'tag:TagResources',
              'tag:UntagResources',
              'resource-groups:GetGroupQuery',
              'resource-groups:SearchResources',
              'resource-groups:GetTags',
              'resource-groups:ListGroups',
              'resource-groups:GetGroup',
              'resource-groups:GroupResources',
              'resource-groups:GetGroupConfiguration',
              'resource-groups:ListGroupResources',
              'resource-groups:Tag',
              'cloudformation:DescribeStacks',
              'cloudformation:ListStackResources',
              'autoscaling:DescribeAutoScalingGroups',
              'autoscaling:DescribeAutoScalingInstances',
              'autoscaling:DescribeLaunchConfigurations',
              'autoscaling:DescribeLoadBalancers',
              'autoscaling:DescribeLoadBalancerTargetGroups',
              'autoscaling:DescribeTags'
            ],
            resources: ['*'],
          }),
        ],
      },
    });

    deploymentPipeline.addStage(new DashboardingApp(this, `${props.gsDashboardInstance}`, {
      env: { account: this.account, region: this.region },
    }));

    deploymentPipeline.buildPipeline()

    new CfnOutput(this, "pipelineARN", {
      value: deploymentPipeline.pipeline.pipelineArn,
      exportName: "GoldenSignalsPipelineARN",
    });
  }
}