let S;
const $=x=>document.getElementById(x);
async function api(u,o={}){return (await fetch(u,{headers:{"Content-Type":"application/json"},...o})).json()}
function tab(id,b){document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active")}
async function load(){S=await api("/api/case");render()}
async function investigate(){S=await api("/api/investigate",{method:"POST"});render();toast("Agent investigation started")}
async function evidence(x){S=await api("/api/evidence/"+x,{method:"POST"});render();toast("New evidence received: "+x)}
function render(){let c=S.case;$("risk").textContent=c.risk_score+"%";$("conf").textContent=c.confidence+"%";$("grisk").textContent=c.graph_risk?c.graph_risk+"%":"—";$("dna").textContent=c.graph_risk?c.graph_risk+"%":"—";$("bar").style.width=(c.graph_risk||c.risk_score)+"%";$("explain").textContent=S.explanation;$("action").textContent=S.next_best_action.replaceAll("_"," ");$("uncertainty").innerHTML=c.uncertainty.map(x=>"<div>⚠ "+x+"</div>").join("");$("timeline").innerHTML=c.timeline.length?c.timeline.map(x=>`<div class="event"><b>${x[0]}</b>${x[1]} ${x[2]}</div>`).join(""):"Start an investigation.";$("evidence").innerHTML=c.evidence.map(x=>`<div class="evi"><span>${x.impact>0?"+":""}${x.impact}</span><b>${x.title}</b><p>${x.detail}</p><small>${x.source}</small></div>`).join("");$("findings").innerHTML=c.findings.map(x=>`<div class="finding">✓ ${x}</div>`).join("");$("memory").innerHTML=c.similar.map(x=>`<div class="memory"><strong>${x.similarity}%</strong><b>${x.case_id}</b><small>${x.outcome}</small><p>${x.reason}</p></div>`).join("");$("policy").innerHTML=Object.entries({"REQUEST_STEP_UP":["Authorized","—"],"MONITOR_ACCOUNT":["Authorized","—"],"WARN_CUSTOMER":["Authorized","—"],"BLOCK_TRANSACTION":["Recommend","Fraud Analyst L2"],"FREEZE_ACCOUNT":["Recommend","Fraud Analyst L2"],"FILE_SAR":["Recommend","Compliance Officer"]}).map(([a,v])=>`<tr><td>${a}</td><td>${v[0]}</td><td>${v[1]}</td></tr>`).join("");draw(c)}
function draw(c){
  const g=$("graph");
  g.innerHTML="";
  const stage=document.createElement("div");
  stage.className="graph-stage";
  g.appendChild(stage);

  const p={};
  c.entities.forEach(n=>p[n[0]]=[n[3],n[4]]);

  c.edges.forEach(e=>{
    const a=p[e[0]], b=p[e[1]];
    if(!a||!b)return;
    const dx=b[0]-a[0], dy=b[1]-a[1];
    const len=Math.hypot(dx,dy), ang=Math.atan2(dy,dx)*180/Math.PI;
    const q=document.createElement("div");
    q.className="edge";
    q.style.cssText=`left:${a[0]}%;top:${a[1]}%;width:${len}%;transform:rotate(${ang}deg)`;
    stage.appendChild(q);
  });

  c.entities.forEach(n=>{
    const q=document.createElement("div");
    q.className="node";
    q.style.left=n[3]+"%";
    q.style.top=n[4]+"%";
    q.innerHTML=`<div class="dot">${({"customer":"◉","account":"▣","transaction":"₿","device":"◆","ip":"⌁","merchant":"◇"})[n[2]]||"●"}</div><b>${n[1]}</b><small>${n[2].toUpperCase()}</small>`;
    stage.appendChild(q);
  });

  // Interactive graph: pan with mouse/touch and zoom with wheel/pinch.
  let scale=1, tx=0, ty=0;
  const minScale=.55, maxScale=2.8;
  let dragging=false, moved=false, sx=0, sy=0, startX=0, startY=0;

  const apply=()=>{stage.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`};
  const zoomAt=(factor,cx,cy)=>{
    const next=Math.max(minScale,Math.min(maxScale,scale*factor));
    if(next===scale)return;
    const rect=g.getBoundingClientRect();
    const x=cx-rect.left, y=cy-rect.top;
    tx=x-(x-tx)*(next/scale);
    ty=y-(y-ty)*(next/scale);
    scale=next; apply();
  };

  g.addEventListener("wheel",e=>{e.preventDefault();zoomAt(e.deltaY<0?1.12:.89,e.clientX,e.clientY)},{passive:false});
  g.addEventListener("pointerdown",e=>{
    if(e.target.closest("button"))return;
    dragging=true; moved=false; sx=e.clientX; sy=e.clientY; startX=tx; startY=ty;
    g.setPointerCapture(e.pointerId); g.classList.add("dragging");
  });
  g.addEventListener("pointermove",e=>{
    if(!dragging)return;
    const dx=e.clientX-sx, dy=e.clientY-sy;
    if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
    tx=startX+dx; ty=startY+dy; apply();
  });
  const stop=()=>{dragging=false;g.classList.remove("dragging")};
  g.addEventListener("pointerup",stop);
  g.addEventListener("pointercancel",stop);
  g.addEventListener("dblclick",e=>{e.preventDefault();zoomAt(1.35,e.clientX,e.clientY)});

  // Double-click/tap the empty graph area to reset the viewport.
  g.addEventListener("dblclick",e=>{
    if(e.target===g){scale=1;tx=0;ty=0;apply();}
  });

  const controls=document.createElement("div");
  controls.className="graph-controls";
  controls.innerHTML=`<button type="button" title="Zoom in">+</button><button type="button" title="Zoom out">−</button><button type="button" title="Reset view">⟳</button>`;
  g.appendChild(controls);
  const [zin,zout,reset]=controls.querySelectorAll("button");
  zin.onclick=e=>{e.stopPropagation();zoomAt(1.25,g.getBoundingClientRect().left+g.clientWidth/2,g.getBoundingClientRect().top+g.clientHeight/2)};
  zout.onclick=e=>{e.stopPropagation();zoomAt(.8,g.getBoundingClientRect().left+g.clientWidth/2,g.getBoundingClientRect().top+g.clientHeight/2)};
  reset.onclick=e=>{e.stopPropagation();scale=1;tx=0;ty=0;apply()};

  const hint=document.createElement("div");
  hint.className="graph-hint";
  hint.textContent="Drag to pan • Scroll to zoom • Double-click to zoom • ⟳ reset";
  g.appendChild(hint);
  apply();
}
function why(){$("modalbody").innerHTML="<h2>Why this decision?</h2><p>"+S.explanation+"</p><h3>Evidence</h3><ul>"+S.case.evidence.map(e=>`<li><b>${e.title}</b> — ${e.detail}</li>`).join("")+"</ul><h3>Approval route</h3><p>"+(S.case.approvals.length?S.case.approvals.join(", "):"No extra approval required.")+"</p>";$("modal").classList.add("show")}
function closeModal(){$("modal").classList.remove("show")}
function replay(){if(!S.case.timeline.length){toast("Start the investigation first");return}let a=[...S.case.timeline],i=0;$("timeline").innerHTML="";let t=setInterval(()=>{if(i>=a.length)return clearInterval(t);let x=a[i++];$("timeline").innerHTML+=`<div class="event"><b>${x[0]}</b>${x[1]} ${x[2]}</div>`},450)}
function toast(m){let x=document.createElement("div");x.textContent=m;x.style="position:fixed;right:25px;bottom:25px;background:#111d29;border:1px solid #2b4054;padding:12px;border-radius:8px;z-index:9";document.body.appendChild(x);setTimeout(()=>x.remove(),2500)}
load();