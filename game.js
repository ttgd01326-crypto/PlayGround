import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9abdb1);
scene.fog = new THREE.FogExp2(0x9abdb1, 0.0022);
const renderer = new THREE.WebGLRenderer({ canvas: $('#world'), antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 900);
const hemi = new THREE.HemisphereLight(0xd5eee0, 0x45513b, 1.3); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffedc6, 2.2); sun.position.set(-100, 160, 90); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -180; sun.shadow.camera.right = 180; sun.shadow.camera.top = 180; sun.shadow.camera.bottom = -180; scene.add(sun);
scene.add(new THREE.AmbientLight(0x79968c, .25));
const material = (color, roughness = .9) => new THREE.MeshStandardMaterial({ color, roughness });
const mats = { sand: material(0xcbb27a), grass: material(0x52734a), grass2: material(0x3e6442), bark: material(0x76583a), stone: material(0x777e70), roof: material(0x70483b), wall: material(0xc9b58e), wood: material(0x75583b), dark: material(0x263832), cloth: material(0x34483d), skin: material(0xb98763), tire: material(0x171b18), jeep: material(0x8e7045), glass: new THREE.MeshStandardMaterial({color:0x52766d, roughness:.25, transparent:true, opacity:.7}) };
const oceanMat = new THREE.MeshStandardMaterial({ color: 0x176c70, roughness: .34, metalness: .12 });
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(1100, 1100, 60, 60), oceanMat); ocean.rotation.x = -Math.PI / 2; ocean.position.y = -1; scene.add(ocean);
function heightAt(x, z) {
  const r = Math.sqrt((x / 210) ** 2 + (z / 198) ** 2);
  if (r > 1) return -2;
  const shore = clamp((1 - r) / .16, 0, 1);
  let h = 2 + Math.sin(x * .022) * 1.6 + Math.cos(z * .019) * 1.4;
  for (const [px, pz, peak, spread] of [[74,-112,72,37],[-68,-72,54,46],[15,-156,38,33],[130,20,28,34]]) h += peak * Math.exp(-(((x-px)**2+(z-pz)**2)/(spread*spread)) * 1.1);
  return Math.max(-.4, h * shore - .8);
}
function onIsland(x,z) { return (x/210)**2 + (z/198)**2 < .96; }
// Color-blended heightfield, with broad coastal shallows and a rugged interior.
{
  const n=145,size=470,positions=[],colors=[],indices=[];
  const sand=new THREE.Color(0xc8b27b), grass=new THREE.Color(0x496b43), high=new THREE.Color(0x788476), peak=new THREE.Color(0xb2b4a3);
  for(let iz=0;iz<=n;iz++) for(let ix=0;ix<=n;ix++) {
    const x=-size/2+ix*size/n,z=-size/2+iz*size/n,y=heightAt(x,z);positions.push(x,y,z);
    const r=Math.sqrt((x/210)**2+(z/198)**2);let c=r>.86?sand.clone().lerp(grass,clamp((.94-r)*13,0,1)):grass.clone().lerp(high,clamp(y/95,0,.7));
    if(y>70)c.lerp(peak,clamp((y-70)/50,0,.8));c.offsetHSL(0,0,Math.sin(x*.17+z*.13)*.018);colors.push(c.r,c.g,c.b);
    if(ix<n&&iz<n){const a=iz*(n+1)+ix,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));terrain.receiveShadow=true;scene.add(terrain);
}
// Simple stylized tropical canopy meshes keep the large island lightweight.
const trunkGeo=new THREE.CylinderGeometry(.24,.48,7,7);trunkGeo.translate(0,3.5,0);
const crownGeo=new THREE.ConeGeometry(3.2,5.6,7);crownGeo.translate(0,7.5,0);
const palmGeo=new THREE.SphereGeometry(3.5,8,6);palmGeo.scale(1,.48,1);palmGeo.translate(0,7.7,0);
const trees=[];
function addTree(x,z,scale=1,palm=false){const g=new THREE.Group();g.position.set(x,heightAt(x,z),z);g.scale.setScalar(scale);const trunk=new THREE.Mesh(trunkGeo,mats.bark);trunk.castShadow=true;g.add(trunk);if(palm){const crown=new THREE.Mesh(palmGeo,mats.grass2);crown.castShadow=true;g.add(crown);for(let i=0;i<7;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.65,5.7,4),i%2?mats.grass:mats.grass2);f.position.set(Math.cos(i*Math.PI/3.5)*2.1,7.6,Math.sin(i*Math.PI/3.5)*2.1);f.rotation.z=-.55;f.rotation.y=i*Math.PI/3.5;g.add(f)}}else{for(let i=0;i<4;i++){const c=new THREE.Mesh(crownGeo,i%2?mats.grass:mats.grass2);c.position.set(rand(-1.5,1.5),rand(-.5,1.3),rand(-1.5,1.5));c.scale.setScalar(rand(.7,1));c.castShadow=true;g.add(c)}}scene.add(g);trees.push(g);}
for(let i=0;i<190;i++){let x,z,tries=0;do{x=rand(-195,195);z=rand(-184,184);tries++;}while((!onIsland(x,z)||Math.hypot(x+48,z-38)<23||Math.hypot(x-114,z+137)<17)&&tries<50);if(onIsland(x,z))addTree(x,z,rand(.75,1.35),heightAt(x,z)<35&&Math.random()<.58);}
function box(parent,w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function house(x,z,ruined=false){const g=new THREE.Group();g.position.set(x,heightAt(x,z),z);box(g,7,3.5,6,ruined?mats.stone:mats.wall,0,1.75,0);box(g,7.5,.4,6.5,ruined?mats.stone:mats.roof,0,3.7,0);box(g,1.2,2,.15,mats.wood,0,1,.1+3);for(const sx of [-1,1])box(g,1.2,1.1,.12,mats.dark,sx*2,2.2,3.08);if(ruined){g.children[1].visible=false;for(let i=0;i<4;i++)box(g,.6,rand(1,2.5),.7,mats.stone,rand(-3,3),1,rand(-2,2));}scene.add(g);return g;}
for(const [x,z] of [[-48,38],[-61,44],[-35,50],[-54,59],[-28,32],[-73,32]])house(x,z);
for(const [x,z] of [[-105,-55],[30,-96],[145,40]])house(x,z,true);
// Coastal dock and dirt tracks lead from Palmhaven toward the northern ridge.
for(let i=0;i<8;i++)box(scene,2.4,.28,4,mats.wood,-15,heightAt(-15,196+i*4)+.3,196+i*4);
function trail(points,width=3){for(let i=0;i<points.length-1;i++){const [x1,z1]=points[i],[x2,z2]=points[i+1],dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),m=new THREE.Mesh(new THREE.BoxGeometry(width,.08,len),material(0x95805a));m.position.set((x1+x2)/2,(heightAt(x1,z1)+heightAt(x2,z2))/2+.05,(z1+z2)/2);m.rotation.y=Math.atan2(dx,dz);scene.add(m);}}
trail([[0,0],[-18,16],[-48,38],[-78,25],[-105,-5],[-140,-68]]);trail([[-48,38],[-15,53],[20,48],[63,0],[90,-65],[114,-137]],2.6);
const towerPos=new THREE.Vector3(114,heightAt(114,-137),-137),cavePos=new THREE.Vector3(-140,heightAt(-140,-68),-68);
const tower=new THREE.Group();tower.position.copy(towerPos);
for(let y=0;y<20;y+=5){for(const [x,z] of [[-1.6,-1.6],[1.6,-1.6],[-1.6,1.6],[1.6,1.6]]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.1,.17,5,5),mats.dark);post.position.set(x,y+2.5,z);post.castShadow=true;tower.add(post);}box(tower,3.8,.12,.12,mats.wood,0,y+5,0);}
box(tower,4,.3,4,mats.wood,0,20,0);const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.06,.1,8,6),mats.dark);antenna.position.y=24;tower.add(antenna);const beacon=new THREE.PointLight(0xffc96c,2,28);beacon.position.y=27;tower.add(beacon);scene.add(tower);
const caveRing=new THREE.Mesh(new THREE.TorusGeometry(4,.6,8,20,Math.PI),mats.stone);caveRing.position.set(cavePos.x,cavePos.y+3.5,cavePos.z);caveRing.rotation.z=Math.PI;scene.add(caveRing);
const vehicles=[];
function makeVehicle(x,z,bike=false){const g=new THREE.Group();g.position.set(x,heightAt(x,z)+.25,z);if(!bike){box(g,4.2,1.25,2.25,mats.jeep,0,1.15,0);box(g,2.2,1.15,1.9,mats.jeep,0,2.3,-.15);box(g,2,.75,.08,mats.glass,0,2.35,.82);for(const sx of [-1,1])for(const sz of [-.8,.8]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.57,.57,.32,12),mats.tire);w.rotation.z=Math.PI/2;w.position.set(sx*1.52,.55,sz);g.add(w)}}else{box(g,.65,.42,1.7,material(0xb24e32),0,1.25,0);for(const z1 of [-.75,.75]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.47,.47,.18,12),mats.tire);w.rotation.z=Math.PI/2;w.position.set(0,.55,z1);g.add(w)}box(g,.7,.18,.7,mats.dark,0,1.65,-.1);}g.userData={bike,occupied:false};scene.add(g);vehicles.push(g);return g;}
makeVehicle(-22,17);makeVehicle(-13,28,true);makeVehicle(10,8);
// Survivor avatar and wildlife.
const player=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(.4,.8,4,8),mats.cloth);body.position.y=1.35;body.castShadow=true;player.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),mats.skin);head.position.y=2.2;player.add(head);box(player,.52,.7,.3,mats.bark,0,1.4,-.42);const legs=[];for(const x of [-.2,.2]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.64,3,6),material(0x354238));leg.position.set(x,.47,0);player.add(leg);legs.push(leg);}player.position.set(1,heightAt(1,1),1);scene.add(player);
const animals=[];
function animal(x,z,boar=false){const g=new THREE.Group(),fur=material(boar?0x715242:0x907454);const b=new THREE.Mesh(new THREE.SphereGeometry(.52,9,7),fur);b.scale.set(1.35,.8,.75);b.position.y=1;g.add(b);const h=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),fur);h.position.set(0,1.45,.62);g.add(h);for(const dx of [-.32,.32])for(const dz of [-.28,.28]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,.65,5),fur);l.position.set(dx,.4,dz);g.add(l);}g.position.set(x,heightAt(x,z),z);g.userData={tx:x+rand(-18,18),tz:z+rand(-18,18),speed:rand(.7,1.5),phase:rand(0,6)};scene.add(g);animals.push(g);}
for(let i=0;i<15;i++){const x=rand(-180,180),z=rand(-165,165);if(onIsland(x,z)&&heightAt(x,z)<38)animal(x,z,i%4===0);}
function marker(color){const g=new THREE.Group();const ring=new THREE.Mesh(new THREE.RingGeometry(1,1.25,20),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=3;g.add(ring);const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.4),new THREE.MeshBasicMaterial({color}));gem.position.y=3.5;g.add(gem);scene.add(g);return g;}
const missionMarker=marker(0xe5c66f),caveMarker=marker(0x82c4a4);missionMarker.position.copy(towerPos);caveMarker.position.copy(cavePos);caveMarker.visible=false;
const mini=$('#minimap').getContext('2d'),big=$('#bigmap').getContext('2d');
let discovered=false,missionStep=0;
function drawMap(ctx,w,h){ctx.fillStyle='#15332e';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.scale(w/500,h/500);ctx.beginPath();ctx.ellipse(0,0,210,198,0,0,Math.PI*2);const grad=ctx.createLinearGradient(-150,-190,130,180);grad.addColorStop(0,'#777f67');grad.addColorStop(.5,'#52734d');grad.addColorStop(1,'#c6ad76');ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle='#e2d09b';ctx.lineWidth=3;ctx.stroke();for(const [x,z,r] of [[74,-112,35],[-68,-72,42],[15,-156,30]]){ctx.beginPath();ctx.arc(x,z,r,0,Math.PI*2);ctx.fillStyle='#898f81';ctx.fill();}ctx.strokeStyle='#a28c62';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-48,38);ctx.lineTo(-105,-5);ctx.lineTo(-140,-68);ctx.moveTo(-48,38);ctx.lineTo(20,48);ctx.lineTo(63,0);ctx.lineTo(114,-137);ctx.stroke();ctx.restore();const dot=(x,z,c,r)=>{ctx.beginPath();ctx.arc(w/2+x*w/500,h/2+z*h/500,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();};dot(towerPos.x,towerPos.z,'#e5c66f',w>200?6:3);if(discovered)dot(cavePos.x,cavePos.z,'#82c4a4',w>200?5:3);dot(player.position.x,player.position.z,'#a5e8ca',w>200?7:4);}
drawMap(mini,180,180);drawMap(big,720,500);
let elapsed=0,weatherClock=0,gameTime=8.4,weather='CLEAR',active=false,health=100,energy=100,medkits=2,occupied=null,yaw=0,pitch=.24,toastTimer=0,missionDone=false;
const keys=new Set(),clockEl=$('#clock'),interaction=$('#interaction'),toastEl=$('#toast');
function notify(text){toastEl.textContent=text;toastEl.classList.add('show');toastTimer=3.2;}
function setWeather(next){weather=next;$('#weather-label').textContent=next;$('#weather-icon').textContent=next==='RAIN'?'☂':next==='MIST'?'◌':'☀';}
function setMission(title,description,step){$('#mission-title').textContent=title;$('#mission-description').textContent=description;$('.mission-index').textContent=`0${step} / 04`;missionMarker.position.copy(step===2?cavePos:towerPos);missionMarker.visible=!missionDone;}
function toggleMap(force){const panel=$('#map-overlay'),open=force??!panel.classList.contains('open');panel.classList.toggle('open',open);if(open)drawMap(big,720,500);}
$('#start-button').addEventListener('click',()=>{active=true;$('#start-overlay').classList.add('hidden');notify('Find the radio tower above Palmhaven.');});
$('#map-toggle').addEventListener('click',()=>toggleMap());$('#map-close').addEventListener('click',()=>toggleMap(false));$('#map-overlay').addEventListener('click',e=>{if(e.target===$('#map-overlay'))toggleMap(false);});
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyM')toggleMap();if(e.code==='KeyE'&&active)interact();if(e.code==='Digit1'&&active&&medkits>0&&health<100){medkits--;health=Math.min(100,health+45);$('#medkit-count').textContent=medkits;notify('Medkit used · health restored.');}});
addEventListener('keyup',e=>keys.delete(e.code));
let dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&active){dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(dragging){yaw-=(e.clientX-lastX)*.004;pitch=clamp(pitch+(e.clientY-lastY)*.003,-.12,.8);lastX=e.clientX;lastY=e.clientY;}});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
const touchMove={x:0,y:0};let stickActive=false;const stick=$('#touch-stick'),knob=$('#stick-knob');
function updateStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.min(42,Math.hypot(dx,dy)),a=Math.atan2(dy,dx);touchMove.x=Math.cos(a)*len/42;touchMove.y=Math.sin(a)*len/42;knob.style.transform=`translate(${touchMove.x*30}px,${touchMove.y*30}px)`;}
stick.addEventListener('pointerdown',e=>{stickActive=true;stick.setPointerCapture(e.pointerId);updateStick(e);});stick.addEventListener('pointermove',e=>{if(stickActive)updateStick(e);});const releaseStick=()=>{stickActive=false;touchMove.x=touchMove.y=0;knob.style.transform='translate(0,0)';};stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);
$('#touch-sprint').addEventListener('pointerdown',()=>keys.add('ShiftLeft'));['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#touch-sprint').addEventListener(ev,()=>keys.delete('ShiftLeft')));$('#touch-action').addEventListener('click',()=>{if(active)interact();});
function nearestTarget(){let best=null,dist=Infinity;const p=player.position;for(const v of vehicles){if(v.userData.occupied)continue;const d=p.distanceTo(v.position);if(d<dist){dist=d;best={kind:'vehicle',object:v,distance:d};}}const td=p.distanceTo(towerPos);if(td<dist){dist=td;best={kind:'tower',object:tower,distance:td};}const cd=p.distanceTo(cavePos);if(cd<dist){dist=cd;best={kind:'cave',object:caveRing,distance:cd};}return best;}
function interact(){if(occupied){occupied.userData.occupied=false;occupied=null;player.visible=true;notify('You left the vehicle.');return;}const target=nearestTarget();if(!target||target.distance>8){notify('Nothing close enough to interact with.');return;}if(target.kind==='vehicle'){occupied=target.object;occupied.userData.occupied=true;player.visible=false;notify(occupied.userData.bike?'Motorbike ready.':'Jeep ready. Drive carefully.');return;}if(target.kind==='tower'){if(missionStep===0){missionStep=1;missionMarker.visible=false;discovered=true;caveMarker.visible=true;setMission('A voice below the ridge','The tower is alive, but the reply points toward a cave on the western cliffs.',2);$('#objective-copy').textContent='GROTTO · UNKNOWN';notify('Radio restored · new signal detected west.');}else if(missionStep>=1){notify('The radio tower is transmitting.');}return;}if(target.kind==='cave'){if(!discovered){notify('A narrow opening disappears into the cliff.');return;}missionStep=3;missionDone=true;caveMarker.visible=false;$('#mission-title').textContent='The island remembers';$('#mission-description').textContent='You found the source of the signal. Your story on Vesper Island is only beginning.';$('.mission-index').textContent='04 / 04';$('#mission-progress').style.width='100%';$('#mission-distance').textContent='FOUND';$('#objective-copy').textContent='SIGNAL · FOUND';notify('Hidden location discovered · mission complete.');}}
let cameraTarget=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3();
function locationName(){const x=player.position.x,z=player.position.z;if(Math.hypot(x+48,z-38)<34)return 'Palmhaven Village';if(Math.hypot(x-114,z+137)<24)return 'Old Signal Ridge';if(Math.hypot(x+140,z+68)<25)return 'Whisper Grotto';if(z>135)return 'Palmhaven Coast';if(Math.hypot(x+105,z+55)<20)return 'Overgrown Ruins';return heightAt(x,z)>38?'Vesper Highlands':'The Green Interior';}
function updateHUD(dt){const target=missionStep===0?towerPos:missionStep<3?cavePos:null;let dist=target?Math.hypot(player.position.x-target.x,player.position.z-target.z):0;$('#mission-distance').textContent=missionDone?'FOUND':`${(dist/1000).toFixed(2)} km`;$('#mission-progress').style.width=missionStep===0?`${clamp((1-dist/230)*100,4,92)}%`:missionStep<3?`${Math.min(96,50+Math.max(0,1-dist/220)*45)}%`:'100%';if(!missionDone)$('#objective-copy').textContent=`${missionStep===0?'TOWER':'GROTTO'} · ${(dist/1000).toFixed(2)} KM`;
$('#location-name').textContent=locationName();$('#coords').textContent=`N ${String(Math.round(400+player.position.z)).padStart(3,'0')}° · E ${String(Math.round(600+player.position.x)).padStart(3,'0')}°`;$('#health-value').textContent=Math.round(health);$('#health-bar').style.width=`${health}%`;$('#energy-value').textContent=Math.round(energy);$('#energy-bar').style.width=`${energy}%`;$('.status-state').innerHTML=health<30?'<i></i> CRITICAL':health<65?'<i></i> WOUNDED':'<i></i> STABLE';
const near=nearestTarget(),canUse=near&&near.distance<8;interaction.classList.toggle('visible',active&&(occupied||canUse));$('#interaction-text').textContent=occupied?'EXIT VEHICLE':canUse?(near.kind==='vehicle'?'ENTER VEHICLE':near.kind==='tower'?'TUNE RADIO':'INVESTIGATE'):'INTERACT';if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toastEl.classList.remove('show');}}
function movePlayer(dt){let mx=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touchMove.x,my=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0)-touchMove.y;const mag=Math.hypot(mx,my);if(mag>1){mx/=mag;my/=mag;}const sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&energy>1&&Math.abs(my+mx)>.05;const speed=occupied?(occupied.userData.bike?14:10):sprint?8:4.7;if(sprint)energy=Math.max(0,energy-dt*14);else energy=Math.min(100,energy+dt*5.5);
forward.set(Math.sin(yaw),0,Math.cos(yaw));right.set(Math.cos(yaw),0,-Math.sin(yaw));let dx=(right.x*mx+forward.x*my)*speed*dt,dz=(right.z*mx+forward.z*my)*speed*dt;const moving=Math.hypot(dx,dz)>.001;if(occupied){occupied.position.x+=dx;occupied.position.z+=dz;occupied.position.x=clamp(occupied.position.x,-205,205);occupied.position.z=clamp(occupied.position.z,-192,192);occupied.position.y=heightAt(occupied.position.x,occupied.position.z)+.25;occupied.rotation.y=Math.atan2(dx,dz);player.position.copy(occupied.position);}else{const nx=player.position.x+dx,nz=player.position.z+dz;if(onIsland(nx,nz)&&heightAt(nx,nz)>-0.1){player.position.x=nx;player.position.z=nz;}player.position.y=heightAt(player.position.x,player.position.z);if(moving)player.rotation.y=Math.atan2(dx,dz);}
legs.forEach((leg,i)=>leg.rotation.x=moving?Math.sin(elapsed*11+i*Math.PI)*.65:0);
for(const a of animals){const u=a.userData;u.phase+=dt;if(Math.hypot(a.position.x-player.position.x,a.position.z-player.position.z)<11){u.tx=a.position.x+(a.position.x-player.position.x)*2;u.tz=a.position.z+(a.position.z-player.position.z)*2;}if(Math.hypot(u.tx-a.position.x,u.tz-a.position.z)<2||!onIsland(u.tx,u.tz)){u.tx=a.position.x+rand(-18,18);u.tz=a.position.z+rand(-18,18);}const angle=Math.atan2(u.tx-a.position.x,u.tz-a.position.z),d=Math.hypot(u.tx-a.position.x,u.tz-a.position.z),step=Math.min(d,u.speed*dt);a.position.x+=Math.sin(angle)*step;a.position.z+=Math.cos(angle)*step;a.position.y=heightAt(a.position.x,a.position.z);a.rotation.y=angle;a.position.y+=Math.sin(u.phase*3)*.035;}
}
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-(frame.last||now))/1000);frame.last=now;elapsed+=dt;weatherClock+=dt;gameTime=(gameTime+dt*.035)%24;const hour=gameTime,dayAmount=clamp((Math.sin((hour-6)/12*Math.PI)+.18)/1.12,0,1);sun.intensity=.12+dayAmount*2.35;hemi.intensity=.35+dayAmount*1.1;sun.position.set(Math.cos(hour/24*Math.PI*2)*150,Math.max(8,dayAmount*210),Math.sin(hour/24*Math.PI*2)*120);scene.background.setHSL(.52,.25,.12+dayAmount*.42);scene.fog.color.setHSL(.51,.21,.13+dayAmount*.37);scene.fog.density=weather==='MIST'?.0052:weather==='RAIN'?.0028:.0018;
const hh=Math.floor(hour).toString().padStart(2,'0'),mm=Math.floor((hour%1)*60).toString().padStart(2,'0');clockEl.textContent=`${hh}:${mm}`;$('#survival-day').textContent=`DAY ${String(Math.floor(elapsed/240)+1).padStart(2,'0')}`;
if(weatherClock>85){weatherClock=0;const r=Math.random();setWeather(r<.57?'CLEAR':r<.84?'RAIN':'MIST');}
if(active)movePlayer(dt);
const follow=occupied?10:7.5,focusHeight=occupied?2:1.55;cameraTarget.set(player.position.x,player.position.y+focusHeight,player.position.z);desiredCamera.set(player.position.x-Math.sin(yaw)*Math.cos(pitch)*follow,player.position.y+focusHeight+Math.sin(pitch)*follow,player.position.z-Math.cos(yaw)*Math.cos(pitch)*follow);camera.position.lerp(desiredCamera,1-Math.exp(-dt*5));camera.lookAt(cameraTarget);
missionMarker.rotation.y+=dt*.55;caveMarker.rotation.y-=dt*.45;beacon.intensity=1.5+Math.sin(elapsed*3)*.5;
if(active)updateHUD(dt);if(Math.floor(elapsed*4)!==Math.floor((elapsed-dt)*4)){drawMap(mini,180,180);if($('#map-overlay').classList.contains('open'))drawMap(big,720,500);}
renderer.render(scene,camera);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));});
setWeather('CLEAR');camera.position.set(0,8,-9);camera.lookAt(player.position.x,player.position.y+1.5,player.position.z);requestAnimationFrame(frame);


