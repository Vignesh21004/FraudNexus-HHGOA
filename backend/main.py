from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app=FastAPI(title="FraudNexus")
app.mount("/static",StaticFiles(directory=str(Path(__file__).parent.parent/"frontend")),name="static")

CASE={
"case_id":"CASE-2041","transaction_id":"T-88421","customer_id":"C-4821",
"amount":84500,"currency":"INR","risk_score":82,"confidence":54,"graph_risk":0,
"status":"OPEN","fraud_type":"NETWORKED ACCOUNT TAKEOVER",
"uncertainty":["Customer authorization is unresolved.","Merchant-side confirmation is unavailable."],
"evidence":[
{"title":"Shared device","detail":"Device D-771 is associated with another high-risk account.","impact":22,"source":"TigerGraph"},
{"title":"Transaction velocity","detail":"Multiple transactions appeared in a short interval.","impact":18,"source":"Behavior"},
{"title":"Prior case connection","detail":"Connected account resembles a previously confirmed fraud case.","impact":24,"source":"Case Memory"},
{"title":"Clean customer history","detail":"Customer has no prior confirmed fraud cases.","impact":-8,"source":"History"}],
"findings":[],"actions":["REQUEST_STEP_UP","MONITOR_ACCOUNT"],"approvals":[],
"entities":[
("C-4821","Customer","customer",15,50),("A-4821","Account","account",32,50),
("T-88421","Transaction","transaction",50,50),("D-771","Device","device",67,25),
("IP-77","IP 172.18.44.77","ip",67,75),("A-9910","Account A-9910","account",84,25),
("M-091","Merchant M-091","merchant",84,75)],
"edges":[("C-4821","A-4821","OWNS"),("A-4821","T-88421","MADE"),("T-88421","D-771","USED"),
("D-771","A-9910","SHARED_WITH"),("T-88421","IP-77","FROM_IP"),("T-88421","M-091","PAID_TO")],
"similar":[
{"case_id":"CASE-1729","similarity":92,"outcome":"CONFIRMED_FRAUD","reason":"Shared device + linked accounts + failed verification"},
{"case_id":"CASE-1548","similarity":84,"outcome":"CLEARED","reason":"Shared IP explained by household network"},
{"case_id":"CASE-1901","similarity":79,"outcome":"CONFIRMED_FRAUD","reason":"High velocity + device reuse + prior case connection"}],
"timeline":[]
}

POLICY={
"REQUEST_STEP_UP":("Authorized","—"),"MONITOR_ACCOUNT":("Authorized","—"),
"WARN_CUSTOMER":("Authorized","—"),"CREATE_CASE":("Authorized","—"),
"BLOCK_TRANSACTION":("Recommend","Fraud Analyst L2"),
"FREEZE_ACCOUNT":("Recommend","Fraud Analyst L2"),"FILE_SAR":("Recommend","Compliance Officer")
}

def snap():
    action=CASE["actions"][0] if CASE["actions"] else "MONITOR_ACCOUNT"
    return {"case":CASE,"next_best_action":action,"explanation":explain(),"policy":POLICY.get(action), "tigergraph_connected":False}

def explain():
    a=CASE["actions"][0] if CASE["actions"] else "MONITOR_ACCOUNT"
    if CASE["confidence"]<70:
        return "I found a suspicious network, but evidence is insufficient for a disruptive action. I recommend step-up verification before blocking."
    return "The recommendation is supported by shared-device links, transaction velocity, prior-case similarity and the latest customer verification. The disruptive action is policy-gated."

@app.get("/",response_class=HTMLResponse)
def home(): return (Path(__file__).parent.parent/"frontend/index.html").read_text(encoding="utf-8")

@app.get("/api/case")
def get_case(): return snap()

@app.post("/api/investigate")
def investigate():
    CASE["status"]="EVIDENCE_PENDING"; CASE["graph_risk"]=78; CASE["confidence"]=54
    CASE["findings"]=["3 meaningful network relationships discovered.","A connected account overlaps with historical fraud memory.","Evidence supports elevated risk but does not prove non-authorization."]
    CASE["timeline"]=[
    ("00:01","🚨","Fraud signal received"),("00:02","🧾","Case CASE-2041 created"),
    ("00:04","🕸️","Traversing connected entities in TigerGraph"),("00:06","🧠","Historical case memory retrieved"),
    ("00:08","⚠️","Evidence conflict detected — confidence below action threshold"),
    ("00:09","📲","Controlled step-up evidence request issued")]
    return snap()

@app.post("/api/evidence/{result}")
def evidence(result:str):
    result=result.upper()
    if result=="FAILED":
        CASE["confidence"]=94; CASE["graph_risk"]=96; CASE["status"]="REASSESSED"
        CASE["evidence"].append({"title":"Step-up verification failed","detail":"The simulated account owner could not validate the transaction.","impact":31,"source":"Customer"})
        CASE["uncertainty"]=["Merchant-side confirmation remains unavailable."]
        CASE["findings"].append("Customer verification failed, materially increasing confidence.")
        CASE["actions"]=["BLOCK_TRANSACTION","FREEZE_ACCOUNT","FILE_SAR"]
        CASE["approvals"]=["Fraud Analyst L2","Compliance Officer"]
    elif result=="PASSED":
        CASE["confidence"]=88; CASE["graph_risk"]=58; CASE["status"]="REASSESSED"
        CASE["evidence"].append({"title":"Step-up verification passed","detail":"The simulated account owner validated the transaction.","impact":-35,"source":"Customer"})
        CASE["uncertainty"]=["Network relationship remains suspicious."]
        CASE["findings"].append("Customer verification passed; disruptive action is not currently justified.")
        CASE["actions"]=["MONITOR_ACCOUNT","WARN_CUSTOMER"]; CASE["approvals"]=[]
    CASE["timeline"] += [("00:20","📩",f"Customer verification: {result}"),("00:22","🔄",f"Risk reassessed — confidence {CASE['confidence']}%"),("00:24","🎯",f"Next best action: {CASE['actions'][0]}")]
    return snap()

@app.get("/api/export")
def export_case(): return CASE
