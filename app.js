"use strict";
const $=s=>document.querySelector(s);
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
const pick=(a,n)=>shuffle(a).slice(0,n);
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'');
const ROUND=8;

/* ---------- sauvegarde ---------- */
let S={st:{},pts:0,sound:true,voice:true};
try{
  const t=JSON.parse(localStorage.getItem('supercp')||'null');
  if(t){
    S=Object.assign(S,t);
    if(t.stars&&!t.st){S.st={};for(const k in t.stars)S.st[k+':1']=t.stars[k]}
    delete S.stars;
  }
}catch(e){}
const save=()=>{try{localStorage.setItem('supercp',JSON.stringify(S))}catch(e){}};

/* ---------- sons et voix ---------- */
let ac;
function tone(f,t,d,type='sine',v=.2){
  if(!S.sound)return;
  try{
    ac=ac||new (window.AudioContext||window.webkitAudioContext)();
    if(ac.state==='suspended')ac.resume();
    const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime+t;
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);
    o.connect(g);g.connect(ac.destination);o.start(n);o.stop(n+d+.05);
  }catch(e){}
}
const sfx={
  ok(){[523,659,784].forEach((f,i)=>tone(f,i*.09,.25))},
  sad(){tone(330,0,.3,'triangle',.15);tone(247,.2,.4,'triangle',.15)},
  tap(){tone(660,0,.12,'sine',.12)},
  win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,i*.13,.3,'square',.08))}
};
let frVoice=null,enVoice=null;
function loadVoice(){
  try{
    const vs=speechSynthesis.getVoices(),lg=v=>(v.lang||'').toLowerCase().replace('_','-');
    frVoice=vs.find(v=>lg(v).startsWith('fr'))||null;
    enVoice=vs.find(v=>lg(v)==='en-gb')||vs.find(v=>lg(v)==='en-us')||vs.find(v=>lg(v).startsWith('en'))||null;
  }catch(e){}
}
if('speechSynthesis' in window){loadVoice();speechSynthesis.onvoiceschanged=loadVoice}
function utter(t,rate,pitch){
  const u=new SpeechSynthesisUtterance(t);
  u.lang='fr-FR';u.rate=rate;u.pitch=pitch;if(frVoice)u.voice=frVoice;return u;
}
function say(t){
  if(!S.voice||!('speechSynthesis' in window)||!t)return;
  try{speechSynthesis.cancel();speechSynthesis.speak(utter(t,.85,1.1))}catch(e){}
}
function speakNow(t,cb,lang){
  let done=false;const fin=()=>{if(!done){done=true;cb()}};
  if(!('speechSynthesis' in window)){setTimeout(fin,2400);return}
  try{
    speechSynthesis.cancel();
    let u;
    if(lang==='en'){u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=.75;u.pitch=1.15;if(enVoice)u.voice=enVoice}
    else u=utter(t,.8,1.2);
    u.onend=fin;u.onerror=fin;
    speechSynthesis.speak(u);
    setTimeout(fin,Math.max(3500,t.length*180));
  }catch(e){setTimeout(fin,2400)}
}
function sayEn(t,rate=.8){
  if(!('speechSynthesis' in window)||!t)return;
  try{
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang='en-GB';u.rate=rate;u.pitch=1.05;if(enVoice)u.voice=enVoice;
    speechSynthesis.speak(u);
  }catch(e){}
}
const speakL=(t,l)=>l==='en'?sayEn(t):say(t);

/* ---------- melodies (WebAudio, style boite a musique) ---------- */
const SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function nf(n){
  const m=/^([A-G])([#b]?)(\d)$/.exec(n);if(!m)return 0;
  const s=SEMI[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);
  return 440*Math.pow(2,(s-9+12*(+m[3]-4))/12);
}
const parseTune=str=>str.trim().split(/\s+/).map(x=>{const p=x.split(':');return [p[0],p[1]?+p[1]:1]});
let tuneTimers=[],tuneNodes=[];
function stopTune(){
  tuneTimers.forEach(clearTimeout);tuneTimers=[];
  tuneNodes.forEach(o=>{try{o.stop()}catch(e){}});tuneNodes=[];
}
function playTune(t,onLine,onEnd){
  stopTune();
  try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){ac=null}
  const spb=60/t.bpm;let at=.2;
  t.lines.forEach((ln,li)=>{
    tuneTimers.push(setTimeout(()=>onLine(li),at*1000));
    for(const [n,b] of parseTune(ln)){
      const f=nf(n),d=b*spb;
      if(f&&ac){
        try{
          const st=ac.currentTime+at,en=st+d*.92+.12;
          const g=ac.createGain();g.gain.setValueAtTime(.0001,st);g.gain.linearRampToValueAtTime(.3,st+.02);g.gain.exponentialRampToValueAtTime(.001,en);
          g.connect(ac.destination);
          [['triangle',f,1],['sine',f*2,.35]].forEach(([ty,fr,k])=>{
            const o=ac.createOscillator(),h=ac.createGain();o.type=ty;o.frequency.value=fr;h.gain.value=k;
            o.connect(h);h.connect(g);o.start(st);o.stop(en+.05);tuneNodes.push(o);
          });
        }catch(e){}
      }
      at+=d;
    }
  });
  tuneTimers.push(setTimeout(onEnd,(at+.4)*1000));
}

/* ---------- voix du parent : enregistrement local (IndexedDB), rien n'est envoye ---------- */
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open('supercp-voix',1);r.onupgradeneeded=()=>r.result.createObjectStore('rec');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function recGet(k){try{const d=await idb();return await new Promise(res=>{const q=d.transaction('rec').objectStore('rec').get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>res(null)})}catch(e){return null}}
async function recPut(k,v){const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('rec','readwrite');t.objectStore('rec').put(v,k);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
async function recDel(k){try{const d=await idb();return await new Promise(res=>{const t=d.transaction('rec','readwrite');t.objectStore('rec').delete(k);t.oncomplete=res;t.onerror=res})}catch(e){}}
let MR=null,MS=null;
function abortRec(){
  try{if(MR&&MR.state!=='inactive'){MR.onstop=null;MR.stop()}}catch(e){}
  try{MS&&MS.getTracks().forEach(t=>t.stop())}catch(e){}
  MR=null;MS=null;
}
async function startRec(onData){
  const st=await navigator.mediaDevices.getUserMedia({audio:true});
  MS=st;
  const types=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg'];
  const mt=(window.MediaRecorder&&MediaRecorder.isTypeSupported)?types.find(t=>MediaRecorder.isTypeSupported(t)):'';
  MR=mt?new MediaRecorder(st,{mimeType:mt}):new MediaRecorder(st);
  const ch=[],mr=MR;
  mr.ondataavailable=e=>{if(e.data&&e.data.size)ch.push(e.data)};
  mr.onstop=()=>{st.getTracks().forEach(t=>t.stop());onData(new Blob(ch,{type:mr.mimeType||mt||'audio/webm'}))};
  mr.start();
}
const endRec=()=>{try{MR&&MR.state!=='inactive'&&MR.stop()}catch(e){}};

function confetti(n=60,x=innerWidth/2,y=innerHeight/3){
  const set=['🎉','⭐','✨','💖','🌈','🎈'];
  for(let k=0;k<n;k++){
    const p=document.createElement('i');p.className='cf';p.textContent=set[rnd(set.length)];
    p.style.left=x+'px';p.style.top=y+'px';
    p.style.setProperty('--dx',(rnd(500)-250)+'px');
    p.style.setProperty('--dy',(rnd(450)-150)+'px');
    p.style.setProperty('--r',(rnd(720)-360)+'deg');
    document.body.appendChild(p);setTimeout(()=>p.remove(),1600);
  }
}
const show=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));return $('#'+id)};

/* ---------- données ---------- */
const W=[['🍎','pomme'],['🐱','chat'],['🌙','lune'],['🐟','poisson'],['🏠','maison'],['🌳','arbre'],['🚗','voiture'],['⭐','étoile'],['🍌','banane'],['🐶','chien'],['☀️','soleil'],['🍰','gâteau'],['🐘','éléphant'],['🦁','lion'],['🚲','vélo'],['🎈','ballon'],['📖','livre'],['🐸','grenouille'],['🍓','fraise'],['🌹','rose'],['🐢','tortue'],['🧀','fromage'],['🦋','papillon'],['🐻','ours'],['🍞','pain'],['🥕','carotte'],['🐴','cheval'],['🐭','souris'],['🦆','canard'],['👑','couronne'],['🎸','guitare'],['🍕','pizza'],['🚀','fusée'],['🐙','pieuvre'],['🦒','girafe'],['🐷','cochon']];
const SHORT=W.filter(x=>[...x[1]].length<=5);
const SPELL=W.filter(x=>{const n=[...x[1]].length;return n>=3&&n<=6});
const SY=[['🌙','lu-ne'],['🚲','vé-lo'],['🐢','tor-tue'],['🍰','gâ-teau'],['🎈','bal-lon'],['🐴','che-val'],['🐭','sou-ris'],['🦆','ca-nard'],['🏠','mai-son'],['🌹','ro-se'],['🐷','co-chon'],['🚀','fu-sée'],['🍕','pi-zza'],['🍓','frai-se'],['🐬','dau-phin'],
 ['🍌','ba-na-ne'],['🐘','é-lé-phant'],['🦒','gi-ra-fe'],['🥕','ca-rot-te'],['👑','cou-ron-ne'],['🚗','voi-tu-re'],['🧀','fro-ma-ge'],['🦋','pa-pi-llon'],['🐸','gre-nouil-le'],['🍅','to-ma-te'],['✈️','a-vi-on'],['🍫','cho-co-lat'],['🦄','li-cor-ne'],['🐊','cro-co-di-le'],['🚁','hé-li-cop-tère']];
const SENT=[
 ['Je mange une pomme rouge','🍎'],['Le chat dort sur le canapé','🐱'],['La lune brille dans la nuit','🌙'],
 ['Le soleil est jaune et chaud','☀️'],['Papa roule en voiture','🚗'],['La grenouille saute dans l\'eau','🐸'],
 ['Le poisson nage dans la mer','🐟'],['Je lis un livre','📖'],['Le lion rugit très fort','🦁'],
 ['La fusée vole vers les étoiles','🚀'],['Je gonfle un ballon','🎈'],['La tortue avance lentement','🐢'],
 ['L\'oiseau chante dans l\'arbre','🐦'],['La girafe a un long cou','🦒'],['Le cheval galope dans le pré','🐴'],
 ['Maman mange une pizza','🍕'],['Le canard nage sur la mare','🦆'],['Le cochon aime la boue','🐷']
];
const COUNT=[['🍎','pommes'],['⭐','étoiles'],['🎈','ballons'],['🐟','poissons'],['🌸','fleurs'],['❤️','cœurs'],['🦆','canards'],['🍬','bonbons'],['🐞','coccinelles'],['🍓','fraises']];
const SH=[
 ['cercle','le cercle','<circle cx="50" cy="50" r="42"/>',0],
 ['carré','le carré','<rect x="14" y="14" width="72" height="72" rx="4"/>',0],
 ['rectangle','le rectangle','<rect x="6" y="28" width="88" height="44" rx="4"/>',0],
 ['triangle','le triangle','<polygon points="50,8 94,90 6,90"/>',0],
 ['losange','le losange','<polygon points="50,4 94,50 50,96 6,50"/>',0],
 ['étoile','l\'étoile','<polygon points="50,5 62,37 96,38 69,59 79,93 50,73 21,93 31,59 4,38 38,37"/>',1],
 ['cœur','le cœur','<path d="M50 90C8 60 4 30 27 19c12-5 23 3 23 13 0-10 11-18 23-13 23 11 19 41-23 71z"/>',0]
];
const SH0=SH.filter(x=>['cercle','carré','rectangle','triangle','étoile'].includes(x[0]));
const COL=[['rouge','#ef4444'],['bleu','#3b82f6'],['vert','#22c55e'],['jaune','#facc15'],['orange','#f97316'],['violet','#8b5cf6'],['rose','#ec4899'],['marron','#92400e'],['noir','#111827']];
const COL0=COL.filter(x=>['rouge','bleu','vert','jaune','orange'].includes(x[0]));
const COL2=[['rouge','rouge','#ef4444'],['bleu','bleue','#3b82f6'],['vert','verte','#22c55e'],['jaune','jaune','#facc15'],['orange','orange','#f97316'],['violet','violette','#8b5cf6']];
/* [question, bonne reponse, mauvaises reponses, niveau 0 facile / 1 moyen / 2 difficile] */
const MONDE=[
 ['Quel animal miaule ?','🐱',['🐶','🐮','🐸'],0],
 ['Quel animal aboie ?','🐶',['🐱','🐴','🐟'],0],
 ['Qui vit dans l\'eau ?','🐟',['🐘','🦁','🐴'],0],
 ['Qui sait voler ?','🦅',['🐢','🐷','🐘'],0],
 ['Que mange le lapin ?','🥕',['🍕','🍰','🧀'],0],
 ['Que prend-on quand il pleut ?','☂️',['🕶️','🩳','🍦'],0],
 ['Que voit-on dans le ciel la nuit ?','🌙',['☀️','🌈','🚗'],0],
 ['Avec quoi voit-on ?','👀',['👂','👃','👅'],0],
 ['Avec quoi entend-on ?','👂',['👀','👃','👅'],0],
 ['Quel animal a une très longue trompe ?','🐘',['🦒','🦁','🐢'],0],
 ['Quel animal fait coin-coin ?','🦆',['🐄','🐑','🐓'],0],
 ['Qui donne du lait ?','🐄',['🐓','🐟','🦆'],0],
 ['Quel fruit est jaune et courbé ?','🍌',['🍎','🍓','🍇'],0],
 ['Quel animal a une carapace ?','🐢',['🐟','🐘','🦒'],0],
 ['Qu\'est-ce qui roule sur la route ?','🚗',['🏠','🌳','🍎'],0],
 ['Qui nous éclaire le jour ?','☀️',['🌙','⭐','☁️'],0],
 ['Quel animal a de très longues oreilles ?','🐰',['🐭','🐸','🐷'],0],
 ['Quelle saison fait tomber les feuilles ?','automne',['été','hiver','printemps'],1],
 ['Quelle saison est la plus froide ?','hiver',['été','automne','printemps'],1],
 ['Quel jour vient après lundi ?','mardi',['jeudi','samedi','dimanche'],1],
 ['Quel jour vient après vendredi ?','samedi',['lundi','mardi','mercredi'],1],
 ['Combien y a-t-il de jours dans une semaine ?','7',['5','6','10'],1],
 ['Quel mois vient après janvier ?','février',['mars','décembre','juin'],1],
 ['De quelle couleur est le ciel par beau temps ?','bleu',['vert','rouge','noir'],1],
 ['Combien de doigts a une main ?','5',['3','4','6'],1],
 ['Quel mois vient après mai ?','juin',['avril','août','mars'],2],
 ['Combien y a-t-il de mois dans une année ?','12',['10','7','20'],2],
 ['Quelle est la capitale de la France ?','Paris',['Lyon','Marseille','Nice'],2],
 ['Quel animal est un insecte ?','🐝',['🐟','🐘','🐸'],2],
 ['Sur quelle planète vivons-nous ?','la Terre',['Mars','la Lune','le Soleil'],2],
 ['Quel est le contraire de chaud ?','froid',['grand','petit','lent'],2],
 ['Quel est le contraire de grand ?','petit',['gros','long','fort'],2],
 ['Combien de pattes a une araignée ?','8',['4','6','2'],2],
 ['Combien de pattes a un chien ?','4',['2','6','8'],2],
 ['Quel est le premier jour de la semaine ?','lundi',['dimanche','mardi','samedi'],2],
 ['Quelle saison vient après l\'été ?','automne',['hiver','printemps'],2],
 ['Quelle saison vient après l\'hiver ?','printemps',['été','automne'],2],
 ['Quel animal pond des œufs ?','🐔',['🐄','🐕','🐖'],2],
 ['De quelle couleur est une fraise mûre ?','rouge',['verte','bleue','noire'],2],
 ['Que fait-on avec un crayon ?','écrire',['manger','dormir','nager'],2],
 ['Quel est le plus grand animal de la mer ?','🐋',['🐟','🐙','🦀'],2]
];
/* Comptines traditionnelles du domaine public */
const SONGS=[
 {t:'Frère Jacques',e:'🔔',tune:{bpm:112,lines:['C4 D4 E4 C4 C4 D4 E4 C4','E4 F4 G4:2 E4 F4 G4:2','G4:.5 A4:.5 G4:.5 F4:.5 E4 C4 G4:.5 A4:.5 G4:.5 F4:.5 E4 C4','C4 G3 C4:2 C4 G3 C4:2']},lines:['Frère Jacques, Frère Jacques,','Dormez-vous ? Dormez-vous ?','Sonnez les matines ! Sonnez les matines !','Ding, daing, dong ! Ding, daing, dong !']},
 {t:'Au clair de la lune',e:'🌙',tune:{bpm:96,lines:['G4 G4 G4 A4 B4:2 A4:2','G4 B4 A4 A4 G4:3 r:1','G4 G4 G4 A4 B4:2 A4:2','G4 B4 A4 A4 G4:3 r:1','A4 A4 A4 A4 E4:2 E4:2','A4 G4 F#4 E4 D4:3 r:1','G4 G4 G4 A4 B4:2 A4:2','G4 B4 A4 A4 G4:3 r:1']},lines:['Au clair de la lune,','Mon ami Pierrot,','Prête-moi ta plume','Pour écrire un mot.','Ma chandelle est morte,','Je n\'ai plus de feu.','Ouvre-moi ta porte,','Pour l\'amour de Dieu.']},
 {t:'Sur le pont d\'Avignon',e:'🌉',tune:{bpm:200,lines:['F4 F4 F4:2 G4 G4 G4:2','A4 Bb4 C5 F4 E4 F4 G4 C4:2','F4 F4 F4:2 G4 G4 G4:2','A4 Bb4 C5 F4 G4 E4 F4:3 r:1']},lines:['Sur le pont d\'Avignon,','L\'on y danse, l\'on y danse,','Sur le pont d\'Avignon,','L\'on y danse tous en rond.']},
 {t:'Alouette',e:'🐦',lines:['Alouette, gentille alouette,','Alouette, je te plumerai.','Je te plumerai la tête,','Je te plumerai la tête,','Et la tête, et la tête,','Alouette, alouette, ah !']},
 {t:'Il pleut, bergère',e:'🌧️',lines:['Il pleut, il pleut, bergère,','Presse tes blancs moutons.','Allons sous la chaumière,','Bergère, vite, allons.','J\'entends sur le feuillage','L\'eau qui tombe à grand bruit.','Voici, voici l\'orage,','Voilà l\'éclair qui luit.']},
 {t:'Une souris verte',e:'🐭',lines:['Une souris verte','Qui courait dans l\'herbe,','Je l\'attrape par la queue,','Je la montre à ces messieurs.','Ces messieurs me disent :','Trempez-la dans l\'huile,','Trempez-la dans l\'eau,','Ça fera un escargot tout chaud.']},
 {t:'Ainsi font, font, font',e:'🎭',lines:['Ainsi font, font, font','Les petites marionnettes,','Ainsi font, font, font,','Trois p\'tits tours et puis s\'en vont.']},
 {t:'Savez-vous planter les choux',e:'🥬',lines:['Savez-vous planter les choux,','À la mode, à la mode,','Savez-vous planter les choux,','À la mode de chez nous ?','On les plante avec le doigt,','À la mode, à la mode,','On les plante avec le doigt,','À la mode de chez nous.']},
 {t:'Mon beau sapin',e:'🎄',lines:['Mon beau sapin, roi des forêts,','Que j\'aime ta verdure.','Quand par l\'hiver, bois et guérets','Sont dépouillés de leurs attraits,','Mon beau sapin, roi des forêts,','Tu gardes ta parure.']},
 {t:'Meunier, tu dors',e:'🌾',lines:['Meunier, tu dors,','Ton moulin va trop vite.','Meunier, tu dors,','Ton moulin va trop fort.','Ton moulin, ton moulin','Va trop vite.','Ton moulin, ton moulin','Va trop fort.']},
 {t:'Twinkle, twinkle',e:'⭐',en:1,tune:{bpm:100,lines:['C4 C4 G4 G4 A4 A4 G4:2','F4 F4 E4 E4 D4 D4 C4:2','G4 G4 F4 F4 E4 E4 D4:2','G4 G4 F4 F4 E4 E4 D4:2','C4 C4 G4 G4 A4 A4 G4:2','F4 F4 E4 E4 D4 D4 C4:2']},lines:['Twinkle, twinkle, little star,','How I wonder what you are.','Up above the world so high,','Like a diamond in the sky.','Twinkle, twinkle, little star,','How I wonder what you are.']},
 {t:'Row, row, row your boat',e:'🚣',en:1,tune:{bpm:130,lines:['C4 C4 C4:.75 D4:.25 E4:2','E4:.75 D4:.25 E4:.75 F4:.25 G4:2','C5:.333 C5:.333 C5:.333 G4:.333 G4:.333 G4:.333 E4:.333 E4:.333 E4:.333 C4:.333 C4:.333 C4:.333','G4:.75 F4:.25 E4:.75 D4:.25 C4:2']},lines:['Row, row, row your boat,','Gently down the stream.','Merrily, merrily, merrily, merrily,','Life is but a dream.']},
 {t:'Old MacDonald',e:'🐮',en:1,tune:{bpm:112,lines:['G4 G4 G4 D5 E5 E5 D5:2','B4 B4 A4 A4 G4:2 r:2']},lines:['Old MacDonald had a farm,','E-I-E-I-O.']}
];
/* [anglais, francais, emoji, theme] */
const VOC=[
 ['cat','chat','🐱','animals'],['dog','chien','🐶','animals'],['fish','poisson','🐟','animals'],['bird','oiseau','🐦','animals'],
 ['horse','cheval','🐴','animals'],['pig','cochon','🐷','animals'],['cow','vache','🐮','animals'],['duck','canard','🦆','animals'],
 ['frog','grenouille','🐸','animals'],['lion','lion','🦁','animals'],['elephant','éléphant','🐘','animals'],['monkey','singe','🐵','animals'],
 ['rabbit','lapin','🐰','animals'],['mouse','souris','🐭','animals'],['bear','ours','🐻','animals'],['sheep','mouton','🐑','animals'],
 ['red','rouge','🔴','colors'],['blue','bleu','🔵','colors'],['green','vert','🟢','colors'],['yellow','jaune','🟡','colors'],
 ['orange','orange','🟠','colors'],['purple','violet','🟣','colors'],['black','noir','⚫','colors'],['white','blanc','⚪','colors'],['brown','marron','🟤','colors'],
 ['one','un','1️⃣','numbers'],['two','deux','2️⃣','numbers'],['three','trois','3️⃣','numbers'],['four','quatre','4️⃣','numbers'],['five','cinq','5️⃣','numbers'],
 ['six','six','6️⃣','numbers'],['seven','sept','7️⃣','numbers'],['eight','huit','8️⃣','numbers'],['nine','neuf','9️⃣','numbers'],['ten','dix','🔟','numbers'],
 ['apple','pomme','🍎','food'],['banana','banane','🍌','food'],['bread','pain','🍞','food'],['milk','lait','🥛','food'],['cheese','fromage','🧀','food'],
 ['egg','œuf','🥚','food'],['cake','gâteau','🍰','food'],['pizza','pizza','🍕','food'],['water','eau','💧','food'],['strawberry','fraise','🍓','food'],
 ['carrot','carotte','🥕','food'],['ice cream','glace','🍦','food'],
 ['mum','maman','👩','family'],['dad','papa','👨','family'],['baby','bébé','👶','family'],['girl','fille','👧','family'],['boy','garçon','👦','family'],
 ['grandma','mamie','👵','family'],['grandpa','papi','👴','family'],
 ['hand','main','✋','body'],['head','tête','📍','body',1],['hair','cheveux','📍','body',1],['neck','cou','📍','body',1],['shoulder','épaule','📍','body',1],['tummy','ventre','📍','body',1],['knee','genou','📍','body',1],['eye','œil','👁️','body'],['ear','oreille','👂','body'],['nose','nez','👃','body'],['mouth','bouche','👄','body'],['foot','pied','🦶','body'],
 ['arm','bras','💪','body'],['leg','jambe','🦵','body'],['finger','doigt','☝️','body'],['thumb','pouce','👍','body'],['tooth','dent','🦷','body'],['tongue','langue','👅','body'],['brain','cerveau','🧠','body'],['bone','os','🦴','body'],['heart','cœur','❤️','body'],
 ['house','maison','🏠','objects'],['car','voiture','🚗','objects'],['book','livre','📖','objects'],['ball','ballon','⚽','objects'],['tree','arbre','🌳','objects'],
 ['sun','soleil','☀️','objects'],['moon','lune','🌙','objects'],['star','étoile','⭐','objects'],['flower','fleur','🌸','objects'],['bike','vélo','🚲','objects'],
 ['plane','avion','✈️','objects'],['boat','bateau','⛵','objects'],
 ['happy','content','😀','feelings'],['sad','triste','😢','feelings'],['hot','chaud','🔥','feelings'],['cold','froid','🥶','feelings'],['sleepy','fatigué','😴','feelings'],['angry','en colère','😠','feelings']
];
/* [anglais, francais, emoji, image evidente ?] */
const SENT_EN=[
 ['I like pizza','J\'aime la pizza','🍕',1],['I have a cat','J\'ai un chat','🐱',1],['I see a dog','Je vois un chien','🐶',1],['It is red','C\'est rouge','🔴',1],
 ['I like cake','J\'aime le gâteau','🍰',1],['I see the sun','Je vois le soleil','☀️',1],['I have a ball','J\'ai un ballon','⚽',1],['It is a house','C\'est une maison','🏠',1],
 ['I eat an apple','Je mange une pomme','🍎',1],['I see a fish','Je vois un poisson','🐟',1],
 ['I am happy','Je suis content','😀',0],['I am hungry','J\'ai faim','🍽️',0],['Good night','Bonne nuit','😴',0],['Thank you','Merci','🙏',0],
 ['Good morning','Bonjour','🌅',0],['Happy birthday','Joyeux anniversaire','🎂',0],['I love you','Je t\'aime','❤️',0],['How are you','Comment vas-tu','🙂',0]
];
const VP=VOC.filter(v=>!v[4]);
const THEMES=[['animals','Animaux','🐾'],['colors','Couleurs','🎨'],['numbers','Nombres','🔢'],['food','Nourriture','🍎'],['family','Famille','👨‍👩‍👧'],['body','Corps','🖐️'],['objects','Objets','🏠'],['feelings','Émotions','😀']];
const STICKERS=['🦄','🐉','🐬','🦖','🐼','🐨','🦉','🐯','🦜','🐞','🌈','🚒','🚁','🏰','🎠','🎨','🎹','⚽','🍦','🧁','🎺','🛸','🚂','🏆'];
const praise=['Bravo !','Super !','Génial !','Bien joué !','Oui !','Top !'];
const hi=['Salut ! On joue ?','Choisis un jeu !','Prêt pour des étoiles ?','Réfléchis bien : une seule chance par question !'];

/* ---------- aides ---------- */
const fl=w=>norm(w)[0].toUpperCase();
const isEmoji=s=>/\p{Extended_Pictographic}/u.test(s);
function numChoices(ans,min,max,n=4){
  const s=new Set([ans]);let g=0;
  while(s.size<n&&g++<200){const d=ans+rnd(7)-3;if(d>=min&&d<=max)s.add(d)}
  for(let k=min;s.size<n&&k<=max;k++)s.add(k);
  return shuffle([...s]).map(v=>({h:`<b>${v}</b>`,ok:v===ans,say:String(v)}));
}
const rep=(e,n,cls='')=>Array.from({length:n},(_,k)=>`<span class="${typeof cls==='function'?cls(k):cls}">${e}</span>`).join('');
const rr=(a,b)=>a+rnd(b-a+1);

/* ---------- generateurs : make(i, niveau) ---------- */
function mkLettres(i,L){
  if(L===2){
    const w=SPELL[rnd(SPELL.length)],parts=[...w[1]];
    const pool=[...'abcdefghilmnoprstuv'].filter(c=>!parts.includes(c));
    let tiles=shuffle([...parts,...pick(pool,2)]),g=0;
    while(tiles.slice(0,parts.length).join('')===w[1]&&g++<20)tiles=shuffle(tiles);
    return {type:'build',key:w[1],say:'Écris le mot en touchant les lettres dans l\'ordre.',title:'Écris le mot lettre par lettre',
      vis:`<div class="big">${w[0]}</div>`,parts,tiles,word:w[1]};
  }
  const n=L===0?3:4,w=W[rnd(W.length)],Lt=fl(w[1]);
  if(rnd(2)){
    const others=pick([...new Set(W.map(x=>fl(x[1])))].filter(l=>l!==Lt),n-1);
    return {key:Lt,say:`Par quelle lettre commence le mot ${w[1]} ?`,title:'Par quelle lettre commence ce mot ?',
      vis:`<div class="big">${w[0]}</div><div class="word">${w[1]}</div>`,
      choices:shuffle([Lt,...others]).map(l=>({h:`<b>${l}${l.toLowerCase()}</b>`,ok:l===Lt,say:l})),cols:n};
  }
  const seen=new Set([Lt]),ch=[w];
  for(const x of shuffle(W)){const f=fl(x[1]);if(!seen.has(f)){seen.add(f);ch.push(x);if(ch.length===n)break}}
  return {key:Lt,say:`Quel mot commence par la lettre ${Lt} ?`,title:'Quel mot commence par cette lettre ?',
    vis:`<div class="letter">${Lt}<span>${Lt.toLowerCase()}</span></div>`,
    choices:shuffle(ch).map(x=>({h:`<span class="e">${x[0]}</span><small>${x[1]}</small>`,ok:x===w,say:x[1]})),cols:2};
}
function mkSyll(i,L){
  const pool=SY.filter(s=>{const n=s[1].split('-').length;return L===0?n===2:L===1?n<=3:n>=3});
  const s=pool[rnd(pool.length)],parts=s[1].split('-');
  let tiles=parts;
  if(L===2){
    const extra=pick(SY.flatMap(x=>x[1].split('-')).filter(p=>!parts.includes(p)),2);
    tiles=[...parts,...extra];
  }
  tiles=shuffle(tiles);let g=0;
  while(tiles.slice(0,parts.length).join()===parts.join()&&g++<20)tiles=shuffle(tiles);
  return {type:'build',key:parts.join(''),say:'Remets les syllabes dans l\'ordre pour écrire le mot.',
    title:L===2?'Choisis les bonnes syllabes dans l\'ordre':'Remets les syllabes dans l\'ordre',
    vis:`<div class="big">${s[0]}</div>`,parts,tiles,word:parts.join('')};
}
function mkMots(i,L){
  if(L===2){
    const s=SENT[rnd(SENT.length)],low=s[0].toLowerCase();
    const ch=[s[1],...pick(W.filter(x=>x[0]!==s[1]&&!low.includes(x[1])).map(x=>x[0]),3)];
    return {key:s[1],say:'Lis la phrase et trouve la bonne image.',title:'Lis la phrase et trouve l\'image',
      vis:`<div class="sent">${s[0]}.</div>`,
      choices:shuffle(ch).map(e=>({h:`<span class="e">${e}</span>`,ok:e===s[1]})),cols:2};
  }
  const P=L===0?SHORT:W,n=L===0?3:4,w=P[rnd(P.length)];
  if(rnd(2)){
    const ch=[w,...pick(P.filter(x=>x!==w),n-1)];
    return {key:w[1],say:'Lis le mot et trouve la bonne image.',title:'Quelle image va avec ce mot ?',
      vis:`<div class="word">${w[1]}</div>`,
      choices:shuffle(ch).map(x=>({h:`<span class="e">${x[0]}</span>`,ok:x===w,say:x[1]})),cols:n===3?3:2};
  }
  const ch=[w,...pick(P.filter(x=>x!==w&&x[1][0]!==w[1][0]),n-1)];
  return {key:w[1],say:w[1],title:'Écoute et trouve le mot écrit',
    vis:`<div class="big" style="font-size:clamp(3rem,16vw,6rem)">🔊</div><div style="font-weight:800">Touche le haut-parleur pour réécouter</div>`,
    choices:shuffle(ch).map(x=>({h:`<b>${x[1]}</b>`,ok:x===w,t:1})),cols:1};
}
function mkCompter(i,L){
  const [lo,hi2]=[[1,9],[3,14],[10,20]][L],n=rr(lo,hi2),c=COUNT[rnd(COUNT.length)];
  return {key:String(n),say:`Combien y a-t-il de ${c[1]} ?`,title:`Combien y a-t-il de ${c[1]} ?`,
    vis:`<div class="items${n>12?' sm':''}">${rep(c[0],n)}</div>`,
    choices:numChoices(n,0,hi2+2,L===0?3:4),cols:L===0?3:4};
}
function mkAdd(i,L){
  const c=COUNT[rnd(COUNT.length)][0];
  if(L===2){
    const r=rr(5,20),a=rr(1,r-1),b=r-a,left=rnd(2)===0;
    return {key:String(b),say:`Quel nombre faut-il ajouter à ${a} pour faire ${r} ?`,title:'Quel nombre manque ?',
      vis:`<div class="calc">${left?`${a} + ? = ${r}`:`? + ${a} = ${r}`}</div>`,choices:numChoices(b,0,19),cols:4};
  }
  const mx=L===0?10:20,r=rr(2,mx),a=rr(1,r-1),b=r-a;
  const vis=r<=12?`<div class="eq"><div class="grp">${rep(c,a)}</div><span class="op">+</span><div class="grp">${rep(c,b)}</div></div>`:'';
  return {key:String(r),say:`Combien font ${a} plus ${b} ?`,title:'Combien ça fait ?',
    vis:`${vis}<div class="calc">${a} + ${b} = ?</div>`,choices:numChoices(r,0,mx,L===0?3:4),cols:L===0?3:4};
}
function mkSous(i,L){
  const c=COUNT[rnd(COUNT.length)][0];
  if(L===2&&rnd(2)){
    const a=rr(5,20),b=rr(1,a),r=a-b;
    return {key:String(b),say:`Quel nombre faut-il enlever à ${a} pour faire ${r} ?`,title:'Quel nombre manque ?',
      vis:`<div class="calc">${a} − ? = ${r}</div>`,choices:numChoices(b,0,20),cols:4};
  }
  const top=L===0?10:20,r=rr(0,top-1),a=rr(Math.max(r,L===2?11:1),top),b=a-r;
  const vis=a<=12?`<div class="items">${rep(c,a,k=>k>=a-b?'x':'')}</div>`:'';
  return {key:String(r),say:`Combien font ${a} moins ${b} ?`,title:'Combien ça fait ?',
    vis:`${vis}<div class="calc">${a} − ${b} = ?</div>`,choices:numChoices(r,0,a>10?20:10,L===0?3:4),cols:L===0?3:4};
}
function mkNombres(i,L){
  const mx=[10,20,60][L],t=rnd(L===0?4:L===1?5:6);
  if(t===0){const n=rr(1,mx-1);return {key:String(n+1),say:`Quel nombre vient juste après ${n} ?`,title:`Quel nombre vient juste après ${n} ?`,vis:`<div class="seq">${n} → ?</div>`,choices:numChoices(n+1,0,mx+1),cols:4}}
  if(t===1){const n=rr(2,mx);return {key:String(n-1),say:`Quel nombre vient juste avant ${n} ?`,title:`Quel nombre vient juste avant ${n} ?`,vis:`<div class="seq">? ← ${n}</div>`,choices:numChoices(n-1,0,mx),cols:4}}
  if(t===2||t===3){
    const s=new Set();while(s.size<3)s.add(rr(0,mx));const a=[...s],big=t===2,ans=big?Math.max(...a):Math.min(...a);
    return {key:String(ans),say:big?'Touche le plus grand nombre.':'Touche le plus petit nombre.',title:big?'Touche le plus GRAND nombre':'Touche le plus PETIT nombre',
      vis:`<div class="big">${big?'🐘':'🐭'}</div>`,choices:a.map(n=>({h:`<b>${n}</b>`,ok:n===ans,say:String(n)})),cols:3};
  }
  if(t===4){
    const st=rr(1,mx-4),k=rr(1,3),ans=st+k,sq=[0,1,2,3].map(j=>j===k?'?':st+j).join(' , ');
    return {key:String(ans),say:'Quel est le nombre qui manque ?',title:'Quel est le nombre qui manque ?',vis:`<div class="seq">${sq}</div>`,choices:numChoices(ans,0,mx+4),cols:4};
  }
  const n=rr(10,mx),d=Math.floor(n/10),u=n%10,askT=rnd(2)===0,ans=askT?d:u;
  return {key:String(ans),say:`Dans le nombre ${n}, quel est le chiffre des ${askT?'dizaines':'unités'} ?`,
    title:`Dans ${n}, quel est le chiffre des ${askT?'dizaines':'unités'} ?`,
    vis:`<div class="seq"><span style="color:#ec4899">${d}</span><span style="color:#3b82f6">${u}</span></div><div style="font-weight:800"><span style="color:#ec4899">dizaines</span> et <span style="color:#3b82f6">unités</span></div>`,
    choices:numChoices(ans,0,9),cols:4};
}
function svgShape(x,fill){return `<div class="shape"><svg viewBox="0 0 100 100" fill="${fill}" stroke="rgba(0,0,0,.25)" stroke-width="3">${x[2]}</svg></div>`}
function mkFormes(i,L){
  if(L===2){
    const t=SH[rnd(SH.length)],c=COL2[rnd(COL2.length)];
    const t2=pick(SH.filter(x=>x!==t),2),c2=pick(COL2.filter(x=>x!==c),2);
    const opts=[[t,c],[t2[0],c],[t,c2[0]],[t2[1],c2[1]]];
    const adj=t[3]?c[1]:c[0];
    return {key:t[0]+c[0],say:`Touche ${t[1]} ${adj}.`,title:`Touche ${t[1]} ${adj}`,vis:`<div class="big">🔷</div>`,
      choices:shuffle(opts).map(o=>({h:svgShape(o[0],o[1][2]),ok:o[0]===t&&o[1]===c})),cols:2};
  }
  const shapes=L===0?SH0:SH,cols=L===0?COL0:COL,n=L===0?3:4;
  if(rnd(2)){
    const t=shapes[rnd(shapes.length)],ch=[t,...pick(shapes.filter(x=>x!==t),n-1)],pal=pick(COL,n);
    return {key:t[0],say:`Touche ${t[1]}.`,title:`Touche ${t[1]}`,vis:`<div class="big">🔷</div>`,
      choices:shuffle(ch).map((x,k)=>({h:svgShape(x,pal[k][1]),ok:x===t,say:x[0]})),cols:n===3?3:2};
  }
  const t=cols[rnd(cols.length)],ch=[t,...pick(cols.filter(x=>x!==t),n-1)];
  return {key:t[0],say:`Touche la couleur ${t[0]}.`,title:`Touche la couleur : ${t[0]}`,vis:`<div class="big">🎨</div>`,
    choices:shuffle(ch).map(x=>({h:`<div class="sw" style="background:${x[1]}"></div>`,ok:x===t,say:x[0]})),cols:n===3?3:2};
}
const mondeBag={};
function mkMonde(i,L){
  if(!mondeBag[L]||!mondeBag[L].length)mondeBag[L]=shuffle(MONDE.filter(m=>L===0?m[3]===0:L===1?m[3]<=1:m[3]>=1));
  const q=mondeBag[L].pop(),ch=shuffle([q[1],...q[2]]);
  return {key:q[1],say:q[0],title:q[0],vis:`<div class="big">🌍</div>`,
    choices:ch.map(a=>({h:isEmoji(a)?`<span class="e">${a}</span>`:`<b>${a}</b>`,ok:a===q[1],t:!isEmoji(a),say:isEmoji(a)?undefined:a})),cols:2};
}

/* ---------- comptines : mots manquants ---------- */
const cleanW=t=>t.replace(/[.,;:!?«»"“”()]/g,'');
function clozeSpots(s){
  const out=[];
  s.lines.forEach((ln,li)=>ln.split(' ').forEach((tok,wi)=>{
    const c=cleanW(tok);
    if(c.length>=4&&!/['’-]/.test(c))out.push({li,wi,c});
  }));
  return out;
}
function mkCloze(s){
  const spots=clozeSpots(s),sp=spots[rnd(spots.length)];
  const toks=s.lines[sp.li].split(' ');
  const cap=w=>sp.wi===0?w[0].toUpperCase()+w.slice(1):w.toLowerCase();
  const ans=cap(sp.c);
  const others=[...new Set(spots.map(x=>cap(x.c)))].filter(w=>w.toLowerCase()!==ans.toLowerCase());
  const extra=(s.en?['house','garden','river','music','night']:['maison','soleil','jardin','lumière','chanson']).map(cap).filter(w=>!others.includes(w)&&w!==ans);
  const ch=[ans,...pick(others,2),...extra].slice(0,3);
  while(ch.length<3)ch.push(extra[ch.length]||(s.en?'cloud':'nuage'));
  const shown=toks.map((t,k)=>k===sp.wi?t.replace(sp.c,'_____'):t).join(' ');
  return {key:sp.li+':'+sp.wi,lang:s.en?'en':undefined,say:s.en?'Find the missing word.':'Trouve le mot qui manque dans la comptine.',sayOk:s.lines[sp.li],title:s.en?'Which word is missing?':'Quel est le mot qui manque ?',
    vis:`<div style="font-size:3rem">${s.e}</div><div class="sent">${shown}</div>`,
    choices:shuffle(ch).map(w=>({h:`<b>${w}</b>`,ok:w===ans,t:1,say:w,lang:s.en?'en':undefined})),cols:1};
}

/* ---------- anglais ---------- */
const poolL=L=>VP.filter(v=>L===0?['animals','colors'].includes(v[3]):L===1?['animals','colors','numbers','food','family','body'].includes(v[3]):true);
function distract(w,pool,n,L){
  const other=pool.filter(x=>x!==w&&x[2]!==w[2]);
  const out=L>=1?shuffle(other.filter(x=>x[3]===w[3])).slice(0,n):[];
  for(const x of shuffle(other)){if(out.length>=n)break;if(!out.includes(x))out.push(x)}
  return out;
}
function mkEnEcoute(i,L){
  const vis=`<div class="big" style="font-size:clamp(3rem,16vw,6rem)">👂</div><div style="font-weight:800">Touche 🔊 en haut pour réécouter</div>`;
  if(L===2){
    const E=SENT_EN.filter(x=>x[3]),s=E[rnd(E.length)],ch=[s,...pick(E.filter(x=>x!==s),3)];
    return {key:s[0],lang:'en',say:s[0],title:'Écoute la phrase et trouve l\'image',vis,
      choices:shuffle(ch).map(x=>({h:`<span class="e">${x[2]}</span>`,ok:x===s,say:x[0],lang:'en'})),cols:2};
  }
  const pool=poolL(L),n=L===0?3:4,w=pool[rnd(pool.length)],ch=[w,...distract(w,pool,n-1,L)];
  return {key:w[0],lang:'en',say:w[0],title:'Écoute et trouve l\'image',vis,
    choices:shuffle(ch).map(x=>({h:`<span class="e">${x[2]}</span>`,ok:x===w,say:x[0],lang:'en'})),cols:n===3?3:2};
}
function mkEnMots(i,L){
  if(L===2){
    const w=VP[rnd(VP.length)],ch=[w,...distract(w,VP,3,1)];
    return {key:w[0],lang:'en',say:w[0],title:'Que veut dire ce mot ?',
      vis:`<div class="word">${w[0]}</div><div style="font-weight:800">Touche 🔊 en haut pour l'écouter</div>`,
      choices:shuffle(ch).map(x=>({h:`<b>${x[1]}</b>`,ok:x===w,t:1,say:w[0],lang:'en'})),cols:2};
  }
  const pool=poolL(L),n=L===0?3:4,w=pool[rnd(pool.length)],ch=[w,...distract(w,pool,n-1,L)];
  return {key:w[0],say:`Comment dit-on ${w[1]} en anglais ?`,title:'Comment dit-on en anglais ?',
    vis:`<div class="big">${w[2]}</div><div class="word" style="font-size:clamp(1.6rem,8vw,2.6rem)">${w[1]}</div>`,
    choices:shuffle(ch).map(x=>({h:`<b>${x[0]}</b>`,ok:x===w,t:1,say:x[0],lang:'en'})),cols:n===3?1:2};
}
function mkEnRepete(i,L){
  let en,emo,big=false;
  if(L===2){
    const longW=VP.filter(v=>v[0].length>=6).map(v=>[v[0],v[1],v[2]]);
    const p=rnd(10)<7?SENT_EN[rnd(SENT_EN.length)]:longW[rnd(longW.length)];
    en=p[0];emo=p[2];big=en.includes(' ');
  }else{const pool=poolL(L),w=pool[rnd(pool.length)];en=w[0];emo=w[2]}
  return {type:'speak',key:en,lang:'en',say:en,title:'Écoute, puis répète à voix haute',
    vis:`<div class="big">${emo}</div><div class="word"${big?' style="font-size:clamp(1.6rem,8vw,2.8rem)"':''}>${en}</div><div class="hear"><button class="ib" id="h1" title="Écouter">🔊</button><button class="ib" id="h2" title="Écouter lentement">🐢</button></div>`};
}
const speakBody=()=>`<div class="micwrap"><button class="btn b" id="pnext">🗣️ Je l'ai dit ! ➡️</button></div>`;
function speakUI(q,adv){
  $('#h1').onclick=()=>sayEn(q.say,.8);
  $('#h2').onclick=()=>sayEn(q.say,.5);
  $('#pnext').onclick=()=>{if(G.locked)return;G.locked=true;sfx.ok();G.res.push(1);adv(0)};
}
function finishPractice(){
  const el=show('end');
  el.innerHTML=`<div class="m">🦊</div><h1>Bien joué !</h1><p>Tu as écouté et répété en anglais. Ici, pas de note : on s'entraîne.</p><div class="btns"><button class="btn a" id="again">🔁 Encore</button><button class="btn b" id="menuB">⬅️ Retour</button></div>`;
  const a=G.a,L=G.L;
  $('#again').onclick=()=>{sfx.tap();start(a,L,{practice:true})};
  $('#menuB').onclick=()=>{sfx.tap();levelScreen(a)};
  sfx.win();confetti(30);
}

/* ---------- le corps : bonhomme avec fleches ---------- */
/* [anglais, francais, x, y de la pointe, cote, y de l'etiquette] (coordonnees du dessin, decalage +20 ajoute au trace) */
const BP={
 hair:['hair','cheveux',140,46,'l',40],eye:['eye','œil',158,95,'l',82],ear:['ear','oreille',110,102,'l',124],shoulder:['shoulder','épaule',134,186,'l',176],
 hand:['hand','main',92,296,'l',290],knee:['knee','genou',146,358,'l',352],foot:['foot','pied',130,410,'l',410],
 head:['head','tête',212,78,'r',40],nose:['nose','nez',182,113,'r',82],mouth:['mouth','bouche',194,135,'r',124],neck:['neck','cou',190,163,'r',166],
 arm:['arm','bras',247,238,'r',212],tummy:['tummy','ventre',190,242,'r',262],leg:['leg','jambe',210,384,'r',336]
};
const BKEYS=Object.keys(BP),BSH=20,NUMC=['#ef4444','#3b82f6','#16a34a','#f59e0b'];
function bodySVG(o={}){
  const sk='#ffd9b3',ol='#7c4a1e';
  let ov='';
  if(o.all){
    ov=BKEYS.map(k=>{
      const p=BP[k],L=p[4]==='l',lx=L?86:294,tx=p[2]+BSH;
      return `<g class="lb" data-p="${k}"><rect x="${L?0:290}" y="${p[5]-15}" width="90" height="30" fill="transparent"/><line x1="${lx}" y1="${p[5]}" x2="${tx}" y2="${p[3]}" stroke="#ef4444" stroke-width="3" marker-end="url(#ah)"/><text x="${L?3:377}" y="${p[5]+6}" text-anchor="${L?'start':'end'}" font-size="19" font-weight="900" fill="#4c1d95" stroke="#fff" stroke-width="4" paint-order="stroke">${p[0]}</text></g>`;
    }).join('');
  }
  if(o.only){
    const p=BP[o.only],L=p[4]==='l';
    ov=`<line x1="${L?30:350}" y1="${p[3]}" x2="${p[2]+BSH+(L?-4:4)}" y2="${p[3]}" stroke="#ef4444" stroke-width="7" stroke-linecap="round" marker-end="url(#ah2)" class="arr"/>`;
  }
  if(o.marks){
    ov=o.marks.map((k,n)=>`<circle cx="${BP[k][2]+BSH}" cy="${BP[k][3]}" r="14" fill="${NUMC[n]}" stroke="#fff" stroke-width="3"/><text x="${BP[k][2]+BSH}" y="${BP[k][3]+6}" text-anchor="middle" font-size="18" font-weight="900" fill="#fff">${n+1}</text>`).join('');
  }
  return `<svg viewBox="0 0 380 440" class="fig" role="img" aria-label="Un enfant dessiné">
  <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#ef4444"/></marker><marker id="ah2" markerWidth="5" markerHeight="5" refX="3.5" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="#ef4444"/></marker></defs>
  <g transform="translate(${BSH},0)" stroke="${ol}" stroke-width="2" stroke-linejoin="round">
   <line x1="155" y1="322" x2="152" y2="395" stroke="${sk}" stroke-width="22" stroke-linecap="round"/><line x1="205" y1="322" x2="208" y2="395" stroke="${sk}" stroke-width="22" stroke-linecap="round"/>
   <ellipse cx="146" cy="408" rx="24" ry="11" fill="#ef4444"/><ellipse cx="214" cy="408" rx="24" ry="11" fill="#ef4444"/>
   <circle cx="153" cy="358" r="11" fill="#f5c28f"/><circle cx="207" cy="358" r="11" fill="#f5c28f"/>
   <rect x="134" y="288" width="92" height="38" rx="9" fill="#f59e0b"/>
   <line x1="130" y1="192" x2="98" y2="282" stroke="#3b82f6" stroke-width="22" stroke-linecap="round"/><line x1="230" y1="192" x2="262" y2="282" stroke="#3b82f6" stroke-width="22" stroke-linecap="round"/>
   <circle cx="96" cy="294" r="13" fill="${sk}"/><circle cx="264" cy="294" r="13" fill="${sk}"/>
   <rect x="130" y="172" width="100" height="120" rx="24" fill="#3b82f6"/><circle cx="180" cy="242" r="4" fill="#1e3a8a" stroke="none"/>
   <rect x="168" y="150" width="24" height="26" fill="${sk}"/>
   <circle cx="118" cy="102" r="11" fill="${sk}"/><circle cx="242" cy="102" r="11" fill="${sk}"/>
   <circle cx="180" cy="95" r="60" fill="${sk}"/>
   <path d="M120 92Q118 30 180 32Q242 30 240 92Q226 64 202 60Q176 72 150 60Q128 68 120 92Z" fill="#5b3a1e"/>
   <circle cx="158" cy="97" r="9" fill="#fff"/><circle cx="202" cy="97" r="9" fill="#fff"/><circle cx="160" cy="98" r="4.5" fill="#111" stroke="none"/><circle cx="204" cy="98" r="4.5" fill="#111" stroke="none"/>
   <circle cx="180" cy="113" r="6" fill="#f9a8a8"/>
   <path d="M160 131Q180 150 200 131" fill="none" stroke="#dc2626" stroke-width="4" stroke-linecap="round"/>
  </g>${ov}</svg>`;
}
function farEnough(ms){
  for(let a=0;a<ms.length;a++)for(let b=a+1;b<ms.length;b++){
    const p=BP[ms[a]],q=BP[ms[b]];if(Math.hypot(p[2]-q[2],p[3]-q[3])<34)return false;
  }
  return true;
}
const BP0=['head','eye','nose','mouth','hand','foot','arm','leg'];
function mkEnCorps(i,L){
  if(L===2){
    const w=BKEYS[rnd(BKEYS.length)];let ms,t=0;
    do{ms=shuffle([w,...pick(BKEYS.filter(x=>x!==w),3)]);t++}while(t<80&&!farEnough(ms));
    return {key:w,lang:'en',say:BP[w][0],title:'Écoute, puis touche le bon numéro',
      vis:`<div class="figbox">${bodySVG({marks:ms})}</div>`,
      choices:ms.map((k,n)=>({h:`<span class="num" style="background:${NUMC[n]}">${n+1}</span>`,ok:k===w,say:BP[w][0],lang:'en'})),cols:4};
  }
  const pool=L===0?BP0:BKEYS,w=pool[rnd(pool.length)],n=L===0?3:4;
  return {key:w,lang:'en',say:'',title:'Que montre la flèche ?',
    vis:`<div class="figbox">${bodySVG({only:w})}</div>`,
    choices:shuffle([w,...pick(pool.filter(x=>x!==w),n-1)]).map(x=>({h:`<b>${BP[x][0]}</b>`,ok:x===w,t:1,say:BP[x][0],lang:'en'})),cols:n===3?1:2};
}
function learnScreen(th){
  stopSong();
  const el=show('learn'),items=VOC.filter(v=>v[3]===th);
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="lb">🏠</button><div class="title" style="flex:1;margin:0">📒 Mes mots anglais</div><span class="ib" style="visibility:hidden"></span></div>
  <div class="tabs">${THEMES.map(t=>`<button class="tab${t[0]===th?' on':''}" data-t="${t[0]}">${t[2]}<small>${t[1]}</small></button>`).join('')}</div>
  ${th==='body'?`<div class="figbox big2">${bodySVG({all:true})}</div>`:''}
  <div class="vgrid">${items.map((v,k)=>`<button class="vc" data-k="${k}"><span class="e">${v[2]}</span><b>${v[0]}</b><small>${v[1]}</small></button>`).join('')}</div>
  <div class="foot" style="margin:6px 0 0">Touche une carte${th==='body'?' ou un mot du dessin':''} pour entendre le mot</div></div>`;
  $('#lb').onclick=home;
  el.querySelectorAll('.lb').forEach(g=>g.onclick=()=>{sfx.tap();sayEn(BP[g.dataset.p][0],.8);el.querySelectorAll('.lb').forEach(x=>x.classList.toggle('on',x===g))});
  el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{sfx.tap();learnScreen(b.dataset.t)});
  el.querySelectorAll('.vc').forEach(b=>b.onclick=()=>{
    el.querySelectorAll('.vc').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    sayEn(items[+b.dataset.k][0],.8);
  });
}

/* ---------- activites ---------- */
const ACT=[
 {id:'lettres',name:'Les lettres',ic:'🔤',cat:'Lecture',bg:'#f97316,#fb923c',make:mkLettres,lv:['Reconnaître une lettre (3 choix)','Reconnaître une lettre (4 choix)','Écrire des mots lettre par lettre']},
 {id:'syllabes',name:'Les syllabes',ic:'🧩',cat:'Lecture',bg:'#ec4899,#f472b6',make:mkSyll,lv:['Mots de 2 syllabes','Mots de 2 et 3 syllabes','Longs mots avec syllabes en trop']},
 {id:'mots',name:'Lire des mots',ic:'📖',cat:'Lecture',bg:'#8b5cf6,#a78bfa',make:mkMots,lv:['Mots courts','Tous les mots','Lire des phrases']},
 {id:'comptines',name:'Comptines',ic:'🎵',cat:'Lecture',bg:'#f43f5e,#fb7185',songs:true},
 {id:'compter',name:'Compter',ic:'🍎',cat:'Maths',bg:'#22c55e,#4ade80',make:mkCompter,lv:['Jusqu\'à 9','Jusqu\'à 14','Jusqu\'à 20']},
 {id:'add',name:'Additions',ic:'➕',cat:'Maths',bg:'#3b82f6,#60a5fa',make:mkAdd,lv:['Résultat jusqu\'à 10','Résultat jusqu\'à 20','Trouver le nombre qui manque']},
 {id:'sous',name:'Soustractions',ic:'➖',cat:'Maths',bg:'#06b6d4,#22d3ee',make:mkSous,lv:['Jusqu\'à 10','Jusqu\'à 20','Grands nombres et nombre manquant']},
 {id:'nombres',name:'Les nombres',ic:'🔢',cat:'Maths',bg:'#eab308,#facc15',make:mkNombres,lv:['Jusqu\'à 10','Jusqu\'à 20','Jusqu\'à 60, dizaines et unités']},
 {id:'formes',name:'Formes et couleurs',ic:'🔷',cat:'Découverte',bg:'#ef4444,#f87171',make:mkFormes,lv:['Formes et couleurs de base','Toutes les formes et couleurs','Forme ET couleur ensemble']},
 {id:'monde',name:'Découvre le monde',ic:'🌍',cat:'Découverte',bg:'#14b8a6,#2dd4bf',make:mkMonde,lv:['Questions en images','Images, jours et saisons','Questions plus difficiles']},
 {id:'memo',name:'Mémo',ic:'🃏',cat:'Découverte',bg:'#a855f7,#d946ef',memo:true,lv:['4 paires','6 paires','8 paires']},
 {id:'en_learn',name:'Mes mots anglais',ic:'📒',cat:'Anglais',bg:'#0ea5e9,#38bdf8',learn:true},
 {id:'en_ecoute',name:'Écoute et trouve',ic:'👂',cat:'Anglais',bg:'#6366f1,#818cf8',make:mkEnEcoute,lv:['Animaux et couleurs','Plus de mots : nombres, nourriture...','Écouter des phrases']},
 {id:'en_mots',name:'Dis-le en anglais',ic:'🏷️',cat:'Anglais',bg:'#10b981,#34d399',make:mkEnMots,lv:['Image vers mot (animaux, couleurs)','Image vers mot (plus de mots)','Mot anglais vers français']},
 {id:'en_corps',name:'Le corps (dessin)',ic:'🧒',cat:'Anglais',bg:'#f59e0b,#fbbf24',make:mkEnCorps,lv:['8 parties du corps (3 choix)','Toutes les parties (4 choix)','Écouter et toucher le bon numéro']},
 {id:'en_repete',name:'Écoute et répète',ic:'🗣️',cat:'Anglais',bg:'#f43f5e,#fb7185',make:mkEnRepete,speak:true,lv:['Mots simples','Plus de mots','Phrases courtes']}
];
const LV_ICON=['🌱','🌟','🚀'];

/* ---------- accueil ---------- */
const starsHtml=n=>[1,2,3].map(k=>`<span class="${k<=n?'':'g'}">⭐</span>`).join('');
const sumStars=a=>[0,1,2].reduce((t,L)=>t+(S.st[a.id+':'+L]||0),0);
const totalStars=()=>Object.values(S.st).reduce((t,v)=>t+v,0);
const unlocked=()=>Math.min(STICKERS.length,Math.floor(S.pts/10));
let playTok=0;
function stopSong(){playTok++;try{speechSynthesis.cancel()}catch(e){}stopTune();abortRec();if(voxAudio){try{voxAudio.pause()}catch(e){}voxAudio=null}clearInterval(voxTm)}
let voxAudio=null,voxTm=null;
function home(){
  stopSong();
  show('home');
  $('#hi').textContent=hi[rnd(hi.length)];
  let h='';
  const CATI={Lecture:'📚',Maths:'🧮','Découverte':'🔍',Anglais:'🎩'};
  for(const cat of ['Lecture','Maths','Découverte','Anglais']){
    h+=`<h3 class="sec">${CATI[cat]} ${cat==='Anglais'?'Anglais (English)':cat}</h3><div class="tiles">`;
    for(const a of ACT.filter(x=>x.cat===cat)){
      const st=a.learn?'Découvrir':a.speak?'Sans note':a.songs?`${SONGS.filter((s,k)=>S.st['ct'+k+':0']).length}/${SONGS.length} chantées`:`⭐ ${sumStars(a)}/9`;
      h+=`<button class="tile" data-id="${a.id}" style="background:linear-gradient(160deg,${a.bg})"><span class="ic">${a.ic}</span><span class="nm">${a.name}</span><span class="st">${st}</span></button>`;
    }
    h+='</div>';
  }
  $('#menu').innerHTML=h;
  $('#tot').textContent='⭐ '+totalStars();
  $('#menu').querySelectorAll('.tile').forEach(b=>b.onclick=()=>{
    sfx.tap();const a=ACT.find(x=>x.id===b.dataset.id);
    a.songs?songsList():a.learn?learnScreen('animals'):levelScreen(a);
  });
  $('#tv').classList.toggle('off',!S.voice);
  $('#ts').classList.toggle('off',!S.sound);
}
$('#tv').onclick=()=>{S.voice=!S.voice;save();if(S.voice)say('Voix activée');else try{speechSynthesis.cancel()}catch(e){};home()};
$('#ts').onclick=()=>{S.sound=!S.sound;save();sfx.tap();home()};
$('#alb').onclick=()=>{sfx.tap();album()};

function levelScreen(a){
  const el=show('levels');
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="lb">🏠</button><div class="title" style="flex:1;margin:0">${a.ic} ${a.name}</div><span class="ib" style="visibility:hidden"></span></div>
  <div class="title" style="font-size:1.1rem;margin-top:14px">Choisis ton niveau</div>
  <div class="lvls">${[0,1,2].map(L=>`<button class="lv l${L}" data-l="${L}"><span class="li">${LV_ICON[L]}</span><span class="lt"><b>Niveau ${L+1}</b><small>${a.lv[L]}</small></span><span class="st">${starsHtml(S.st[a.id+':'+L]||0)}</span></button>`).join('')}</div></div>`;
  $('#lb').onclick=home;
  el.querySelectorAll('.lv').forEach(b=>b.onclick=()=>{sfx.tap();const L=+b.dataset.l;a.speak?start(a,L,{practice:true}):start(a,L)});
}

/* ---------- moteur de jeu ---------- */
let G=null;
const HIST={};
function start(a,L,opt={}){
  if(a.memo)return startMemo(a,L);
  G={a,L,key:a.id+':'+L,i:0,good:0,streak:0,res:[],used:new Set(),rounds:opt.rounds||ROUND,practice:!!opt.practice,q:null,locked:false,
     again:()=>start(a,L,opt),back:opt.back||(()=>levelScreen(a)),nextLevel:opt.rounds?null:(L<2?()=>start(a,L+1):null)};
  nextQ();
}
function gen(){
  const hist=HIST[G.key]||(HIST[G.key]=[]);
  let q,t=0;
  do{q=G.a.make(G.i,G.L);t++}
  while((G.used.has(q.key)||(t<40&&hist.includes(q.key)))&&t<80);
  G.used.add(q.key);hist.push(q.key);if(hist.length>14)hist.shift();
  return q;
}
function nextQ(){
  if(G.i>=G.rounds)return endRound();
  G.q=gen();G.q.mist=0;G.locked=false;render();
}
function bar(){
  const dots=Array.from({length:G.rounds},(_,k)=>`<i class="${k<G.i?(G.res[k]?'ok':'ko'):k===G.i?'cur':''}"></i>`).join('');
  return `<div class="bar"><button class="ib" id="back">🏠</button><div class="dots">${dots}</div><span class="badge" id="stk"></span><button class="ib" id="rep">🔊</button></div>`;
}
const updBadge=()=>{const b=$('#stk');if(b){b.textContent=G.streak>=2?'🔥 '+G.streak:'';b.style.visibility=G.streak>=2?'visible':'hidden'}};
const fb=h=>{const t=$('#ttl');if(t)t.innerHTML=h};
function render(){
  const q=G.q,el=show('game');
  let body;
  if(q.type==='build'){
    body=`<div class="slots">${q.parts.map(()=>'<div class="slot"></div>').join('')}</div><div class="tilesrow" style="margin-top:14px">${q.tiles.map((t,k)=>`<button class="ch c${k%4}" data-s="${t}">${t}</button>`).join('')}</div>`;
  }else if(q.type==='speak'){
    body=speakBody();
  }else{
    body=`<div class="grid" style="--cols:${q.cols||2}">${q.choices.map((c,k)=>`<button class="ch c${k%4}${c.t?' t':''}" data-k="${k}">${c.h}</button>`).join('')}</div>`;
  }
  el.innerHTML=`<div class="wrap">${bar()}<div class="title" id="ttl">${q.title}</div><div class="vis">${q.vis}</div>${body}</div>`;
  updBadge();
  $('#back').onclick=()=>{try{speechSynthesis.cancel()}catch(e){};G.back()};
  $('#rep').onclick=()=>speakL(q.say,q.lang);
  const g0=G,adv=ms=>setTimeout(()=>{if(G!==g0)return;G.i++;nextQ()},ms);
  const needNext=()=>setTimeout(()=>{
    if(G!==g0||!document.body.contains(el))return;
    const w=el.querySelector('.wrap'),b=document.createElement('button');
    b.className='btn a nxt';b.id='nxt';b.textContent='Suivant ➡️';
    b.onclick=()=>{if(G!==g0||b.disabled)return;b.disabled=true;sfx.tap();G.i++;nextQ()};
    w.appendChild(b);
  },1500);
  if(!q.say)$('#rep').style.visibility='hidden';
  if(q.type==='build'){
    let idx=0;const slots=[...el.querySelectorAll('.slot')],tiles=[...el.querySelectorAll('.tilesrow .ch')];
    tiles.forEach(b=>b.onclick=()=>{
      if(G.locked||b.classList.contains('used'))return;
      if(b.dataset.s===q.parts[idx]){
        slots[idx].textContent=b.dataset.s;slots[idx].classList.add('f');b.classList.add('used');idx++;sfx.tap();
        if(idx===q.parts.length){
          G.locked=true;say(q.word);
          if(!q.failed){sfx.ok();G.good++;G.streak++;G.res.push(1);fb('✅ '+praise[rnd(praise.length)]);const r=b.getBoundingClientRect();confetti(8+Math.min(G.streak,6)*4,r.left,r.top)}
          else{sfx.sad();G.streak=0;G.res.push(0);fb('Réussi, mais avec des erreurs : pas de point')}
          updBadge();adv(1500);
        }
      }else{
        sfx.sad();q.failed=true;q.mist++;G.streak=0;updBadge();b.classList.add('bad');setTimeout(()=>b.classList.remove('bad'),450);
        if(q.mist>=3){
          G.locked=true;G.res.push(0);fb('❌ Regarde bien le mot !');$('#ttl').classList.add('wrongt');
          for(;idx<q.parts.length;idx++){slots[idx].textContent=q.parts[idx];slots[idx].classList.add('f','reveal')}
          tiles.forEach(t=>t.classList.add('dim'));
          say('Oups ! Le mot était '+q.word);needNext();
        }else fb('Essaie encore ! ('+(3-q.mist)+' essai'+(3-q.mist>1?'s':'')+')');
      }
    });
  }else if(q.type==='speak'){
    speakUI(q,adv);
  }else{
    const btns=[...el.querySelectorAll('.grid .ch')];
    btns.forEach(b=>b.onclick=()=>{
      if(G.locked)return;G.locked=true;
      const c=q.choices[b.dataset.k];
      if(c.ok){
        sfx.ok();b.classList.add('good');G.good++;G.streak++;G.res.push(1);
        fb('✅ '+praise[rnd(praise.length)]);
        const r=b.getBoundingClientRect();confetti(8+Math.min(G.streak,6)*4,r.left+r.width/2,r.top);
        {const t=q.sayOk||c.say;t?speakL(t,c.lang||q.lang):say(praise[rnd(praise.length)])}updBadge();adv(1400);
      }else{
        sfx.sad();b.classList.add('bad');G.streak=0;G.res.push(0);
        const ci=q.choices.findIndex(x=>x.ok);btns[ci].classList.add('good');
        btns.forEach(x=>{x.disabled=true;if(x!==btns[ci]&&x!==b)x.classList.add('dim')});
        btns[ci].classList.remove('good');btns[ci].classList.add('reveal');btns[ci].dataset.tag='✔ La bonne réponse';
        fb('❌ Regarde la bonne réponse !');$('#ttl').classList.add('wrongt');
        setTimeout(()=>{try{btns[ci].scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}},50);
        const ans=q.choices[ci];
        if(ans.say&&(ans.lang||q.lang)==='en')sayEn(ans.say);
        else say(ans.say?`Oups ! La bonne réponse est ${ans.say}`:'Oups ! Regarde la bonne réponse');
        updBadge();needNext();
      }
    });
  }
  setTimeout(()=>{if(G&&G.q===q)speakL(q.say,q.lang)},300);
}
const starsFor=(g,t)=>{const r=g/t;return r>=.85?3:r>=.6?2:r>=.35?1:0};
function endRound(){
  if(G.practice)return finishPractice();
  const pts=G.good+(G.good===G.rounds?2:0),s=G.good>1?'s':'';
  finish({a:G.a,L:G.L,st:starsFor(G.good,G.rounds),pts,msg:`${G.good} bonne${s} réponse${s} sur ${G.rounds}`,again:G.again,nextLevel:G.nextLevel,back:G.back});
}

/* ---------- memo ---------- */
function startMemo(a,L){
  const np=[4,6,8][L],pairs=pick(W,np),cards=shuffle(pairs.flatMap((w,k)=>[{k,w},{k,w}]));
  let first=null,lock=false,moves=0,found=0;
  const el=show('game');
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="back">🏠</button><div class="dots" style="font-weight:900;color:#fff;font-size:1.3rem" id="mv">Coups : 0</div><span class="ib" style="visibility:hidden"></span></div><div class="title">Trouve les paires identiques</div><div class="mem">${cards.map((c,k)=>`<button class="card" data-k="${k}"><span class="bk">❓</span><span class="fr">${c.w[0]}</span></button>`).join('')}</div></div>`;
  $('#back').onclick=()=>levelScreen(a);
  say('Trouve les paires identiques.');
  el.querySelectorAll('.card').forEach(b=>b.onclick=()=>{
    const k=+b.dataset.k;
    if(lock||b.classList.contains('up'))return;
    b.classList.add('up');sfx.tap();
    if(first===null){first=k;return}
    moves++;$('#mv').textContent='Coups : '+moves;
    const A=cards[first],B=cards[k],ba=el.querySelector(`[data-k="${first}"]`);
    if(A.k===B.k){
      sfx.ok();ba.classList.add('ok');b.classList.add('ok');say(A.w[1]);found++;first=null;
      if(found===np){
        const st=moves<=np*1.5?3:moves<=np*2.2?2:1;
        setTimeout(()=>finish({a,L,st,pts:st*2,msg:`Gagné en ${moves} coups !`,again:()=>startMemo(a,L),nextLevel:L<2&&st>=2?()=>startMemo(a,L+1):null,back:()=>levelScreen(a)}),1200);
      }
    }else{
      lock=true;sfx.sad();
      setTimeout(()=>{ba.classList.remove('up');b.classList.remove('up');first=null;lock=false},900);
    }
  });
}

/* ---------- fin de partie ---------- */
function finish(o){
  const key=o.key||(o.a.id+':'+o.L);
  S.st[key]=Math.max(S.st[key]||0,o.st);
  const before=unlocked();S.pts+=o.pts;const after=unlocked();save();
  const news=STICKERS.slice(before,after);
  const title=['Courage, on réessaie !','Bien essayé !','Très bien !','Extraordinaire !'][o.st];
  const el=show('end');
  el.innerHTML=`<div class="m">🦊</div><h1>${title}</h1><div class="stars">${[1,2,3].map(k=>`<span class="${k<=o.st?'':'g'}" style="animation-delay:${k*.25}s">⭐</span>`).join('')}</div><p>${o.msg}</p><p class="pt">+${o.pts} point${o.pts>1?'s':''} (total : ${S.pts})</p>${news.length?`<div class="newstk">Nouvel autocollant ! <span>${news.join(' ')}</span></div>`:''}<div class="btns"><button class="btn a" id="again">🔁 Rejouer</button>${o.nextLevel&&o.st>=2?'<button class="btn c" id="nxt">🚀 Niveau suivant</button>':''}<button class="btn b" id="menuB">⬅️ Retour</button></div>`;
  $('#again').onclick=()=>{sfx.tap();o.again()};
  if($('#nxt'))$('#nxt').onclick=()=>{sfx.tap();o.nextLevel()};
  $('#menuB').onclick=()=>{sfx.tap();(o.back||home)()};
  if(o.st>0){sfx.win();confetti(40+o.st*20)}else sfx.sad();
  setTimeout(()=>say(title),500);
}

/* ---------- album d'autocollants ---------- */
function album(){
  const n=unlocked(),el=show('album');
  const need=10-(S.pts%10);
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="ab">🏠</button><div class="title" style="flex:1;margin:0">🏅 Mes autocollants</div><span class="ib" style="visibility:hidden"></span></div>
  <div class="title" style="font-size:1.05rem">${n}/${STICKERS.length} · ${n<STICKERS.length?`encore ${need} point${need>1?'s':''} pour le prochain`:'Bravo, album complet !'}</div>
  <div class="album">${STICKERS.map((s,k)=>`<div class="stk${k<n?'':' lock'}">${k<n?s:'🔒'}</div>`).join('')}</div></div>`;
  $('#ab').onclick=home;
}

/* ---------- comptines ---------- */
function songsList(){
  stopSong();
  const el=show('songs');
  const tile=(s,k)=>`<button class="tile" data-k="${k}" style="background:linear-gradient(160deg,${s.en?'#0ea5e9,#6366f1':'#f43f5e,#fb923c'})"><span class="ic">${s.e}</span><span class="nm">${s.t}</span><span class="st">${s.tune?'🎼 ':''}${starsHtml(S.st['ct'+k+':0']||0)}</span></button>`;
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="sb">🏠</button><div class="title" style="flex:1;margin:0">🎵 Comptines</div><span class="ib" style="visibility:hidden"></span></div>
  <h3 class="sec">🇫🇷 En français</h3><div class="sg">${SONGS.map((s,k)=>s.en?'':tile(s,k)).join('')}</div>
  <h3 class="sec">🇬🇧 In English</h3><div class="sg">${SONGS.map((s,k)=>s.en?tile(s,k):'').join('')}</div>
  <div class="foot" style="margin:8px 0 0">🎼 = la mélodie est jouée par l'appli. Les parents peuvent aussi enregistrer leur voix.</div></div>`;
  $('#sb').onclick=home;
  el.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{sfx.tap();songView(+b.dataset.k)});
}
function songView(k){
  stopSong();
  const s=SONGS[k],el=show('song'),en=!!s.en,key=s.t;
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="sb">⬅️</button><div class="title" style="flex:1;margin:0">${s.e} ${s.t}</div><span class="ib" style="visibility:hidden"></span></div>
  <div class="lyr" id="lyr">${s.lines.map(l=>`<div class="ln">${l}</div>`).join('')}</div>
  <div class="hint" id="hint"></div>
  <div class="btns" id="b1">${s.tune?'<button class="btn a" id="mel">🎼 Mélodie</button>':''}<button class="btn b" id="play">🗣️ ${en?'Lire (voix)':'Lire à voix haute'}</button></div>
  <div class="btns" id="b2"></div>
  <div class="btns"><button class="btn c" id="quiz">🎯 ${en?'Missing words':'Mots manquants'}</button></div></div>`;
  const lines=[...el.querySelectorAll('.ln')],hint=$('#hint');
  let mode=null,saved=null,t0=0,marks=[],cur=-1;
  const hl=i=>{cur=i;lines.forEach((l,j)=>l.classList.toggle('on',j===i));if(i>=0&&lines[i])lines[i].scrollIntoView({block:'center',behavior:'smooth'})};
  const labels=()=>{const m=$('#mel');if(m)m.textContent=mode==='mel'?'⏹ Stop':'🎼 Mélodie';$('#play').textContent=mode==='say'?'⏹ Stop':('🗣️ '+(en?'Lire (voix)':'Lire à voix haute'))};
  const halt=()=>{mode=null;stopSong();hl(-1);labels();hint.textContent=''};
  const done=()=>{if(mode==='mel'||mode==='say'||mode==='vox'){mode=null;labels();hl(-1);parent()}};
  const parent=()=>{
    const b2=$('#b2');
    if(mode==='rec'){
      b2.innerHTML=`<button class="btn red" id="rs">⏹ Terminer</button><button class="btn b" id="rn">➡️ Ligne suivante</button>`;
      $('#rs').onclick=()=>{endRec()};
      $('#rn').onclick=()=>{sfx.tap();if(cur<lines.length-1){marks[cur+1]=(performance.now()-t0)/1000;hl(cur+1)}};
      return;
    }
    if(!saved){
      b2.innerHTML=`<button class="btn red" id="rc">🎙️ Enregistrer ma voix</button>`;
    }else{
      b2.innerHTML=`<button class="btn a" id="pv">${mode==='vox'?'⏹ Stop':'▶ Écouter ma voix'}</button><button class="btn gray" id="rc">🔁 Refaire</button><button class="btn gray" id="rd" title="Supprimer">🗑️</button>`;
      $('#pv').onclick=playVox;
      $('#rd').onclick=async()=>{halt();await recDel(key);saved=null;hint.textContent='Enregistrement supprimé.';parent()};
    }
    $('#rc').onclick=beginRec;
  };
  const refresh=async()=>{saved=await recGet(key);if(!mode)parent()};
  function playVox(){
    if(mode==='vox'){halt();parent();return}
    halt();mode='vox';
    const blob=new Blob([saved.buf],{type:saved.type});
    const au=new Audio(URL.createObjectURL(blob));voxAudio=au;
    const dur=saved.dur||1,mk=saved.marks&&saved.marks.length>1?saved.marks:null;
    const startOf=i=>{
      if(mk&&mk[i]!=null)return mk[i];
      const tot=s.lines.reduce((t,l)=>t+l.length,0);let c=0;for(let j=0;j<i;j++)c+=s.lines[j].length;return dur*c/tot;
    };
    const upd=()=>{
      const t=au.currentTime;let idx=0;
      for(let i=0;i<lines.length;i++)if(t>=startOf(i)-.05)idx=i;
      if(idx!==cur)hl(idx);
    };
    au.onended=()=>{clearInterval(voxTm);done()};
    au.onerror=()=>{clearInterval(voxTm);halt();hint.textContent='Impossible de lire cet enregistrement.';parent()};
    voxTm=setInterval(upd,120);
    au.play().then(()=>{hl(0);labels();parent()}).catch(()=>{halt();hint.textContent='Lecture bloquée : touche à nouveau.';parent()});
  }
  async function beginRec(){
    halt();
    if(!navigator.mediaDevices||!window.MediaRecorder){hint.textContent='Cet appareil ne sait pas enregistrer la voix.';return}
    try{
      mode='rec';marks=[0];
      await startRec(async blob=>{
        const dur=(performance.now()-t0)/1000;
        const wasRec=mode==='rec';mode=null;hl(-1);
        if(!wasRec)return;
        if(!blob.size||dur<.8){hint.textContent='Enregistrement trop court, recommence.';await refresh();return}
        const buf=await blob.arrayBuffer();
        try{await recPut(key,{buf,type:blob.type,dur,marks:marks.slice()});hint.textContent='Enregistré sur cet appareil. Rien n\'est envoyé.'}
        catch(e){hint.textContent='Impossible d\'enregistrer (stockage plein ou bloqué).'}
        await refresh();
      });
      t0=performance.now();hl(0);parent();
      hint.textContent='Chante en suivant les paroles. Touche ➡️ au début de chaque ligne.';
    }catch(e){
      mode=null;abortRec();hl(-1);
      hint.textContent=(e&&e.name==='NotAllowedError')?'Micro bloqué : autorise-le dans les réglages du navigateur.':'Micro indisponible sur cet appareil.';
      parent();
    }
  }
  $('#sb').onclick=()=>{halt();songsList()};
  const mel=$('#mel');
  if(mel)mel.onclick=()=>{
    if(mode==='mel'){halt();parent();return}
    halt();mode='mel';labels();parent();
    playTune(s.tune,i=>{if(mode==='mel')hl(i)},done);
  };
  $('#play').onclick=()=>{
    if(mode==='say'){halt();parent();return}
    halt();mode='say';labels();parent();
    const tok=++playTok;let i=0;
    const step=()=>{
      if(tok!==playTok||mode!=='say')return;
      if(i>=lines.length){done();return}
      hl(i);
      speakNow(s.lines[i],()=>{if(tok!==playTok)return;i++;setTimeout(step,250)},en?'en':'fr');
    };
    step();
  };
  $('#quiz').onclick=()=>{
    halt();sfx.tap();
    const act={id:'ct'+k,name:s.t,ic:s.e,make:()=>mkCloze(s)};
    start(act,0,{rounds:Math.min(5,clozeSpots(s).length),back:()=>songView(k)});
  };
  refresh();
}

/* ---------- installation PWA ---------- */
let dip=null;
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
const web=location.protocol.startsWith('http');
if(!standalone&&web)$('#inst').hidden=false;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();dip=e;if(!standalone)$('#inst').hidden=false});
addEventListener('appinstalled',()=>{$('#inst').hidden=true});
$('#inst').onclick=async()=>{
  if(dip){dip.prompt();try{await dip.userChoice}catch(e){}dip=null}
  else $('#help').classList.add('on');
};
if('serviceWorker' in navigator&&web)navigator.serviceWorker.register('sw.js').catch(()=>{});
home();
