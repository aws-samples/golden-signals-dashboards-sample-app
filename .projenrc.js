const { awscdk } = require('projen');
const { ApprovalLevel } = require('projen/lib/awscdk');
const project = new awscdk.AwsCdkTypeScriptApp({
  license: 'MIT-0',
  copyrightOwner: 'Amazon.com, Inc. or its affiliates. All Rights Reserved.',
  copyrightPeriod: '',
  requireApproval: ApprovalLevel.NEVER,
  cdkVersion: '2.86.0',
  defaultReleaseBranch: 'main',
  name: 'golden-signals-sample-app',
  deps: [
    'aws-cdk-lib',
    'constructs',
    'cdk-nag',
    'cdk-golden-signals-dashboard',
  ],
  jest: true,
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
const common_exclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'coverage',
  'venv',
  'node_modules',
  '.DS_Store',
  'resources.json',
  'custom_namespaces.json',
];
project.tsconfig.file.addOverride('compilerOptions.moduleResolution', 'node');
project.gitignore.exclude(...common_exclude);
project.synth();