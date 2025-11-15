// Smart Study Planner - Frontend only (localStorage)
(function(){
  const subjKey = 'ssp_subjects_v1';
  const todoKey = 'ssp_todos_v1';
  const examKey = 'ssp_exam_v1';
  const planKey = 'ssp_last_plan_v1';

  // Elements
  const subjectName = document.getElementById('subjectName');
  const difficulty = document.getElementById('difficulty');
  const hoursNeeded = document.getElementById('hoursNeeded');
  const addSubjectBtn = document.getElementById('addSubject');
  const subjectsList = document.getElementById('subjectsList');
  const hoursPerDay = document.getElementById('hoursPerDay');
  const daysToPlan = document.getElementById('daysToPlan');
  const generatePlanBtn = document.getElementById('generatePlan');
  const planArea = document.getElementById('planArea');
  const examDate = document.getElementById('examDate');
  const setExamBtn = document.getElementById('setExam');
  const countdown = document.getElementById('countdown');
  const todoText = document.getElementById('todoText');
  const addTodoBtn = document.getElementById('addTodo');
  const todoList = document.getElementById('todoList');
  const exportPlanBtn = document.getElementById('exportPlan');
  const clearPlanBtn = document.getElementById('clearPlan');

  // Helpers
  function loadSubjects(){ return JSON.parse(localStorage.getItem(subjKey) || '[]'); }
  function saveSubjects(list){ localStorage.setItem(subjKey, JSON.stringify(list)); }
  function loadTodos(){ return JSON.parse(localStorage.getItem(todoKey) || '[]'); }
  function saveTodos(list){ localStorage.setItem(todoKey, JSON.stringify(list)); }
  function saveExam(dateStr){ localStorage.setItem(examKey, dateStr || ''); }
  function loadExam(){ return localStorage.getItem(examKey) || ''; }
  function savePlan(obj){ localStorage.setItem(planKey, JSON.stringify(obj || {})); }
  function loadPlan(){ try{ return JSON.parse(localStorage.getItem(planKey) || '{}'); }catch(e){ return {}; } }

  function renderSubjects(){
    const list = loadSubjects();
    subjectsList.innerHTML = '';
    if(list.length===0){ subjectsList.innerHTML='<li>No subjects added yet</li>'; return; }
    list.forEach((s, idx)=>{
      const li=document.createElement('li');
      const left=document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(s.name)}</strong><div class="subject-meta">Hours: ${s.hours} · Difficulty: ${['Easy','Medium','Hard'][s.d-1]}</div>`;
      const right=document.createElement('div');
      const del=document.createElement('button'); del.textContent='Delete'; del.className='button-small'; del.style.background='#ef4444';
      del.onclick = ()=>{ if(confirm('Delete subject "'+s.name+'"?')){ list.splice(idx,1); saveSubjects(list); renderSubjects(); } };
      right.appendChild(del);
      li.appendChild(left); li.appendChild(right); subjectsList.appendChild(li);
    });
  }

  function renderTodos(){
    const list = loadTodos();
    todoList.innerHTML='';
    if(list.length===0){ todoList.innerHTML='<li>No tasks</li>'; return; }
    list.forEach((t, i)=>{
      const li=document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(t.text)}</span>`;
      const right=document.createElement('div');
      const done=document.createElement('button'); done.textContent='Done'; done.className='button-small';
      done.onclick=()=>{ list.splice(i,1); saveTodos(list); renderTodos(); };
      right.appendChild(done);
      li.appendChild(right); todoList.appendChild(li);
    });
  }

  // Add subject
  addSubjectBtn.addEventListener('click', ()=>{
    const name = subjectName.value.trim(); const d = parseInt(difficulty.value); const hrs = parseFloat(hoursNeeded.value);
    if(!name || !hrs || hrs<=0){ alert('Please enter valid subject name and hours'); return; }
    const list = loadSubjects();
    // prevent duplicate names (case-insensitive)
    if(list.some(s=> s.name.toLowerCase() === name.toLowerCase())){ alert('Subject already exists'); return; }
    list.push({name, d, hours:hrs});
    saveSubjects(list); subjectName.value=''; hoursNeeded.value=''; renderSubjects();
  });

  // Add todo
  addTodoBtn.addEventListener('click', ()=>{
    const text = todoText.value.trim(); if(!text){ return; }
    const list = loadTodos(); list.push({text}); saveTodos(list); todoText.value=''; renderTodos();
  });

  // Exam countdown
  function updateCountdown(){
    const ed = loadExam(); if(!ed){ countdown.textContent='No exam set'; return; }
    const now=new Date(); const then=new Date(ed+'T00:00:00'); const diff=Math.max(0, then - now);
    const days=Math.floor(diff/86400000); const hrs=Math.floor((diff%86400000)/3600000); const mins=Math.floor((diff%3600000)/60000);
    countdown.textContent = days + ' days, ' + hrs + ' hours, ' + mins + ' minutes left until ' + ed;
  }
  setExamBtn.addEventListener('click', ()=>{ const d = examDate.value; if(!d){ alert('Choose date'); return; } saveExam(d); updateCountdown(); });

  // Export plan
  exportPlanBtn && exportPlanBtn.addEventListener('click', ()=>{
    const planObj = loadPlan();
    if(!planObj || !planObj.generated){ alert('No plan found to export. Generate a plan first.'); return; }
    const data = JSON.stringify(planObj, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'study_plan.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Clear last plan view & storage
  clearPlanBtn && clearPlanBtn.addEventListener('click', ()=>{
    if(confirm('Clear last generated plan from display and storage?')){
      planArea.innerHTML = 'No plan generated yet.'; savePlan({});
    }
  });

  // Auto-plan algorithm (simple greedy by difficulty-weighted hours)
  generatePlanBtn.addEventListener('click', ()=>{
    const list = loadSubjects(); if(list.length===0){ alert('Add subjects first'); return; }
    const hpd = parseFloat(hoursPerDay.value)||1; const days = parseInt(daysToPlan.value)||7;
    // compute weighted hours: harder subjects weight more
    const weighted = list.map(s=>({...s, weight: s.hours * (1 + (s.d-1)*0.35)}));
    const totalWeighted = weighted.reduce((a,b)=>a+b.weight,0);
    const totalAvailable = Math.round((hpd * days)*10)/10;
    let allocations = weighted.map(s=>({name:s.name, alloc: Math.round((s.weight/totalWeighted)*totalAvailable*10)/10, origHours:s.hours}));
    // clamp: no subject > origHours and redistribute surplus
    let redistributed = true;
    while(redistributed){
      redistributed = false;
      let surplus = 0;
      allocations.forEach(a=>{ if(a.alloc > a.origHours){ surplus += (a.alloc - a.origHours); a.alloc = a.origHours; redistributed = true; } });
      const canIncrease = allocations.filter(a=> a.alloc < a.origHours);
      if(surplus>0 && canIncrease.length>0){
        const addEach = surplus / canIncrease.length;
        canIncrease.forEach(a=>{ a.alloc = Math.min(a.origHours, Math.round((a.alloc + addEach)*10)/10); });
        redistributed = true;
      }
    }

    // Prepare plan per day: distribute allocations across days prioritizing harder subjects earlier
    allocations.sort((a,b)=>{
      const sa = list.find(x=>x.name===a.name); const sb = list.find(x=>x.name===b.name);
      return sb.d - sa.d;
    });
    const perDay = Array.from({length:days}, ()=>[]);
    const remainingPerSubject = allocations.map(a=>({name:a.name, hours: a.alloc}));
    for(let day=0; day<days; day++){
      let cap = hpd;
      for(let s of remainingPerSubject){
        if(cap<=0) break;
        if(s.hours<=0) continue;
        // don't place more than 2.5 hours for same subject in a day
        const take = Math.min(s.hours, Math.round(Math.min(cap, 2.5)*10)/10);
        if(take>0){
          perDay[day].push({subject:s.name, hours:take});
          s.hours = Math.round((s.hours - take)*10)/10;
          cap = Math.round((cap - take)*10)/10;
        }
      }
    }

    // If leftover hours remain (due to rounding), try to allocate small increments
    const leftover = remainingPerSubject.reduce((a,b)=>a+b.hours,0);
    // Render plan
    let html = '<div class="plan-summary">Estimated total hours available: ' + totalAvailable + '</div>';
    perDay.forEach((d, idx)=>{
      html += '<div class="day"><h3>Day ' + (idx+1) + '</h3>';
      if(d.length===0) html += '<div class="subject-meta">No study allocated</div>';
      else{
        html += '<ul>';
        d.forEach(item=> html += '<li><strong>' + escapeHtml(item.subject) + '</strong> <span class="subject-meta"> - ' + item.hours + ' hrs</span></li>');
        html += '</ul>';
      }
      html += '</div>';
    });
    planArea.innerHTML = html;

    // Save plan object for export or later
    const planObj = {generated: true, totalAvailable, days, hoursPerDay: hpd, createdAt: new Date().toISOString(), perDay, originalSubjects: list};
    savePlan(planObj);
  });

  // Init render and exam countdown interval
  renderSubjects(); renderTodos(); setInterval(updateCountdown, 1000*60); updateCountdown();

  // load saved exam date to input
  const existingExam = loadExam(); if(existingExam) examDate.value = existingExam;

  // Utility: escape to prevent simple HTML injection when rendering
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
  }

  // Optional: prefill sample subjects if none exist (comment out if not wanted)
  (function maybePrefill(){
    const subs = loadSubjects();
    if(subs.length===0){
      const sample = [
        {name:'Mathematics', d:3, hours:20},
        {name:'Data Structures', d:2, hours:15},
        {name:'Operating Systems', d:2, hours:10}
      ];
      // don't auto-save unless user wants; comment next two lines to disable auto save
      saveSubjects(sample);
      renderSubjects();
    }
  })();
})();
