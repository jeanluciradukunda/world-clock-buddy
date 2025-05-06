// World Clock Buddy Extension
document.addEventListener('DOMContentLoaded', function() {
  // City/timezone database - Popular cities with their timezones
  const cityDatabase = [
    { name: "New York", timezone: "America/New_York" },
    { name: "Los Angeles", timezone: "America/Los_Angeles" },
    { name: "Chicago", timezone: "America/Chicago" },
    { name: "Toronto", timezone: "America/Toronto" },
    { name: "Sydney", timezone: "Australia/Sydney" },
    { name: "Tokyo", timezone: "Asia/Tokyo" },
    { name: "Berlin", timezone: "Europe/Berlin" },
    { name: "Paris", timezone: "Europe/Paris" },
    { name: "Dubai", timezone: "Asia/Dubai" },
    { name: "Singapore", timezone: "Asia/Singapore" },
    { name: "Mumbai", timezone: "Asia/Kolkata" },
    { name: "Rio de Janeiro", timezone: "America/Sao_Paulo" },
    { name: "Moscow", timezone: "Europe/Moscow" },
    { name: "Hong Kong", timezone: "Asia/Hong_Kong" },
    { name: "Amsterdam", timezone: "Europe/Amsterdam" },
    { name: "Istanbul", timezone: "Europe/Istanbul" },
    { name: "Bangkok", timezone: "Asia/Bangkok" },
    { name: "Cairo", timezone: "Africa/Cairo" },
    { name: "Auckland", timezone: "Pacific/Auckland" },
    { name: "Honolulu", timezone: "Pacific/Honolulu" },
    { name: "Delhi", timezone: "Asia/Kolkata" },
    { name: "Cape Town", timezone: "Africa/Johannesburg" },
    { name: "London", timezone: "Europe/London" }
  ];

  // Default locations
  const defaultLocations = [
    { id: 'local', name: 'Your Time', timezone: luxon.Settings.defaultZone },
    { id: 'utc', name: 'UTC', timezone: 'UTC' }
  ];
  
  // Initial locations to load if no saved state exists
  const initialLocationsToLoad = [
    "London", "Cape Town"
  ];
  
  // Store for timezone visibility state
  let hiddenTimezones = [];
  
  // Store for custom locations
  let customLocations = [];
  
  // UI Elements
  const searchToggle = document.getElementById('search-toggle');
  const settingsToggle = document.getElementById('settings-toggle');
  const searchPanel = document.getElementById('search-panel');
  const citySearch = document.getElementById('city-search');
  const searchResults = document.getElementById('search-results');
  const customLocationsContainer = document.getElementById('custom-locations');
  const addLocationPrompt = document.getElementById('add-location-prompt');
  
  // Add location prompt click event
  addLocationPrompt.addEventListener('click', () => {
    searchPanel.classList.add('active');
    citySearch.focus();
  });
  
  // Hide any old placeholder elements that might still be in the DOM
  function hideOldPlaceholders() {
    const oldPlaceholders = ['london-clock', 'capetown-clock'];
    oldPlaceholders.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }
  
  // Setup initial state - called only once on first run
  function setupInitialState() {
    chrome.storage.sync.get(['hasInitialized'], function(result) {
      if (!result.hasInitialized) {
        // Clear any existing custom locations to start fresh
        customLocations = [];
        
        // Add initial locations from our predefined list
        initialLocationsToLoad.forEach(locationName => {
          const locationEntry = cityDatabase.find(city => city.name === locationName);
          if (locationEntry) {
            customLocations.push({
              name: locationEntry.name,
              timezone: locationEntry.timezone
            });
          }
        });
        
        // Save the locations
        saveCustomLocations();
        
        // Render the locations
        renderCustomLocations();
        
        // Update clocks to show the new locations immediately
        updateClocks();
        
        // Mark as initialized
        chrome.storage.sync.set({ hasInitialized: true });
      }
    });
  }
  
  // Load saved custom locations and hidden timezones
  function loadSavedSettings() {
    chrome.storage.sync.get(['customLocations', 'hiddenTimezones', 'hasInitialized'], function(result) {
      // Hide any old placeholder elements
      hideOldPlaceholders();
      
      if (result.customLocations && result.customLocations.length > 0) {
        customLocations = result.customLocations;
        renderCustomLocations();
      }
      
      if (result.hiddenTimezones) {
        hiddenTimezones = result.hiddenTimezones;
        applyHiddenTimezones();
      }
      
      // If it's a first run, set up initial locations
      if (!result.hasInitialized) {
        setupInitialState();
      }
      
      // Make sure clocks are updated after loading settings
      updateClocks();
    });
  }
  
  // Apply hidden timezones
  function applyHiddenTimezones() {
    hiddenTimezones.forEach(id => {
      const timezone = document.getElementById(`${id}-clock`);
      if (timezone) {
        timezone.style.display = 'none';
      }
    });
  }
  
  // Save custom locations
  function saveCustomLocations() {
    chrome.storage.sync.set({ customLocations: customLocations });
  }
  
  // Save hidden timezones
  function saveHiddenTimezones() {
    chrome.storage.sync.set({ hiddenTimezones: hiddenTimezones });
  }
  
  // Toggle timezone visibility
  function toggleTimezoneVisibility(id, hide) {
    const timezone = document.getElementById(`${id}-clock`);
    if (!timezone) return;
    
    if (hide) {
      timezone.style.display = 'none';
      if (!hiddenTimezones.includes(id)) {
        hiddenTimezones.push(id);
      }
    } else {
      timezone.style.display = 'block';
      hiddenTimezones = hiddenTimezones.filter(item => item !== id);
    }
    
    saveHiddenTimezones();
  }
  
  // Setup remove buttons
  function setupRemoveButtons() {
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(button => {
      if (!button.hasEventListeners) {
        button.hasEventListeners = true;
        button.addEventListener('click', e => {
          const id = e.currentTarget.dataset.id;
          
          if (id) {
            // Check if it's a default timezone (local or utc) or a custom one
            if (id === 'local' || id === 'utc') {
              // Just hide default timezones
              toggleTimezoneVisibility(id, true);
            } else if (id.startsWith('custom-')) {
              // For custom locations, extract the index and actually remove it
              const index = parseInt(id.replace('custom-', ''));
              if (!isNaN(index) && index >= 0 && index < customLocations.length) {
                removeCustomLocation(index);
              }
            }
          }
          
          e.stopPropagation();
        });
      }
    });
  }
  
  // Render custom locations
  function renderCustomLocations() {
    customLocationsContainer.innerHTML = '';
    
    customLocations.forEach((location, index) => {
      const locationId = `custom-${index}`;
      const locationElement = document.createElement('div');
      locationElement.className = 'clock-widget';
      locationElement.id = `${locationId}-clock`;
      locationElement.innerHTML = `
        <button class="remove-btn" data-id="${locationId}">
          <img src="assets/remove.png" alt="Remove">
        </button>
        <div class="clock-row">
          <div>
            <div class="location">${location.name}</div>
            <div class="timezone" id="${locationId}-timezone"></div>
          </div>
          <div class="time" id="${locationId}-time">--:-- am</div>
        </div>
        <div class="time-list" id="${locationId}-hours">
          <!-- Hours will be added by JavaScript -->
        </div>
      `;
      customLocationsContainer.appendChild(locationElement);
    });
    
    // Set up remove buttons for the newly added custom locations
    setupRemoveButtons();
  }
  
  // Add custom location
  function addCustomLocation(location) {
    // Don't add duplicates
    const isDuplicate = customLocations.some(
      existingLocation => existingLocation.name === location.name
    );
    
    if (!isDuplicate) {
      customLocations.push({
        name: location.name,
        timezone: location.timezone
      });
      saveCustomLocations();
      renderCustomLocations();
      updateClocks(); // Update to show the new location immediately
    }
  }
  
  // Remove custom location
  function removeCustomLocation(index) {
    // Get the location ID before removing it from the array
    const locationId = `custom-${index}`;
    
    // Remove from customLocations array
    customLocations.splice(index, 1);
    
    // Also remove from hiddenTimezones if it exists there
    hiddenTimezones = hiddenTimezones.filter(id => id !== locationId);
    
    // Save both to Chrome storage
    saveCustomLocations();
    saveHiddenTimezones();
    
    // Re-render the locations
    renderCustomLocations();
    
    // Update clocks to ensure all UI elements are in sync
    updateClocks();
  }
  
  // Toggle search panel visibility
  searchToggle.addEventListener('click', () => {
    searchPanel.classList.toggle('active');
    if (searchPanel.classList.contains('active')) {
      citySearch.focus();
    }
  });
  
  // Search functionality
  citySearch.addEventListener('input', () => {
    const searchTerm = citySearch.value.toLowerCase().trim();
    if (searchTerm.length < 2) {
      searchResults.innerHTML = '';
      return;
    }
    
    const filteredCities = cityDatabase.filter(city => 
      city.name.toLowerCase().includes(searchTerm)
    );
    
    renderSearchResults(filteredCities);
  });
  
  // Render search results
  function renderSearchResults(cities) {
    searchResults.innerHTML = '';
    
    if (cities.length === 0) {
      searchResults.innerHTML = '<div class="search-result">No cities found</div>';
      return;
    }
    
    cities.forEach(city => {
      const resultElement = document.createElement('div');
      resultElement.className = 'search-result';
      
      // Get timezone info using Luxon
      const cityTime = luxon.DateTime.now().setZone(city.timezone);
      const offsetDisplay = cityTime.offsetNameShort;
      
      resultElement.innerHTML = `
        <div class="result-location">${city.name}</div>
        <div class="result-timezone">${offsetDisplay}</div>
      `;
      
      resultElement.addEventListener('click', () => {
        addCustomLocation({
          name: city.name,
          timezone: city.timezone
        });
        searchPanel.classList.remove('active');
        citySearch.value = '';
        searchResults.innerHTML = '';
      });
      
      searchResults.appendChild(resultElement);
    });
  }
  
  // Format timezone offset
  function formatTimezoneOffset(offset) {
    // Use Luxon to format offset
    try {
      const dt = luxon.DateTime.now().setZone(`UTC${offset >= 0 ? '+' : ''}${offset}`);
      return dt.offsetNameShort;
    } catch (e) {
      // Fallback to simple formatting
      const prefix = offset >= 0 ? '+' : '';
      const absOffset = Math.abs(offset);
      const hours = Math.floor(absOffset);
      const minutes = Math.round((absOffset % 1) * 60);
      
      if (minutes === 0) {
        return `GMT${prefix}${hours}`;
      } else {
        return `GMT${prefix}${hours}:${minutes.toString().padStart(2, '0')}`;
      }
    }
  }
  
  // Function to update all clocks
  function updateClocks() {
    // Update default clocks
    updateTimeForTimezone('local', luxon.Settings.defaultZone);
    updateTimeForTimezone('utc', 'UTC');
    
    // Update custom locations
    customLocations.forEach((location, index) => {
      const elementId = `custom-${index}`;
      
      if (location.timezone) {
        updateTimeForTimezone(elementId, location.timezone);
      }
    });
  }
  
  // Update time display using Luxon
  function updateTimeForTimezone(locationId, timezone) {
    try {
      // Get current time in the timezone
      const now = luxon.DateTime.now().setZone(timezone);
      
      // Update timezone display
      const tzElement = document.getElementById(`${locationId}-timezone`);
      if (tzElement) {
        tzElement.textContent = now.offsetNameShort;
      }
      
      // Update time display
      const timeElement = document.getElementById(`${locationId}-time`);
      if (timeElement) {
        timeElement.textContent = now.toLocaleString(luxon.DateTime.TIME_SIMPLE);
      }
      
      // Update hour blocks
      updateHourBlocksWithLuxon(locationId, now.hour, timezone);
    } catch (e) {
      console.error(`Error updating time for ${locationId}:`, e);
    }
  }
  
  // Update hour blocks with Luxon
  function updateHourBlocksWithLuxon(locationId, currentHour, timezone) {
    const hoursContainer = document.getElementById(`${locationId}-hours`);
    if (!hoursContainer) return;
    
    hoursContainer.innerHTML = ''; // Clear existing hours
    
    // Create 5 hour blocks centered around the current hour
    const startHour = currentHour - 2;
    
    for (let i = 0; i < 5; i++) {
      const hour = (startHour + i + 24) % 24; // Ensure hour is between 0-23
      
      // Create DateTime object for this hour
      const hourTime = luxon.DateTime.now().setZone(timezone).set({ hour: hour, minute: 0, second: 0, millisecond: 0 });
      
      const hourBlock = document.createElement('div');
      hourBlock.className = 'hour-block';
      hourBlock.textContent = hourTime.toLocaleString({ hour: 'numeric', hour12: true });
      
      // Store data for highlighting
      hourBlock.dataset.locationId = locationId;
      hourBlock.dataset.hour = hour;
      hourBlock.dataset.timezone = timezone;
      hourBlock.dataset.timestamp = hourTime.toMillis().toString();
      
      // Highlight the current hour
      if (hour === currentHour) {
        hourBlock.classList.add('current-hour');
      }
      
      // Add hover effects
      hourBlock.addEventListener('mouseenter', () => {
        highlightCorrespondingHoursWithLuxon(hourTime);
      });
      
      hourBlock.addEventListener('mouseleave', () => {
        clearHourHighlights();
      });
      
      hoursContainer.appendChild(hourBlock);
    }
  }
  
  // Highlight corresponding hours with Luxon
  function highlightCorrespondingHoursWithLuxon(sourceTime) {
    // Get all hour blocks
    const allHourBlocks = document.querySelectorAll('.hour-block');
    const sourceTimestamp = sourceTime.toMillis();
    
    allHourBlocks.forEach(block => {
      try {
        const blockTimestamp = Number(block.dataset.timestamp);
        
        // If timestamps are within 5 minutes of each other, highlight
        if (Math.abs(blockTimestamp - sourceTimestamp) < 5 * 60 * 1000) {
          block.classList.add('time-highlight');
        }
      } catch (e) {
        console.error('Error highlighting time:', e);
      }
    });
  }
  
  // Get time in a specific timezone
  function getTimeInTimezone(date, timezone) {
    // Convert to Luxon DateTime
    const luxonDate = luxon.DateTime.fromJSDate(date);
    try {
      // Convert to the target timezone
      return luxonDate.setZone(timezone).toMillis();
    } catch (e) {
      console.error('Error converting timezone with Luxon:', e);
      return date.getTime();
    }
  }
  
  // Function to update time display for a specific timezone
  function updateTimeDisplay(locationId, utcDate, hoursOffset) {
    // Clone the UTC date and add the offset
    const localDate = new Date(utcDate);
    
    // Set hours correctly according to the offset
    // First get current UTC hours and minutes
    const utcHours = utcDate.getUTCHours();
    const utcMinutes = utcDate.getUTCMinutes();
    
    // Calculate local hours with the offset
    let localHours = Math.floor(utcHours + hoursOffset);
    let localMinutes = utcMinutes;
    
    // Handle fractional offsets (like for India which is UTC+5:30)
    if (hoursOffset % 1 !== 0) {
      const fractionalPart = hoursOffset % 1;
      const additionalMinutes = fractionalPart * 60;
      localMinutes += Math.round(additionalMinutes);
      
      // Adjust hours if minutes overflow
      if (localMinutes >= 60) {
        localHours += Math.floor(localMinutes / 60);
        localMinutes = localMinutes % 60;
      }
    }
    
    // Ensure hours are within 0-23 range
    localHours = Math.floor((localHours + 24) % 24);
    
    // Format time (12-hour format with am/pm)
    const ampm = localHours >= 12 ? 'pm' : 'am';
    const hours12 = localHours % 12 || 12; // Convert to 12-hour format
    
    // Update the time display
    const timeElement = document.getElementById(`${locationId}-time`);
    if (timeElement) {
      timeElement.textContent = `${hours12}:${Math.floor(localMinutes).toString().padStart(2, '0')} ${ampm}`;
    
      // Update the hour blocks
      updateHourBlocks(locationId, localHours);
    }
  }
  
  // Convert a local hour to its UTC equivalent
  function getUTCHourFromLocalHour(localHour, offset) {
    // Calculate what this hour is in UTC
    // For fractional offsets, we'll round to nearest hour for highlighting purposes
    let utcHour = (localHour - offset + 24) % 24;
    // Ensure the result is a valid hour (0-23)
    if (utcHour < 0) utcHour += 24;
    if (utcHour >= 24) utcHour -= 24;
    return Math.round(utcHour);
  }
  
  // Convert a UTC hour to a local hour based on timezone offset
  function getLocalHourFromUTCHour(utcHour, offset) {
    let localHour = (utcHour + offset) % 24;
    // Ensure the result is a valid hour (0-23)
    if (localHour < 0) localHour += 24;
    if (localHour >= 24) localHour -= 24;
    return Math.round(localHour);
  }
  
  // Highlight hours that correspond to the same UTC time
  function highlightCorrespondingHours(utcHour) {
    // Get all hour blocks
    const allHourBlocks = document.querySelectorAll('.hour-block');
    
    allHourBlocks.forEach(block => {
      const locationId = block.dataset.locationId;
      const localHour = parseInt(block.dataset.hour);
      
      // Make sure this location's offset is registered, fallback to 0 if not
      const offset = timezoneOffsets[locationId] || 0;
      
      // Calculate the UTC hour this local hour corresponds to
      const blockUtcHour = getUTCHourFromLocalHour(localHour, offset);
      
      // Highlight if it matches the target UTC hour (accounting for rounding errors and edge cases)
      if (Math.abs(blockUtcHour - utcHour) < 0.5 || 
          Math.abs(blockUtcHour - utcHour) > 23.5) { // Handle midnight boundary case
        block.classList.add('time-highlight');
      }
    });
  }
  
  // Clear all hour highlights
  function clearHourHighlights() {
    const allHourBlocks = document.querySelectorAll('.hour-block');
    allHourBlocks.forEach(block => {
      block.classList.remove('time-highlight');
    });
  }
  
  // Add restore button to settings
  settingsToggle.addEventListener('click', () => {
    // Show all hidden timezones
    if (hiddenTimezones.length > 0) {
      const confirmed = confirm("Restore all hidden timezones?");
      if (confirmed) {
        // Create a copy of hiddenTimezones before modifying it
        const timezonesToRestore = [...hiddenTimezones];
        
        // Clear the array first to avoid issues with filtering during iteration
        hiddenTimezones = [];
        
        // Save the empty array
        saveHiddenTimezones();
        
        // Now restore each timezone
        timezonesToRestore.forEach(id => {
          const timezone = document.getElementById(`${id}-clock`);
          if (timezone) {
            timezone.style.display = 'block';
          }
        });
      }
    } else {
      alert("No hidden timezones to restore");
    }
  });
  
  // Initialize the extension
  function init() {
    // Hide any old placeholder elements
    hideOldPlaceholders();
    
    // Set up remove buttons
    setupRemoveButtons();
    
    // Load saved settings
    loadSavedSettings();
    
    // Initial update immediately
    updateClocks();
    
    // Update every minute
    setInterval(updateClocks, 60000);
    
    // Also update whenever the popup becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateClocks();
      }
    });
  }
  
  // Start the extension
  init();
}); 