import requests
import streamlit as st
import time
import base64

def call_understanding_agent(user_text):
    try:
        # This sends data to Node.js server
        response = requests.post(
            "http://localhost:3000/api/understand-input", 
            json={"text": user_text}
        )
        return response.json()
    except Exception as e:
        return {"error": str(e)}

# ---------------- PAGE CONFIG ----------------
st.set_page_config(page_title="MediFlow", page_icon="🩺", layout="wide")

# ---------------- GLOBAL CSS ----------------
st.markdown("""
<style>

/* Buttons */
.stButton > button {
    background: #d8e5ff;
    color: #000000;
    border-radius: 12px;
    transition: all 0.3s ease;
    font-size: 16px;
}

.stButton > button:hover {
    background-color: #246fff;
    color: #ffffff;
    transform: scale(1.02);
}
            
.home-page-element-title {
    font-family: "Roboto"; 
    font-size: 30px; 
    font-weight: bold;
    color: #ffffff;
}
            
.home-page-element-description {
    font-family: "Acme"; 
    font-size: 15px; 
    color: #ffffff;
    margin-bottom: 20px;
}
            
</style>
""", unsafe_allow_html=True)

# ---------------- BACKGROUND ----------------
def set_bg(image_file):
    with open(image_file, "rb") as f:
        data = base64.b64encode(f.read()).decode()

    st.markdown(f"""
    <style>
    .stApp {{
        background-image: url("data:image/jpg;base64,{data}");
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
    }}
    </style>
    """, unsafe_allow_html=True)

BG_MAP = {
    "home": "assets/bg_home.png",
    "triage": "assets/bg_chat.png",
    "result": "assets/bg_result.png",
    "booking": "assets/bg_booking.png",
    "confirm": "assets/bg_confirm.png",
    "appointments": "assets/bg_appointment.png",
    "emergency": "assets/bg_emergency.png"
}

# ---------------- SESSION STATE ----------------
if "page" not in st.session_state:
    st.session_state.page = "home"

if "chat" not in st.session_state:
    st.session_state.chat = []

if "triage" not in st.session_state:
    st.session_state.triage = None

if "appointments" not in st.session_state:
    st.session_state.appointments = []

if "nav_stack" not in st.session_state:
    st.session_state.nav_stack = ["home"]

# ---------------- NAVIGATION ----------------
def go(page):
    st.session_state.nav_stack.append(page)
    st.session_state.page = page
    st.rerun()

def go_back():
    if len(st.session_state.nav_stack) > 1:
        st.session_state.nav_stack.pop()
        st.session_state.page = st.session_state.nav_stack[-1]
        st.rerun()

def nav_buttons():
    col1, col2 = st.columns([1,9])  
    with col1:
        if st.button("🏠 Home", key=f"home_{st.session_state.page}"):
            go("home")
    with col2:
        if len(st.session_state.nav_stack) > 1:
            if st.button("⬅ Back", key=f"back_{st.session_state.page}"):
                go_back()

# ---------------- HOME ----------------
def home():
    st.markdown("""   
    <h1 style='color:#ffffff;text-align:center;font-size:80px;font-family:Roboto;text-shadow:5px 5px 3px #000;'>
    MediFlow</h1>

    <h4 style='text-align:center;color:#f3faff;font-family:Bell MT;text-shadow:2px 2px 2px #000;'>
    AI Hospital Triage & Appointment System</h4>
    """, unsafe_allow_html=True)

    st.markdown("<hr style='background:#ffffff;'>", unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown('<div class="home-page-element-title">💊 Get Medical Help</div>', unsafe_allow_html=True)
        st.markdown('<div class="home-page-element-description">Describe symptoms and get AI triage</div>', unsafe_allow_html=True)

        if st.button("Start", use_container_width=True):
            go("triage")

    with col2:
        st.markdown('<div class="home-page-element-title">🚑 Emergency Mode</div>', unsafe_allow_html=True)
        st.markdown('<div class="home-page-element-description">Immediate help and hospital access</div>', unsafe_allow_html=True)

        if st.button("Activate", use_container_width=True):
            go("emergency")

    with col3:
        st.markdown('<div class="home-page-element-title">📅 My Appointments</div>', unsafe_allow_html=True)
        st.markdown('<div class="home-page-element-description">View or manage bookings</div>', unsafe_allow_html=True)

        if st.button("Open", use_container_width=True):
            go("appointments")

# ---------------- TRIAGE ----------------
def triage():
    nav_buttons()

    st.markdown("<h1 style='color:white; font-family: Roboto;'>💬 Medical Chat</h1>", unsafe_allow_html=True)

    for msg in st.session_state.chat:
        align = "right" if msg["role"] == "User" else "left"
        color = "#bde4ff" if msg["role"] == "User" else "#d0ffe6"
        st.markdown(f"""
        <div style='text-align:{align};background:{color};padding:10px;border-radius:10px;margin:5px'>
        {msg["text"]}
        </div>
        """, unsafe_allow_html=True)

    col1, col2 = st.columns ([9,1], vertical_alignment="bottom")
    with col1:
        user_input = st.text_input("", placeholder="Describe your symptoms...")
    with col2:
        st.button("🎤 Speak")   # voice input

    # fake AI analysis
    if st.button("Send") and user_input:
        st.session_state.chat.append({"role": "User", "text": user_input})
        st.markdown("""
            <p style='font-family: Cambria;font-size: 18px;color: #ffffff;text-align: left;'
                >🧠 MediFlow is analyzing your symptoms...</p>
        """, unsafe_allow_html=True)
        time.sleep(2)

        if "chest" in user_input.lower():
            st.session_state.triage = {"level":"EMERGENCY","color":"#F5B7B1","msg":"Possible cardiac issue","confidence":"92%"}
            ai_msg = "Immediate care needed."
        elif "fever" in user_input.lower():
            st.session_state.triage = {"level":"NON-URGENT","color":"#ABEBC6","msg":"Likely mild infection","confidence":"75%"}
            ai_msg = "You can book a consultation."
        else:
            st.session_state.triage = {"level":"URGENT","color":"#F9E79F","msg":"Needs medical attention","confidence":"85%"}
            ai_msg = "You should see a doctor soon."

        st.session_state.chat.append({"role": "AI", "text": ai_msg})
        go("result")

# ---------------- RESULT ----------------
def result():
    nav_buttons()

    res = st.session_state.triage

    st.title("🧠 Triage Result")
    st.progress(60)
    
    st.write("Step 3 of 5: Triage Complete")

    st.markdown(f"""
    <div style='padding:20px; border-radius:15px; margin-bottom:10px; background-color:{res['color']};'>
    <h2>{res['level']}</h2>
    <p>{res['msg']}</p>
    <p><b>Confidence:</b> {res['confidence']}</p>
    </div>
    """, unsafe_allow_html=True)

    if res["level"] == "EMERGENCY":
        if st.button("🚑 Go Emergency"):
            go("emergency")
    else:
        if st.button("📅 Book Appointment"):
            go("booking")

# ---------------- BOOKING ----------------
def booking():
    nav_buttons()
    st.title("📅 Book Appointment")

    st.markdown("### 👨‍⚕️ Recommended Doctor")

    # fake doctor data
    doctors = [
        "Dr Lim (Cardiologist) — Today 2PM",
        "Dr Tan (General) — Tomorrow 10AM",
        "Dr Lee (Dermatologist) — 4PM"
    ]

    choice = st.selectbox("Choose slot", doctors)

    if st.button("Confirm Appointment"):
        st.session_state.appointments.append(choice)
        go("confirm")

# ---------------- CONFIRM ----------------
def confirm():
    nav_buttons()
    st.markdown("<h1 style='color:white;'>✅ Appointment Confirmed</h1>", unsafe_allow_html=True)

    st.markdown(f"""
        <div style="
            background-color: #ceffe280; 
            color: #006852; 
            border: 1px solid #377e54; 
            border-radius: 8px;
            padding: 12px;
            font-size: 18px;
            text-align: left;
            margin-bottom: 15px;
        ">
            Appointment booked: {st.session_state.appointments[-1]}
        </div>
    """, unsafe_allow_html=True)

    if st.button("📅View Appointments"):
        go("appointments")

# ---------------- APPOINTMENTS ----------------
def appointments():
    nav_buttons()

    st.markdown("<h1 style='color:white; font-family: Roboto;'>📅 My Appointments</h1>", unsafe_allow_html=True)

    if st.session_state.appointments:
        st.markdown("""
            <style>
            .appt-box {
                border: #7ed5ff; 
                border-radius: 8px;
                padding: 10px;
                margin: 8px 0;
                color: #ffffff; 
                font-size: 18px;
                margin-bottom: 15px;
                background-color: #7ed5ff80;
            }
            </style>
        """, unsafe_allow_html=True)

        for a in st.session_state.appointments:
           st.markdown(f"<div class='appt-box'>{a}</div>", unsafe_allow_html=True)

    else:
        st.markdown("<p style='color:#ffffff;'>No appointments yet.</p>", unsafe_allow_html=True)

    if st.button("Book Appointment"):
                go("booking")

# ---------------- EMERGENCY ----------------
def emergency(): 
    nav_buttons()

    st.markdown("""
        <h1 style='font-family: Helvetica; font-weight: bold; color: #ffffff;'>
        🚑 Emergency Mode</h1>
    """, unsafe_allow_html=True)

    st.markdown("""
        <div style="
            background-color: #FF000080; 
            color: #ffffff; 
            border: 1px solid #ff0000; 
            border-radius: 8px;
            padding: 12px;
            font-weight: bold;
            font-size: 16px;
            text-align: left;
        ">
            🚨 EMERGENCY DETECTED
        </div>
    """, unsafe_allow_html=True)

    st.markdown("""
        <style>
        .action-text {
            color: white;
            font-size: 25px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .action-btn {
            display: inline-block;
            background-color: #ff0000;
            color: #ffffff !important;
            font-weight: bold;
            padding: 10px 20px;
            border: 2px solid #ffffff;
            border-radius: 8px;
            text-decoration: none !important;
            margin: 5px 0;
            transition: all 0.3s ease;
        }
        .action-btn:hover {
            background-color: #ffffff;
            color: #ff0000 !important;
        }
        </style>

        <div class="action-text">Immediate Actions:</div>
        <a href="tel:999" class="action-btn">📞 Call Ambulance (999)</a><br>
        <a href="https://www.google.com/maps/search/hospital+near+me" target="_blank" class="action-btn">🏥 Go to nearest hospital</a><br>
        <div class="action-text">❕❕ Stay calm</div>
    """, unsafe_allow_html=True)


# ---------------- ROUTER ----------------
set_bg(BG_MAP.get(st.session_state.page))

page = st.session_state.page

if page == "home":
    home()
elif page == "triage":
    triage()
elif page == "result":
    result()
elif page == "booking":
    booking()
elif page == "confirm":
    confirm()
elif page == "appointments":
    appointments()
elif page == "emergency":
    emergency()