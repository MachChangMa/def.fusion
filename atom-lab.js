(() => {
  const elements = {
    H: {name:'Hydrogen', valence:1, color:'#e7edf1'},
    C: {name:'Carbon', valence:4, color:'#c2c9e0'},
    N: {name:'Nitrogen', valence:3, color:'#98beff'},
    O: {name:'Oxygen', valence:2, color:'#ffa9a2'}
  };
  const molecules = {
    H2: ['Hydrogen','Two hydrogen atoms share one pair of electrons.'],
    N2: ['Nitrogen','The two nitrogen atoms share three pairs of electrons.'],
    O2: ['Oxygen','This model shows the two oxygen atoms joined by a double bond.'],
    H2O: ['Water','Water has two single bonds. Its actual shape is bent.'],
    H3N: ['Ammonia','Nitrogen forms three single bonds with hydrogen. Ammonia has a trigonal pyramidal shape.'],
    CH4: ['Methane','Carbon forms four single bonds with hydrogen. Methane has a tetrahedral shape.'],
    CO2: ['Carbon dioxide','Carbon forms a double bond with each oxygen. Carbon dioxide is linear.']
  };
  const lab = document.getElementById('atomLab');
  const center = document.getElementById('atomCenter');
  const neighbor = document.getElementById('atomNeighbor');
  const order = document.getElementById('atomOrder');
  const bonds = document.getElementById('atomBonds');
  const formula = document.getElementById('atomFormula');
  const result = document.getElementById('atomResult');
  const canvas = document.getElementById('atomDiagram');
  const ctx = canvas.getContext('2d');
  const positions = [[-120,0],[120,0],[0,-77],[0,77]];
  let connected = [];

  for (const [symbol, element] of Object.entries(elements)) {
    const label = element.name + ' (' + symbol + ')';
    center.add(new Option(label,symbol));
    neighbor.add(new Option(label,symbol));
  }
  center.value = 'C';

  function draw() {
    if (!ctx) return;
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const atom = (symbol, px, py) => {
      ctx.beginPath();
      ctx.arc(px,py,26,0,2*Math.PI);
      ctx.fillStyle = elements[symbol].color;
      ctx.fill();
      ctx.fillStyle = '#101832';
      ctx.font = 'bold 21px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol,px,py);
    };
    connected.forEach(({count}, index) => {
      const [dx,dy] = positions[index];
      const length = Math.hypot(dx,dy);
      ctx.strokeStyle = '#e4ebff';
      ctx.lineWidth = 2.5;
      for (let line=0; line<count; line++) {
        const offset = (line - (count-1)/2)*6;
        const ox = -dy/length*offset;
        const oy = dx/length*offset;
        ctx.beginPath();
        ctx.moveTo(x+ox,y+oy);
        ctx.lineTo(x+dx+ox,y+dy+oy);
        ctx.stroke();
      }
    });
    atom(center.value,x,y);
    connected.forEach(({symbol},index) => {
      const [dx,dy] = positions[index];
      atom(symbol,x+dx,y+dy);
    });
  }

  function render() {
    const counts = {};
    for (const symbol of [center.value,...connected.map(bond=>bond.symbol)]) {
      counts[symbol] = (counts[symbol] || 0) + 1;
    }
    const key = Object.keys(counts).sort().map(symbol=>symbol+(counts[symbol]>1?counts[symbol]:'')).join('');
    const display = key === 'H3N' ? 'NH3' : key;
    formula.replaceChildren(...display.match(/[A-Z]|\d+/g).map(part=>{
      if (!/^\d/.test(part)) return document.createTextNode(part);
      const sub = document.createElement('sub');
      sub.textContent = part;
      return sub;
    }));
    bonds.replaceChildren();
    for (const [index,bond] of connected.entries()) {
      const row = document.createElement('li');
      const button = document.createElement('button');
      const label = elements[bond.symbol].name + ' · ' + ['','single','double','triple'][bond.count] + ' bond';
      button.type = 'button';
      button.textContent = 'Remove';
      button.setAttribute('aria-label','Remove bond '+(index+1)+', '+label);
      button.addEventListener('click',() => {
        connected.splice(index,1);
        resetFeedback();
        (bonds.querySelectorAll('button')[index] || bonds.querySelector('button') || neighbor).focus();
      });
      row.append(label,button);
      bonds.append(row);
    }
    draw();
    return key;
  }

  function resetFeedback() {
    render();
    const used = connected.reduce((sum,bond)=>sum+bond.count,0);
    result.textContent = elements[center.value].name + ' uses ' + used + ' of ' +
      elements[center.value].valence + ' typical bonds in this model.';
  }

  document.getElementById('atomBuild').addEventListener('submit', event => {
    event.preventDefault();
    if (connected.length === positions.length) {
      result.textContent = 'The model allows up to four outer atoms. Remove a bond to add a different one.';
      return;
    }
    connected.push({symbol:neighbor.value,count:Number(order.value)});
    resetFeedback();
  });
  center.addEventListener('change', resetFeedback);
  document.getElementById('atomReset').addEventListener('click',() => {
    connected = [];
    resetFeedback();
  });
  document.getElementById('atomCheck').addEventListener('click',() => {
    const key = render();
    if (!connected.length) {
      result.textContent = 'Add a bonded atom to check a molecule.';
      return;
    }
    const used = connected.reduce((sum,bond)=>sum+bond.count,0);
    const mismatch = connected.find(bond=>bond.count!==elements[bond.symbol].valence);
    if (used !== elements[center.value].valence || mismatch) {
      const symbol = used !== elements[center.value].valence ? center.value : mismatch.symbol;
      const count = used !== elements[center.value].valence ? used : mismatch.count;
      result.textContent = elements[symbol].name + ' has bond order ' + count +
        ' here. Its typical total in this model is ' + elements[symbol].valence + '.';
      return;
    }
    const molecule = molecules[key];
    result.textContent = molecule ? molecule.join('. ') :
      'The typical bond counts match. This simplified model cannot determine whether this arrangement exists.';
    if (key === 'H2O') lab.dispatchEvent(new Event('water-built'));
  });
  resetFeedback();
})();
