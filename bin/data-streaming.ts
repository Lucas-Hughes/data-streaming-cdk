import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStreamingStack } from '../lib/data-streaming-stack';

const app = new cdk.App();

new DataStreamingStack(app, 'DataStreamingStack', {
    tags: {
        Project_ID: "Demo_Project"
    }
});