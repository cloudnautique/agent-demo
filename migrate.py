import sqlite3
import hashlib

def create_tables():
    # Connect to the SQLite database (or create it if it doesn't exist)
    conn = sqlite3.connect("insurance.db")
    cursor = conn.cursor()

    # Enable foreign key constraints
    cursor.execute("PRAGMA foreign_keys = ON")

    # Create the User table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            username TEXT UNIQUE,
            password TEXT
        )
    """
    )

    # Create the Policy table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Policy (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL CHECK(type IN ('Windscreen', 'Device')),  -- Policy type can be either 'Vehicle' or 'Device'
            user_id INTEGER NOT NULL,
            policy_number TEXT NOT NULL UNIQUE,
            deductible REAL,
            device_id INTEGER UNIQUE,       -- Foreign key to Devices table (optional, 1:1 relationship)
            vehicle_id INTEGER UNIQUE,      -- Foreign key to Vehicles table (optional, 1:1 relationship)
            FOREIGN KEY (user_id) REFERENCES User(id),
            FOREIGN KEY (device_id) REFERENCES Devices(id),
            FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id)
        )
    """
    )

    # Create the Devices table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            manufacturer TEXT NOT NULL,
            model TEXT NOT NULL,
            storage TEXT,
            serial_number TEXT UNIQUE,
            purchase_date DATETIME,
            purchase_amount REAL,
            purchase_location TEXT
            depreciation_years INTEGER,
            depreciation_rate REAL
        )
    """
    )

    # Create the Vehicles table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            license_plate TEXT UNIQUE,
            drivers TEXT  -- List of user IDs or names, could be handled differently depending on needs
        )
    """
    )

    # Create the Claims table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            policy_id INTEGER NOT NULL,
            claim_date DATETIME NOT NULL DEFAULT (datetime('now')),  -- Date when the claim was created (required)
            damage_date DATETIME NOT NULL,      -- Date when the damage occurred(required)
            date_of_repair DATETIME NOT NULL,   -- Date when the repair was completed (required)
            invoices TEXT NOT NULL,             -- Stores the file location of the invoice on disk
            status TEXT NOT NULL DEFAULT 'Pending',  -- Status of the claim (Pending, Reviewing, Approved, Denied)
            status_message TEXT,                -- Message from the insurance company regarding the claim status
            internal_status TEXT NOT NULL DEFAULT 'Pending',  -- Status of the claim (Pending, Reviewing, 2nd Level Review, Approved, Denied)
            internal_status_message TEXT,                -- Message from the insurance company regarding the claim status
            FOREIGN KEY (policy_id) REFERENCES Policy(id)
        )
    """
    )

    # Create the ClaimsProcessingChecks table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS ClaimsProcessingChecks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_id INTEGER NOT NULL,  -- Reference to the claim being processed
            check_name TEXT NOT NULL,  -- Name of the check being performed
            expected_value TEXT,  -- The expected value or threshold to perform the check against
            reviewed_value TEXT,  -- The actual value or result of the check
            operator TEXT,  -- The operator used to compare the values (e.g., '>', '<', '==')
            status TEXT NOT NULL DEFAULT 'Pending',  -- Status of the check (Pending, Passed, Failed)
            result_message TEXT,  -- Message with details about the check result
            processed_at DATETIME,  -- When the check was processed
            cause_of_damage TEXT, -- The cause of the damage for devices
            FOREIGN KEY (claim_id) REFERENCES Claims(id)
        )
    """
    )

    # Create the Shops table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS Shops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            standing TEXT
        )
    """
    )

    # Commit the transaction and close the connection
    conn.commit()
    conn.close()

def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def seed_database():
    conn = sqlite3.connect("insurance.db")
    conn.row_factory = sqlite3.Row
    admin_exists = conn.execute(
        'SELECT * FROM User WHERE username = "admin"'
    ).fetchone()
    if not admin_exists:
        hashed_password = hash_password("samsonite")  # Replace with a secure password
        conn.execute(
            "INSERT INTO User (first_name, last_name, username, password, email) VALUES (?, ?, ?, ?, ?)",
            ("Admin", "User", "admin", hashed_password, "admin@example.com"),
        )
        conn.commit()
    conn.close()

def integrity_check():
    conn = sqlite3.connect("insurance.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("PRAGMA integrity_check;")
    result = cursor.fetchone()
    print("Result", dict(result))

if __name__ == "__main__":
    create_tables()
    print("Tables created successfully.")
    seed_database()
    print("Database seeded successfully.")
    integrity_check()
