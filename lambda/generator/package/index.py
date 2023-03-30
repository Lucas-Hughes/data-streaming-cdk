import boto3
import json
import random
import time
from datetime import datetime, timezone, timedelta

kinesis_client = boto3.client('kinesis', region_name='us-east-1')
stream_name = 'demo-stream'
iterations = 2

cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose']

def lambda_handler(event, context):
    for i in range(iterations):
        current_time = datetime.now(timezone(timedelta(hours=-4))) # get current time in EST
        current_time_str = current_time.strftime('%Y-%m-%dT%H:%M:%S-04:00') # format time string
        
        data = {
            'sensor_id': random.randint(1, 100),
            'temperature': round(random.uniform(0, 100), 2),
            'timestamp': current_time_str,
            'location': random.choice(cities)
        }
        
        response = kinesis_client.put_record(
            StreamName=stream_name,
            Data=json.dumps(data),
            PartitionKey=str(data['sensor_id'])
        )
