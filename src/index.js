//combo box


// --->
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('canvas');
let playSpaces = [document.querySelector(".play-space")];
let playSpaceCount = 1;
// Track the actual canvas bounds as they expand
let canvasBounds = {
    minX: -1000,  // Start with a generous default area
    maxX: 1000,
    minY: -1000,
    maxY: 1000,
    get width() { return this.maxX - this.minX; },
    get height() { return this.maxY - this.minY; }
};

// Canvas panning
let isPanning = false;
let startX, startY;
let offsetX = 0, offsetY = 0;

container.addEventListener('mousedown', (e) => {
    isPanning = true;
    container.style.cursor = 'grabbing';
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
});

container.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    offsetX = e.clientX - startX;
    offsetY = e.clientY - startY;
    canvas.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    // Expand the canvas boundaries when approaching edges
    const viewportWidth = container.clientWidth;
    const viewportHeight = container.clientHeight;

    // Get the current visible area
    const visibleMinX = -offsetX - viewportWidth/2;
    const visibleMaxX = -offsetX + viewportWidth/2;
    const visibleMinY = -offsetY - viewportHeight/2;
    const visibleMaxY = -offsetY + viewportHeight/2;

    // Expand canvas bounds if we're near the edge
    const edgeBuffer = 200; // Buffer distance from edge

    if (visibleMinX < canvasBounds.minX + edgeBuffer) {
        canvasBounds.minX = visibleMinX - edgeBuffer;
    }
    if (visibleMaxX > canvasBounds.maxX - edgeBuffer) {
        canvasBounds.maxX = visibleMaxX + edgeBuffer;
    }
    if (visibleMinY < canvasBounds.minY + edgeBuffer) {
        canvasBounds.minY = visibleMinY - edgeBuffer;
    }
    if (visibleMaxY > canvasBounds.maxY - edgeBuffer) {
        canvasBounds.maxY = visibleMaxY + edgeBuffer;
    }

    // Update canvas size to reflect the expanded bounds
    canvas.style.width = `${canvasBounds.width}px`;
    canvas.style.height = `${canvasBounds.height}px`;
});

container.addEventListener('mouseup', () => {
    isPanning = false;
    container.style.cursor = 'grab';
});

container.addEventListener('mouseleave', () => {
    isPanning = false;
    container.style.cursor = 'grab';
});

// Check for collision between two play spaces
function isColliding(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

// Get position rectangle for a play space at a given coordinate
function getRect(x, y, width, height) {
    return {
        left: x,
        top: y,
        right: x + width,
        bottom: y + height,
        width: width,
        height: height
    };
}

// Find a non-colliding position for a play space
function findNonCollidingPosition(playSpace) {
    const width = playSpace.offsetWidth;
    const height = playSpace.offsetHeight;
    const safetyMargin = 10;
    // Maximum attempts to find a non-colliding position
    const maxAttempts = 50;

    for (let i = 0; i < maxAttempts; i++) {
        // Generate random position within the expanded canvas bounds
        // Convert coordinates to be relative to canvas center
        const randomX = Math.random() * (canvasBounds.width - width - 2*safetyMargin) + canvasBounds.minX + safetyMargin - (window.innerWidth/2);
        const randomY = Math.random() * (canvasBounds.height - height - 2*safetyMargin) + canvasBounds.minY + safetyMargin - (window.innerHeight/2);

        // Convert to absolute position on canvas for collision detection
        const absX = randomX + window.innerWidth/2;
        const absY = randomY + window.innerHeight/2;

        // Create rectangle for this position
        const newRect = getRect(absX, absY, width, height);

        // Check collision with all other play spaces
        let hasCollision = false;

        for (const other of playSpaces) {
            if (other === playSpace) continue;

            // Calculate absolute position of the other play space
            const otherStyle = window.getComputedStyle(other);
            const otherLeft = parseFloat(otherStyle.left);
            const otherTop = parseFloat(otherStyle.top);
            const otherRect = getRect(otherLeft, otherTop, other.offsetWidth, other.offsetHeight);

            if (isColliding(newRect, otherRect)) {
                hasCollision = true;
                break;
            }
        }

        // If no collision, return this position
        if (!hasCollision) {
            return {
                x: randomX,
                y: randomY
            };
        }
    }

    // If no non-colliding position found after max attempts, find an empty area
    // by expanding the canvas further if needed
    const expansionAmount = Math.max(width, height) * 2;
    canvasBounds.maxX += expansionAmount;
    canvasBounds.maxY += expansionAmount;

    // Update canvas size
    canvas.style.width = `${canvasBounds.width}px`;
    canvas.style.height = `${canvasBounds.height}px`;

    // Return a position in the newly expanded area
    return {
        x: canvasBounds.maxX - width - 100 - (window.innerWidth/2),
        y: canvasBounds.maxY - height - 100 - (window.innerHeight/2)
    };
}

// Position a single play space
function positionPlaySpace(playSpace) {
    const position = findNonCollidingPosition(playSpace);
    playSpace.style.left = `calc(50% + ${position.x}px)`;
    playSpace.style.top = `calc(50% + ${position.y}px)`;
}

// Randomize positions of all play spaces
function randomizeAllPositions() {
    for (const playSpace of playSpaces) {
        positionPlaySpace(playSpace);
    }
}

// Add a new play space
function addPlaySpace() {
    playSpaceCount++;
    const newPlaySpace = document.createElement('div');
    newPlaySpace.className = 'play-space';
    newPlaySpace.setAttribute('data-id', playSpaceCount);

    // Assign a random color to make it easier to distinguish
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const a = 0.5; // semi-transparent
    newPlaySpace.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${a})`;

    const text = document.createElement('p');
    text.textContent = `Play Space ${playSpaceCount}`;
    newPlaySpace.appendChild(text);

    canvas.appendChild(newPlaySpace);
    playSpaces.push(newPlaySpace);

    positionPlaySpace(newPlaySpace);
    randomizeAllPositions();
}

// Clear all play spaces
function clearPlaySpaces() {
    for (const ps of playSpaces) {
        ps.remove();
    }
    playSpaces = [];
    playSpaceCount = 0;
}

// Add features to explore the infinite canvas
function jumpToRandomLocation() {
    // Generate a random point somewhere on the expanded canvas
    const randomX = Math.random() * canvasBounds.width + canvasBounds.minX - (window.innerWidth/2);
    const randomY = Math.random() * canvasBounds.height + canvasBounds.minY - (window.innerHeight/2);

    // Update the offset to center on this point
    offsetX = -randomX;
    offsetY = -randomY;

    // Update canvas transform
    canvas.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

// Initialize
positionPlaySpace(playSpaces[0]);

// Initialize canvas size
canvas.style.width = `${canvasBounds.width}px`;
canvas.style.height = `${canvasBounds.height}px`;