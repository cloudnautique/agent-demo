import sqlite3
import hashlib
import os

from functools import wraps
from datetime import timedelta, datetime
from dateutil import parser

from flask import Flask, request, jsonify
from flask_restx import Api, Resource, fields, reqparse
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity,
)
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

app = Flask(__name__)

UPLOAD_FOLDER = "./uploads/"

# Define the servers for the OpenAPI spec
servers = [
    {"url": "http://localhost:5000/", "description": "Local development server"},
]

app.config["JWT_SECRET_KEY"] = "changemesecret"  # Replace with a strong secret key
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=10)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
jwt = JWTManager(app)

# Define the JWT Bearer auth security scheme
authorizations = {
    "BearerAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "Authorization",
        "description": "JWT Authorization header using the Bearer scheme. Example: 'Authorization: Bearer {token}'",
    }
}


api = Api(
    app,
    doc="/docs",
    title="Insurance API",
    description="CRUD API for insurance management",
    servers=servers,  # Add servers to the OpenAPI spec
    security="BearerAuth",  # Default security for all endpoints
    authorizations=authorizations,  # Define the security schemes
)


# Hashing function for passwords
def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user["username"] != "admin":
            return jsonify({"message": "Access forbidden: Admins only"}), 403
        return fn(*args, **kwargs)

    return wrapper


def owner_or_admin_required(resource_user_id_param="id"):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user = get_jwt_identity()
            resource_user_id = kwargs.get(resource_user_id_param)
            if (
                current_user["username"] != "admin"
                and current_user["id"] != resource_user_id
            ):
                return (
                    jsonify({"message": "Access forbidden: Unauthorized access"}),
                    403,
                )
            return fn(*args, **kwargs)

        return wrapper

    return decorator

def policy_belongs_to_user_or_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        conn = get_db()
        current_user = get_jwt_identity()
        user_id = kwargs.get('user_id')
        policy_number = kwargs.get('policy_number')
        if policy_number is None or policy_number == "undefined":
            return jsonify({"message": "Invalid request"}), 400

        # Verify that the policy belongs to the user
        policy = conn.execute(
            "SELECT * FROM Policy WHERE policy_number = ? AND user_id = ?", (policy_number, user_id)
        ).fetchone()

        # If no policy is found, or the user is not the owner and not an admin, return a forbidden response
        if not policy and current_user['username'] != 'admin':
            return jsonify({"message": "Policy not found or access forbidden"}), 404
        # Pass the policy's internal ID to the wrapped function
        kwargs['policy_internal_id'] = policy['id'] if policy else None
        return fn(*args, **kwargs)
    return wrapper

# Database connection function
def get_db():
    conn = sqlite3.connect("insurance.db")
    conn.set_trace_callback(print)
    conn.row_factory = sqlite3.Row
    return conn


# Models for API documentation
# User Models
user_model_output = api.model(
    "UserOutput",
    {
        "id": fields.Integer(readOnly=True),
        "first_name": fields.String(
            required=True, description="First name of the user"
        ),
        "last_name": fields.String(required=True, description="Last name of the user"),
        "phone": fields.String(description="Phone number of the user"),
        "email": fields.String(description="Email of the user"),
        "username": fields.String(description="Username of the user"),
    },
)

user_model_input = api.model(
    "UserInput",
    {
        "first_name": fields.String(
            required=True, description="First name of the user"
        ),
        "last_name": fields.String(required=True, description="Last name of the user"),
        "phone": fields.String(description="Phone number of the user"),
        "email": fields.String(description="Email of the user"),
        "username": fields.String(required=True, description="Username of the user"),
        "password": fields.String(required=True, description="Password of the user"),
    },
)

# Device Models
device_model_output = api.model(
    "DeviceOutput",
    {
        "id": fields.Integer(readOnly=True),
        "manufacturer": fields.String(
            required=True, description="Manufacturer of the device"
        ),
        "model": fields.String(required=True, description="Model of the device"),
        "storage": fields.String(description="Storage capacity of the device"),
        "serial_number": fields.String(
            unique=True, description="Serial number of the device"
        ),
        "purchase_date": fields.String(description="Purchase date of the device (ISO8601 format)"),
        "purchase_amount": fields.Float(description="Purchase amount of the device"),
        "purchase_location": fields.String(description="Purchase location of the device"),
    },
)

device_model_input = api.model(
    "DeviceInput",
    {
        "manufacturer": fields.String(
            required=True, description="Manufacturer of the device"
        ),
        "model": fields.String(required=True, description="Model of the device"),
        "storage": fields.String(description="Storage capacity of the device"),
        "serial_number": fields.String(
            unique=True, description="Serial number of the device"
        ),
        "purchase_date": fields.String(description="Purchase date of the device (ISO8601 format)"),
        "purchase_amount": fields.Float(description="Purchase amount of the device"),
        "purchase_location": fields.String(description="Purchase location of the device"),
    },
)

# Vehicle Models
vehicle_model_output = api.model(
    "VehicleOutput",
    {
        "id": fields.Integer(readOnly=True),
        "make": fields.String(required=True, description="Make of the vehicle"),
        "model": fields.String(required=True, description="Model of the vehicle"),
        "year": fields.Integer(required=True, description="Year of the vehicle"),
        "license_plate": fields.String(
            unique=True, description="License plate of the vehicle"
        ),
        "drivers": fields.String(description="Drivers of the vehicle (list of user IDs or names)"),
    },
)

vehicle_model_input = api.model(
    "VehicleInput",
    {
        "make": fields.String(required=True, description="Make of the vehicle"),
        "model": fields.String(required=True, description="Model of the vehicle"),
        "year": fields.Integer(required=True, description="Year of the vehicle"),
        "license_plate": fields.String(
            unique=True, description="License plate of the vehicle"
        ),
    },
)

# Policy Models
policy_model_output = api.model(
    "PolicyOutput",
    {
        "id": fields.Integer(readOnly=True),
        "type": fields.String(
            required=True,
            description="Type of the policy",
            enum=["Windscreen", "Device"],
        ),
        "policy_number": fields.String(
            required=True, unique=True, description="Unique Policy ID"
        ),
        "user_id": fields.Integer(
            required=True, description="ID of the user who owns the policy"
        ),
        "deductible": fields.Float(description="Deductible amount"),
        "device": fields.Nested(device_model_output, description="Device details (if applicable)", allow_null=True),
        "vehicle": fields.Nested(vehicle_model_output, description="Vehicle details (if applicable)", allow_null=True),
    },
)

policy_model_input = api.model(
    "PolicyInput",
    {
        "type": fields.String(
            required=True,
            description="Type of the policy",
            enum=["Windscreen", "Device"],
        ),
        "policy_number": fields.String(
            required=True, unique=True, description="Unique Policy ID"
        ),
        "deductible": fields.Float(description="Deductible amount"),
        "device_id": fields.Integer(description="Device ID (if applicable)"),
        "vehicle_id": fields.Integer(description="Vehicle ID (if applicable)"),
    },
)

claim_model_output = api.model('ClaimOutput', {
    'id': fields.Integer(readOnly=True),
    'policy_id': fields.Integer(required=True, description='Policy ID associated with the claim'),
    'invoices': fields.String(required=True, description='Invoices associated with the claim'),
    'claim_date': fields.String(required=True, description='Date the claim was created (ISO8601 format)'),
    'damage_date': fields.String(required=True, description='Date the repair is scheduled (ISO8601 format)'),
    'date_of_repair': fields.String(required=True, description='Date the repair was completed (ISO8601 format)'),
    'status': fields.String(description='Status of the claim', default='Pending'),
    'status_message': fields.String(required=False, description='Message from the insurance company regarding the claim status'),
    'cause_of_damage': fields.String(description='Cause of the damage')
})

login_response_model = api.model('LoginResponse', {
    'access_token': fields.String(description='JWT access token'),
    'user': fields.Nested(user_model_output, description='User object')
})

api.add_model('DeviceInput', device_model_input)
api.add_model('VehicleInput', vehicle_model_input)
api.add_model('PolicyInput', policy_model_input)
api.add_model('ClaimOutput', claim_model_output)
api.add_model('LoginResponse', login_response_model)
api.add_model('UserInput', user_model_input)
api.add_model('UserOutput', user_model_output)
api.add_model('PolicyOutput', policy_model_output)

# Claim parser for file upload
claim_parser = reqparse.RequestParser()
claim_parser.add_argument('invoice', location='files', type=FileStorage, required=True, help='Invoice file')
claim_parser.add_argument('claim_date', location='form', required=True, type=str, help='Date the claim was created (ISO8601 format)')
claim_parser.add_argument('damage_date', location='form', required=True, type=str, help='Date the repair is scheduled (ISO8601 format)')
claim_parser.add_argument('date_of_repair', location='form', required=True, type=str, help='Date the repair was completed (ISO8601 format)')
claim_parser.add_argument('cause_of_damage', location='form', type=str, help='Cause of damage to the device')

# Namespaces for organization
ns_user = api.namespace("users", description="User operations")
ns_policy = api.namespace("policies", description="Policy operations")
ns_claim = api.namespace("claims", description="Claim operations")
ns_device = api.namespace('devices', description='Device operations')
ns_vehicle = api.namespace('vehicles', description='Vehicle operations')

# CRUD Operations for User
@ns_user.route("/")
class UserList(Resource):
    @jwt_required()
    @admin_required
    @ns_user.marshal_list_with(user_model_output)
    def get(self):
        """List all users (Admin only)"""
        conn = get_db()
        users = conn.execute("SELECT * FROM User").fetchall()
        return [dict(row) for row in users]

    @ns_user.expect(user_model_input)
    @ns_user.marshal_with(user_model_output, code=201)
    def post(self):
        """Create a new user (Sign-Up)"""
        conn = get_db()
        data = request.json
        hashed_password = hash_password(data["password"])

        # Ensure that 'admin' username cannot be created through public sign-up
        if data["username"].lower() == "admin":
            return {"message": "Invalid username"}, 400

        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO User (first_name, last_name, phone, email, username, password) VALUES (?, ?, ?, ?, ?, ?)",
            (
                data["first_name"],
                data["last_name"],
                data.get("phone"),
                data.get("email"),
                data["username"],
                hashed_password,
            ),
        )
        conn.commit()

        # Fetch the newly created user
        user_id = cursor.lastrowid
        new_user = conn.execute("SELECT * FROM User WHERE id = ?", (user_id,)).fetchone()

        return dict(new_user), 201


@ns_user.route("/<int:id>")
class User(Resource):
    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="id")
    @ns_user.marshal_with(user_model_output)
    def get(self, id):
        """Get a user by ID"""
        conn = get_db()
        user = conn.execute("SELECT * FROM User WHERE id = ?", (id,)).fetchone()
        if user is None:
            return {"message": "User not found"}, 404
        return dict(user)

    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="id")
    @ns_user.expect(user_model_input)
    def put(self, id):
        """Update a user by ID"""
        conn = get_db()
        data = request.json
        hashed_password = (
            hash_password(data["password"]) if "password" in data else None
        )
        conn.execute(
            "UPDATE User SET first_name = ?, last_name = ?, phone = ?, email = ?, username = ?, password = ? WHERE id = ?",
            (
                data["first_name"],
                data["last_name"],
                data.get("phone"),
                data.get("email"),
                data["username"],
                hashed_password,
                id,
            ),
        )
        conn.commit()
        return {"message": "User updated successfully"}


@ns_user.route("/<int:user_id>/policies")
class UserPolicies(Resource):
    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_policy.marshal_list_with(policy_model_output)
    def get(self, user_id):
        """List all policies for a specific user"""
        conn = get_db()
        policies = conn.execute(
            "SELECT * FROM Policy WHERE user_id = ?", (user_id,)
        ).fetchall()

        # Include associated device or vehicle details
        result = []
        for policy in policies:
            policy_dict = dict(policy)
            if policy["type"] == "Device":
                device = conn.execute(
                    "SELECT * FROM Devices WHERE id = ?", (policy["device_id"],)
                ).fetchone()
                policy_dict["device"] = dict(device) if device else None
            elif policy["type"] == "Windscreen":
                vehicle = conn.execute(
                    "SELECT * FROM Vehicles WHERE id = ?", (policy["vehicle_id"],)
                ).fetchone()
                policy_dict["vehicle"] = dict(vehicle) if vehicle else None
            result.append(policy_dict)

        return result

    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_policy.expect(policy_model_input)
    def post(self, user_id):
        """Create a new policy for a specific user"""
        conn = get_db()
        data = request.json

        # Insert policy
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Policy (type, user_id, policy_number, deductible) VALUES (?, ?, ?, ?)",
            (data["type"], user_id, data["policy_number"], data.get("deductible")),
        )
        conn.commit()
        return {"message": "Policy created successfully"}, 201


@ns_user.route("/<int:user_id>/policies/<string:policy_number>")
class SpecificPolicy(Resource):
    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_policy.marshal_with(policy_model_output)
    def get(self, user_id, policy_number, policy_internal_id):
        """Get a specific policy for a specific user"""
        conn = get_db()
        policy = conn.execute(
            "SELECT * FROM Policy WHERE id = ? AND policy_number = ? AND user_id = ?", (policy_internal_id, policy_number, user_id)
        ).fetchone()
        if policy is None:
            return {"message": "Policy not found"}, 404

        policy_dict = dict(policy)
        if policy["type"] == "Device":
            device = conn.execute(
                "SELECT * FROM Devices WHERE id = ?", (policy["device_id"],)
            ).fetchone()
            policy_dict["device"] = dict(device) if device else None
        elif policy["type"] == "Windscreen":
            vehicle = conn.execute(
                "SELECT * FROM Vehicles WHERE id = ?", (policy["vehicle_id"],)
            ).fetchone()
            policy_dict["vehicle"] = dict(vehicle) if vehicle else None

        return policy_dict

    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_policy.expect(policy_model_input)
    def put(self, user_id, policy_number, policy_internal_id):
        """Update a specific policy for a specific user"""
        conn = get_db()
        data = request.json

        # Update the policy
        conn.execute(
            "UPDATE Policy SET type = ?, policy_number = ?, deductible = ? WHERE id = ? AND user_id = ?",
            (
                data["type"],
                data["policy_number"],
                data.get("deductible"),
                policy_internal_id,
                user_id,
            ),
        )

        conn.commit()
        return {"message": "Policy updated successfully"}

@ns_user.route("/<int:user_id>/policies/<string:policy_number>/claims")
class PolicyClaims(Resource):
    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_claim.marshal_list_with(claim_model_output)
    def get(self, user_id, policy_number, policy_internal_id):
        """List all claims for a specific policy"""
        conn = get_db()

        # Fetch all claims related to the specified policy
        claims = conn.execute(
            "SELECT * FROM Claims WHERE policy_id = ?", (policy_internal_id,)
        ).fetchall()

        return [dict(row) for row in claims]

    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_claim.expect(claim_parser, validate=True)
    @ns_claim.marshal_with(claim_model_output)
    def post(self, user_id, policy_number, policy_internal_id):
        """File a new claim for a specific policy"""
        args = claim_parser.parse_args()

        file = args['invoice']
        claim_date = convert_to_iso8601(args['claim_date'])
        damage_date = convert_to_iso8601(args['damage_date'])
        date_of_repair = convert_to_iso8601(args['date_of_repair'])
        cause_of_damage = args['cause_of_damage']


        try:
            if file and file.filename != '':
                print("File received:", file.filename)
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)

                conn = get_db()
                cursor = conn.cursor()
                # Start a transaction
                print("Transaction starting")
                cursor.execute('BEGIN TRANSACTION')

                print("Inserting values: ", policy_internal_id, file_path, claim_date, damage_date, date_of_repair)
                # Insert a new claim with the file path as the invoice location
                cursor.execute(
                    "INSERT INTO Claims (policy_id, invoices, claim_date, damage_date, date_of_repair, cause_of_damage) VALUES (?, ?, ?, ?, ?, ?)",
                    (policy_internal_id, file_path, claim_date, damage_date, date_of_repair, cause_of_damage),
                )

                # Commit the transaction
                conn.commit()

                # Fetch the newly created claim
                claim_id = cursor.lastrowid
                claim = conn.execute("SELECT * FROM Claims WHERE id = ?", (claim_id,)).fetchone()

                return dict(claim), 201

        except sqlite3.Error as e:
            # Rollback the transaction on error
            print(e)
            print("SQLite error occurred")
            conn.rollback()
            return {"message": "An error occurred: " + str(e)}, 500
        
        except Exception as e:
            # Rollback the transaction on error
            print(e)
            print("Exception occurred")
            conn.rollback()
            return {"message": "An error occurred: " + str(e)}, 500

        finally:
            conn.close()

        return {"message": "File upload failed"}, 400

@ns_user.route("/<int:user_id>/policies/<string:policy_number>/claims/<int:claim_id>")
class Claim(Resource):
    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_claim.marshal_with(claim_model_output)
    def get(self, user_id, policy_number, claim_id, policy_internal_id):
        """Get a specific claim for a specific policy"""
        conn = get_db()
        claim = conn.execute(
            "SELECT * FROM Claims WHERE id = ? AND policy_id = ?", (claim_id, policy_internal_id)
        ).fetchone()
        if claim is None:
            return {"message": "Claim not found"}, 404
        return dict(claim)

    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_claim.expect(api.parser().add_argument('invoice', location='files', type='file'))
    @ns_claim.marshal_with(claim_model_output)
    def put(self, user_id, policy_number, claim_id, policy_internal_id):
        """Update a specific claim for a specific policy"""
        conn = get_db()
        data = request.form  # using form data because we also handle files
        file = request.files.get('invoice')

        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            # Update the claim with the provided data
            claim = conn.execute(
                "UPDATE Claims SET invoices = ?, claim_date = ?, repair_date = ?, date_of_repair = ? WHERE id = ? AND policy_id = ?",
                (file_path, data["claim_date"], data["repair_date"], data["date_of_repair"], claim_id, policy_internal_id),
            )
            conn.commit()
            return dict(claim), 201

        return {"message": "File upload failed"}, 400

@ns_user.route("/<int:user_id>/policies/<string:policy_id>/devices")
class DeviceList(Resource):
    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_device.marshal_list_with(device_model_output)
    def get(self, user_id, policy_id):
        """List all devices for a specific policy"""
        conn = get_db()
        policy = conn.execute(
            "SELECT * FROM Policy WHERE id = ?", (policy_id,)
        ).fetchone()

        if policy is not None and policy['device_id'] is None:
            return []

        devices = conn.execute(
            "SELECT * FROM Devices WHERE id = ?", (policy.get("device_id"),)
        ).fetchall()
        return [dict(row) for row in devices]

    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_device.expect(device_model_input)
    def post(self, user_id, policy_id):
        """Create a new device for a specific policy"""
        depreciation_years = 5
        depreciation_factor = .20
        if data.get["purchase_amount"] > 5000.00:
            depreciation_years = 10
            depreciation_factor = .10
        conn = get_db()
        cursor = conn.cursor()
        data = request.json
        cursor.execute(
            "INSERT INTO Devices (manufacturer, model, storage, serial_number, purchase_date, purchase_amount, purchase_location, depreciation_years, depreciation_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                data["manufacturer"],
                data["model"],
                data.get("storage"),
                data.get("serial_number"),
                data.get("purchase_date"),
                data.get("purchase_amount"),
                data.get("purchase_location"),
                depreciation_years,
                depreciation_factor
            ),
        )
        conn.commit()
        policy = conn.execute(
            "SELECT * FROM Policy WHERE id = ?", (policy_id,)
        ).fetchone()
        
        cursor.execute(
            "UPDATE Policy SET device_id = ? WHERE id = ?", (cursor.lastrowid, policy["id"])
        )
        conn.commit()
        return {"message": "Device created successfully"}, 201

@ns_user.route("/<int:user_id>/policies/<string:policy_id>/devices/<int:device_id>")
class Device(Resource):
    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_device.marshal_with(device_model_output)
    def get(self, user_id, policy_id, device_id):
        """Get a specific device by ID"""
        conn = get_db()
        device = conn.execute(
            "SELECT * FROM Devices WHERE id = ? AND policy_id = ?", (device_id, policy_id)
        ).fetchone()
        if device is None:
            return {"message": "Device not found"}, 404
        return dict(device)

    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    @ns_device.expect(device_model_input)
    def put(self, user_id, policy_id, device_id):
        """Update a specific device by ID"""
        conn = get_db()
        data = request.json
        conn.execute(
            "UPDATE Devices SET manufacturer = ?, model = ?, storage = ?, serial_number = ?, purchase_date = ?, purchase_amount = ?, purchase_location = ? WHERE id = ? AND policy_id = ?",
            (
                data["manufacturer"],
                data["model"],
                data.get("storage"),
                data.get("serial_number"),
                data.get("purchase_date"),
                data.get("purchase_amount"),
                data.get("purchase_location"),
                device_id,
                policy_id,
            ),
        )
        conn.commit()
        return {"message": "Device updated successfully"}

    @jwt_required()
    @owner_or_admin_required(resource_user_id_param="user_id")
    def delete(self, user_id, policy_id, device_id):
        """Delete a specific device by ID"""
        conn = get_db()
        conn.execute("DELETE FROM Devices WHERE id = ? AND policy_id = ?", (device_id, policy_id))
        conn.commit()
        return {"message": "Device deleted successfully"}, 204

@ns_user.route("/<int:user_id>/policies/<string:policy_number>/vehicles")
class VehicleList(Resource):
    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_vehicle.marshal_list_with(vehicle_model_output)
    def get(self, user_id, policy_number, policy_internal_id):
        """List all vehicles for a specific policy"""
        conn = get_db()
        policy = conn.execute(
            "SELECT * FROM Policy WHERE id = ?", (policy_internal_id,)
        ).fetchone()
        policy = dict(policy)
        vehicles = conn.execute(
            "SELECT * FROM Vehicles WHERE id = ?", (policy['vehicle_id'],)
        ).fetchall()
        return [dict(row) for row in vehicles]

    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_vehicle.expect(vehicle_model_input)
    def post(self, user_id, policy_number, policy_internal_id):
        """Create a new vehicle for a specific policy"""
        conn = get_db()
        cursor = conn.cursor()
        data = request.json
        cursor.execute(
            "INSERT INTO Vehicles (make, model, year, license_plate, drivers) VALUES (?, ?, ?, ?, ?)",
            (data["make"], data["model"], data["year"], data.get("license_plate"), user_id),
        )
        conn.commit()

        # Update Policy
        vehicle_id = cursor.lastrowid
        cursor.execute(
            "UPDATE Policy SET vehicle_id = ? WHERE id = ?", (vehicle_id, policy_internal_id)
        )
        conn.commit()

        return {"message": "Vehicle created successfully"}, 201

@ns_user.route("/<int:user_id>/policies/<string:policy_number>/vehicles/<int:vehicle_id>")
class Vehicle(Resource):
    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_vehicle.marshal_with(vehicle_model_output)
    def get(self, user_id, policy_number, vehicle_id, policy_internal_id):
        """Get a specific vehicle by ID"""
        conn = get_db()
        vehicle = conn.execute(
            "SELECT * FROM Vehicles WHERE id = ? AND policy_id = ?", (vehicle_id, policy_internal_id)
        ).fetchone()
        if vehicle is None:
            return {"message": "Vehicle not found"}, 404
        return dict(vehicle)

    @jwt_required()
    @policy_belongs_to_user_or_admin
    @ns_vehicle.expect(vehicle_model_input)
    def put(self, user_id, policy_number, vehicle_id, policy_internal_id):
        """Update a specific vehicle by ID"""
        conn = get_db()
        data = request.json
        conn.execute(
            "UPDATE Vehicles SET make = ?, model = ?, year = ?, license_plate = ?, drivers = ? WHERE id = ? AND policy_id = ?",
            (
                data["make"],
                data["model"],
                data["year"],
                data.get("license_plate"),
                data.get("drivers"),
                vehicle_id,
                policy_internal_id,
            ),
        )
        conn.commit()
        return {"message": "Vehicle updated successfully"}

    @jwt_required()
    @policy_belongs_to_user_or_admin
    def delete(self, user_id, policy_number, vehicle_id, policy_internal_id):
        """Delete a specific vehicle by ID"""
        conn = get_db()
        conn.execute("DELETE FROM Vehicles WHERE id = ?", (vehicle_id,))
        conn.commit()
        return {"message": "Vehicle deleted successfully"}, 204

@ns_user.route("/login")
class UserLogin(Resource):
    @ns_user.expect(
        api.model(
            "Login",
            {
                "username": fields.String(
                    required=True, description="The user's username"
                ),
                "password": fields.String(
                    required=True, description="The user's password"
                ),
            },
        )
    )
    @ns_user.response(200, "Success", model=login_response_model)
    def post(self):
        """Log in a user and return a success message if the credentials are correct"""
        conn = get_db()
        data = request.json
        hashed_password = hash_password(data["password"])
        user = conn.execute(
            "SELECT * FROM User WHERE username = ? AND password = ?",
            (data["username"], hashed_password),
        ).fetchone()

        if user:
            access_token = create_access_token(identity=dict(user))
            user_data = api.marshal(dict(user), user_model_output)
            return {"access_token": access_token, "user": user_data}, 200
        else:
            return {"message": "Invalid username or password"}, 401

def convert_to_iso8601(date_str):
    date_obj = parser.parse(date_str)
    return date_obj.strftime("%Y-%m-%d")

if __name__ == "__main__":
    app.run(debug=True)
