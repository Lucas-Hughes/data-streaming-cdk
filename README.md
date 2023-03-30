Data Streaming CDK Stack

This AWS Cloud Development Kit (CDK) stack provides a serverless solution for generating, transforming, and delivering streaming data to Amazon S3.
Description

The stack consists of several AWS resources, including:

    Kinesis Data Stream
    Kinesis Data Firehose Delivery Stream
    S3 Bucket
    Lambda Functions
    IAM Roles and Policies

A Lambda function generates random temperature data and sends it to the Kinesis data stream. The data is then transformed by a Lambda function in the Kinesis Data Firehose delivery stream, which queries an external API for weather data from Jacksonville and appends the response to the original data. The transformed data is then delivered to an S3 bucket using Kinesis Data Firehose.
How to Set Up the CDK Project

    Clone the repository: git clone <repository-url>
    Navigate to the project directory: cd <project-folder>
    Install dependencies: npm install
    Build the project: npm run build
    Deploy the stack: cdk deploy

Requirements

    AWS CLI
    Node.js (v10.3.0 or later)
    AWS CDK (v1.92.0 or later)
