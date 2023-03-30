import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { DataStreamingStack } from '../stacks/data-streaming-stack';

describe('DataStreamingStack', () => {
    test('creates a Kinesis Data Firehose delivery stream', () => {
      const app = new cdk.App();
      const stack = new DataStreamingStack(app, 'MyTestStack', {
        streamName: 'demo-stream',
        handler: 'index.lambda_handler',
        firehoseRolePolicyName: 'firehose-role-policy',
        firehoseRoleName: 'firehose-role',
        deliveryStreamName: 'demo-delivery-stream',
      });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::KinesisFirehose::DeliveryStream', {
        DeliveryStreamName: "firehose-delivery-stream"
    });
  });
});
