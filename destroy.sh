#!/bin/sh

# run cdk and discard STDOUT to /dev/null (capturing just the JSON output containing application stack info from STDERR)
app_stack_data=$(npx cdk ls --context "@flags/app:dump_app_stack_data"=true 2>&1 1>/dev/null)
echo "retrieved app stack data: ${app_stack_data}"

# check if the application stack data returned is a valid json
if [[ ! $app_stack_data =~ ^\{.*\}$ ]]; then
  echo "application stack data is not a valid json, please silence any warnings displayed in output."
  exit 1
fi

# extract the outdir (path to the cloud assembly for the application stacks; needed for cdk to operate on them)
outdir=$(echo "$app_stack_data" | python -c 'import sys, json; print(json.load(sys.stdin)["outdir"])')
echo "parsed outdir: ${outdir}"

# extract the list of stacks to destroy (in a bash-friendly format...space-separated)
stacks=$(echo "$app_stack_data" | python -c 'import sys, json; print(*json.load(sys.stdin)["stacks"], sep = " ")')
echo "parsed stacks: ${stacks}"

# iterate over the stacks calling `cloudformation destroy` for each (passing the assembly dir so cdk can find stack details)
echo "Destroying application stacks..."
for stack in ${stacks[*]}; do
  echo "- ${stack}"
  aws cloudformation delete-stack --stack-name ${stack}
  aws cloudformation wait stack-delete-complete --stack-name ${stack}
done
