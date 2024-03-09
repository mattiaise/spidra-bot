const fudgeFactor = 2;  // because of bug in Chrome related to svg text alignment font sizes can not be < 1
const runningElem = document.querySelector('#running');
const gamepadsElem = document.querySelector('#gamepads');
const gamepadsByIndex = {};
const controllerTemplate = `
    <div>
      <div class="head"><div class="index"></div><div class="id"></div></div>
      <div class="info"><div class="label">connected:</div><span class="connected"></span></div>
      <div class="info"><div class="label">mapping:</div><span class="mapping"></span></div>
      <div class="inputs">
        <div class="axes"></div>
        <div class="buttons"></div>
      </div>
    </div>
    `;
const axisTemplate = `
    <svg viewBox="-2.2 -2.2 4.4 4.4" width="128" height="128">
        <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.04" />
        <path d="M0,-2L0,2M-2,0L2,0" stroke="#888" stroke-width="0.04" />
        <circle cx="0" cy="0" r="0.22" fill="red" class="axis" />
        <text text-anchor="middle" fill="#CCC" x="0" y="2">0</text>
    </svg>
    `
const buttonTemplate = `
    <svg viewBox="-2.2 -2.2 4.4 4.4" width="64" height="64">
      <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.1" />
      <circle cx="0" cy="0" r="0" fill="none" fill="red" class="button" />
      <text class="value" dominant-baseline="middle" text-anchor="middle" fill="#CCC" x="0" y="0">0.00</text>
      <text class="index" alignment-baseline="hanging" dominant-baseline="hanging" text-anchor="start" fill="#CCC" x="-2" y="-2">0</text>
    </svg>
    `;

function handleConnect(e) {
    console.log('connect');
    addGamepadIfNew(e.gamepad);
}

function addGamepadIfNew(gamepad) {
    const info = gamepadsByIndex[gamepad.index];
    if (!info) {
        addGamepad(gamepad);
    } else {
        // This broke sometime in the past. It used to be
        // the same gamepad object was returned forever.
        // Then Chrome only changed to a new gamepad object
        // is returned every frame.
        info.gamepad = gamepad;
    }
}

function addGamepad(gamepad) {
    console.log('add:', gamepad.index);
    const elem = document.createElement('div');
    elem.innerHTML = controllerTemplate;

    const axesElem = elem.querySelector('.axes');
    const buttonsElem = elem.querySelector('.buttons');

    const axes = [];
    for (let ndx = 0; ndx < gamepad.axes.length; ndx += 2) {
        const div = document.createElement('div');
        div.innerHTML = axisTemplate;
        axesElem.appendChild(div);
        axes.push({
            axis: div.querySelector('.axis'),
            value: div.querySelector('text'),
        });
    }

    const buttons = [];
    for (let ndx = 0; ndx < gamepad.buttons.length; ++ndx) {
        const div = document.createElement('div');
        div.innerHTML = buttonTemplate;
        buttonsElem.appendChild(div);
        div.querySelector('.index').textContent = ndx;
        buttons.push({
            circle: div.querySelector('.button'),
            value: div.querySelector('.value'),
        });
    }

    gamepadsByIndex[gamepad.index] = {
        gamepad,
        elem,
        axes,
        buttons,
        index: elem.querySelector('.index'),
        id: elem.querySelector('.id'),
        mapping: elem.querySelector('.mapping'),
        connected: elem.querySelector('.connected'),
    };
    gamepadsElem.appendChild(elem);
}

function removeGamepad(gamepad) {
    const info = gamepadsByIndex[gamepad.index];
    if (info) {
        delete gamepadsByIndex[gamepad.index];
        info.elem.parentElement.removeChild(info.elem);
    }
}

function handleDisconnect(e) {
    console.log('disconnect');
    removeGamepad(e.gamepad);
}

/*
const t = String.fromCharCode(0x26AA);
const f = String.fromCharCode(0x26AB);
function onOff(v) {
    return v ? t : f;
}
*/

const keys = ['index', 'id', 'connected', 'mapping', /*'timestamp'*/];
function processController(info) {
    const { elem, gamepad, axes, buttons } = info;
    const lines = [`gamepad  : ${gamepad.index}`];
    console.log(axes);
    for (const key of keys) {
        info[key].textContent = gamepad[key];
    }
    axes.forEach(({ axis, value }, ndx) => {
        const off = ndx * 2;
        axis.setAttributeNS(null, 'cx', gamepad.axes[off] * fudgeFactor);
        axis.setAttributeNS(null, 'cy', gamepad.axes[off + 1] * fudgeFactor);
        value.textContent = `${gamepad.axes[off].toFixed(2).padStart(5)},${gamepad.axes[off + 1].toFixed(2).padStart(5)}`;
    });
    buttons.forEach(({ circle, value }, ndx) => {
        const button = gamepad.buttons[ndx];
        circle.setAttributeNS(null, 'r', button.value * fudgeFactor);
        circle.setAttributeNS(null, 'fill', button.pressed ? 'red' : 'gray');
        value.textContent = `${button.value.toFixed(2)}`;
    });

    // lines.push(`axes     : [${gamepad.axes.map((v, ndx) => `${ndx}: ${v.toFixed(2).padStart(5)}`).join(', ')} ]`);
    // lines.push(`buttons  : [${gamepad.buttons.map((v, ndx) => `${ndx}: ${onOff(v.pressed)} ${v.value.toFixed(2)}`).join(', ')} ]`);
    // elem.textContent = lines.join('\n');
}

function addNewPads() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i]
        if (gamepad) {
            addGamepadIfNew(gamepad);
        }
    }
}

function process() {
    runningElem.textContent = ((performance.now() * 0.001 * 60 | 0) % 100).toString().padStart(2, '0');
    addNewPads();  // some browsers add by polling, others by event

    Object.values(gamepadsByIndex).forEach(processController);
    requestAnimationFrame(process);
}

window.addEventListener("gamepadconnected", handleConnect);
window.addEventListener("gamepaddisconnected", handleDisconnect);
requestAnimationFrame(process);
