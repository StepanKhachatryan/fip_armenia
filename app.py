from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)

# Database file path
DB_FILE = 'users.json'

def load_users():
    """Load users from JSON file"""
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open(DB_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def hash_password(password):
    """Hash password for security"""
    return hashlib.sha256(password.encode()).hexdigest()

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user (admin provides email and password)"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        users = load_users()
        
        # Check if user already exists
        if email in users:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        
        # Add new user
        users[email] = {
            'password': hash_password(password),
            'created_at': datetime.now().isoformat(),
            'active': True
        }
        
        save_users(users)
        
        return jsonify({'success': True, 'message': f'User {email} registered successfully'}), 201
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Login user with email and password"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        users = load_users()
        
        # Check if user exists
        if email not in users:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        user = users[email]
        
        # Verify password
        if user['password'] != hash_password(password):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.get('active', True):
            return jsonify({'success': False, 'message': 'User account is disabled'}), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'email': email,
                'created_at': user['created_at']
            }
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/verify-login', methods=['POST'])
def verify_login():
    """Verify if credentials are valid (for frontend)"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '').strip()
        
        if not email or not password:
            return jsonify({'valid': False}), 400
        
        users = load_users()
        
        if email not in users:
            return jsonify({'valid': False}), 401
        
        user = users[email]
        
        if user['password'] != hash_password(password) or not user.get('active', True):
            return jsonify({'valid': False}), 401
        
        return jsonify({'valid': True, 'email': email}), 200
    
    except Exception as e:
        return jsonify({'valid': False}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all registered users (admin only - no passwords shown)"""
    users = load_users()
    user_list = []
    for email, user_data in users.items():
        user_list.append({
            'email': email,
            'created_at': user_data.get('created_at'),
            'active': user_data.get('active', True)
        })
    return jsonify({'users': user_list}), 200

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
