const searchForm = document.querySelector('.mainsearch-form');
const searchInput = document.querySelector('.mainsearch-input');
const invalidMessage = document.getElementById('invalid');
const trackingInfo = document.getElementById('tracking-info');
const allList = document.getElementById('tracking-alllist');
const expandButton = document.getElementById('expand-button');
const callcourierButton = document.getElementById('callcourier-button');
const courierButton = document.getElementById('courier-button');

lucide.createIcons();

searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    clearTrackingData();
    invalidMessage.style.display = 'none';
    document.body.classList.remove('tracking-ui');

    if (query.toLowerCase() === 'invalid') {
        invalidMessage.style.display = 'flex';
    } else if (query.toLowerCase() === 'demo') {
        loadLocalData('./demo_response.json');
    } else if (query) {
        loadAPIData(query);
    }
});

expandButton.addEventListener('click', function() {
    allList.classList.toggle('expanded');
    expandButton.classList.toggle('expanded');
    if (allList.classList.contains('expanded')) {
        expandButton.innerHTML = `<span>Show less</span><i data-lucide="chevron-up"></i>`;
    } else {
        expandButton.innerHTML = `<span>Expand all</span><i data-lucide="chevron-down"></i>`;
    }
    lucide.createIcons();
});

async function loadLocalData(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`couldn't load demo file located at ${filename}`);
        }
        const jsonData = await response.json();
        updateUI(jsonData.data.accepted[0]);
    } catch (error) {
        handleError(error);
    }
}

async function loadAPIData(trackingNumber) {
    console.log('querying 17TRACK for', trackingNumber);
    try {
        const response = await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: trackingNumber })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error || `server error: ${response.status}`);
        }

        const jsonResponse = await response.json();

        if (jsonResponse.code !== 0) {
            throw new Error(`API error: ${jsonResponse.message}`);
        }
        if (jsonResponse.data.rejected.length > 0) {
            const rejection = jsonResponse.data.rejected[0];
            const errorCode = rejection.error.code;
            const errorMessage = rejection.error.message;

            if (errorCode === -18019908) {
                throw new Error("ran out of API credits. please use the 'demo' query to keep testing the tracking UI stuff...");
            }
            throw new Error(errorMessage);
        }
        if (jsonResponse.data.accepted.length === 0) {
            throw new Error("tracking number is invalid or data is not defined.");
        }
        updateUI(jsonResponse.data.accepted[0]);
    } catch (error) {
        handleError(error);
    }
}

function updateUI(data) {
    try {
        const trackInfo = data.track_info;
        let primaryProviderInfo = null;
        if (trackInfo.tracking && trackInfo.tracking.providers) {
            primaryProviderInfo = trackInfo.tracking.providers.find(p => p.events && p.events.length > 0) || trackInfo.tracking.providers[0];
        }

        const courierName = primaryProviderInfo ? primaryProviderInfo.provider.name : data.carrier;
        const transitDays = trackInfo.time_metrics?.days_of_transit;
        const originCountry = trackInfo.shipping_info?.shipper_address?.country;
        const destCountry = trackInfo.shipping_info?.recipient_address?.country;
        let latestEventText = null;
        let latestEventDateStr = null;
        if (trackInfo.latest_event) {
            latestEventText = trackInfo.latest_event.description;
            latestEventDateStr = trackInfo.latest_event.time_iso;
        }
        const currentStatusString = trackInfo.latest_status?.status;
        const trackInfoEvents = primaryProviderInfo?.events || [];
        const phoneNumber = primaryProviderInfo?.provider.tel;
        const weblink = primaryProviderInfo?.provider.homepage;

        document.getElementById('courier-name').innerText = courierName || 'Unknown';
        document.getElementById('transit-time').innerText = transitDays !== null ? `${transitDays} days elapsed` : 'calculating...';

        const originDestSpan = document.getElementById('origin-dest');
        const originDestContainer = originDestSpan.parentElement;
        if (originCountry && destCountry) {
            originDestSpan.innerHTML = `${originCountry} &rarr; ${destCountry}`;
            originDestContainer.style.display = 'flex';
        } else {
            originDestSpan.innerHTML = '';
            originDestContainer.style.display = 'none';
        }

        if (latestEventText && latestEventDateStr) {
            const eventDate = new Date(latestEventDateStr);
            const month = eventDate.getMonth()+1;
            const day = eventDate.getDate();
            const formattedDate = (`${month}/${day}`);
            document.getElementById('latest-step-desc').innerText = `(${formattedDate}) - ${latestEventText}`;
        } else {
            document.getElementById('latest-step-desc').innerText = "no status update was provided.. :("
        }

        const statusMap = { 'NotFound': 0, 'InfoReceived': 1, 'InTransit': 2, 'AvailableForPickup': 3, 'OutForDelivery': 3, 'Undelivered': 3, 'Delivered': 4, 'Expired': 0, 'Exception': 0 };
        const currentLevel = statusMap[currentStatusString] || 0;
        const steps = ['step-inforeceived', 'step-transit', 'step-pickup', 'step-delivered'];
        steps.forEach((stepId, index) => {
            const stepElement = document.getElementById(stepId);
            if (stepElement) {
                if (index + 1 <= currentLevel) {
                    stepElement.classList.add('active');
                } else {
                    stepElement.classList.remove('active');
                }
            }
        });

        if (trackInfoEvents && trackInfoEvents.length > 0) {
            let listHTML = '';
            const dateKey = 'time_iso';
            const detailKey = 'description';
            trackInfoEvents.forEach(item => {
                const itemDate = new Date(item[dateKey]);
                const dateStr = itemDate.toISOString().split('T')[0];
                const timeStr = itemDate.toTimeString().split(' ')[0].substring(0, 8);
                const formattedItemDate = `${dateStr} ${timeStr}`;
                let details = '';
                const detailText = item[detailKey] || '';

                if (item.location && item.location.toLowerCase() !== 'null' && item.location.trim() !== '') {
                    details = `${item.location} - ${detailText}`;
                } else {
                    details = detailText;
                }
                listHTML += `<li><span class="list-date">${formattedItemDate}</span><span class="list-details">${details}</span></li>`;
            });
            allList.innerHTML = listHTML;
            expandButton.style.display = (trackInfoEvents.length > 2) ? 'flex' : 'none';
        } else {
            allList.innerHTML = `<li>the API didn't return any detailled information...</li>`;
            expandButton.style.display = 'none';
        }

        if (phoneNumber) {
            const telLink = `tel:${phoneNumber.replace(/[\s(\)\-\+]/g, '')}`;
            callcourierButton.href = telLink;
            callcourierButton.style.display = 'flex';
        } else {
            callcourierButton.style.display = 'none';
        }
        if (weblink) {
            courierButton.href = weblink;
            courierButton.style.display = 'flex';
        } else {
            courierButton.style.display = 'none';
        }

        invalidMessage.style.display = 'none';
        document.body.classList.add('tracking-ui');
        lucide.createIcons();
    } catch (uiError) {
        handleError(new Error(`failed to display elements: ${uiError.message}`));
    }
}

function handleError(error) {
    console.error('an error occured:', error);
    invalidMessage.style.display = 'flex';
    invalidMessage.querySelector('p').innerText = error.message || 'something bad happened :(';
    document.body.classList.remove('tracking-ui');
}

function clearTrackingData() {
    document.getElementById('courier-name').innerText = '';
    document.getElementById('transit-time').innerText = '';
    const originDestSpan = document.getElementById('origin-dest');
    if (originDestSpan) {
        originDestSpan.innerHTML = '';
        if (originDestSpan.parentElement) {
            originDestSpan.parentElement.style.display = 'flex';
        }
    }

    document.getElementById('latest-step-desc').innerHTML = '';
    const steps = ['step-inforeceived', 'step-transit', 'step-pickup', 'step-delivered'];
    steps.forEach(stepId => {
        const stepElement = document.getElementById(stepId);
        if (stepElement) {
            stepElement.classList.remove('active');
        }
    });

    allList.innerHTML = '';
    allList.classList.remove('expanded');
    expandButton.classList.remove('expanded');
    expandButton.innerHTML = `<span>Expand all</span><i data-lucide="chevron-down"></i>`;
    expandButton.style.display = 'none';
    callcourierButton.href = "#";
    callcourierButton.style.display = 'none';
    courierButton.href = "#";
    courierButton.style.display = 'none';
    invalidMessage.querySelector('p').innerText = "parcel not found! tracking link may be invalid, or expired...";
    lucide.createIcons();
}