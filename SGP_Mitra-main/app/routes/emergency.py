from flask import Blueprint, jsonify, request
import requests

# ✅ Create Blueprint for emergency routes
emergency_routes = Blueprint("emergency_routes", __name__)

# ✅ Emergency contacts + coping strategies endpoint
@emergency_routes.route('/emergency-data', methods=['GET'])
def emergency_data():
    emergency_contacts = [
        {'name': 'National Suicide Prevention Lifeline', 'number': '988', 'available': '24/7'},
        {'name': 'Crisis Text Line', 'number': '741741', 'available': '24/7'},
        {'name': 'Emergency Services', 'number': '911', 'available': '24/7'},
        {'name': 'Mental Health Crisis Line', 'number': '1-800-950-6264', 'available': '24/7'}
    ]

    strategies = [
        {'title': '4-7-8 Breathing', 'description': 'Inhale 4, hold 7, exhale 8 seconds'},
        {'title': '5-4-3-2-1 Grounding', 'description': '5 things you see, 4 hear, 3 feel, 2 smell, 1 taste'},
        {'title': 'Progressive Relaxation', 'description': 'Tense and release each muscle group'},
        {'title': 'Safe Space Visualization', 'description': 'Imagine your most peaceful place'}
    ]

    return jsonify({
        "emergency_contacts": emergency_contacts,
        "strategies": strategies
    })


# ✅ Returns JSON with nearby doctors using Overpass API
@emergency_routes.route('/get_nearby_doctors', methods=['GET'])
def get_nearby_doctors():
    lat = request.args.get('lat')
    lng = request.args.get('lng')

    if not lat or not lng:
        return jsonify({"doctors": []}), 400  # Bad Request if missing lat/lng

    overpass_url = "http://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:25];
    (
      node(around:5000,{lat},{lng})["healthcare"="psychiatrist"];
      node(around:5000,{lat},{lng})["healthcare"="counselling"];
      node(around:5000,{lat},{lng})["amenity"="clinic"];
      node(around:5000,{lat},{lng})["amenity"="hospital"];
    );
    out body;
    """

    try:
        response = requests.post(overpass_url, data={'data': query})
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print("Overpass API error:", e)
        return jsonify({"doctors": []}), 500  # Internal Server Error if Overpass fails

    doctors = []
    for element in data.get('elements', [])[:10]:
        tags = element.get('tags', {})
        phone = tags.get('phone')
        if not phone:
            continue  # skip if no phone number

        doctors.append({
            'name': tags.get('name', 'Unknown Facility'),
            'specialty': tags.get('healthcare', tags.get('amenity', 'Mental Health')).title(),
            'lat': element['lat'],
            'lng': element['lon'],
            'phone': phone,
            'distance': "Approx 5km"
        })

    return jsonify({'doctors': doctors})
