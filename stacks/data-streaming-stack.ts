import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as firehose from 'aws-cdk-lib/aws-kinesisfirehose';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { StackProps } from 'aws-cdk-lib';

export interface DataStreamingStackProps extends StackProps {
  streamName: string;
  handler: string;
  firehoseRolePolicyName: string;
  firehoseRoleName: string;
  deliveryStreamName: string;
};

export class DataStreamingStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: DataStreamingStackProps) {
    super(scope, id, props);

    // Create a new Kinesis data stream
    const dataStream = new kinesis.Stream(this, 'demo-stream', {
      streamName: props.streamName,
      shardCount: 1,
    });
    
    // Create bucket for delivery of data
    const bucket = new s3.Bucket(this, 'delivery-bucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // create a Lambda function to generate data and send it to the Kinesis stream
    const generatorLambda = new lambda.Function(this, 'generator-function', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('/home/lucas/repos/data-steaming-cdk/lambda/generator/package/'),
      handler: props.handler,
      timeout: cdk.Duration.seconds(5),
      environment: {
        KINESIS_STREAM_NAME: dataStream.streamName,
      },
    });

    dataStream.grantWrite(generatorLambda);

    const rule = new events.Rule(this, 'generator-rule', {
      schedule: events.Schedule.rate(cdk.Duration.seconds(60)),
    });
    
    rule.addTarget(new targets.LambdaFunction(generatorLambda));

    // create a Lambda function to transform data in kinesis firehose
    const firehoseLambda = new lambda.Function(this, 'firehose-lambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('/home/lucas/repos/data-steaming-cdk/lambda/firehose/package/'),
      handler: props.handler,
      timeout: cdk.Duration.seconds(60),
      memorySize: 512,
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents'],
          resources: ['*']
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kinesis:GetRecord',
            'kinesis:PutRecords',
          ],
          resources: [dataStream.streamArn]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "firehose:DeleteDeliveryStream",
            "firehose:PutRecord",
            "firehose:PutRecordBatch",
            "firehose:UpdateDestination"
          ],
          resources: ['*']
        }),
      ],
    });

    bucket.grantWrite(firehoseLambda);

    const firehoseRolePolicy = new iam.Policy(this, 'firehose-role-policy', {
      policyName: props.firehoseRolePolicyName,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kinesis:DescribeStream',
            'kinesis:GetShardIterator',
            'kinesis:GetRecords',
            'lambda:InvokeFunction',
          ],
          resources: [
            '*'
          ],          
        }),
      ],
    });

    const firehoseRole = new iam.Role(this, 'firehose-role', {
      roleName: props.firehoseRoleName,
      assumedBy: new iam.ServicePrincipal('firehose.amazonaws.com'),
    });

    firehoseRole.attachInlinePolicy(firehoseRolePolicy);

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
        prefix: 'demo/',
        errorOutputPrefix: 'errors/',
        processingConfiguration: {
          enabled: true,
          processors: [{
            type: 'Lambda',
            parameters: [{
              parameterName: 'LambdaArn',
              parameterValue: firehoseLambda.functionArn
            }]
          }]
        }
      },
    }); 

  }
}