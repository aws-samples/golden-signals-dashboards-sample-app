// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Template, Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { DashboardStack } from '../src/dashboard-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new DashboardStack(app, 'test', { dashboardPrefix: 'APP1', dashboardTagKey: 'AutoDashboard' });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});

describe('cdk-nag AwsSolutions Pack', () => {
  let stack: Stack;
  let app: App;
  // In this case we can use beforeAll() over beforeEach() since our tests
  // do not modify the state of the application
  beforeAll(() => {
    // GIVEN
    app = new App();
    stack = new DashboardStack(app, 'test', { dashboardPrefix: 'APP1', dashboardTagKey: 'AutoDashboard' });

    // WHEN
    Aspects.of(stack).add(new AwsSolutionsChecks());
  });

  // THEN
  test('No unsuppressed Warnings', () => {
    const warnings = Annotations.fromStack(stack).findWarning(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );
    expect(warnings).toHaveLength(0);
  });

  test('No unsuppressed Errors', () => {
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );
    expect(errors).toHaveLength(0);
  });
});