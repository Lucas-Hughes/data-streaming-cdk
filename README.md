# CDK Data Streaming Stack

This AWS CDK stack sets up a data streaming architecture using Kinesis and Firehose services.

## Architecture

The stack consists of the following resources:

- Kinesis data stream: collects data from a Lambda function.
- S3 bucket: stores data delivered by Kinesis Firehose.
- Lambda function (generator): generates data and sends it to the Kinesis data stream.
- Lambda function (firehose): transforms data before delivering it to the S3 bucket.
- Kinesis Firehose delivery stream: delivers data to the S3 bucket.

## Project Setup

This project uses Leapp to authenticate to AWS. I utilized AWS SSO to assume a role in my demo account, but it can also use SAML. - https://docs.leapp.cloud/latest/installation/install-leapp/#

To use this CDK stack on Linux Envs:

1. Clone this repository using `git clone git@gitlab.com:lucas-test-project/aws/data-steaming-cdk.git`
1. Install node.js and npm: (if you have these, skip to step 3)
    1. `sudo apt install curl`
    1. `curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash`
    1. `source ~/.bashrc`
    1. `nvm install node` (this step installs node.js and npm)
1. Install CDK: `npm install aws-cdk-lib`
1. Install Typescript: `npm install -g typescript`
1. Install dependencies: `npm install`
1. Compile the typescript code to js: `npm run build`
1. Autheticate to AWS using aws-runas, leapp, or method of choice
1. Deploy the stack: `cdk deploy`


## Usage

Once the stack is deployed, the Lambda (generator) function will run every 60 seconds and generate data, which will be sent to the Kinesis data stream.

The Lambda (firehose) function will transform the data received from Kinesis Firehose and add additional data retrieved from an external API. The transformed data will then be delivered to the S3 bucket via Kinesis Firehose.

## Testing

To utilize the testing, please run the following command from the `/data-streaming-cdk` directory.

Run `npm test` - this will run the unit test against the Kinesis Firehose Delivery Stream to ensure that the stack contains and creates that resoruce with the name 'firehose-delivery-stream'.
