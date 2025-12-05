// Application State
let trips = [];
let currentTrip = null;
let currentCity = null;
let draggedCity = null;
let editingActivity = null;

// DOM Elements
const myTripsView = document.getElementById("myTripsView");
const tripDetailView = document.getElementById("tripDetailView");
const timelineView = document.getElementById("timelineView");
const tripsList = document.getElementById("tripsList");
const citiesCanvas = document.getElementById("citiesCanvas");
const backBtn = document.getElementById("backBtn");
const journeyLineBtn = document.getElementById("journeyLineBtn");
const pageTitle = document.getElementById("pageTitle");
const trashZone = document.getElementById("trashZone");

// Modals
const addTripModal = document.getElementById("addTripModal");
const addCityModal = document.getElementById("addCityModal");
const addActivityModal = document.getElementById("addActivityModal");

// API Base URL
const API_URL = window.location.origin + '/api';

// Log startup info
console.log('=== APP STARTUP ===');
console.log('Window origin:', window.location.origin);
console.log('API_URL:', API_URL);

// Initialize App
async function init() {
  console.log('Initializing app');
  
  // Test API connection
  try {
    const testResponse = await fetch(`${API_URL}/test`);
    const testData = await testResponse.json();
    console.log('✓ API test successful:', testData);
  } catch (err) {
    console.error('✗ API test failed:', err);
  }
  
  await loadTrips();
  console.log('Setting up event listeners');
  setupEventListeners();
}

// API Functions
async function loadTrips() {
  try {
    console.log('Loading trips from API');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/trips`, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log('API response status:', response.status);
    if (response.ok) {
      trips = await response.json();
      console.log('Trips loaded:', trips);
      console.log('First trip:', trips[0]);
      if (trips.length > 0) {
        console.log('First trip ID:', trips[0].id);
      }
    } else {
      console.error('Failed to load trips:', response.status);
      trips = [];
    }
  } catch (err) {
    console.error('Failed to load trips:', err.message);
    // Fallback to empty array
    trips = [];
  }
  renderTrips();
}

async function saveTrip(tripData) {
  try {
    console.log('Saving trip:', tripData);
    console.log('API_URL:', API_URL);
    const response = await fetch(`${API_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripData)
    });
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    if (response.ok) {
      const newTrip = await response.json();
      console.log('Trip saved successfully:', newTrip);
      trips.push(newTrip);
      return newTrip;
    } else {
      const errorText = await response.text();
      console.error('API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
  } catch (err) {
    console.error('Failed to save trip:', err);
    throw err;
  }
}

async function deleteTrip(tripId) {
  try {
    console.log('Deleting trip:', tripId);
    const response = await fetch(`${API_URL}/trips/${tripId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      console.log('Trip deleted successfully');
      trips = trips.filter(t => t.id !== tripId);
      renderTrips();
    } else {
      console.error('Failed to delete trip:', response.status);
    }
  } catch (err) {
    console.error('Failed to delete trip:', err);
  }
}

async function saveCity(cityData) {
  try {
    const response = await fetch(`${API_URL}/cities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cityData)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Failed to save city:', err);
  }
}

async function updateCityPosition(cityId, position) {
  try {
    const response = await fetch(`${API_URL}/cities/${cityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Failed to update city position:', err);
  }
}

async function deleteCity(cityId) {
  try {
    console.log('Deleting city:', cityId);
    const response = await fetch(`${API_URL}/cities/${cityId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      console.log('City deleted successfully');
      currentTrip.cities = currentTrip.cities.filter(c => c.id !== cityId);
      renderCities();
    } else {
      console.error('Failed to delete city:', response.status);
      console.log("response is ", response)
      alert('Failed to delete city');
    }
  } catch (err) {
    console.error('Failed to delete city:', err);
    alert('Error deleting city');
  }
}

async function saveActivity(activityData) {
  try {
    const response = await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Failed to save activity:', err);
  }
}

async function updateActivity(activityId, activityData) {
  try {
    const response = await fetch(`${API_URL}/activities/${activityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityData)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error('Failed to update activity:', err);
  }
}

async function deleteActivity(activityId) {
  try {
    console.log('Deleting activity with ID:', activityId);
    const response = await fetch(`${API_URL}/activities/${activityId}`, {
      method: 'DELETE'
    });
    console.log('Delete response status:', response.status);
    if (response.ok) {
      console.log('Activity deleted successfully');
      currentCity.activities = currentCity.activities.filter(a => a.id !== activityId);
      renderTimeline();
    } else {
      console.error('Failed to delete activity:', response.status);
      alert('Failed to delete activity');
    }
  } catch (err) {
    console.error('Failed to delete activity:', err);
    alert('Error deleting activity');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Back button
  backBtn.addEventListener("click", handleBack);

  // Journey Line logo - always returns to My trips
  journeyLineBtn.addEventListener("click", () => {
    currentTrip = null;
    currentCity = null;
    showView("myTrips");
  });

  // Modal close buttons
  document.getElementById("closeTripModal").addEventListener("click", () => {
    addTripModal.classList.remove("active");
  });

  document.getElementById("closeCityModal").addEventListener("click", () => {
    addCityModal.classList.remove("active");
  });

  document
    .getElementById("closeActivityModal")
    .addEventListener("click", () => {
      addActivityModal.classList.remove("active");
    });

  // Save trip button
  document
    .getElementById("saveTripBtn")
    .addEventListener("click", handleSaveTrip);

  // Save city button
  document
    .getElementById("saveCityBtn")
    .addEventListener("click", handleSaveCity);

  // Save activity button
  document
    .getElementById("saveActivityBtn")
    .addEventListener("click", handleSaveActivity);

  // Delete activity button
  document
    .getElementById("deleteActivityBtn")
    .addEventListener("click", handleDeleteActivity);

  // Add city button in trip modal
  document
    .getElementById("addCityBtn")
    .addEventListener("click", addCityEntryToModal);

  // Add new city button in city modal
  document
    .getElementById("addNewCityBtn")
    .addEventListener("click", addCityEntryToModal);

  // Add activity button
  document.getElementById("addActivityBtn").addEventListener("click", () => {
    editingActivity = null;
    openActivityModal();
  });

  // Close timeline button - removed, use back button instead
  // document.getElementById('closeTimelineBtn').addEventListener('click', () => {
  //     showView('tripDetail');
  // });

  // Transport button selection
  setupTransportButtons();

  // Activity type button selection
  setupActivityTypeButtons();
}

function setupTransportButtons() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("transport-btn")) {
      const container = e.target.parentElement;
      container.querySelectorAll(".transport-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });
      e.target.classList.add("selected");
    }
  });
}

function setupActivityTypeButtons() {
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("activity-type-btn")) {
      const container = e.target.parentElement;
      const isCurrentlySelected = e.target.classList.contains("selected");

      // Remove selected state from all buttons
      container.querySelectorAll(".activity-type-btn").forEach((btn) => {
        btn.classList.remove("selected");
        btn.style.backgroundColor = "";
      });

      // If the button wasn't selected, select it now
      // If it was selected, we've already deselected it above
      if (!isCurrentlySelected) {
        e.target.classList.add("selected");
        const color = e.target.dataset.color;
        e.target.style.backgroundColor = color;
      }
    }
  });
}

// View Management
function showView(view) {
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));

  if (view === "myTrips") {
    myTripsView.classList.add("active");
    backBtn.classList.add("hidden");
    pageTitle.textContent = "My trips";
  } else if (view === "tripDetail") {
    tripDetailView.classList.add("active");
    backBtn.classList.remove("hidden");
    pageTitle.textContent = currentTrip ? currentTrip.name : "Trip Name";
  } else if (view === "timeline") {
    timelineView.classList.add("active");
    backBtn.classList.remove("hidden");
    pageTitle.textContent = currentTrip ? currentTrip.name : "Trip Name";
  }
}

function handleBack() {
  if (timelineView.classList.contains("active")) {
    showView("tripDetail");
  } else if (tripDetailView.classList.contains("active")) {
    currentTrip = null;
    showView("myTrips");
  }
}

// Render Trips
function renderTrips() {
  tripsList.innerHTML = "";

  console.log('Rendering trips:', trips);

  // Render existing trips
  trips.forEach((trip) => {
    console.log('Rendering trip:', trip.id, trip.name);
    const card = document.createElement("div");
    card.className = "trip-card filled";
    card.draggable = true;
    // Store the trip ID on the card
    card.setAttribute('data-trip-id', trip.id);
    card.dataset.tripIndex = trip.id;
    card.innerHTML = `
            <img src="icons/yellow_folder_icon.svg" class="folder-icon" alt="Trip folder">
            <h2>${trip.name || "New Trip"}</h2>
        `;

    // Click to open trip
    card.addEventListener("click", (e) => {
      if (!card.classList.contains("dragging")) {
        openTrip(trip);
      }
    });

    // Drag events for deleting trips
    card.addEventListener("dragstart", handleTripDragStart);
    card.addEventListener("dragend", handleTripDragEnd);

    tripsList.appendChild(card);
  });

  // Add "Add trip" card
  const addCard = document.createElement("div");
  addCard.className = "trip-card add-trip";
  addCard.innerHTML = `
        <img src="icons/white_folder_icon.svg" class="folder-icon" alt="Add trip folder">
        <span class="add-text">Add trip +</span>
    `;
  addCard.addEventListener("click", openTripModal);
  tripsList.appendChild(addCard);
}

let draggedTripCard = null;

function handleTripDragStart(e) {
  draggedTripCard = e.target;
  e.target.classList.add("dragging");
  e.target.style.opacity = "0.5";
  trashZone.classList.add("active");
}

function handleTripDragEnd(e) {
  console.log('handleTripDragEnd called');
  e.target.classList.remove("dragging");
  e.target.style.opacity = "1";
  trashZone.classList.remove("active");

  // Check if dropped over trash
  const rect = trashZone.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;

  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    // Find the trip by looking at the card element
    const tripCard = e.target.closest('.trip-card');
    if (!tripCard) return;
    
    const tripIndex = Array.from(tripsList.querySelectorAll('.trip-card.filled')).indexOf(tripCard);
    console.log('Trip index:', tripIndex);
    
    if (tripIndex >= 0 && tripIndex < trips.length) {
      const trip = trips[tripIndex];
      console.log('Deleting trip:', trip);
      if (confirm("Are you sure you want to delete this trip?")) {
        deleteTrip(trip.id);
      }
    }
  }

  draggedTripCard = null;
}

// Track mouse over trash while dragging trips
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (draggedTripCard) {
    const rect = trashZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      draggedTripCard.style.opacity = "0.3";
    } else {
      draggedTripCard.style.opacity = "0.5";
    }
  }
});

// Trip Modal
function openTripModal() {
  addTripModal.classList.add("active");
  document.getElementById("tripName").value = "";
  const container = document.getElementById("citiesContainer");
  container.innerHTML = createCityEntry(false); // First city has no delete button
}

function createCityEntry(showDelete = false) {
  return `
        <div class="city-entry">
            ${
              showDelete
                ? '<button class="delete-city-btn" onclick="deleteCityEntry(this)"><img src="icons/garbage_icon.svg" alt="Delete"></button>'
                : ""
            }
            <h3>What city are you visiting?</h3>
            <input type="text" class="city-input input-field" placeholder="Enter city name">
            
            <h3>How will you get there?</h3>
            <div class="transport-options">
                <button class="transport-btn" data-transport="flight">Flight</button>
                <button class="transport-btn" data-transport="train">Train</button>
                <button class="transport-btn" data-transport="bus">Bus</button>
                <button class="transport-btn" data-transport="ride">Ride</button>
                <button class="transport-btn" data-transport="ferry">Ferry</button>
            </div>
            
            <h3>How long will you stay there?</h3>
            <div class="date-range">
                <input type="date" class="date-input start-date">
                <span class="date-separator">to</span>
                <input type="date" class="date-input end-date">
            </div>
        </div>
    `;
}

function deleteCityEntry(button) {
  const cityEntry = button.closest(".city-entry");
  const container = cityEntry.parentElement;

  // Only allow deletion if there's more than one city
  const cityCount = container.querySelectorAll(".city-entry").length;
  if (cityCount > 1) {
    cityEntry.remove();
  } else {
    alert("You must have at least one city in your trip!");
  }
}

function addCityEntryToModal() {
  const container = document.getElementById("citiesContainer");
  const entry = document.createElement("div");
  entry.innerHTML = createCityEntry(true); // Show delete button for new entries
  container.appendChild(entry.firstElementChild);
}

function handleSaveTrip() {
  console.log('handleSaveTrip called');
  const tripName = document.getElementById("tripName").value;
  const saveTripBtn = document.getElementById("saveTripBtn");
  
  // Disable button to prevent multiple clicks
  saveTripBtn.disabled = true;
  saveTripBtn.style.opacity = '0.5';
  
  const cityEntries = document.querySelectorAll("#citiesContainer .city-entry");

  const cities = [];
  cityEntries.forEach((entry, index) => {
    const cityName = entry.querySelector(".city-input").value;
    const transport =
      entry.querySelector(".transport-btn.selected")?.dataset.transport ||
      "flight";
    const startDate = entry.querySelector(".start-date").value;
    const endDate = entry.querySelector(".end-date").value;

    if (cityName && startDate && endDate) {
      cities.push({
        name: cityName,
        transport: transport,
        startDate: startDate,
        endDate: endDate,
        position: { x: 100 + index * 250, y: 300 + index * 50 }
      });
    }
  });

  console.log('Cities collected:', cities);
  if (cities.length > 0) {
    const tripData = {
      name: tripName || "New Trip",
      cities: cities
    };

    console.log('Calling saveTrip with:', tripData);
    saveTrip(tripData).then(() => {
      console.log('Trip saved, re-rendering');
      renderTrips();
      addTripModal.classList.remove("active");
      // Re-enable button
      saveTripBtn.disabled = false;
      saveTripBtn.style.opacity = '1';
      alert('Trip saved successfully!');
    }).catch(err => {
      console.error('Error saving trip:', err);
      alert('Error saving trip: ' + err.message);
      // Re-enable button on error
      saveTripBtn.disabled = false;
      saveTripBtn.style.opacity = '1';
    });
  } else {
    alert('Please add at least one city with dates');
    // Re-enable button
    saveTripBtn.disabled = false;
    saveTripBtn.style.opacity = '1';
  }
}

// Open Trip
function openTrip(trip) {
  currentTrip = trip;
  pageTitle.textContent = currentTrip.name;
  showView("tripDetail");
  renderCities();
}

// Render Cities
function renderCities() {
  citiesCanvas.innerHTML = "";

  if (!currentTrip || !currentTrip.cities) return;

  // Draw connections only if there are cities
  if (currentTrip.cities.length > 0) {
    for (let i = 0; i < currentTrip.cities.length - 1; i++) {
      drawConnection(currentTrip.cities[i], currentTrip.cities[i + 1]);
    }
  }

  // Render city tabs
  currentTrip.cities.forEach((city, index) => {
    const tab = document.createElement("div");
    tab.className = "city-tab";
    const x = city.posX || (100 + index * 250);
    const y = city.posY || (300 + index * 50);
    tab.style.left = x + "px";
    tab.style.top = y + "px";

    // Alternating tilt: even index = 5deg, odd index = -5deg
    const rotation = index % 2 === 0 ? 5 : -5;
    tab.style.transform = `rotate(${rotation}deg)`;
    tab.dataset.rotation = rotation;

    tab.draggable = true;
    tab.dataset.cityId = city.id;

    const dates = formatDateRange(city.startDate, city.endDate);

    tab.innerHTML = `
            <div class="city-pin-wrapper">
                <img src="icons/pin_icon.svg" alt="Pin" class="city-pin-icon">
            </div>
            <div class="city-name">${city.name}</div>
            <div class="city-dates">${dates}</div>
        `;

    // Add hover listeners to maintain rotation
    tab.addEventListener("mouseenter", function () {
      const rot = this.dataset.rotation;
      this.style.transform = `rotate(${rot}deg) translateY(-4px) scale(1.02)`;
    });

    tab.addEventListener("mouseleave", function () {
      if (!this.classList.contains("dragging")) {
        const rot = this.dataset.rotation;
        this.style.transform = `rotate(${rot}deg)`;
      }
    });

    tab.addEventListener("dragstart", handleDragStart);
    tab.addEventListener("dragend", handleDragEnd);
    tab.addEventListener("click", () => openTimeline(city));

    citiesCanvas.appendChild(tab);
  });

  // Always add "Add city" button - position based on whether cities exist
  const addBtn = document.createElement("div");
  addBtn.className = "add-city-tab";

  if (currentTrip.cities.length > 0) {
    const lastCity = currentTrip.cities[currentTrip.cities.length - 1];
    const lastX = lastCity.posX || (100 + (currentTrip.cities.length - 1) * 250);
    const lastY = lastCity.posY || (300 + (currentTrip.cities.length - 1) * 50);
    addBtn.style.left = lastX + 300 + "px";
    addBtn.style.top = lastY + "px";
  } else {
    // Position in center if no cities
    addBtn.style.left = "200px";
    addBtn.style.top = "250px";
  }

  addBtn.innerHTML =
    '<img src="icons/add_icon.svg" alt="Add city" class="add-city-icon">';
  addBtn.addEventListener("click", openAddCityModal);
  citiesCanvas.appendChild(addBtn);

  const label = document.createElement("span");
  label.className = "add-city-label";
  if (currentTrip.cities.length > 0) {
    const lastCity = currentTrip.cities[currentTrip.cities.length - 1];
    const lastX = lastCity.posX || (100 + (currentTrip.cities.length - 1) * 250);
    const lastY = lastCity.posY || (300 + (currentTrip.cities.length - 1) * 50);
    label.style.left = lastX + 380 + "px";
    label.style.top = lastY + 30 + "px";
  } else {
    label.style.left = "280px";
    label.style.top = "280px";
  }
  label.textContent = "Add city";
  citiesCanvas.appendChild(label);
}

function drawConnection(city1, city2) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("city-connection");

  const x1 = (city1.posX || 100) + 110;
  const y1 = (city1.posY || 300) + 50;
  const x2 = (city2.posX || 100) + 110;
  const y2 = (city2.posY || 300) + 50;

  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2) - 100;
  const width = Math.abs(x2 - x1) + 200;
  const height = Math.abs(y2 - y1) + 200;

  svg.style.left = minX - 100 + "px";
  svg.style.top = minY + "px";
  svg.style.width = width + "px";
  svg.style.height = height + "px";
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.classList.add("connection-line");

  const startX = x1 - minX + 100;
  const startY = y1 - minY;
  const endX = x2 - minX + 100;
  const endY = y2 - minY;

  // Create curved path using quadratic bezier
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 60;

  path.setAttribute(
    "d",
    `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`
  );
  path.setAttribute("stroke", "#817E7E");
  path.setAttribute("stroke-width", "3");
  path.setAttribute("stroke-dasharray", "8,8");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");

  svg.appendChild(path);
  citiesCanvas.appendChild(svg);

  // Calculate the point at t=0.5 on the quadratic bezier curve (exact midpoint)
  const t = 0.5;
  const midX =
    Math.pow(1 - t, 2) * startX +
    2 * (1 - t) * t * controlX +
    Math.pow(t, 2) * endX;
  const midY =
    Math.pow(1 - t, 2) * startY +
    2 * (1 - t) * t * controlY +
    Math.pow(t, 2) * endY;

  // Add transport icon at the exact midpoint of the curve
  const icon = document.createElement("div");
  icon.className = "transport-icon";
  // Convert from SVG coordinates to page coordinates
  const iconX = midX + minX - 100;
  const iconY = midY + minY;
  icon.style.left = iconX + "px";
  icon.style.top = iconY + "px";
  icon.innerHTML = getTransportIcon(city2.transport);
  citiesCanvas.appendChild(icon);
}

function getTransportIcon(transport) {
  const icons = {
    flight: '<img src="icons/plane.png" style="width: 60px; height: 60px;">',
    train: '<img src="icons/train.png" style="width: 60px; height: 60px;">',
    bus: '<img src="icons/bus.png" style="width: 60px; height: 60px;">',
    ride: '<img src="icons/car.png" style="width: 60px; height: 60px;">',
    ferry: '<img src="icons/ferry.png" style="width: 60px; height: 60px;">',
  };
  return icons[transport] || icons.flight;
}

function formatDateRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const endMonth = endDate.toLocaleString("default", { month: "short" });
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

// Drag and Drop
function handleDragStart(e) {
  draggedCity = e.target;
  e.target.classList.add("dragging");
  trashZone.classList.add("active");
}

function handleDragEnd(e) {
  console.log('handleDragEnd called for city');
  e.target.classList.remove("dragging");
  e.target.classList.remove("over-trash");
  trashZone.classList.remove("active");

  // Check if dropped over trash
  const rect = trashZone.getBoundingClientRect();
  const x = e.clientX;
  const y = e.clientY;

  console.log('Drop position:', x, y);
  console.log('Trash zone:', rect.left, rect.right, rect.top, rect.bottom);

  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    // Find the city by looking at the cities array
    const cityId = e.target.dataset.cityId;
    console.log('Deleting city with ID:', cityId);
    
    if (confirm("Are you sure you want to delete this city?")) {
      deleteCity(cityId).catch(err => console.error('Error:', err));
    }
  } else {
    // Update position
    const cityId = e.target.dataset.cityId;
    const city = currentTrip.cities.find((c) => c.id === cityId);
    if (city) {
      const canvas = citiesCanvas.getBoundingClientRect();
      const newX = e.clientX - canvas.left - 100;
      const newY = e.clientY - canvas.top - 40;
      console.log('Updating city position:', cityId, newX, newY);
      updateCityPosition(cityId, { x: newX, y: newY }).then(updatedCity => {
        city.posX = updatedCity.posX;
        city.posY = updatedCity.posY;
        renderCities();
      });
    }
  }

  draggedCity = null;
}

// Track mouse over trash while dragging
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (draggedCity) {
    const rect = trashZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      draggedCity.classList.add("over-trash");
    } else {
      draggedCity.classList.remove("over-trash");
    }
  }
});

// Add City Modal
function openAddCityModal() {
  addCityModal.classList.add("active");
  document.getElementById("newCityName").value = "";
  document.getElementById("newCityStartDate").value = "";
  document.getElementById("newCityEndDate").value = "";
  document
    .querySelectorAll("#cityTransportOptions .transport-btn")
    .forEach((btn) => {
      btn.classList.remove("selected");
    });
}

function handleSaveCity() {
  const cityName = document
    .querySelector("#cityTransportOptions")
    .closest(".modal-content")
    .querySelector("#newCityName").value;
  const transport =
    document.querySelector("#cityTransportOptions .transport-btn.selected")
      ?.dataset.transport || "flight";
  const startDate = document.getElementById("newCityStartDate").value;
  const endDate = document.getElementById("newCityEndDate").value;

  if (cityName && startDate && endDate) {
    let newPosition = { x: 100, y: 300 };

    if (currentTrip.cities && currentTrip.cities.length > 0) {
      const lastCity = currentTrip.cities[currentTrip.cities.length - 1];
      newPosition = {
        x: lastCity.posX + 300,
        y: lastCity.posY + 50,
      };
    }

    const cityData = {
      tripId: currentTrip.id,
      name: cityName,
      transport: transport,
      startDate: startDate,
      endDate: endDate,
      position: newPosition
    };

    saveCity(cityData).then(newCity => {
      currentTrip.cities.push(newCity);
      renderCities();
      addCityModal.classList.remove("active");
    });
  }
}

// Timeline
function openTimeline(city) {
  currentCity = city;
  document.getElementById("cityName").textContent = city.name;
  showView("timeline");
  renderTimeline();
}

function renderTimeline() {
  const container = document.getElementById("timelineDays");
  container.innerHTML = "";

  const startDate = new Date(currentCity.startDate);
  const endDate = new Date(currentCity.endDate);
  const days = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  days.forEach((day) => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "timeline-day";

    const label = document.createElement("div");
    label.className = "day-label";
    label.textContent = day.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const content = document.createElement("div");
    content.className = "day-content";

    // Add activities for this day
    const dayString = day.toISOString().split("T")[0];
    const dayActivities = currentCity.activities.filter(
      (a) => a.date === dayString
    );

    dayActivities.forEach((activity) => {
      const block = createActivityBlock(activity);
      content.appendChild(block);
    });

    dayDiv.appendChild(label);
    dayDiv.appendChild(content);
    container.appendChild(dayDiv);
  });
}

function createActivityBlock(activity) {
  const block = document.createElement("div");
  block.className = "activity-block";
  block.style.backgroundColor = activity.color;
  block.draggable = true;
  block.dataset.activityId = activity.id;

  const startHour = parseInt(activity.startTime.split(":")[0]);
  const startMinute = parseInt(activity.startTime.split(":")[1]);
  const endHour = parseInt(activity.endTime.split(":")[0]);
  const endMinute = parseInt(activity.endTime.split(":")[1]);

  const totalMinutes = 24 * 60;
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  const left = (startMinutes / totalMinutes) * 100;
  const width = ((endMinutes - startMinutes) / totalMinutes) * 100;

  block.style.left = left + "%";
  block.style.width = width + "%";
  block.textContent = `${activity.name} ${activity.startTime} - ${activity.endTime}`;

  // Drag events for deleting activities
  block.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    block.classList.add("dragging");
    trashZone.classList.add("active");
  });

  block.addEventListener("dragend", (e) => {
    block.classList.remove("dragging");
    trashZone.classList.remove("active");

    // Check if dropped on trash
    const trashRect = trashZone.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (
      x >= trashRect.left &&
      x <= trashRect.right &&
      y >= trashRect.top &&
      y <= trashRect.bottom
    ) {
      // Delete the activity
      const activityId = block.dataset.activityId;
      console.log('Deleting activity:', activityId);
      currentCity.activities = currentCity.activities.filter(
        (a) => a.id !== activityId
      );
      deleteActivity(activityId);
      renderTimeline();
    }
  });

  block.addEventListener("click", (e) => {
    // Only open modal if not dragging
    if (!block.classList.contains("dragging")) {
      editingActivity = activity;
      openActivityModal();
    }
  });

  return block;
}

// Activity Modal
function openActivityModal() {
  addActivityModal.classList.add("active");

  // Set min/max dates for the date picker
  const dateInput = document.getElementById("activityDate");
  dateInput.min = currentCity.startDate;
  dateInput.max = currentCity.endDate;

  if (editingActivity) {
    document.getElementById("activityName").value = editingActivity.name;
    document.getElementById("activityStartTime").value =
      editingActivity.startTime;
    document.getElementById("activityEndTime").value = editingActivity.endTime;
    document.getElementById("activityNotes").value =
      editingActivity.notes || "";
    document.getElementById("activityDate").value = editingActivity.date;

    document.querySelectorAll(".activity-type-btn").forEach((btn) => {
      btn.classList.remove("selected");
      if (btn.dataset.color === editingActivity.color) {
        btn.classList.add("selected");
        btn.style.backgroundColor = btn.dataset.color;
      }
    });
  } else {
    document.getElementById("activityName").value = "";
    document.getElementById("activityStartTime").value = "09:00";
    document.getElementById("activityEndTime").value = "17:00";
    document.getElementById("activityNotes").value = "";
    // Default to first day of the trip
    document.getElementById("activityDate").value = currentCity.startDate;

    document.querySelectorAll(".activity-type-btn").forEach((btn) => {
      btn.classList.remove("selected");
      btn.style.backgroundColor = "";
    });
  }
}

function handleSaveActivity() {
  const name = document.getElementById("activityName").value;
  const startTime = document.getElementById("activityStartTime").value;
  const endTime = document.getElementById("activityEndTime").value;
  const notes = document.getElementById("activityNotes").value;
  const selectedDate = document.getElementById("activityDate").value;
  const selectedType = document.querySelector(".activity-type-btn.selected");
  const color = selectedType ? selectedType.dataset.color : "#F4D03F";
  const type = selectedType ? selectedType.dataset.type : "other";

  if (name && startTime && endTime && selectedDate) {
    const dateString = selectedDate;

    if (editingActivity) {
      updateActivity(editingActivity.id, {
        name,
        startTime,
        endTime,
        notes,
        color,
        type
      }).then(updatedActivity => {
        Object.assign(editingActivity, updatedActivity);
        // Update the date if it changed
        editingActivity.date = dateString;
        renderTimeline();
        addActivityModal.classList.remove("active");
        editingActivity = null;
      });
    } else {
      const activityData = {
        cityId: currentCity.id,
        name,
        type,
        color,
        startTime,
        endTime,
        notes,
        date: dateString
      };

      saveActivity(activityData).then(newActivity => {
        if (!currentCity.activities) {
          currentCity.activities = [];
        }
        currentCity.activities.push(newActivity);
        renderTimeline();
        addActivityModal.classList.remove("active");
      });
    }
  } else {
    alert('Please fill in all fields');
  }
}

function handleDeleteActivity() {
  if (editingActivity) {
    deleteActivity(editingActivity.id);
    addActivityModal.classList.remove("active");
    editingActivity = null;
  }
}

// Initialize the app when DOM is ready
document.addEventListener("DOMContentLoaded", init);
