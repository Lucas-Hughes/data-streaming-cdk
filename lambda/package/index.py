import boto3
import json
import random
import time

kinesis_client = boto3.client('kinesis', region_name='us-east-1')
stream_name = 'demo-stream'
iterations = 2

def lambda_handler(event, context):
    for i in range(iterations):
        data = {
            'sensor_id': random.randint(1, 100),
            'temperature': round(random.uniform(0, 100), 2),
            'timestamp': int(time.time() * 1000)
        }
        print(data)
        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=json.dumps(data),
            PartitionKey=str(data['sensor_id'])
        )