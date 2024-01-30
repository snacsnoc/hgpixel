(function (window, document) {
    // Configuration
    const TRACKING_ENDPOINT = "http://127.0.0.1:5000/track";
    const SESSION_COOKIE_NAME = "_hgpixel_session_id";
    const USER_COOKIE_NAME = "_hgpixel_user_id";
    let clientID = '';

    // Queue for storing events before the pixel is fully initialized
    let eventQueue = [];

    // Generate a UUID
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Get or set cookie
    function getOrSetCookie(name, value) {
        let cookieValue = document.cookie.split('; ').find(row => row.startsWith(name + '='));
        if (!cookieValue) {
            cookieValue = value;
            document.cookie = name + "=" + cookieValue + "; path=/; max-age=" + (2 * 365 * 24 * 60 * 60);
        } else {
            cookieValue = cookieValue.split('=')[1];
        }
        return cookieValue;
    }

    // Track event
    function trackEvent(eventType, eventData = {}) {
        const sessionId = getOrSetCookie(SESSION_COOKIE_NAME, generateUUID());
        const userId = getOrSetCookie(USER_COOKIE_NAME, generateUUID());
        const payload = {
            clientID,
            eventType,
            eventData,
            sessionId,
            userId,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent
            //firstBornBabyName
        };

        // Send data to server
        if (navigator.sendBeacon) {
            navigator.sendBeacon(TRACKING_ENDPOINT, JSON.stringify(payload));
        } else {
            // Fallback for older browsers
            const xhr = new XMLHttpRequest();
            xhr.open("POST", TRACKING_ENDPOINT, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(payload));
        }
    }

    // Track custom event
    function trackCustomEvent(eventArray) {
        if (eventArray[0] === 'customEvent' && eventArray.length > 1) {
            trackEvent(eventArray[0], eventArray[1]);
        }
        // Other event types goes here
        // TODO: allow clients to define any custom event name
    }
    // Function to track button clicks
    function trackButtonClicks() {
        // Listen for all click events on the document
        document.addEventListener('click', function(e) {
            // Check if the clicked element is a button or has a role of 'button', eg <form> buttons
            if (e.target.tagName === 'BUTTON' || e.target.getAttribute('role') === 'button') {
                trackEvent('button_click', {
                    buttonText: e.target.innerText || 'Unnamed Button',
                    buttonId: e.target.id || 'No ID'
                });
            }
        });
    }
    // Process the event queue
    function processEventQueue() {
        while (eventQueue.length > 0) {
            const event = eventQueue.shift();
            if (Array.isArray(event)) {
                trackCustomEvent(event);
            } else {
                trackEvent(event.eventType, event.eventData);
            }
        }
    }

    // Event Listeners
    // TODO: track more things
    function setupEventListeners() {
        trackEvent('pageview');

        // Track Clicks
        document.addEventListener('click', function (e) {
            trackEvent('click', {element: e.target.tagName});
        });

        // Track Form Submissions
        // TODO: Add client defined class/id tracking
        document.addEventListener('submit', function (e) {
            trackEvent('form_submit', {formId: e.target.id});
        });

        // Track Button Clicks
        trackButtonClicks();
    }

    // Initialization
    function init(clientId) {
        clientID = clientId;
        setupEventListeners();
        processEventQueue();
    }

    // Public API
    window.hgTracking = {
        initialize: init,
        trackEvent: function (eventType, eventData) {
            if (document.readyState === 'complete') {
                trackEvent(eventType, eventData);
            } else {
                eventQueue.push({eventType, eventData});
            }
        },
        push: function (eventArray) {
            if (document.readyState === 'complete') {
                trackCustomEvent(eventArray);
            } else {
                eventQueue.push(eventArray);
            }
        }
    };

    // Start the pixel and start ingesting delicious data
    init();

})(window, document);
