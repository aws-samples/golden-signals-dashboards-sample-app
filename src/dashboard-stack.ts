// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stage, StageProps, Stack, StackProps, Fn } from 'aws-cdk-lib';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import * as event from 'aws-cdk-lib/aws-events';
import * as target from 'aws-cdk-lib/aws-events-targets';
import { GoldenSignalDashboard } from 'cdk-golden-signals-dashboard';
import { Construct } from 'constructs';
import resourceInfo from './data/resources.json';
import { projectSettings } from './project-settings';

interface DashboardStackProps extends StackProps {
  /**
   * "The dashboard name will be prefixed with provided string to identify application specific dashboards"
   */
  readonly dashboardPrefix: string;
  readonly dashboardTagKey: string;
}

export class DashboardStack extends Stack {

  constructor(scope: Construct, id: string, props: DashboardStackProps) {
    super(scope, id, props);
    const resources = (<any>resourceInfo);
    const dashboardPrefix = props.dashboardPrefix;
    if (resources.items?.length) {
      for (let resourceType of Object.keys(resources[dashboardPrefix])) {
        let service = resourceType.split('::')[1];
        new GoldenSignalDashboard(this, `${dashboardPrefix}-${service}`, {
          resourceType: resourceType,
          dashboardName: `${dashboardPrefix}-${service}`,
          resourceDimensions: resources[dashboardPrefix][resourceType],
          createAlarms: true,
          showInsightsMetrics: true,
        });
      }
    }
    const tagRule = new event.Rule(this, 'tagRule', {
      eventPattern: {
        source: ['aws.tag'],
        detailType: ['Tag Change on Resource'],
        detail: {
          'changed-tag-keys': [props.dashboardTagKey],
          'service': ['dynamodb', 'rds', 'sns', 'lambda'],
          'resource-type': ['table', 'db', 'function', ''],
        },
      },
    });
    tagRule.addTarget(new target.CodePipeline(Pipeline.fromPipelineArn(this, 'importedPipelineARN', Fn.importValue('GoldenSignalsPipelineARN'))));
  }
}


export class DashboardingApp extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);
    for (let app of projectSettings.applications) {
      new DashboardStack(this, `GSDashboard-${app.dashboardPrefix}`, { dashboardPrefix: app.dashboardPrefix, dashboardTagKey: app.tagKey });
    }
  }
}