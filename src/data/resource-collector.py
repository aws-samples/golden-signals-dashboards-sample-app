# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

""" Python script for finding resources with configured AWS Tags from the AWS Account"""

import json
import argparse
import boto3
from botocore.config import Config

parser = argparse.ArgumentParser()

singletons = []

def get_resources(tag_key, tag_values, config):
    """Get resources from resource groups and tagging API.
    Assembles resources in a list containing only ARN and tags
    """
    resourcetaggingapi = boto3.client(
        'resourcegroupstaggingapi', config=config)
    resources = []

    tags = len(tag_values)
    print(tags)
    if tags > 5:
        tags_processed = 0
        while tags_processed <= tags:
            incremental_tag_values = tag_values[tags_processed:tags_processed+5]
            resources = get_resources_from_api(resourcetaggingapi, resources,
                                               tag_key, incremental_tag_values)
            tags_processed += 5
    else:
        resources = get_resources_from_api(
            resourcetaggingapi, resources, tag_key, tag_values)
    resources.extend(autoscaling_retriever(tag_key, tag_values, config))
    return resources


def get_resources_from_api(resourcetaggingapi, resources, tag_key, tag_values):
    """function to get resources with specific Tag Key:Value"""
    response = resourcetaggingapi.get_resources(
        TagFilters=[
            {
                'Key': tag_key,
                'Values': tag_values
            },
        ],
        ResourcesPerPage=40
    )

    resources.extend(response['ResourceTagMappingList'])
    while response['PaginationToken'] != '':
        print('Got the pagination token')
        response = resourcetaggingapi.get_resources(
            PaginationToken=response['PaginationToken'],
            TagFilters=[
                {
                    'Key': tag_key,
                    'Values': tag_values
                },
            ],
            ResourcesPerPage=40
        )
        resources.extend(response['ResourceTagMappingList'])

    return resources


def autoscaling_retriever(tag_key, tag_values, config):
    """Autoscaling is not supported by resource groups and tagging api"""
    asg = boto3.client('autoscaling', config=config)
    resources = []
    response = asg.describe_auto_scaling_groups(
        Filters=[
            {
                'Name': 'tag:'+tag_key,
                'Values': tag_values
            }
        ],
        MaxRecords=10
    )
    resources.extend(response['AutoScalingGroups'])
    try:
        while response['NextToken']:
            response = asg.describe_auto_scaling_groups(
                NextToken=response['NextToken'],
                Filters=[
                    {
                        'Name': 'tag:'+tag_key,
                        'Values': tag_values
                    }
                ],
                MaxRecords=10
            )
            resources.extend(response['AutoScalingGroups'])
    except Exception as error: # pylint: disable=broad-except
        print(f'Completed fetching all AutoScaling Groups: {error}')

    for resource in resources:
        resource['ResourceARN'] = resource['AutoScalingGroupARN']

    return resources


def router(resource):
    """function to route the request to specific resource type decorator"""
    arn = resource['ResourceARN']
    if 'rds' in arn and ':db:' in arn:
        resource = rds_decorator(resource)
        resource_type = 'AWS::RDS::DBInstance'
    elif 'autoscaling' in arn and 'autoScalingGroup' in arn:
        resource = autoscaling_decorator(resource)
        resource_type = 'AWS::AutoScaling::AutoScalingGroup'
    elif 'dynamodb' in arn and 'table' in arn:
        resource = dynamodb_decorator(resource)
        resource_type = 'AWS::DynamoDB::Table'
    elif 'lambda' in arn and 'function' in arn:
        resource = lambda_decorator(resource)
        resource_type = 'AWS::Lambda::Function'
    elif ':sns:' in arn:
        resource = sns_decorator(resource)
        resource_type = 'AWS::SNS::Topic'
    else:
        #Resources not supported, Will be ignored.
        resource = ''
        resource_type = ''
    return resource_type, resource


def autoscaling_decorator(resource):
    """function to find ASG metric dimension from the resource ARN"""
    # print(f"This resource is Autoscaling Group {resource['ResourceARN']}")
    return resource['ResourceARN'].split(':autoScalingGroupName/')[1]


def dynamodb_decorator(resource):
    """function to find Dynamodb metric dimension from the resource ARN"""
    # print(f"This resource is DynamoDB {resource['ResourceARN']}")
    return resource['ResourceARN'].split('/')[len(resource['ResourceARN'].split('/'))-1]


def lambda_decorator(resource):
    """function to find Lambda metric dimensions from the resource ARN"""
    # print(f"This resource is Lambda {resource['ResourceARN']}")
    return resource['ResourceARN'].split(':')[len(resource['ResourceARN'].split(':')) - 1]


def rds_decorator(resource):
    """function to find RDS metric dimensions from the resource ARN"""
    # print(f"This resource is RDS {resource['ResourceARN']}")
    return resource['ResourceARN'].split(":db:")[1]


def sns_decorator(resource):
    """function to find SNS metric dimensions from the resource ARN"""
    # print(f"This resource is SNS {resource['ResourceARN']}")
    return resource['ResourceARN'].split(":")[-1]


def get_config(region):
    """function to return the boto3 client config"""
    return Config(
        region_name=region,
        signature_version='v4',
        retries={
            'max_attempts': 10,
            'mode': 'standard'
        }
    )


def handler():
    """main function to generate resource list of AWS Account resources as per configuration"""
    output_file = 'src/data/resources.json'
    decorated_resources = {}

    parser.add_argument("--tag-key",
                        help="[REQUIRED] Enter the tag-key of AWS Resources you want to collect",
                        type=str,
                        required=True
                        )
    parser.add_argument("--tag-value",
                        help="[REQUIRED] Enter the comma seprated tag-values of AWS Resources for provided tag-key",
                        type=str,
                        required=True
                        )
    parser.add_argument("--dashboard-prefix",
                        help="[REQUIRED] Enter the dashboard-prefix to export the application specific resources",
                        type=str,
                        required=True
                        )
    parser.add_argument("--resource-regions",
                        help="[OPTIONAL] Enter the comma seprated AWS Regions to find resources from",
                        type=str,
                        default="us-east-1",
                        )
    parser.add_argument("--resource-types",
                        help="[OPTIONAL] Enter the comma seprated AWS Resources Names to create dashboards for",
                        type=str,
                        default="AWS::DynamoDB::Table,AWS::Lambda::Function,AWS::RDS::DBInstance,AWS::SNS::Topic,AWS::AutoScaling::AutoScalingGroup",
                        )
    args = parser.parse_args()

    tag_values=[]
    supported_resources = []
    regions = []

    for value in args.tag_value.split(','):
        tag_values.append(value)

    for res in args.resource_types.split(','):
        supported_resources.append(res)

    for region in args.resource_regions.split(','):
        regions.append(region)

    for region in regions:
        config = get_config(region)
        resources = get_resources(args.tag_key, tag_values, config)
        for resource_type in supported_resources:
            if resource_type not in decorated_resources.keys(): # pylint: disable=consider-iterating-dictionary
                decorated_resources[resource_type] = []
            service_resources = {}
            service_resources['resourceRegion'] = region
            service_resources['resources'] = []
            for resource in resources:
                resource_type_of_resource, resource_dimension = router(resource)
                if (resource_type_of_resource != '' and resource_dimension != '' and resource_type_of_resource == resource_type): # pylint: disable=line-too-long
                    service_resources['resources'].append(resource_dimension)
                    print(f"Adding resource {resource_type} with dimension: {resource_dimension}")
            decorated_resources[resource_type].append(service_resources)


    try:
        with open(output_file, "r") as file:
            data=json.load(file)
    except Exception:
        data = {}
        with open(output_file, "w") as file:
            json.dump(data, file)
    
    data[args.dashboard_prefix]= decorated_resources
    
    with open(output_file, "w") as file:
        json.dump(data, file)
    
if __name__ == '__main__':
    handler()
