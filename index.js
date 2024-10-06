// Set up canvas and its context for drawing 2D shapes
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player class handles player movement, drawing, and rotation
class Player {
    constructor({ position, velocity }) {
        this.position = position; // Player's position (x, y)
        this.velocity = velocity; // Player's velocity (movement speed in x, y)
        this.rotation = 0; // Rotation angle for player, starts at 0
    }
    draw() {
        ctx.save(); // Save the current drawing state

        // For rotating the player ship based on its rotation angle
        ctx.translate(this.position.x, this.position.y); // Move to player's position
        ctx.rotate(this.rotation); // Rotate by the player's rotation value
        ctx.translate(-this.position.x, -this.position.y); // Reset back to original position

        // Draw the triangular player ship
        ctx.beginPath();
        ctx.moveTo(this.position.x + 30, this.position.y);
        ctx.lineTo(this.position.x - 10, this.position.y - 10);
        ctx.lineTo(this.position.x - 10, this.position.y + 10);
        ctx.closePath();

        ctx.strokeStyle = 'white'; // Set stroke color to white
        ctx.stroke(); // Outline the triangle
        ctx.restore(); // Restore the drawing state (pre-rotation)
    }
    
    update() {
        this.draw(); // Redraw player each frame
        this.position.x += this.velocity.x; // Update player's position in x based on velocity
        this.position.y += this.velocity.y; // Update player's position in y based on velocity
    }
    
    // Get the vertices (points) of the triangle to check for collisions
    getVertices(){
        const cos = Math.cos(this.rotation); // Calculate cosine of the rotation angle
        const sin = Math.sin(this.rotation); // Calculate sine of the rotation angle
        return [
            // Each object represents a vertex (corner point) of the triangle
            {
                x: this.position.x + cos * 30 - sin * 0,
                y: this.position.y + sin * 30 + cos * 0,
            },
            {
                x: this.position.x + cos * -10 - sin * 10,
                y: this.position.y + sin * -10 + cos * 10,
            },
            {
                x: this.position.x + cos * -10 - sin * -10,
                y: this.position.y + sin * -10 + cos * -10,
            },
        ]
    }
}

// Projectile class for bullets shot by the player
class Projectile {
    constructor({ position, velocity }) {
        this.position = position; // Position of the projectile
        this.velocity = velocity; // Velocity of the projectile
        this.radius = 5; // Size of the projectile (a small circle)
    }
    draw() {
        // Draw a small circle (bullet)
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fillStyle = 'white'; // Fill it white
        ctx.fill();
    }
    update() {
        this.draw(); // Redraw the projectile every frame
        this.position.x += this.velocity.x; // Update its x position based on velocity
        this.position.y += this.velocity.y; // Update its y position based on velocity
    }
}

// Asteroid class to create and move asteroids
class Asteroids {
    constructor({ position, velocity, radius }) {
        this.position = position; // Position of the asteroid
        this.velocity = velocity; // Velocity of the asteroid
        this.radius = radius; // Radius (size) of the asteroid
    }
    draw() {
        // Draw an asteroid (a large circle)
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.strokeStyle = 'white'; // Outline the asteroid in white
        ctx.stroke();
    }
    update() {
        this.draw(); // Redraw the asteroid each frame
        this.position.x += this.velocity.x; // Update its x position based on velocity
        this.position.y += this.velocity.y; // Update its y position based on velocity
    }
}

// Initialize the player in the center of the screen
const player = new Player({
    position: { x: canvas.width / 2, y: canvas.height / 2 },
    velocity: { x: 0, y: 0 } // Start with no movement
});

// Key press state to track player input
const keys = {
    w: { pressed: false }, // Moving forward
    a: { pressed: false }, // Rotating left
    d: { pressed: false }  // Rotating right
};

const SPEED = 3; // Speed at which the player moves
const FRICTION = 0.96; // Friction applied to slow down when not moving
const projectiles = []; // Array to store projectiles
const asteroids = []; // Array to store asteroids

// Generate asteroids every 3 seconds from a random direction
const intervalId = window.setInterval(() => {
    const index = Math.floor(Math.random() * 4); // Randomize asteroid spawn position
    let x, y;
    let vx, vy;
    let radius = 50 * Math.random() + 10; // Randomize the size of the asteroid
    
    // Asteroids spawn at one of four edges of the screen
    switch(index) {
        case 0: // Left edge
            x = 0 - radius;
            y = Math.random() * canvas.height;
            vx = 1;
            vy = 0;
            break;
        case 1: // Bottom edge
            x = Math.random() * canvas.width;
            y = canvas.height + radius;
            vx = 0;
            vy = -1;
            break;
        case 2: // Right edge
            x = canvas.width + radius;
            y = Math.random() * canvas.height;
            vx = -1;
            vy = 0;
            break;
        case 3: // Top edge
            x = Math.random() * canvas.width;
            y = 0 - radius;
            vx = 0;
            vy = 1;
            break;
    }

    // Create a new asteroid and add it to the asteroids array
    asteroids.push(
        new Asteroids({
            position: { x: x, y: y },
            velocity: { x: vx, y: vy },
            radius,
        })
    );
}, 3000); // Every 3 seconds

// Function to check for collision between two circles
function circleClolosion(circle1, circle2) {
    const xDiff = circle2.position.x - circle1.position.x;
    const yDiff = circle2.position.y - circle1.position.y;
    const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff); // Calculate the distance between two circles
    return distance <= circle1.radius + circle2.radius; // Return true if the circles are touching
}

// Function to check for collision between a circle (asteroid) and triangle (player)
function circleTriangleCollision(circle, triangle) {
    for (let i = 0; i < 3; i++) {
        let start = triangle[i];
        let end = triangle[(i + 1) % 3];

        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let length = Math.sqrt(dx * dx + dy * dy);

        let dot = ((circle.position.x - start.x) * dx + (circle.position.y - start.y) * dy) / Math.pow(length, 2);
        let closestX = start.x + dot * dx;
        let closestY = start.y + dot * dy;

        if (!isPointOnLineSegment(closestX, closestY, start, end)) {
            closestX = closestX < start.x ? start.x : end.x;
            closestY = closestY < start.y ? start.y : end.y;
        }

        dx = closestX - circle.position.x;
        dy = closestY - circle.position.y;

        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= circle.radius) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Function to check if a point lies on a line segment
function isPointOnLineSegment(x, y, start, end) {
    return (
        x >= Math.min(start.x, end.x) &&
        x <= Math.max(start.x, end.x) &&
        y >= Math.min(start.y, end.y) &&
        y <= Math.max(start.y, end.y)
    );
}

// Main game loop
function animate() {
    const animationId = window.requestAnimationFrame(animate); // Request next animation frame
    ctx.fillStyle = 'black'; // Clear the canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.update(); // Update the player's position and draw the player

    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.update();

        // Remove projectiles that go off-screen
        if (projectile.position.x + projectile.radius < 0 || projectile.position.x - projectile.radius > canvas.width ||
            projectile.position.y - projectile.radius > canvas.height || projectile.position.y + projectile.radius < 0) {
            projectiles.splice(i, 1);
        }
    }

    // Update asteroids and check for collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.update();

        // Check if the asteroid collides with the player
        if (circleTriangleCollision(asteroid, player.getVertices())) {
            window.cancelAnimationFrame(animationId); // Stop the game loop
            clearInterval(intervalId); // Stop asteroid generation
            alert("Game Over!"); // Show alert when the game ends
        }

        // Remove asteroids that go off-screen
        if (asteroid.position.x + asteroid.radius < 0 || asteroid.position.x - asteroid.radius > canvas.width ||
            asteroid.position.y - asteroid.radius > canvas.height || asteroid.position.y + asteroid.radius < 0) {
            asteroids.splice(i, 1);
        }

        // Check for collisions between projectiles and asteroids
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const projectile = projectiles[j];
            if (circleClolosion(asteroid, projectile)) {
                projectiles.splice(j, 1); // Remove the projectile
                asteroids.splice(i, 1); // Remove the asteroid
            }
        }
    }

    // Handle player movement and rotation
    if (keys.w.pressed) {
        player.velocity.x = Math.cos(player.rotation) * SPEED; // Move player forward in the direction it's facing
        player.velocity.y = Math.sin(player.rotation) * SPEED;
    } else {
        player.velocity.x *= FRICTION; // Slow down when no key is pressed
        player.velocity.y *= FRICTION;
    }
    if (keys.d.pressed) player.rotation += 0.06; // Rotate right
    else if (keys.a.pressed) player.rotation -= 0.06; // Rotate left
}
animate(); // Start the game loop

// Handle key down events (for movement and shooting)
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = true;
            break;

        case 'KeyA':
            keys.a.pressed = true;
            break;

        case 'KeyD':
            keys.d.pressed = true;
            break;

        case 'Space': // Fire a projectile when space is pressed
            projectiles.push(new Projectile({
                position: {
                    x: player.position.x + Math.cos(player.rotation) * 30, // Starting position in front of player
                    y: player.position.y + Math.sin(player.rotation) * 30,
                },
                velocity: {
                    x: Math.cos(player.rotation) * 5, // Projectiles move in the player's rotation direction
                    y: Math.sin(player.rotation) * 5
                }
            }));
            break;
    }
});

// Handle key up events (stopping movement)
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
            keys.w.pressed = false;
            break;

        case 'KeyA':
            keys.a.pressed = false;
            break;

        case 'KeyD':
            keys.d.pressed = false;
            break;
    }
});
