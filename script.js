const searchForm = document.querySelector('.mainsearch-form');
const searchInput = document.querySelector('.mainsearch-input');
const invalidMessage = document.getElementById('invalid');
const trackingInfo = document.getElementById('tracking-info');

lucide.createIcons();

searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const query = searchInput.value.trim();

    if (query.toLowerCase() === 'invalid') {
        invalidMessage.style.display = 'flex';
        document.body.classList.remove('tracking-ui');
        clearTrackingData();

    } else if (query.toLowerCase() === 'lp') {
        loadTrackingData('lp');
    
    } else if (query) {
        invalidMessage.style.display = 'none';
        document.body.classList.add('tracking-ui');
        clearTrackingData();
    
    } else {
        invalidMessage.style.display = 'none';
        document.body.classList.remove('tracking-ui');
        clearTrackingData();
    }
});

async function loadTrackingData(query) {
    try {
        const response = await fetch('./lp_resp.json');
        if (!response.ok) {
            throw new Error('files gone');
        }
        const jsonData = await response.json();
        const data = jsonData.data;

        document.getElementById('courier-name').innerText = data.courier_code;
        document.getElementById('transit-time').innerText = `${data.transit_time} days elapsed`;

        const originDestSpan = document.getElementById('origin-dest');
        const originDestContainer = originDestSpan.parentElement;
        if (data.origin_country && data.destination_country) {
            originDestSpan.innerHTML = `${data.origin_country} &rarr; ${data.destination_country}`;
            originDestContainer.style.display = 'flex';
        } else {
            originDestSpan.innerHTML = '';
            originDestContainer.style.display = 'none';
        }

        const latestEventText = data.latest_event.split(',')[0];
        const eventDate = new Date(data.latest_checkpoint_time);
        const month = eventDate.getMonth() + 1;
        const day = eventDate.getDate();
        const formattedDate = `(${month}/${day})`;
        document.getElementById('latest-step-desc').innerText = `${formattedDate} - ${latestEventText}`;

        const statusLevels = {
            'pending': 1,
            'inforeceived': 1,
            'transit': 2,
            'pickup': 3,
            'delivered': 4
        };
        const currentStatus = data.delivery_status;
        const currentLevel = statusLevels[currentStatus] || 0;
        const steps = ['step-inforeceived', 'step-transit', 'step-pickup', 'step-delivered'];
        steps.forEach((stepId, index) => {
            const stepElement = document.getElementById(stepId);
            if (index + 1 <= currentLevel) {
                stepElement.classList.add('active');
            }
        });

        invalidMessage.style.display = 'none';
        document.body.classList.add('tracking-ui');
    } catch (error) {
        console.error('error getting tracking:', error);
        invalidMessage.style.display = 'flex';
        document.body.classList.remove('tracking-ui');
    }
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
}