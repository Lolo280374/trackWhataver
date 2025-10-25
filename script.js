const search = document.querySelector('.mainsearch-form');
const searchInput = document.querySelector('.mainsearch-input');
const invalidMessage = document.getElementById('invalid');
const trackingInfo = document.getElementById('tracking-info')

lucide.createIcons();

search.addEventListener('submit', function(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query.toLowerCase() === 'invalid') {
        invalidMessage.style.display = 'flex';
        document.body.classList.remove('tracking-ui')
    } else if (query) {
        invalidMessage.style.display = 'none';
        document.body.classList.add('tracking-ui');
    } else {
        invalidMessage.style.display = 'none';
        document.body.classList.remove('tracking-ui');
    }
});