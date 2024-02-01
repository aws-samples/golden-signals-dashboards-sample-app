#!/bin/sh

check_vars() {
    if [ -z "$AWS_REGION" ] || [ -z "$GS_DASHBOARD_INSTANCE" ]; then
        echo "Missing environment variables. Ensure the following environment variables are set"
        echo "  AWS_REGION"
        echo "  GS_DASHBOARD_INSTANCE"
        return 1
    fi
}

check_this_repository() {
    [ -d "src/data" ] || {
        echo "Ensure that you are in the golden-signals-sample-app root directory before running automated deployment.";
        return 1;
    }

    git status >/dev/null 2>&1 || {
        echo "You must set up a Git repository in the golden-signals-sample-app root directory before you can deploy.";
        return 1;
    }
}

get_repository_name() {
    (./node_modules/.bin/ts-node -e 'import { projectSettings } from "./src/project-settings"; console.log(projectSettings.pipeline.codeCommitRepoName);')
}

get_repository_branch() {
    (./node_modules/.bin/ts-node -e 'import { projectSettings } from "./src/project-settings"; console.log(projectSettings.pipeline.repositoryBranchName);')
}

ensure_codecommit_repository() {
    echo "Ensuring CodeCommit Repository $1 exists..."

    get_repo_output="$(aws codecommit get-repository --repository-name "$1" 2>&1)"
    if [ $? != 0 ]; then
        if echo "$get_repo_output" | grep "RepositoryDoesNotExistException" >/dev/null; then
            echo "Repository does not exist, creating..."
            aws codecommit create-repository --repository-name "$1" >/dev/null || return 1
        else
            echo "Failed to get repository data: $get_repo_output"
            return 1
        fi
    fi
}

set_up_cdk() {
    echo "Setting up CDK codebase..."
    (npm ci) || return 1
    (sh findResources.sh) || return 1
}

do_cdk_deploy() {
    if [ -z "$AWS_ACCOUNT" ]; then
        AWS_ACCOUNT="$(aws sts get-caller-identity | awk '/Account/{ gsub(/"|,/, ""); print $2 }')"
        [ -z "$AWS_ACCOUNT" ] &&
            echo "AWS_ACCOUNT was unset and could not call sts:GetCallerIdentity." &&
            return 1
    fi
    echo "Deploying pipeline with CDK..."
    (AWS_ACCOUNT="$AWS_ACCOUNT" \
        npx projen deploy) || return 1
}

push_to_codecommit() {
    echo "Pushing to CodeCommit..."
    clone_url_http="$(aws codecommit get-repository --repository-name "$1" --query "repositoryMetadata.cloneUrlHttp" --output text)" || return 1

    git \
        -c "credential.helper=" \
        -c 'credential.helper=!aws codecommit credential-helper $@' \
        -c "credential.UseHttpPath=true" \
        push \
        "$clone_url_http" \
        "HEAD:refs/heads/$2" || return 1
}

check_vars || exit 1
check_this_repository || exit 2
set_up_cdk || { echo "Unable to set up CDK codebase."; exit 3; }
repository_name="$(get_repository_name)" || { echo "Unable to get repository name. Did you configure the pipeline in settings.ts?"; exit 4; }
repository_branch="$(get_repository_branch)" || { echo "Unable to get repository branch name. Did you configure the pipeline in settings.ts?"; exit 5; }
ensure_codecommit_repository "$repository_name" || { echo "Unable to ensure repository existence."; exit 6; }
do_cdk_deploy || { echo "Unable to deploy pipeline."; exit 7; }
push_to_codecommit "$repository_name" "$repository_branch" || { echo "Unable to push to CodeCommit."; exit 8; }
