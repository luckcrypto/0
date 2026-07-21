/* luck.fyi instant search — vanilla, dependency-free, GitHub-Pages-safe.
   Pairs with assets/js/search-index.js (window.SEARCH_INDEX).
   Injects its own overlay + styles; matches the site's tokens (gold/violet, --radius, fonts). */
(function(){
  if(window.__luckSearch) return; window.__luckSearch=true;

  /* ---------- styles (self-contained; reads the site's CSS vars) ---------- */
  var css=''
   +'.lks-scrim{position:fixed;inset:0;z-index:1200;display:none;background:rgba(10,8,20,.55);'
   +'-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .18s ease}'
   +'html.light .lks-scrim{background:rgba(180,190,220,.4)}'
   +'.lks-scrim.on{display:block}.lks-scrim.show{opacity:1}'
   +'.lks-box{position:fixed;left:50%;top:12vh;transform:translateX(-50%) translateY(-8px);width:min(620px,92vw);'
   +'z-index:1201;display:none;opacity:0;transition:opacity .18s ease,transform .2s cubic-bezier(.2,1,.3,1)}'
   +'.lks-box.on{display:block}.lks-box.show{opacity:1;transform:translateX(-50%) translateY(0)}'
   +'.lks-card{background:var(--ink,#131022);border:1px solid var(--line,rgba(255,255,255,.12));'
   +'border-radius:var(--radius,18px);box-shadow:0 30px 70px -28px rgba(24,34,72,.7);overflow:hidden}'
   +'html.light .lks-card{background:#fff;box-shadow:0 26px 60px -30px rgba(96,116,166,.4)}'
   +'.lks-inp{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line,rgba(255,255,255,.1))}'
   +'.lks-inp svg{width:18px;height:18px;flex:0 0 auto;opacity:.7}'
   +'.lks-inp input{flex:1;background:none;border:0;outline:none;color:var(--text,#e9e6f5);'
   +'font-family:var(--display,"Space Grotesk",sans-serif);font-size:1.05rem;font-weight:600}'
   +'.lks-inp input::placeholder{color:var(--muted,#a59fc4);font-weight:500}'
   +'.lks-kbd{font-family:var(--display,sans-serif);font-size:.7rem;font-weight:700;color:var(--muted,#a59fc4);'
   +'border:1px solid var(--line,rgba(255,255,255,.14));border-radius:7px;padding:2px 7px;flex:0 0 auto}'
   +'.lks-list{max-height:min(56vh,440px);overflow-y:auto;padding:6px}'
   +'.lks-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:11px;text-decoration:none;cursor:pointer}'
   +'.lks-item:hover,.lks-item.sel{background:rgba(255,255,255,.06)}'
   +'html.light .lks-item:hover,html.light .lks-item.sel{background:rgba(17,21,38,.05)}'
   +'.lks-txt{min-width:0;flex:1}'
   +'.lks-t{font-family:var(--display,sans-serif);font-weight:700;font-size:.92rem;color:var(--text,#e9e6f5);'
   +'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   +'.lks-d{font-size:.78rem;color:var(--muted,#a59fc4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}'
   +'.lks-pill{flex:0 0 auto;font-family:var(--display,sans-serif);font-size:.62rem;font-weight:700;letter-spacing:.06em;'
   +'text-transform:uppercase;color:var(--gold,#ffcc57);border:1px solid var(--line,rgba(255,255,255,.14));'
   +'border-radius:999px;padding:3px 9px}'
   +'.lks-empty{padding:26px 16px;text-align:center;color:var(--muted,#a59fc4);font-size:.9rem}'
   +'.lks-open{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;width:40px;height:40px;'
   +'border:1px solid var(--line-2,rgba(255,255,255,.14));border-radius:12px;background:rgba(255,255,255,.05);'
   +'cursor:pointer;color:var(--text,#e9e6f5);transition:transform .15s,background .15s}'
   +'.lks-open:hover{background:rgba(255,255,255,.09)}.lks-open:active{transform:translateY(1px)}'
   +'.lks-open svg{width:17px;height:17px}'
   +'@media(prefers-reduced-motion:reduce){.lks-scrim,.lks-box{transition:none}}';
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  /* ---------- overlay DOM ---------- */
  var SEARCH_SVG='<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>';
  var scrim=document.createElement('div'); scrim.className='lks-scrim';
  var box=document.createElement('div'); box.className='lks-box';
  box.innerHTML='<div class="lks-card"><div class="lks-inp">'+SEARCH_SVG
    +'<input type="text" placeholder="Search generators, odds, guides…" aria-label="Search luck.fyi" autocomplete="off" spellcheck="false">'
    +'<span class="lks-kbd">esc</span></div><div class="lks-list" role="listbox"></div></div>';
  function init(){
    if(!document.body){ return setTimeout(init,10); }
    if(document.querySelector('.lks-box')) return;      // guard against double-init
    document.body.appendChild(scrim); document.body.appendChild(box); wire();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();   // scripts are deferred / injected late — DOMContentLoaded may have already fired

  var input, list, items=[], sel=-1, openFlag=false;

  /* ---------- scoring: tiered + popularity weight ---------- */
  function score(it,q){
    var t=it.t.toLowerCase(), w=it.w||0;
    if(t===q) return 100+w;
    if(t.indexOf(q)===0) return 80+w;
    if(t.indexOf(q)>-1) return 60+w;
    if((it.q||'').indexOf(q)>-1) return 40+w;
    var words=q.split(/\s+/).filter(Boolean);
    if(words.length>1 && words.every(function(x){return (it.q||'').indexOf(x)>-1;})) return 30;
    return 0;
  }
  function search(q){
    q=(q||'').trim().toLowerCase();
    if(!q) return [];
    var idx=window.SEARCH_INDEX||[];
    return idx.map(function(it){return {it:it,s:score(it,q)};})
      .filter(function(r){return r.s>0;})
      .sort(function(a,b){return b.s-a.s || a.it.t.length-b.it.t.length;})
      .slice(0,8).map(function(r){return r.it;});
  }

  function render(q){
    items=search(q); sel=items.length?0:-1;
    if(!q){ list.innerHTML='<div class="lks-empty">Type to search '+((window.SEARCH_INDEX||[]).length)+' pages…</div>'; return; }
    if(!items.length){ list.innerHTML='<div class="lks-empty">No results for “'+esc(q)+'”</div>'; return; }
    list.innerHTML=items.map(function(it,i){
      return '<a class="lks-item'+(i===sel?' sel':'')+'" href="'+it.u+'" data-i="'+i+'">'
        +'<span class="lks-txt"><div class="lks-t">'+esc(it.t)+'</div>'
        +(it.d?'<div class="lks-d">'+esc(it.d)+'</div>':'')+'</span>'
        +'<span class="lks-pill">'+esc(it.k||'')+'</span></a>';
    }).join('');
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function open(prefill){
    openFlag=true; scrim.classList.add('on'); box.classList.add('on');
    requestAnimationFrame(function(){scrim.classList.add('show'); box.classList.add('show');});
    if(prefill!=null){ input.value=prefill; }
    render(input.value);
    setTimeout(function(){input.focus(); input.select();},30);
  }
  function close(){
    openFlag=false; scrim.classList.remove('show'); box.classList.remove('show');
    setTimeout(function(){scrim.classList.remove('on'); box.classList.remove('on');},180);
  }
  function move(d){
    if(!items.length) return;
    sel=(sel+d+items.length)%items.length;
    [].forEach.call(list.children,function(el,i){el.classList.toggle('sel',i===sel);});
    var c=list.children[sel]; if(c&&c.scrollIntoView) c.scrollIntoView({block:'nearest'});
  }
  function go(){ if(sel>-1&&items[sel]) location.href=items[sel].u; }

  function wire(){
    input=box.querySelector('input'); list=box.querySelector('.lks-list');
    input.addEventListener('input',function(){render(input.value);});
    list.addEventListener('mousemove',function(e){
      var a=e.target.closest('.lks-item'); if(!a) return; var i=+a.getAttribute('data-i');
      if(i!==sel){ sel=i; [].forEach.call(list.children,function(el,j){el.classList.toggle('sel',j===sel);}); }
    });
    scrim.addEventListener('click',close);

    // hook up any nav search buttons
    [].forEach.call(document.querySelectorAll('[data-search-open]'),function(btn){
      btn.addEventListener('click',function(e){e.preventDefault();open();});
    });

    // "/" opens (unless typing); Esc/arrows/enter inside
    document.addEventListener('keydown',function(e){
      var tag=(e.target.tagName||'').toLowerCase();
      var typing=tag==='input'||tag==='textarea'||tag==='select'||e.target.isContentEditable;
      // Cmd/Ctrl-K opens from anywhere (even while typing — it's an explicit shortcut)
      if(!openFlag && (e.metaKey||e.ctrlKey) && (e.key==='k'||e.key==='K')){ e.preventDefault(); open(); return; }
      if(!openFlag && e.key==='/' && !typing){ e.preventDefault(); open(); return; }
      if(!openFlag) return;
      if(e.key==='Escape'){ e.preventDefault(); close(); }
      else if(e.key==='ArrowDown'){ e.preventDefault(); move(1); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); move(-1); }
      else if(e.key==='Enter'){ e.preventDefault(); go(); }
    });

    // deep-link: /?q=term auto-opens
    var m=location.search.match(/[?&]q=([^&]+)/);
    if(m){ try{ open(decodeURIComponent(m[1].replace(/\+/g,' '))); }catch(_){ open(); } }
  }
})();
