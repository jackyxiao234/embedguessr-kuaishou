// EmbedGuessr × Kuaishou — SPA v8 (i18n, fullscreen layout, scoring v2)
(function () {
"use strict";
const el = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const QUESTION_TIME = 15;

/* ── i18n ── */
const LANG = {
  en: {
    title: "EmbedGuessr", sub: "A neural net filed every image into a map of its own mind.<br>Drop the pin. How well do you know the model?",
    enterName: "Enter your name", start: "Start →", loading: "Loading…",
    topScores: "Top scores", seeAll: "See all →", noScores: "No scores yet — be first!",
    progress: "Progress", specimen: "Specimen", clusters: "Clusters",
    lockIn: "Lock in guess", next: "Next →", results: "See results →", quit: "Quit",
    projection: "umap · cosine · 2d projection",
    result: "Result", saveBoard: "Save to leaderboard", saving: "Saving…", saved: "Saved ✓",
    playAgain: "Play again", viewBoard: "View board",
    finalScore: "Final score", runComplete: "run complete",
    best: "Best", worst: "Worst", avgDist: "Avg dist",
    plateBplate: "Plate-by-plate", specimen2: "Specimen", diff2: "Diff", distance: "Distance", points: "Points",
    theBoard: "The Board", home: "Home",
    rankingTitle: "Your Ranking", percentile: "th percentile at question", cumulative: "Cumulative:",
    top5at: "Top 5 at this question",
    offManifold: "off-manifold", ambiguous: "ambiguous / mixed",
    verdicts: { bull: "Bullseye 🎯", dead: "Dead-on", lobe: "Right lobe", hood: "Wrong neighbourhood", far: "Way off" },
    switchLang: "中文",
  },
  zh: {
    title: "EmbedGuessr", sub: "神经网络把每张图片归档到了它自己脑中的地图上。<br>把图钉插下去——你有多了解这个模型？",
    enterName: "输入你的名字", start: "开始 →", loading: "加载中…",
    topScores: "最高分", seeAll: "查看全部 →", noScores: "暂无记录，快来第一个！",
    progress: "进度", specimen: "标本", clusters: "簇群",
    lockIn: "确认猜测", next: "下一题 →", results: "查看结果 →", quit: "退出",
    projection: "umap · 余弦 · 2D 投影",
    result: "结果", saveBoard: "保存到排行榜", saving: "保存中…", saved: "已保存 ✓",
    playAgain: "再玩一次", viewBoard: "查看排行榜",
    finalScore: "最终得分", runComplete: "本局结束",
    best: "最高", worst: "最低", avgDist: "平均距离",
    plateBplate: "逐题详情", specimen2: "标本", diff2: "难度", distance: "距离", points: "得分",
    theBoard: "排行榜", home: "首页",
    rankingTitle: "你的排名", percentile: " 百分位，第", cumulative: "累计分数：",
    top5at: "本题前5名",
    offManifold: "脱嵌入流形", ambiguous: "模糊 / 混合",
    verdicts: { bull: "正中靶心 🎯", dead: "精准命中", lobe: "区域正确", hood: "区域错误", far: "差太远了" },
    switchLang: "English",
  }
};
let lang = localStorage.getItem("eg:lang") || "en";
const t = (k) => LANG[lang][k] || LANG.en[k] || k;
const tv = (k) => LANG[lang].verdicts[k] || LANG.en.verdicts[k] || k;
function toggleLang() { lang = lang === "en" ? "zh" : "en"; localStorage.setItem("eg:lang", lang); router(); }

/* ── Chinese cluster name translations ── */
const ZH_CLUSTERS = {
  "1950s diner":"50年代餐厅","Cairo souq":"开罗集市","Dutch oven":"铸铁锅","Eiffel Tower":"埃菲尔铁塔",
  "Hawaiian shirts":"夏威夷衬衫","Japanese garden":"日式庭园","Japanese izakaya":"日式居酒屋",
  "Japanese pagoda":"日式宝塔","Manhattan skyline":"曼哈顿天际线","Moai statue":"莫艾石像",
  "Persian carpet":"波斯地毯","Sagrada Familia":"圣家堂","Saturn":"土星","Venice canal":"威尼斯运河",
  "acoustic guitar":"原声吉他","aerial city grid":"城市鸟瞰","alien character":"外星角色",
  "amethyst crystal":"紫水晶","ancient ruins":"古代遗址","ancient temples":"古庙",
  "apple":"苹果","arctic glacier":"北极冰川","arctic tundra":"北极冻原","asteroid field":"小行星带",
  "aurora borealis":"极光","autumn forest":"秋日森林","autumn forest floor":"秋日林地",
  "banana":"香蕉","bare concrete wall":"裸混凝土墙","baseball diamond":"棒球场",
  "biplane":"双翼飞机","black hole":"黑洞","blizzard":"暴风雪","bread loaf":"面包",
  "brick wall":"砖墙","brutalist tower":"野兽派塔楼","bullet train":"高铁",
  "burlap sack":"麻布袋","camouflage jacket":"迷彩夹克","cargo ship":"货船",
  "cast iron wok":"铸铁炒锅","ceramic bowl":"陶瓷碗","chain-mail armour":"锁甲",
  "chef knife":"主厨刀","cherry blossom park":"樱花公园","chocolate bar":"巧克力",
  "circuit board":"电路板","city grid aerial":"城市网格鸟瞰","city park":"城市公园",
  "city street":"城市街道","clay pot":"砂锅","clay workshop":"陶艺工作室",
  "clear blue sky":"晴空","cobblestone street":"鹅卵石街道","colanders":"漏勺",
  "commercial airplane":"商用飞机","concrete surface":"混凝土表面","container ship":"集装箱船",
  "coral reef":"珊瑚礁","coral reef overhead":"珊瑚礁俯视","corset":"束身衣",
  "cracked dry mud":"干裂泥土","creme brulee":"法式焦糖布丁","crossword puzzle":"填字游戏",
  "cruise ship":"游轮","cumulus cloudscape":"积云","cutting board":"砧板",
  "deep ocean floor":"深海海底","deep sea coral":"深海珊瑚","deep space nebula":"深空星云",
  "denim jackets":"牛仔夹克","denim overalls":"牛仔工装裤","desert canyon":"沙漠峡谷",
  "desert town":"沙漠小镇","designer handbag":"名牌手袋","dim sum basket":"点心蒸笼",
  "dome stadium":"穹顶体育场","double-decker bus":"双层巴士","dried coconut":"干椰子",
  "electric bass":"电贝斯","evening gowns":"晚礼服","fencing arena":"击剑场",
  "fighter jet":"战斗机","fireworks burst":"烟花","foam latte art":"拿铁拉花",
  "foggy morning":"晨雾","forklift":"叉车","formal suit":"正式西装",
  "freight train":"货运火车","frying pan":"平底锅","frying pans":"平底锅组",
  "glass office tower":"玻璃办公楼","glass skyscraper":"玻璃摩天楼","gold jewellery":"黄金首饰",
  "golf course":"高尔夫球场","gondola Venice":"威尼斯贡多拉","gothic cathedral":"哥特式大教堂",
  "gothic spire":"哥特式尖塔","grand piano":"三角钢琴","granite boulder":"花岗岩巨石",
  "grapes":"葡萄","hiking gear":"登山装备","hospital ward":"病房",
  "human face":"人脸","ice hockey rink":"冰球场","igloo":"冰屋",
  "ivory sculpture":"象牙雕塑","jungle":"丛林","kelp forest":"海藻林",
  "knitted sweater":"针织毛衣","leather bag":"皮包","leather biker jacket":"皮革骑行夹克",
  "lighthouse":"灯塔","lighthouses":"灯塔群","lunar eclipse":"月食",
  "luxury hotel pool":"豪华酒店泳池","macaron tower":"马卡龙塔","macrame wall art":"编织挂毯",
  "marble bust":"大理石胸像","marble countertop":"大理石台面","marshmallows":"棉花糖",
  "medical cross":"医疗十字","medieval castle":"中世纪城堡","military insignia":"军事徽章",
  "military tank":"坦克","military uniform":"军装","mixing bowls":"搅拌碗",
  "modern art museum":"现代艺术博物馆","modern harbour":"现代港口","modern skyscrapers":"现代摩天楼",
  "moon surface":"月球表面","morning mist":"晨雾","mosques":"清真寺",
  "mossy boulder":"苔藓巨石","mossy forest floor":"苔藓林地","mountain village":"山村",
  "nebula in space":"星云","neon sportswear":"霓虹运动装","nuclear cooling tower":"核电冷却塔",
  "oak tree bark":"橡树皮","oil slick on water":"水面油污","ottomans":"脚凳",
  "paddy field":"稻田","paint palette":"调色盘","patchwork quilt":"拼布被",
  "pink tutu":"粉色芭蕾裙","polished marble":"抛光大理石","quartz crystal":"石英晶体",
  "racing motorcycle":"赛车摩托","radiation symbol":"辐射符号","rainforest":"雨林",
  "rainy day":"雨天","redwood forest":"红杉林","referee jersey":"裁判球衣",
  "rocket launch":"火箭发射","rocket launchpad":"发射台","rocket ship":"火箭",
  "rocky beach":"礁石海滩","rugs":"地毯","safari khakis":"猎装卡其",
  "sand dunes":"沙丘","sandstone rock face":"砂岩崖面","sandy desert":"沙漠",
  "savanna at dawn":"黎明草原","school uniform":"校服","sea anemone":"海葵",
  "sea urchin":"海胆","sequin jacket":"亮片夹克","server room":"服务器机房",
  "sewing fabric":"缝纫面料","silicon wafer fab":"芯片制造厂","silk evening dress":"丝绸晚礼服",
  "silk scarf":"丝巾","ski resort":"滑雪场","snowy tundra":"雪原冻土",
  "sofas":"沙发","solar panel array":"太阳能板阵列","space shuttle":"航天飞机",
  "spaceship cockpit":"飞船驾驶舱","sports car":"跑车","sportswear":"运动装",
  "stained glass window":"彩色玻璃窗","steam locomotive":"蒸汽机车","steam train":"蒸汽火车",
  "stiletto heel":"细高跟鞋","streetwear":"街头服饰","streetwear hoodie":"街头卫衣",
  "submarine":"潜水艇","sugar cubes":"方糖","sunny day":"晴天",
  "sushi platter":"寿司拼盘","tailored blazer":"定制西装外套","tailored suit":"定制西装",
  "tartan wool coat":"格纹羊毛大衣","terracotta pot":"陶土花盆","terrazzo floor":"水磨石地板",
  "thatched cottage":"茅草屋","thunderstorm":"雷暴","tidal mudflats":"潮汐泥滩",
  "tiled floor":"瓷砖地板","tracksuit":"运动套装","traffic roundabout":"环形交叉口",
  "trombone":"长号","tropical jungle":"热带丛林","tuxedo":"燕尾服",
  "velvet evening gown":"丝绒晚礼服","volcanic crater":"火山口","volcanic rock field":"火山岩地",
  "watermelon":"西瓜","wedding dress":"婚纱","wet concrete":"湿混凝土",
  "whisks":"打蛋器","white lab coat":"白色实验服","white linen shirt":"白色麻布衬衫",
  "wind turbine":"风力涡轮","winter coats":"冬季大衣","winter scarf":"冬季围巾",
  "wire mesh fence":"铁丝网围栏","wok":"炒锅","wooden chairs":"木椅",
  "wooden floor":"木地板","wooden spoon":"木勺","woven basket":"编织篮",
  "woven rattan furniture":"藤编家具","ambiguous / mixed":"模糊 / 混合",
  "hiking gear":"登山装备","formal suit":"正式西装","sportswear":"运动装","streetwear":"街头服饰"
};
function clusterName(name) { return lang === "zh" ? (ZH_CLUSTERS[name] || name) : name; }
function roundScore(d) {
  if (d <= 0)    return 1000;
  if (d <= 3)    return Math.round(1000 - (d/3)*100);
  if (d <= 6)    return Math.round(900 - ((d-3)/3)*100);
  if (d <= 12.5) return Math.round(800 - ((d-6)/6.5)*100);
  if (d <= 25)   return Math.round(700 - ((d-12.5)/12.5)*200);
  if (d <= 50)   return Math.round(500*(1-(d-25)/25));
  return 0;
}
function verdict(d) {
  return d < 2 ? tv("bull") : d < 5 ? tv("dead") : d < 10 ? tv("lobe") : d < 22 ? tv("hood") : tv("far");
}

/* ── API ── */
async function api(path, opts) {
  const r = await fetch(path, Object.assign({ headers: { "Content-Type": "application/json" } }, opts));
  if (!r.ok) throw new Error(r.status); return r.json();
}
function shuffle(arr) { return arr.slice().sort(() => Math.random() - 0.5); }
async function getQuestions() { try { const qs = await api("/api/questions?count=5"); if (Array.isArray(qs) && qs.length) return qs; } catch {} return []; }
async function getBoard() { try { return await api("/api/leaderboard?limit=50"); } catch { return []; } }
async function postScore(entry) { try { return await api("/api/score", { method: "POST", body: JSON.stringify(entry) }); } catch { return { ok: true, offline: true }; } }
async function startRun(name) { try { return await api("/api/run/start", { method: "POST", body: JSON.stringify({ name, totalQuestions: 5 }) }); } catch { return { runId: "local_" + Date.now() }; } }
async function postQuestionScore(runId, qi, qid, score, dist) { try { return await api("/api/run/question", { method: "POST", body: JSON.stringify({ runId, questionIndex: qi, questionId: qid, score, distance: dist }) }); } catch { return { rank: 1, total: 1, percentile: 100 }; } }

/* ── state ── */
let PLATES = null, RUN = null, PLAYER_NAME = "", RUN_ID = "";
let timerInterval = null, timerStart = 0;

function newRun(name) { PLAYER_NAME = name; RUN_ID = ""; RUN = { idx:0, guess:null, locked:false, scores:[], hover:null, pinScale:1, lineProgress:0, mode:"main" }; }
const plate = () => PLATES[RUN.idx];
const N = () => PLATES.length;
function dist(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i]-b[i])**2; return Math.sqrt(s); }
function nearestCluster(p) { let best = p.clusters[0], bd = 1e9; p.clusters.forEach(cl => { const d = dist(cl.c, p.t); if (d < bd) { bd = d; best = cl; } }); return best; }

/* ── cloud ── */
function mulberry32(a) { return function() { a|=0; a=a+0x6d2b79f5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return((t^t>>>14)>>>0)/4294967296; }; }
function gauss(r) { let u=0,v=0; while(!u)u=r(); while(!v)v=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
const CLOUD = {};
function cloudFor(p, key) {
  if (CLOUD[key]) return CLOUD[key];
  const r = mulberry32(1234 + key.length*7 + p.clusters.length), out = [];
  p.clusters.forEach(cl => { for (let i=0;i<26;i++) out.push({p:[clamp(cl.c[0]+gauss(r)*8,2,98),clamp(cl.c[1]+gauss(r)*8,2,98)],color:cl.color}); });
  for (let i=0;i<16;i++) { const a=p.clusters[(r()*p.clusters.length)|0],b=p.clusters[(r()*p.clusters.length)|0],tt=0.3+r()*0.4; out.push({p:[clamp(a.c[0]*(1-tt)+b.c[0]*tt+gauss(r)*3,2,98),clamp(a.c[1]*(1-tt)+b.c[1]*tt+gauss(r)*3,2,98)],color:"#7a4a30"}); }
  return (CLOUD[key]=out);
}

/* ── canvas ── */
let cv, ctx, W=600, H=600, DPR=1, lastKey="";
const PAD=42;
function drawPinLabel(pt,txt,color,dir){ctx.font="700 11px 'IBM Plex Mono',monospace";ctx.textAlign="center";const w=ctx.measureText(txt).width,pad=6,cw=w+pad*2,ch=16,r=5;const cx=clamp(pt[0],PAD+cw/2,W-PAD-cw/2),cy=clamp(pt[1]+(dir<0?-24:24),ch,H-ch);const x=cx-cw/2,y=cy-ch/2;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+cw,y,x+cw,y+ch,r);ctx.arcTo(x+cw,y+ch,x,y+ch,r);ctx.arcTo(x,y+ch,x,y,r);ctx.arcTo(x,y,x+cw,y,r);ctx.closePath();ctx.fill();ctx.fillStyle="#fff";ctx.fillText(txt,cx,cy+4);}
function to2(p){return[PAD+(p[0]/100)*(W-2*PAD),H-PAD-(p[1]/100)*(H-2*PAD)];}
function from2(x,y){return[((x-PAD)/(W-2*PAD))*100,((H-PAD-y)/(H-2*PAD))*100];}
function resize(){
  if(!cv)return; const box=cv.parentElement.getBoundingClientRect(); const w=Math.max(280,Math.floor(box.width));
  const key=w+"/2"; if(key===lastKey)return draw(); lastKey=key;
  const h=Math.max(300,Math.min(720,Math.floor(w*0.9))); DPR=Math.min(2,devicePixelRatio||1);
  cv.width=w*DPR;cv.height=h*DPR;cv.style.height=h+"px";W=w;H=h;ctx.setTransform(DPR,0,0,DPR,0,0);draw();
}
function draw(){
  if(!cv)return;ctx.clearRect(0,0,W,H);const p=plate();
  ctx.strokeStyle="rgba(92,53,32,.6)";ctx.lineWidth=1;
  for(let g=0;g<=100;g+=10){let a=to2([g,0]),b=to2([g,100]);ctx.beginPath();ctx.moveTo(a[0]+.5,a[1]);ctx.lineTo(b[0]+.5,b[1]);ctx.stroke();let c=to2([0,g]),d=to2([100,g]);ctx.beginPath();ctx.moveTo(c[0],c[1]+.5);ctx.lineTo(d[0],d[1]+.5);ctx.stroke();}
  ctx.strokeStyle="rgba(92,53,32,.95)";ctx.strokeRect(to2([0,100])[0],to2([0,100])[1],W-2*PAD,H-2*PAD);
  p.clusters.forEach(cl=>{const c=to2(cl.c);const g=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],(W-2*PAD)*0.22);g.addColorStop(0,cl.color+"33");g.addColorStop(1,cl.color+"00");ctx.fillStyle=g;ctx.beginPath();ctx.arc(c[0],c[1],(W-2*PAD)*0.22,0,7);ctx.fill();});
  cloudFor(p,p.id+"2").forEach(pt=>{const s=to2(pt.p);ctx.fillStyle=pt.color;ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(s[0],s[1],2.6,0,7);ctx.fill();}); ctx.globalAlpha=1;
  p.clusters.forEach(cl=>{const c=to2(cl.c);ctx.font="700 27px 'IBM Plex Mono',monospace";ctx.textAlign="center";const tt=clusterName(cl.name).toUpperCase(),w=ctx.measureText(tt).width;ctx.fillStyle="rgba(18,8,0,.88)";ctx.fillRect(c[0]-w/2-8,c[1]-14,w+16,26);ctx.fillStyle=cl.color;ctx.fillText(tt,c[0],c[1]+8);});
  if(RUN.hover&&!RUN.locked){const s=to2(RUN.hover);ctx.save();ctx.setLineDash([3,4]);ctx.strokeStyle="#FF4906";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(PAD,s[1]);ctx.lineTo(s[0],s[1]);ctx.lineTo(s[0],H-PAD);ctx.stroke();ctx.restore();const lbl=RUN.hover[0].toFixed(1)+", "+RUN.hover[1].toFixed(1);ctx.font="11px 'IBM Plex Mono',monospace";ctx.textAlign="left";const lw=ctx.measureText(lbl).width,lx=Math.min(s[0]+8,W-lw-12),ly=Math.max(s[1]-10,16);ctx.fillStyle="#FF4906";ctx.fillRect(lx-4,ly-11,lw+8,15);ctx.fillStyle="#0F0F23";ctx.fillText(lbl,lx,ly);}
  if(RUN.guess){const s=to2(RUN.guess),sc=RUN.pinScale;ctx.save();ctx.translate(s[0],s[1]);ctx.scale(sc,sc);ctx.fillStyle="rgba(255,73,6,.14)";ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.fill();ctx.strokeStyle="#FF4906";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.stroke();ctx.fillStyle="#FF4906";ctx.beginPath();ctx.arc(0,0,2.6,0,7);ctx.fill();ctx.restore();if(RUN.locked)drawPinLabel(s,lang==="zh"?"你":"YOU","#FF4906",-1);}
  if(RUN.locked&&RUN.guess){const g=to2(RUN.guess),tt=to2(plate().t),k=RUN.lineProgress;ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle="rgba(110,74,38,.85)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(g[0],g[1]);ctx.lineTo(g[0]+(tt[0]-g[0])*k,g[1]+(tt[1]-g[1])*k);ctx.stroke();ctx.restore();if(k>.98){ctx.strokeStyle="rgba(21,144,72,.35)";for(let i=1;i<=3;i++){ctx.globalAlpha=.5-i*.12;ctx.beginPath();ctx.arc(tt[0],tt[1],i*20,0,7);ctx.stroke();}ctx.globalAlpha=1;ctx.fillStyle="rgba(255,255,255,.9)";ctx.beginPath();ctx.arc(tt[0],tt[1],16,0,7);ctx.fill();ctx.strokeStyle="#159048";ctx.lineWidth=3.5;ctx.beginPath();ctx.arc(tt[0],tt[1],13,0,7);ctx.stroke();ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(tt[0],tt[1],7.5,0,7);ctx.stroke();ctx.fillStyle="#159048";ctx.beginPath();ctx.arc(tt[0],tt[1],3.6,0,7);ctx.fill();drawPinLabel(tt,lang==="zh"?"答案":"MODEL","#159048",1);const d2=dist(RUN.guess,plate().t).toFixed(1),mx=(g[0]+tt[0])/2,my=(g[1]+tt[1])/2;ctx.font="600 11px 'IBM Plex Mono',monospace";ctx.textAlign="center";const ww=ctx.measureText("d="+d2).width;ctx.fillStyle="rgba(60,40,20,.92)";ctx.fillRect(mx-ww/2-5,my-9,ww+10,16);ctx.fillStyle="#FDF3E3";ctx.fillText("d="+d2,mx,my+3);}}
}
function animatePinBounce(){if(REDUCED){RUN.pinScale=1;draw();return;}const t0=performance.now();(function step(now){const k=clamp((now-t0)/300,0,1);const ease=k<.3?1-2.8*k:k<.6?.16+1.2*(k-.3)/.3-.5*((k-.3)/.3)**2:.9+.1*Math.sin((k-.6)*8)*Math.exp(-6*(k-.6));RUN.pinScale=clamp(ease,.1,1.2);draw();if(k<1)requestAnimationFrame(step);else{RUN.pinScale=1;draw();}})(t0);}
function animateLineReveal(){if(REDUCED){RUN.lineProgress=1;draw();return;}const d=dist(RUN.guess,plate().t),dur=clamp(500+d*15,500,2000),t0=performance.now();(function step(now){const k=clamp((now-t0)/dur,0,1);RUN.lineProgress=1-Math.pow(1-k,3);draw();if(k<1)requestAnimationFrame(step);else{RUN.lineProgress=1;draw();}})(t0);}

/* ── confetti ── */
function spawnConfetti(intensity){const container=document.querySelector(".chart-wrap");if(!container)return;const canvas=document.createElement("canvas");canvas.className="confetti-canvas";const dpr=devicePixelRatio||1,cw=container.clientWidth,ch=container.clientHeight;canvas.width=cw*dpr;canvas.height=ch*dpr;canvas.style.width=cw+"px";canvas.style.height=ch+"px";container.appendChild(canvas);const cctx=canvas.getContext("2d");cctx.setTransform(dpr,0,0,dpr,0,0);const colors=["#FF4906","#00E5FF","#7C3AED","#FF006E","#22C55E","#FBBF24","#FF7A3D"];const count=Math.round(100*intensity),particles=[];for(let i=0;i<count;i++)particles.push({x:Math.random()*cw,y:-20-Math.random()*ch*0.5,vx:(Math.random()-0.5)*5,vy:2+Math.random()*4,w:4+Math.random()*7,h:3+Math.random()*5,color:colors[(Math.random()*colors.length)|0],rot:Math.random()*360,vr:(Math.random()-0.5)*12});const t0=performance.now(),dur=2500;(function frame(now){const k=clamp((now-t0)/dur,0,1);cctx.clearRect(0,0,cw,ch);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.12;p.rot+=p.vr;const life=1-k*k;if(life<=0)return;cctx.save();cctx.translate(p.x,p.y);cctx.rotate(p.rot*Math.PI/180);cctx.globalAlpha=life;cctx.fillStyle=p.color;cctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cctx.restore();});cctx.globalAlpha=1;if(k<1)requestAnimationFrame(frame);else canvas.remove();})(t0);}

/* ── score popup (fullscreen) ── */
function showScorePopup(pts, tier) {
  const tierColor = tier==="h"?"var(--green)":tier==="m"?"var(--gold)":"var(--magenta)";
  let xsrc = pts>=800?"/assets/xiaokuai1.png":pts>=600?"/assets/xiaokuai8.png":pts<200?"/assets/xiaokuai9.png":"";
  const overlay = document.createElement("div");
  overlay.className = "score-popup-overlay fullscreen-popup";
  overlay.innerHTML = `
    <div class="score-popup-card fullscreen-popup-card">
      ${xsrc ? `<img class="popup-xiaokuai fullscreen-xiaokuai" src="${xsrc}" alt="" />` : ""}
      <div class="popup-score" style="color:${tierColor}">${pts.toLocaleString()}<span class="popup-score-denom"> / 1000</span></div>
      <div class="popup-verdict">${verdict(RUN.scores[RUN.idx].d)}</div>
    </div>`;
  document.body.appendChild(overlay);
  if (pts>=800) spawnConfetti(1); else if (pts>=600) spawnConfetti(0.5); else if (pts<200) spawnConfetti(0.15);
  overlay.addEventListener("click", () => { overlay.classList.add("fade-out"); setTimeout(()=>overlay.remove(), 350); });
  setTimeout(() => overlay.classList.add("fade-out"), 2200);
  setTimeout(() => overlay.remove(), 2600);
}

/* ── ranking overlay ── */
function showRankingOverlay(rankData, cumulativeScore) {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "ranking-overlay";
    const pctLabel = lang === "zh"
      ? `第 ${RUN.idx+1} 题 · 第 ${rankData.percentile ?? "—"} 百分位`
      : `${rankData.percentile ?? "—"}th percentile at question ${RUN.idx+1}`;
    overlay.innerHTML = `
      <div class="ranking-card">
        <div class="ranking-title">${t("rankingTitle")}</div>
        <div class="ranking-pos">#${rankData.rank ?? "—"}<span style="font-size:.4em;color:var(--muted-fg)"> / ${rankData.total ?? "?"}</span></div>
        <div class="ranking-pct">${pctLabel}</div>
        <div class="ranking-total">${t("cumulative")} <b style="color:var(--primary)">${cumulativeScore.toLocaleString()}</b></div>
        ${rankData.top5 ? `<div class="ranking-top5"><div class="ranking-top5-hdr">${t("top5at")}</div>${rankData.top5.map((r,i)=>`<div class="ranking-row"><span class="ranking-rk">${i+1}</span><span class="ranking-nm">${esc(r.name)}</span><span class="ranking-sc">${r.score}</span></div>`).join("")}</div>` : ""}
        <button class="btn btn-p ranking-next" id="rankingNextBtn">${RUN.idx>=N()-1?t("results"):t("next")}</button>
      </div>`;
    document.body.appendChild(overlay);
    el("rankingNextBtn").onclick = () => { overlay.remove(); resolve(); };
  });
}

/* ── timer ── */
function startTimer(){clearTimer();timerStart=Date.now();updateTimerDisplay();timerInterval=setInterval(updateTimerDisplay,50);}
function clearTimer(){if(timerInterval){clearInterval(timerInterval);timerInterval=null;}const o=cv&&cv.parentElement&&cv.parentElement.querySelector(".countdown-overlay");if(o)o.remove();}
function updateTimerDisplay(){
  const elapsed=(Date.now()-timerStart)/1000,remaining=Math.max(0,QUESTION_TIME-elapsed),pct=remaining/QUESTION_TIME;
  const ring=el("timerFg"),txt=el("timerText");
  if(ring){const c=2*Math.PI*24;ring.style.strokeDashoffset=c*(1-pct);ring.classList.toggle("urgent",remaining<=3);}
  if(txt){txt.textContent=Math.ceil(remaining);txt.classList.toggle("urgent",remaining<=3);}
  if(remaining<=3&&remaining>0){const num=Math.ceil(remaining);let o=cv.parentElement.querySelector(".countdown-overlay");if(!o){o=document.createElement("div");o.className="countdown-overlay";cv.parentElement.appendChild(o);}const ex=o.querySelector(".countdown-num");if(!ex||ex.dataset.num!==String(num))o.innerHTML=`<div class="countdown-num" data-num="${num}">${num}</div>`;}else if(remaining>3){const o=cv&&cv.parentElement&&cv.parentElement.querySelector(".countdown-overlay");if(o)o.innerHTML="";}
  if(remaining<=0&&!RUN.locked){if(!RUN.guess)RUN.guess=[50,50];lockIn();}
}

/* ── canvas binding ── */
function bindCanvas(){
  cv=el("plot");ctx=cv.getContext("2d");lastKey="";
  const cpt=ev=>{const r=cv.getBoundingClientRect();return[(ev.clientX-r.left)*(W/r.width),(ev.clientY-r.top)*(H/r.height)];};
  cv.addEventListener("pointerdown",ev=>{cv.setPointerCapture(ev.pointerId);});
  cv.addEventListener("pointermove",ev=>{if(RUN.locked)return;const[x,y]=cpt(ev);const q=from2(x,y);RUN.hover=(q[0]>=0&&q[0]<=100&&q[1]>=0&&q[1]<=100)?q:null;draw();});
  cv.addEventListener("pointerleave",()=>{if(RUN.hover){RUN.hover=null;draw();}});
  cv.addEventListener("pointerup",ev=>{if(RUN.locked)return;const[x,y]=cpt(ev);const q=from2(x,y);if(q[0]<0||q[0]>100||q[1]<0||q[1]>100)return;RUN.guess=[+q[0].toFixed(1),+q[1].toFixed(1)];RUN.hover=null;el("lockBtn").disabled=false;animatePinBounce();});
  cv.addEventListener("keydown",ev=>{if(RUN.locked)return;const step=ev.shiftKey?5:1,K={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,step],ArrowDown:[0,-step]};if(K[ev.key]){ev.preventDefault();if(!RUN.guess)RUN.guess=[50,50];RUN.guess[0]=clamp(+(RUN.guess[0]+K[ev.key][0]).toFixed(1),0,100);RUN.guess[1]=clamp(+(RUN.guess[1]+K[ev.key][1]).toFixed(1),0,100);el("lockBtn").disabled=false;draw();}else if(ev.key==="Enter"&&RUN.guess){ev.preventDefault();lockIn();}});
  new ResizeObserver(()=>resize()).observe(cv.parentElement);resize();
}

/* ── routing ── */
function navHTML(active, playMeta) {
  const langBtn = `<button class="btn btn-g btn-sm lang-btn" onclick="window.__toggleLang()">${t("switchLang")}</button>`;
  if (playMeta) return `<div style="display:flex;align-items:center;gap:12px">${langBtn}<div class="nav-meta">q <b>${RUN.idx+1}</b>/${N()} · total <b class="sv">${RUN.scores.reduce((a,b)=>a+(b?b.pts:0),0).toLocaleString()}</b></div></div>`;
  return `<div style="display:flex;align-items:center;gap:10px"><div class="nav-links"><a href="#/leaderboard" class="${active==="/leaderboard"?"active":""}">${t("theBoard")}</a></div>${langBtn}</div>`;
}
window.__toggleLang = toggleLang;
function openLightbox(src,cap){const o=document.createElement("div");o.className="lightbox";o.innerHTML=`<button class="lb-close" aria-label="Close">\u2715</button><img src="${src}" alt=""/><div class="lb-cap">${esc(cap||"")}</div>`;o.addEventListener("click",()=>o.remove());document.body.appendChild(o);}
window.__lightbox=function(node){const img=node.querySelector("img");const cap=node.querySelector(".htp-caption");openLightbox(img.getAttribute("src"),cap?cap.textContent:"");};
async function getDemoQuestions(){try{const qs=await api("/api/questions?mode=demo");if(Array.isArray(qs)&&qs.length)return qs;}catch{}return[];}
async function router(){clearTimer();const hash=location.hash.replace(/^#/,"")||"/";const path=hash.split("?")[0];if(path==="/play")await renderPlay();else if(path==="/summary")await renderSummary();else if(path==="/leaderboard")await renderBoardPage();else if(path==="/how-to-play")renderHowToPlay();else await renderLanding();window.scrollTo(0,0);}
window.addEventListener("hashchange",router);

/* ── How To Play ── */
function renderHowToPlay(){
  el("navRight").innerHTML=`<div style="display:flex;gap:10px;align-items:center"><div class="nav-links"><a href="#/">${t("home")}</a></div><button class="btn btn-g btn-sm" onclick="window.__toggleLang()">${t("switchLang")}</button></div>`;
  const en = `
    <h2>How to play</h2>
    <p>You're looking at a map of how an AI <em>thinks</em>. Drop your pin where you think the mystery image belongs.</p>
    <p>The four clusters are regions the AI recognises. The image you're shown sits somewhere between them — your job is to figure out which one it's closest to, and how close.</p>
    <p>The AI doesn't just look at the object. It reads the <b>whole scene</b> — the lighting, the background, the colours. A banana shot under studio lights might land near "sunny day", not near fruit.</p>
    <p>You have <b>15 seconds</b> per question. The closer your pin, the higher your score.</p>`;
  const zh = `
    <h2>游戏玩法</h2>
    <p>你看到的是一张 AI <em>思维地图</em>。把图钉插在你认为这张神秘图片所属的位置。</p>
    <p>地图上的 4 个簇群是 AI 识别出的区域。你看到的图片落在它们之间的某处——你的任务是判断它最接近哪个簇群，以及有多接近。</p>
    <p>AI 不只看图中的物体，它读取<b>整个场景</b>——光线、背景、颜色。在影棚灯光下拍摄的香蕉，可能被归到「晴天」附近，而不是水果。</p>
    <p>每题有 <b>15 秒</b>作答时间。图钉越接近正确答案，得分越高。</p>`;
  const scoreEn = `<p><b>Scoring:</b> Bullseye (d≤3) → 900+, Half quadrant (d≤12) → 700+, Same quadrant (d≤25) → 500+, Wrong half (d>50) → 0.</p>`;
  const scoreZh = `<p><b>计分：</b>正中靶心 (d≤3) → 900+，半象限 (d≤12) → 700+，同象限 (d≤25) → 500+，对侧 (d>50) → 0。</p>`;
  el("app").innerHTML=`
  <div class="wrap" style="max-width:860px">
    <div class="htp-prose">${lang==="zh"?zh:en}${lang==="zh"?scoreZh:scoreEn}</div>
    <div class="htp-screenshots">
      <div class="htp-shot" onclick="window.__lightbox(this)"><img src="/assets/images/screenshot_correct.png" alt="Correct" /><div class="htp-caption">${lang==="zh"?"正中靶心":"Bullseye — perfect placement"}</div></div>
      <div class="htp-shot" onclick="window.__lightbox(this)"><img src="/assets/images/screenshot_ok.png" alt="Close" /><div class="htp-caption">${lang==="zh"?"比较接近":"Close — right cluster area"}</div></div>
      <div class="htp-shot" onclick="window.__lightbox(this)"><img src="/assets/images/screenshot_far.png" alt="Far off" /><div class="htp-caption">${lang==="zh"?"差太远了":"Far off — wrong half"}</div></div>
    </div>
    <div style="text-align:center;margin-top:32px">
      <a class="btn btn-p" href="#/" style="font-size:18px;padding:16px 40px">${lang==="zh"?"开始游戏 →":"Start playing →"}</a>
    </div>
  </div>`;
}

/* ── Landing ── */
function renderLanding(){
  el("navRight").innerHTML=navHTML("/");
  el("app").innerHTML=`
  <div class="wrap landing-wrap"><div class="landing-center">
    <img class="landing-mascot" src="/assets/xiaoliu.png" alt="Mascot" />
    <h1 class="landing-title">Embed<span class="bo">Guessr</span></h1>
    <p class="landing-sub">${t("sub")}</p>
    <div class="name-entry">
      <input class="inp" id="playerName" maxlength="18" placeholder="${t("enterName")}" />
      <button class="btn btn-p btn-start" id="startBtn" disabled>${t("start")}</button>
    </div>
    <div class="mode-row"><button class="btn btn-demo" id="demoBtn">${lang==="zh"?"\u25B6 \u6F14\u793A\uFF08\u4E09\u9053\u793A\u4F8B\uFF09":"\u25B6 Demo (3 examples)"}</button></div>
    <a href="#/how-to-play" class="htp-link">${lang==="zh"?"？ 如何游戏":"？ How to play"}</a>
    <div class="leaderboard-preview" id="lbPreview"><p style="color:var(--muted-fg);font-size:13px;text-align:center">${t("topScores")}…</p></div>
  </div></div>`;
  const nameInput=el("playerName"),startBtn=el("startBtn");
  nameInput.focus();
  nameInput.addEventListener("input",()=>{startBtn.disabled=!nameInput.value.trim();});
  nameInput.addEventListener("keydown",ev=>{if(ev.key==="Enter"&&nameInput.value.trim())startBtn.click();});
  startBtn.onclick=async()=>{const name=nameInput.value.trim();if(!name)return;startBtn.disabled=true;startBtn.textContent=t("loading");PLATES=await getQuestions();newRun(name);startRun(name).then(r=>{RUN_ID=r.runId||"";}).catch(()=>{});location.hash="#/play";};
  el("demoBtn").onclick=async()=>{const name=(nameInput.value.trim())||(lang==="zh"?"\u8BBF\u5BA2":"guest");el("demoBtn").disabled=true;el("demoBtn").textContent=t("loading");PLATES=await getDemoQuestions();if(!PLATES.length){el("demoBtn").textContent="\u2014";return;}newRun(name);RUN.mode="demo";startRun(name).then(r=>{RUN_ID=r.runId||"";}).catch(()=>{});location.hash="#/play";};
  getBoard().then(rows=>{const pr=el("lbPreview");if(!pr)return;if(!rows.length){pr.innerHTML=`<p style="color:var(--muted-fg);font-size:13px;text-align:center">${t("noScores")}</p>`;return;}pr.innerHTML=`<div class="mini-board"><div class="mini-board-hdr"><span>${t("topScores")}</span><a href="#/leaderboard">${t("seeAll")}</a></div>${rows.slice(0,10).map((r,i)=>`<div class="mini-row"><span class="mini-rank">${i+1}</span><span class="mini-name">${esc(r.name)}</span><span class="mini-score">${r.score.toLocaleString()}</span></div>`).join("")}</div>`;}).catch(()=>{});
}

/* ── Play ── */
function renderPlay(){
  if(!PLATES||!RUN||RUN.idx>=N()){clearTimer();location.hash="#/";return;}
  const p=plate(),g=p.guess;
  el("navRight").innerHTML=navHTML(null,true);
  const circ=2*Math.PI*24;
  el("app").innerHTML=`
  <div class="game-fullscreen">
    <div class="game-cols-full">
      <div class="chart-wrap-full">
        <div class="chart-header">
          <div class="timer-wrap"><div class="timer-ring"><svg viewBox="0 0 56 56"><circle class="timer-bg" cx="28" cy="28" r="24"/><circle class="timer-fg" id="timerFg" cx="28" cy="28" r="24" stroke-dasharray="${circ}" stroke-dashoffset="0"/></svg><div class="timer-text" id="timerText">${QUESTION_TIME}</div></div></div>
          <div class="chart-label">${t("projection")}</div>
        </div>
        <div style="position:relative;flex:1"><canvas id="plot" tabindex="0" role="application" aria-label="Embedding chart"></canvas></div>
        <div class="marker-key"><span class="mk"><span class="dot you"></span>${lang==="zh"?"你的图钉":"Your pin"}</span><span class="mk"><span class="dot model"></span>${lang==="zh"?"模型答案":"Model\u2019s answer"}</span></div>
        <div class="controls" style="margin-top:12px">
          <button class="btn btn-p" id="lockBtn" ${RUN.guess?"":"disabled"}>${t("lockIn")}</button>
          <button class="btn btn-a hidden" id="nextBtn">${t("next")}</button>
          <button class="btn btn-g" id="quitBtn">${t("quit")}</button>
        </div>
      </div>
      <aside class="rail-full">
        <div class="card rail-card"><h3>${t("progress")}</h3><div class="plate-dots">${PLATES.map((_,i)=>`<i class="${i<RUN.idx?"done":i===RUN.idx?"cur":""}"></i>`).join("")}</div></div>
        <div class="card rail-card">
          <h3>${t("specimen")} · q${String(RUN.idx+1).padStart(2,"0")} <span class="diff-tag diff-${p.difficulty}">${p.difficulty}</span>${p.tutorial?` <span class="tutorial-tag">TUTORIAL</span>`:""}</h3>
          <div class="specimen-full">${g?`<img src="${esc(g.src)}" alt="${esc(g.name||"")}" />`:""}  </div>
          <div class="spec-name">${esc(g?g.name:"—")}</div>
          <div class="spec-sub">${esc(g?g.caption:"")}</div>
          <span class="spec-tag">${t("offManifold")}</span>
        </div>
        <div class="card rail-card"><h3>${t("clusters")}</h3><div class="legend" id="legend"></div></div>
        <div class="card rail-card hidden" id="revealCard"></div>
      </aside>
    </div>
  </div>`;
  buildLegend();bindCanvas();
  el("lockBtn").onclick=lockIn;
  el("nextBtn").onclick=advanceQuestion;
  el("quitBtn").onclick=()=>{clearTimer();location.hash="#/";};
  if(RUN.locked)showReveal();
  document.body.dataset.dims=2;
  setTimeout(()=>{el("plot")&&el("plot").focus();startTimer();},50);
}

function buildLegend(){const p=plate();el("legend").innerHTML=p.clusters.map(cl=>`<div class="row"><span class="sw" style="background:${cl.color};color:${cl.color}"></span>${esc(clusterName(cl.name))}</div>`).join("")+`<div class="row fog"><span class="sw" style="background:#5b5f80;color:#5b5f80"></span>${t("ambiguous")}</div>`;}

async function lockIn(){
  if(RUN.locked)return;if(!RUN.guess)RUN.guess=[50,50];clearTimer();
  const p=plate(),d=dist(RUN.guess,p.t),pts=roundScore(d);
  const tier=pts>=800?"h":pts>=400?"m":"l";
  RUN.scores[RUN.idx]={pts,d,name:p.guess.name,difficulty:p.difficulty,questionId:p.id};
  RUN.locked=true;RUN.hover=null;RUN.lineProgress=0;
  cv.classList.add("locked");
  el("lockBtn").classList.add("hidden");
  const nb=el("nextBtn");nb.classList.remove("hidden");nb.textContent=RUN.idx>=N()-1?t("results"):t("next");
  el("navRight").innerHTML=navHTML(null,true);
  buildLegend();showReveal();animateLineReveal();
  showScorePopup(pts,tier);
  if(RUN_ID)postQuestionScore(RUN_ID,RUN.idx,p.id,pts,d).catch(()=>{});
}

async function advanceQuestion(){
  const cumulative=RUN.scores.reduce((a,b)=>a+(b?b.pts:0),0);
  let rankData={rank:null,total:null,percentile:null};
  if(RUN_ID&&RUN.scores[RUN.idx]){try{rankData=await postQuestionScore(RUN_ID,RUN.idx,RUN.scores[RUN.idx].questionId,RUN.scores[RUN.idx].pts,RUN.scores[RUN.idx].d);}catch{}}
  await showRankingOverlay(rankData,cumulative);
  if(RUN.idx>=N()-1){location.hash="#/summary";}
  else{clearTimer();RUN.idx++;RUN.guess=null;RUN.locked=false;RUN.hover=null;RUN.pinScale=1;RUN.lineProgress=0;renderPlay();}
}

function showReveal(){const p=plate(),s=RUN.scores[RUN.idx];if(!s)return;const cl=nearestCluster(p),tier=s.pts>=800?"h":s.pts>=400?"m":"l";
  const rc=el("revealCard");if(!rc)return;rc.classList.remove("hidden");
  rc.innerHTML=`<h3>${t("result")}</h3>
    <div class="verdict">${verdict(s.d)}</div>
    <div class="big score-pulse" style="color:${tier==="h"?"var(--green)":tier==="m"?"var(--gold)":"var(--magenta)"}">${s.pts.toLocaleString()}<span style="font-size:.4em;color:var(--muted-fg)"> / 1000</span></div>
    <div class="placed" style="color:${cl.color}"><b>${esc(cl.name)}</b></div>
    <div class="bar-track"><div class="bar-fill fill-${tier}" style="width:${s.pts/10}%"></div></div>
    <div class="stat"><span>${t("distance")}</span><b>${s.d.toFixed(1)}</b></div>
    <p class="why">${esc(p.why)}</p>`;
}

/* ── Summary ── */
async function renderSummary(){
  if(!RUN||!RUN.scores.length){location.hash="#/";return;}
  const total=RUN.scores.reduce((a,b)=>a+(b?b.pts:0),0),max=N()*1000;
  const pct=total/max,grade=pct>.82?["S","grade-s"]:pct>.64?["A","grade-a"]:pct>.46?["B","grade-b"]:["C","grade-c"];
  const best=RUN.scores.reduce((a,b)=>(b&&b.pts>a.pts?b:a),{pts:-1});
  const worst=RUN.scores.reduce((a,b)=>(b&&b.pts<a.pts?b:a),{pts:1e9});
  const avgD=(RUN.scores.reduce((a,b)=>a+(b?b.d:0),0)/RUN.scores.length).toFixed(1);
  el("navRight").innerHTML=`<div style="display:flex;gap:10px;align-items:center"><button class="btn btn-g btn-sm" onclick="window.__toggleLang()">${t("switchLang")}</button><div class="nav-meta">${t("runComplete")}</div></div>`;
  el("app").innerHTML=`
  <div class="wrap">
    <div class="sum-hero"><div class="sum-label">${t("finalScore")}</div><div class="sum-score">${total.toLocaleString()} <span class="max">/ ${max.toLocaleString()}</span></div><div class="grade ${grade[1]}">${grade[0]}</div></div>
    <div class="divider"></div>
    <div class="stat-row">
      <div class="glass stat-card"><div class="stat-val" style="color:var(--green)">${best.pts<0?"—":best.pts.toLocaleString()}</div><div class="stat-lbl">${t("best")}</div></div>
      <div class="glass stat-card"><div class="stat-val" style="color:var(--magenta)">${worst.pts===1e9?"—":worst.pts.toLocaleString()}</div><div class="stat-lbl">${t("worst")}</div></div>
      <div class="glass stat-card"><div class="stat-val" style="color:var(--accent)">${avgD}</div><div class="stat-lbl">${t("avgDist")}</div></div>
    </div>
    <div class="card" style="margin-top:20px;padding:18px"><h3 style="font-family:var(--font-m);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted-fg);margin:0 0 12px">${t("plateBplate")}</h3>
    <table><thead><tr><th>${t("specimen2")}</th><th>${t("diff2")}</th><th class="num">${t("distance")}</th><th class="num">${t("points")}</th></tr></thead><tbody>${RUN.scores.map(s=>`<tr><td>${esc(s.name)}</td><td><span class="diff-tag diff-${s.difficulty}">${s.difficulty}</span></td><td class="num">${s.d.toFixed(1)}</td><td class="num">${s.pts.toLocaleString()}</td></tr>`).join("")}</tbody></table></div>
    <div class="card" style="margin-top:20px;padding:18px"><button class="btn btn-p" id="saveBtn">${t("saveBoard")}</button><p id="saveNote" style="color:var(--muted-fg);font-size:12px;margin:6px 0 0"></p></div>
    <div class="controls" style="margin-top:18px"><button class="btn btn-a" id="againBtn">${t("playAgain")}</button><a class="btn btn-g" href="#/leaderboard">${t("viewBoard")}</a></div>
  </div>`;
  el("saveBtn").onclick=async()=>{el("saveBtn").disabled=true;el("saveBtn").textContent=t("saving");const res=await postScore({name:PLAYER_NAME,score:total,difficulty:"mixed",plates:RUN.scores.map(s=>({name:s.name,pts:s.pts}))});el("saveBtn").textContent=t("saved");el("saveNote").textContent=(res.offline?"Saved locally. ":"")+(res.rank?"#"+res.rank+" on the board.":"");};
  el("againBtn").onclick=()=>{location.hash="#/";};
}

/* ── Leaderboard ── */
async function renderBoardPage(){
  el("navRight").innerHTML=`<div style="display:flex;gap:10px;align-items:center"><div class="nav-links"><a href="#/">${t("home")}</a></div><button class="btn btn-g btn-sm" onclick="window.__toggleLang()">${t("switchLang")}</button></div>`;
  el("app").innerHTML=`<div class="wrap"><div class="page-hdr"><h1>The <span>${t("theBoard")}</span></h1></div><div id="boardMount"><p style="text-align:center;color:var(--muted-fg)">Loading…</p></div></div>`;
  const rows=await getBoard();const mnt=el("boardMount");if(!mnt)return;if(!rows.length){mnt.innerHTML=`<p style="text-align:center;color:var(--muted-fg)">${t("noScores")} <a href="#/" style="color:var(--primary)">${t("start")}</a></p>`;return;}
  const top3=rows.slice(0,3),rest=rows.slice(3,25),col=["var(--gold)","#CBD5E1","var(--secondary)"];
  mnt.innerHTML=`<div class="podium">${top3.map((r,i)=>`<div class="glass pod"><div class="rk" style="color:${col[i]}">${i+1}</div><div class="nm">${esc(r.name)}</div><div class="sc" style="color:${col[i]}">${r.score.toLocaleString()}</div></div>`).join("")}</div><div class="card" style="padding:8px 4px"><table><thead><tr><th>#</th><th>${lang==="zh"?"玩家":"Player"}</th><th class="num">${t("points")}</th></tr></thead><tbody>${rest.map((r,i)=>`<tr><td><span class="rank-badge">${i+4}</span></td><td>${esc(r.name)}</td><td class="num">${r.score.toLocaleString()}</td></tr>`).join("")}</tbody></table></div>`;
}

router();
})();
