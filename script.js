    const STORAGE_KEY = "vylkroxant_greetings_progress_v1";

    const FORMAL = [
      { en: "Good morning.", es: "Buenos días (formal)." },
      { en: "Good afternoon.", es: "Buenas tardes (formal)." },
      { en: "Good evening.", es: "Buenas noches (al saludar, formal)." },
      { en: "Hello.", es: "Hola (neutral/formal)." },
      { en: "How do you do?", es: "¿Cómo está usted? (muy formal)." },
      { en: "Nice to meet you.", es: "Encantado/a de conocerle (formal)." },
      { en: "Pleased to meet you.", es: "Mucho gusto (formal)." },
      { en: "It's a pleasure to meet you.", es: "Es un placer conocerle (formal)." },
      { en: "How are you today?", es: "¿Cómo está hoy? (formal)." },
      { en: "Good to see you.", es: "Qué gusto verle (formal)." }
    ];

    const INFORMAL = [
      { en: "G'day!", es: "¡Hola! (muy australiano/informal)." },
      { en: "Hey!", es: "¡Hey! (informal)." },
      { en: "Hi!", es: "¡Hola! (informal)." },
      { en: "How's it going?", es: "¿Cómo va todo? (informal)." },
      { en: "How ya going?", es: "¿Cómo te va? (muy AUS, informal)." },
      { en: "What's up?", es: "¿Qué tal? (informal)." },
      { en: "How are ya?", es: "¿Cómo estás? (informal, AUS)." },
      { en: "Good on ya!", es: "¡Bien hecho! (AUS coloquial, saludo/ánimo)." },
      { en: "Long time no see!", es: "¡Cuánto tiempo! (informal)." },
      { en: "Cheers!", es: "¡Gracias!/¡Salud! (AUS/UK, informal)." }
    ];

    const GAME_TYPES = ["listenPick", "meaningPick", "missingWord", "isFormal", "orderWords"];

    const totalMeter = document.getElementById("totalMeter");
    const progressText = document.getElementById("progressText");
    const sectionStatus = document.getElementById("sectionStatus");

    const btnStart = document.getElementById("btnStart");
    const btnGoFormal = document.getElementById("btnGoFormal");
    const btnHow = document.getElementById("btnHow");
    const btnVoiceTest = document.getElementById("btnVoiceTest");

    const formalProgressText = document.getElementById("formalProgressText");
    const formalGameIndex = document.getElementById("formalGameIndex");
    const formalChoices = document.getElementById("formalChoices");
    const formalSpeak = document.getElementById("formalSpeak");
    const formalRepeatSlow = document.getElementById("formalRepeatSlow");
    const formalSkip = document.getElementById("formalSkip");
    const formalMsg = document.getElementById("formalMsg");
    const formalHint = document.getElementById("formalHint");
    const formalScoreEl = document.getElementById("formalScore");
    const formalPhraseList = document.getElementById("formalPhraseList");

    const informalLock = document.getElementById("informalLock");
    const informalStatus = document.getElementById("informalStatus");
    const informalGameIndex = document.getElementById("informalGameIndex");
    const informalChoices = document.getElementById("informalChoices");
    const informalSpeak = document.getElementById("informalSpeak");
    const informalRepeatSlow = document.getElementById("informalRepeatSlow");
    const informalSkip = document.getElementById("informalSkip");
    const informalMsg = document.getElementById("informalMsg");
    const informalHint = document.getElementById("informalHint");
    const informalScoreEl = document.getElementById("informalScore");
    const informalPhraseList = document.getElementById("informalPhraseList");

    const finale = document.getElementById("finale");
    const btnReset = document.getElementById("btnReset");
    const btnCelebrateSpeak = document.getElementById("btnCelebrateSpeak");

    const defaultState = {
      formal: { completed: 0, score: 0, gameSeed: 1 },
      informal: { completed: 0, score: 0, gameSeed: 1 },
      unlockedInformal: false,
      finishedAll: false
    };

    let state = loadState();

    let voices = [];
    let selectedVoice = null;

    function loadState(){
      try{
        const raw = localStorage.getItem(STORAGE_KEY);
        if(!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        return {
          ...structuredClone(defaultState),
          ...parsed,
          formal: { ...structuredClone(defaultState.formal), ...(parsed.formal||{}) },
          informal: { ...structuredClone(defaultState.informal), ...(parsed.informal||{}) }
        };
      }catch{
        return structuredClone(defaultState);
      }
    }

    function saveState(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

    function shuffle(arr){
      const a = arr.slice();
      for(let i=a.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [a[i],a[j]] = [a[j],a[i]];
      }
      return a;
    }

    function speak(text, {rate=1, pitch=1.05, lang="en-AU"} = {}){
      if(!("speechSynthesis" in window)) return false;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      u.rate = rate;
      u.pitch = pitch;
      u.volume = 1;

      if(selectedVoice) u.voice = selectedVoice;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    }

    function pickFemaleVoice(preferredLangPrefix="en-AU"){
      if(!voices.length) return null;

      const inLang = voices.filter(v => (v.lang || "").toLowerCase().startsWith(preferredLangPrefix.toLowerCase()));
      const pool = inLang.length ? inLang : voices.filter(v => (v.lang||"").toLowerCase().startsWith("en"));

      const femaleHints = ["female","woman","girl","samantha","victoria","karen","moira","tessa","serena","amelia","katie","ava","emma","olivia","zoe","fiona","catherine","lucy","google uk english female","google us english","microsoft zira","zira","natasha"];
      const byHint = pool.find(v => femaleHints.some(h => (v.name||"").toLowerCase().includes(h)));
      if(byHint) return byHint;

      return pool[0] || voices[0];
    }

    function initVoices(){
      if(!("speechSynthesis" in window)) return;
      voices = window.speechSynthesis.getVoices() || [];
      selectedVoice = pickFemaleVoice("en-AU");

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices() || [];
        selectedVoice = pickFemaleVoice("en-AU");
      };
    }

    function renderPhraseList(listEl, data){
      listEl.innerHTML = "";
      data.forEach((item, idx) => {
        const li = document.createElement("li");
        li.className = "phrase";
        li.innerHTML = `
          <div class="txt">
            <strong>${escapeHTML(item.en)}</strong>
            <small>${escapeHTML(item.es)}</small>
          </div>
          <div class="mini">
            <button class="miniBtn" type="button" data-say="${escapeAttr(item.en)}" aria-label="Escuchar frase ${idx+1}">
              🔊 Escuchar
            </button>
          </div>
        `;
        listEl.appendChild(li);
      });

      listEl.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-say]");
        if(!btn) return;
        const t = btn.getAttribute("data-say");
        speak(t, {rate:1, pitch:1.05, lang:"en-AU"});
      });
    }

    function escapeHTML(str){
      return String(str)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
    }
    function escapeAttr(str){ return escapeHTML(str); }

    function updateTopProgress(){
      const totalCompleted = state.formal.completed + state.informal.completed;
      const pct = (totalCompleted / 20) * 100;
      totalMeter.style.width = `${pct}%`;
      progressText.textContent = `${totalCompleted} / 20`;

      if(state.finishedAll){
        sectionStatus.textContent = "¡Todo completo!";
      }else if(state.unlockedInformal){
        sectionStatus.textContent = "Informales desbloqueados";
      }else{
        sectionStatus.textContent = "Empieza en Formales";
      }

      formalProgressText.textContent = state.formal.completed;
      formalScoreEl.textContent = state.formal.score;

      informalScoreEl.textContent = state.informal.score;

      if(state.unlockedInformal){
        informalStatus.innerHTML = `<strong>${state.informal.completed}</strong>/10 completados`;
        informalSpeak.disabled = false;
        informalRepeatSlow.disabled = false;
        informalSkip.disabled = false;

        document.getElementById("informalLockIcon").innerHTML = `
          <path d="M9 11V8a5 5 0 0 1 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M6.5 11h11A2.5 2.5 0 0 1 20 13.5v6A2.5 2.5 0 0 1 17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-6A2.5 2.5 0 0 1 6.5 11Z" stroke="currentColor" stroke-width="2"/>
        `;
      }else{
        informalStatus.innerHTML = `<strong>Bloqueado</strong> — completa Formales`;
        informalSpeak.disabled = true;
        informalRepeatSlow.disabled = true;
        informalSkip.disabled = true;
      }

      if(state.finishedAll){
        finale.classList.add("show");
      }else{
        finale.classList.remove("show");
      }
    }

    function getGameTypeAt(i){ return GAME_TYPES[i % GAME_TYPES.length]; }

    function buildGame(sectionName){
      const sectionData = sectionName === "formal" ? FORMAL : INFORMAL;
      const completed = state[sectionName].completed;
      const gameNo = clamp(completed + 1, 1, 10);
      const type = getGameTypeAt(completed);

      const seed = state[sectionName].gameSeed + completed * 17;
      const idx = (seed + completed * 3) % sectionData.length;
      const target = sectionData[idx];

      const others = sectionData.filter((_,i) => i !== idx);
      const distractors = shuffle(others).slice(0, 3);

      return { sectionName, gameNo, type, target, distractors };
    }

    function renderGame(game){
      const isFormal = game.sectionName === "formal";
      const choicesEl = isFormal ? formalChoices : informalChoices;
      const speakBtn = isFormal ? formalSpeak : informalSpeak;
      const slowBtn = isFormal ? formalRepeatSlow : informalRepeatSlow;
      const skipBtn = isFormal ? formalSkip : informalSkip;
      const msgEl = isFormal ? formalMsg : informalMsg;
      const hintEl = isFormal ? formalHint : informalHint;
      const gameIndexEl = isFormal ? formalGameIndex : informalGameIndex;

      choicesEl.innerHTML = "";
      msgEl.textContent = "Escucha y responde.";
      hintEl.textContent = "Tip: puedes escuchar las veces que quieras.";

      gameIndexEl.textContent = String(game.gameNo);

      const sayTarget = () => speak(game.target.en, {rate:1, pitch:1.05, lang:"en-AU"});
      const sayTargetSlow = () => speak(game.target.en, {rate:0.82, pitch:1.05, lang:"en-AU"});

      speakBtn.onclick = sayTarget;
      slowBtn.onclick = sayTargetSlow;

      skipBtn.onclick = () => {
        msgEl.textContent = "Cambiamos de reto. (Este no suma).";
        hintEl.textContent = "Ahora intenta con el siguiente.";
        state[game.sectionName].gameSeed += 1;
        saveState();
        renderSection(game.sectionName);
      };

      if(game.type === "listenPick"){
        const options = shuffle([game.target, ...game.distractors]).slice(0,4);
        addChoices(choicesEl, options.map(o => ({
          label: o.en,
          sub: "Elige la frase exacta",
          correct: o.en === game.target.en
        })), (ok) => onAnswer(game.sectionName, ok));
        hintEl.textContent = "Juego 1: Escucha y elige la frase.";
      }

      if(game.type === "meaningPick"){
        const opts = shuffle([game.target, ...game.distractors]).slice(0,4);
        msgEl.textContent = "Pulsa “Escuchar” y elige el significado correcto.";
        hintEl.textContent = "Juego 2: Escucha en inglés, responde en español.";
        addChoices(choicesEl, opts.map(o => ({
          label: o.es,
          sub: `Para: “${game.target.en}”`,
          correct: o.es === game.target.es
        })), (ok) => onAnswer(game.sectionName, ok));
      }

      if(game.type === "missingWord"){
        const words = game.target.en.replace(/[!.?]/g,"").split(" ");
        const pickIndex = Math.max(0, Math.min(words.length-1, Math.floor(words.length/2)));
        const missing = words[pickIndex];
        const masked = words.map((w,i)=> i===pickIndex ? "____" : w).join(" ") + ".";
        const otherWord = shuffle(game.distractors.join(" ").split(" ").filter(Boolean))[0] || "hello";
        const optionWords = shuffle([missing, otherWord]);

        msgEl.textContent = `Completa la frase: ${masked}`;
        hintEl.textContent = "Juego 3: Completa la palabra que falta (escucha para ayudarte).";

        addChoices(choicesEl, optionWords.map(w => ({
          label: w,
          sub: "Toca para completar",
          correct: w.toLowerCase() === missing.toLowerCase()
        })), (ok) => onAnswer(game.sectionName, ok));
      }

      if(game.type === "isFormal"){
        const oppositeData = isFormal ? INFORMAL : FORMAL;
        const useOpposite = Math.random() < 0.45;
        const shown = useOpposite ? oppositeData[Math.floor(Math.random()*oppositeData.length)] : game.target;

        msgEl.textContent = "¿Esta frase pertenece a esta sección?";
        hintEl.textContent = "Juego 4: Decide si es de esta sección.";

        speakBtn.onclick = () => speak(shown.en, {rate:1, pitch:1.05, lang:"en-AU"});
        slowBtn.onclick = () => speak(shown.en, {rate:0.82, pitch:1.05, lang:"en-AU"});

        const correct = !useOpposite;
        addChoices(choicesEl, [
          { label: "Sí, pertenece aquí", sub: shown.en, correct },
          { label: "No, pertenece a la otra sección", sub: shown.en, correct: !correct }
        ], (ok) => onAnswer(game.sectionName, ok));
      }

      if(game.type === "orderWords"){
        const clean = game.target.en.replace(/[!.?]/g,"");
        const words = clean.split(" ").filter(Boolean);
        const cut = Math.max(1, Math.floor(words.length/2));
        const partA = words.slice(0, cut).join(" ");
        const partB = words.slice(cut).join(" ");
        const a = partA || clean;
        const b = partB || "";

        let chosen = [];
        const options = shuffle([a, b]).filter(Boolean);
        msgEl.textContent = "Arma la frase en el orden correcto (2 toques).";
        hintEl.textContent = "Juego 5: Toca primero la parte 1 y luego la parte 2.";

        const makeBtn = (text) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "choice";
          btn.innerHTML = `<b>${escapeHTML(text)}</b><span>Toque ${chosen.length+1}</span>`;
          btn.addEventListener("click", () => {
            chosen.push(text);
            btn.disabled = true;
            btn.style.opacity = .65;
            btn.style.transform = "none";
            Array.from(choicesEl.querySelectorAll(".choice span")).forEach((s,i)=>{
              s.textContent = i === 0 ? "Parte" : "Parte";
            });

            if(chosen.length === 2 || options.length === 1){
              const built = chosen.join(" ").trim().replace(/\s+/g," ");
              const targetClean = clean.replace(/\s+/g," ").trim();
              const ok = built.toLowerCase() === targetClean.toLowerCase();
              setTimeout(() => onAnswer(game.sectionName, ok), 260);
            }else{
              msgEl.textContent = `Elegiste: “${chosen[0]}”. Ahora toca la otra parte.`;
            }
          });
          return btn;
        };

        choicesEl.innerHTML = "";
        options.forEach(text => choicesEl.appendChild(makeBtn(text)));
      }
    }

    function addChoices(container, options, onPick){
      container.innerHTML = "";
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.innerHTML = `<b>${escapeHTML(opt.label)}</b><span>${escapeHTML(opt.sub || "")}</span>`;
        btn.addEventListener("click", () => {
          Array.from(container.querySelectorAll("button.choice")).forEach(b => b.disabled = true);
          btn.classList.add(opt.correct ? "correct" : "wrong");
          onPick(!!opt.correct);
        });
        container.appendChild(btn);
      });
    }

    function onAnswer(sectionName, ok){
      const isFormal = sectionName === "formal";
      const msgEl = isFormal ? formalMsg : informalMsg;
      const hintEl = isFormal ? formalHint : informalHint;

      if(ok){
        msgEl.textContent = "¡Correcto! Muy bien.";
        hintEl.textContent = "Siguiente juego…";
        state[sectionName].completed = clamp(state[sectionName].completed + 1, 0, 10);
        state[sectionName].score += 1;

        if(sectionName === "formal" && state.formal.completed >= 10){
          state.unlockedInformal = true;
          setTimeout(() => {
            scrollToId("informalSection");
            informalMsg.textContent = "¡Desbloqueado! Ahora juega los informales.";
            informalHint.textContent = "Pulsa “Escuchar” y continúa.";
          }, 450);
        }

        if(state.formal.completed >= 10 && state.informal.completed >= 10){
          state.finishedAll = true;
          setTimeout(() => {
            updateTopProgress();
            scrollToId("finale");
          }, 500);
        }

        saveState();
        updateTopProgress();

        if(!(state.finishedAll)){
          setTimeout(() => renderSection(sectionName), 520);
        }
      }else{
        msgEl.textContent = "Casi… inténtalo de nuevo.";
        hintEl.textContent = "Vuelve a escuchar y mira con calma.";
        setTimeout(() => renderSection(sectionName, {same:true}), 520);
      }
    }

    function renderSection(sectionName, opts={same:false}){
      if(sectionName === "informal" && !state.unlockedInformal){
        informalChoices.innerHTML = "";
        return;
      }

      const completed = state[sectionName].completed;

      if(completed >= 10){
        if(sectionName === "formal"){
          formalChoices.innerHTML = "";
          formalMsg.textContent = "¡Sección formal completa! Ve a Informales.";
          formalHint.textContent = "Ahora puedes aprender saludos informales.";
        }else{
          informalChoices.innerHTML = "";
          informalMsg.textContent = "¡Sección informal completa!";
          informalHint.textContent = "Si ya completaste formales, ya casi terminas.";
        }
        updateTopProgress();
        return;
      }

      const game = buildGame(sectionName);
      renderGame(game);

      if(sectionName === "formal"){
        formalProgressText.textContent = state.formal.completed;
        formalScoreEl.textContent = state.formal.score;
      }else{
        informalStatus.innerHTML = `<strong>${state.informal.completed}</strong>/10 completados`;
        informalScoreEl.textContent = state.informal.score;
      }
    }

    function scrollToId(id){
      const el = document.getElementById(id);
      if(!el) return;
      el.scrollIntoView({behavior:"smooth", block:"start"});
    }

    btnStart.addEventListener("click", () => {
      scrollToId("formalSection");
      initVoices();
      speak("Welcome! Let's learn greetings.", {lang:"en-AU", rate:1, pitch:1.05});
    });

    btnGoFormal.addEventListener("click", () => {
      scrollToId("formalSection");
      initVoices();
    });

btnHow.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.className = "overlay-ayuda";

    const modal = document.createElement("div");
    modal.className = "modal-ayuda";

    modal.innerHTML = `
        <h3>✨ Cómo jugar:</h3>
        <ul class="lista-instrucciones">
            <li><b>1)</b> Pulsa Escuchar.</li>
            <li><b>2)</b> Elige la respuesta correcta.</li>
            <li><b>3)</b> Completa 10 juegos en Formales para desbloquear Informales.</li>
            <li><b>4)</b> Completa 10 juegos en Informales para terminar.</li>
            <li style="font-size: 0.85rem; color: var(--danger);">⚠ Si no escuchas audio, revisa el volumen o permisos.</li>
        </ul>
        <button class="btn-cerrar-ayuda" id="btnOk">¡Entendido!</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById("btnOk").onclick = () => overlay.remove();
});

    btnVoiceTest.addEventListener("click", () => {
      initVoices();
      const ok = speak("G'day! Nice to meet you.", {lang:"en-AU", rate:1, pitch:1.05});
      if(!ok){
        alert("Tu navegador no soporta voz (Web Speech API). Prueba con Chrome/Edge/Safari.");
      }else{
        setTimeout(() => {
          if(selectedVoice){
            alert(`Voz seleccionada: ${selectedVoice.name} (${selectedVoice.lang}).\nNota: la voz “de mujer” depende del dispositivo.`);
          }else{
            alert("Se está usando una voz por defecto. La voz “de mujer” depende del dispositivo.");
          }
        }, 250);
      }
    });

    btnCelebrateSpeak.addEventListener("click", () => {
      initVoices();
      speak("Fantastic! You completed both sections. Cheers!", {lang:"en-AU", rate:1, pitch:1.08});
    });

    btnReset.addEventListener("click", () => {
      if(!confirm("¿Seguro que deseas reiniciar todo el progreso?")) return;
      state = structuredClone(defaultState);
      saveState();
      updateTopProgress();
      renderAll();
      scrollToId("formalSection");
      initVoices();
      speak("Let's start again. Good morning!", {lang:"en-AU", rate:1, pitch:1.05});
    });

    function renderAll(){
      renderPhraseList(formalPhraseList, FORMAL);
      renderPhraseList(informalPhraseList, INFORMAL);
      updateTopProgress();
      renderSection("formal");
      renderSection("informal");
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if(e.isIntersecting){
          e.target.classList.add("on");
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.12});

    document.querySelectorAll(".reveal").forEach((el, i) => {
      el.style.animationDelay = `${Math.min(i*90, 360)}ms`;
      io.observe(el);
    });

    initVoices();
    renderAll();

    if(state.formal.completed >= 10) state.unlockedInformal = true;
    if(state.formal.completed >= 10 && state.informal.completed >= 10) state.finishedAll = true;
    saveState();
    updateTopProgress();

document.addEventListener('contextmenu', e => e.preventDefault());

window.addEventListener('keydown', e => {

    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
    }

    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.keyCode === 67 || e.keyCode === 86 || e.keyCode === 88)) {
        e.preventDefault();
        return false;
    }

    if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.keyCode === 85 || e.keyCode === 83)) {
        e.preventDefault();
        return false;
    }

    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
        e.preventDefault();
        return false;
    }

    if (e.ctrlKey && (e.key === 'p' || e.keyCode === 80)) {
        e.preventDefault();
        return false;
    }
}, false);

document.addEventListener('dragstart', e => e.preventDefault());

document.addEventListener('mousedown', e => {
    if (e.detail > 1) e.preventDefault(); 
}, false);

(function() {
    const block = function() {
        setInterval(function() {
            (function() {
                return false;
            }
            ['constructor']('debugger')
            ['call']());
        }, 50);
    };
    try {
        block();
    } catch (err) {}
})();

document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
}, false);

document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
}, false);

document.onmousedown = function(e) {
    if (e.target.tagName === 'IMG') {
        return false;
    }
};

window.addEventListener('keydown', (e) => {
    
    const forbiddenKeys = ['g', 'u', 's', 'p', 'c', 'i', 'j'];
    
    if (
        e.key === 'F12' || e.keyCode === 123 ||
        (e.ctrlKey && forbiddenKeys.includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && forbiddenKeys.includes(e.key.toLowerCase()))
    ) {
        e.preventDefault();
        return false;
    }
}, false);
