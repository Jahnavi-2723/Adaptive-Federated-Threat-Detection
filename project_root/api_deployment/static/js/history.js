
async function loadHistory(filterLabel){
  try{
    currentFilter = filterLabel || '';
    const limit = parseInt(document.getElementById('limit').value || '200', 10) || 200;
    let q = `?limit=${limit}`;
    if(filterLabel){
      // normalize to expected labels
      const map = {
        'malicious':'MALICIOUS',
        'suspicious':'SUSPICIOUS',
        'safe':'SAFE'
      };
      const lab = map[filterLabel.toLowerCase()] || filterLabel;
      q += `&label=${encodeURIComponent(lab)}`;
    }

    const res = await fetch('/api/history' + q);
    const j = await res.json();
    if(j.error){
      alert('Error fetching history: '+j.error);
      return;
    }
    const rows = j.history || [];
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    for(const r of rows){
      const tr = document.createElement('tr');
      const ts = document.createElement('td'); ts.textContent = r.time || '';
      const dom = document.createElement('td'); dom.innerHTML = `<a href="/filter?domain=${encodeURIComponent(r.domain)}" target="_blank">${r.domain}</a>`;
      const sc = document.createElement('td'); sc.textContent = (r.score!==undefined? r.score.toFixed? r.score.toFixed(2): r.score : '');
      const cl = document.createElement('td');
      let cls = (r.label||'').toUpperCase();
      let span = document.createElement('span');
      // apply explicit styles to ensure correct colors across templates
      span.className = 'badge';
      span.textContent = cls;
      if(cls === 'SAFE'){
        span.style.backgroundColor = '#16a34a'; // green
        span.style.color = '#000';
      } else if(cls === 'SUSPICIOUS'){
        span.style.backgroundColor = '#f59e0b'; // amber / yellow
        span.style.color = '#000';
      } else {
        span.style.backgroundColor = '#ef4444'; // red
        span.style.color = '#000';
      }
      cl.appendChild(span);
      const inspectTd = document.createElement('td');
      const btn = document.createElement('button'); btn.className = 'inspect'; btn.textContent = 'Inspect';
      btn.onclick = ()=>{ window.location = '/explain?domain='+encodeURIComponent(r.domain); };
      inspectTd.appendChild(btn);

      tr.appendChild(ts); tr.appendChild(dom); tr.appendChild(sc); tr.appendChild(cl); tr.appendChild(inspectTd);
      tbody.appendChild(tr);
    }
  }catch(e){
    console.error(e); alert('Failed to load history: '+e.message);
  }
}
