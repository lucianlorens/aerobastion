import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import math

st.set_page_config(page_title="AEROBASTION | C2 COMMAND CENTER", page_icon="🛡️", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
    * { font-family: 'Roboto Mono', monospace; }
    body, [class*="stApp"] { background-color: #0a0d0f; color: #1dd1a1; }
    .main { background: linear-gradient(135deg, #0a0d0f 0%, #0f1419 100%); color: #1dd1a1; }
    h1, h2, h3, h4 { color: #1dd1a1; text-shadow: 0 0 20px rgba(29, 209, 161, 0.6); font-weight: 700; letter-spacing: 2px; }
    .stMetric { background: linear-gradient(135deg, #0f3d2f 0%, #0a2818 100%); padding: 20px; border: 2px solid #1dd1a1; box-shadow: inset 0 0 20px rgba(29, 209, 161, 0.2), 0 0 30px rgba(29, 209, 161, 0.3); }
    .military-alert { background: linear-gradient(135deg, #2d1b1b 0%, #3d0000 100%); border: 3px solid #ff4d4d; border-left: 8px solid #ff4d4d; padding: 20px; color: #ff6666; font-weight: 700; letter-spacing: 1px; box-shadow: 0 0 30px rgba(255, 77, 77, 0.5); }
    .military-success { background: linear-gradient(135deg, #1b2d1b 0%, #003d00 100%); border: 3px solid #1dd1a1; border-left: 8px solid #1dd1a1; padding: 20px; color: #1dd1a1; font-weight: 700; }
    .military-panel { background: linear-gradient(135deg, #0f3d2f 0%, #0a2818 100%); border: 2px solid #1dd1a1; padding: 15px; }
    .mission-log-entry { background: #0f1419; border-left: 4px solid #1dd1a1; padding: 10px; margin: 5px 0; font-size: 11px; }
    button { background: linear-gradient(135deg, #0f3d2f 0%, #1dd1a1 100%) !important; color: #000 !important; border: 2px solid #1dd1a1 !important; font-weight: 700; text-transform: uppercase; }
    </style>
    """, unsafe_allow_html=True)

@st.cache_data
def init_session_state():
    if 'history_cbrn' not in st.session_state:
        st.session_state.history_cbrn = [450] * 60
    if 'history_temp' not in st.session_state:
        st.session_state.history_temp = [22] * 60
    if 'history_time' not in st.session_state:
        st.session_state.history_time = list(range(60))
    if 'mission_logs' not in st.session_state:
        st.session_state.mission_logs = [
            {"timestamp": "14:32:15.847", "event": "SYSTEM INITIALIZED", "level": "INFO"},
            {"timestamp": "14:32:16.012", "event": "CBRN Sensors ACTIVE", "level": "INFO"},
            {"timestamp": "14:32:17.234", "event": "Tower network ONLINE", "level": "INFO"},
        ]
    if 'drone_deployed' not in st.session_state:
        st.session_state.drone_deployed = None
    if 'fire_location' not in st.session_state:
        st.session_state.fire_location = None
    if 'scramble_units' not in st.session_state:
        st.session_state.scramble_units = []

init_session_state()

def add_mission_log(event, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    st.session_state.mission_logs.append({"timestamp": timestamp, "event": event, "level": level})
    if len(st.session_state.mission_logs) > 50:
        st.session_state.mission_logs = st.session_state.mission_logs[-50:]

TOWERS_NETWORK = {
    "Alpha-01": {"lat": 41.192, "lon": -8.498, "name": "Tower Alpha-01 (Valongo)", "range": 5000},
    "Beta-02": {"lat": 41.210, "lon": -8.520, "name": "Tower Beta-02 (Fiães)", "range": 5000},
    "Gamma-03": {"lat": 41.175, "lon": -8.475, "name": "Tower Gamma-03", "range": 5000},
    "Delta-04": {"lat": 41.220, "lon": -8.450, "name": "Tower Delta-04 (Maia)", "range": 5000},
    "Echo-05": {"lat": 41.165, "lon": -8.520, "name": "Tower Echo-05", "range": 5000},
}

EXTRACTION_POINTS = [
    {"lat": 41.192, "lon": -8.498, "name": "EXTRACT-ALPHA", "priority": "PRIMARY"},
    {"lat": 41.210, "lon": -8.520, "name": "EXTRACT-BRAVO", "priority": "SECONDARY"},
]

EXCLUSION_ZONES = [
    {"lat": 41.205, "lon": -8.505, "name": "CIVILIAN ZONE-01", "radius": 2000},
    {"lat": 41.180, "lon": -8.480, "name": "PROTECTED AREA-02", "radius": 1500},
]

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def find_nearest_towers(fire_lat, fire_lon, towers, max_distance=6000):
    towers_distance = []
    for tower_id, tower_info in towers.items():
        distance = haversine_distance(fire_lat, fire_lon, tower_info["lat"], tower_info["lon"])
        towers_distance.append({
            "id": tower_id, "name": tower_info["name"], "distance": distance,
            "lat": tower_info["lat"], "lon": tower_info["lon"],
            "range": tower_info["range"], "in_range": distance <= tower_info["range"]
        })
    towers_distance.sort(key=lambda x: x["distance"])
    return [t for t in towers_distance if t["distance"] <= max_distance]

with st.sidebar:
    st.markdown("<div style='text-align:center; color:#1dd1a1; font-size:22px; font-weight:700;'>⚡ COMMAND CENTER ⚡</div>", unsafe_allow_html=True)
    st.divider()
    
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ CBRN PARAMETERS</div>", unsafe_allow_html=True)
    col_c1, col_c2 = st.columns(2)
    with col_c1:
        cbrn_val = st.slider("CBRN Carbon (PPM)", 300, 2000, 450, step=10)
    with col_c2:
        temp_val = st.slider("THERMAL (°C)", 15, 80, 22, step=1)
    
    humidity_val = st.slider("HUMIDITY (%)", 20, 95, 55, step=5)
    wind_speed = st.slider("WIND (km/h)", 0, 50, 12, step=2)
    
    st.divider()
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ THREAT SIMULATION</div>", unsafe_allow_html=True)
    threat_detected = st.checkbox("⚠️ ACTIVATE THREAT")
    
    if threat_detected:
        col_t1, col_t2 = st.columns(2)
        with col_t1:
            threat_lat = st.number_input("LAT (N)", 41.15, 41.25, 41.200, step=0.001)
        with col_t2:
            threat_lon = st.number_input("LON (W)", -8.55, -8.40, -8.490, step=0.001)
        st.session_state.fire_location = {"lat": threat_lat, "lon": threat_lon}
        add_mission_log(f"THREAT AT {threat_lat:.4f}°N, {threat_lon:.4f}°W", "ALERT")
    else:
        st.session_state.fire_location = None
    
    st.divider()
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ ALERT THRESHOLDS</div>", unsafe_allow_html=True)
    cbrn_threshold = st.slider("CBRN CRITICAL", 500, 2000, 1000, step=50)
    temp_threshold = st.slider("THERMAL CRITICAL", 30, 80, 60, step=5)
    
    if st.checkbox("🔄 REAL-TIME SIM"):
        cbrn_val = np.clip(cbrn_val + np.random.randint(-50, 51), 300, 2000)
        temp_val = np.clip(temp_val + np.random.randint(-2, 3), 15, 80)
    
    st.session_state.history_cbrn.pop(0)
    st.session_state.history_cbrn.append(cbrn_val)
    st.session_state.history_temp.pop(0)
    st.session_state.history_temp.append(temp_val)

st.markdown("<div style='text-align:center; color:#1dd1a1; font-size:24px; font-weight:700; text-shadow: 0 0 20px rgba(29, 209, 161, 0.8);'>🛡️ AEROBASTION | C2 CENTER 🛡️</div>", unsafe_allow_html=True)
st.markdown("<div style='text-align:center; color:#1dd1a1; font-size:11px;'>NATO-COMPATIBLE | LINK 16 READY | SECURE NETWORK</div>", unsafe_allow_html=True)
st.divider()

cbrn_alert = cbrn_val > cbrn_threshold
temp_alert = temp_val > temp_threshold
threat_active = st.session_state.fire_location is not None

if cbrn_alert or temp_alert or threat_active:
    threat_msg = "🔴 CHEMICAL ANOMALY DETECTED - PROTOCOL DELTA ACTIVATED" if cbrn_alert else ""
    st.markdown(f"<div class='military-alert'>████████ THREAT ASSESSMENT: RED ████████<br>{threat_msg}</div>", unsafe_allow_html=True)
    
    if threat_active:
        nearest_towers = find_nearest_towers(st.session_state.fire_location["lat"], st.session_state.fire_location["lon"], TOWERS_NETWORK)
        
        if nearest_towers:
            st.markdown(f"<div style='color:#ff6666; font-weight:700;'>🚨 {len(nearest_towers)} TOWERS LOCKED 🚨</div>", unsafe_allow_html=True)
            
            tower_cols = st.columns(min(3, len(nearest_towers)))
            for idx, tower in enumerate(nearest_towers[:3]):
                with tower_cols[idx]:
                    st.markdown(f"<div class='military-panel'><b>{tower['name']}</b><br>DISTANCE: {tower['distance']/1000:.2f}km<br>STATUS: {'✅ LOCKED' if tower['in_range'] else '⚠️ OUT-OF-RANGE'}</div>", unsafe_allow_html=True)
            
            st.markdown("---")
            col_auth1, col_auth2, col_auth3 = st.columns([2, 1, 1])
            
            with col_auth1:
                selected_tower = st.selectbox("SELECT LAUNCH PLATFORM", options=[t['name'] for t in nearest_towers], key="tower_select")
            
            with col_auth2:
                if st.button("🚀 AUTHORIZE DRONE", use_container_width=True, key="auth_drone"):
                    for tower in nearest_towers:
                        if tower['name'] == selected_tower:
                            st.session_state.drone_deployed = tower
                            add_mission_log(f"DRONE AUTHORIZED", "CRITICAL")
                    
                    st.markdown("<div class='military-success'>✅ DEPLOYMENT AUTHORIZED<br>LINK 16 ESTABLISHED<br>ETA: 2:45</div>", unsafe_allow_html=True)
                    st.balloons()
            
            with col_auth3:
                if st.button("📢 SCRAMBLE UNIT", use_container_width=True):
                    st.session_state.scramble_units.append({"unit": "TAC-UNIT-01", "time": datetime.now().strftime("%H:%M:%S"), "status": "INBOUND"})
                    add_mission_log("TACTICAL UNIT SCRAMBLED", "OPERATIONAL")
                    st.success("🚁 UNIT SCRAMBLED - ETA 8 MIN")

st.subheader("█ REAL-TIME TACTICAL METRICS")
col_m1, col_m2, col_m3, col_m4, col_m5 = st.columns(5)

with col_m1:
    cbrn_delta = cbrn_val - 450
    st.metric("CBRN Carbon Sig", f"{cbrn_val} PPM", delta=f"{cbrn_delta:+d}")

with col_m2:
    temp_delta = temp_val - 22
    st.metric("THERMAL", f"{temp_val}°C", delta=f"{temp_delta:+.1f}")

with col_m3:
    st.metric("HUMIDITY", f"{humidity_val}%")

with col_m4:
    st.metric("WIND VECTOR", f"{wind_speed} km/h")

with col_m5:
    status = "🔴 RED" if (cbrn_alert or temp_alert or threat_active) else "🟢 GREEN"
    st.metric("THREAT LEVEL", status)

st.divider()
st.subheader("█ CBRN SIGNATURE & THERMAL ANALYSIS")

col_chart1, col_chart2 = st.columns([1, 1])

with col_chart1:
    st.markdown("**CBRN CARBON SIGNATURE**")
    df_history = pd.DataFrame({'TIME': st.session_state.history_time, 'CBRN': st.session_state.history_cbrn})
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df_history['TIME'], y=df_history['CBRN'], mode='lines+markers', name='CBRN', line=dict(color='#1dd1a1', width=3), fill='tozeroy'))
    fig.add_hline(y=cbrn_threshold, line_dash="dash", line_color="#ff6666")
    fig.update_layout(template='plotly_dark', height=300, margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor='#0a0d0f', plot_bgcolor='#0a0d0f')
    fig.update_xaxes(showgrid=True, gridcolor='#1dd1a1', showline=True, linecolor='#1dd1a1')
    fig.update_yaxes(showgrid=True, gridcolor='#1dd1a1', showline=True, linecolor='#1dd1a1')
    st.plotly_chart(fig, use_container_width=True)

with col_chart2:
    st.markdown("**THERMAL SIGNATURE**")
    
    fig_temp = go.Figure()
    fig_temp.add_trace(go.Scatter(x=df_history['TIME'], y=st.session_state.history_temp, mode='lines+markers', name='Thermal', line=dict(color='#ff6666', width=3), fill='tozeroy'))
    fig_temp.add_hline(y=temp_threshold, line_dash="dash", line_color="#ff6666")
    fig_temp.update_layout(template='plotly_dark', height=300, margin=dict(l=0, r=0, t=0, b=0), paper_bgcolor='#0a0d0f', plot_bgcolor='#0a0d0f')
    fig_temp.update_xaxes(showgrid=True, gridcolor='#1dd1a1', showline=True, linecolor='#1dd1a1')
    fig_temp.update_yaxes(showgrid=True, gridcolor='#1dd1a1', showline=True, linecolor='#1dd1a1')
    st.plotly_chart(fig_temp, use_container_width=True)

st.divider()
st.subheader("█ TACTICAL OVERLAY & ENGAGEMENT MAP")

col_map, col_logs = st.columns([1.8, 1])

with col_map:
    st.markdown("**PERIMETER SCAN & TACTICAL OVERLAY**")
    map_center = [st.session_state.fire_location["lat"], st.session_state.fire_location["lon"]] if threat_active else [41.192, -8.498]
    
    m = folium.Map(location=map_center, zoom_start=13, tiles="CartoDB dark_matter")
    
    for tower_id, tower_info in TOWERS_NETWORK.items():
        tower_color = "red" if (threat_active and st.session_state.drone_deployed and st.session_state.drone_deployed["id"] == tower_id) else "blue"
        folium.Marker([tower_info["lat"], tower_info["lon"]], popup=f"<b>{tower_info['name']}</b>", icon=folium.Icon(color=tower_color, icon='tower-broadcast', prefix='fa')).add_to(m)
        folium.Circle([tower_info["lat"], tower_info["lon"]], radius=2000, color='#1dd1a1', fill=True, fillOpacity=0.1, weight=2).add_to(m)
    
    for extract in EXTRACTION_POINTS:
        folium.Marker([extract["lat"], extract["lon"]], popup=f"EXTRACTION<br>{extract['name']}", icon=folium.Icon(color="green", icon='arrow-up', prefix='fa')).add_to(m)
    
    for zone in EXCLUSION_ZONES:
        folium.Circle([zone["lat"], zone["lon"]], radius=zone["radius"], color='#ff6666', fill=True, fillOpacity=0.2, weight=2).add_to(m)
    
    if threat_active:
        folium.Marker([st.session_state.fire_location["lat"], st.session_state.fire_location["lon"]], popup="<b>THREAT</b>", icon=folium.Icon(color="red", icon='fire', prefix='fa')).add_to(m)
        folium.Circle([st.session_state.fire_location["lat"], st.session_state.fire_location["lon"]], radius=1000, color='#ff6666', fill=True, fillOpacity=0.4, weight=3).add_to(m)
        
        if st.session_state.drone_deployed:
            folium.PolyLine([[st.session_state.drone_deployed["lat"], st.session_state.drone_deployed["lon"]], [st.session_state.fire_location["lat"], st.session_state.fire_location["lon"]]], color='#1dd1a1', weight=3, opacity=0.9).add_to(m)
    
    st_folium(m, width="100%", height=500)

with col_logs:
    st.markdown("**MISSION LOG (REAL-TIME)**")
    log_container = st.container(height=500, border=True)
    with log_container:
        for log_entry in reversed(st.session_state.mission_logs[-20:]):
            level_color = "#ff6666" if log_entry["level"] in ["ALERT", "CRITICAL"] else "#1dd1a1"
            st.markdown(f"<div class='mission-log-entry' style='border-left-color: {level_color};'><span style='color: #888;'>[{log_entry['timestamp']}]</span> <span style='color: {level_color}; font-weight: 700;'>[{log_entry['level']}]</span> {log_entry['event']}</div>", unsafe_allow_html=True)

st.divider()

if st.session_state.drone_deployed:
    st.subheader("█ ISR DRONE TACTICAL STATUS")
    d1, d2, d3, d4 = st.columns(4)
    with d1:
        st.metric("STATUS", "🟢 IN FLIGHT")
    with d2:
        st.metric("BATTERY", "92%")
    with d3:
        st.metric("ALTITUDE", "450m")
    with d4:
        st.metric("LINK 16", "✅ CONNECTED")

if st.session_state.scramble_units:
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ SCRAMBLED UNITS</div>", unsafe_allow_html=True)
    units_data = [{"UNIT": u["unit"], "TIME": u["time"], "STATUS": u["status"]} for u in st.session_state.scramble_units]
    st.dataframe(pd.DataFrame(units_data), use_container_width=True)

st.divider()

tab1, tab2, tab3 = st.tabs(["SYSTEM STATUS", "NATO INTEROP", "DOCTRINE"])

with tab1:
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ NETWORK STATUS</div>", unsafe_allow_html=True)
    status_data = {'COMPONENT': ['CBRN Array', 'Thermal', 'Comm Link', 'Power', 'Encryption'], 'STATUS': ['🟢 ONLINE', '🟢 ONLINE', '🟢 ONLINE', '🟢 ONLINE', '🟢 SECURE'], 'UPTIME': ['99.9%', '99.8%', '100%', '99.9%', '99.99%']}
    st.dataframe(pd.DataFrame(status_data), use_container_width=True)

with tab2:
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ NATO LINK 16 INTEGRATION</div>", unsafe_allow_html=True)
    st.code("LINK 16: ENCRYPTED SECURE CHANNEL\nTACTICAL DATA LINK: ACTIVE\nCOORDINATES: REAL-TIME GPS\nENGAGEMENT: NATO COMPATIBLE\n\nPERSISTENT 24/7 SURVEILLANCE:\n✓ CBRN chemical detection\n✓ Low-signature capability\n✓ Thermal footprint mapping\n✓ NATO integration ready\n✓ Automatic cockpit coordination", language="text")

with tab3:
    st.markdown("<div style='color:#1dd1a1; font-weight:700;'>█ OPERATIONAL DOCTRINE</div>", unsafe_allow_html=True)
    st.markdown("�� **Persistent Surveillance**: 24/7 ground sensor network vs satellite-only coverage\n\n🎯 **Low-Signature Detection**: CO2 respiratory signatures & thermal patterns in forests/urban zones\n\n🎯 **NATO Interoperability**: Link 16 direct cockpit transmission with automatic engagement authorization")

st.divider()
st.markdown("<div style='text-align:center; color:#1dd1a1; font-size:9px; margin-top:30px;'>🛡️ AEROBASTION | C2 CENTER 🛡️<br>Porto 2026 | Team Aerobastion | CLASSIFIED MILITARY USE ONLY</div>", unsafe_allow_html=True)
