
(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false}); let W=1280,H=720,dpr=1;
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;} addEventListener('resize',resize); resize();
const clamp=(a,lo,hi)=>Math.max(lo,Math.min(hi,a)), lerp=(a,b,t)=>a+(b-a)*t, choose=a=>a[(Math.random()*a.length)|0];
const keys=new Set(), keyMap={KeyW:'ArrowUp',KeyS:'ArrowDown',KeyA:'ArrowLeft',KeyD:'ArrowRight',KeyJ:'Space',KeyK:'ShiftLeft'};
let mode='menu', player,rivals,traffic,track,notice=[],shake=0,hitFlash=0,levelTime=0,finishedAt=0,last=performance.now(),lastStrike=false,currentBg='day';
const segLen=180, roadWidth=2200, drawDistance=170, cameraDepth=1, cameraHeight=980;
const RACE_SEGMENTS=170, RACE_LENGTH=RACE_SEGMENTS*segLen;
const spritePaths={
  bikes:['player_straight','player_left','player_right','player_punch','player_kick','rival_red','rival_blue','rival_green'],
  vehicles:['car_white','car_red','car_blue','truck_box','pickup','van','police_car','police_bike'],
  roadside:['pine','palm','rock','chevron','warning','billboard','guardrail','lamp','cactus','marker'],
  hazards:['cone','barricade','oil_slick','crate','tire_stack','work_light','branch','spike_strip','police_barrier','repair_crate'],
  backgrounds:['day','night']
};
const art={bikes:{},vehicles:{},roadside:{},hazards:{},backgrounds:{}};
for(const group in spritePaths){for(const name of spritePaths[group]){const img=new Image();img.src=`assets/${group==='backgrounds'?'backgrounds':'sprites/'+group}/${name}.png`;art[group][name]=img;}}
function popup(text,color='#ffffff'){notice.push({text,color,t:2.4}); if(notice.length>5)notice.shift();}
function formatTime(t){return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
function held(k){return keys.has(k);}  
function buildTrack(){
  track=[];
  const deco=['pine','rock','marker','warning','billboard','guardrail','lamp','cactus','palm'];
  for(let i=0;i<RACE_SEGMENTS+drawDistance+2;i++){
    const curve=0.95*Math.sin(i/11)+0.7*Math.sin(i/21)+0.45*Math.sin(i/37);
    const y=300*Math.sin(i/24)+170*Math.sin(i/51);
    const seg={index:i,curve:i<10?curve*i/10:curve,y,sprites:[],hazards:[]};
    if(i>5 && i<RACE_SEGMENTS){
      if(i%5===0){const kind=curve>0.75?'chevron':curve<-0.75?'chevron':deco[(i*7)%deco.length]; seg.sprites.push({kind,side:(i%2?1:-1),offset:1.45+((i*13)%40)/100,scale:1});}
      if(i%9===0){seg.sprites.push({kind:deco[(i*5+3)%deco.length],side:(i%3? -1:1),offset:2.05+((i*17)%30)/100,scale:1.15});}
      if(i%17===0){seg.hazards.push({kind:choose(['cone','barricade','oil_slick','tire_stack','crate']),x:[-.55,-.25,.0,.25,.55][i%5],used:0});}
    }
    track.push(seg);
  }
}
function reset(){
  buildTrack();
  player={z:0,x:0,speed:0,health:100,kos:0,hitCd:0,hitAnim:0,kind:'punch',lean:0,invuln:0,rank:8};
  rivals=Array.from({length:7},(_,i)=>({z:3200+i*1100,x:(i%2?1:-1)*(.15+((i*37)%40)/100),speed:5600+i*140,baseSpeed:5500+i*155,health:3,alive:true,wobble:i*1.23,attackCd:0,stun:0,name:['VIPER','SCAR','BRUTE','RAVEN','RAZOR','GHOST','TURBO'][i],variant:i%3}));
  traffic=[];
  const vehicleKinds=['car_white','car_red','car_blue','pickup','van','truck_box','police_car'];
  for(let i=0;i<38;i++) traffic.push({z:3000+i*1700+((i*791)%900),x:[-.66,-.22,.22,.66][i%4],speed:1800+(i*109)%1300,sprite:vehicleKinds[i%vehicleKinds.length],kind:(i%6===0?'truck':'car')});
  notice=[]; shake=0; hitFlash=0; levelTime=0; finishedAt=0; mode='race'; currentBg='day'; document.getElementById('overlay').classList.add('hidden');
}
function onHit(dmg,label='CRASH!'){ if(player.invuln>0)return; player.health=clamp(player.health-dmg,0,100); player.speed*=.55; player.invuln=.75; hitFlash=.45; shake=10; popup(label, '#ff7d73'); if(player.health<=0)end(false); }
function attack(){ if(mode!=='race'||player.hitCd>0)return; player.hitCd=.52; player.hitAnim=.36; player.kind=keys.has('ShiftLeft')?'kick':'punch'; let range=player.kind==='kick'?.42:.34; let hits=0; for(const r of rivals){ if(!r.alive)continue; if(Math.abs(r.z-player.z)<520&&Math.abs(r.x-player.x)<range){ r.health-=1; r.stun=.9; r.x+=r.x>player.x?.25:-.25; hits++; popup('HIT!','#f8d452'); if(r.health<=0){r.alive=false; player.kos++; popup('RIDER DOWN +250','#f8d452');}}} if(!hits)popup('SWING & MISS','#ffffff99'); }
function end(success){ if(mode!=='race')return; mode=success?'win':'lose'; finishedAt=levelTime; const total=success?RACE_LENGTH:player.z; const score=Math.round((success?5000:0)+player.kos*250+Math.max(0,player.health)*10); document.querySelector('.eyebrow').textContent=success?'FINISH LINE':'RACE OVER'; document.querySelector('.title').innerHTML=success?'RACE<br>COMPLETE':'WIPE<br>OUT'; document.querySelector('.subtitle').textContent=success?`POSITION #${player.rank} • ${formatTime(finishedAt)}`:`${Math.floor(total/RACE_LENGTH*100)}% OF THE COURSE`; document.getElementById('menuDesc').innerHTML=`Score: <b>${score.toLocaleString()}</b> &nbsp; • &nbsp; Knockouts: <b>${player.kos}</b><br>${success?'The highway is yours. Race again and improve your finish.':'Your bike is wrecked. Get back on the road.'}`; document.getElementById('start').textContent='RACE AGAIN →'; document.getElementById('overlay').classList.remove('hidden'); }
function update(dt){
  if(mode!=='race')return;
  levelTime+=dt; currentBg=player.z>RACE_LENGTH*.55?'night':'day';
  player.hitCd=Math.max(0,player.hitCd-dt); player.hitAnim=Math.max(0,player.hitAnim-dt); player.invuln=Math.max(0,player.invuln-dt); shake=Math.max(0,shake-dt*26); hitFlash=Math.max(0,hitFlash-dt*1.3); notice.forEach(n=>n.t-=dt); notice=notice.filter(n=>n.t>0);
  const up=held('ArrowUp'), down=held('ArrowDown'), left=held('ArrowLeft'), right=held('ArrowRight');
  const acceleration=up?3200:down?-8200:-1650; player.speed=clamp(player.speed+acceleration*dt,0,10600);
  const steer=(right?1:0)-(left?1:0), steerScale=.28+player.speed/9000; player.x += steer*dt*1.55*steerScale;
  const seg=track[Math.min(track.length-2,Math.floor(player.z/segLen))]; player.x -= seg.curve*dt*(player.speed/9600)*.62; player.lean=lerp(player.lean,clamp(steer*.85-seg.curve*.15,-1,1),Math.min(1,dt*8));
  if(Math.abs(player.x)>1.06){ player.speed=Math.min(player.speed,5400); if(Math.abs(player.x)>1.38){ player.x=clamp(player.x,-1.45,1.45); if(Math.random()<dt*.9)onHit(4,'ROUGH SHOULDER'); }}
  player.z += player.speed*dt; if(player.z>=RACE_LENGTH){ player.z=RACE_LENGTH; player.rank=1+rivals.filter(r=>r.z>player.z&&r.alive).length; end(true); return; }
  for(const h of seg.hazards){ if(levelTime-h.used<1.2)continue; if(Math.abs((seg.index*segLen)-player.z)<170 && Math.abs(h.x-player.x)<0.23){ h.used=levelTime; onHit(h.kind==='oil_slick'?9:16, h.kind==='oil_slick'?'SLIPPERY!':'OBSTACLE!'); player.x += (Math.random()-.5)*.45; }}
  for(const r of rivals){ if(!r.alive)continue; r.attackCd=Math.max(0,r.attackCd-dt); r.stun=Math.max(0,r.stun-dt); if(r.stun>0)r.speed=Math.max(1800,r.speed-2800*dt); else r.speed=lerp(r.speed,r.baseSpeed+Math.sin(levelTime*.5+r.wobble)*320,dt*.7); r.z += r.speed*dt; r.x += Math.sin(levelTime*.85+r.wobble)*dt*.17 - seg.curve*dt*.10; r.x=clamp(r.x,-.89,.89); if(Math.abs(r.z-player.z)<380&&Math.abs(r.x-player.x)<.25){ if(player.invuln===0&&r.attackCd===0){ onHit(7+r.wobble%4,`${r.name} ATTACKS!`); r.attackCd=2.2; } r.x += r.x>player.x?.12:-.12; }}
  for(const c of traffic){ c.z += c.speed*dt; if(c.z<player.z-4000)c.z=player.z+22000+Math.random()*18000; if(Math.abs(c.z-player.z)<340&&Math.abs(c.x-player.x)<(c.sprite==='truck_box'?.33:.25)){ onHit(c.sprite==='truck_box'?42:28, 'TRAFFIC HIT!'); player.x += player.x>c.x?.24:-.24; c.z += 1400; }}
  player.rank=1+rivals.filter(r=>r.z>player.z&&r.alive).length;
  if(held('Space')||held('ShiftLeft')){ if(!lastStrike)attack(); lastStrike=true; } else lastStrike=false;
}
function rect(x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function polygon(points,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(points[0][0],points[0][1]); for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]); ctx.closePath(); ctx.fill(); }
function proj(worldX,worldY,worldZ,cameraX,cameraY,cameraWorldZ){ const dz=worldZ-cameraWorldZ; if(dz<=1)return null; const scale=cameraDepth/dz; return {x:Math.round(W/2 + scale*(worldX-cameraX)*W/2), y:Math.round(H*.58 - scale*(worldY-cameraY)*H/2), w:Math.round(scale*roadWidth*W/2), scale}; }
function drawImageBottomCenter(img,x,y,h,alpha=1){ if(!img || !img.complete || !img.naturalWidth)return; const w=h*(img.naturalWidth/img.naturalHeight); ctx.globalAlpha=alpha; ctx.drawImage(img,x-w/2,y-h,w,h); ctx.globalAlpha=1; }
function backdrop(){ const img=art.backgrounds[currentBg]; if(img.complete && img.naturalWidth){ const drift=(Math.sin(levelTime*.03)+player.x*.6)*W*.03; ctx.drawImage(img,-W*.02+drift,0,W*1.04,H); } else { const sky=ctx.createLinearGradient(0,0,0,H); sky.addColorStop(0,'#304b72'); sky.addColorStop(.62,'#8aa1a6'); sky.addColorStop(1,'#efc092'); rect(0,0,W,H,sky);} }
function pickPlayerSprite(){ if(player.hitAnim>0) return player.kind==='kick'?art.bikes.player_kick:art.bikes.player_punch; if(player.lean<-0.18) return art.bikes.player_left; if(player.lean>0.18) return art.bikes.player_right; return art.bikes.player_straight; }
function pickRivalSprite(r){ return [art.bikes.rival_red,art.bikes.rival_blue,art.bikes.rival_green][r.variant%3]; }
function drawRoad(){
  const base=Math.floor(player.z/segLen), percent=(player.z%segLen)/segLen; const cameraY=cameraHeight+lerp(track[base].y,track[base+1].y,percent); const camX=player.x*roadWidth;
  let x=0,dx=0,maxy=H,segments=[];
  for(let n=0;n<drawDistance;n++){
    const i=base+n; if(i>=track.length-1)break; const seg=track[i], next=track[i+1]; const cx1=x; const p1=proj(cx1*roadWidth,seg.y,i*segLen,camX,cameraY,player.z-400); x+=dx; dx+=seg.curve*.018; const cx2=x; const p2=proj(cx2*roadWidth,next.y,(i+1)*segLen,camX,cameraY,player.z-400); if(!p1||!p2)continue; segments.push({i,seg,p1,p2,cx1,cx2});
  }
  for(let j=segments.length-1;j>=0;j--){
    const {i,p1,p2}=segments[j]; if(p1.y<=p2.y)continue; const alt=Math.floor(i/3)%2===0; rect(0,p2.y,W,p1.y-p2.y,alt?'#5f865d':'#567a54'); polygon([[p1.x-p1.w*1.18,p1.y],[p1.x+p1.w*1.18,p1.y],[p2.x+p2.w*1.18,p2.y],[p2.x-p2.w*1.18,p2.y]], alt?'#efe7d1':'#cb5d4f'); polygon([[p1.x-p1.w,p1.y],[p1.x+p1.w,p1.y],[p2.x+p2.w,p2.y],[p2.x-p2.w,p2.y]], alt?'#4b4f59':'#444952'); if(Math.floor(i/5)%2===0){ for(let lane=-1; lane<=1; lane+=2){ const f=lane/3; polygon([[p1.x+p1.w*f-p1.w*.008,p1.y],[p1.x+p1.w*f+p1.w*.008,p1.y],[p2.x+p2.w*f+p2.w*.008,p2.y],[p2.x+p2.w*f-p2.w*.008,p2.y]], '#dfdccd'); } } maxy=p2.y;
  }
  const visible=[];
  for(const s of segments){ if(s.p1.y<=s.p2.y || s.p1.y>H+120)continue; for(const sp of s.seg.sprites){ const p=proj((s.cx1 + sp.side*sp.offset)*roadWidth,s.seg.y,s.i*segLen,camX,cameraY,player.z-400); visible.push({depth:s.i*segLen,type:'roadside',p,obj:sp}); } for(const hz of s.seg.hazards){ const p=proj((s.cx1 + hz.x)*roadWidth,s.seg.y,s.i*segLen,camX,cameraY,player.z-400); visible.push({depth:s.i*segLen+1,type:'hazard',p,obj:hz}); } }
  for(const c of traffic){ if(c.z>player.z-100 && c.z<player.z+drawDistance*segLen){ const t=c.z/segLen, idx=Math.floor(t), frac=t-idx; const center=roadXAt(idx,base) + c.x; const y=lerp(track[idx].y,track[idx+1].y,frac); const p=proj(center*roadWidth,y,c.z,camX,cameraY,player.z-400); visible.push({depth:c.z,type:'vehicle',p,obj:c}); } }
  for(const r of rivals){ if(!r.alive || r.z<player.z-100 || r.z>player.z+drawDistance*segLen)continue; const t=r.z/segLen, idx=Math.floor(t), frac=t-idx; const center=roadXAt(idx,base)+r.x; const y=lerp(track[idx].y,track[idx+1].y,frac); const p=proj(center*roadWidth,y,r.z,camX,cameraY,player.z-400); visible.push({depth:r.z,type:'rival',p,obj:r}); }
  visible.sort((a,b)=>b.depth-a.depth);
  for(const v of visible){ if(!v.p)continue; if(v.type==='roadside'){ const img=art.roadside[v.obj.kind]; const h=clamp(v.p.w*.58*(v.obj.scale||1),8,H*.95); drawImageBottomCenter(img,v.p.x,v.p.y,h,.98); } else if(v.type==='hazard'){ const img=art.hazards[v.obj.kind]; const h=clamp(v.p.w*.22,8,H*.35); drawImageBottomCenter(img,v.p.x,v.p.y,h, levelTime-v.obj.used<.45?.6:1); } else if(v.type==='vehicle'){ const img=art.vehicles[v.obj.sprite]; const h=clamp(v.p.w*.45*(v.obj.sprite==='truck_box'?1.12:.92),10,H*.75); drawImageBottomCenter(img,v.p.x,v.p.y,h); } else if(v.type==='rival'){ const img=pickRivalSprite(v.obj); const h=clamp(v.p.w*.52,10,H*.82); drawImageBottomCenter(img,v.p.x,v.p.y,h); } }
}
function roadXAt(target,base){ let x=0,dx=0; for(let i=base;i<target;i++){ x+=dx; dx+=track[i].curve*.018; } return x; }
function hud(){ const u=Math.min(W/1280,H/720), pad=Math.max(14,25*u), font=px=>`900 ${Math.round(px*u)}px Arial, sans-serif`, boxWidth=Math.min(285, W*.35); ctx.fillStyle='#10151bdc'; ctx.fillRect(pad,pad,boxWidth,115*u); ctx.fillStyle='#edcc4c'; ctx.font=font(16); ctx.fillText("ROAD RAGE ‘96",pad+13*u,pad+24*u); ctx.fillStyle='#fff'; ctx.font=font(29); ctx.fillText(`${Math.round(player.speed/45)} KM/H`,pad+13*u,pad+58*u); ctx.font=font(13); ctx.fillStyle='#aeb6c7'; ctx.fillText('HEALTH',pad+13*u,pad+78*u); rect(pad+13*u,pad+86*u,boxWidth-26*u,11*u,'#39424d'); rect(pad+13*u,pad+86*u,(boxWidth-26*u)*player.health/100,11*u,player.health<25?'#ed615a':'#7edb90');
  const rx=W-pad-160*u; ctx.fillStyle='#10151bdc'; ctx.fillRect(rx,pad,160*u,115*u); ctx.textAlign='center'; ctx.fillStyle='#f2cf4a'; ctx.font=font(12); ctx.fillText('POSITION',rx+80*u,pad+22*u); ctx.fillStyle='#fff'; ctx.font=font(49); ctx.fillText(`${player.rank} / 8`,rx+80*u,pad+73*u); ctx.font=font(12); ctx.fillStyle='#d3d8db'; ctx.fillText(formatTime(levelTime),rx+80*u,pad+100*u); ctx.textAlign='left';
  const barW=Math.min(W*.40,460), barX=(W-barW)/2, barY=pad+11*u; rect(barX,barY,barW,13*u,'#151a23ba'); rect(barX,barY,barW*player.z/RACE_LENGTH,13*u,'#f3d04b'); ctx.strokeStyle='#d1d9e2a0'; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barW,13*u); ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font=font(12); ctx.fillText(`${Math.max(0,Math.ceil((RACE_LENGTH-player.z)/1000))} KM TO FINISH`,W/2,barY+32*u); ctx.textAlign='left';
  ctx.fillStyle='#111722a9'; ctx.fillRect(pad,H-74*u,175*u,49*u); ctx.font=font(13); ctx.fillStyle='#f3d04b'; ctx.fillText(`KNOCKOUTS   ${player.kos}`,pad+10*u,H-45*u); ctx.fillStyle='#fff'; ctx.fillText('SPACE  PUNCH   SHIFT  KICK',pad+10*u,H-30*u);
  notice.forEach((n,i)=>{ ctx.textAlign='center'; ctx.fillStyle=n.color; ctx.font=font(22); ctx.globalAlpha=Math.min(1,n.t); ctx.fillText(n.text,W/2,H*.27-i*28*u); ctx.globalAlpha=1; }); ctx.textAlign='left'; if(hitFlash){ ctx.fillStyle=`rgba(255,55,55,${hitFlash*.27})`; ctx.fillRect(0,0,W,H); }
}
function render(){ ctx.save(); if(shake)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); backdrop(); if(!track){ctx.restore(); return;} drawRoad(); const img=pickPlayerSprite(); const pH=Math.min(255,H*.36); const bob=Math.sin(levelTime*13)*(player.speed/10400)*4; drawImageBottomCenter(img, W/2+player.lean*36, H*.94+bob, pH, player.invuln>0 && Math.floor(levelTime*14)%2 ? .72 : 1); ctx.restore(); if(mode==='race')hud(); }
function loop(now){ const dt=Math.min((now-last)/1000,.05); last=now; update(dt); render(); requestAnimationFrame(loop); }
const startBtn=document.getElementById('start'); document.getElementById('start').addEventListener('click',()=>{reset(); last=performance.now();}); document.getElementById('pause').addEventListener('click',()=>{ if(mode==='race'){ mode='paused'; document.querySelector('.eyebrow').textContent='TAKE A BREAK'; document.querySelector('.title').innerHTML='PAUSED'; document.querySelector('.subtitle').textContent='THE HIGHWAY CAN WAIT'; document.getElementById('menuDesc').textContent='Resume the race when you are ready.'; document.getElementById('start').textContent='RESUME →'; document.getElementById('overlay').classList.remove('hidden'); } else if(mode==='paused'){ mode='race'; document.getElementById('overlay').classList.add('hidden'); } }); startBtn.addEventListener('click',e=>{ if(mode==='paused'){ e.stopImmediatePropagation(); mode='race'; document.getElementById('overlay').classList.add('hidden'); } },true);
addEventListener('keydown',e=>{ const k=keyMap[e.code]||e.code; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(k))e.preventDefault(); if((k==='KeyP'||k==='Escape')&&!e.repeat){ document.getElementById('pause').click(); return; } keys.add(k); }); addEventListener('keyup',e=>keys.delete(keyMap[e.code]||e.code)); addEventListener('blur',()=>keys.clear());
for(const el of document.querySelectorAll('[data-key]')){ const k=el.dataset.key; el.addEventListener('pointerdown',e=>{e.preventDefault(); el.setPointerCapture(e.pointerId); keys.add(k);}); const release=e=>{e.preventDefault(); keys.delete(k);}; el.addEventListener('pointerup',release); el.addEventListener('pointercancel',release); el.addEventListener('lostpointercapture',()=>keys.delete(k)); }
buildTrack(); player={z:0,x:0,speed:0,health:100,kos:0,hitCd:0,hitAnim:0,kind:'punch',lean:0,invuln:0,rank:8}; rivals=[]; traffic=[]; requestAnimationFrame(loop);
})();
