# from flask import Flask, render_template, request, jsonify, redirect, session, url_for, flash
# from functools import wraps
# from datetime import datetime
# from config import Config
# from models import db, User, Login, DroneInfo, DroneTagData
# import requests
# import json
# import logging
# import psycopg2

# # Flask App Setup
# app = Flask(__name__)
# app.secret_key = 'supersecretkey123'
# app.config.from_object(Config)
# db.init_app(app)

# # Configure logging
# logging.basicConfig(level=logging.DEBUG)

# # ----------------------------------------
# # Login Required Decorator
# # ----------------------------------------
# def login_required(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         if 'user_id' not in session:
#             return redirect(url_for('login', next=request.url))
#         return f(*args, **kwargs)
#     return decorated_function

# # ----------------------------------------
# # Routes
# # ----------------------------------------
# @app.route('/')
# def home():
#     return render_template('cover.html')

# @app.route('/cover')
# def cover():
#     return render_template('cover.html')

# @app.route('/index')
# @login_required
# def index():
#     return render_template('index.html')

# @app.route('/aboutus')
# def aboutus():
#     return render_template('aboutus.html')

# @app.route('/help')
# def help_page():
#     return render_template('help.html')

# @app.route('/support')
# def support_page():
#     return render_template('support.html')

# @app.route('/settings', methods=['GET', 'POST'])
# def settings_page():
#     if 'user_id' not in session:
#         return redirect('/login')

#     user = db.session.get(User, session['user_id'])
#     message = None

#     if request.method == 'POST':
#         new_email = request.form.get('email')
#         new_phone = request.form.get('phone')
#         new_password = request.form.get('password')

#         if new_email and new_email != user.email:
#             user.email = new_email

#         if new_phone and new_phone != user.phone:
#             user.phone = new_phone

#         if new_password:
#             user.password = new_password  # plain-text

#         db.session.commit()
#         message = "Settings updated successfully."

#     return render_template("settings.html", user=user, message=message)

# @app.route('/dashboard')
# @login_required
# def dashboard():
#     tracker_id = request.args.get('tracker_id')
#     if not tracker_id:
#         flash("No tracker ID provided", "warning")
#         return redirect(url_for('index'))
#     return render_template('dashboard.html', tracker_id=tracker_id)

# @app.route('/register', methods=['GET', 'POST'])
# def register():
#     if request.method == 'POST':
#         username = request.form.get('username')
#         email = request.form.get('email')
#         phone = request.form.get('phone')
#         password = request.form.get('password')
#         tracker_id = request.form.get('tracker_id')
#         uin = request.form.get('uin')
#         category = request.form.get('category')
#         application = request.form.get('application')

#         existing_user = User.query.filter((User.phone == phone) | (User.email == email)).first()
#         if existing_user:
#             flash('User with this phone or email already exists.', 'danger')
#             return render_template('register.html')

#         existing_drone = DroneInfo.query.filter_by(tracker_id=tracker_id).first()
#         if existing_drone:
#             flash('Drone with this tracker ID already exists.', 'danger')
#             return render_template('register.html')

#         try:
#             new_user = User(
#                 username=username,
#                 email=email,
#                 phone=phone,
#                 password=password,
#                 tracker_id=tracker_id,
#                 uin=uin,
#                 category=category,
#                 application=application
#             )
#             db.session.add(new_user)
#             db.session.flush()

#             new_drone = DroneInfo(
#                 tracker_id=tracker_id,
#                 uin=uin,
#                 category=category,
#                 application=application,
#                 registered_on=datetime.utcnow()
#             )
#             db.session.add(new_drone)

#             login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
#             db.session.add(login_log)

#             db.session.commit()
#             session['user_id'] = new_user.id
#             flash('Registration successful! Please log in.', 'success')
#             return redirect(url_for('login'))

#         except Exception as e:
#             db.session.rollback()
#             logging.error("Registration Error: %s", e)
#             flash('Registration failed. Please try again.', 'danger')
#             return render_template('register.html')

#     return render_template('register.html')

# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         phone = request.form.get('phone')
#         password = request.form.get('password')

#         user = User.query.filter_by(phone=phone).first()

#         if user and user.password == password:
#             session['user_id'] = user.id
#             login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
#             db.session.add(login_log)
#             db.session.commit()
#             next_page = request.args.get('next')
#             return redirect(next_page or url_for('index'))
#         else:
#             flash("Invalid phone number or password.", "danger")

#     return render_template("login.html")

# # ----------------------------------------
# # 🛰️ Trajectory API with timestamp fix
# # ----------------------------------------
# @app.route("/api/trajectory", methods=["POST"])
# def get_trajectory():
#     try:
#         data = request.get_json()
#         tracker_id = data.get("tracker_id")
#         interval_seconds = data.get("interval_seconds", 30)

#         if not tracker_id:
#             return jsonify({"error": "Tracker ID is required"}), 400

#         aws_response = requests.post(
#             "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
#             json={"TrackerId": tracker_id},
#             timeout=10
#         )
#         aws_response.raise_for_status()
#         aws_data = aws_response.json()

#         body = aws_data.get("body")
#         if isinstance(body, str):
#             body = json.loads(body)

#         raw_points = body.get("Telemetry", [])
#         image_urls = body.get("Images", [])

#         # ✅ Flexible timestamp parser
#         def parse_dt(ts):
#             if not ts:
#                 return None
#             try:
#                 return datetime.fromisoformat(ts.replace("Z", "+00:00"))
#             except ValueError:
#                 try:
#                     return datetime.strptime(ts, "%d-%m-%Y %H:%M:%S")
#                 except ValueError:
#                     logging.error("Unknown timestamp format: %s", ts)
#                     return None

#         sampled = []
#         last = None

#         for p in raw_points:
#             ts = parse_dt(p.get("Timestamp"))
#             if ts is None:
#                 continue
#             if last is None or (ts - last).total_seconds() >= interval_seconds:
#                 sampled.append({
#                     "lat": p.get("Latitude"),
#                     "lon": p.get("Longitude"),
#                     "timestamp": p.get("Timestamp"),
#                     "altitude": p.get("Altitude"),
#                     "uin": p.get("DroneUINNumber"),
#                     "category": p.get("DroneCategory"),
#                     "application": p.get("DroneApplication")
#                 })
#                 last = ts

#         return jsonify({
#             "points": sampled,
#             "images": image_urls
#         })

#     except Exception as e:
#         logging.error("AWS API Error: %s", e)
#         return jsonify({"error": str(e)}), 500



# # # ----------------------------------------
# # # 🛰️ Existing API: Full Data from AWS
# # # ----------------------------------------
# # @app.route('/api/data', methods=['POST'])
# # @login_required
# # def get_data():
# #     try:
# #         payload = request.get_json() if request.is_json else json.loads(request.data.decode('utf-8'))
# #         tracker_id = payload.get('tracker_id', '').strip()
# #         if not tracker_id:
# #             return jsonify({"error": "Tracker ID is required"}), 400

# #         api_response = requests.post(
# #             "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
# #             json={"TrackerId": tracker_id},
# #             timeout=10
# #         )
# #         api_response.raise_for_status()
# #         data = api_response.json()

# #         telemetry = []
# #         images = []

# #         if isinstance(data.get('body'), str):
# #             try:
# #                 body_data = json.loads(data['body'])
# #                 telemetry = body_data.get('Telemetry', [])
# #                 images = body_data.get('Images', [])
# #             except json.JSONDecodeError:
# #                 return jsonify({"error": "Invalid JSON in API response body"}), 502
# #         elif isinstance(data.get('body'), dict):
# #             telemetry = data['body'].get('Telemetry', [])
# #             images = data['body'].get('Images', [])

# #         return jsonify({
# #             "TrackerId": tracker_id,
# #             "Telemetry": telemetry,
# #             "Images": images
# #         })

# #     except requests.RequestException as e:
# #         return jsonify({"error": f"API request failed: {str(e)}"}), 502
# #     except Exception as e:
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # # ----------------------------------------
# # # 📍 NEW: Trajectory API (sorted + 30s downsample, optional time window)
# # # ----------------------------------------
# # @app.route('/api/trajectory', methods=['POST'])
# # @login_required
# # def get_trajectory():
# #     """
# #     Request JSON:
# #       {
# #         "tracker_id": "ABC123",
# #         "start_time": "2025-08-23T10:00:00",   # optional
# #         "end_time":   "2025-08-23T11:00:00",   # optional
# #         "interval_seconds": 30,                # optional (default 30)
# #         "max_gap_seconds": 120                 # optional (default 120)
# #       }
# #     Response:
# #       {
# #         "tracker_id": "...",
# #         "points": [{"lat":..., "lon":..., "timestamp":"..."}, ...],
# #         "images": [...]
# #       }
# #     """
# #     try:
# #         payload = request.get_json(force=True)
# #         tracker_id = (payload.get('tracker_id') or '').strip()
# #         if not tracker_id:
# #             return jsonify({"error": "Tracker ID is required"}), 400

# #         start_time = payload.get('start_time')
# #         end_time = payload.get('end_time')
# #         interval_seconds = int(payload.get('interval_seconds') or 30)
# #         max_gap_seconds = int(payload.get('max_gap_seconds') or 120)

# #         # Reuse the AWS call from /api/data
# #         api_response = requests.post(
# #             "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
# #             json={"TrackerId": tracker_id},
# #             timeout=10
# #         )
# #         api_response.raise_for_status()
# #         data = api_response.json()

# #         if isinstance(data.get('body'), str):
# #             body = json.loads(data['body'])
# #         else:
# #             body = data.get('body', {})

# #         telemetry = body.get('Telemetry', []) or []
# #         images = body.get('Images', []) or []

# #         # Normalize + optional window filter
# #         def parse_ts(ts_str):
# #             # Accept ISO or "dd-mm-yyyy HH:MM:SS"
# #             try:
# #                 return parse_datetime(ts_str)
# #             except Exception:
# #                 try:
# #                     return datetime.strptime(ts_str, "%d-%m-%Y %H:%M:%S")
# #                 except Exception:
# #                     return None

# #         start_dt = parse_datetime(start_time) if start_time else None
# #         end_dt = parse_datetime(end_time) if end_time else None

# #         norm = []
# #         for row in telemetry:
# #             ts = parse_ts(row.get('Timestamp'))
# #             if not ts:
# #                 continue
# #             if start_dt and ts < start_dt:
# #                 continue
# #             if end_dt and ts > end_dt:
# #                 continue
# #             try:
# #                 lat = float(row.get('Latitude'))
# #                 lon = float(row.get('Longitude'))
# #             except (TypeError, ValueError):
# #                 continue
# #             norm.append({"lat": lat, "lon": lon, "timestamp": ts})

# #         # Sort by time
# #         norm.sort(key=lambda x: x["timestamp"])

# #         # Downsample by fixed 30s (or provided interval)
# #         sampled = []
# #         last_kept = None
# #         for p in norm:
# #             if last_kept is None or (p["timestamp"] - last_kept) >= timedelta(seconds=interval_seconds):
# #                 sampled.append(p)
# #                 last_kept = p["timestamp"]

# #         # Return ISO timestamps
# #         points = [{"lat": p["lat"], "lon": p["lon"], "timestamp": p["timestamp"].isoformat()} for p in sampled]

# #         return jsonify({
# #             "tracker_id": tracker_id,
# #             "points": points,
# #             "images": images,
# #             "max_gap_seconds": max_gap_seconds,
# #             "interval_seconds": interval_seconds
# #         })

# #     except Exception as e:
# #         logging.exception("Trajectory API failed")
# #         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # ----------------------------------------
# # DB Filter
# # ----------------------------------------
# from dateutil.parser import parse as parse_datetime

# @app.route('/api/data/filter', methods=['POST'])
# def filter_telemetry_data():
#     try:
#         data = request.get_json()
#         tracker_id = data.get('tracker_id')
#         start_time_str = data.get('start_time')
#         end_time_str = data.get('end_time')

#         if not tracker_id or not start_time_str or not end_time_str:
#             return jsonify({'error': 'Missing parameters'}), 400

#         start_time = parse_datetime(start_time_str)
#         end_time = parse_datetime(end_time_str)

#         filtered_data = DroneTagData.query.filter(
#             DroneTagData.TrackerId == tracker_id,
#             DroneTagData.Timestamp >= start_time,
#             DroneTagData.Timestamp <= end_time
#         ).order_by(DroneTagData.Timestamp.asc()).all()

#         result = [{
#             'TrackerId': row.TrackerId,
#             'Latitude': row.Latitude,
#             'Longitude': row.Longitude,
#             'Timestamp': row.Timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#             'Altitude': row.Altitude,
#             'DroneUINNumber': row.DroneUINNumber,
#             'DroneCategory': row.DroneCategory,
#             'DroneApplication': row.DroneApplication
#         } for row in filtered_data]

#         return jsonify(result)

#     except Exception as e:
#         logging.error("Error in /api/data/filter: %s", e)
#         return jsonify({'error': str(e)}), 500

# # ----------------------------------------
# # Other routes (account, logout, store/fetch drone data)
# # ----------------------------------------
# @app.route('/test_db')
# def test_db():
#     try:
#         conn = psycopg2.connect(
#             dbname="Drone-Tag",
#             user="postgres",
#             password="Harvi@57",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()
#         cur.execute("SELECT * FROM registration;")
#         rows = cur.fetchall()
#         cur.close()
#         conn.close()
#         return "<h2>Connection successful!</h2><pre>{}</pre>".format(rows)
#     except Exception as e:
#         return f"<h2>Connection failed:</h2><pre>{e}</pre>"

# @app.route('/account')
# @login_required
# def account():
#     user = User.query.get(session['user_id'])
#     return render_template('account.html', user=user)

# @app.route('/logout')
# def logout():
#     session.clear()
#     flash('Logged out successfully!', 'info')
#     return redirect(url_for('cover'))

# @app.route('/api/drone-data', methods=['POST'])
# def store_drone_data():
#     data = request.json
#     new_entry = DroneTagData(
#         altitude=data.get('altitude'),
#         drone_application=data.get('drone_application'),
#         drone_category=data.get('drone_category'),
#         drone_uin_number=data.get('drone_uin_number'),
#         latitude=data.get('latitude'),
#         longitude=data.get('longitude'),
#         maplink=data.get('maplink'),
#         timestamp=datetime.strptime(data.get('timestamp'), "%Y-%m-%d %H:%M:%S"),
#         tracker_id=data.get('tracker_id')
#     )
#     db.session.add(new_entry)
#     db.session.commit()
#     return jsonify({"message": "Data stored successfully"}), 201

# @app.route('/api/drone-data', methods=['GET'])
# def fetch_drone_data():
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#     tracker_id = request.args.get('tracker_id')

#     query = DroneTagData.query

#     if start_date and end_date:
#         start_dt = datetime.strptime(start_date, "%Y-%m-%d")
#         end_dt = datetime.strptime(end_date, "%Y-%m-%d")
#         query = query.filter(DroneTagData.timestamp.between(start_dt, end_dt))

#     if tracker_id:
#         query = query.filter_by(tracker_id=tracker_id)

#     results = query.all()
#     output = [{
#         "id": row.id,
#         "altitude": float(row.altitude),
#         "drone_application": row.drone_application,
#         "drone_category": row.drone_category,
#         "drone_uin_number": row.drone_uin_number,
#         "latitude": row.latitude,
#         "longitude": row.longitude,
#         "maplink": row.maplink,
#         "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#         "tracker_id": row.tracker_id
#     } for row in results]

#     return jsonify(output)

# # ----------------------------------------
# # Start App
# # ----------------------------------------
# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True) 








#  ---------------------testing code---------------------------------------------------------------------


# from flask import Flask, render_template, request, jsonify, redirect, session, url_for, flash
# from functools import wraps
# from datetime import datetime, timedelta
# from dateutil.parser import parse as parse_datetime
# from config import Config
# from models import db, User, Login, DroneInfo, DroneTagData
# import requests
# import json
# import logging
# import psycopg2

# # -----------------------------
# # Flask App Setup
# # -----------------------------
# app = Flask(__name__)
# app.secret_key = 'supersecretkey123'
# app.config.from_object(Config)
# db.init_app(app)

# logging.basicConfig(level=logging.DEBUG)

# # -----------------------------
# # Login Required Decorator
# # -----------------------------
# def login_required(f):
#     @wraps(f)
#     def decorated_function(*args, **kwargs):
#         if 'user_id' not in session:
#             return redirect(url_for('login', next=request.url))
#         return f(*args, **kwargs)
#     return decorated_function

# # -----------------------------
# # Public Routes
# # -----------------------------
# @app.route('/')
# @app.route('/cover')
# def cover():
#     return render_template('cover.html')

# @app.route('/aboutus')
# def aboutus():
#     return render_template('aboutus.html')

# @app.route('/help')
# def help_page():
#     return render_template('help.html')

# @app.route('/support')
# def support_page():
#     return render_template('support.html')

# # -----------------------------
# # Auth Routes
# # -----------------------------
# @app.route('/register', methods=['GET', 'POST'])
# def register():
#     if request.method == 'POST':
#         username = request.form.get('username')
#         email = request.form.get('email')
#         phone = request.form.get('phone')
#         password = request.form.get('password')
#         tracker_id = request.form.get('tracker_id')
#         uin = request.form.get('uin')
#         category = request.form.get('category')
#         application = request.form.get('application')

#         # Check existing user
#         if User.query.filter((User.phone == phone) | (User.email == email)).first():
#             flash('User with this phone or email already exists.', 'danger')
#             return render_template('register.html')

#         # Check existing drone
#         if DroneInfo.query.filter_by(tracker_id=tracker_id).first():
#             flash('Drone with this tracker ID already exists.', 'danger')
#             return render_template('register.html')

#         try:
#             # Create user
#             new_user = User(
#                 username=username,
#                 email=email,
#                 phone=phone,
#                 password=password,
#                 tracker_id=tracker_id,
#                 uin=uin,
#                 category=category,
#                 application=application
#             )
#             db.session.add(new_user)
#             db.session.flush()

#             # Register drone
#             new_drone = DroneInfo(
#                 tracker_id=tracker_id,
#                 uin=uin,
#                 category=category,
#                 application=application,
#                 registered_on=datetime.utcnow()
#             )
#             db.session.add(new_drone)

#             # Log login
#             login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
#             db.session.add(login_log)

#             db.session.commit()
#             session['user_id'] = new_user.id
#             flash('Registration successful! Please log in.', 'success')
#             return redirect(url_for('login'))

#         except Exception as e:
#             db.session.rollback()
#             logging.error("Registration Error: %s", e)
#             flash('Registration failed. Please try again.', 'danger')
#             return render_template('register.html')

#     return render_template('register.html')


# @app.route('/login', methods=['GET', 'POST'])
# def login():
#     if request.method == 'POST':
#         phone = request.form.get('phone')
#         password = request.form.get('password')

#         user = User.query.filter_by(phone=phone).first()
#         if user and user.password == password:
#             session['user_id'] = user.id
#             login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
#             db.session.add(login_log)
#             db.session.commit()
#             next_page = request.args.get('next')
#             return redirect(next_page or url_for('index'))
#         else:
#             flash("Invalid phone number or password.", "danger")

#     return render_template("login.html")


# @app.route('/logout')
# def logout():
#     session.clear()
#     flash('Logged out successfully!', 'info')
#     return redirect(url_for('cover'))

# # -----------------------------
# # User Dashboard & Settings
# # -----------------------------
# @app.route('/index')
# @login_required
# def index():
#     return render_template('index.html')


# @app.route('/dashboard')
# @login_required
# def dashboard():
#     tracker_id = request.args.get('tracker_id')
#     if not tracker_id:
#         flash("No tracker ID provided", "warning")
#         return redirect(url_for('index'))
#     return render_template('dashboard.html', tracker_id=tracker_id)


# @app.route('/account')
# @login_required
# def account():
#     user = User.query.get(session['user_id'])
#     return render_template('account.html', user=user)


# @app.route('/settings', methods=['GET', 'POST'])
# @login_required
# def settings_page():
#     user = db.session.get(User, session['user_id'])
#     message = None

#     if request.method == 'POST':
#         new_email = request.form.get('email')
#         new_phone = request.form.get('phone')
#         new_password = request.form.get('password')

#         if new_email and new_email != user.email:
#             user.email = new_email

#         if new_phone and new_phone != user.phone:
#             user.phone = new_phone

#         if new_password:
#             user.password = new_password  # plain-text

#         db.session.commit()
#         message = "Settings updated successfully."

#     return render_template("settings.html", user=user, message=message)

# # -----------------------------
# # API: Fetch Drone Data from AWS
# # -----------------------------
# @app.route('/api/data', methods=['POST'])
# @login_required
# def get_data():
#     try:
#         payload = request.get_json(force=True)
#         tracker_id = (payload.get('tracker_id') or '').strip()
#         if not tracker_id:
#             return jsonify({"error": "Tracker ID is required"}), 400

#         api_response = requests.post(
#             "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
#             json={"TrackerId": tracker_id},
#             timeout=10
#         )
#         api_response.raise_for_status()
#         data = api_response.json()

#         body = data.get('body')
#         if isinstance(body, str):
#             try:
#                 body = json.loads(body)
#             except json.JSONDecodeError:
#                 return jsonify({"error": "Invalid JSON in API response body"}), 502

#         telemetry = body.get('Telemetry', []) or []
#         images = body.get('Images', []) or []
        
#          # Add drone info if available
#         drone_info = body.get('DroneInfo', {})  # AWS should send these fields
#         uin = drone_info.get('UIN') or "N/A"
#         category = drone_info.get('Category') or "N/A"
#         application = drone_info.get('Application') or "N/A"

#         return jsonify({
#             "TrackerId": tracker_id,
#             "Telemetry": telemetry,
#             "Images": images,
#             "UIN": uin,
#             "Category": category,
#             "Application": application
            
#         })

#     except requests.RequestException as e:
#         return jsonify({"error": f"API request failed: {str(e)}"}), 502
#     except Exception as e:
#         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # -----------------------------
# # API: Trajectory (Downsample + Time Window)
# # -----------------------------
# @app.route('/api/trajectory', methods=['POST'])
# @login_required
# def get_trajectory():
#     try:
#         payload = request.get_json(force=True)
#         tracker_id = (payload.get('tracker_id') or '').strip()
#         if not tracker_id:
#             return jsonify({"error": "Tracker ID is required"}), 400

#         start_time = payload.get('start_time')
#         end_time = payload.get('end_time')
#         interval_seconds = int(payload.get('interval_seconds') or 30)
#         max_gap_seconds = int(payload.get('max_gap_seconds') or 120)

#         # Fetch data from AWS
#         api_response = requests.post(
#             "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
#             json={"TrackerId": tracker_id},
#             timeout=10
#         )
#         api_response.raise_for_status()
#         data = api_response.json()

#         body = data.get('body')
#         if isinstance(body, str):
#             body = json.loads(body)
#         telemetry = body.get('Telemetry', []) or []
#         images = body.get('Images', []) or []

#         def parse_ts(ts_str):
#             if not ts_str:
#                 return None
#             try:
#                 return parse_datetime(ts_str)
#             except Exception:
#                 try:
#                     return datetime.strptime(ts_str, "%d-%m-%Y %H:%M:%S")
#                 except Exception:
#                     return None

#         start_dt = parse_datetime(start_time) if start_time else None
#         end_dt = parse_datetime(end_time) if end_time else None

#         norm = []
#         for row in telemetry:
#             ts = parse_ts(row.get('Timestamp'))
#             if not ts:
#                 continue
#             if start_dt and ts < start_dt:
#                 continue
#             if end_dt and ts > end_dt:
#                 continue
#             try:
#                 lat = float(row.get('Latitude'))
#                 lon = float(row.get('Longitude'))
#             except (TypeError, ValueError):
#                 continue
#             norm.append({"lat": lat, "lon": lon, "timestamp": ts})

#         norm.sort(key=lambda x: x["timestamp"])

#         # Downsample
#         sampled = []
#         last_kept = None
#         for p in norm:
#             if last_kept is None or (p["timestamp"] - last_kept) >= timedelta(seconds=interval_seconds):
#                 sampled.append(p)
#                 last_kept = p["timestamp"]

#         points = [{"lat": p["lat"], "lon": p["lon"], "timestamp": p["timestamp"].isoformat()} for p in sampled]

#         return jsonify({
#             "tracker_id": tracker_id,
#             "points": points,
#             "images": images,
#             "interval_seconds": interval_seconds,
#             "max_gap_seconds": max_gap_seconds
#         })

#     except Exception as e:
#         logging.exception("Trajectory API failed")
#         return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# # -----------------------------
# # API: Store/Fetch Drone Data (DB)
# # -----------------------------
# @app.route('/api/drone-data', methods=['POST'])
# def store_drone_data():
#     data = request.json
    
#      # Fetch from AWS if not present in payload
#     uin = data.get('drone_uin_number')
#     category = data.get('drone_category')
#     application = data.get('drone_application')

#     # If missing, fetch from AWS API
#     if not uin or not category or not application:
#         tracker_id = data.get('tracker_id')
#         if tracker_id:
#             try:
#                 aws_resp = requests.post(
#                     "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
#                     json={"TrackerId": tracker_id},
#                     timeout=10
#                 )
#                 body = aws_resp.json().get('body', {})
#                 if isinstance(body, str):
#                     body = json.loads(body)
#                 drone_info = body.get('DroneInfo', {})
#                 uin = uin or drone_info.get('UIN')
#                 category = category or drone_info.get('Category')
#                 application = application or drone_info.get('Application')
#             except:
#                 pass  # fallback to None
            
            
#     new_entry = DroneTagData(
#         altitude=data.get('altitude'),
#         drone_application=data.get('drone_application'),
#         drone_category=data.get('drone_category'),
#         drone_uin_number=data.get('drone_uin_number'),
#         latitude=data.get('latitude'),
#         longitude=data.get('longitude'),
#         maplink=data.get('maplink'),
#         timestamp=datetime.strptime(data.get('timestamp'), "%Y-%m-%d %H:%M:%S"),
#         tracker_id=data.get('tracker_id')
#     )
#     db.session.add(new_entry)
#     db.session.commit()
#     return jsonify({"message": "Data stored successfully"}), 201


# @app.route('/api/drone-data', methods=['GET'])
# def fetch_drone_data():
#     start_date = request.args.get('start_date')
#     end_date = request.args.get('end_date')
#     tracker_id = request.args.get('tracker_id')

#     query = DroneTagData.query

#     if start_date and end_date:
#         start_dt = datetime.strptime(start_date, "%Y-%m-%d")
#         end_dt = datetime.strptime(end_date, "%Y-%m-%d")
#         query = query.filter(DroneTagData.timestamp.between(start_dt, end_dt))

#     if tracker_id:
#         query = query.filter_by(tracker_id=tracker_id)

#     results = query.all()
#     output = [{
#         "id": row.id,
#         "altitude": float(row.altitude),
#         "drone_application": row.drone_application,
#         "drone_category": row.drone_category,
#         "drone_uin_number": row.drone_uin_number,
#         "latitude": row.latitude,
#         "longitude": row.longitude,
#         "maplink": row.maplink,
#         "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#         "tracker_id": row.tracker_id
#     } for row in results]

#     return jsonify(output)

# # -----------------------------
# # DB Test Route
# # -----------------------------
# @app.route('/test_db')
# def test_db():
#     try:
#         conn = psycopg2.connect(
#             dbname="Drone-Tag",
#             user="postgres",
#             password="Harvi@57",
#             host="localhost",
#             port="5432"
#         )
#         cur = conn.cursor()
#         cur.execute("SELECT * FROM registration;")
#         rows = cur.fetchall()
#         cur.close()
#         conn.close()
#         return "<h2>Connection successful!</h2><pre>{}</pre>".format(rows)
#     except Exception as e:
#         return f"<h2>Connection failed:</h2><pre>{e}</pre>"

# # -----------------------------
# # DB Filter API
# # -----------------------------
# @app.route('/api/data/filter', methods=['POST'])
# def filter_telemetry_data():
#     try:
#         data = request.get_json()
#         tracker_id = data.get('tracker_id')
#         start_time_str = data.get('start_time')
#         end_time_str = data.get('end_time')

#         if not tracker_id or not start_time_str or not end_time_str:
#             return jsonify({'error': 'Missing parameters'}), 400

#         start_time = parse_datetime(start_time_str)
#         end_time = parse_datetime(end_time_str)

#         filtered_data = DroneTagData.query.filter(
#             DroneTagData.TrackerId == tracker_id,
#             DroneTagData.Timestamp >= start_time,
#             DroneTagData.Timestamp <= end_time
#         ).order_by(DroneTagData.Timestamp.asc()).all()

#         result = [{
#             'TrackerId': row.TrackerId,
#             'Latitude': row.Latitude,
#             'Longitude': row.Longitude,
#             'Timestamp': row.Timestamp.strftime("%Y-%m-%d %H:%M:%S"),
#             'Altitude': row.Altitude,
#             'DroneUINNumber': row.DroneUINNumber,
#             'DroneCategory': row.DroneCategory,
#             'DroneApplication': row.DroneApplication
#         } for row in filtered_data]

#         return jsonify(result)

#     except Exception as e:
#         logging.error("Error in /api/data/filter: %s", e)
#         return jsonify({'error': str(e)}), 500

# # -----------------------------
# # Run App
# # -----------------------------
# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#     app.run(debug=True)







from flask import Flask, render_template, request, jsonify, redirect, session, url_for, flash
from functools import wraps
from datetime import datetime, timedelta
from dateutil.parser import parse as parse_datetime
from config import Config
from models import db, User, Login, DroneInfo, DroneTagData
import requests
import json
import logging

# -----------------------------
# Flask App Setup
# -----------------------------
app = Flask(__name__)
app.secret_key = 'supersecretkey123'
app.config.from_object(Config)
db.init_app(app)

logging.basicConfig(level=logging.DEBUG)

# -----------------------------
# Login Required Decorator
# -----------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# -----------------------------
# Public Routes
# -----------------------------
@app.route('/')
@app.route('/cover')
def cover():
    return render_template('cover.html')

@app.route('/aboutus')
def aboutus():
    return render_template('aboutus.html')

@app.route('/help')
def help_page():
    return render_template('help.html')

@app.route('/support')
def support_page():
    return render_template('support.html')

# -----------------------------
# Auth Routes
# -----------------------------
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        tracker_id = request.form.get('tracker_id')
        uin = request.form.get('uin')
        category = request.form.get('category')
        application = request.form.get('application')

        # Check existing user
        if User.query.filter((User.phone == phone) | (User.email == email)).first():
            flash('User with this phone or email already exists.', 'danger')
            return render_template('register.html')

        # Check existing drone
        if DroneInfo.query.filter_by(tracker_id=tracker_id).first():
            flash('Drone with this tracker ID already exists.', 'danger')
            return render_template('register.html')

        try:
            # Create user
            new_user = User(
                username=username,
                email=email,
                phone=phone,
                password=password,
                tracker_id=tracker_id,
                uin=uin,
                category=category,
                application=application
            )
            db.session.add(new_user)
            db.session.flush()

            # Register drone
            new_drone = DroneInfo(
                tracker_id=tracker_id,
                uin=uin,
                category=category,
                application=application,
                registered_on=datetime.utcnow()
            )
            db.session.add(new_drone)

            # Log login
            login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
            db.session.add(login_log)

            db.session.commit()
            session['user_id'] = new_user.id
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))

        except Exception as e:
            db.session.rollback()
            logging.error("Registration Error: %s", e)
            flash('Registration failed. Please try again.', 'danger')
            return render_template('register.html')

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        phone = request.form.get('phone')
        password = request.form.get('password')

        user = User.query.filter_by(phone=phone).first()
        if user and user.password == password:
            session['user_id'] = user.id
            login_log = Login(phone=phone, password=password, login_time=datetime.utcnow())
            db.session.add(login_log)
            db.session.commit()
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash("Invalid phone number or password.", "danger")

    return render_template("login.html")


@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully!', 'info')
    return redirect(url_for('cover'))

# -----------------------------
# User Dashboard & Settings
# -----------------------------
@app.route('/index')
@login_required
def index():
    return render_template('index.html')


@app.route('/dashboard')
@login_required
def dashboard():
    tracker_id = request.args.get('tracker_id')
    if not tracker_id:
        flash("No tracker ID provided", "warning")
        return redirect(url_for('index'))
    return render_template('dashboard.html', tracker_id=tracker_id)


@app.route('/account')
@login_required
def account():
    user = User.query.get(session['user_id'])
    return render_template('account.html', user=user)


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings_page():
    user = db.session.get(User, session['user_id'])
    message = None

    if request.method == 'POST':
        new_email = request.form.get('email')
        new_phone = request.form.get('phone')
        new_password = request.form.get('password')

        if new_email and new_email != user.email:
            user.email = new_email

        if new_phone and new_phone != user.phone:
            user.phone = new_phone

        if new_password:
            user.password = new_password  # plain-text

        db.session.commit()
        message = "Settings updated successfully."

    return render_template("settings.html", user=user, message=message)

# -----------------------------
# API: Fetch Drone Data from AWS
# -----------------------------
@app.route('/api/data', methods=['POST'])
@login_required
def get_data():
    try:
        payload = request.get_json(force=True)
        tracker_id = (payload.get('tracker_id') or '').strip()
        if not tracker_id:
            return jsonify({"error": "Tracker ID is required"}), 400

        api_response = requests.post(
            "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
            json={"TrackerId": tracker_id},
            timeout=10
        )
        api_response.raise_for_status()
        data = api_response.json()

        body = data.get('body')
        if isinstance(body, str):
            body = json.loads(body)

        telemetry = body.get('Telemetry', []) or []
        images = body.get('Images', []) or []

        drone_info = body.get('DroneInfo', {})
        uin = drone_info.get('UIN') or "N/A"
        category = drone_info.get('Category') or "N/A"
        application = drone_info.get('Application') or "N/A"
        default_altitude = float(drone_info.get('Altitude') or 0)

        # Correct Altitude & drone info
        for t in telemetry:
            # Fetch altitude properly from AWS payload
            altitude_val = t.get('Altitude')
            if altitude_val is None or altitude_val == '' or float(altitude_val) == 0:
                altitude_val = default_altitude
            t['Altitude'] = float(altitude_val)

            t['DroneUINNumber'] = t.get('DroneUINNumber') or uin
            t['DroneCategory'] = t.get('DroneCategory') or category
            t['DroneApplication'] = t.get('DroneApplication') or application

        return jsonify({
            "TrackerId": tracker_id,
            "Telemetry": telemetry,
            "Images": images,
            "UIN": uin,
            "Category": category,
            "Application": application
        })

    except requests.RequestException as e:
        return jsonify({"error": f"API request failed: {str(e)}"}), 502
    except Exception as e:
        logging.exception("Error in /api/data")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# -----------------------------
# API: Trajectory (Downsample + Time Window + UIN info + Correct Altitude)
# -----------------------------
@app.route('/api/trajectory', methods=['POST'])
@login_required
def get_trajectory():
    try:
        payload = request.get_json(force=True)
        tracker_id = (payload.get('tracker_id') or '').strip()
        if not tracker_id:
            return jsonify({"error": "Tracker ID is required"}), 400

        start_time = payload.get('start_time')
        end_time = payload.get('end_time')
        interval_seconds = int(payload.get('interval_seconds') or 30)
        max_gap_seconds = int(payload.get('max_gap_seconds') or 120)

        # Fetch data from AWS
        api_response = requests.post(
            "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
            json={"TrackerId": tracker_id},
            timeout=10
        )
        api_response.raise_for_status()
        data = api_response.json()

        body = data.get('body')
        if isinstance(body, str):
            body = json.loads(body)

        telemetry = body.get('Telemetry', []) or []
        images = body.get('Images', []) or []

        drone_info = body.get('DroneInfo', {})
        uin = drone_info.get('UIN') or "N/A"
        category = drone_info.get('Category') or "N/A"
        application = drone_info.get('Application') or "N/A"
        default_altitude = float(drone_info.get('Altitude') or 0)

        def parse_ts(ts_str):
            if not ts_str:
                return None
            try:
                return parse_datetime(ts_str)
            except Exception:
                try:
                    return datetime.strptime(ts_str, "%d-%m-%Y %H:%M:%S")
                except Exception:
                    return None

        start_dt = parse_datetime(start_time) if start_time else None
        end_dt = parse_datetime(end_time) if end_time else None

        norm = []
        for row in telemetry:
            ts = parse_ts(row.get('Timestamp'))
            if not ts:
                continue
            if start_dt and ts < start_dt:
                continue
            if end_dt and ts > end_dt:
                continue
            try:
                lat = float(row.get('Latitude'))
                lon = float(row.get('Longitude'))
            except (TypeError, ValueError):
                continue

            # Correct Altitude
            altitude_val = row.get('Altitude')
            if altitude_val is None or altitude_val == '' or float(altitude_val) == 0:
                altitude_val = default_altitude
            altitude_val = float(altitude_val)

            norm.append({
                "lat": lat,
                "lon": lon,
                "timestamp": ts,
                "altitude": altitude_val,
                "DroneUINNumber": row.get('DroneUINNumber') or uin,
                "DroneCategory": row.get('DroneCategory') or category,
                "DroneApplication": row.get('DroneApplication') or application
            })

        # Sort by time
        norm.sort(key=lambda x: x["timestamp"])

        # Downsample
        sampled = []
        last_kept = None
        for p in norm:
            if last_kept is None or (p["timestamp"] - last_kept) >= timedelta(seconds=interval_seconds):
                sampled.append(p)
                last_kept = p["timestamp"]

        points = [{
            "lat": p["lat"],
            "lon": p["lon"],
            "altitude": p["altitude"],
            "timestamp": p["timestamp"].isoformat(),
            "DroneUINNumber": p["DroneUINNumber"],
            "DroneCategory": p["DroneCategory"],
            "DroneApplication": p["DroneApplication"]
        } for p in sampled]

        return jsonify({
            "tracker_id": tracker_id,
            "points": points,
            "images": images,
            "interval_seconds": interval_seconds,
            "max_gap_seconds": max_gap_seconds,
            "UIN": uin,
            "Category": category,
            "Application": application
        })

    except Exception as e:
        logging.exception("Trajectory API failed")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

# -----------------------------
# Store/Fetch Drone Data in DB
# -----------------------------
@app.route('/api/drone-data', methods=['POST'])
def store_drone_data():
    data = request.json

    # Fill missing drone info from AWS
    uin = data.get('drone_uin_number')
    category = data.get('drone_category')
    application = data.get('drone_application')
    altitude = data.get('altitude')

    if not uin or not category or not application or not altitude:
        tracker_id = data.get('tracker_id')
        if tracker_id:
            try:
                aws_resp = requests.post(
                    "https://7mmfy9xgk9.execute-api.ap-south-1.amazonaws.com/json/data",
                    json={"TrackerId": tracker_id},
                    timeout=10
                )
                body = aws_resp.json().get('body', {})
                if isinstance(body, str):
                    body = json.loads(body)
                drone_info = body.get('DroneInfo', {})
                uin = uin or drone_info.get('UIN')
                category = category or drone_info.get('Category')
                application = application or drone_info.get('Application')
                altitude = altitude or float(drone_info.get('Altitude') or 0)
            except:
                altitude = altitude or 0

    new_entry = DroneTagData(
        altitude=altitude,
        drone_application=application,
        drone_category=category,
        drone_uin_number=uin,
        latitude=data.get('latitude'),
        longitude=data.get('longitude'),
        maplink=data.get('maplink'),
        timestamp=datetime.strptime(data.get('timestamp'), "%Y-%m-%d %H:%M:%S"),
        tracker_id=data.get('tracker_id')
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Data stored successfully"}), 201


@app.route('/api/drone-data', methods=['GET'])
def fetch_drone_data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    tracker_id = request.args.get('tracker_id')

    query = DroneTagData.query

    if start_date and end_date:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        query = query.filter(DroneTagData.timestamp.between(start_dt, end_dt))

    if tracker_id:
        query = query.filter_by(tracker_id=tracker_id)

    results = query.all()
    output = [{
        "id": row.id,
        "altitude": float(row.altitude),
        "drone_application": row.drone_application,
        "drone_category": row.drone_category,
        "drone_uin_number": row.drone_uin_number,
        "latitude": row.latitude,
        "longitude": row.longitude,
        "maplink": row.maplink,
        "timestamp": row.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "tracker_id": row.tracker_id
    } for row in results]

    return jsonify(output)

# -----------------------------
# Run App
# -----------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
