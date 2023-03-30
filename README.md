CDK Data Streaming Stack

This AWS CDK stack sets up a data streaming architecture using Kinesis and Firehose services.
Architecture

The stack consists of the following resources:

    Kinesis data stream: collects data from a Lambda function.
    S3 bucket: stores data delivered by Kinesis Firehose.
    Lambda function (generator): generates data and sends it to the Kinesis data stream.
    Lambda function (firehose): transforms data before delivering it to the S3 bucket.
    Kinesis Firehose delivery stream: delivers data to the S3 bucket.

Architecture Diagram
Setup

To use this CDK stack:

    Clone this repository.
    Install dependencies: npm install
    Compile the typescript code to js: npm run build
    Deploy the stack: cdk deploy

Usage

Once the stack is deployed, the Lambda (generator) function will run every 60 seconds and generate data, which will be sent to the Kinesis data stream.

The Lambda (firehose) function will transform the data received from Kinesis Firehose and add additional data retrieved from an external API. The transformed data will then be delivered to the S3 bucket via Kinesis Firehose.
