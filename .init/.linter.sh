#!/bin/bash
cd /home/kavia/workspace/code-generation/taskflow-66490-c1251109/task_planner_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

