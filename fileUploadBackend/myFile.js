exports.handler = async (event, context) => {
    const { inputText, inputFilePath } = JSON.parse(event.body);

    const AWS = require('aws-sdk');
    const dynamoDB = new AWS.DynamoDB({ region: process.env.REGION });
    const { nanoid } = await import('nanoid');
  
    const id = nanoid();
  
    const dynamoParams = {
      TableName: process.env.DB_TABLE_NAME,
      Item: {
        id: { S: id },
        input_text: { S: inputText },
        input_file_path: { S: inputFilePath }
      }
    };
  
    try {
      const dynamoResult = await dynamoDB.putItem(dynamoParams).promise();
      const ec2 = new AWS.EC2({ region: process.env.REGION });
        const userData = Buffer.from(`
        #!/bin/bash
        aws s3 cp s3://filefovusbucket/vmscript.sh .
        chmod +x vmscript.sh
        ./vmscript.sh ${id} ${inputFilePath} ${inputText}
        rm vmscript.sh
        `).toString('base64');

        const instanceParams = {
            ImageId: 'ami-0dfcb1ef8550277af',
            InstanceType: 't2.micro',
            KeyName: process.env.KEY_NAME,
            MaxCount: 1,
            MinCount: 1,
            UserData: userData,
            IamInstanceProfile: {
                Arn: process.env.ARN
            }
        };

        const ec2Result = await ec2.runInstances(instanceParams).promise();
        const instanceId = ec2Result.Instances[0].InstanceId;

        console.log(`EC2 instance created with ID: ${instanceId}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          id,
          inputText,
          inputFilePath
        })
      };
    } catch (err) {
      console.error(err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error saving data to DynamoDB or creating EC2 instance' })
      };
    }
  };
  