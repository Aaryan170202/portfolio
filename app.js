(function(){
  'use strict';
  var $=function(s){return document.querySelector(s)};
  var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMobile=window.matchMedia('(max-width: 760px)');
  function isMobile(){return mqMobile.matches}
  var docEl=document.documentElement;
  var desktop=$('#desktop');

  function tick(){
    var d=new Date();
    var t=('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
    $('#clock').textContent=t;
    $('#mClock').textContent=t;
  }
  tick();setInterval(tick,20000);

  /* ============ signals ============ */
  var SIGNALS=[
    {id:'boot',  mid:'boot.sequence',      name:'Boot the OS',              how:'done automatically — you\u2019re in'},
    {id:'apps',  mid:'apps.explored',      name:'Open 5 different apps',    how:'tap any 5 icons on the home screen'},
    {id:'shell', mid:'shell.first_command',name:'Run a terminal command',   how:'open Terminal, type \u2018help\u2019, hit enter'},
    {id:'skills',mid:'skills.probed',      name:'Probe a skill',            how:'in Skills, tap any skill chip'},
    {id:'agents',mid:'agents.interviewed', name:'Interview the AI agents',  how:'in Projects, tap all 3 AMORE cards'},
    {id:'game',  mid:'minigame.debug_run', name:'Play an arcade game',how:'open Arcade, finish any one game'},
    {id:'visit', mid:'product.visited',    name:'Visit nocaps.in',          how:'tap a nocaps.in link (in Projects or Experience)'},
    {id:'wall',  mid:'wallpaper.disturbed',name:'Disturb the wallpaper',    how:'tap empty home-screen space 3 times'},
    {id:'inbox', mid:'inbox.reached',      name:'Reach the inbox',          how:'open Contact Me'}
  ];
  var got={};
  var sigList=$('#signalList');
  SIGNALS.forEach(function(s){
    var li=document.createElement('li');
    li.id='sig-'+s.id;
    li.innerHTML='<span class="mk">[ ]</span><div class="sg"><span class="nm">'+s.name+'</span><span class="how">'+s.how+'</span><span class="mid">'+s.mid+' \u2713</span></div>';
    sigList.appendChild(li);
  });
  function sigCount(){return SIGNALS.filter(function(s){return got[s.id]}).length}
  function renderProgress(){
    var n=sigCount(),total=SIGNALS.length;
    var pct=Math.round(n/total*100);
    var pctEl=$('#sigPct');if(pctEl)pctEl.textContent=pct+'%';
    var lbl=$('#sigPctLabel');if(lbl)lbl.textContent=pct+'% completed';
    var frac=$('#sigPctFrac');if(frac)frac.textContent=n+' / '+total;
    var fill=$('#sigProgressFill');if(fill)fill.style.width=pct+'%';
  }
  function award(id){
    if(got[id])return;
    got[id]=true;
    var li=$('#sig-'+id);
    li.classList.add('got');li.querySelector('.mk').textContent='[x]';
    renderProgress();
    var s=SIGNALS.filter(function(x){return x.id===id})[0];
    var pct=Math.round(sigCount()/SIGNALS.length*100);
    toast('signal earned: '+s.name+'  ('+pct+'% completed)');
    if(sigCount()===SIGNALS.length)setTimeout(showReport,700);
  }
  $('#sigChip').addEventListener('click',function(e){
    e.stopPropagation();
    this.classList.remove('attn');
    var open=$('#sigPanel').classList.toggle('open');
    this.setAttribute('aria-expanded',open);
    $('#startMenu').classList.remove('open');
  });

  /* ============ toasts ============ */
  function toast(msg){
    var t=document.createElement('div');
    t.className='toast';t.textContent=msg;
    $('#toasts').appendChild(t);
    requestAnimationFrame(function(){t.classList.add('show')});
    setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove()},300)},2400);
  }

  /* ============ window manager ============ */
  var APPS={
    readme:'Start Here', about:'About Me', track:'Experience',
    skills:'Skills', services:'Services', projects:'Projects',
    terminal:'Terminal', game:'Arcade', contact:'Contact Me'
  };
  // Icon captions and window title bars are hand-written in the HTML too (so the
  // page still reads correctly with JS disabled), but here they get reasserted
  // from APPS — the one source of truth — so the two can never silently drift
  // apart again, no matter what gets edited later.
  $$('.icon[data-open]').forEach(function(ic){
    var key=ic.getAttribute('data-open'), lbl=ic.querySelector('.lbl');
    if(lbl&&APPS[key])lbl.textContent=APPS[key];
  });
  $$('.window[data-app]').forEach(function(w){
    var key=w.getAttribute('data-app');
    if(key==='terminal')return; // keeps its own "amore@aaryan.sys" flavor title
    var t=w.querySelector('.win-title');
    if(t&&APPS[key])t.textContent=APPS[key];
  });
  $$('.sig-total').forEach(function(el){el.textContent=SIGNALS.length;});
  renderProgress();
  var zTop=10, openedDistinct={}, cascade=0;
  function win(app){return document.querySelector('.window[data-app="'+app+'"]')}
  function focusWin(w){
    $$('.window').forEach(function(x){x.classList.remove('focus')});
    w.classList.add('focus');
    w.style.zIndex=++zTop;
    $$('.task-item').forEach(function(t){t.classList.toggle('active',t.dataset.app===w.dataset.app)});
  }
  function syncWindowState(){
    document.body.classList.toggle('has-window', $$('.window.open').length>0);
  }
  function openApp(app){
    var w=win(app);if(!w)return;
    if(isMobile()){
      $$('.window.open').forEach(function(x){if(x!==w)x.classList.remove('open')});
    }
    if(!w.classList.contains('open')){
      w.classList.add('open');
      if(!isMobile()&&!w.dataset.placed){
        var dw=desktop.clientWidth,dh=desktop.clientHeight;
        var ww=w.offsetWidth,wh=w.offsetHeight;
        var x=Math.max(120,(dw-ww)/2)+((cascade%5)-2)*34;
        var y=Math.max(14,(dh-wh)/2-20)+((cascade%4)-1)*30;
        w.style.left=Math.max(8,Math.min(x,dw-ww-8))+'px';
        w.style.top=Math.max(8,Math.min(y,dh-80))+'px';
        w.dataset.placed='1';cascade++;
      }
      addTask(app);
      openedDistinct[app]=true;
      if(Object.keys(openedDistinct).length>=5)award('apps');
      if(app==='contact')award('inbox');
      if(app==='game')showArcade('menu');
      if(app==='terminal'&&!isMobile())setTimeout(function(){$('#termInput').focus()},80);
    }
    focusWin(w);
    $('#startMenu').classList.remove('open');
    $('#sigPanel').classList.remove('open');
    syncWindowState();
  }
  function closeApp(app){
    var w=win(app);if(!w)return;
    w.classList.remove('open');
    removeTask(app);
    if(app==='game')stopGame(false);
    syncWindowState();
  }
  function addTask(app){
    if(document.querySelector('.task-item[data-app="'+app+'"]'))return;
    var b=document.createElement('button');
    b.className='task-item';b.dataset.app=app;b.textContent=APPS[app];
    b.addEventListener('click',function(){
      var w=win(app);
      if(!w.classList.contains('open')){w.classList.add('open');}
      focusWin(w);
      syncWindowState();
    });
    $('#taskItems').appendChild(b);
  }
  function removeTask(app){
    var t=document.querySelector('.task-item[data-app="'+app+'"]');
    if(t)t.remove();
  }
  /* ============ safe storage (no-op where localStorage is blocked) ============ */
  var store={
    get:function(k){try{return window.localStorage.getItem(k)}catch(e){return null}},
    set:function(k,v){try{window.localStorage.setItem(k,v)}catch(e){}},
    remove:function(k){try{window.localStorage.removeItem(k)}catch(e){}}
  };

  /* ============ draggable desktop icons ============ */
  var iconEls=$$('.icon[data-open]');
  var iconsBox=$('#icons')||iconEls[0].parentElement;
  var ICON_KEY='aaryan-os-icons-v1';

  function defaultLayout(){
    // arrange icons in a grid based on current viewport, matching the old look
    var mobile=isMobile();
    var pos={};
    if(mobile){
      var cellW=iconsBox.clientWidth/4, cellH=96;
      iconEls.forEach(function(ic,i){
        pos[ic.dataset.open]={x:4+(i%4)*cellW+(cellW-80)/2,y:(Math.floor(i/4))*cellH};
      });
    }else{
      // desktop: columns of 5, like the original grid
      var colW=100, rowH=92, perCol=5;
      iconEls.forEach(function(ic,i){
        var col=Math.floor(i/perCol), row=i%perCol;
        pos[ic.dataset.open]={x:14+col*colW,y:18+row*rowH};
      });
    }
    return pos;
  }
  function applyLayout(pos){
    iconEls.forEach(function(ic){
      var p=pos[ic.dataset.open];
      if(p){ic.style.left=p.x+'px';ic.style.top=p.y+'px';}
    });
  }
  function currentLayout(){
    var pos={};
    iconEls.forEach(function(ic){
      pos[ic.dataset.open]={x:parseFloat(ic.style.left)||0,y:parseFloat(ic.style.top)||0};
    });
    return pos;
  }
  function clampIcon(ic){
    var maxX=iconsBox.clientWidth-ic.offsetWidth;
    var maxY=iconsBox.clientHeight-ic.offsetHeight;
    var x=Math.min(Math.max(0,parseFloat(ic.style.left)||0),Math.max(0,maxX));
    var y=Math.min(Math.max(0,parseFloat(ic.style.top)||0),Math.max(0,maxY));
    ic.style.left=x+'px';ic.style.top=y+'px';
  }
  function loadIcons(){
    var saved=null;
    try{saved=JSON.parse(store.get(ICON_KEY)||'null')}catch(e){saved=null}
    var base=defaultLayout();
    if(saved){ // merge: use saved where present, default for any new icon
      iconEls.forEach(function(ic){
        if(!saved[ic.dataset.open])saved[ic.dataset.open]=base[ic.dataset.open];
      });
      applyLayout(saved);
    }else{
      applyLayout(base);
    }
    iconEls.forEach(clampIcon);
  }
  function saveIcons(){store.set(ICON_KEY,JSON.stringify(currentLayout()));}
  function resetIcons(){
    store.remove(ICON_KEY);
    applyLayout(defaultLayout());
    iconEls.forEach(clampIcon);
    toast('desktop layout reset');
  }

  // lay them out now (and keep them sensible on resize if never moved)
  loadIcons();
  var iconsWereMoved=!!store.get(ICON_KEY);
  window.addEventListener('resize',function(){
    if(!iconsWereMoved)applyLayout(defaultLayout());
    iconEls.forEach(clampIcon);
  });

  // drag vs tap
  iconEls.forEach(function(ic){
    var start=null,moved=false;
    ic.addEventListener('dragstart',function(e){e.preventDefault();}); // stop native image/text drag on desktop
    ic.addEventListener('pointerdown',function(e){
      if(e.button===1||e.button===2)return;
      start={x:e.clientX,y:e.clientY,ox:parseFloat(ic.style.left)||0,oy:parseFloat(ic.style.top)||0};
      moved=false;
      ic.setPointerCapture(e.pointerId);
    });
    ic.addEventListener('pointermove',function(e){
      if(!start)return;
      var dx=e.clientX-start.x,dy=e.clientY-start.y;
      if(!moved&&Math.abs(dx)+Math.abs(dy)<6)return; // small movement = still a tap
      if(!moved){moved=true;ic.classList.add('dragging');}
      var nx=start.ox+dx,ny=start.oy+dy;
      var maxX=iconsBox.clientWidth-ic.offsetWidth;
      var maxY=iconsBox.clientHeight-ic.offsetHeight;
      ic.style.left=Math.min(Math.max(0,nx),Math.max(0,maxX))+'px';
      ic.style.top=Math.min(Math.max(0,ny),Math.max(0,maxY))+'px';
    });
    function end(e){
      if(!start)return;
      var wasMoved=moved;
      start=null;
      if(wasMoved){
        ic.classList.remove('dragging');
        iconsWereMoved=true;
        saveIcons();
      }else{
        // clean tap → move the controller cursor here, then open
        var idx=navIcons.indexOf(ic);
        if(idx>=0){navIcons.forEach(function(x){x.classList.remove('nav-selected')});navIdx=idx;ic.classList.add('nav-selected');}
        openApp(ic.dataset.open);
      }
    }
    ic.addEventListener('pointerup',end);
    ic.addEventListener('pointercancel',function(){
      if(start&&moved)ic.classList.remove('dragging');
      start=null;
    });
    // keyboard/gamepad still open via Enter/A even though click is now drag-aware
    ic.addEventListener('keydown',function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openApp(ic.dataset.open);}
    });
  });
  $$('.window').forEach(function(w){
    w.addEventListener('pointerdown',function(){focusWin(w)});
    Array.prototype.slice.call(w.querySelectorAll('[data-close]')).forEach(function(b){
      b.addEventListener('click',function(){closeApp(w.dataset.app)});
    });
    var minBtn=w.querySelector('[data-min]');
    if(minBtn)minBtn.addEventListener('click',function(){
      w.classList.remove('open');
      if(w.dataset.app==='game')stopGame(false);
      syncWindowState();
    });
  });
  function backAction(){
    var wm=$('#welcomeModal');
    if(wm.classList.contains('open')){wm.classList.remove('open');return true;}
    if($('#reportModal').classList.contains('open')){closeReport();return true;}
    var tops=$$('.window.open').sort(function(a,b){return (b.style.zIndex|0)-(a.style.zIndex|0)});
    if(tops[0]){closeApp(tops[0].dataset.app);return true;}
    return false;
  }
  window.addEventListener('keydown',function(e){
    if(e.key==='Escape')backAction();
  });

  /* ============ D-pad style navigation (keyboard + on-screen + real gamepads) ============ */
  var navIcons=$$('.icon[data-open]');
  var navIdx=-1;
  function typingInField(){
    var ae=document.activeElement;
    return ae&&(ae.tagName==='INPUT'||ae.tagName==='TEXTAREA');
  }
  function overlayOpen(){
    return $('#welcomeModal').classList.contains('open')||$('#reportModal').classList.contains('open');
  }
  function highlight(i){
    navIcons.forEach(function(el){el.classList.remove('nav-selected')});
    navIdx=i;
    if(i>=0&&navIcons[i]){
      navIcons[i].classList.add('nav-selected');
      navIcons[i].focus();
    }
  }
  function navigateIcons(dir){
    if(typingInField()||overlayOpen())return;
    if($$('.window.open').length)return; // when a window is open, arrows scroll it instead (handled in act)
    if(!navIcons.length)return;
    if(navIdx<0||navIcons[navIdx].style.display==='none'){
      // pick first visible icon
      for(var k=0;k<navIcons.length;k++){if(navIcons[k].style.display!=='none'){highlight(k);return;}}
      return;
    }
    var cur={
      cx:navIcons[navIdx].getBoundingClientRect().left+navIcons[navIdx].offsetWidth/2,
      cy:navIcons[navIdx].getBoundingClientRect().top+navIcons[navIdx].offsetHeight/2
    };
    var best=-1,bestScore=Infinity;
    navIcons.forEach(function(el,i){
      if(i===navIdx||el.style.display==='none')return;
      var r=el.getBoundingClientRect();
      var ix=r.left+r.width/2,iy=r.top+r.height/2;
      var dx=ix-cur.cx,dy=iy-cur.cy,primary,ortho;
      if(dir==='right'){if(dx<=4)return;primary=dx;ortho=Math.abs(dy);}
      else if(dir==='left'){if(dx>=-4)return;primary=-dx;ortho=Math.abs(dy);}
      else if(dir==='down'){if(dy<=4)return;primary=dy;ortho=Math.abs(dx);}
      else{if(dy>=-4)return;primary=-dy;ortho=Math.abs(dx);}
      var score=primary+ortho*2.2;
      if(score<bestScore){bestScore=score;best=i;}
    });
    if(best>=0)highlight(best);
  }
  function selectCurrent(){
    if(overlayOpen())return;
    if($$('.window.open').length)return;
    if(navIdx<0){highlight(0);return;}
    if(navIcons[navIdx])openApp(navIcons[navIdx].dataset.open);
  }
  var ARROW_DIR={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};
  window.addEventListener('keydown',function(e){
    if(typingInField())return;
    var k=e.key.toLowerCase();
    if(ARROW_DIR[e.key]){
      if($$('.window.open').length){
        // scroll focused window
        var w=$$('.window.open').sort(function(a,b){return (b.style.zIndex|0)-(a.style.zIndex|0)})[0];
        var body=w&&w.querySelector('.win-body');
        if(body){if(e.key==='ArrowDown')body.scrollTop+=90;else if(e.key==='ArrowUp')body.scrollTop-=90;}
        return;
      }
      e.preventDefault();
      navigateIcons(ARROW_DIR[e.key]);
    }else if(k==='a'||e.key==='Enter'){
      if(navIdx>=0&&!$$('.window.open').length&&!overlayOpen()){e.preventDefault();selectCurrent();}
    }else if(k==='b'){
      if(!overlayOpen()){
        var openW=$$('.window.open');
        if(openW.length){e.preventDefault();backAction();}
      }
    }
  });
  // clicking an icon directly moves the controller cursor to it
  navIcons.forEach(function(el,i){
    el.addEventListener('click',function(){
      navIcons.forEach(function(x){x.classList.remove('nav-selected')});
      navIdx=i;
      el.classList.add('nav-selected');
    });
  });

  /* ---- real game controller support ---- */
  if('getGamepads' in navigator){
    var padState={},padAnnounced=false;
    window.addEventListener('gamepadconnected',function(){
      if(padAnnounced)return;padAnnounced=true;
      toast('🎮 controller connected — D-pad to move, A to select, B to go back');
    });
    (function pollPad(){
      var pads=navigator.getGamepads();
      for(var p=0;p<pads.length;p++){
        var gp=pads[p];if(!gp)continue;
        var prev=padState[gp.index]||{dir:null,heldAt:0,a:false,b:false};
        var dir=null;
        if(gp.buttons[12]&&gp.buttons[12].pressed)dir='up';
        else if(gp.buttons[13]&&gp.buttons[13].pressed)dir='down';
        else if(gp.buttons[14]&&gp.buttons[14].pressed)dir='left';
        else if(gp.buttons[15]&&gp.buttons[15].pressed)dir='right';
        else{
          var ax=gp.axes[0]||0,ay=gp.axes[1]||0;
          if(ay<-0.5)dir='up';else if(ay>0.5)dir='down';
          else if(ax<-0.5)dir='left';else if(ax>0.5)dir='right';
        }
        var now=Date.now(),heldAt=prev.heldAt;
        if(dir&&(dir!==prev.dir||now-prev.heldAt>260)){
          if($$('.window.open').length){
            var w=$$('.window.open').sort(function(a,b){return (b.style.zIndex|0)-(a.style.zIndex|0)})[0];
            var body=w&&w.querySelector('.win-body');
            if(body){if(dir==='down')body.scrollTop+=90;else if(dir==='up')body.scrollTop-=90;}
          }else{
            navigateIcons(dir);
          }
          heldAt=now;
        }
        var aBtn=!!(gp.buttons[0]&&gp.buttons[0].pressed);
        var bBtn=!!(gp.buttons[1]&&gp.buttons[1].pressed);
        if(aBtn&&!prev.a)selectCurrent();
        if(bBtn&&!prev.b)backAction();
        padState[gp.index]={dir:dir,heldAt:dir?heldAt:0,a:aBtn,b:bBtn};
      }
      requestAnimationFrame(pollPad);
    })();
  }

  /* ---- on-screen controller (permanent visible D-pad + A/B) ---- */
  (function(){
    var pad=$('#gamepad');
    if(!pad)return;
    function press(el){el.classList.add('press');setTimeout(function(){el.classList.remove('press')},110);}
    function openWin(){
      return $$('.window.open').sort(function(a,b){return (b.style.zIndex|0)-(a.style.zIndex|0)})[0];
    }
    function act(nav,srcBtn){
      if(srcBtn)press(srcBtn);
      if(nav==='select'){selectCurrent();return;}
      if(nav==='back'){backAction();return;}
      // directional
      var w=openWin();
      if(w){
        var body=w.querySelector('.win-body');
        if(body){
          if(nav==='down')body.scrollTop+=90;
          else if(nav==='up')body.scrollTop-=90;
        }
        return;
      }
      navigateIcons(nav);
    }
    Array.prototype.slice.call(pad.querySelectorAll('[data-nav]')).forEach(function(btn){
      // pointerdown (not click) so focus never leaves the icon cursor
      btn.addEventListener('pointerdown',function(e){
        e.preventDefault();
        act(btn.getAttribute('data-nav'),btn);
      });
    });
    // seed a selection so the very first arrow press has an anchor
    if(navIdx<0&&navIcons.length){navIdx=0;navIcons[0].classList.add('nav-selected');}
  })();

  /* ---- dragging (desktop) ---- */
  $$('.window .win-bar').forEach(function(bar){
    var w=bar.closest('.window');
    bar.addEventListener('pointerdown',function(e){
      if(isMobile()||e.target.closest('button'))return;
      var sx=e.clientX,sy=e.clientY;
      var ox=w.offsetLeft,oy=w.offsetTop;
      bar.setPointerCapture(e.pointerId);
      function mv(ev){
        var nx=ox+(ev.clientX-sx),ny=oy+(ev.clientY-sy);
        nx=Math.max(-w.offsetWidth+90,Math.min(nx,desktop.clientWidth-70));
        ny=Math.max(0,Math.min(ny,desktop.clientHeight-40));
        w.style.left=nx+'px';w.style.top=ny+'px';
      }
      function up(){
        bar.removeEventListener('pointermove',mv);
        bar.removeEventListener('pointerup',up);
      }
      bar.addEventListener('pointermove',mv);
      bar.addEventListener('pointerup',up);
    });
  });

  /* ---- start menu ---- */
  var menu=$('#startMenu');
  Object.keys(APPS).forEach(function(app){
    var b=document.createElement('button');
    b.textContent=APPS[app];
    b.addEventListener('click',function(){openApp(app)});
    menu.appendChild(b);
    if(app==='projects'){var s=document.createElement('div');s.className='sep';menu.appendChild(s);}
  });
  $('#startBtn').addEventListener('click',function(e){
    e.stopPropagation();
    var open=menu.classList.toggle('open');
    this.setAttribute('aria-expanded',open);
    $('#sigPanel').classList.remove('open');
  });
  document.addEventListener('click',function(e){
    if(!e.target.closest('#startMenu,#startBtn'))menu.classList.remove('open');
    if(!e.target.closest('#sigPanel,#sigChip'))$('#sigPanel').classList.remove('open');
  });

  /* ============ boot ============ */
  var boot=$('#boot'),bootDone=false;
  function endBoot(){
    if(bootDone)return;bootDone=true;
    boot.classList.add('done');
    setTimeout(function(){boot.remove()},500);
    award('boot');
    setTimeout(function(){$('#welcomeModal').classList.add('open')},350);
  }
  $('#wGo').addEventListener('click',function(){
    $('#welcomeModal').classList.remove('open');
    if(!isMobile())openApp('readme');
  });
  $('#wHurry').addEventListener('click',function(){
    $('#welcomeModal').classList.remove('open');
    openApp('contact');
  });
  $('#welcomeModal').addEventListener('click',function(e){
    if(e.target===this)this.classList.remove('open');
  });
  if(reduced){endBoot();}
  else{
    var lines=[
      ['[ ok ] mounting /dev/creativity','ok'],
      ['[ ok ] loading agents: AMORE-1, AMORE-2, AMORE NET','ok'],
      ['[ ok ] compatibility engine calibrated','ok'],
      ['[ ok ] espresso levels: nominal','ok'],
      ['[ .. ] visitor detected — preparing desktop','amb'],
      ['AARYAN OS v5.0 — welcome.','']
    ];
    var log=$('#bootLog'),i=0;
    var iv=setInterval(function(){
      if(i>=lines.length){clearInterval(iv);setTimeout(endBoot,420);return;}
      var d=document.createElement('div');
      if(lines[i][1])d.className=lines[i][1];
      d.textContent=lines[i][0];
      log.appendChild(d);i++;
    },260);
    boot.addEventListener('click',endBoot);
    window.addEventListener('keydown',function once(){endBoot();window.removeEventListener('keydown',once)});
  }

  /* ============ wallpaper particles + ripples ============ */
  var canvas=$('#bg'),ctx=canvas.getContext('2d');
  var W,H,pts=[],ripples=[],mouse={x:-9999,y:-9999};
  var accRGB=[74,227,181];
  var matrixMode=false,matrixDrops=[],matrixEnd=0;
  var GLYPHS='アイウエオカキクケコサシスセソ01<>/{}=+#$%';
  function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
    var n=W<640?38:92;
    pts=[];
    for(var i=0;i<n;i++)pts.push({
      x:Math.random()*W,y:Math.random()*H,
      vx:(Math.random()-.5)*.32,vy:(Math.random()-.5)*.32,
      r:Math.random()*1.3+.7
    });
    matrixDrops=[];
    for(var c=0;c<Math.floor(W/16);c++)matrixDrops.push(Math.random()*H);
  }
  var ORBS=[
    {cx:.22,cy:.28,r:.42,hue:'acc',phase:0},
    {cx:.82,cy:.62,r:.36,hue:'amb',phase:2.1},
    {cx:.55,cy:.85,r:.30,hue:'acc',phase:4.3}
  ];
  var AMB_RGB=[240,180,76];
  function drawOrbs(t){
    ORBS.forEach(function(o){
      var drift=Math.sin(t*0.00012+o.phase)*40;
      var driftY=Math.cos(t*0.00016+o.phase)*30;
      var cx=o.cx*W+drift, cy=o.cy*H+driftY;
      var rad=Math.min(W,H)*o.r;
      var pulse=0.55+0.45*Math.sin(t*0.0003+o.phase);
      var rgb=o.hue==='acc'?accRGB:AMB_RGB;
      var g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
      g.addColorStop(0,'rgba('+rgb.join(',')+','+(0.10*pulse)+')');
      g.addColorStop(1,'rgba('+rgb.join(',')+',0)');
      ctx.fillStyle=g;
      ctx.fillRect(cx-rad,cy-rad,rad*2,rad*2);
    });
  }
  window.addEventListener('resize',resize);resize();
  window.addEventListener('pointermove',function(e){mouse.x=e.clientX;mouse.y=e.clientY});
  function frame(){
    if(matrixMode){
      ctx.fillStyle='rgba(11,18,32,.14)';ctx.fillRect(0,0,W,H);
      ctx.font='13px monospace';
      ctx.fillStyle='rgba('+accRGB.join(',')+',.8)';
      for(var c=0;c<matrixDrops.length;c++){
        ctx.fillText(GLYPHS[Math.floor(Math.random()*GLYPHS.length)],c*16,matrixDrops[c]);
        matrixDrops[c]+=14;
        if(matrixDrops[c]>H&&Math.random()>.975)matrixDrops[c]=0;
      }
      if(Date.now()>matrixEnd){matrixMode=false;ctx.clearRect(0,0,W,H);}
    }else{
      ctx.clearRect(0,0,W,H);
      drawOrbs(Date.now());
      for(var ri=ripples.length-1;ri>=0;ri--){
        var rp=ripples[ri];rp.r+=6.5;
        var a=1-rp.r/170;
        if(a<=0){ripples.splice(ri,1);continue;}
        ctx.beginPath();ctx.arc(rp.x,rp.y,rp.r,0,6.283);
        ctx.strokeStyle='rgba('+accRGB.join(',')+','+(a*.5)+')';
        ctx.lineWidth=1.5;ctx.stroke();
      }
      for(var i=0;i<pts.length;i++){
        var p=pts[i];
        p.x+=p.vx;p.y+=p.vy;
        p.vx*=.985;p.vy*=.985;
        if(Math.abs(p.vx)<.05)p.vx+=(Math.random()-.5)*.1;
        if(Math.abs(p.vy)<.05)p.vy+=(Math.random()-.5)*.1;
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;
        if(p.y<0)p.y=H;if(p.y>H)p.y=0;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
        ctx.fillStyle='rgba('+accRGB.join(',')+',.55)';ctx.fill();
        for(var j=i+1;j<pts.length;j++){
          var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
          if(d<12100){
            ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);
            ctx.strokeStyle='rgba('+accRGB.join(',')+','+(0.24*(1-d/12100))+')';
            ctx.lineWidth=1;ctx.stroke();
          }
        }
        var mdx=p.x-mouse.x,mdy=p.y-mouse.y,md=mdx*mdx+mdy*mdy;
        if(md<25600){
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(mouse.x,mouse.y);
          ctx.strokeStyle='rgba('+accRGB.join(',')+','+(0.30*(1-md/25600))+')';
          ctx.lineWidth=1;ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  if(!reduced)requestAnimationFrame(frame);

  var wallClicks=0;
  window.addEventListener('pointerdown',function(e){
    if(!reduced){
      ripples.push({x:e.clientX,y:e.clientY,r:0});
      for(var i=0;i<pts.length;i++){
        var p=pts[i],dx=p.x-e.clientX,dy=p.y-e.clientY;
        var d=Math.sqrt(dx*dx+dy*dy);
        if(d<170&&d>0.01){
          var f=(170-d)/170*3.4;
          p.vx+=dx/d*f;p.vy+=dy/d*f;
        }
      }
    }
    if(!e.target.closest('.icon,.window,#taskbar,.menu,#sigPanel,.modal-box,a,button,input,textarea')){
      wallClicks++;
      if(wallClicks>=3)award('wall');
    }
  });

  /* ============ terminal ============ */
  var out=$('#termOut'),input=$('#termInput');
  function print(html,cls){
    var d=document.createElement('div');
    d.className='ln'+(cls?' '+cls:'');
    d.innerHTML=html;
    out.appendChild(d);
    out.scrollTop=out.scrollHeight;
  }
  var CMDS={
    'help':function(){
      print('available commands:','t-dim');
      print('  ls — list apps · open &lt;app&gt; — launch one');
      print('  game — squash some bugs · nocaps — visit the product');
      print("  sudo hire aaryan — you know what to do",'t-amb');
      print('  reset — restore desktop icon layout','t-dim');
      print('  signals · matrix · overdrive · whoami · clear','t-dim');
    },
    'reset':function(){print('restoring default desktop layout…','t-ok');resetIcons();},
    'ls':function(){
      print(Object.keys(APPS).map(function(a){return APPS[a]}).join('   '),'t-ok');
      print("open one with: open &lt;name&gt; — e.g. 'open projects'",'t-dim');
    },
    'signals':function(){
      print('side quest — '+Math.round(sigCount()/SIGNALS.length*100)+'% completed ('+sigCount()+'/'+SIGNALS.length+')','t-amb');
      SIGNALS.forEach(function(s){
        print('  ['+(got[s.id]?'x':' ')+'] '+s.name+(got[s.id]?'':' — '+s.how),got[s.id]?'t-ok':'t-dim');
      });
      if(sigCount()<SIGNALS.length)print('hint: open apps. click modules. play. everything reacts.','t-dim');
    },
    'nocaps':function(){print('opening nocaps.in in a new tab…','t-ok');window.open('https://www.nocaps.in','_blank','noopener');award('visit');},
    'game':function(){print('launching Arcade','t-amb');openApp('game');},
    'play':function(){CMDS.game();},
    'clear':function(){out.innerHTML='';},
    'cls':function(){out.innerHTML='';},
    'whoami':function(){print('guest@aaryan.sys — a curious visitor. we like those.','t-ok');},
    'matrix':function(){
      if(reduced){print('motion effects are disabled by your system preferences — respect.','t-dim');return;}
      print('wake up…','t-ok');matrixMode=true;matrixEnd=Date.now()+6000;
    },
    'overdrive':function(){toggleOverdrive();},
    'exit':function(){print('nice try. there is no escape from good software.','t-err');},
    'hello':function(){print('hello! always nice when someone says hi to the terminal.','t-ok');},
    'hi':function(){CMDS.hello();}
  };
  function runCmd(raw){
    var cmd=raw.trim();
    if(!cmd)return;
    print('<span class="t-usr">guest@aaryan.sys:~$</span> '+cmd.replace(/</g,'&lt;'));
    var key=cmd.toLowerCase();
    if(key.indexOf('sudo')===0){
      if(key.indexOf('hire')>-1){
        print('permission granted ✔ escalating to human…','t-ok');
        setTimeout(function(){openApp('contact')},500);
      }else if(key.indexOf('rm -rf')>-1){
        print('deleting everything…','t-err');
        setTimeout(function(){print('just kidding. backups exist. this is a portfolio.','t-ok')},900);
      }else{
        print('guest is not in the sudoers file. this incident will be reported to AMORE NET.','t-err');
      }
    }else if(key.indexOf('open ')===0){
      var name=key.slice(5).trim().replace(/\.(txt|md|log|sys|cfg|exe|mail)$/,'').replace(/\/$/,'');
      var map={'debug':'game','track_record':'track'};
      var app=map[name]||name;
      if(APPS[app]){print('opening '+APPS[app]+'…','t-ok');openApp(app);}
      else{print('no such app: '+name.replace(/</g,'&lt;')+" — try 'ls'",'t-err');}
    }else if(CMDS[key]){
      CMDS[key]();
    }else{
      print("command not found: "+key.replace(/</g,'&lt;')+" — try 'help'",'t-err');
    }
    award('shell');
  }
  input.addEventListener('keydown',function(e){
    if(e.key==='Enter'){runCmd(input.value);input.value='';}
  });
  $$('#termChips button').forEach(function(b){
    b.addEventListener('click',function(){runCmd(b.getAttribute('data-cmd'));input.focus();});
  });

  /* ============ skills quips ============ */
  var QUIPS={
    'Java':'the day job. 2+ years in production.',
    'Python':'glue for the AI pipelines.',
    'JavaScript':'this entire OS runs on it.',
    'SQL':'speaks fluent JOIN.',
    'Grok API':'one half of AMORE\u2019s brain.',
    'Qwen':'the other half. redundancy matters.',
    'Prompt Engineering':'the art of asking machines nicely.',
    'AI Agents':'I build these for a living.',
    'LLM Integration':'wiring brains into products.',
    'Spring Boot':'enterprise backbone.',
    'Spring MVC':'old reliable.',
    'Flask':'nocaps runs on this.',
    'REST APIs':'shipped and maintained in production.',
    'Hibernate':'ORM, tamed.',
    'JDBC':'raw SQL. no training wheels.',
    'React Native':'one codebase, two app stores.',
    'HTML':'you\u2019re soaking in it.',
    'CSS':'responsible for all this glow.',
    'PostgreSQL':'nocaps\u2019 long-term memory.',
    'MySQL':'the budget tracker\u2019s vault.',
    'Firebase Realtime DB':'live sync, zero drama.',
    'Firebase':'auth + infra, handled.',
    'Supabase':'postgres with superpowers.',
    'Git':'commit early, commit often.',
    'Maven':'builds the WARs.',
    'Android Studio':'where the APKs are born.',
    'Postman':'the API interrogation room.',
    'VS Code':'home.'
  };
  $$('.tag').forEach(function(t){
    t.addEventListener('click',function(){
      t.classList.remove('zap');void t.offsetWidth;t.classList.add('zap');
      var q=QUIPS[t.textContent.trim()];
      toast(t.textContent.trim().toUpperCase()+(q?' — '+q:''));
      award('skills');
    });
    t.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();t.click();}});
  });

  /* ============ agent interviews ============ */
  var AGENT_LOGS={
    'AMORE-1':'> scanning visitor\u2026\n> verdict: curious. opens things. excellent.',
    'AMORE-2':'> mapping 53 signals\u2026\n> attachment: explorer \u00b7 humor: detected.',
    'AMORE NET':'> you \u00d7 aaryan \u2192 compatibility climbing.\n> keep interacting.'
  };
  var interviewed={};
  $$('.agent').forEach(function(card){
    function run(){
      var name=card.querySelector('h4').textContent.trim();
      var log=card.querySelector('.agent-log');
      if(!log){log=document.createElement('div');log.className='agent-log';card.appendChild(log);}
      log.textContent='';
      var txt=AGENT_LOGS[name]||'> online.';
      var i=0;
      var iv=setInterval(function(){
        log.textContent=txt.slice(0,++i);
        if(i>=txt.length){
          clearInterval(iv);
          interviewed[name]=true;
          if(Object.keys(interviewed).length>=3)award('agents');
        }
      },reduced?0:14);
    }
    card.addEventListener('click',run);
    card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();run();}});
  });

  /* ============ nocaps links ============ */
  $$('.nocaps-link').forEach(function(a){
    a.addEventListener('click',function(){award('visit')});
  });

  /* ============ ARCADE ============ */
  var arcadeViews={menu:$('#arcadeMenu'),squash:$('#gameSquash'),memory:$('#gameMemory'),type:$('#gameType')};
  function showArcade(view){
    // stop any running game before switching
    haltSquash();haltType();
    Object.keys(arcadeViews).forEach(function(k){
      if(arcadeViews[k])arcadeViews[k].hidden=(k!==view);
    });
    if(view==='memory')initMemory();
  }
  function stopGame(){ // called when the arcade window is closed/minimized
    haltSquash();haltType();
    showArcade('menu');
  }
  $$('.arcade-card').forEach(function(c){
    c.addEventListener('click',function(){showArcade(c.getAttribute('data-game'))});
  });
  $$('[data-arcade-back]').forEach(function(b){
    b.addEventListener('click',function(){showArcade('menu')});
  });

  /* ---- Game 1: Squash Bugs ---- */
  var arena=$('#arena'),arenaMsg=$('#arenaMsg');
  var gScore=0,gBest=0,gTime=20,spawnIv=null,clockIv=null,running=false;
  var BUGS=['🐛','🪲','🦟','🐞'];
  function popText(x,y,txt,cls){
    var s=document.createElement('span');
    s.className='pop '+cls;s.textContent=txt;
    s.style.left=x;s.style.top=y;
    arena.appendChild(s);
    setTimeout(function(){s.remove()},720);
  }
  function spawnBug(){
    var roll=Math.random();
    var kind=roll<.14?'bomb':(roll<.27?'gold':'bug');
    var b=document.createElement('button');
    b.className='bug';
    b.setAttribute('aria-label',kind);
    b.textContent=kind==='bomb'?'💣':(kind==='gold'?'🦋':BUGS[Math.floor(Math.random()*BUGS.length)]);
    var lx=(8+Math.random()*84)+'%',ly=(10+Math.random()*80)+'%';
    b.style.left=lx;b.style.top=ly;
    var life=kind==='gold'?1050:(kind==='bomb'?1700:1500);
    var alive=setTimeout(function(){b.remove()},life);
    b.addEventListener('pointerdown',function(ev){
      ev.stopPropagation();
      if(!running)return;
      clearTimeout(alive);
      if(kind==='bomb'){
        gScore=Math.max(0,gScore-3);
        popText(lx,ly,'-3','bad');
        arena.classList.add('hit');
        setTimeout(function(){arena.classList.remove('hit')},260);
      }else{
        var v=kind==='gold'?3:1;
        gScore+=v;
        popText(lx,ly,'+'+v,'good');
      }
      $('#gScore').textContent=gScore;
      b.classList.add('squash');
      setTimeout(function(){b.remove()},220);
    });
    arena.appendChild(b);
  }
  function startSquash(){
    gScore=0;gTime=20;running=true;
    $('#gScore').textContent='0';$('#gTime').textContent='20';
    arenaMsg.style.display='none';
    $$('.bug').forEach(function(b){b.remove()});
    spawnIv=setInterval(function(){
      spawnBug();
      if(Math.random()>.62)spawnBug();
    },520);
    clockIv=setInterval(function(){
      gTime--;$('#gTime').textContent=gTime;
      if(gTime<=0)endSquash();
    },1000);
  }
  function haltSquash(){
    clearInterval(spawnIv);clearInterval(clockIv);
    running=false;
    if(arena)$$('.bug').forEach(function(b){b.remove()});
  }
  function endSquash(){
    if(!running)return;
    haltSquash();
    if(gScore>gBest){gBest=gScore;$('#gBest').textContent=gBest;$('#bestSquash').textContent=gBest;}
    var verdict;
    if(gScore<6)verdict='the bugs won this round. it happens to the best of us.';
    else if(gScore<12)verdict='solid debugging instincts.';
    else if(gScore<20)verdict='senior-level reflexes. impressive.';
    else verdict='are you… a linter?';
    arenaMsg.innerHTML='<div class="big">'+gScore+' squashed</div><p>'+verdict+'</p><button class="btn btn-primary" id="gameAgain">run again</button>';
    arenaMsg.style.display='flex';
    $('#gameAgain').addEventListener('click',startSquash);
    award('game');
  }
  $('#gameStart').addEventListener('click',startSquash);

  /* ---- Game 2: Stack Match (memory) ---- */
  var STACK=['Java','Python','⚛️','Flask','🐘','Redis','Grok','AWS'];
  var mFirst=null,mLock=false,mMoves=0,mPairs=0,mBest=null,mInit=false;
  function initMemory(){
    mInit=true;mFirst=null;mLock=false;mMoves=0;mPairs=0;
    $('#mMoves').textContent='0';$('#mPairs').textContent='0';
    $('#memoryDone').hidden=true;
    var board=$('#memoryBoard');board.innerHTML='';
    var deck=STACK.concat(STACK);
    for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=deck[i];deck[i]=deck[j];deck[j]=t;}
    deck.forEach(function(val){
      var card=document.createElement('button');
      card.className='mcard';card.setAttribute('aria-label','card');
      card.innerHTML='<span class="mface mfront">?</span><span class="mface mback">'+val+'</span>';
      card.dataset.val=val;
      card.addEventListener('click',function(){flipCard(card)});
      board.appendChild(card);
    });
  }
  function flipCard(card){
    if(mLock||card.classList.contains('flipped')||card.classList.contains('matched'))return;
    card.classList.add('flipped');
    if(!mFirst){mFirst=card;return;}
    mMoves++;$('#mMoves').textContent=mMoves;
    if(mFirst.dataset.val===card.dataset.val){
      mFirst.classList.add('matched');card.classList.add('matched');
      mFirst=null;mPairs++;$('#mPairs').textContent=mPairs;
      if(mPairs===STACK.length)endMemory();
    }else{
      mLock=true;
      var a=mFirst,b=card;mFirst=null;
      setTimeout(function(){a.classList.remove('flipped');b.classList.remove('flipped');mLock=false;},760);
    }
  }
  function endMemory(){
    if(mBest===null||mMoves<mBest){mBest=mMoves;$('#mBest').textContent=mBest;$('#bestMemory').textContent=mBest;}
    var d=$('#memoryDone');
    d.innerHTML='<div class="big">matched! 🎉</div><p>'+mMoves+' moves — that\u2019s my whole stack, paired up.</p><button class="btn btn-primary" id="memAgain">play again</button>';
    d.hidden=false;
    $('#memAgain').addEventListener('click',initMemory);
    award('game');
  }

  /* ---- Game 3: Type Speed ---- */
  var PROMPTS=['git commit -m "fix"','npm run build','sudo reboot','SELECT * FROM users','docker compose up','flask run','print("hello")','git push origin main','mvn clean install','SELECT * FROM matches','pip install grok','npx create-app'];
  var tArena=$('#typeArena'),typeMsg=$('#typeMsg');
  var tScore=0,tBest=0,tTime=25,tClock=null,tRunning=false,tCurrent='';
  function startType(){
    tScore=0;tTime=25;tRunning=true;
    $('#tScore').textContent='0';$('#tTime').textContent='25';
    nextPrompt();
    tClock=setInterval(function(){
      tTime--;$('#tTime').textContent=tTime;
      if(tTime<=0)endType();
    },1000);
  }
  function nextPrompt(){
    tCurrent=PROMPTS[Math.floor(Math.random()*PROMPTS.length)];
    tArena.innerHTML='<div class="type-prompt" id="typePrompt"></div>'+
      '<input class="type-input" id="typeInput" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="type here">'+
      '<div class="type-hint">type it exactly, then press enter</div>';
    renderPrompt('');
    var inp=$('#typeInput');
    inp.focus();
    inp.addEventListener('input',function(){renderPrompt(inp.value)});
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'){
        if(inp.value===tCurrent){
          tScore++;$('#tScore').textContent=tScore;
          nextPrompt();
        }else{
          inp.classList.remove('shake');void inp.offsetWidth;inp.classList.add('shake');
        }
      }
    });
  }
  function renderPrompt(typed){
    var el=$('#typePrompt');if(!el)return;
    var html='';
    for(var i=0;i<tCurrent.length;i++){
      var c=tCurrent[i].replace('<','&lt;');
      if(i<typed.length){
        html+='<span class="'+(typed[i]===tCurrent[i]?'tc-ok':'tc-bad')+'">'+c+'</span>';
      }else{
        html+='<span class="tc-rest">'+c+'</span>';
      }
    }
    el.innerHTML=html;
  }
  function haltType(){
    clearInterval(tClock);tRunning=false;
  }
  function endType(){
    if(!tRunning)return;
    haltType();
    if(tScore>tBest){tBest=tScore;$('#tBest').textContent=tBest;$('#bestType').textContent=tBest;}
    var verdict;
    if(tScore<4)verdict='warming up. the keyboard is mightier with practice.';
    else if(tScore<8)verdict='nice pace — real dev fingers.';
    else if(tScore<12)verdict='fast. you\u2019ve shipped things at 2am, haven\u2019t you.';
    else verdict='inhuman. are you sure you\u2019re not an LLM?';
    tArena.innerHTML='<div class="msg"><div class="big">'+tScore+' commands</div><p>'+verdict+'</p><button class="btn btn-primary" id="typeAgain">go again</button></div>';
    $('#typeAgain').addEventListener('click',startType);
    award('game');
  }
  $('#typeStart').addEventListener('click',startType);

  /* ============ overdrive ============ */
  var KONAMI=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var kPos=0;
  window.addEventListener('keydown',function(e){
    kPos=(e.key===KONAMI[kPos])?kPos+1:(e.key===KONAMI[0]?1:0);
    if(kPos===KONAMI.length){kPos=0;toggleOverdrive();}
  });
  var markTaps=0,markTimer=null;
  $('#startBtn').addEventListener('dblclick',function(){toggleOverdrive()});
  document.querySelector('.mobile-status').addEventListener('click',function(){
    markTaps++;
    clearTimeout(markTimer);
    markTimer=setTimeout(function(){markTaps=0},2500);
    if(markTaps>=5){markTaps=0;toggleOverdrive();}
  });
  function toggleOverdrive(){
    var on=docEl.classList.toggle('overdrive');
    accRGB=on?[255,92,168]:[74,227,181];
    AMB_RGB=on?[92,200,255]:[240,180,76];
    toast(on?'OVERDRIVE ENGAGED — hold on to something (secret found 🎉)':'overdrive disengaged. back to calm.');
    if(on)confetti();
  }

  /* ============ confetti ============ */
  function confetti(){
    if(reduced)return;
    var colors=['#4AE3B5','#F0B44C','#FF5CA8','#5CC8FF','#E9EFF7'];
    for(var i=0;i<70;i++){
      var c=document.createElement('div');
      c.className='confetti-bit';
      c.style.left=Math.random()*100+'vw';
      c.style.background=colors[Math.floor(Math.random()*colors.length)];
      document.body.appendChild(c);
      var anim=c.animate([
        {transform:'translateY(0) rotate(0deg)',opacity:1},
        {transform:'translateY(105vh) rotate('+(360+Math.random()*540)+'deg)',opacity:.85}
      ],{duration:1800+Math.random()*1600,easing:'cubic-bezier(.2,.6,.4,1)',delay:Math.random()*350});
      (function(el,a){a.onfinish=function(){el.remove()}})(c,anim);
    }
  }

  /* ============ report ============ */
  var reported=false;
  function showReport(){
    if(reported)return;reported=true;
    $('#reportModal').classList.add('open');
    confetti();
    setTimeout(function(){
      $('#compatFill').style.width='97%';
      var n=0;
      var iv=setInterval(function(){
        n+=3;if(n>=97){n=97;clearInterval(iv);}
        $('#compatNum').textContent=n+'%';
      },30);
    },250);
  }
  function closeReport(){$('#reportModal').classList.remove('open');}
  $$('[data-rclose]').forEach(function(b){b.addEventListener('click',closeReport)});
  $('#reportModal').addEventListener('click',function(e){if(e.target===this)closeReport()});
  $('#reportCta').addEventListener('click',function(){closeReport();openApp('contact');});

  /* ============ contact form ============ */
  $('#contactForm').addEventListener('submit',function(e){
    e.preventDefault();
    var f=e.target;
    var subject=encodeURIComponent('Project inquiry from '+f.name.value);
    var body=encodeURIComponent(f.message.value+'\n\n— '+f.name.value+' ('+f.email.value+')');
    window.location.href='mailto:aaryanchipkar17@gmail.com?subject='+subject+'&body='+body;
  });
})();
