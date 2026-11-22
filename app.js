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
/* icones des parties du corps sans emoji : silhouette grise, zone en couleur */
const zi=z=>`<svg class='zi' viewBox='0 0 64 64' aria-hidden='true'><g fill='#94a3b8'><circle cx='32' cy='11' r='7'/><rect x='29' y='16' width='6' height='5'/><rect x='19' y='20' width='26' height='22' rx='6'/><path d='M21 23L11 39M43 23L53 39M27 42L26 60M37 42L38 60' stroke='#94a3b8' stroke-width='6' stroke-linecap='round' fill='none'/></g>${z}</svg>`;
const ZI={
 head:zi("<circle cx='32' cy='11' r='8' fill='#f97316' stroke='#fff' stroke-width='2'/>"),
 hair:zi("<path d='M24 11A8 8 0 0 1 40 11Z' fill='#f97316' stroke='#fff' stroke-width='2'/>"),
 neck:zi("<rect x='28' y='15' width='8' height='7' rx='2' fill='#f97316' stroke='#fff' stroke-width='2'/>"),
 shoulder:zi("<circle cx='22' cy='24' r='6' fill='#f97316' stroke='#fff' stroke-width='2'/><circle cx='42' cy='24' r='6' fill='#f97316' stroke='#fff' stroke-width='2'/>"),
 tummy:zi("<ellipse cx='32' cy='33' rx='10' ry='7.5' fill='#f97316' stroke='#fff' stroke-width='2'/>"),
 knee:zi("<circle cx='26.5' cy='51' r='5' fill='#f97316' stroke='#fff' stroke-width='2'/><circle cx='37.5' cy='51' r='5' fill='#f97316' stroke='#fff' stroke-width='2'/>")
};
/* [anglais, francais, emoji ou icone, theme] */
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
 ['hand','main','✋','body'],['head','tête',ZI.head,'body'],['hair','cheveux',ZI.hair,'body'],['neck','cou',ZI.neck,'body'],['shoulder','épaule',ZI.shoulder,'body'],['tummy','ventre',ZI.tummy,'body'],['knee','genou',ZI.knee,'body'],['eye','œil','👁️','body'],['ear','oreille','👂','body'],['nose','nez','👃','body'],['mouth','bouche','👄','body'],['foot','pied','🦶','body'],
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
const VP=VOC;
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

function learnScreen(th){
  stopSong();
  const el=show('learn'),items=VOC.filter(v=>v[3]===th);
  el.innerHTML=`<div class="wrap"><div class="bar"><button class="ib" id="lb">🏠</button><div class="title" style="flex:1;margin:0">📒 Mes mots anglais</div><span class="ib" style="visibility:hidden"></span></div>
  <div class="tabs">${THEMES.map(t=>`<button class="tab${t[0]===th?' on':''}" data-t="${t[0]}">${t[2]}<small>${t[1]}</small></button>`).join('')}</div>
  <div class="vgrid">${items.map((v,k)=>`<button class="vc" data-k="${k}"><span class="e">${v[2]}</span><b>${v[0]}</b><small>${v[1]}</small></button>`).join('')}</div>
  <div class="foot" style="margin:6px 0 0">Touche une carte pour entendre le mot</div></div>`;
  $('#lb').onclick=home;
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
 {id:'en_repete',name:'Écoute et répète',ic:'🗣️',cat:'Anglais',bg:'#f43f5e,#fb7185',make:mkEnRepete,speak:true,lv:['Mots simples','Plus de mots','Phrases courtes']}
];
const LV_ICON=['🌱','🌟','🚀'];

/* ---------- accueil ---------- */
const starsHtml=n=>[1,2,3].map(k=>`<span class="${k<=n?'':'g'}">⭐</span>`).join('');
const sumStars=a=>[0,1,2].reduce((t,L)=>t+(S.st[a.id+':'+L]||0),0);
const totalStars=()=>Object.values(S.st).reduce((t,v)=>t+v,0);
const unlocked=()=>Math.min(STICKERS.length,Math.floor(S.pts/10));
let playTok=0;
function stopSong(){playTok++;try{speechSynthesis.cancel()}catch(e){}}
function home(){
  stopSong();
  show('home');
  $('#hi').textContent=hi[rnd(hi.length)];
  let h='';
  const CATI={Lecture:'📚',Maths:'🧮','Découverte':'🔍',Anglais:'🎩'};
  for(const cat of ['Lecture','Maths','Découverte','Anglais']){
    h+=`<h3 class="sec">${CATI[cat]} ${cat==='Anglais'?'Anglais (English)':cat}</h3><div class="tiles">`;
    for(const a of ACT.filter(x=>x.cat===cat)){
      const st=a.learn?'Découvrir':a.speak?'Sans note':`⭐ ${sumStars(a)}/9`;
      h+=`<button class="tile" data-id="${a.id}" style="background:linear-gradient(160deg,${a.bg})"><span class="ic">${a.ic}</span><span class="nm">${a.name}</span><span class="st">${st}</span></button>`;
    }
    h+='</div>';
  }
  $('#menu').innerHTML=h;
  $('#tot').textContent='⭐ '+totalStars();
  $('#menu').querySelectorAll('.tile').forEach(b=>b.onclick=()=>{
    sfx.tap();const a=ACT.find(x=>x.id===b.dataset.id);
    a.learn?learnScreen('animals'):levelScreen(a);
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
