let scene, camera, renderer, controls, mesh, raycaster, mouse;
const container = document.getElementById('scene-container');
const tooltip = document.createElement('div'); // Tooltip element

// Theme configuration
const themes = {
    modern: {
        colors: {
            low: new THREE.Color(0x4CAF50),  // Green
            high: new THREE.Color(0xFF5722)   // Orange
        },
        material: { flatShading: true, vertexColors: true }
    },
    classic: {
        colors: {
            low: new THREE.Color(0x2196F3),  // Blue
            high: new THREE.Color(0xF44336)   // Red
        },
        material: { flatShading: false, vertexColors: true }
    },
    retro: {
        colors: {
            low: new THREE.Color(0xFFC107),  // Yellow
            high: new THREE.Color(0x9C27B0)   // Purple
        },
        material: { flatShading: true, vertexColors: true }
    },
    monochrome: {
        colors: {
            low: new THREE.Color(0x9E9E9E),  // Grey
            high: new THREE.Color(0x212121)   // Dark Grey
        },
        material: { flatShading: true, vertexColors: true }
    },
    ocean: {
        colors: {
            low: new THREE.Color(0x00BCD4),  // Cyan
            high: new THREE.Color(0x1976D2)   // Blue
        },
        material: { flatShading: false, vertexColors: true }
    }
};

function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Orbit controls for rotation
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Raycaster for tooltips
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    camera.position.z = 50;

    // Setup tooltip
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Fetch GitHub contribution data (simulated for demo)
async function fetchGitHubData() {
    const username = document.getElementById('github-username').value;
    if (!username) {
        alert('Please enter a GitHub username!');
        return;
    }

    try {
        // Simulated data: 52 weeks, 7 days, random contributions (0-10)
        const contributionData = Array(52).fill().map(() => 
            Array(7).fill().map(() => Math.floor(Math.random() * 10))
        );
        generateTopoMap(contributionData);
    } catch (error) {
        console.error('Error fetching data:', error);
        alert("Couldn't fetch data. Try again!");
    }
}

// Generate the 3D topographical map with enhancements
function generateTopoMap(data) {
    if (mesh) scene.remove(mesh); // Remove previous mesh

    const geometry = new THREE.PlaneGeometry(52, 7, 51, 6);
    const positions = geometry.attributes.position.array;
    const colors = new Float32Array(positions.length);

    const selectedTheme = document.getElementById('map-theme').value;
    const theme = themes[selectedTheme];

    // Adjust heights and colors based on contribution data
    for (let i = 0, j = 0; i < positions.length; i += 3, j++) {
        const x = Math.floor(j / 7);
        const y = j % 7;
        const value = data[x][y] || 0;
        positions[i + 2] = value;

        // Interpolate color based on theme
        const color = new THREE.Color().lerpColors(
            theme.colors.low,
            theme.colors.high,
            value / 10
        );
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial(theme.material);
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add lighting
    scene.add(new THREE.AmbientLight(0x404040));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    mesh.rotation.x = -Math.PI / 4;
}

function onMouseMove(event) {
    if (!mesh) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(mesh);

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const faceIndex = intersect.face.a;
        const value = mesh.geometry.attributes.position.array[faceIndex * 3 + 2];
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.style.display = 'block';
        tooltip.innerHTML = `Contributions: ${Math.round(value)}`;
    } else {
        tooltip.style.display = 'none';
    }
}

function exportMap() {
    renderer.render(scene, camera); // Ensure latest frame
    const link = document.createElement('a');
    link.download = 'GitTopo_map.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
}

// Initialize the scene when the window loads
window.onload = initScene;

// Add event listeners after all functions are defined
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});

window.addEventListener('mousemove', onMouseMove, false);

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
});

// Map theme change handler
document.getElementById('map-theme').addEventListener('change', () => {
    if (mesh) {
        const username = document.getElementById('github-username').value;
        if (username) {
            fetchGitHubData();
        }
    }
});

// Add export button
const exportButton = document.createElement('button');
exportButton.textContent = 'Export as PNG';
exportButton.onclick = exportMap;
document.querySelector('.controls').appendChild(exportButton);