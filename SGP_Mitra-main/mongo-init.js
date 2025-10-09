// MongoDB initialization script for SGP Mitra
db = db.getSiblingDB('sgp_mitra');

// Create collections
db.createCollection('users');
db.createCollection('chat_sessions');
db.createCollection('test_results');
db.createCollection('tracking_collection');
db.createCollection('recommendation_analytics');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.chat_sessions.createIndex({ "user_email": 1 });
db.chat_sessions.createIndex({ "created_at": -1 });
db.tracking_collection.createIndex({ "user_email": 1 });
db.recommendation_analytics.createIndex({ "user_email": 1 });

print('SGP Mitra database initialized successfully!');
