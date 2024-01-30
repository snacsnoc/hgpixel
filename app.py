from flask import Flask, request
import json

app = Flask(__name__)

@app.route('/track', methods=['POST'])
def track_event():
    data = json.loads(request.data)
    # Do stuff here for fun
    print(data)
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
