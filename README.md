# Sample Application - Golden Signals Dashboards on Amazon CloudWatch

This sample code offers a fully automated AWS CDK Pipeline that you can use to create and manage Amazon CloudWatch Dashboards in your AWS Account. The sample application make use of [cdk-golden-signals-dashboard AWS CDK Construct](https://github.com/cdklabs/cdk-golden-signals-dashboard) & AWS Tags (to find and group AWS Resources) to create service-specific, multi-region Amazon CloudWatch Dashboards. 

[Check out these](https://github.com/caws-samples/golden-signals-dashboards-sample-app/tree/main/dashboard-images) screen captures of CloudWatch dashboards created by this sample application.

Please let us know if you need more resource support by opening an issue here and we would priortize it.

## Prerequisite to generate the dashboard
 * You have bootstrapped the AWS Account and Region with AWS CDK (v2). If not, refer [here](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)
 * Python 3 & Boto3 (Python module. `python -m pip install boto3`)
 * Node.js 18 or above
 * NPM
 * AWS CLI


## Configuring & Deploying Golden-Signals-Dashboards-Sample-App
 1. Kindly ensure all the prerequisite mentioned above are met. 
 1. Check out the project and change current directory to project directory.
 1. Set the `AWS_ACCOUNT`, `AWS_REGION` and `GS_DASHBOARD_INSTANCE` environment variables: `AWS_ACCOUNT` is the Account ID of your AWS Account, `AWS_REGION` should be the codename of the AWS region you want to deploy sample application into (e.g. `us-east-1`), and `GS_DASHBOARD_INSTANCE` should be one of `dev`, `test`, or `prod`.
 1. Setup AWS CLI with your IAM user's AWS credentials. For more information, see [Setting Credentials for AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html#cli-configure-files-methods).
 1. You can run `sh deploy.sh`. The script will deploy Golden Signals dashboard sample application and then exit.


## Undeploying Golden-Signals-Dashboards-Sample-App
 1. Set the required environment variables and AWS credentials as described in step 3d & 4 of Deployment steps above. 
 2. Run `sh destroy.sh`. The script will remove all AWS CloudFormation stacks created by sample Application.


## Other useful commands
 * `npm update`         update npm package dependencies
 * `npx projen compile` compile typescript to js
 * `npm run watch`      watch for changes and compile
 * `npm run test`       perform the jest unit tests
 * `cdk deploy`         deploy this stack to your default AWS account/region
 * `cdk diff`           compare deployed stack with current state
 * `cdk synth`          emits the synthesized CloudFormation template
 * `npm install projen` installs projen
 * `npx projen`         installs dependencies and generates the necessary files
 * `npx projen build`   compiles ts to js and runs cdk



## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
