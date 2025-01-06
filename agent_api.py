import sqlite3
import hashlib
import os

from flask import Flask, request, jsonify, send_from_directory
from flask_restx import Api, Resource, fields
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    create_access_token,
    get_jwt_identity,
)
from functools import wraps
from datetime import timedelta, datetime

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = (
    "your_jwt_secret_key"  # Change this to a random secret key
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=10)

jwt = JWTManager(app)

# Define the servers for the OpenAPI spec
servers = [
    {"url": "http://localhost:5100/", "description": "Local development server"},
]

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
    version="1.0",
    title="Claims API",
    description="API to manage insurance claims",
    servers=servers,
    authorizations=authorizations,
    security="BearerAuth",
)

# Define the Claims model for documentation
claim_model = api.model(
    "Claim",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique identifier of a claim"
        ),
        "policy_id": fields.Integer(
            required=True, description="The policy ID associated with the claim"
        ),
        "claim_date": fields.String(
            required=True, description="Date when the claim was created"
        ),
        "damage_date": fields.String(
            required=True, description="Date when the damage occurred"
        ),
        "date_of_repair": fields.String(
            required=True, description="Date when the repair was completed"
        ),
        "status": fields.String(
            required=True,
            description="Status of the claim (Pending, Reviewing, Approved, Denied)",
            enum=["Pending", "Reviewing", "Approved", "Denied"],
        ),
        "status_message": fields.String(
            description="Message from the insurance company regarding the claim status"
        ),
        "invoices": fields.String(
            required=True, description="Location of the invoice on disk"
        ),
        "internal_status": fields.String(
            required=True,
            description="Status of the claim (Pending, Reviewing, 2nd Level Review, Approved, Denied)",
            enum=["Pending", "Reviewing", "2nd Level Review", "Approved", "Denied"],
        ),
        "internal_status_message": fields.String(
            description="Message from the insurance company regarding the claim status"
        ),
        "cause_of_damage": fields.String(
            description="The cause of the damage for devices"
        ),
    },
)

check_model = api.model(
    "ClaimProcessingCheck",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique identifier of a check"
        ),
        "claim_id": fields.Integer(
            required=True, description="The claim ID associated with the check"
        ),
        "check_name": fields.String(required=True, description="The name of the check"),
        "expected_value": fields.String(
            description="The expected value or threshold to perform the check against"
        ),
        "reviewed_value": fields.String(
            description="The actual value or result of the check"
        ),
        "operator": fields.String(description="The operator to use for comparison"),
        "status": fields.String(
            required=True,
            description="The status of the check (Pending, Passed, Failed)",
            enum=["Pending", "Passed", "Failed"],
        ),
        "result_message": fields.String(
            description="The message detailing the check result"
        ),
        "processed_at": fields.String(description="When the check was processed"),
    },
)

# Define the Vehicles model for documentation
vehicle_model = api.model(
    "Vehicle",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique identifier of a vehicle"
        ),
        "make": fields.String(required=True, description="The make of the vehicle"),
        "model": fields.String(required=True, description="The model of the vehicle"),
        "year": fields.Integer(required=True, description="The year of the vehicle"),
        "license_plate": fields.String(
            required=True, description="The license plate of the vehicle"
        ),
        "drivers": fields.String(
            description="List of drivers associated with the vehicle"
        ),
    },
)

device_model = api.model(
    "Device",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique identifier of a device"
        ),
        "manufacturer": fields.String(
            readOnly=True, description="The manufacturer of the device"
        ),
        "model": fields.String(readOnly=True, description="The model of the device"),
        "serial_number": fields.String(
            readOnly=True, description="The serial number of the device"
        ),
        "purchase_date": fields.String(
            readOnly=True, description="The purchase date of the device"
        ),
        "purchase_amount": fields.Float(
            readOnly=True, description="The purchase amount of the device"
        ),
        "purchase_location": fields.String(
            readOnly=True, description="The purchase location of the device"
        ),
        "depreciation_years": fields.Integer(
            readOnly=True, description="The number of years for depreciation"
        ),
        "depreciation_rate": fields.Float(
            readOnly=True, description="The depreciation rate of the device"
        ),
        "storage": fields.String(
            readOnly=True, description="The storage capacity of the device"
        ),
    },
)

# Define the Policy model for documentation
policy_model = api.model(
    "Policy",
    {
        "id": fields.Integer(
            readOnly=True, description="The unique identifier of a policy"
        ),
        "type": fields.String(
            required=True, description="The type of the policy (Windscreen, Device)"
        ),
        "policy_number": fields.String(required=True, description="The policy number"),
        "deductible": fields.Float(description="The deductible for the policy"),
        "vehicle": fields.Nested(
            vehicle_model, description="Details of the vehicle if applicable"
        ),
        "device": fields.Nested(
            device_model, description="Details of the device if applicable"
        ),
    },
)

# Define the User model for documentation
user_model = api.model(
    "User",
    {
        "first_name": fields.String(
            required=True, description="The first name of the user"
        ),
        "last_name": fields.String(
            required=True, description="The last name of the user"
        ),
        "phone": fields.String(description="The phone number of the user"),
        "email": fields.String(description="The email of the user"),
        "username": fields.String(
            required=True, description="The username of the user"
        ),
    },
)

# Define the combined object model for documentation
combined_policy_model = api.model(
    "CombinedPolicy",
    {
        "policy": fields.Nested(policy_model, description="Details of the policy"),
        "policy_holder": fields.Nested(
            user_model, description="Details of the user associated with the policy"
        ),
    },
)

check_update_model = api.model(
    "UpdateClaimProcessingCheck",
    {
        "status": fields.String(
            required=True,
            description="The status of the check (Pending, Passed, Failed)",
            enum=["Pending", "Passed", "Failed"],
        ),
        "result_message": fields.String(
            required=True, description="The message detailing the check result"
        ),
        "reviewed_value": fields.String(
            required=True, description="The actual value or result of the check"
        ),
    },
)


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = get_jwt_identity()
        if current_user["username"] != "admin":
            return jsonify({"message": "Access forbidden: Admins only"}), 403
        return fn(*args, **kwargs)

    return wrapper


def get_db():
    conn = sqlite3.connect("insurance.db")
    conn.set_trace_callback(print)
    conn.row_factory = sqlite3.Row
    return conn


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


@api.route("/login")
class AuthResource(Resource):
    @api.expect(
        api.model(
            "Login",
            {
                "username": fields.String(required=True, description="The username"),
                "password": fields.String(required=True, description="The password"),
            },
        )
    )
    def post(self):
        """
        Authenticate and get a JWT token.
        """
        conn = get_db()
        data = request.json
        hashed_password = hash_password(data["password"])
        user = conn.execute(
            "SELECT * FROM User WHERE username = ? AND password = ?",
            (data["username"], hashed_password),
        ).fetchone()

        if user:
            token_data = {"id": user["id"], "username": user["username"]}
            access_token = create_access_token(identity=token_data)
            return {"access_token": access_token}, 200
        else:
            return {"message": "Invalid username or password"}, 401


@api.route("/claims")
class ClaimsResource(Resource):
    @jwt_required()
    @api.doc(params={"status": "Filter claims by status"})
    @api.marshal_list_with(claim_model)
    @admin_required
    def get(self):
        """
        Get a list of claims, optionally filtered by status.
        """
        status_filter = request.args.get("status")
        db = get_db()
        if status_filter:
            claims = db.execute(
                "SELECT * FROM Claims WHERE status = ?", (status_filter,)
            ).fetchall()
        else:
            claims = db.execute("SELECT * FROM Claims").fetchall()

        # Convert the result to a list of dictionaries and transform invoice paths
        claims_list = [dict(claim) for claim in claims]
        for claim in claims_list:
            if claim.get("invoices"):
                claim["invoices"] = (
                    f"{request.host_url.rstrip('/')}/claims/{claim['id']}/invoices"
                )
        return claims_list


@api.route("/claims/<int:id>")
class ClaimResource(Resource):
    @jwt_required()
    @admin_required
    @api.marshal_with(claim_model)
    def get(self, id):
        """
        Get a claim by ID.
        """
        db = get_db()
        claim = db.execute("SELECT * FROM Claims WHERE id = ?", (id,)).fetchone()
        if not claim:
            return {"message": "Claim not found"}, 404

        claim_dict = dict(claim)
        if claim_dict.get("invoices"):
            claim_dict["invoices"] = (
                f"{request.host_url.rstrip('/')}/claims/{id}/invoices"
            )
        return claim_dict

    @jwt_required()
    @admin_required
    @api.expect(claim_model)
    def put(self, id):
        """
        Update a claim by ID. If the status changes to 'Reviewing', create processing checks.
        """
        db = get_db()
        claim = db.execute("SELECT * FROM Claims WHERE id = ?", (id,)).fetchone()
        if not claim:
            return {"message": "Claim not found"}, 404

        print("Request JSON", request.json)
        updated_data = request.json
        print("Updated Data", updated_data)
        print("Type of updated_data", type(updated_data))
        new_status = updated_data.get("internal_status")

        if (
            new_status
            and new_status == "Reviewing"
            and claim["internal_status"] != "Reviewing"
        ):
            updated_data["status"] = "Reviewing"
            existing_checks = db.execute(
                "SELECT COUNT(*) FROM ClaimsProcessingChecks WHERE claim_id = ?", (id,)
            ).fetchone()[0]

            policy_obj = get_policy_processing_object(id)
            if existing_checks == 0:
                # Create processing checks
                checks = get_checks_for_claim(policy_obj)
                for check in checks:
                    db.execute(
                        """
                        INSERT INTO ClaimsProcessingChecks 
                        (claim_id, check_name, expected_value, reviewed_value, operator, status, result_message, processed_at)
                        VALUES (?, ?, ?, ?, ?, 'Pending', NULL, NULL)
                    """,
                        (id, check[0], check[1], check[2], check[3]),
                    )

        # Update the claim with new data
        db.execute(
            """
            UPDATE Claims
            SET policy_id = ?,
                claim_date = ?,
                damage_date = ?,
                date_of_repair = ?,
                invoices = ?,
                status = ?,
                status_message = ?,
                internal_status = ?,
                internal_status_message = ?
            WHERE id = ?
            """,
            (
                updated_data.get("policy_id", claim["policy_id"]),
                updated_data.get("claim_date", claim["claim_date"]),
                updated_data.get("damage_date", claim["damage_date"]),
                updated_data.get("date_of_repair", claim["date_of_repair"]),
                updated_data.get("invoices", claim["invoices"]),
                updated_data.get("status", claim["status"]),
                updated_data.get("status_message", claim["status_message"]),
                updated_data.get("internal_status", claim["internal_status"]),
                updated_data.get(
                    "internal_status_message", claim["internal_status_message"]
                ),
                id,
            ),
        )
        db.commit()

        updated_claim = db.execute(
            "SELECT * FROM Claims WHERE id = ?", (id,)
        ).fetchone()
        return dict(updated_claim)


@api.route("/claims/<int:id>/policy")
class ClaimPolicyResource(Resource):
    @jwt_required()
    @admin_required
    @api.marshal_with(combined_policy_model)
    def get(self, id):
        """
        Get the policy details associated with a specific claim.
        """
        return get_policy_processing_object(id)


@api.route("/claims/<int:id>/invoices")
class ClaimInvoiceResource(Resource):
    @jwt_required()
    @admin_required
    def get(self, id):
        """
        Endpoint to download the invoice file
        """
        db = get_db()
        # Retrieve the claim's invoice path
        claim = db.execute("SELECT invoices FROM Claims WHERE id = ?", (id,)).fetchone()
        if not claim or not claim["invoices"]:
            return {"message": "Invoice file not found for this claim"}, 404

        invoice_path = claim["invoices"]
        directory, filename = os.path.split(invoice_path)

        if not os.path.exists(invoice_path):
            return {"message": "Invoice file not found on disk"}, 404

        try:
            # Serve the file from the directory
            return send_from_directory(directory, filename, as_attachment=True)
        except Exception as e:
            return {"message": f"Error retrieving invoice: {str(e)}"}, 500


@api.route("/claims/<int:id>/checks")
class ClaimChecksResource(Resource):
    @jwt_required()
    @api.marshal_list_with(check_model)
    @admin_required
    def get(self, id):
        """
        Get a list of processing checks associated with a specific claim.
        """
        db = get_db()
        checks = db.execute(
            "SELECT * FROM ClaimsProcessingChecks WHERE claim_id = ?", (id,)
        ).fetchall()

        # Convert the result to a list of dictionaries
        checks_list = [dict(check) for check in checks]
        return checks_list


@api.route("/claims/<int:claim_id>/checks/<int:check_id>")
class ClaimCheckResource(Resource):
    @jwt_required()
    @admin_required
    @api.expect(check_update_model)
    def put(self, claim_id, check_id):
        """
        Update the status and result_message of a specific check.
        """
        db = get_db()
        check = db.execute(
            "SELECT * FROM ClaimsProcessingChecks WHERE id = ? AND claim_id = ?",
            (check_id, claim_id),
        ).fetchone()

        if not check:
            return {"message": "Check not found"}, 404

        updated_data = request.json
        new_status = updated_data.get("status", check["status"])
        new_result_message = updated_data.get("result_message", check["result_message"])
        new_reviewed_value = updated_data.get("reviewed_value", check["reviewed_value"])
        new_processed_at = datetime.now()

        db.execute(
            """
            UPDATE ClaimsProcessingChecks
            SET status = ?, result_message = ?, reviewed_value = ?, processed_at = ?
            WHERE id = ? AND claim_id = ?
            """,
            (
                new_status,
                new_result_message,
                new_reviewed_value,
                new_processed_at,
                check_id,
                claim_id,
            ),
        )
        db.commit()

        updated_check = db.execute(
            "SELECT * FROM ClaimsProcessingChecks WHERE id = ? AND claim_id = ?",
            (check_id, claim_id),
        ).fetchone()

        return dict(updated_check)


def get_checks_for_claim(policy_obj):
    policy = policy_obj["policy"]
    policy_holder = policy_obj["policy_holder"]
    checks = {}
    if policy["type"] == "Windscreen":
        checks["Windscreen"] = [
            (
                "Verify damage_date is before claim_date",
                "damage_date < claim_date",
                None,
                "<",
            ),
            (
                "Verify claim_date is after date_of_repair",
                "date_of_repair < claim_date",
                None,
                "<",
            ),
            (
                "Verify the invoice receipt date and date of repair are within 14 days of each other",
                "date_of_repair - receipt_date <= 14",
                None,
                "<=",
            ),
            (
                "Verify License Plate of policy is on the invoice",
                policy["vehicle"]["license_plate"],
                None,
                "IN",
            ),
            (
                "Verify Policy Number is on the invoice",
                policy["policy_number"],
                None,
                "IN",
            ),
            (
                "Verify Name on the invoice reasonably matches the policy holder",
                f'{policy_holder["first_name"]} {policy_holder["last_name"]}',
                None,
                "=",
            ),
            (
                "Verify Claim Total invoiced cost does not exceed 1200",
                "1200",
                None,
                "<=",
            ),
            (
                "Verify the Claim invoiced total exceeds deductible",
                policy["deductible"],
                None,
                ">",
            ),
            (
                "Verify labor invoiced costs are in range",
                "0<=cost<=150 or not present",
                None,
                "<=",
            ),
            (
                "Verify the adhesive set invoiced costs are in range",
                "0<=cost<=40 or not present",
                None,
                "<=",
            ),
            (
                "Verify Env and small materials invoiced costs are in range",
                "0<=cost<=10 or not present",
                None,
                "<=",
            ),
            (
                "Verify Sensor invoiced costs are in range",
                "0<=cost<=10 or not present",
                None,
                "<=",
            ),
            (
                "Verify the calibration invoiced costs are in range",
                "0<=cost<=100 or not present",
                None,
                "<=",
            ),
        ]
    checks["Device"] = [
        (
            "Determine and record the depreciated value of device based on purchase date and current replacement value",
            None,
            None,
            None,
        ),
        (
            "Check the current prices online to determine replacement value",
            None,
            None,
            None,
        ),
        ("Determine the repair cost of the device", None, None, None),
        (
            "Find the minimum of the replacement value and repair cost",
            "min(replacement_value, repair_cost)",
            None,
            "min",
        ),
    ]
    return checks[policy["type"]]
    # return [
    # (
    # "Verify damage_date is before claim_date",
    # "damage_date < claim_date",
    # None,
    # "<",
    # )
    # ]


def get_policy_processing_object(id):
    db = get_db()
    # Get the claim to find the policy_id
    claim = db.execute("SELECT policy_id FROM Claims WHERE id = ?", (id,)).fetchone()
    if not claim:
        return {"message": "Claim not found"}, 404

    policy = db.execute(
        "SELECT * FROM Policy WHERE id = ?", (claim["policy_id"],)
    ).fetchone()
    if not policy:
        return {"message": "Policy not found"}, 404

    # Get the associated user
    user = db.execute(
        "SELECT * FROM User WHERE id = ?", (policy["user_id"],)
    ).fetchone()

    # Get the associated vehicle if applicable
    vehicle = None
    if policy["vehicle_id"]:
        vehicle = db.execute(
            "SELECT * FROM Vehicles WHERE id = ?", (policy["vehicle_id"],)
        ).fetchone()

    # You can add similar logic for devices if needed
    device = None
    if policy["device_id"]:
        device = db.execute(
            "SELECT * FROM Devices WHERE id = ?", (policy["device_id"],)
        ).fetchone()

    # Construct the response
    policy_data = dict(policy)
    if vehicle:
        policy_data["vehicle"] = dict(vehicle)

    if device:
        policy_data["device"] = dict(device)

    combined_policy = {"policy": policy_data, "policy_holder": dict(user)}

    return combined_policy


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5100, debug=True)
