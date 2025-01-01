let currentAction = ''; // Default value for the brush is now empty
let currentValue = ''; // Default value for the brush is now empty
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
let hexagons = [];
const sideLength = 30; // Adjust size to fit more hexagons
const xSpacing = 52; // Calculated from side length
const ySpacing = 45; // Calculated from side length
let selectedHex = null; // To keep track of the selected hexagon
let gridVisible = true; // Initially, the grid is visible

// Preload images
const images = {
    grass: new Image(),
    sand: new Image(),
    dirt: new Image(),
    rough: new Image(),
    snow: new Image(),
    swamp: new Image(),
    water: new Image(),
    lava: new Image(),
    subterrarean: new Image(),
    lvl1: new Image(),
    castle: new Image(),
    necro: new Image(),
    tower: new Image(),
    stronghold: new Image(),
    dungeon: new Image(),
    fortress: new Image(),
    rampart: new Image(),
    inferno: new Image(),
    conflux: new Image(),
    cove: new Image(),
    goldMine: new Image(), // New images for mines
    oreMine: new Image(),
    lumberMill: new Image()
};

const imageSources = {
    grass: 'assets/grass.png',
    sand: 'assets/sand.png',
    dirt: 'assets/dirt.png',
    rough: 'assets/rough.png',
    snow: 'assets/snow.png',
    swamp: 'assets/swamp.png',
    water: 'assets/water.png',
    lava: 'assets/lava.png',
    subterrarean: 'assets/subterrarean.png',
    lvl1: 'assets/lvl-1.png',
    castle: 'assets/castle.png',
    necro: 'assets/necro.png',
    tower: 'assets/tower.png',
    stronghold: 'assets/stronghold.png',
    dungeon: 'assets/dungeon.png',
    fortress: 'assets/fortress.png',
    rampart: 'assets/rampart.png',
    inferno: 'assets/inferno.png',
    conflux: 'assets/conflux.png',
    cove: 'assets/cove.png'
};

function loadImages() {
    const loadPromises = Object.keys(imageSources).map(key => {
        return new Promise((resolve, reject) => {
            images[key].onload = resolve;
            images[key].onerror = () => reject(new Error(`Failed to load image at ${imageSources[key]}`));
            images[key].src = imageSources[key];
        });
    });

    return Promise.all(loadPromises); // This returns a promise that resolves when all images have loaded
}

window.onload = () => {
    loadImages().then(() => {
        loadHexagonsFromStorage(); // Load saved hexagons from localStorage
        resizeCanvas();
        drawHexagonalGrid();
    }).catch(error => {
        console.error("Error loading images:", error);
    });
};

window.onresize = resizeCanvas;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    if (!hexagons || hexagons.length === 0) {  // Only initialize if no hexagons loaded
        initializeHexagons();
    }

    drawHexagonalGrid();
}

function initializeHexagons() {
    hexagons = [];
    const numRows = Math.floor(canvas.height / ySpacing);
    const numHexPerRow = Math.floor(canvas.width / xSpacing);

    for (let row = 0; row < numRows; row++) {
        for (let col = 0; col < numHexPerRow; col++) {
            hexagons.push({
                x: col * xSpacing + ((row % 2) * xSpacing / 2),
                y: row * ySpacing,
                terrain: 'none',
                objects: 'none',
                level: '0'
            });
        }
    }
}

function drawHexagonalGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas first

    hexagons.forEach(hex => {
        if (gridVisible) { // Only draw the grid if it's set to be visible
            drawHexagon(hex.x, hex.y, hex);
        }
        // Always draw the terrain and objects regardless of the grid visibility
        if (hex.terrain !== 'none') {
            drawImageLayer(hex.terrain, hex.x, hex.y);
        }
        if (hex.objects !== 'none') {
            drawImageLayer(hex.objects, hex.x, hex.y);
        }
        if (hex.level !== '0') {
            drawImageLayer('lvl1', hex.x, hex.y); // Assumes that any level "not 0" should display the level 1 image
        }
    });
}

function drawHexagon(x, y, hex) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        points.push({
            x: x + sideLength * Math.cos(angle),
            y: y + sideLength * Math.sin(angle)
        });
    }

    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.closePath();
    ctx.strokeStyle = 'lightgray';
    ctx.stroke();

    if (hex.terrain !== 'none') {
        drawImageLayer(hex.terrain, x, y);
    }

    if (hex.objects !== 'none') {
        drawImageLayer(hex.objects, x, y);
    }

    if (hex.level !== '0') {
        drawImageLayer('lvl1', x, y);  // Assumes that any level "not 0" should display the level 1 image
    }
}

function drawImageLayer(type, x, y) {
    const img = images[type];
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        ctx.lineTo(x + sideLength * Math.cos(angle), y + sideLength * Math.sin(angle));
    }
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, x - sideLength, y - sideLength, sideLength * 2, sideLength * 2);
    ctx.restore();
}

canvas.addEventListener('click', handleCanvasClick);

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    const clickedHex = hexagons.find(hex => {
        const dx = offsetX - hex.x;
        const dy = offsetY - hex.y;
        return Math.sqrt(dx * dx + dy * dy) < sideLength;
    });

    if (clickedHex) {
        switch (currentAction) {
            case 'terrain':
                clickedHex.terrain = currentValue;
                break;
            case 'castles':
            case 'mines':
            case 'objects':
                if (clickedHex.terrain !== 'none') {
                    clickedHex.objects = currentValue;
                } else {
                    showError("Cannot place objects on an empty tile!");
                    return;
                }
                break;
            case 'level':
                if (clickedHex.terrain !== 'none' || clickedHex.objects !== 'none') {
                    clickedHex.level = currentValue;
                } else {
                    showError("Cannot assign a level to an empty tile!");
                    return;
                }
                break;
            case 'clear':
                // Clear the contents of the hexagon
                clickedHex.terrain = 'none';
                clickedHex.objects = 'none';
                clickedHex.level = '0';
                updateStatus("Hexagon cleared.");
                break;
            default:
                updateStatus("No action selected.");
                break;
        }
        drawHexagonalGrid();
        saveHexagonsToStorage(); // Save hexagon state
    } else {
        updateStatus("No hexagon selected.");
    }
}

function setAction(action, value) {
    currentAction = action;
    currentValue = value;
    updateStatus(`Action set to ${action}`);
}

function updateButtons() {
    const selectedType = document.getElementById('tileType').value;
    document.getElementById('terrainButtons').style.display = selectedType === 'terrain' ? 'flex' : 'none';
    document.getElementById('castlesButtons').style.display = selectedType === 'castles' ? 'flex' : 'none';
    document.getElementById('minesButtons').style.display = selectedType === 'mines' ? 'flex' : 'none';
    document.getElementById('levelButtons').style.display = selectedType === 'level' ? 'flex' : 'none';
}

function showError(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = 'status error';
    setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
    }, 2000);
}

function resetMap() {
    // Clear the hexagons array
    hexagons = [];
    initializeHexagons();  // Reinitialize the grid with empty hexagons
    drawHexagonalGrid();   // Redraw the grid to reflect the reset state
    localStorage.removeItem('hexagons'); // Remove the saved state from local storage
    console.log("Map has been reset.");
    updateStatus("Map has been reset and cleared.");
}


function saveHexagonsToStorage() {
    localStorage.setItem('hexagons', JSON.stringify(hexagons));
}

function loadHexagonsFromStorage() {
    const savedHexagons = localStorage.getItem('hexagons');
    if (savedHexagons) {
        hexagons = JSON.parse(savedHexagons);
    }
}

function clearSelectedHex() {
    if (selectedHex) {
        selectedHex.terrain = 'none';
        selectedHex.objects = 'none';
        selectedHex.level = '0';
        drawHexagonalGrid();
        saveHexagonsToStorage();
        updateStatus("Selected hexagon cleared.");
    } else {
        updateStatus("No hexagon selected to clear.");
    }
}

function updateStatus(message) {
    const status = document.getElementById('status'); // Ensure there's an element with id "status" in your HTML
    status.textContent = message;
    status.className = 'status';
    setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
    }, 5000);  // Clears the message after 5 seconds
}

function toggleGridVisibility() {
    gridVisible = !gridVisible; // Toggle the visibility state
    drawHexagonalGrid(); // Redraw the grid with the new visibility state
    updateStatus(gridVisible ? "Grid is visible." : "Grid is hidden."); // Provide feedback on grid state
}

