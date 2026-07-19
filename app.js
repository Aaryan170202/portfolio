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
    {id:'game',  mid:'minigame.debug_run', name:'Finish a Squash Bugs round',how:'open Squash Bugs, survive 20 seconds'},
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
  function award(id){
    if(got[id])return;
    got[id]=true;
    $('#sigCount').textContent=sigCount();
    var li=$('#sig-'+id);
    li.classList.add('got');li.querySelector('.mk').textContent='[x]';
    var s=SIGNALS.filter(function(x){return x.id===id})[0];
    toast('signal earned: '+s.name+'  ('+sigCount()+'/'+SIGNALS.length+')');
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
    terminal:'Terminal', game:'Squash Bugs', contact:'Contact Me'
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
  var zTop=10, openedDistinct={}, cascade=0;
  function win(app){return document.querySelector('.window[data-app="'+app+'"]')}
  function focusWin(w){
    $$('.window').forEach(function(x){x.classList.remove('focus')});
    w.classList.add('focus');
    w.style.zIndex=++zTop;
    $$('.task-item').forEach(function(t){t.classList.toggle('active',t.dataset.app===w.dataset.app)});
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
      if(app==='terminal'&&!isMobile())setTimeout(function(){$('#termInput').focus()},80);
    }
    focusWin(w);
    $('#startMenu').classList.remove('open');
    $('#sigPanel').classList.remove('open');
  }
  function closeApp(app){
    var w=win(app);if(!w)return;
    w.classList.remove('open');
    removeTask(app);
    if(app==='game')stopGame(false);
  }
  function addTask(app){
    if(document.querySelector('.task-item[data-app="'+app+'"]'))return;
    var b=document.createElement('button');
    b.className='task-item';b.dataset.app=app;b.textContent=APPS[app];
    b.addEventListener('click',function(){
      var w=win(app);
      if(!w.classList.contains('open')){w.classList.add('open');}
      focusWin(w);
    });
    $('#taskItems').appendChild(b);
  }
  function removeTask(app){
    var t=document.querySelector('.task-item[data-app="'+app+'"]');
    if(t)t.remove();
  }
  $$('.icon').forEach(function(ic){
    ic.addEventListener('click',function(){openApp(ic.dataset.open)});
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
    if(navIdx<0){highlight(0);return;}
    var cur={
      cx:navIcons[navIdx].getBoundingClientRect().left+navIcons[navIdx].offsetWidth/2,
      cy:navIcons[navIdx].getBoundingClientRect().top+navIcons[navIdx].offsetHeight/2
    };
    var best=-1,bestScore=Infinity;
    navIcons.forEach(function(el,i){
      if(i===navIdx)return;
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
      print('  signals · matrix · overdrive · whoami · clear','t-dim');
    },
    'ls':function(){
      print(Object.keys(APPS).map(function(a){return APPS[a]}).join('   '),'t-ok');
      print("open one with: open &lt;name&gt; — e.g. 'open projects'",'t-dim');
    },
    'signals':function(){
      print('behavioral signals — '+sigCount()+'/'+SIGNALS.length,'t-amb');
      SIGNALS.forEach(function(s){
        print('  ['+(got[s.id]?'x':' ')+'] '+s.name+(got[s.id]?'':' — '+s.how),got[s.id]?'t-ok':'t-dim');
      });
      if(sigCount()<SIGNALS.length)print('hint: open apps. click modules. play. everything reacts.','t-dim');
    },
    'nocaps':function(){print('opening nocaps.in in a new tab…','t-ok');window.open('https://www.nocaps.in','_blank','noopener');award('visit');},
    'game':function(){print('launching Squash Bugs','t-amb');openApp('game');},
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

  /* ============ game ============ */
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
  function startGame(){
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
      if(gTime<=0)stopGame(true);
    },1000);
  }
  function stopGame(finished){
    clearInterval(spawnIv);clearInterval(clockIv);
    if(!running)return;
    running=false;
    $$('.bug').forEach(function(b){b.remove()});
    if(finished){
      if(gScore>gBest){gBest=gScore;$('#gBest').textContent=gBest;}
      var verdict;
      if(gScore<6)verdict='the bugs won this round. it happens to the best of us.';
      else if(gScore<12)verdict='solid debugging instincts.';
      else if(gScore<20)verdict='senior-level reflexes. impressive.';
      else verdict='are you… a linter?';
      arenaMsg.innerHTML='<div class="big">'+gScore+' squashed</div><p>'+verdict+'</p><button class="btn btn-primary" id="gameAgain">run again</button>';
      arenaMsg.style.display='flex';
      $('#gameAgain').addEventListener('click',startGame);
      award('game');
    }else{
      arenaMsg.innerHTML='<div class="big">ready?</div><p>🐛 = +1 · 🦋 = +3 · 💣 = do NOT tap. production is in 20 seconds.</p><button class="btn btn-primary" id="gameStart2">deploy →</button>';
      arenaMsg.style.display='flex';
      $('#gameStart2').addEventListener('click',startGame);
    }
  }
  $('#gameStart').addEventListener('click',startGame);

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