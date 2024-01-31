import sqlite3
from flask import Flask, request, jsonify, g, render_template
import json

DATABASE = "tracking_data.db"


def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


# Initialize our SQLite DB
def init_db(app):
    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            """CREATE TABLE IF NOT EXISTS tracking_events 
                          (id INTEGER PRIMARY KEY, clientID TEXT, eventType TEXT, eventData TEXT, 
                           sessionId TEXT, userId TEXT, timestamp TEXT, url TEXT, 
                           referrer TEXT, userAgent TEXT, deviceInfo TEXT)"""
        )
        db.commit()


def create_app():
    app = Flask(__name__)

    # Gracefully close the database connection when the application shuts down
    @app.teardown_appcontext
    def close_connection(exception):
        db = getattr(g, "_database", None)
        if db is not None:
            db.close()

    # Route to receive pixel data
    @app.route("/track", methods=["POST"])
    def track_event():
        content_type = request.headers.get('Content-Type')
        print("Request type: ", content_type)
        if content_type == 'application/json':
            data = request.get_json()
        elif content_type == 'text/plain;charset=UTF-8':
            data = json.loads(request.data.decode('utf-8'))
        else:
            return 'Unsupported Media Type', 415

        db = get_db()
        cursor = db.cursor()


        print("Client ID:", data['clientID'])
        cursor.execute(
            "INSERT INTO tracking_events (clientID, eventType, eventData, sessionId, userId, timestamp, url, referrer, userAgent, deviceInfo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                data["clientID"],
                data["eventType"],
                json.dumps(data["eventData"]),
                data["sessionId"],
                data["userId"],
                data["timestamp"],
                data["url"],
                data["referrer"],
                data["userAgent"],
                json.dumps(data["deviceInfo"]),
            ),
        )

        db.commit()
        return "", 204

    # Route to view the data stored in the database.
    # The query parameters can be used to filter the data.
    # For example, if the userId is provided, the data will be filtered by userId
    @app.route("/view-data", methods=["GET"])
    def view_data():
        db = get_db()
        cursor = db.cursor()

        query_parameters = request.args
        url = query_parameters.get("url")
        userId = query_parameters.get("userId")

        query = "SELECT * FROM tracking_events"
        to_filter = []

        if url:
            query += " WHERE url=?"
            to_filter.append(url)
        if userId:
            if url:
                query += " AND"
            else:
                query += " WHERE"
            query += " userId=?"
            to_filter.append(userId)

        cursor.execute(query, to_filter)
        rows = cursor.fetchall()

        result = []
        for row in rows:
            result.append(
                {
                    "clientID": row[1],
                    "eventType": row[2],
                    "eventData": row[3],
                    "sessionId": row[4],
                    "userId": row[5],
                    "timestamp": row[6],
                    "url": row[7],
                    "referrer": row[8],
                    "userAgent": row[9],
                    "deviceInfo": row[10],
                }
            )

        return render_template("view_data.html", result=result)

    with app.app_context():
        init_db(app)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
