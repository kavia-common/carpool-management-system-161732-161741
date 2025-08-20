#!/bin/bash
cd /home/kavia/workspace/code-generation/carpool-management-system-161732-161741/carpool_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

