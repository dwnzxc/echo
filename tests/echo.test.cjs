const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../echo.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function load() {
    const commands = [];
    const context = new Proxy({}, {get: (o, key) => o[key] ?? ((...args) => commands.push({op: key, args})),
        set: (o, key, value) => (o[key] = value, true)});
    const elements = {};
    const values = {scaleSlider: '15', angleSlider: '60', momSlider: '3.550', pMassSlider: '4', speedSlider: '15', mInput: '1'};
    function element(id) {
        return elements[id] ??= {value: values[id] ?? '', checked: id === 'pathToggle', width:1000, height:850,
            disabled:false, classList:{add(){},remove(){},toggle(){}}, setAttribute(){}, listeners:{},
            addEventListener(event, fn){this.listeners[event] = fn;}, getContext(){return context;}, focus(){}};
    }
    let exported = '';
    let nextFrame = 0;
    const sandbox = {console, Date, Math, parseFloat, isNaN, setTimeout(){}, clearTimeout(){},
        requestAnimationFrame(){return ++nextFrame;}, cancelAnimationFrame(){},
        Blob:class {constructor(parts){exported = parts.join('');}},
        URL:{createObjectURL(){return 'blob:export';}, revokeObjectURL(){}},
        document:{getElementById:element, querySelectorAll(){return [];}, addEventListener(){},
            createElement(type){return type === 'canvas' ? {getContext(){return context;}} : {click(){}};}}};
    sandbox.window = sandbox;
    vm.createContext(sandbox);
    const run = code => vm.runInContext(code, sandbox);
    run(source);
    return {run, elements, commands, exported:() => exported};
}
const close = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b) < tol, `${a} != ${b}`);

test('initial background includes the generated trajectory', () => {
    const {commands, run} = load();
    assert.ok(run('particlePath.length') > 1000);
    assert.ok(commands.filter(c => c.op === 'lineTo').length > 1000);
});

test('mass changes rebuild before rendering; camera changes preserve trajectory and progress', () => {
    const {run} = load();
    run("const originalRender = renderGeodesics; var renderedRadius; renderGeodesics = c => { renderedRadius = particlePath[0].r; originalRender(c); }; mInput.value='2'; applyConfig()");
    close(run('renderedRadius'), run('particlePath[0].r'));
    run('particleProgress=100; var oldPath=particlePath; scaleSlider.value=20; triggerRender()');
    assert.equal(run('oldPath === particlePath'), true);
    assert.equal(run('particleProgress'), 100);
});

test('marker uses exactly the path projection, including while paused', () => {
    const {run, commands} = load();
    const expected = run('projectPoint(particlePath[0].r, 0)');
    const marker = commands.filter(c => c.op === 'arc').at(-1);
    close(marker.args[0], expected.x);
    close(marker.args[1], expected.y);
});

test('60 and 144 Hz produce the same coordinate time; pause and restart are explicit', () => {
    const {run} = load();
    const advance = fps => run(`motionToggle.checked=true; particleProgress=0; lastFrameTime=null; for(let i=0;i<=${fps};i++) animate(i*1000/${fps}); sampleParticle().t`);
    close(advance(60), advance(144), 1e-9);
    close(run('sampleParticle().t'), 75);
    run('motionToggle.checked=false; motionToggle.listeners.change(); var paused=particleProgress; motionToggle.checked=true; motionToggle.listeners.change(); animate(100000)');
    close(run('particleProgress'),run('paused'));
    run('document.getElementById("restartButton").listeners.click()');
    assert.equal(run('particleProgress'),0);
});

test('momentum remains editable with both toggles off and updates the potential', () => {
    const {run} = load();
    run("pathToggle.checked=false; motionToggle.checked=false; currentState='potential'; triggerRender(); var before=relFunctions.potential(6,2); momSlider.value='4.2'; momSlider.listeners.input({target:momSlider})");
    assert.equal(run('momSlider.disabled'),false);
    assert.notEqual(run('relFunctions.potential(6,2)'),run('before'));
    assert.equal(run('trajectory.L'),4.2);
});

test('trajectory export includes every displayed point and is independent of zoom', () => {
    const {run, exported} = load();
    run('exportData()');
    const rows = exported().split('\n').filter(l=>/^\d+\t/.test(l));
    assert.equal(rows.length,run('particlePath.length'));
    const last = rows.at(-1).split('\t').map(Number);
    close(last[1],run('particlePath.at(-1).r'));
    close(last[5],run('particlePath.at(-1).t'));
    run('scaleSlider.value=5; triggerRender(); exportData()');
    assert.deepEqual(exported().split('\n').filter(l=>/^\d+\t/.test(l)),rows);
});

test('surface exports contain physical scalar values rather than display heights', () => {
    const {run, exported} = load();
    for (const mode of ['potential','lapse']) {
        run(`currentState='${mode}'; exportData()`);
        const rows=exported().trim().split('\n').filter(l=>l.includes('\t'));
        assert.equal(rows.length,50);
        assert.equal(rows[0].split('\t').length,50);
        const expected=run(mode==='potential' ? 'physics.potential(15,1,3.55)' : 'physics.lapse(15,1)');
        close(Number(rows[25].split('\t')[0]),expected);
        assert.equal(rows[25].split('\t')[25],'NaN');
    }
});

test('analytic circular orbit: r, coordinate angular frequency, and clock rate', () => {
    const {run} = load();
    run('var circular=physics.generate(1,Math.sqrt(64/5),{rStart:8,maxSteps:4000})');
    const pt=run('circular.points.at(-1)');
    close(pt.r,8,1e-8);
    close(pt.phi/pt.t,Math.sqrt(1/8**3),1e-10);
    close(pt.tau/pt.t,Math.sqrt(1-3/8),1e-10);
    close(run('circular.energy'),(1-2/8)/Math.sqrt(1-3/8));
});

test('near-circular precession agrees with Schwarzschild epicyclic frequency', () => {
    const {run} = load();
    run('var orbit=physics.generate(1,Math.sqrt(64/5),{rStart:8.001,maxSteps:8000})');
    const points=run('orbit.points');
    const minima=points.filter((p,i)=>i>0&&i<points.length-1&&p.r<points[i-1].r&&p.r<points[i+1].r);
    assert.ok(minima.length>=3);
    close(minima[2].phi-minima[1].phi,4*Math.PI,0.025);
});

test('energy and timelike normalization hold for bound and plunging orbits', () => {
    const {run}=load();
    for(const [M,L] of [[1,3.2],[1,3.45],[1,3.55],[1,4.2],[0.1,3.55],[2,3.55],[1000,3.55]]) {
        run(`var orbit=physics.generate(${M},${L})`);
        const error=run('Math.max(...orbit.points.map(p=>Math.abs(p.radialVelocity**2+physics.potential(p.r,orbit.M,orbit.L)-orbit.energy**2)))');
        assert.ok(error<1e-8,`M=${M} L=${L}, energy error ${error}`);
        assert.ok(run('orbit.points.every(p=>p.r>2*orbit.M && Number.isFinite(p.tau) && p.lapse>0)'));
    }
});

test('plunges approach the horizon without crossing it, then playback loops', () => {
    const {run}=load();
    run("momSlider.value='3.2'; triggerRender(); var end=particlePath.at(-1); particleProgress=particlePath.length-2; motionToggle.checked=true; animate(0); animate(10)");
    assert.equal(run('trajectory.termination'),'horizon-limit');
    assert.ok(run('end.r>2 && end.r<2.000000001 && end.lapse<0.00001'));
    assert.ok(run('particlePath.every((p,i)=>!i || (p.t>particlePath[i-1].t && p.tau>=particlePath[i-1].tau))'));
    close(run('particleProgress'),5);
    assert.notEqual(run('animId'),null);
    assert.ok(run('sampleParticle().r > 2'));
});

test('bound playback wraps across multiple loops and remains refresh-rate independent', () => {
    const {run}=load();
    const advance = fps => run(`motionToggle.checked=true; particleProgress=particlePath.length-2; lastFrameTime=null; for(let i=0;i<=${fps};i++) animate(i*1000/${fps}); particleProgress`);
    close(advance(60),advance(144),1e-7);
    close(run('particleProgress'),599,1e-7);
    run('particleProgress=10; lastFrameTime=0; animate((3*(particlePath.length-1)+20)*trajectory.step/75*1000)');
    close(run('particleProgress'),30,1e-7);
    assert.notEqual(run('animId'),null);
});

test('halving the integration step converges on a plunging geodesic', () => {
    const {run}=load();
    run('var coarse=physics.generate(1,3.2,{step:0.25,maxSteps:400}); var fine=physics.generate(1,3.2,{step:0.125,maxSteps:800}); var finer=physics.generate(1,3.2,{step:0.0625,maxSteps:1600})');
    const error1=run('Math.abs(coarse.points.at(-1).r-fine.points.at(-1).r)');
    const error2=run('Math.abs(fine.points.at(-1).r-finer.points.at(-1).r)');
    assert.ok(error2<error1/8,`${error1} -> ${error2}`);
});

test('invalid mass leaves state unchanged; valid extremes remain usable', () => {
    const {run}=load();
    for(const value of ['NaN','Infinity','-1','0','0.01','1001']) {
        run(`mInput.value='${value}'; applyConfig()`);
        assert.equal(run('massM'),1);
    }
    for(const value of ['0.1','1000']) {
        run(`mInput.value='${value}'; applyConfig()`);
        assert.equal(run('massM'),Number(value));
        assert.ok(run('Number(scaleSlider.value)>particlePath[0].r'));
    }
});
