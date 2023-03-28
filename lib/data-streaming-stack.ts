import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Tags } from 'aws-cdk-lib';

export interface DataStreamingStackProps {
  // TODO: define properties
}

export class DataStreamingStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: DataStreamingStackProps = {}) {
    super(scope, id);

    // Create a new Kinesis data stream
    const dataStream = new kinesis.Stream(this, 'demo-stream', {
      streamName: 'demo-stream',
      shardCount: 1,
    });
    
    // Create bucket for delivery streams
    const bucket = new s3.Bucket(this, 'delivery-bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const firehosePolicy = new iam.Policy(this, 'firehose-policy', {
      policyName: 'firehose-role-policy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kinesis:DescribeStream',
            'kinesis:GetShardIterator',
            'kinesis:GetRecords'
          ],
          resources: [
            '*'
          ],          
        })
      ]
    });

    const firehoseRole = new iam.Role(this, 'firehose-role', {
      roleName: 'firehose-role',
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    firehoseRole.attachInlinePolicy(firehosePolicy);

    bucket.grantWrite(firehoseRole);

    // Create a new Kinesis Data Firehose delivery stream
    const deliveryStream = new firehose.CfnDeliveryStream(this, 'delivery-stream', {
      deliveryStreamName: 'firehose-delivery-stream',
      deliveryStreamType: 'KinesisStreamAsSource',
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: dataStream.streamArn,
        roleArn: firehoseRole.roleArn
      },
      extendedS3DestinationConfiguration: {
        bucketArn: bucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        s3BackupMode: 'Disabled',
        compressionFormat: 'GZIP',
      },
    });

    // create a Lambda function to generate data and send it to the Kinesis stream
    const generatorFunction = new lambda.Function(this, 'GeneratorFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('/home/lucas/repos/data-steaming-cdk/lambda/package/'),
      handler: 'index.lambda_handler',
      environment: {
        KINESIS_STREAM_NAME: dataStream.streamName,
      },
    });

    dataStream.grantWrite(generatorFunction);

    const rule = new events.Rule(this, 'GeneratorRule', {
      schedule: events.Schedule.rate(cdk.Duration.seconds(60)),
    });
    
    rule.addTarget(new targets.LambdaFunction(generatorFunction));
  }
}