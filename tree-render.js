document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.getElementById('tree-wrapper');
  const container = document.getElementById('tree-container');
  let svg = document.getElementById('connector-svg');
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "connector-svg";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "10";
    container.appendChild(svg);
  }

  let zoom = 1;
  const minZoom = 0.3, maxZoom = 2.5;
  let lastTouchDist = null;

  function setZoom(z) {
    zoom = Math.max(minZoom, Math.min(maxZoom, z));
    container.style.transform = `scale(${zoom})`;
    container.style.transformOrigin = '0 0';
  if (zoom > 1) {
    popup.style.transform = 'scale(' + (1/zoom) + ')';
  } else {
    popup.style.transform = 'scale(1)';
  }
  popup.style.transformOrigin = 'top left';
  svg.innerHTML = '';
  drawLines();
}

  wrapper.addEventListener('wheel', e => {
  if (e.ctrlKey || e.metaKey || e.deltaY % 1 !== 0) {
    e.preventDefault();

    let dz = -e.deltaY / 1000;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + dz));

    const rect = wrapper.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left + wrapper.scrollLeft) / zoom;
    const offsetY = (e.clientY - rect.top + wrapper.scrollTop) / zoom;

    setZoom(newZoom);

    wrapper.scrollLeft = offsetX * newZoom - (e.clientX - rect.left);
    wrapper.scrollTop = offsetY * newZoom - (e.clientY - rect.top);
  }
}, { passive: false });


  wrapper.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastTouchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: false });

  wrapper.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && lastTouchDist !== null) {
      e.preventDefault();
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      let dz = (newDist - lastTouchDist) / 400;
const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom + dz));

const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

const rect = wrapper.getBoundingClientRect();
const offsetX = (midX - rect.left + wrapper.scrollLeft) / zoom;
const offsetY = (midY - rect.top + wrapper.scrollTop) / zoom;

setZoom(newZoom);

wrapper.scrollLeft = offsetX * newZoom - (midX - rect.left);
wrapper.scrollTop = offsetY * newZoom - (midY - rect.top);

lastTouchDist = newDist;

    }
  }, { passive: false });

  wrapper.addEventListener('touchend', e => {
    if (e.touches.length < 2) lastTouchDist = null;
  });

  document.getElementById('reset-view-btn').onclick = () => setZoom(1);
  
const popup = document.getElementById('info-popup');

  const toggle = document.getElementById('navbar-toggle');
  const menu = document.getElementById('navbar-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      menu.classList.toggle('active');
    });
  }

container.addEventListener('scroll', () => {
  svg.innerHTML = '';
  drawLines();
});

let isPanning = false;
let startX, startY, scrollLeft, scrollTop;

wrapper.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  isPanning = true;
  wrapper.classList.add('panning');
  startX = e.pageX;
  startY = e.pageY;
  scrollLeft = wrapper.scrollLeft;
  scrollTop = wrapper.scrollTop;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  const dx = e.pageX - startX;
  const dy = e.pageY - startY;
  wrapper.scrollLeft = scrollLeft - dx;
  wrapper.scrollTop = scrollTop - dy;
});

document.addEventListener('mouseup', () => {
  isPanning = false;
  wrapper.classList.remove('panning');
});

wrapper.addEventListener('mouseleave', () => {
  isPanning = false;
  wrapper.classList.remove('panning');
});


let family = JSON.parse(JSON.stringify(familyData));

let personMap = {}, generations = {}, coupleMap = {};

function rebuildData() {
  personMap = Object.fromEntries(family.map(p=>[p.FamID,p]));
  generations = {}; family.forEach(p=>{
    generations[p["Gen ID"]] = generations[p["Gen ID"]]||[];
    generations[p["Gen ID"]].push(p);
  });
  coupleMap = {};
  family.forEach(p=>{
    const cid = p["Couple ID"];
    if(cid && cid!='-') (coupleMap[cid]||(coupleMap[cid]=[])).push(p);
  });
}

function renderTree() {
  container.innerHTML = '';
  if (!container.contains(svg)) {
    container.appendChild(svg);
  }
  svg.innerHTML = '';
  rebuildData();

  Object.keys(generations).sort((a, b) => a - b).forEach(gen => {
    const genDiv = document.createElement('div');
    genDiv.className = 'generation';
    generations[gen].forEach(p => {
      const cid = p["Couple ID"];
      if (cid && cid != '-' && !genDiv.querySelector(`[data-couple="${cid}"]`)) {
        const couple = coupleMap[cid] || [p];
        const wrapperC = document.createElement('div');
        wrapperC.className = 'couple';
        wrapperC.dataset.couple = cid;
        couple.forEach(sp => wrapperC.appendChild(createPersonNode(sp)));
        genDiv.appendChild(wrapperC);
      } else if (!cid || cid == '-') {
        const singleWrap = document.createElement('div');
        singleWrap.className = 'couple';
        singleWrap.appendChild(createPersonNode(p));
        genDiv.appendChild(singleWrap);
      }
    });
    container.appendChild(genDiv);
  });

  setTimeout(() => {
    drawLines();
    wrapper.scrollLeft = (container.scrollWidth - wrapper.clientWidth) / 2;
    wrapper.scrollTop = 0;
  }, 0);
}

function createPersonNode(p) {
  const div = document.createElement('div');
  div.className = 'person';
  div.id = `person-${p.FamID}`;
  if (p.Gender && p.Gender.toLowerCase().startsWith('f')) {
    div.style.background = '#dbaFC1';
  } else if (p.Gender && p.Gender.toLowerCase().startsWith('m')) {
    div.style.background = '#6ca6c1';
    div.style.color = '#fff';
  } else {
    div.style.background = '#eee';
  }
  const photoPath = `img/photos/${p.FamID}.jpg`;
  div.innerHTML = `
    <img src="${photoPath}" alt="Photo of ${p.Name}" onerror="this.onerror=null;this.src='img/photos/0.jpg'"/>
    <strong>${p["Preferred name"]} ${p.Surname}</strong><br>
    <small>${p["Date of birth"]}</small>`;
  div.addEventListener('click', e => popupPersonCard(p, e));
  return div;
}




function drawLines() {
  svg.setAttribute('width', container.scrollWidth);
  svg.setAttribute('height', container.scrollHeight);
  svg.innerHTML = '';

  const coupleSymbolCenters = {};

  Object.keys(coupleMap).forEach(cid => {
    const couple = coupleMap[cid];
    if (couple.length === 2) {
      const nodeA = document.getElementById(`person-${couple[0].FamID}`);
      const nodeB = document.getElementById(`person-${couple[1].FamID}`);
      if (nodeA && nodeB) {
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();

        let leftNode = rectA.left < rectB.left ? nodeA : nodeB;
        let rightNode = rectA.left < rectB.left ? nodeB : nodeA;
        let leftRect = leftNode.getBoundingClientRect();
        let rightRect = rightNode.getBoundingClientRect();

        const x1 = (leftRect.right - contRect.left + container.scrollLeft) / zoom;
        const y1 = (leftRect.top + leftRect.height / 2 - contRect.top + container.scrollTop) / zoom;
        const x2 = (rightRect.left - contRect.left + container.scrollLeft) / zoom;
        const y2 = (rightRect.top + rightRect.height / 2 - contRect.top + container.scrollTop) / zoom;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        coupleSymbolCenters[cid] = { x: midX, y: midY };

        const status = (couple[0]["Marital status"] || couple[1]["Marital status"] || '').toLowerCase();

        if (status === "married") {
          const eq = document.createElementNS("http://www.w3.org/2000/svg", "text");
          eq.setAttribute("x", midX);
          eq.setAttribute("y", midY + 6);
          eq.setAttribute("text-anchor", "middle");
          eq.setAttribute("font-size", "18px");
          eq.setAttribute("font-family", "monospace");
          eq.setAttribute("fill", "black");
          eq.textContent = "=";
          svg.appendChild(eq);
        } else if (status === "divorced") {
          const neq = document.createElementNS("http://www.w3.org/2000/svg", "text");
          neq.setAttribute("x", midX);
          neq.setAttribute("y", midY + 6);
          neq.setAttribute("text-anchor", "middle");
          neq.setAttribute("font-size", "18px");
          neq.setAttribute("font-family", "monospace");
          neq.setAttribute("fill", "black");
          neq.textContent = "≠";
          svg.appendChild(neq);
        } else if (status === "engaged") {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", x1);
          line.setAttribute("y1", y1);
          line.setAttribute("x2", x2);
          line.setAttribute("y2", y2);
          line.setAttribute("stroke", "black");
          line.setAttribute("stroke-width", "2");
          svg.appendChild(line);
        } else {
          const numDots = 4;
          const spread = 1.0;
          for (let i = 1; i <= numDots; i++) {
            const t = (i / (numDots + 1) - 0.5) * spread + 0.5;
            const dotX = x1 + (x2 - x1) * t;
            const dotY = y1 + (y2 - y1) * t;
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", dotX);
            dot.setAttribute("cy", dotY);
            dot.setAttribute("r", 0.9);
            dot.setAttribute("fill", "black");
            svg.appendChild(dot);
          }
        }
      }
    }
  });


  Object.keys(coupleMap).forEach(cid => {
    const children = family.filter(child => child["Child to"] == cid);
    if (children.length > 0) {
      const contRect = container.getBoundingClientRect();

      const childCenters = children.map(child => {
        const childNode = document.getElementById(`person-${child.FamID}`);
        if (!childNode) return null;
        const cr = childNode.getBoundingClientRect();
        return {
          x: (cr.left + cr.width / 2 - contRect.left + container.scrollLeft) / zoom,
          y: (cr.top - contRect.top + container.scrollTop) / zoom,
          node: childNode
        };
      }).filter(Boolean);

      if (childCenters.length === 0) return;

      const minX = Math.min(...childCenters.map(c => c.x));
      const maxX = Math.max(...childCenters.map(c => c.x));
      const yMid = childCenters[0].y - 20;

      const bracketCenterX = (minX + maxX) / 2;

      const couple = coupleMap[cid];

      if (couple && couple.length === 2 && coupleSymbolCenters[cid]) {
        const symbolX = coupleSymbolCenters[cid].x;
        const symbolY = coupleSymbolCenters[cid].y;

        const nodeA = document.getElementById(`person-${couple[0].FamID}`);
        const nodeB = document.getElementById(`person-${couple[1].FamID}`);
        let bottomY = symbolY;
        if (nodeA && nodeB) {
          const rectA = nodeA.getBoundingClientRect();
          const rectB = nodeB.getBoundingClientRect();
          bottomY = Math.max(
            (rectA.bottom - contRect.top + container.scrollTop) / zoom,
            (rectB.bottom - contRect.top + container.scrollTop) / zoom
          );
        }
        const verticalStartY = symbolY + 8;
        const verticalEndY = bottomY + 10;

        const vertLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        vertLine.setAttribute("x1", symbolX);
        vertLine.setAttribute("y1", verticalStartY);
        vertLine.setAttribute("x2", symbolX);
        vertLine.setAttribute("y2", verticalEndY);
        vertLine.setAttribute("stroke", "black");
        vertLine.setAttribute("stroke-width", "2");
        svg.appendChild(vertLine);

        const diagLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagLine.setAttribute("x1", symbolX);
        diagLine.setAttribute("y1", verticalEndY);
        diagLine.setAttribute("x2", bracketCenterX);
        diagLine.setAttribute("y2", yMid);
        diagLine.setAttribute("stroke", "black");
        diagLine.setAttribute("stroke-width", "2");
        svg.appendChild(diagLine);
      } else {
        const parentNode = container.querySelector(`[data-couple="${cid}"] .person`);
        if (!parentNode) return;
        const pr = parentNode.getBoundingClientRect();
        const parentX = (pr.left + pr.width / 2 - contRect.left + container.scrollLeft) / zoom;
        const parentY = (pr.bottom - contRect.top + container.scrollTop) / zoom;

        const diagLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        diagLine.setAttribute("x1", parentX);
        diagLine.setAttribute("y1", parentY);
        diagLine.setAttribute("x2", bracketCenterX);
        diagLine.setAttribute("y2", yMid);
        diagLine.setAttribute("stroke", "black");
        diagLine.setAttribute("stroke-width", "2");
        svg.appendChild(diagLine);
      }

      const hLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      hLine.setAttribute("x1", minX);
      hLine.setAttribute("y1", yMid);
      hLine.setAttribute("x2", maxX);
      hLine.setAttribute("y2", yMid);
      hLine.setAttribute("stroke", "black");
      hLine.setAttribute("stroke-width", "2");
      svg.appendChild(hLine);

      childCenters.forEach(c => {
        const v = document.createElementNS("http://www.w3.org/2000/svg", "line");
        v.setAttribute("x1", c.x);
        v.setAttribute("y1", yMid);
        v.setAttribute("x2", c.x);
        v.setAttribute("y2", c.y);
        v.setAttribute("stroke", "black");
        v.setAttribute("stroke-width", "2");
        svg.appendChild(v);
      });
    }
  });
}

let popupTarget = null;

function popupPersonCard(p, e) {
  const photoPath = `img/photos/${p.FamID}.jpg`;

const socialButtons = `
  

<div style="margin-top: 2px; display: flex; gap: 10px; align-items: center;">
${p.LinkedIn ? `
      <a href="${p.LinkedIn}" target="_blank" title="LinkedIn">
        <img class="social-image" src="img/social-icons/linkedin.png" alt="LinkedIn">
      </a>` : ''}    

${p.Facebook ? `
      <a href="${p.Facebook}" target="_blank" title="Facebook">
        <img class="social-image" src="img/social-icons/facebook.png" alt="Facebook">
      </a>` : ''}

    ${p.WhatsApp ? `
      <a href="${p.WhatsApp}" target="_blank" title="WhatsApp">
        <img class="social-image" src="img/social-icons/whatsapp.png" alt="WhatsApp">
      </a>` : ''}

    ${p.YouTube ? `
      <a href="${p.YouTube}" target="_blank" title="YouTube">
        <img class="social-image" src="img/social-icons/youtube.png" alt="YouTube">
      </a>` : ''}
  </div>
`;


  popup.innerHTML = `
  <div><strong>${p.Name} ${p["Middle name"] || ''} ${p.Surname}</strong><br>
  ${p["Date of birth"] ? `Born: ${p["Date of birth"]}<br>` : ''}
  ${p["Place of birth"] ? `Birth place: ${p["Place of birth"]}<br>` : ''}
  Gender: ${p.Gender}<br>
  Status: ${p["Alive / deceased"]}<br>
  <img src="${photoPath}" onerror="this.style.display='none'"/>
  <hr>
  <button class="person-popup" onclick="openEdit(${p.FamID})">Edit</button>
  <button class="person-popup" onclick="removePerson(${p.FamID})">Delete</button>
  <button class="person-popup" onclick="openPartnerUI(${p.FamID})">Set Partner</button>
  ${socialButtons}
  </div>`;

popup.classList.remove('hidden');
popup.style.position = 'fixed';

popupTarget = e.currentTarget;
positionPopup();

}


function positionPopup() {
  if (!popupTarget) return;
  const rect = popupTarget.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const padding = 8;

  let left = rect.right + 10;
  let top = rect.top;

  if (left + popupRect.width > window.innerWidth - padding) {
    left = rect.left - popupRect.width - 10;
  }
  if (left < padding) left = padding;

  if (top + popupRect.height > window.innerHeight - padding) {
    top = window.innerHeight - popupRect.height - padding;
  }
  if (top < padding) top = padding;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

document.getElementById('tree-container').addEventListener('scroll', positionPopup);
document.getElementById('tree-wrapper').addEventListener('scroll', positionPopup);
window.addEventListener('resize', positionPopup);

document.addEventListener('click',e=>{
  if(!e.target.closest('.person') && !e.target.closest('#info-popup')){
    popup.classList.add('hidden');
    popupTarget = null;
  }
});


function openEdit(id) {
  const p = personMap[id];
  popup.innerHTML = `
    <label>Name: <input id="e-name" value="${p.Name}"></label><br>
    <label>Middle: <input id="e-middle" value="${p["Middle name"]}"></label><br>
    <label>Surname: <input id="e-sur" value="${p.Surname}"></label><br>
    <label>Birthdate: <input id="e-dob" value="${p["Date of birth"]}"></label><br>
    <label>Photo URL: <input id="e-photo" value="${p.photo||''}"></label><br>
    <button onclick="applyEdit(${id})">Save</button>`;
}

function applyEdit(id) {
  const p = personMap[id];
  p.Name=document.getElementById('e-name').value;
  p["Middle name"]=document.getElementById('e-middle').value;
  p.Surname=document.getElementById('e-sur').value;
  p["Date of birth"]=document.getElementById('e-dob').value;
  p.photo=document.getElementById('e-photo').value;
  popup.classList.add('hidden');
  renderTree();
}

function removePerson(id) {
  if(confirm('Delete person and children?')){
    family = family.filter(p=>p.FamID!==id && p["Child to"]!==id);
    popup.classList.add('hidden');
    renderTree();
  }
}

function openPartnerUI(id) {
  popup.innerHTML = `
    <p>Select partner for <strong>${personMap[id].Name}</strong>:</p>
    ${family.filter(p=>p.FamID!==id).map(p=>`
      <div><button onclick="setPartner(${id},${p.FamID})">${p.Name} ${p.Surname}</button></div>
    `).join('')}<button onclick="clearPartner(${id})">Unpair</button>`;
}

function setPartner(a,b) {
  const cid = Math.max(...family.map(p=>+p["Couple ID"]||0)) + 1;
  personMap[a]["Couple ID"]=cid; personMap[a]["Paired with"]=b;
  personMap[b]["Couple ID"]=cid; personMap[b]["Paired with"]=a;
  popup.classList.add('hidden'); renderTree();
}

function clearPartner(a) {
  const c = personMap[a]["Couple ID"];
  family.forEach(p=>{
    if(p["Couple ID"]==c){
      p["Couple ID"]='-'; p["Paired with"]='-';
    }
  });
  popup.classList.add('hidden'); renderTree();
}

document.getElementById('add-person-btn').onclick = ()=>{
  popup.innerHTML = `
    <label>Name: <input id="n-name"></label><br>
    <label>Middle: <input id="n-middle"></label><br>
    <label>Surname: <input id="n-sur"></label><br>
    <label>Birthdate: <input id="n-dob"></label><br>
    <label>GenID: <input id="n-gen"></label><br>
    <label>Child to (CoupleID): <input id="n-cto"></label><br>
    <label>Photo URL: <input id="n-photo"></label><br>
    <button onclick="applyAdd()">Add Person</button>`;
  popup.style.left='20px'; popup.style.top='60px'; popup.classList.remove('hidden');
};

function applyAdd() {
  const id = Math.max(...family.map(p=>p.FamID))+1;
  family.push({
    FamID:id,
    "Couple ID":'-',
    "Gen ID":+document.getElementById('n-gen').value,
    Name:document.getElementById('n-name').value,
    "Middle name":document.getElementById('n-middle').value,
    Surname:document.getElementById('n-sur').value,
    "Date of birth":document.getElementById('n-dob').value,
    Gender:'',
    "Child to":document.getElementById('n-cto').value||'-',
    "Paired with":'-',
    "Marital status":'',
    "Alive / deceased":'Alive',
    photo:document.getElementById('n-photo').value
  });
  popup.classList.add('hidden');
  renderTree();
}

document.getElementById('export-json-btn').onclick = ()=>{
  const blob=new Blob([JSON.stringify(family,null,2)],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='family-tree.json'; a.click();
};

document.getElementById('export-png-btn').onclick = ()=>{
  html2canvas(wrapper).then(canvas=>{
    const link=document.createElement('a');
    link.href=canvas.toDataURL('image/png');
    link.download='family-tree.png'; link.click();
  });
};

document.getElementById('import-json-input').onchange = e=>{
  const fr=new FileReader();
  fr.onload = ()=>{
    try { family=JSON.parse(fr.result); renderTree(); }
    catch{ alert('Invalid JSON'); }
  };
  fr.readAsText(e.target.files[0]);
};



renderTree();
window.onresize = ()=>{ svg.innerHTML=''; drawLines(); };
});
