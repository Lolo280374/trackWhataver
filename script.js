const searchForm = document.querySelector('.mainsearch-form');
const searchInput = document.querySelector('.mainsearch-input');
const invalidMessage = document.getElementById('invalid');
const trackingInfo = document.getElementById('tracking-info');
const allList = document.getElementById('tracking-alllist');
const expandButton = document.getElementById('expand-button');
const learnmoreButton = document.getElementById('learnmore-button');
const courierButton = document.getElementById('courier-button');

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
        document.body.classList.remove('tracking-ui');
        clearTrackingData();
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

async function loadTrackingData(query) {
    try {
        const response = await fetch('./mdrl_resp.json');
        if (!response.ok) {
            throw new Error('no file');
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
        const month = eventDate.getMonth()+1;
        const day = eventDate.getDate();
        const formattedDate = (`${month}/${day}`);
        document.getElementById('latest-step-desc').innerText = `${formattedDate} - ${latestEventText}`;

        const statusLevel = { 'pending': 1, 'inforeceived': 1, 'transit': 2, 'pickup': 3, 'delivered': 4 };
        const currentStatus = data.delivery_status;
        const currentLevel = statusLevel[currentStatus] || 0;
        const steps = ['step-inforeceived', 'step-transit', 'step-pickup', 'step-delivered'];
        steps.forEach((stepId, index) => {
            const stepElement = document.getElementById(stepId);
            if (index+1 <= currentLevel) {
                stepElement.classList.add('active');
            }
        });

        if (data.origin_info && data.origin_info.trackinfo) {
            const trackInfo = data.origin_info.trackinfo;
            let listHTML = '';
            trackInfo.forEach(item => {
                const itemDate = new Date(item.checkpoint_date);
                const dateStr = itemDate.toISOString().split('T')[0];
                const timeStr = itemDate.toTimeString().split(' ')[0].substring(0, 8);
                const formattedItemDate = `${dateStr} ${timeStr}`;
                let details = '';
                if (item.location && item.location.toLowerCase() !== 'null') {
                    details = `${item.location} - ${item.tracking_detail}`;
                } else {
                    details = item.tracking_detail;
                }

                listHTML += `<li><span class="list-date">${formattedItemDate}</span><span class="list-details">${details}</span></li>`;
            });

            allList.innerHTML = listHTML;
            if (trackInfo.length > 2) {
                expandButton.style.display = 'flex';
            } else {
                expandButton.style.display = 'none';
            }
        }

        if (data.origin_info) {
            if (data.origin_info.tracking_link) {
                learnmoreButton.href = data.origin_info.tracking_link;
                learnmoreButton.style.display = 'flex';
            } else {
                learnmoreButton.style.display = 'none';
            }

            if (data.origin_info.weblink) {
                courierButton.href = data.origin_info.weblink;
                courierButton.style.display = 'flex';
            } else {
                courierButton.style.display = 'none';
            }
        } else {
            learnmoreButton.style.display = 'none';
            courierButton.style.display = 'none';
        }

        invalidMessage.style.display = 'none';
        document.body.classList.add('tracking-ui');
    } catch (error) {
        console.error('error loading tracking data:', error);
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

    allList.innerHTML = '';
    allList.classList.remove('expanded');
    expandButton.classList.remove('expanded');
    expandButton.querySelector('span').innerText = 'Expand all';
    expandButton.style.display = 'none';
    learnmoreButton.href = "#";
    learnmoreButton.style.display = 'none';
    courierButton.href = "#";
    courierButton.style.display = 'none';
    lucide.createIcons();
}