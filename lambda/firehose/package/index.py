import json
import base64

def lambda_handler(event, context):
    output = []
    for record in event['records']:
        payload = json.loads(base64.b64decode(record['data']).decode('utf-8'))
        payload['sensor_type'] = 'temperature'
        payload['location'] = 'office'
        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8')
        }
        output.append(output_record)
    return {'records': output}
