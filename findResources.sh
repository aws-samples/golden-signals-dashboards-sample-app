#!/bin/bash
get_application_settings(){
    (./node_modules/.bin/ts-node -e 'import { projectSettings } from "./src/project-settings"; console.log(JSON.stringify(projectSettings.applications));')
}

generate_commands(){
    applications="$(get_application_settings)" || { echo "Unable to get applications settings."; exit 1; }
    shell_commands=$(echo "$applications" | python -c 'import sys, json; apps = json.load(sys.stdin); commands = [ print("python3 src/data/resource-collector.py --tag-key "+app["tagKey"] +" --tag-value "+",".join(app["tagValue"]) +" --resource-regions "+",".join(app["resourceRegions"])+" --dashboard-prefix "+app["dashboardPrefix"]+" ;") for app in apps]')
    echo "${shell_commands}" || return 1
}

echo "Generating python commands to find AWS Resources configured in settings"
eval "$(generate_commands)"