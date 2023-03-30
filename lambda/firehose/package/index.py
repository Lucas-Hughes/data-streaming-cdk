import json
import base64
import requests

def lambda_handler(event, context):
    output = []
    for record in event['records']:
        payload = json.loads(base64.b64decode(record['data']).decode('utf-8'))
        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8')
        }

        # Get weather data from API
        weather_data = get_weather_data('Jacksonville')
        temperature_data = weather_data['periods'][0]['temperature']
        temperature = temperature_data['value']
        temperature_unit = temperature_data['unit']
        humidity = weather_data['periods'][0]['relativeHumidity']['value']
        wind_speed = weather_data['periods'][0]['windSpeed']
        wind_direction = weather_data['periods'][0]['windDirection']

        # Add weather data to the record
        output_record['data'] = base64.b64encode(json.dumps({
            **payload,
            'temperature': temperature,
            'temperatureUnit': temperature_unit,
            'humidity': humidity,
            'windSpeed': wind_speed,
            'windDirection': wind_direction
        }).encode('utf-8')).decode('utf-8')

        output.append(output_record)

    return {'records': output}

def get_weather_data(location):
    # Make API request to retrieve weather data - https://www.weather.gov/documentation/services-web-api
    url = f'https://api.weather.gov/gridpoints/JAX/66,65/forecast'
    response = requests.get(url)

    # Parse the response and extract the relevant data
    weather_data = response.json()

    return weather_data
