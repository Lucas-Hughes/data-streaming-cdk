import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as kinesis from "aws-cdk-lib/aws-kinesis";
import * as firehose from "aws-cdk-lib/aws-kinesisfirehose";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";

export interface DataStreamingStackProps {
  // TODO: define properties
}

export class DataStreamingStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: DataStreamingStackProps = {}) {
    super(scope, id);

    // Create a new VPC
    const vpc = new ec2.Vpc(this, "demo-vpc", {
      maxAzs: 2
    });

    // Create a new Kinesis data stream
    const dataStream = new kinesis.Stream(this, "demo-stream", {
      streamName: "demo-stream",
      shardCount: 1,
    });
    
    // Create bucket for delivery streams
    const bucket = new s3.Bucket(this, "delivery-bucket", {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const firehosePolicy = new iam.Policy(this, "firehose-policy", {
      policyName: "firehose-role-policy",
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

    const firehoseRole = new iam.Role(this, "firehose-role", {
      roleName: "firehose-role",
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
    });

    firehoseRole.attachInlinePolicy(firehosePolicy);

    bucket.grantWrite(firehoseRole);

    // Create a new Kinesis Data Firehose delivery stream
    const deliveryStream = new firehose.CfnDeliveryStream(this, "delivery-stream", {
      deliveryStreamName: "firehose-delivery-stream",
      deliveryStreamType: "KinesisStreamAsSource",
      kinesisStreamSourceConfiguration: {
        kinesisStreamArn: dataStream.streamArn,
        roleArn: firehoseRole.roleArn
      },
      extendedS3DestinationConfiguration: {
        bucketArn: bucket.bucketArn,
        roleArn: firehoseRole.roleArn,
        s3BackupMode: "Disabled",
        compressionFormat: "GZIP",
      },
    });

    const kdgPolicy = new iam.Policy(this, "kdg-role-policy", {
      policyName: "kdg-role-policy",
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            "ssm:*",
            "kinesis:PutRecord",
            "kinesis:PutRecords",
            "firehose:PutRecord",
            "firehose:PutRecordBatch",
          ],
          resources: ["*"], 
        }),
      ],
    });

    const kdgRole = new iam.Role(this, "kdg-role", {
      roleName: "kdg-role",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com")
    });

    kdgRole.attachInlinePolicy(kdgPolicy)

    // Create a new Kinesis Data Generator
    const kdgInstance = new ec2.Instance(this, "demo-kdg", {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      role: kdgRole
    });
    
    // Add the script to the KDG instance
    kdgInstance.userData.addCommands(
      "yum update -y",
      "yum install -y java-1.8.0-openjdk",
      "curl https://aws-kinesis-data-generator.s3.amazonaws.com/1.2.1/kinesis-data-generator-1.2.1.jar -o kinesis-data-generator.jar",
      "npm install aws-sdk",
      `nohup java -jar kinesis-data-generator.jar -stream ${dataStream.streamName} -region us-east-1 -generator sample -delimiter "\n" -throughput 1 -profile default -delay 500 -distribution gaussian -mean 50 -stdDev 5 -duration 0 -recordsPerSecond 5 -maxRecords 0 -jitter 0.5 -base64Encode false -partitionKeyOption ROW -randomPartitionKey true -endpoint https://kinesis.us-east-1.amazonaws.com -kinesisDataFirehoseEndpoint ${deliveryStream.s3DestinationConfiguration} -kinesisDataFirehoseRegion us-east-1 -kinesisDataFirehoseStreamName ${deliveryStream.deliveryStreamName} -kinesisDataStreamsEndpoint https://kinesis.us-east-1.amazonaws.com -kinesisDataStreamsRegion us-east-1 -kinesisDataStreamsRoleArn ${firehoseRole.roleArn} -kinesisDataStreamsStreamName ${dataStream.streamName} -kinesisDataStreamsType AGGREGATED_RECORD -kinesisDataStreamsMessageType json &`,
    );

  }
}