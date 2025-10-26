export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    let trackingNumber = '';
    try {
        trackingNumber = request.body.number; 
        if (!trackingNumber) {
            throw new Error('no tracking number provided!');
        }
    } catch (e) {
        return response.status(400).json({ error: 'your requests content was invalid.' });
    }

    const apiKey = process.env.TRACKING_API_KEY; 
    if (!apiKey) {
        console.error("no API key provided.");
        return response.status(500).json({ error: 'server go brrrr.' });
    }

    const endpoint = "https://api.17track.net/track/v2.4/gettrackinfo";

    try {
        const apiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                '17token': apiKey
            },
            body: JSON.stringify([
                { "number": trackingNumber }
            ])
        });

        if (!apiResponse.ok) {
            console.error(`API error: ${apiResponse.status}: ${apiResponse.statusText}`);
            return response.status(502).json({ error: 'failed to get tracking info.' });
        }

        const data = await apiResponse.json();
        return response.status(200).json(data); 

    } catch (error) {
        console.error("error requesting 17TRACK:", error);
        return response.status(500).json({ error: 'something bad happened.' });
    }
}