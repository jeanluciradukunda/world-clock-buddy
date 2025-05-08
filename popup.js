// World Clock Buddy Extension
document.addEventListener('DOMContentLoaded', function() {
  // City/timezone database - Popular cities with their timezones
  const cityDatabase = [
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { name: 'Chicago', timezone: 'America/Chicago' },
    { name: 'Toronto', timezone: 'America/Toronto' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Berlin', timezone: 'Europe/Berlin' },
    { name: 'Paris', timezone: 'Europe/Paris' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
    { name: 'Singapore', timezone: 'Asia/Singapore' },
    { name: 'Mumbai', timezone: 'Asia/Kolkata' },
    { name: 'Rio de Janeiro', timezone: 'America/Sao_Paulo' },
    { name: 'Moscow', timezone: 'Europe/Moscow' },
    { name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { name: 'Amsterdam', timezone: 'Europe/Amsterdam' },
    { name: 'Istanbul', timezone: 'Europe/Istanbul' },
    { name: 'Bangkok', timezone: 'Asia/Bangkok' },
    { name: 'Cairo', timezone: 'Africa/Cairo' },
    { name: 'Auckland', timezone: 'Pacific/Auckland' },
    { name: 'Honolulu', timezone: 'Pacific/Honolulu' },
    { name: 'Delhi', timezone: 'Asia/Kolkata' },
    { name: 'Cape Town', timezone: 'Africa/Johannesburg' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'Warsaw', timezone: 'Europe/Warsaw' }
  ];

  const initialLocationsToLoad = [
    'London', 'Cape Town'
  ];
  
  let hiddenTimezones = [];
  
  let customLocations = [];
  const searchToggle = document.getElementById('search-toggle');
  const settingsToggle = document.getElementById('settings-toggle');
  const searchPanel = document.getElementById('search-panel');
  const citySearch = document.getElementById('city-search');
  const searchResults = document.getElementById('search-results');
  const customLocationsContainer = document.getElementById('custom-locations');
  const addLocationPrompt = document.getElementById('add-location-prompt');

  addLocationPrompt.addEventListener('click', () => {
    searchPanel.classList.add('active');
    citySearch.focus();
  });
  
  function hideOldPlaceholders() {
    const oldPlaceholders = ['london-clock', 'capetown-clock'];
    oldPlaceholders.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
      }
    });
  }
  
  function setupInitialState() {
    chrome.storage.sync.get(['hasInitialized'], function(result) {
      if (!result.hasInitialized) {
        customLocations = [];
        
        initialLocationsToLoad.forEach(locationName => {
          const locationEntry = cityDatabase.find(city => city.name === locationName);
          if (locationEntry) {
            customLocations.push({
              name: locationEntry.name,
              timezone: locationEntry.timezone
            });
          }
        });
        
        saveCustomLocations();
        
        renderCustomLocations();
        
        updateClocks();
        
        chrome.storage.sync.set({ hasInitialized: true });
      }
    });
  }
  
  function loadSavedSettings() {
    chrome.storage.sync.get(['customLocations', 'hiddenTimezones', 'hasInitialized'], function(result) {
      hideOldPlaceholders();
      
      if (result.customLocations && result.customLocations.length > 0) {
        customLocations = result.customLocations;
        renderCustomLocations();
      }
      
      if (result.hiddenTimezones) {
        hiddenTimezones = result.hiddenTimezones;
        applyHiddenTimezones();
      }
      
      if (!result.hasInitialized) {
        setupInitialState();
      }
      
      updateClocks();
    });
  }
  
  function applyHiddenTimezones() {
    hiddenTimezones.forEach(id => {
      const timezone = document.getElementById(`${id}-clock`);
      if (timezone) {
        timezone.style.display = 'none';
      }
    });
  }
  
  function saveCustomLocations() {
    chrome.storage.sync.set({ customLocations: customLocations });
  }
  
  function saveHiddenTimezones() {
    chrome.storage.sync.set({ hiddenTimezones: hiddenTimezones });
  }
  
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
  
  function renderCustomLocations() {
    customLocationsContainer.innerHTML = '';
    
    customLocations.forEach((location, index) => {
      const locationId = `custom-${index}`;
      const locationElement = document.createElement('div');
      locationElement.className = 'clock-widget';
      locationElement.id = `${locationId}-clock`;
      locationElement.innerHTML = `
        <button class="remove-btn" data-id="${locationId}">
          <img src="assets/delete-icon.png" alt="Remove">
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
    const locationId = `custom-${index}`;

    customLocations.splice(index, 1);

    hiddenTimezones = hiddenTimezones.filter(id => id !== locationId);

    saveCustomLocations();
    saveHiddenTimezones();

    renderCustomLocations();
    updateClocks();
  }

  // Toggle search panel visibility
  searchToggle.addEventListener('click', () => {
    searchPanel.classList.toggle('active');
    if (searchPanel.classList.contains('active')) {
      citySearch.focus();
    }
  });

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

  function updateClocks() {
    updateTimeForTimezone('local', luxon.Settings.defaultZone);
    updateTimeForTimezone('utc', 'UTC');

    customLocations.forEach((location, index) => {
      const elementId = `custom-${index}`;

      if (location.timezone) {
        updateTimeForTimezone(elementId, location.timezone);
      }
    });
  }

  function updateTimeForTimezone(locationId, timezone) {
    try {
      const now = luxon.DateTime.now().setZone(timezone);

      const tzElement = document.getElementById(`${locationId}-timezone`);
      if (tzElement) {
        tzElement.textContent = now.offsetNameShort;
      }

      const timeElement = document.getElementById(`${locationId}-time`);
      if (timeElement) {
        timeElement.textContent = now.toLocaleString(luxon.DateTime.TIME_SIMPLE);
      }

      updateHourBlocksWithLuxon(locationId, now.hour, timezone);
    } catch (e) {
      console.error(`Error updating time for ${locationId}:`, e);
    }
  }

  function updateHourBlocksWithLuxon(locationId, currentHour, timezone) {
    const hoursContainer = document.getElementById(`${locationId}-hours`);
    if (!hoursContainer) return;

    hoursContainer.innerHTML = '';

    const startHour = currentHour - 2;

    for (let i = 0; i < 5; i++) {
      const hour = (startHour + i + 24) % 24;

      const hourTime = luxon.DateTime.now().setZone(timezone).set({ hour: hour, minute: 0, second: 0, millisecond: 0 });

      const hourBlock = document.createElement('div');
      hourBlock.className = 'hour-block';
      hourBlock.textContent = hourTime.toLocaleString({ hour: 'numeric', hour12: true });

      hourBlock.dataset.locationId = locationId;
      hourBlock.dataset.hour = hour;
      hourBlock.dataset.timezone = timezone;
      hourBlock.dataset.timestamp = hourTime.toMillis().toString();

      hourBlock.dataset.iso8601 = formatTimeToISO8601(hourTime, timezone, locationId);

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

      // Add click event for copying ISO 8601 time
      hourBlock.addEventListener('click', (event) => {
        const isoTime = hourBlock.dataset.iso8601;
        copyToClipboard(isoTime, hourBlock);

        // Add visual feedback for the click
        hourBlock.classList.add('clicked');
        setTimeout(() => {
          hourBlock.classList.remove('clicked');
        }, 300);
      });

      hoursContainer.appendChild(hourBlock);
    }
  }

  // Highlight corresponding hours with Luxon
  function highlightCorrespondingHoursWithLuxon(sourceTime) {
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

  function clearHourHighlights() {
    const allHourBlocks = document.querySelectorAll('.hour-block');
    allHourBlocks.forEach(block => {
      block.classList.remove('time-highlight');
    });
  }

  function formatTimeToISO8601(dateTime, timezone, locationId) {
    // Format ISO 8601 time with hours, minutes, seconds (no milliseconds)
    // Format should be like: 2025-05-06T09:00:00Z or 2025-05-06T11:00:00+02:00

    // Special case for UTC/GMT to use Z suffix instead of +00:00
    if (timezone === 'UTC' || locationId === 'utc') {
      return dateTime.toFormat('yyyy-MM-dd\'T\'HH:mm:ss') + 'Z';
    } else {
      return dateTime.toFormat('yyyy-MM-dd\'T\'HH:mm:ssZZ');
    }
  }

  // Copy the ISO time to clipboard and show visual feedback
  function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
      const copyIcon = document.createElement('img');
      copyIcon.src = 'assets/copy.png';
      copyIcon.alt = 'Copied';
      copyIcon.className = 'copy-indicator';

      // Position the copy icon in the center of the element
      element.style.position = 'relative';
      element.appendChild(copyIcon);
  
      // Animate the copy icon
      setTimeout(() => {
        copyIcon.classList.add('fade-out');
        setTimeout(() => {
          element.removeChild(copyIcon);
        }, 800); // Remove after fade animation completes
      }, 500); // Start fade after showing for 500ms
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }
  
  // Add restore button to settings
  settingsToggle.addEventListener('click', () => {
    if (hiddenTimezones.length > 0) {
      const confirmed = confirm('Restore all hidden timezones?');
      if (confirmed) {
        const timezonesToRestore = [...hiddenTimezones];

        hiddenTimezones = [];

        saveHiddenTimezones();

        timezonesToRestore.forEach(id => {
          const timezone = document.getElementById(`${id}-clock`);
          if (timezone) {
            timezone.style.display = 'block';
          }
        });
      }
    } else {
      alert('No hidden timezones to restore');
    }
  });
  
  // Initialize the extension
  function init() {
    hideOldPlaceholders();

    setupRemoveButtons();

    loadSavedSettings();

    updateClocks();

    setInterval(updateClocks, 60000);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        updateClocks();
      }
    });
  }

  // Start the extension
  init();
}); 