import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStreamingStack } from '../stacks/data-streaming-stack';

const app = new cdk.App();

new DataStreamingStack(app, 'DataStreamingStack', {
    streamName: 'demo-stream',
    handler: 'index.lambda_handler',
    firehoseRolePolicyName: 'firehose-role-policy',
    firehoseRoleName: 'firehose-role',
    deliveryStreamName: 'demo-delivery-stream',
    tags: {
        Project_ID: 'Demo_Project'
    }
});