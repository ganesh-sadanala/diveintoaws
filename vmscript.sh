#!/bin/bash
export AWS_DEFAULT_REGION=us-east-1
        touch /tmp/input.txt
        aws s3 cp "s3://$2" /tmp/input.txt
        inputText="$3"
        echo "$(cat /tmp/input.txt) : $inputText" > /tmp/output.txt
        aws s3 cp /tmp/output.txt "s3://filefovusbucket/$1_output.txt"
aws dynamodb update-item --table-name MyFile \
--key '{"id": {"S": "'$1'"}}' \
--update-expression 'SET output_file_path = :path' \
--expression-attribute-values '{":path":{"S":"filefovusbucket/'$1'_output.txt"}}' \
--region us-east-1 
shutdown -h now
