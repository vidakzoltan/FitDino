#!/bin/sh
# Keep hosting rules while selecting FitDino's static HTML entry point.
set -eu

deploy_dir=${1:?Usage: configure-directory-index.sh DEPLOY_DIRECTORY}
if [ ! -d "$deploy_dir" ] || [ ! -s "$deploy_dir/index.html" ]; then
    printf '%s\n' 'FitDino: missing deploy directory or index.html.' >&2
    exit 1
fi

htaccess="$deploy_dir/.htaccess"
if [ -L "$htaccess" ] || { [ -e "$htaccess" ] && [ ! -f "$htaccess" ]; }; then
    printf '%s\n' 'FitDino: .htaccess must be a regular file.' >&2
    exit 1
fi

index_block=$(printf '%s\n' '# FitDino static entry point' 'DirectoryIndex disabled' 'DirectoryIndex index.html')
if [ -f "$htaccess" ] && [ "$(tail -n 3 "$htaccess")" = "$index_block" ]; then
    exit 0
fi

# Reset the previous list: DirectoryIndex directives in one context otherwise add up.
printf '\n%s\n' "$index_block" >> "$htaccess"
